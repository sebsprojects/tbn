#ifndef TBN_SHADER
#define TBN_SHADER

#include <GLES2/gl2.h>


enum ShaderError {
  SHADER_NOERROR = 0,
  SHADER_ERROR_COMPILE_VERT = 1,
  SHADER_ERROR_COMPILE_FRAG = 2,
  SHADER_ERROR_LINK = 3,
  SHADER_ERROR_READ_SOURCE = 4
};

struct ShaderProgram {
  char *filePath;
  char *vertSrc;
  char *fragSrc;
  GLuint vert;
  GLuint frag;
  GLuint prog;
  enum ShaderError error;
  GLuint resUniformLoc;
  GLuint timUniformLoc;
};
typedef struct ShaderProgram ShaderProgram;

void compileAndLinkShaderProgram(ShaderProgram *p);


#endif
