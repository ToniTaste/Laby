// maze.js

let mazeCtx;
let rows = maze.grid.length;
let cols = maze.grid[0].length;


const startState = { ...maze.player };

//Funktion zum Zeichnen des Labyrinths
function drawMaze() {
  if (!mazeCtx) {
    mazeCtx = document.getElementById('mazeCanvas').getContext('2d');
  }

  // Größe synchronisieren mit CSS
  mazeCtx.canvas.height = mazeCtx.canvas.clientHeight;
  mazeCtx.canvas.width = mazeCtx.canvas.clientWidth;

  const { width, height } = mazeCtx.canvas;
  rows = maze.grid.length;
  cols = maze.grid[0].length;

  // Zellen ts tilesize - quadratisch und so groß wie möglich
  const ts = Math.min(Math.floor(width / cols), Math.floor(height / rows));

  mazeCtx.clearRect(0, 0, width, height);

  // Labyrinth zellenweise bauen
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = x * ts, py = y * ts;
      //grauer Rahmen
      mazeCtx.strokeStyle = '#ccc';
      mazeCtx.strokeRect(x * ts, y * ts, ts, ts);
      //Bilder in Zellen
      if (maze.grid[y][x] != 0) {
        mazeCtx.drawImage(imgBrickwall, px, py, ts, ts);
      }
    }
  }
  //Ziel malen
  mazeCtx.drawImage(imgTreasure, maze.goal.x * ts, maze.goal.y * ts, ts, ts);
  mazeCtx.save();
  //Spieler malen
  mazeCtx.translate(maze.player.x * ts + ts / 2, maze.player.y * ts + ts / 2);
  mazeCtx.rotate(maze.player.dir * Math.PI / 2 + Math.PI);
  mazeCtx.drawImage(imgRobot, -ts / 2, -ts / 2, ts, ts);
  mazeCtx.restore();
}

function mazeReset() {
  Object.assign(maze.player, startState);
  drawMaze();
}

function mazeMove() {
  const { x, y, dir } = maze.player;
  const dx = dir === 1 ? 1 : dir === 3 ? -1 : 0;
  const dy = dir === 2 ? 1 : dir === 0 ? -1 : 0;
  const nx = x + dx, ny = y + dy;

  if (maze.grid[ny]?.[nx] === 1) {
    alert('🚧 Hindernis vor der Figur!');
    throw new Error('Collision');
  }
  if (ny < 0 || nx < 0 || ny >= rows || nx >= cols) {
    alert('🚧 Spielfeldrand!');
    throw new Error('Collision');
  }

  maze.player.x = nx;
  maze.player.y = ny;
  drawMaze();
}

function mazeTurn(direction) {
  maze.player.dir = (maze.player.dir + (direction === 'LEFT' ? 3 : 1)) % 4;
  drawMaze();
}

function mazeZiel() {
  return maze.player.x === maze.goal.x && maze.player.y === maze.goal.y;
}

function resetHighlight() {
  window.workspace?.highlightBlock(null);
}
