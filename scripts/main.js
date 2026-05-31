// main.js

//lokale Variablen und Konstanten
let workspace;
let currentSteps = [];
let stepsInitialized = false;
let MAX_BLOCKS = 10;
let startGrid = null;
let startGoal = null;
let runTimer = null;

//------------------------------------------------------------------
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
        }))).catch(() => alert('Fehler beim Laden der Bilder'));
		
const [imgTreasure, imgRobot, imgBrickwall] = imgs;
//------------------------------------------------------------------
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
	
	updateBlockLimitInfo();

    // Datei-Ladebereich für Projekt
    document.getElementById('xmlInput').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file)
            return;
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

            const startBlocks = xmlDom.querySelectorAll('block[type="maze_start"]');

            if (startBlocks.length === 0) {
                alert("⚠️ Die Datei enthält keinen Startblock.");
                return;
            }

            if (startBlocks.length > 1) {
                alert("⚠️ Die Datei enthält mehrere Startblöcke.");
                return;
            }

            workspace.clear();
            Blockly.Xml.domToWorkspace(xmlDom, workspace);

            const startBlock = getStartBlock();
            if (startBlock) {
                startBlock.setDeletable(false);
                startBlock.setMovable(false);
            }

            stepsInitialized = false;
            mazeReset();
			updateBlockLimitInfo();

        };
        reader.readAsText(file);
    });

    // Labyrinth laden
    document.getElementById('mazeInput').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file)
            return;
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
        typeof data.max_blocks !== 'number') {
        return alert('⚠️ Fehlerhaftes Labyrinth-Format!');
    }
    maze.grid = data.grid;
    maze.player = {
        ...data.player
    };
    maze.goal = {
        ...data.goal
    };
    MAX_BLOCKS = data.max_blocks;
    startGrid = JSON.parse(JSON.stringify(data.grid)); // tiefe Kopie
    startGoal = {
        ...data.goal
    };
    Object.assign(startState, data.player);
    mazeReset();
	updateBlockLimitInfo();
}

const labyTheme = Blockly.Theme.defineTheme('labyTheme', {
    base: Blockly.Themes.Classic,
    blockStyles: {
        start_blocks: {
            colourPrimary: '#FFBF00',
            hat: 'cap'
        },
        command_blocks: {
            colourPrimary: '#4C97FF'
        },
        loop_blocks: {
            colourPrimary: '#FFAB19'
        }
    }
});
// Blockly initialisieren
function initBlockly() {
    workspace = Blockly.inject('blocklyDiv', {
        toolbox: document.getElementById('toolbox'),
        trashcan: false,
        zoom: {
            controls: true,
            wheel: false,
            startScale: 0.8
        },
        scrollbars: true,
        renderer: 'zelos',
        theme: labyTheme
    });
	
    workspace.addChangeListener(function (event) {
        if (
            event.type === Blockly.Events.BLOCK_CREATE ||
            event.type === Blockly.Events.BLOCK_DELETE ||
            event.type === Blockly.Events.BLOCK_MOVE ||
            event.type === Blockly.Events.BLOCK_CHANGE
        ) {
            updateBlockLimitInfo();
        }
    });
}

// Reset-Funktionen
function stoppAll() {
    if (runTimer !== null) {
        clearTimeout(runTimer);
        runTimer = null;
    }
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
        maze.goal = {
            ...startGoal
        };
    }
	updateBlockLimitInfo();
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
                        accept: {
                            'text/xml': ['.xml']
                        }
                    }
                ]
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
    if (!filename)
        return;
    if (!filename.toLowerCase().endsWith('.xml'))
        filename += '.xml';

    const blob = new Blob([xmlText], {
        type: 'text/xml'
    });
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

    // Startblock suchen und prüfen
    const start = getStartBlock();
    if (!start) {
        return false;
    }

    // Nur die wirklich erreichbaren Blöcke unterhalb des Startblocks zählen
    const firstBlock = start.getNextBlock();
    const blockCount = countReachableBlocks(firstBlock);

    if (blockCount > MAX_BLOCKS) {
        alert(`⚠️ Zu viele Blöcke!\nMaximal sind ${MAX_BLOCKS} erlaubt, du hast ${blockCount} verwendet.`);
        return false;
    }

    // BlocklyGenerator initialisieren
    Blockly.JavaScript.init(workspace);
    Blockly.JavaScript.addReservedWords('highlightBlock');

    // Code erst ab dem ersten Block unterhalb des Startblocks erzeugen
    let code = firstBlock ? Blockly.JavaScript.blockToCode(firstBlock) : '';

    // Schleifen entrollen, damit jede Iteration einzeln mit Pause ausgeführt wird
    code = unrollLoops(code);

    // Highlight und eigentliche Anweisung bilden gemeinsam einen Schritt.
    currentSteps = buildExecutionSteps(code);

    return true;
}

