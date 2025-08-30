// main.js

//lokale Variablen und Konstanten
let workspace;
let currentSteps = [];
let stepsInitialized = false;
let MAX_BLOCKS = 10;
let startGrid = null;
let startGoal = null;

//Definition und Laden der Bilder	   
const names = ['treasure', 'robot', 'brickwall'];
const imgs = names.map(n => {
  const i = new Image();
  i.src = './img/' + n + '.svg';
  return i;
});
Promise.all(imgs.map(img => new Promise((res, rej) => {
  img.onload = res;
  img.onerror = rej;
}))).catch(() => showOverlay('Fehler beim Laden der Bilder'));
const [imgTreasure, imgRobot, imgBrickwall] = imgs;

// Globale Highlight-Funktion
window.highlightBlock = function (id) {
  if (workspace) {
    workspace.highlightBlock(id);
  }
};

window.addEventListener('resize', () => {
  Blockly.svgResize(workspace);
  drawMaze();
});

//Globale Ladefunktion
window.addEventListener('load', () => {
  initBlockly();
  mazeReset();
  MAX_BLOCKS = maze.max_blocks;


  // hier Workspace mit Default-XML füllen
  const xmlDom = Blockly.utils.xml.textToDom(defaultProgramXml);
  Blockly.Xml.domToWorkspace(xmlDom, workspace);

  // Datei-Ladebereich für Projekt
  document.getElementById('xmlInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let xmlDom;
      try {
        xmlDom = Blockly.utils.xml.textToDom(reader.result);
      } catch (e) {
        alert("❌ Fehler beim Parsen der Datei:\n" + e.message);
        return;
      }

      const blocks = xmlDom.querySelectorAll('block');
      if (blocks.length === 0) {
        alert("⚠️ Die Datei enthält keine Blöcke.");
        return;
      }

      workspace.clear();
      Blockly.Xml.domToWorkspace(xmlDom, workspace);
      stepsInitialized = false;
      mazeReset();

    };
    reader.readAsText(file);
  });

  // Labyrinth laden 
  document.getElementById('mazeInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = mazeFileRead;
    reader.readAsText(file);
  });


});

//Funktion zum Labyrinthladen aus GUI
function loadMaze() {
  document.getElementById('mazeInput').click();
}

//Funktion zum Labyrinthladen aus EventListener
function mazeFileRead(e) {
  let data;
  try {
    data = JSON.parse(e.target.result);
  } catch (err) {
    return alert('Ungültiges JSON: ' + err.message);
  }
  if (
    !Array.isArray(data.grid) ||
    typeof data.player?.x !== 'number' ||
    typeof data.player?.y !== 'number' ||
    typeof data.player?.dir !== 'number' ||
    typeof data.goal?.x !== 'number' ||
    typeof data.goal?.y !== 'number' ||
    typeof data.max_blocks !== 'number'
  ) {
    return alert('⚠️ Fehlerhaftes Labyrinth-Format!');
  }
  maze.grid = data.grid;
  maze.player = { ...data.player };
  maze.goal = { ...data.goal };
  MAX_BLOCKS = data.max_blocks;
  startGrid = JSON.parse(JSON.stringify(data.grid));   // tiefe Kopie
  startGoal = { ...data.goal };
  Object.assign(startState, data.player);
  mazeReset();
}

// Blockly initialisieren
function initBlockly() {
  workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox'),
    trashcan: false,
    zoom: { controls: true, wheel: false, startScale: 0.8 },
    scrollbars: true,
    renderer: 'zelos',
    theme: Blockly.Themes.Classic
  });

}

// Reset-Funktionen
function stoppAll() {
  resetHighlight();
  mazeReset();
  currentSteps = [];
  stepsInitialized = false;
}

//Quelltext resetten
function resetProgram() {
  stoppAll();
  workspace.clear();
  const xmlDom = Blockly.utils.xml.textToDom(defaultProgramXml);
  Blockly.Xml.domToWorkspace(xmlDom, workspace);
  //addStartBlock();
  if (startGrid) {
    maze.grid = JSON.parse(JSON.stringify(startGrid));
  }
  if (startGoal) {
    maze.goal = { ...startGoal };
  }
}

// Entfernt alle Hervorhebungen
function resetHighlight() {
  workspace.highlightBlock(null);
}

