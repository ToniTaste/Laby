Blockly.defineBlocksWithJsonArray([
  {
    "type": "maze_start",
    "hidden": true,
    "message0": "Start",
    "message1": "%1",
    "args1": [
      {
        "type": "input_statement",
        "name": "NEXT"
      }
    ],
    "colour": "FFBF00",
    "tooltip": "Startpunkt des Programms",
    "helpUrl": ""
  }
  ,
  {
    "type": "maze_move",
    "message0": "gehe vorwärts",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "4C97FF",
    "tooltip": "Geht einen Schritt in Blickrichtung.",
    "helpUrl": ""
  },
  {
    "type": "maze_turn",
    "message0": "drehe %1",
    "args0": [
      { "type": "field_dropdown", "name": "DIR", "options": [["links", "LEFT"], ["rechts", "RIGHT"]] }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "4C97FF",
    "tooltip": "Dreht die Figur nach rechts.",
    "helpUrl": ""
  },
  {
    "type": "custom_repeat",
    "message0": "wiederhole %1 mal",
    "args0": [
      {
        "type": "field_number",
        "name": "TIMES",
        "value": 3,
        "min": 0,
        "max": 40,
        "precision": 1
      }
    ],
    "message1": "%1",
    "args1": [
      {
        "type": "input_statement",
        "name": "DO"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#FFAB19",
    "tooltip": "Wiederholt die Befehle im inneren der Schleife",
    "helpUrl": ""
  }
]);
