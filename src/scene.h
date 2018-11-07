#ifndef TBN_SCENE
#define TBN_SCENE

#include "common.h"
#include "platform.h"
#include "shader.h"


struct Scene {
  char *path;
  ShaderProgram shaderProgram;
  f32 resolution[2];
};
typedef struct Scene Scene;

struct LoadState {
  Scene *scene;
  char **paths;
  u32 pathsLen;
  u32 currentPathIndex;
  void (*loadSuccess)(Scene *scene);
  void (*loadError)(char *msg);
};
typedef struct LoadState LoadState;

/*
 * Mallocs a Scene and attempts to load the resources from path
 * Loading of resources is possibly (emscripten) asyc, thus the Scene is
 * not usable until the success callback is called supplying the finished
 * scene
 */
void createScene(Platform *platform, char *path,
                 void (*resLoadSuccess)(Scene *scene),
                 void (*resLoadError)(char *msg));

void destroyScene(Scene *scene);

void drawScene(Platform *platform, Scene *scene);

// ---------------------------------------------------------------------------

/*
 * Loads resources for the scene
 */
void loadSceneResources(LoadState *ls);

/*
 * If a load succeedes this function is called as a callback. The raw data
 * and its size are supplied as well as params containing.
 * If loadState indicates that all resources have been loaded, we clean up
 * loadState and call ls->loadSuccess
 * If not, we call loadSceneResources with incrm loadState to get the next
 * resource.
 */
void loadSuccessCallback(void *arg, void *loadedData, i32 size);

/*
 * An error occured loading a resource. Clean up loadState and call
 * ls->loadError
 */
void loadErrorCallback(void *arg);

void destroyLoadState(LoadState *ls);
char *mallocFullShaderPath(char *path, char *shaderExt);

#endif
