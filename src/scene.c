#include "scene.h"

#include <stdlib.h>
#include <string.h>
#include <stdio.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif


void createScene(Platform *platform, char *path,
                 void (*resLoadSuccess)(Scene *scene),
                 void (*resLoadError)(char *msg)) {
  Scene *scene = malloc(sizeof(Scene));
  scene->resolution[0] = 640; // TODO: Hardcoded resolution values
  scene->resolution[1] = 480;
  ShaderProgram p = {
    0, 0, 0, 0, 0, 0, SHADER_NOERROR, -1, -1
  };
  scene->shaderProgram = p;
  LoadState *ls = malloc(sizeof(LoadState));
  ls->scene = scene;
  ls->loadSuccess = resLoadSuccess;
  ls->loadError = resLoadError;
  ls->paths = malloc(2 * sizeof(char*));
  ls->paths[0] = mallocFullShaderPath(path, ".vert");
  ls->paths[1] = mallocFullShaderPath(path, ".frag");
  ls->pathsLen = 2;
  ls->currentPathIndex = 0;
  i32 i; for(i = 0; i < ls->pathsLen; i++) {
    printf("Need to load resources: %s\n", ls->paths[i]);
  }
  loadSceneResources(ls);
}

void destroyScene(Scene *scene) {
  if(scene->shaderProgram.vertSrc != 0) {
    free(scene->shaderProgram.vertSrc);
  }
  if(scene->shaderProgram.fragSrc != 0) {
    free(scene->shaderProgram.fragSrc);
  }
  free(scene);
}

void drawScene(Platform *platform, Scene *scene) {
  glUseProgram(scene->shaderProgram.prog);
  if(scene->shaderProgram.resUniformLoc >= 0) {
    glUniform3fv(scene->shaderProgram.resUniformLoc, 1, scene->resolution);
  }
  if(scene->shaderProgram.timUniformLoc >= 0) {
    glUniform1f(scene->shaderProgram.timUniformLoc, getDiffToStartTime(platform));
  }
  glDrawElements(GL_TRIANGLES, platform->indexNum, GL_UNSIGNED_SHORT, 0);
  glUseProgram(0);
}

// ----------------------------------------------------------------------------

void loadSceneResources(LoadState *ls) {
  char *path = ls->paths[ls->currentPathIndex];
  printf("Starting to Load Resource %s\n", path);
#ifdef __EMSCRIPTEN__
  emscripten_async_wget_data(path, ls, loadSuccessCallback,
                             loadErrorCallback);
#else
  char *buf = 0;
  i32 len;
  FILE *file = fopen(path, "rb");
  if(file) {
    fseek(file, 0, SEEK_END);
    len = ftell(file);
    fseek(file, 0, SEEK_SET);
    buf = malloc(len);
    fread(buf, 1, len, file);
    loadSuccessCallback(ls, buf, len);
    free(buf);
    fclose(file);
  } else {
    loadErrorCallback(ls);
  }
#endif
}

void loadSuccessCallback(void *arg, void *loadedData, i32 size) {
  LoadState *ls = (LoadState*) arg;
  char *currentPath = ls->paths[ls->currentPathIndex];
  // TODO: Quickfix for two shaders, error prone!
  char *buf = malloc(size + 1);
  strncpy(buf, loadedData, size);
  buf[size] = '\0';
  if(strstr(currentPath, ".vert")) {
    ls->scene->shaderProgram.vertSrc = buf;
  }
  if(strstr(currentPath, ".frag")) {
    ls->scene->shaderProgram.fragSrc = buf;
  }
  if(ls->currentPathIndex == ls->pathsLen - 1) {
    printf("Load Success. Nothing more to load\n");
    void (*successCallback)(Scene *scene) = ls->loadSuccess;
    void (*errorCallback)(char *msg) = ls->loadError;
    Scene *scene = ls->scene;
    destroyLoadState(ls);
    // Compile Shaders
    compileAndLinkShaderProgram(&scene->shaderProgram);
    if(scene->shaderProgram.error == SHADER_NOERROR) {
      (*successCallback)(scene);
    } else {
      printf("Error with code %i\n", scene->shaderProgram.error);
      (*errorCallback)("Error compiling shaders");
    }
  } else {
    printf("Load Success. There is more to load\n");
    ls->currentPathIndex++;
    loadSceneResources(ls);
  }
}

void loadErrorCallback(void *arg) {
  LoadState *ls = (LoadState*) arg;
  void (*callback)(char *msg) = ls->loadError;
  destroyLoadState(ls);
  (*callback)("Error loading resources");
}

void destroyLoadState(LoadState *ls) {
  i32 i; for(i = 0; i < ls->pathsLen; i++) {
    free(ls->paths[i]);
  }
  free(ls->paths);
  free(ls);
}

char *mallocFullShaderPath(char *path, char *shaderExt) {
  char *fullPath = 0;
#ifdef __EMSCRIPTEN__
  fullPath = malloc(strlen(path) + 7); // add /, \0 and .vert or .frag
  fullPath[0] = '/';
  strcpy(&fullPath[1], path);
  strcat(fullPath, shaderExt);
#else
  fullPath = malloc(strlen(path) + 8); // add ./, \0 and .vert or .frag
  fullPath[0] = '.'; fullPath[1] = '/';
  strcpy(&fullPath[2], path);
  strcat(fullPath, shaderExt);
#endif
  return fullPath;
}
