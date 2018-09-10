var Module = {
  preRun: [],
  postRun: [],
  print: function(m) {
    console.log(m);
  },
  printErr: function(m) {
    console.log(m);
  },
  canvas: (function() {
    var canvas = document.getElementById("tbn-canvas");
    canvas.addEventListener("webglcontextlost", function() {
      console.log("Lost WebGL Context!");
    });
    return canvas;
  })(),
  setStatus: function(m) {
    // Do nothing for now
  },
  locateFile: function(s) {
    return "/tbn/" + s;
  },
}