// Projekt speichern
async function saveProject() {
  const xml = Blockly.Xml.workspaceToDom(workspace);
  sanitizeBlockIds(xml);
  const xmlText = Blockly.Xml.domToPrettyText(xml);

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'Labyrinth.xml',
        types: [{
          description: 'Blockly Programmdatei',
          accept: { 'text/xml': ['.xml'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(xmlText);
      await writable.close();
      return;
    } catch (err) {
      if (err.name !== 'AbortError') {
        alert('❌ Fehler beim Speichern:\n' + err.message);
      }
      return;
    }
  }

  // Fallback für Firefox:
  let filename = prompt('Dateiname für das Programm:', 'Labyrinth.xml');
  if (!filename) return;
  if (!filename.toLowerCase().endsWith('.xml')) filename += '.xml';

  const blob = new Blob([xmlText], { type: 'text/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Projekt laden (öffnet Dateiauswahl)
function loadProject() {
  document.getElementById('xmlInput').click();
}

//Initialisierung Durchlauf
function runInit() {
  // Vor jedem neuen Durchlauf Zeichenfläche und Schritte initialisieren
  stoppAll();

  // Blöcke zählen und ggf. abbrechen
  const allBlocks = workspace.getAllBlocks(false).filter(b => !b.isShadow());
  if (allBlocks.length - 1 > MAX_BLOCKS) {
    alert(`⚠️ Zu viele Blöcke!\nMaximal sind ${MAX_BLOCKS} erlaubt, du hast ${allBlocks.length - 1} verwendet.`);
    return;  // Ausführen abbrechen
  }
  // BlocklyGenerator initialisieren
  Blockly.JavaScript.init(workspace);
  Blockly.JavaScript.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
  Blockly.JavaScript.addReservedWords('highlightBlock');

  // Code ab Startblock generieren
  const start = workspace.getTopBlocks(true).find(b => b.type === 'maze_start');
  if (!start) {
    alert('⚠️ Kein Startblock!');
    return;
  }
  // JS-Code ab Startblock generieren
  let code = Blockly.JavaScript.blockToCode(start);
  // Schleifen entrollen, damit jede Iteration einzeln mit Pause ausgeführt wird
  code = unrollLoops(code);
  // In einzelne Befehle zerlegen
  currentSteps = code.split('\n').map(line => line.trim()).filter(Boolean);
}

// Einzelschrittbetrieb 
function startStep() {
  if (!stepsInitialized) {
    runInit();
    stepsInitialized = true;
  }

  if (currentSteps.length > 0) {
    const chunk = currentSteps.shift();
    try {
      eval(chunk);
    } catch (e) {
      alert('❌ Fehler bei Anweisung:\n' + chunk + '\n' + e.message);
      stoppAll();
      stepsInitialized = false;
      currentSteps = [];
    }
  } else {
    const msg = mazeZiel()
      ? '✅ Ziel erreicht.'
      : 'Programm beendet.';
    alert(msg);
    resetHighlight();
    stepsInitialized = false;
  }
}

// Durchlaufbetrieb 
function startRun() {
  runInit();
  runRun();
}

// Ausführung der Chunks mit Pause
function runRun() {
  if (currentSteps.length === 0) {
    // erst ganz am Ende prüfen
    const msg = mazeZiel()
      ? '✅ Ziel erreicht.'
      : 'Programm beendet.';
    alert(msg);
    resetHighlight();
    return;
  }

  const chunk = currentSteps.shift();
  try {
    eval(chunk);
  } catch (e) {
    if (e.message === 'Collision') {
      // Abbruch bei Kollision
      resetHighlight();
      return;
    }
    alert('❌ Fehler im Programm:\n' + e.message);
    mazeReset();
    currentSteps = [];
    return;
  }

  const slider = document.getElementById('timeoutSlider');
  const delay = (105 - (parseInt(slider.value, 10) || 50)) * 10;
  setTimeout(runRun, delay);
}


//Hilfsfunktion zum Auspacken der Befehle
function unrollLoops(code) {
  const headerRe = /for\s*\(\s*(?:let|var)\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\d+);\s*\1\+\+\)\s*{/g;
  let last, m;
  while ((m = headerRe.exec(code)) !== null) {
    last = { match: m, index: m.index };
  }
  if (!last) {
    return code
      .split('\n')
      .filter(line => line.trim() !== '')
      .join('\n');
  }
  const { match, index } = last;
  const count = Number(match[2]);
  const startBody = index + match[0].length;
  let depth = 1, i = startBody;
  while (depth > 0 && i < code.length) {
    const ch = code[i];
    if (ch === '"' || ch === "'") {
      const quote = ch; i++;
      while (i < code.length && (code[i] !== quote || code[i - 1] === '\\')) {
        i++;
      }
      i++;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  if (depth !== 0) throw new Error("Klammer-Mismatch beim Unrollen");
  const rawBody = code.slice(startBody, i - 1);
  const body = unrollLoops(rawBody);
  const before = code.slice(0, index);
  const after = code.slice(i);
  const expanded = Array(count).fill(body).join('\n');
  return unrollLoops(before + expanded + after);
}

// Neu laden Button (reload)
function reloadAll() {
  location.reload();
}

function sanitizeBlockIds(xmlDom) {
  const usedIds = new Set();
  const blocks = xmlDom.querySelectorAll('block[id]');
  blocks.forEach((block, i) => {
    const newId = `b${i}_${Date.now()}`;
    usedIds.add(newId);
    block.setAttribute('id', newId);
  });
}
