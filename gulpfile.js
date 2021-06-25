const gulp = require("gulp");
const browserify = require("browserify");
const source = require("vinyl-source-stream");

gulp.task("build", function() {
  return browserify({
    entries: "./src/index.js",
    extensions: [".js"],
    debug: true
  })
    .transform("glslify")
    .transform("babelify", { 
      presets: ["env"],
      sourceMaps: true,
      global: true,
      ignore: [/\/node_modules\/(?!d3-quadtree\/)/]
    })
    .bundle()
    .pipe(source("app.js"))
    .pipe(gulp.dest("public/js"));
});
