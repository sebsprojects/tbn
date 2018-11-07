CC_FLAGS = -Wall -O3 -std=c99 -D_XOPEN_SOURCE=500
LN_FLAGS = -lm -lglfw -lGLESv2

# Native exec
ifneq "$(findstring native, $(MAKECMDGOALS))" ""
CC = gcc
OBJ_EXTENSION = o
endif

# JS exec
ifneq "$(findstring js, $(MAKECMDGOALS))" ""
CC = emcc
LN_FLAGS += -s USE_GLFW=3 -s FULL_ES2=1
OBJ_EXTENSION = bc
endif

# ----------------------------------------------------------------------------

SRC_FILES = $(wildcard src/*.c)
OBJ_FILES = $(addprefix bin/,$(notdir $(SRC_FILES:.c=.$(OBJ_EXTENSION))))
DEP_FILES = $(OBJ_FILES:.$(OBJ_EXTENSION)=.d)

BIN_NATIVE = ./bin/tbn
BIN_JS = ./tbn/tbn.js

native: $(BIN_NATIVE)
js: $(BIN_JS)

$(BIN_NATIVE): $(OBJ_FILES)
	$(CC) $^ $(LN_FLAGS) -o $@

$(BIN_JS): $(OBJ_FILES)
	$(CC) $^ $(LN_FLAGS) -o $@

-include $(DEP_FILES)

# ----------------------------------------------------------------------------

bin/%.$(OBJ_EXTENSION): src/%.c
	$(CC) $(CC_FLAGS) $(INCLUDES) -MMD -c $< -o $@

clean:
	-rm ./bin/*