function getStartBlock() {
    const startBlocks = workspace
        .getAllBlocks(false)
        .filter(block => block.type === 'maze_start');

    if (startBlocks.length === 0) {
        alert('⚠️ Kein Startblock!');
        return null;
    }

    if (startBlocks.length > 1) {
        alert('⚠️ Es gibt mehrere Startblöcke!');
        return null;
    }

    const start = startBlocks[0];

    if (start.getPreviousBlock()) {
        alert('⚠️ Der Startblock darf nicht an einen anderen Block angehängt sein.');
        return null;
    }

    return start;
}

function countReachableBlocks(block) {
    if (!block || block.isShadow()) {
        return 0;
    }

    let count = 1;

    // Blöcke in Statement-Eingängen mitzählen,
    // z. B. Befehle im Inneren einer Wiederholung.
    for (const input of block.inputList) {
        const child = input.connection?.targetBlock();
        if (child) {
            count += countReachableBlocks(child);
        }
    }

    // Den nächsten Block in der Kette mitzählen.
    const next = block.getNextBlock();
    if (next) {
        count += countReachableBlocks(next);
    }

    return count;
}

function getCurrentProgramBlockCount() {
    if (!workspace) {
        return 0;
    }

    const start = workspace
        .getAllBlocks(false)
        .find(block => block.type === 'maze_start');

    if (!start) {
        return 0;
    }

    return countReachableBlocks(start.getNextBlock());
}

function updateBlockLimitInfo() {
    const info = document.getElementById('blockLimitInfo');

    if (!info) {
        return;
    }

    const usedBlocks = getCurrentProgramBlockCount();
    const remainingBlocks = MAX_BLOCKS - usedBlocks;

    info.classList.remove('full', 'exceeded');

    if (remainingBlocks > 0) {
        info.textContent = `Programmspeicher: noch ${remainingBlocks} von ${MAX_BLOCKS} Blöcken frei`;
    } else if (remainingBlocks === 0) {
        info.textContent = `Programmspeicher voll: ${usedBlocks} von ${MAX_BLOCKS} Blöcken verwendet`;
        info.classList.add('full');
    } else {
        info.textContent = `Programmspeicher überschritten: ${usedBlocks} von ${MAX_BLOCKS} Blöcken verwendet`;
        info.classList.add('exceeded');
    }
}

function buildExecutionSteps(code) {
    const lines = code
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    const steps = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (
            line.startsWith('highlightBlock(') &&
            i + 1 < lines.length &&
            !lines[i + 1].startsWith('highlightBlock(')) {
            steps.push(line + '\n' + lines[i + 1]);
            i++;
        } else {
            steps.push(line);
        }
    }

    return steps;
}

// Einzelschrittbetrieb
function startStep() {
    if (!stepsInitialized) {
        if (!runInit())
            return;
        stepsInitialized = true;
    }

    if (currentSteps.length > 0) {
        const chunk = currentSteps.shift();
        try {
            eval(chunk);
        } catch (e) {
            if (e.message === 'Collision') {
                resetHighlight();
                currentSteps = [];
                stepsInitialized = false;
                return;
            }
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
    if (!runInit())
        return;
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
    runTimer = setTimeout(runRun, delay);
    runTimer = null;
}

//Hilfsfunktion zum Auspacken der Befehle
function unrollLoops(code) {
    const headerRe = /for\s*\(\s*(?:let|var)\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\d+);\s*\1\+\+\)\s*{/g;
    let last,
    m;
    while ((m = headerRe.exec(code)) !== null) {
        last = {
            match: m,
            index: m.index
        };
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
    let depth = 1,
    i = startBody;
    while (depth > 0 && i < code.length) {
        const ch = code[i];
        if (ch === '"' || ch === "'") {
            const quote = ch;
            i++;
            while (i < code.length && (code[i] !== quote || code[i - 1] === '\\')) {
                i++;
            }
            i++;
            continue;
        }
        if (ch === '{')
            depth++;
        else if (ch === '}')
            depth--;
        i++;
    }
    if (depth !== 0)
        throw new Error("Klammer-Mismatch beim Unrollen");
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
