let isAnimationRunning = false;
let bodyWidth = document.body.offsetWidth;

let newSketch = function(mygrid, doStep, statsId) {
  return function(p) {
    let gridCols = mygrid.length;
    let gridRows = mygrid[0].length;
    let xoffset = 10;
    let yoffset = 10;
    //let cellLen = 10;
    // let canvasWidth = 1+cellLen*gridCols+xoffset;
    // let canvasHeight = 1+cellLen*gridRows+yoffset;
    let canvasWidth = bodyWidth*0.9;
    let cellWidth = Math.floor((canvasWidth-1)/gridCols)
    let canvasHeight = 1+cellWidth*gridRows+yoffset;
    // let canvasHeight = 1+cellLen*gridRows+yoffset;
    let cellHeight = Math.floor((canvasHeight-1)/gridRows)
    let cellColor = '#ffffff';
    let step = 0;
    let timePerStep = 0.2;
    let last = new Date().getTime()
    let initialRender = true;
    let grid = mygrid;
    let colorMap = {
      "todo"   : "#ffffff",
      "working": "#0000ff",
      "done"   : "#ff0000",
    };
    let canvas;

    p.setup = function() {
      p.createCanvas(canvasWidth, canvasHeight);
      p.draw();
    }

    function renderGrid() {
      for (let col = 0; col < gridCols; col += 1) {
        for (let row = 0; row < gridRows; row += 1) {
          p.fill(cellColor);
          p.stroke('#333333');
          p.rect(xoffset + 1 + cellWidth*col,
                  yoffset + 1 + row*cellHeight,
                  cellWidth,
                  cellHeight);

          p.fill(colorMap[grid[col][row]]);
          p.rect(xoffset + 1 + cellWidth*col,
                  yoffset + 1 + row*cellHeight,
                  cellWidth,
                  cellHeight);
        }
      }
    }

    function renderStats() {
      let elem = document.getElementById(statsId);
      elem.innerText = "t = " + step;
    }

    p.draw = function() {
      let now = new Date().getTime();
      dt = (now - last) / 1000.0

      if (initialRender || (isAnimationRunning && (dt >= timePerStep))) {
        initialRender = false;
        last = now
        p.background(240);
        finished = doStep(grid, step);
        renderStats();
        step += 1;
        renderGrid();
        if (finished) {
          step = 0;
        }
      }
    }

    function startAnimation() {
      isAnimationRunning = true;
    }

    function pauseAnimation() {
      isAnimationRunning = false;
    }
  }
}

function toggleSeq() {
  let btn = document.getElementById("toggleseqbtn");
  if (myp5.isLooping()) {
    if (isAnimationRunning) {
      btn.innerText = "⏵"
    } else {
      btn.innerText = "⏸︎"
    }
    isAnimationRunning = !isAnimationRunning;
  }
}

let sketch1 = newSketch(new Array(60).fill(0).map(() => new Array(20).fill("todo")),
    function(grid, step) {
      let gridCols = grid.length;
      let gridRows = grid[0].length;
      for (let col = 0; col < gridCols; col += 1) {
        for (let row = 0; row < gridRows; row += 1) {
          if (col < step) {
            grid[col][row] = "done";
          }
          if (col == step) {
            grid[col][row] = "working";
          }
          if (col > step) {
            grid[col][row] = "todo";
          }
        }
      }
      return step == gridCols;
    },
    "seqstats"
  )

let myp5 = new p5(sketch1, "seqcanvas");
