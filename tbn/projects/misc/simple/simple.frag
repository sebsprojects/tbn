precision mediump float;

uniform vec3 iResolution;
uniform float iTime;


float sdBox(in vec2 p, in vec2 l)
{
  vec2 d = abs(p) - l;
  return length(max(d, vec2(0.0))) + min(max(d.x,d.y), 0.0);
}

float sdConv(in float v)
{
  return abs(sign(v) - 1.0) * 0.5;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
  // Make [-1, 1]^2 coord system
  vec2 p = (fragCoord - iResolution.xy * 0.5) / (iResolution.xy * 0.5);
  float v = 1.0;
  vec3 col = vec3(0.0);
  v = min(v, sdBox(p - vec2(0.2, 0.4), vec2(0.2)));
  col += vec3(sdConv(v));
  fragColor = vec4(col, 1.0);
}

void main()
{
  vec4 fragColor;
  mainImage(fragColor, gl_FragCoord.xy);
  gl_FragColor = fragColor;
}
