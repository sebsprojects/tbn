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
  if(t == 1.0) { return symbol_01(p); }
  if(t == 2.0) { return symbol_02(p); }
  if(t == 3.0) { return symbol_03(p); }
  if(t == 4.0) { return symbol_04(p); }
  if(t == 5.0) { return symbol_05(p); }
  if(t == 6.0) { return symbol_06(p); }
  return 1.0;
}

float doubleSymbol(in vec2 p, float t1, float t2)
{
  float v = symbol(p, t1);
  v = min(v, symbol(p + vec2(0.0, 8.0), t2));
  return v;
}

// ----------------------------------------------------------------------------

float singleSymbols(in vec2 fragCoord)
{
  vec2 p = fragCoord;
  vec2 baseOffs = vec2(300.0, -220.0);
  float scale = 0.5 * 0.5;
  float skip = 10.0;
  float v = 1.0;
  for(float i = 0.0; i < 10.0; i++) {
    v = min(v, symbol((p + baseOffs) * scale + vec2(0.0, skip * i), i+1.0));
  }
  return v;
}

float doubleSymbols(in vec2 fragCoord)
{
  vec2 p = fragCoord;
  vec2 baseOffs = vec2(230.0, -220.0);
  float scale = 0.5;
  float v = 1.0;
  const float perCol = 6.0;
  for(float i = 0.0; i < 6.0; i++) {
    for(float j = 0.0; j < 6.0; j++) {
      float ski = (i * 6.0 + j);
      float r = mod(ski, perCol);
      float d = floor(ski / perCol);
      vec2 offs = vec2(-d * 15.0, r * 20.0);
      v = min(v, doubleSymbol((p + baseOffs) * scale + offs, j + 1.0, i + 1.0));
    }
  }
  return v;
}

float textTest(in vec2 fragCoord)
{
  vec2 p = fragCoord;
  vec2 baseOffs = vec2(0, -220.0);
  float scale = 1.0;
  float skip = 8.0;
  float v = 1.0;
  const float num = 6.0;
  const float m = 25.0;
  float ski = 0.0;
  for(float i = 0.0; i < num; i++) {
    for(float j = 0.0; j < num; j++) {
      float k = mod(ski, m);
      float r = floor(ski / m);
      v = min(v, symbol((p + baseOffs) * scale + vec2(-(skip + 4.0) * r,
              skip * k), i + 1.0));
      ski++;
      k = mod(ski, m);
      r = floor(ski / m);
      v = min(v, symbol((p + baseOffs) * scale + vec2(-(skip + 4.0) * r,
              skip * k), j + 1.0));
      ski++;
    }
  }
  return v;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
  vec2 p = fragCoord - iResolution.xy * 0.5;
  vec3 col = vec3(0.0);
  col += sdConv(singleSymbols(p)) * vec3(0.8);
  col += sdConv(doubleSymbols(p)) * vec3(0.8);
  col += sdConv(textTest(p)) * vec3(0.8);
  fragColor = vec4(col, 1.0);
}

void main()
{
  vec4 fragColor;
  mainImage(fragColor, gl_FragCoord.xy);
  gl_FragColor = fragColor;
}
