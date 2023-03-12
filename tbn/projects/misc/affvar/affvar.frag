precision mediump float;

uniform vec3 iResolution;
uniform float iTime;

#define PI 3.1415

float f(in vec2 p)
{
  float x = p.x;
  float y = p.y;
  //return x * (x - 0.5) * (y-0.5) * (x-0.2) * (x-0.3) * (x- 0.9);
  return sin(iTime) * x * x * y + x * x + y * y - 0.5;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
  vec2 p = fragCoord - vec2((iResolution.x - iResolution.y) * 0.5, 0.0);
  p = 2.0 * (p / iResolution.yy) - 1.0;
  vec3 col = vec3(0.0);
  if(abs(p.x) <= 1.0) {
    float val = f(p);
    col += vec3(0.9, 0.0, 0.4) * exp(-30.0 * abs(val));
  } else {
    col = vec3(0.1);
  }
  fragColor = vec4(col, 1.0);
}

void main()
{
  vec4 fragColor;
  mainImage(fragColor, gl_FragCoord.xy);
  gl_FragColor = fragColor;
}
