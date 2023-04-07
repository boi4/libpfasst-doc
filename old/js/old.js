    // <!-- <canvas id="canvas"></canvas>
    //      <br />
    //      <div style="text-align: center;">
    //      <button id="playPauseButton" onclick="toggleAnimation()">Play</button>
    //      <label for="loopToggle">Loop:</label>
    //      <input
    //      type="checkbox"
    //      id="loopToggle"
    //      onchange="toggleLoop()"
    //      checked
    //      />
    //      </div> -->
    // <!-- <br />
    //      <div style="text-align: center;">
    //      <input
    //      type="range"
    //      min="0"
    //      max="60"
    //      value="0"
    //      id="slider"
    //      style="width: 50%;"
    //      />
    //      </div>
    // -->

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// // Set up the grid
const numSteps = 30;
// const gridHeight = 8;
let myGrid = new Array(30).fill(0).map(() => new Array(8).fill("todo"));
let animationId;
let isRunning = false;
let isLooping = true;
let frame = 0;
let timePerStep = 0.5; // seconds
let timeStart;

const colorMap = {
    "todo": "#111111",
    "working": "blue",
    "done": "#222222",
};

function renderGrid(ctx, grid) {
  let gridWidth = grid.length;
  let gridHeight = grid[0].length;

  let grid_x_off = 10
  let grid_y_off = 10

  let cellSize = Math.floor((ctx.canvas.width-1-grid_x_off)/gridWidth);
  ctx.canvas.width = grid_x_off + cellSize*gridWidth + 1
  ctx.canvas.height = grid_y_off + cellSize*gridHeight + 1
  let canvasWidth = ctx.canvas.width;
  let canvasHeight = ctx.canvas.height;

  console.log("canvasWidth: " +  canvasWidth)
  console.log("canvasHeight: " +  canvasHeight)
  console.log("cellSize: " +  cellSize)

  // set background color
  ctx.fillStyle = "rgba(128,128,128,1.0)";
  ctx.fillRect(0,0,canvasWidth,canvasHeight)

  // draw arrow
  ctx.beginPath()
  ctx.moveTo(grid_x_off,grid_y_off/2)
  ctx.lineTo(canvasWidth-grid_x_off,grid_y_off/2)

  ctx.moveTo(canvasWidth-grid_x_off,grid_y_off/2)
  ctx.lineTo(canvasWidth-grid_x_off,grid_y_off/2-3)
  ctx.moveTo(canvasWidth-grid_x_off,grid_y_off/2)
  ctx.lineTo(canvasWidth-grid_x_off,grid_y_off/2+3)
  ctx.stroke()

  // draw grid
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      ctx.fillStyle = "black";
      ctx.strokeRect(grid_x_off + 1 + x * cellSize, grid_y_off+1+y * cellSize, cellSize, cellSize);
    }
  }

  // for (let x = 0; x < gridWidth; x++) {
  //   for (let y = 0; y < gridHeight; y++) {
  //     ctx.fillStyle = colorMap[grid[x][y]];
  //     ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
  //   }
  // }
}


// Update the grid every frame
function updateGrid(grid, step) {
  let gridWidth = grid.length;
  let gridHeight = grid[0].length;

  // Update the grid
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      grid[x][y] = (x < frame? "todo": "done");
    }
  }
}

function update() {
  // Clear the canvas and redraw the grid
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const timediff = (new Date().getTime() - timeStart)
  const step = timediff / (timePerStep*1000000)

  updateGrid(myGrid, step);
  renderGrid(ctx, myGrid);

  frame++;
  // document.getElementById("slider").value = frame;

  // Schedule the next update or stop the animation
  if (frame < numSteps) {
    animationId = requestAnimationFrame(update);
  } else if (isLooping) {
    frame = 0;
    animationId = requestAnimationFrame(update);
  } else {
    stopAnimation();
  }
}

// Toggle the animation between running and paused
function toggleAnimation() {
  if (isRunning) {
    stopAnimation();
    document.getElementById("playPauseButton").textContent = "Play";
  } else {
    startAnimation();
    document.getElementById("playPauseButton").textContent = "Pause";
  }
}

// Start the animation
function startAnimation() {
  if (!isRunning) {
    isRunning = true;
    timeStart = (new Date().getTime())
    animationId = requestAnimationFrame(update);
  }
}

// Stop the animation
function stopAnimation() {
  if (isRunning) {
    isRunning = false;
    cancelAnimationFrame(animationId);
  }
}

// Toggle whether the animation should loop
function toggleLoop() {
  isLooping = !isLooping;
}

startAnimation();
