precision mediump float;

uniform vec3 iResolution;
uniform float iTime;


float sdSquare(in vec2 p, in vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, vec2(0.0))) + min(max(d.x,d.y), 0.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec3 col = vec3(0.0);
  vec2 p = fragCoord;
  p += -iResolution.xy/2.0; // transform coord sys to have 0 at center
  p += 20.0 * vec2(cos(iTime), sin(iTime));
  float d = sdSquare(p, vec2(40.0, 40.0));
  col.x = clamp(exp(-0.05 * d), 0.0, 1.0);
  col.z = 0.5 * clamp(exp(-0.025 * d), 0.0, 1.0);
  fragColor = vec4(col, 1.0);
}

void main() {
  vec4 fragColor;
  mainImage(fragColor, gl_FragCoord.xy);
  gl_FragColor = fragColor;
}
