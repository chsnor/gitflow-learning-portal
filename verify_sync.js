const fs = require('fs');
const path = require('path');

const SOURCE_DIR = 'D:/git_flowcahrt';
const PORTAL_DIR = 'D:/gitflow_learning_portal';

const code = fs.readFileSync(path.join(PORTAL_DIR, 'data-code.js'), 'utf8');

const FILE_MAP = [
  ['RAW_PIPELINE', 'src/lib/pipeline.ts'],
  ['RAW_ROUTE', 'src/app/api/analyze/route.ts'],
  ['RAW_PARSER', 'src/lib/parser.ts'],
  ['RAW_GENERATOR', 'src/lib/generator.ts'],
  ['RAW_PAGE', 'src/app/page.tsx'],
  ['RAW_FLOWEXPLORER', 'src/components/FlowExplorer.tsx'],
  ['RAW_UIHELPER', 'src/lib/ui-helper.ts'],
  ['RAW_CODEVIEWER', 'src/lib/code-viewer.ts'],
  ['RAW_FLOWCANVAS', 'src/components/FlowCanvas.tsx'],
  ['RAW_SIDEDRAWER', 'src/components/SideDrawer.tsx'],
  ['RAW_LAYOUT', 'src/app/layout.tsx'],
  ['RAW_TYPES', 'src/types/index.ts'],
  ['RAW_GLOBALS', 'src/app/globals.css'],
  ['RAW_GITHUB', 'src/lib/github.ts'],
];

const evaluatedObj = eval(code + ';\n({ ' + FILE_MAP.map(f => f[0]).join(', ') + ' })');

let allMatch = true;
for (const [varName, filePath] of FILE_MAP) {
  const evaluated = evaluatedObj[varName];
  const disk = fs.readFileSync(path.join(SOURCE_DIR, filePath), 'utf8');
  const normEval = evaluated.replace(/\r\n/g, '\n');
  const normDisk = disk.replace(/\r\n/g, '\n');
  const match = normEval === normDisk;
  console.log(`${varName.padEnd(18)} -> ${filePath.padEnd(35)} : ${match ? '✓ 100% MATCH' : '✗ MISMATCH'}`);
  if (!match) allMatch = false;
}

console.log('\nOVERALL RESULT: ' + (allMatch ? 'SUCCESS (ALL 14 FILES MATCH 100%)' : 'FAILURE'));
process.exit(allMatch ? 0 : 1);
