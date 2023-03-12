precision mediump float;

uniform vec3 iResolution;
uniform float iTime;


// --------------------------------------------------------------------------
// Signed Distance Primitives
// --------------------------------------------------------------------------

// Box with sidelength l centered at 0. Credit: IQ
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

// Bad pseudo-arng for seeds between 0 and ~10^5. Credit: The Internet
float hash1(in float seed)
{
  float e = log(seed) * 10.0;
  return fract(sin(seed / e) * 43758.5453);
}


// --------------------------------------------------------------------------
// 4-segment "boxes" with asymmetry at index 1 (out of 0, 1, 2, 3)
// ind.xy = x :: [from, to]
// ind.zw = y :: [from, to]
// --------------------------------------------------------------------------

float filledSegment(in vec2 p, in vec4 ind)
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

// ind.xy = x :: [from, to] and ind.zw = y :: [from, to]
float emptySegment(in vec2 p, in vec4 ind)
{
  float v = filledSegment(p, vec4(ind.x, ind.x, ind.z, ind.w));
  v = min(v, filledSegment(p, vec4(ind.y, ind.y, ind.z, ind.w)));
  v = min(v, filledSegment(p, vec4(ind.x, ind.y, ind.z, ind.z)));
  v = min(v, filledSegment(p, vec4(ind.x, ind.y, ind.w, ind.w)));
  return v;
}


// --------------------------------------------------------------------------
// Symbols as SD-assemblies
// --------------------------------------------------------------------------

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


// --------------------------------------------------------------------------
// Vertical down-scrolling text with random symbols and start/end buffer
// --------------------------------------------------------------------------

float verticalEndlessScroll(in vec2 fragCoord,
                            in vec2 pos,
                            in float height, // multiple of (8 / scale)
                            in float scale, // should be 2^k for k in Z
                            in float speed, // px / sec
                            in float seed)
{
  float symSize = 8.0 / scale;
  if(fragCoord.y > pos.y || fragCoord.y < pos.y - height ||
     fragCoord.x < pos.x || fragCoord.x >= pos.x + symSize) {
    return 1.0;
  }
  const float maxNum = 3.0 * 480.0 / 8.0; // 3 * 60
  float num = (height / symSize) * 2.0; // at least two heights full
  // random (time-invar) num between [num, num * 3.0]
  num = floor(num * (1.0 + 2.0 * hash1(seed + 72.120)));
  float heightOffs = num * symSize;
  // need height to offset one whole blank screen, since they symbols start
  // above height
  float seedOffs = floor(iTime * speed / (num * symSize + height)) * 101.112;
  seed += seedOffs;
  vec2 timeOffs = vec2(0.0, -mod(iTime * speed, num * symSize + height));
  float beginSym = floor(hash1(seed + 232.1) * num * 0.3); // up to 0.3 missing
  float endSym = num - floor(hash1(seed + 211.2) * num * 0.3); // same
  float symType = 1.0;
  float v = 1.0;
  for(float i = 0.0; i < maxNum; i++) {
    if(i >= num) {
      break;
    }
    vec2 p = vec2(0.0, i * symSize) - timeOffs - vec2(0.0, heightOffs) - pos;
    // backwards sign because p is an offset
    if(p.y > pos.y || p.y < pos.y - height- symSize) {
      continue;
    }
    if(i >= num - 1.0 || i == 0.0) {
      //symType = 7.0;
      symType = 0.0;
    } else if(i < beginSym || i > endSym) {
      symType = 0.0;
    } else {
      symType = floor(hash1((seed + i) * 1.211) * 7.0);
    }
    v = min(v, symbol((fragCoord + p) * scale, symType));
  }
  return v;
}


// --------------------------------------------------------------------------
// Main Program
// --------------------------------------------------------------------------

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
  // Transform coord system to be centered at 0 in the middel and half
  // resolution to each side
  vec2 p = fragCoord - iResolution.xy * 0.5;
  vec3 col = vec3(0.0);
  const float scale = 0.5;
  const float symSize = 8.0 / scale;
  float baseSpeed = 8.0 * 8.0;
  float seed = 113.0;
  float height = 320.0;
  float top = height * 0.5;
  float num = 14.0 * scale;
  for(float i = -floor(num / 2.0); i <= floor(num / 2.0); i++) {
    vec2 pos = vec2(-symSize * 0.5 + i * (symSize * 1.75), top);
    float s = seed * (i + num / 2.0) * 124.234;
    col += sdConv(verticalEndlessScroll(p, pos, height, scale, baseSpeed, s));
  }
  col += vec3(sdConv(sdBoxUL(p - vec2(-100.0, top + 2.0), vec2(200.0, 2.0))),
              0.0, 0.0);
  col += vec3(sdConv(sdBoxUL(p - vec2(-100.0, top - height), vec2(200.0, 2.0))),
              0.0, 0.0);
  fragColor = vec4(col * 0.8, 1.0);
}

void main()
{
  vec4 fragColor;
  mainImage(fragColor, gl_FragCoord.xy);
  gl_FragColor = fragColor;
}
