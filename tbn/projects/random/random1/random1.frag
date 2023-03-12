precision mediump float;

uniform vec3 iResolution;
uniform float iTime;

// works decently for seed in [0, 3x10^5]
float hash1(in float seed)
{
  // may be replaced with constant if range of seed is known
  float e = log(seed) * 10.0;
  return fract(sin(seed / e) * 43758.5453);
}

// works decently for seed in [0,1]^2
float hash2(in vec2 seed)
{
  return fract(sin(dot(seed.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
  float r = hash1(fragCoord.y * iResolution.x + fragCoord.x);
  //float r = hash2(fragCoord / iResolution.xy);
  fragColor.xyz = vec3(r);
  fragColor.w = 1.0;
}

void main()
{
  vec4 fragColor;
  mainImage(fragColor, gl_FragCoord.xy);
  gl_FragColor = fragColor;
}
