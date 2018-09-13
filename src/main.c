#define GLFW_INCLUDE_ES2

#include <stdio.h>
#include <stdlib.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#include "common.h"
#include "platform.h"
#include "shader.h"
#include "scene.h"


Platform *platform = 0;
Scene *scene = 0;

void exitProgram(i32 code) {
  if(platform != 0) {
    destroyPlatform(platform);
  }
  if(scene != 0) {
    destroyScene(scene);
  }
#ifdef __EMSCRIPTEN__
  emscripten_cancel_main_loop();
#else
  exit(code);
#endif
}

void render() {
  glClear(GL_COLOR_BUFFER_BIT);
  if(scene == 0) {
    return;
  }
  glViewport(0, 0, (GLuint) scene->resolution[0],
                   (GLuint) scene->resolution[1]);
  glBindBuffer(GL_ARRAY_BUFFER, platform->vertexBuffer);
  glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, platform->indexBuffer);
  glEnableVertexAttribArray(0);
  glVertexAttribPointer(0, 4, GL_FLOAT, GL_FALSE, 0, 0);
  drawScene(platform, scene);
  glDisableVertexAttribArray(0);
  glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0);
  glBindBuffer(GL_ARRAY_BUFFER, 0);
}

void loadSceneSuccess(Scene *s) {
  scene = s;
}

void loadSceneError(char *msg) {
  printf("Scene Load Error: %s\n", msg);
  exitProgram(1);
}

i32 main(int argc, char **argv) {
  printf("Program running: %s\n", argv[0]);
  platform = createPlatform();
  char *shaderPath = "tbn/shader/default";
  if(argc > 1) {
    shaderPath = argv[1];
  }
  printf("Shader Path: %s\n", shaderPath);
  createScene(platform, shaderPath, loadSceneSuccess, loadSceneError);

#ifdef __EMSCRIPTEN__
  emscripten_set_main_loop(render, 0, 1);
#else
  while (!glfwWindowShouldClose(platform->window)) {
    render();
    glfwSwapBuffers(platform->window);
    glfwPollEvents();
  }
#endif
  exitProgram(0);
  return 0;
}
