A to-be-named application that compiles with gcc(linux) and emcc(web+wasm).

Someday this project should be a platform for shader-experimentation with
OpenGL ES for both linux native and web.

Compile:
  The standard that should be used for compiling is c99. Features like
  for-loop variable declaration are used in the code.
  Functionality from time.h (timespec) (define in the POSIX standard) is
  required, thus -D_XOPEN_SOURCE is defined as a compiler argument in the
  Makefile.

  $ make native
  $ make js

Run:
  $ ./bin/tbn
  $ python2 -m "SimpleHTTPServer" (or similar)
  Then open localhost:8000/tbn/tbn.html in a browser supporting wasm
