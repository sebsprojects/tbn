A to-be-named application that compiles with gcc(linux) and emcc(web+wasm).

Someday this project should be a platform for shader-experimentation with OpenGL ES for both linux native and web.

Requires a built (both gcc and js for the respective comilation here) elfclib (https://lab.elfeck.com/seb/elfclib) in ../elfclib to compile without changes to the Makefile.

Compile:
  $ make native
  $ make js

Run:
  $ ./bin/tbn
  $ python2 -m "SimpleHTTPServer" (or similar)
  Then open localhost:8000/tbn/tbn.html in a browser supporting wasm
