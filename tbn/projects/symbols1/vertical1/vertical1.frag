precision mediump float;

uniform vec3 iResolution;
uniform float iTime;


// Credit: IQ
float sdBox(in vec2 p, in vec2 l)
{
  vec2 d = abs(p) - l;
  return length(max(d, vec2(0.0))) + min(max(d.x,d.y), 0.0);
}

// Box from upper left with l = diameter
float sdBoxUL(in vec2 p, in vec2 l)
{
  return sdBox(p + 0.5 * vec2(-l.x, l.y), 0.5 * l);
}

// Map distance to { 0, 1 }
float sdConv(in float v)
{
  return abs(sign(v) - 1.0) * 0.5;
}

// ind = [x-from, x-to, y-from, y-to] including upper bound
float filledSegment(in vec2 p, in vec4 ind)
{
  const vec2 thickInd = vec2(1.0, 1.0);
  const float w = 1.0;
  const float ww = 2.0;
  const float sp = 1.0;
  float xoffs = ind.x * (w + sp) + (ind.x > thickInd.x ? (ww - w) : 0.0);
  float yoffs = ind.z * (w + sp) + (ind.z > thickInd.y ? (ww - w) : 0.0);
  float lx = max(0.0, thickInd.x - ind.x) * w;
  lx += (thickInd.x - ind.x >= 0.0 && ind.y - thickInd.x >= 0.0) ? ww : 0.0;
  lx += min(ind.y - ind.x + 1.0, max(0.0, ind.y - thickInd.x)) * w;
  lx += (ind.y - ind.x) * sp;
  float ly = max(0.0, thickInd.y - ind.z) * w;
  ly += (thickInd.y - ind.z >= 0.0 && ind.w - thickInd.y >= 0.0) ? ww : 0.0;
  ly += min(ind.w - ind.z + 1.0, max(0.0, ind.w - thickInd.y)) * w;
  ly += (ind.w - ind.z) * sp;
  return sdBoxUL(p - vec2(xoffs, -yoffs), vec2(lx, ly));
}

float filledSegment2(in vec2 p, in vec4 ind)
{
  float tx = (sign(ind.x - 1.5) + 1.0) * 0.5; // 0 if ind.x <= 1, 1 otherwise
  float ty = (sign(ind.z - 1.5) + 1.0) * 0.5; // 1 if ind.z <= 1, 1 otherwise
  float xoffs = ind.x * 2.0 + tx;
  float yoffs = ind.z * 2.0 + ty;
  float lx = 1.0 + (ind.y - ind.x) * 2.0;
  float ly = 1.0 + (ind.w - ind.z) * 2.0;
  float addx = sign(tx + (1.0 - sign(ind.y - 0.5)) * 0.5) - 1.0;
  float addy = sign(ty + (1.0 - sign(ind.w - 0.5)) * 0.5) - 1.0;
  return sdBoxUL(p - vec2(xoffs, -yoffs), vec2(lx - addx, ly - addy));
}

// ind = [x-from, x-to, y-from, y-to] including upper bound
float emptySegment(in vec2 p, in vec4 ind)
{
  float v = filledSegment(p, vec4(ind.x, ind.x, ind.z, ind.w));
  v = min(v, filledSegment(p, vec4(ind.y, ind.y, ind.z, ind.w)));
  v = min(v, filledSegment(p, vec4(ind.x, ind.y, ind.z, ind.z)));
  v = min(v, filledSegment(p, vec4(ind.x, ind.y, ind.w, ind.w)));
  return v;
}

// ----------------------------------------------------------------------------

float symbol_01(in vec2 p)
{
  float v = emptySegment(p, vec4(0.0, 1.0, 0.0, 1.0));
  v = min(v, filledSegment(p, vec4(1.0, 1.0, 1.0, 3.0)));
  return v;
}

float symbol_02(in vec2 p)
{
  float v = filledSegment(p, vec4(0.0, 3.0, 1.0, 1.0));
  v = min(v, filledSegment(p, vec4(3.0, 3.0, 0.0, 1.0)));
  v = min(v, filledSegment(p, vec4(0.0, 0.0, 0.0, 1.0)));
  v = min(v, emptySegment(p, vec4(1.0, 2.0, 2.0, 3.0)));
  return v;
}

float symbol_03(in vec2 p)
{
  float v = filledSegment(p, vec4(1.0, 1.0, 0.0, 3.0));
  v = min(v, emptySegment(p, vec4(2.0, 3.0, 0.0, 1.0)));
  return v;
}

float symbol_04(in vec2 p)
{
  float v = filledSegment(p, vec4(0.0, 3.0, 1.0, 1.0));
  v = min(v, emptySegment(p, vec4(2.0, 3.0, 2.0, 3.0)));
  v = min(v, filledSegment(p, vec4(1.0, 1.0, 0.0, 1.0)));
  return v;
}

