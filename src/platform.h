#ifndef TBN_PLATFORM
#define TBN_PLATFORM

#define GLFW_INCLUDE_ES2
#include <GLFW/glfw3.h>
#include <math.h>

#include "common.h"


struct Platform {
  GLFWwindow *window;
  u32 indexNum;
  GLuint vertexBuffer;
  GLuint indexBuffer;
  f64 startTime;
};
typedef struct Platform Platform;

Platform *createPlatform();
void destroyPlatform(Platform *p);

f64 getCurrentTime();
f64 getDiffToStartTime(Platform *p);

#endif
