#ifndef TBN_SCENE
#define TBN_SCENE


struct Scene {
  char *path;
  ShaderProgram shaderProgram,
  f32 resolution[],
};
typedef struct Scene Scene;

#endif
