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

  // Schritt 1: aktuelle Layout-Größe holen
  const displayWidth  = mazeCtx.canvas.clientWidth;
  const displayHeight = mazeCtx.canvas.clientHeight;

  // Schritt 2: Canvas-Pixelgröße anpassen
  if (mazeCtx.canvas.width !== displayWidth || mazeCtx.canvas.height !== displayHeight) {
    mazeCtx.canvas.width = displayWidth;
    mazeCtx.canvas.height = displayHeight;
  }

  // Schritt 3: Tilesize berechnen
  rows = maze.grid.length;
  cols = maze.grid[0].length;
  const ts = Math.min(Math.floor(displayWidth / cols), Math.floor(displayHeight / rows));

  // Schritt 4: tatsächliche genutzte Fläche ermitteln
  const usedW = cols * ts;
  const usedH = rows * ts;

  // Fläche löschen
  mazeCtx.clearRect(0, 0, displayWidth, displayHeight);

  // Schritt 5: mittig einpassen (damit nicht gestreckt wird)
  const offsetX = Math.floor((displayWidth - usedW) / 2);
  const offsetY = Math.floor((displayHeight - usedH) / 2);

  // Raster und Wände zeichnen
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = offsetX + x * ts, py = offsetY + y * ts;
      mazeCtx.strokeStyle = '#ccc';
      mazeCtx.strokeRect(px, py, ts, ts);
      if (maze.grid[y][x] != 0) {
        mazeCtx.drawImage(imgBrickwall, px, py, ts, ts);
      }
    }
  }

  // Ziel
  mazeCtx.drawImage(imgTreasure,
    offsetX + maze.goal.x * ts,
    offsetY + maze.goal.y * ts,
    ts, ts
  );

  // Spieler
  mazeCtx.save();
  mazeCtx.translate(
    offsetX + maze.player.x * ts + ts / 2,
    offsetY + maze.player.y * ts + ts / 2
  );
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

// function resetHighlight() {
  // window.workspace?.highlightBlock(null);
// }
