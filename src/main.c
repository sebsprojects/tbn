#define GLFW_INCLUDE_ES2

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <math.h>
#include <GLFW/glfw3.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#include <elfc_common.h>

#include "shader.h"


GLFWwindow *window = 0;

ShaderProgram shaderProgram = {
  0, 0, 0, 0, 0, 0, SHADER_NOERROR
};

f32 vData[] = {
  -1.0, 1.0, 0.0, 1.0,
  1.0, 1.0, 0.0, 1.0,
  1.0, -1.0, 0.0, 1.0,
  -1.0, -1.0, 0.0, 1.0
};
u16 iData[] = {
  0, 1, 2, 2, 3, 0
};
f32 res[] = {
  640.0, 480.0, 1.0 // z is pixel-aspect ratio
};

struct timespec tSpec;
f64 startTime = -1; // in seconds

f64 getCurrentTime() {
  clock_gettime(CLOCK_REALTIME, &tSpec);
  return tSpec.tv_sec + (tSpec.tv_nsec / 1.0e9);
}

f64 getTimeDiff() {
  return getCurrentTime() - startTime;
}

GLuint vertexBuffer = 0;
GLuint indexBuffer = 0;

GLint resLocation = -1;
GLint timeLocation = -1;

void exitProgram(i32 code) {
  if(shaderProgram.vertSrc != 0) {
    free(shaderProgram.vertSrc);
  }
  if(shaderProgram.fragSrc != 0) {
    free(shaderProgram.fragSrc);
  }
  glfwDestroyWindow(window);
  glfwTerminate();
#ifdef __EMSCRIPTEN__
  emscripten_cancel_main_loop();
#else
  exit(code);
#endif
}

void error_callback(i32 error, const char* description) {
  fprintf(stderr, "Error: %s\n", description);
}

void allocFileContent(char *content, char **target, i32 size) {
  *target = malloc(size + 1); // add space for \0
  strncpy(*target, content, size); // size does not include \0
  (*target)[size] = '\0'; // manually 0-terminate the string
}

void emSupplyFile(void *arg, void *data, i32 size) {
  allocFileContent(data, (char **) arg, size);
}

void emFileFetchError(void *arg) {
  shaderProgram.error = SHADER_ERROR_READ_SOURCE;
}

void loadShaderFile(char *path, char *shaderExt, char **target) {
#ifdef __EMSCRIPTEN__
  char *fullPath = malloc(strlen(path) + 7); // add /, \0 and .vert or .frag
  fullPath[0] = '/';
  strcpy(&fullPath[1], path);
  strcat(fullPath, shaderExt);
  printf("Shader Path: %s\n", fullPath);
  emscripten_async_wget_data(fullPath, target, emSupplyFile,
                             emFileFetchError);
  free(fullPath);
#else
  char *fullPath = malloc(strlen(path) + 8); // add ./, \0 and .vert or .frag
  fullPath[0] = '.'; fullPath[1] = '/';
  strcpy(&fullPath[2], path);
  strcat(fullPath, shaderExt);
  printf("Shader Path: %s\n", fullPath);
  char *buf = 0;
  i32 len;
  FILE *file = fopen(fullPath, "rb");
  if(file) {
    fseek(file, 0, SEEK_END);
    len = ftell(file);
    fseek(file, 0, SEEK_SET);
    buf = malloc(len);
    fread(buf, 1, len, file);
    allocFileContent(buf, target, len);
    free(buf);
    fclose(file);
  } else {
    shaderProgram.error = SHADER_ERROR_READ_SOURCE;
  }
  free(fullPath);
#endif
}

void init(char *shaderPath) {
  startTime = getCurrentTime();
  shaderProgram.filePath = shaderPath;
  loadShaderFile(shaderProgram.filePath, ".vert", &shaderProgram.vertSrc);
  loadShaderFile(shaderProgram.filePath, ".frag", &shaderProgram.fragSrc);

  glClearColor(0.0, 0.0, 0.0, 1.0);
  glViewport(0, 0, (i32) res[0], (i32) res[1]);
  glGenBuffers(1, &vertexBuffer);
  glGenBuffers(1, &indexBuffer);
  glBindBuffer(GL_ARRAY_BUFFER, vertexBuffer);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vData), vData, GL_STATIC_DRAW);
  glBindBuffer(GL_ARRAY_BUFFER, 0);
  glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, indexBuffer);
  glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(iData), iData,
               GL_STATIC_DRAW);
  glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0);
}

void initShader() {
  if(shaderProgram.error != SHADER_NOERROR) {
    printf("Error loading shader program with code %d\n",
           (i32) shaderProgram.error);
    exitProgram(1);
  } else if(shaderProgram.vertSrc != 0 && shaderProgram.fragSrc != 0 &&
            shaderProgram.prog == 0) {
    //printf("Vec Source:\n%s\n", shaderProgram.vertSrc);
    //printf("Frag Source:\n%s\n", shaderProgram.fragSrc);
    compileAndLinkShaderProgram(&shaderProgram);
    if(shaderProgram.error == SHADER_NOERROR) {
      printf("Shader loaded and compiled without error\n");
      resLocation = glGetUniformLocation(shaderProgram.prog, "iResolution");
      timeLocation = glGetUniformLocation(shaderProgram.prog, "iTime");
    }
  }
}

void draw() {
  glClear(GL_COLOR_BUFFER_BIT);
  glBindBuffer(GL_ARRAY_BUFFER, vertexBuffer);
  glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, indexBuffer);
  glEnableVertexAttribArray(0);
  glVertexAttribPointer(0, 4, GL_FLOAT, GL_FALSE, 0, 0);
  glUseProgram(shaderProgram.prog);
  if(resLocation >= 0) {
    glUniform3fv(resLocation, 1, res);
  }
  if(timeLocation >= 0) {
    glUniform1f(timeLocation, getTimeDiff());
  }
  glDrawElements(GL_TRIANGLES, sizeof(iData) / sizeof(u16),
                 GL_UNSIGNED_SHORT, 0);
  glUseProgram(0);
  glDisableVertexAttribArray(0);
  glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0);
  glBindBuffer(GL_ARRAY_BUFFER, 0);
}

void render() {
  initShader();
  if(shaderProgram.error == SHADER_NOERROR && shaderProgram.prog != 0) {
    draw();
  }
}

i32 main(int argc, char **argv) {
  glfwSetErrorCallback(error_callback);
  if(!glfwInit()) {
    return 1;
  }
  glfwWindowHint(GLFW_CLIENT_API, GLFW_OPENGL_ES_API);
  glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 2);
  glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 0);
  glfwWindowHint(GLFW_RESIZABLE, 0);
  window = glfwCreateWindow((i32) res[0], (i32) res[1], "Study", 0, 0);
  if(!window) {
    glfwTerminate();
    return 1;
  }
  glfwMakeContextCurrent(window);
  glfwSwapInterval(1);

  char *shaderPath = "tbn/shader/default";
  if(argc > 1) {
    shaderPath = argv[1];
  }
  printf("Shader Path: %s\n", shaderPath);
  init(shaderPath);

#ifdef __EMSCRIPTEN__
  emscripten_set_main_loop(render, 0, 1);
#else
  while (!glfwWindowShouldClose(window)) {
    render();
    glfwSwapBuffers(window);
    glfwPollEvents();
  }
#endif

  exitProgram(0);
  return 0;
}
