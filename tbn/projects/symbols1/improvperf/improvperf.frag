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

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
  vec2 p = fragCoord - iResolution.xy * 0.5;
  vec3 col = vec3(0.0);
  vec2 offs = -iResolution.xy * 0.5;
  float stepSize = 20.0;
  for(float i = 0.0; i < 4.0; i++) {
    for(float j = 0.0; j < 4.0; j++) {
      offs.x = 0.0;
      offs.y += stepSize;
      for(float k = 0.0; k < 4.0; k++) {
        for(float l = 0.0; l < 4.0; l++) {
          offs.x += stepSize;
          if(k < i || l < j) continue;
          vec4 o = vec4(i, k, j, l);
          col += sdConv(filledSegment((p + vec2(offs.x, offs.y)) * 0.5, o)) * vec3(0.0, 0.0, 1.0);
          col += sdConv(filledSegment2((p + vec2(offs.x, offs.y)) * 0.5, o)) * vec3(1.0, 0.0, 0.0);
        }
      }
    }
  }
  fragColor = vec4(col, 1.0);
}

void main()
{
  vec4 fragColor;
  mainImage(fragColor, gl_FragCoord.xy);
  gl_FragColor = fragColor;
}