float symbol_05(in vec2 p)
{
  float v = filledSegment(p, vec4(2.0, 2.0, 0.0, 1.0));
  v = min(v, filledSegment(p, vec4(3.0, 3.0, 0.0, 3.0)));
  v = min(v, emptySegment(p, vec4(0.0, 1.0, 0.0, 1.0)));
  return v;
}

float symbol_06(in vec2 p)
{
  float v = emptySegment(p, vec4(1.0, 3.0, 0.0, 2.0));
  v = min(v, filledSegment(p, vec4(0.0, 0.0, 0.0, 3.0)));
  return v;
}

float symbol(in vec2 p, float t)
{
  //if(t == 0.0) { return filledSegment(p, vec4(0.0, 0.0, 0.0, 0.0)); }
  if(t == 1.0) { return symbol_01(p); }
  if(t == 2.0) { return symbol_02(p); }
  if(t == 3.0) { return symbol_03(p); }
  if(t == 4.0) { return symbol_04(p); }
  if(t == 5.0) { return symbol_05(p); }
  if(t == 6.0) { return symbol_06(p); }
  if(t == 7.0) { return filledSegment(p, vec4(0.0, 3.0, 0.0, 3.0)); }
  return 1.0;
}

float doubleSymbol(in vec2 p, float t1, float t2)
{
  float v = symbol(p, t1);
  v = min(v, symbol(p + vec2(0.0, 8.0), t2));
  return v;
}

// ---------------------------------------------------------------------------

float hash1(in float seed)
{
  float e = log(seed) * 10.0;
  return fract(sin(seed / e) * 43758.5453);
}

float verticalText(in vec2 fragCoord,
                   in vec2 pos,
                   in float scale,
                   in float speed, // px / sec
                   in float seed)
{
  const float height = 480.0;
  const float maxScreens = 3.0;
  const float maxNum = maxScreens * (height / 8.0); // upper bound scale = 1
  float symSize = 8.0 / scale;
  float screenNum = height / symSize;
  float num = floor(hash1(seed * 7.0) * 2.0 * screenNum) + screenNum;
  float totalDist = (num + screenNum) * symSize;
  seed += floor(iTime * speed / totalDist) * 1011.0;
  float blankStart = floor(hash1(seed * 31.0) * screenNum * 0.5);
  float blankEnd = floor(hash1(seed * 23.0) * screenNum * 0.5 + screenNum * 0.5);
  blankStart = 0.0;
  blankEnd = 0.0;
  float t = 1.0;
  float v = 1.0;
  vec2 timeOffs = vec2(0.0, mod(iTime * speed, totalDist));
  //vec2 timeOffs = vec2(0.0, floor(mod(iTime * speed, totalDist) / symSize) * symSize);
  for(float i = 0.0; i < maxNum; i++) {
    if(i >= num) {
      break;
    }
    vec2 p = pos - vec2(0.0, i * symSize) + timeOffs;
    // Don't draw symbols that are outside the view
    if(p.y < -240.0 - symSize || p.y >= 240.0) {
      continue;
    }
    if(i >= num - 1.0 || i == 0.0) {
      t = 7.0;
    } else if(i < blankStart || i + blankEnd > num) {
      t = 0.0;
    } else {
      t = floor(hash1((seed + i) * 1.211) * 7.0);
    }
    v = min(v, symbol((fragCoord + p) * scale, t));
  }
  return v;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
  // Transform coord system to be centered at 0 in the middel and half
  // resolution to each side
  vec2 p = fragCoord - iResolution.xy * 0.5;
  vec3 col = vec3(0.0);
  const float scale = 0.5;
  const float symSize = 8.0 / scale;
  float baseSpeed = 8.0 * 8.0;
  float startY = -240.0 - symSize;
  float offs = 19.0;
  const float spacing = symSize * 0.5;
  //float startX = iResolution.x * 0.5 - symSize * spacing * offs;
  float startX = -symSize;
  const float xnum = 4.0;
  for(float i = 0.0; i < xnum; i++) {
    float x = startX - i * (symSize + spacing);
    float seed = 113.0 + i * 123.0;
    //float speed = baseSpeed + floor(hash1(seed * 112.0) * 4.0) * 8.0;
    float speed = baseSpeed;
    col += sdConv(verticalText(p, vec2(x, startY), scale, speed, seed));
  }
  fragColor = vec4(col * 0.8, 1.0);
}

void main()
{
  vec4 fragColor;
  mainImage(fragColor, gl_FragCoord.xy);
  gl_FragColor = fragColor;
}
