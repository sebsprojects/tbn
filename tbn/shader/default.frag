precision mediump float;

uniform vec3 iResolution;
uniform float iTime;

#define PI 3.1415

float sdSquare(in vec2 p, in float l) {
  vec2 d = abs(p) - vec2(l, l);
  return length(max(d, vec2(0.0))) + min(max(d.x,d.y), 0.0);
}

float squareCluster(in vec2 p, in vec2 c) {
  p -= c;
  const float sqL = 50.0;
  const float sqSmallL = 8.0;
  const float r = 30.0 + (sqrt(2.0 * pow(sqL, 2.0)) +
                          sqrt(2.0 * pow(sqSmallL, 2.0)));

  float d = sdSquare(p, sqL); // main sq
  const int sqCount = 20;
  for(int i = 0; i < sqCount; i++) {
    float deg = 2.0 * PI * float(i) / float(sqCount);
    float m = 0.5 * (cos(iTime * 0.8) + 1.0);
    //m = 1.0;
    //m = 0.0;
    vec2 cc = (r + 20.0 * (m * cos(8.0 * deg) + (1.0 - m) * sin(8.0 * deg))) *
              vec2(sin(deg), cos(deg));
    d = min(d, sdSquare(p - cc, 5.0 * sin(4.0 * deg) + sqSmallL));
  }
  return d;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec3 col = vec3(0.0);
  vec2 p = fragCoord;
  p += -iResolution.xy/2.0; // transform coord sys to have 0 at center

  float d = squareCluster(p, vec2(0.0, 0.0));

  col = vec3(0.9, 0.0, 0.4);
  float blur = abs(cos(iTime * 0.5)) * 0.2 + 0.02;
  //blur = 0.02;
  if(d > 0.0) {
    col *= exp(blur * -d);
  }

  fragColor = vec4(col, 1.0);
}

void main() {
  vec4 fragColor;
  mainImage(fragColor, gl_FragCoord.xy);
  gl_FragColor = fragColor;
}
