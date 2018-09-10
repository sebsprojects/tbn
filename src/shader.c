#include <stdlib.h>
#include <stdio.h>

#include "shader.h"


void compileAndLinkShaderProgram(ShaderProgram *p) {
  const GLchar *vertSrc = p->vertSrc;
  const GLchar *fragSrc = p->fragSrc;
  GLint success = 0;
  p->vert = glCreateShader(GL_VERTEX_SHADER);
  glShaderSource(p->vert, 1, &vertSrc, 0);
  glCompileShader(p->vert);
  glGetShaderiv(p->vert, GL_COMPILE_STATUS, &success);
  if(success == GL_FALSE) {
    GLint len = 0;
    glGetShaderiv(p->vert, GL_INFO_LOG_LENGTH, &len);
    GLchar *log = malloc(len * sizeof(GLchar));
    glGetShaderInfoLog(p->vert, len, &len, log);
    fprintf(stderr, "Error compiling vertex shader: %s\n", log);
    free(log);
    glDeleteShader(p->vert);
    p->error = SHADER_ERROR_COMPILE_VERT;
    return;
  }
  p->frag = glCreateShader(GL_FRAGMENT_SHADER);
  glShaderSource(p->frag, 1, &fragSrc, 0);
  glCompileShader(p->frag);
  glGetShaderiv(p->frag, GL_COMPILE_STATUS, &success);
  if(success == GL_FALSE) {
    GLint len = 0;
    glGetShaderiv(p->frag, GL_INFO_LOG_LENGTH, &len);
    GLchar *log = malloc(len * sizeof(GLchar));
    glGetShaderInfoLog(p->frag, len, &len, log);
    fprintf(stderr, "Error compiling fragment shader: %s\n", log);
    free(log);
    glDeleteShader(p->vert);
    glDeleteShader(p->frag);
    p->error = SHADER_ERROR_COMPILE_FRAG;
    return;
  }
  p->prog = glCreateProgram();
  glAttachShader(p->prog, p->vert);
  glAttachShader(p->prog, p->frag);
  glLinkProgram(p->prog);
  glGetProgramiv(p->prog, GL_LINK_STATUS, &success);
  if(success == GL_FALSE) {
    GLint len = 0;
    glGetProgramiv(p->prog, GL_INFO_LOG_LENGTH, &len);
    GLchar *log = malloc(len * sizeof(GLchar));
    glGetProgramInfoLog(p->prog, len, &len, log);
    fprintf(stderr, "Error linking shader: %s\n", log);
    free(log);
    glDeleteShader(p->vert);
    glDeleteShader(p->frag);
    glDeleteProgram(p->prog);
    p->error = SHADER_ERROR_LINK;
    return;
  }
  glDetachShader(p->prog, p->vert);
  glDetachShader(p->prog, p->frag);
}
