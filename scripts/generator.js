// generator.js

Blockly.JavaScript.forBlock['maze_start'] = function (block, generator) {
  return generator.statementToCode(block, 'NEXT');
};

Blockly.JavaScript.forBlock['maze_move'] = function (block, generator) {
  return 'mazeMove();\n';
};

Blockly.JavaScript.forBlock['maze_turn'] = function (block, generator) {
  const dir = block.getFieldValue('DIR');
  return `mazeTurn("${dir}");\n`;
};
Blockly.JavaScript.forBlock['custom_repeat'] = function (block, generator) {
  const repeats = block.getFieldValue('TIMES');
  const branch = generator.statementToCode(block, 'DO');
  const code = `for (let i = 0; i < ${repeats}; i++) {\n${branch}}\n`;
  return code;
};
