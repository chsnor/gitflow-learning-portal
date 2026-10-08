const fs = require('fs');
const path = require('path');

const SOURCE_DIR = 'D:/git_flowcahrt';
const PORTAL_DIR = 'D:/gitflow_learning_portal';

const FILE_MAP = [
  { name: 'RAW_PIPELINE', file: 'src/lib/pipeline.ts' },
  { name: 'RAW_ROUTE', file: 'src/app/api/analyze/route.ts' },
  { name: 'RAW_PARSER', file: 'src/lib/parser.ts' },
  { name: 'RAW_GENERATOR', file: 'src/lib/generator.ts' },
  { name: 'RAW_PAGE', file: 'src/app/page.tsx' },
  { name: 'RAW_FLOWEXPLORER', file: 'src/components/FlowExplorer.tsx' },
  { name: 'RAW_UIHELPER', file: 'src/lib/ui-helper.ts' },
  { name: 'RAW_CODEVIEWER', file: 'src/lib/code-viewer.ts' },
  { name: 'RAW_FLOWCANVAS', file: 'src/components/FlowCanvas.tsx' },
  { name: 'RAW_SIDEDRAWER', file: 'src/components/SideDrawer.tsx' },
  { name: 'RAW_LAYOUT', file: 'src/app/layout.tsx' },
  { name: 'RAW_TYPES', file: 'src/types/index.ts' },
  { name: 'RAW_GLOBALS', file: 'src/app/globals.css' },
  { name: 'RAW_GITHUB', file: 'src/lib/github.ts' },
];

function escapeForTemplateLiteral(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

// Find template literal range for a const NAME = `...`;
function findTemplateRange(content, varName) {
  const prefix = `const ${varName} = `;
  const startIdx = content.indexOf(prefix);
  if (startIdx === -1) return null;

  const btStart = content.indexOf('`', startIdx + prefix.length);
  if (btStart === -1) return null;

  let i = btStart + 1;
  while (i < content.length) {
    if (content[i] === '\\') {
      i += 2;
      continue;
    }
    if (content[i] === '`') {
      // Look ahead for semicolon
      let j = i + 1;
      while (j < content.length && (content[j] === ' ' || content[j] === '\t' || content[j] === '\r' || content[j] === '\n')) {
        if (content[j] === ';') break;
        j++;
      }
      if (content[j] === ';') {
        return {
          start: btStart,
          end: j + 1,
        };
      }
    }
    i++;
  }
  return null;
}

let dataCode = fs.readFileSync(path.join(PORTAL_DIR, 'data-code.js'), 'utf8');

for (const item of FILE_MAP) {
  const srcPath = path.join(SOURCE_DIR, item.file);
  if (!fs.existsSync(srcPath)) {
    console.warn(`[WARN] Source file not found: ${srcPath}`);
    continue;
  }

  const rawCode = fs.readFileSync(srcPath, 'utf8');
  const escaped = escapeForTemplateLiteral(rawCode);
  const replacement = `\`${escaped}\`;`;

  const range = findTemplateRange(dataCode, item.name);
  if (!range) {
    console.error(`[ERROR] Could not find range for ${item.name} in data-code.js`);
    continue;
  }

  dataCode = dataCode.substring(0, range.start) + replacement + dataCode.substring(range.end);
  console.log(`[OK] Updated ${item.name} from ${item.file} (${rawCode.split('\n').length} lines)`);
}

fs.writeFileSync(path.join(PORTAL_DIR, 'data-code.js'), dataCode, 'utf8');
console.log('Successfully written updated data-code.js');
