#include <stdio.h>
#include <time.h>
#include <stdlib.h>

#include "platform.h"


static f32 vData[] = {
  -1.0,  1.0, 0.0, 1.0,
   1.0,  1.0, 0.0, 1.0,
   1.0, -1.0, 0.0, 1.0,
  -1.0, -1.0, 0.0, 1.0
};
static u16 iData[] = {
  0, 1, 2, 2, 3, 0
};
static struct timespec tspec;

// ----------------------------------------------------------------------------

void glfwErrorCallback(i32 error, const char* description) {
  fprintf(stderr, "Error: %s\n", description);
}

void createGlfw(GLFWwindow **window) {
  glfwSetErrorCallback(glfwErrorCallback);
  if(!glfwInit()) {
    *window = 0;
  }
  glfwWindowHint(GLFW_CLIENT_API, GLFW_OPENGL_ES_API);
  glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 2);
  glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 0);
  glfwWindowHint(GLFW_RESIZABLE, 0);
  GLFWwindow* w = glfwCreateWindow(640, 480, "Initializing", 0, 0);
  if(!w) {
    *window = 0;
  }
  glfwMakeContextCurrent(w);
  glfwSwapInterval(1);
  *window = w;
}

void createGeometry(GLuint *vb, GLuint *ib) {
  glClearColor(0.0, 0.0, 0.0, 1.0);
  glGenBuffers(1, vb);
  glGenBuffers(1, ib);
  glBindBuffer(GL_ARRAY_BUFFER, *vb);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vData), vData, GL_STATIC_DRAW);
  glBindBuffer(GL_ARRAY_BUFFER, 0);
  glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, *ib);
  glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(iData), iData, GL_STATIC_DRAW);
  glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0);
}

// ----------------------------------------------------------------------------

Platform *createPlatform() {
  Platform *p = malloc(sizeof(Platform));
  p->indexNum = sizeof(iData) / sizeof(u16);
  p->startTime = getCurrentTime();
  createGlfw(&p->window);
  createGeometry(&p->vertexBuffer, &p->indexBuffer);
  return p;
}

void destroyPlatform(Platform *p) {
  if(p->window != 0) {
    glfwDestroyWindow(p->window);
  }
  glfwTerminate();
  free(p);
}

f64 getCurrentTime() {
  clock_gettime(CLOCK_REALTIME, &tspec);
  return tspec.tv_sec + (tspec.tv_nsec / 1.0e9);
}

f64 getDiffToStartTime(Platform *p) {
  return p->startTime - getCurrentTime();
}
