const fs = require('fs');
const path = require('path');

const SRC_DIR = 'D:/git_flowcahrt/src';

const FILE_OWNERS = {
  'lib/github.ts': { owner: 'คน 1', badge: 'คน 1: GitHub Service', category: 'GitHub Service' },
  'lib/parser.ts': { owner: 'คน 2', badge: 'คน 2: Parser Engine', category: 'Parser Engine' },
  'lib/generator.ts': { owner: 'คน 3', badge: 'คน 3: Flow Generator', category: 'Flow Generator' },
  'components/FlowCanvas.tsx': { owner: 'คน 3', badge: 'คน 3: Flow Canvas (Visualizer)', category: 'Canvas Interaction' },
  'app/page.tsx': { owner: 'คน 4', badge: 'คน 4: Dashboard UI', category: 'Dashboard Page' },
  'components/FlowExplorer.tsx': { owner: 'คน 4', badge: 'คน 4: State Orchestrator', category: 'UI State & Controller' },
  'lib/ui-helper.ts': { owner: 'คน 4', badge: 'คน 4: UI Helper & URL Guard', category: 'UI Helper' },
  'components/SideDrawer.tsx': { owner: 'คน 5', badge: 'คน 5: Side Drawer (Inspector)', category: 'Inspector UI' },
  'lib/code-viewer.ts': { owner: 'คน 5', badge: 'คน 5: Code Viewer (Prism)', category: 'Code Viewer' },
  'app/layout.tsx': { owner: 'คน 4', badge: 'Shared: Root Layout', category: 'Layout' },
  'app/api/analyze/route.ts': { owner: 'คน 6', badge: 'คน 6: API Route', category: 'API Route' },
  'lib/pipeline.ts': { owner: 'คน 6', badge: 'คน 6: Core Pipeline', category: 'Core Pipeline' },
};

function extractFunctions(relPath) {
  const fullPath = path.join(SRC_DIR, relPath);
  if (!fs.existsSync(fullPath)) return [];

  const code = fs.readFileSync(fullPath, 'utf8');
  const lines = code.split('\n');
  const results = [];

  const ownerInfo = FILE_OWNERS[relPath.replace(/\\/g, '/')] || { owner: 'Shared', badge: 'Shared', category: 'Utility' };
  const fileKey = path.basename(relPath, path.extname(relPath)).toLowerCase().replace(/[^a-z0-9]/g, '');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    // Pattern 1: export function foo(...) or function foo(...)
    const fnMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)(?::\s*([^{]+))?/);
    if (fnMatch) {
      const name = fnMatch[1];
      // Skip anonymous or common helper names if needed, but keep actual functions
      results.push({
        name,
        file: fileKey,
        filePath: 'src/' + relPath.replace(/\\/g, '/'),
        line: lineNo,
        owner: ownerInfo.owner,
        badge: ownerInfo.badge,
        category: ownerInfo.category,
        signature: line.trim().replace(/\s*\{.*$/, '').replace(/^export\s+/, ''),
      });
      continue;
    }

    // Pattern 2: const foo = (...) => or const foo = async (...) =>
    const arrowMatch = line.match(/(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\(([^)]*)\)(?::\s*([^=]+))?\s*=>/);
    if (arrowMatch) {
      const name = arrowMatch[1];
      results.push({
        name,
        file: fileKey,
        filePath: 'src/' + relPath.replace(/\\/g, '/'),
        line: lineNo,
        owner: ownerInfo.owner,
        badge: ownerInfo.badge,
        category: ownerInfo.category,
        signature: line.trim().replace(/\s*=>\s*\{?.*$/, '').replace(/^export\s+/, ''),
      });
      continue;
    }

    // Pattern 3: React Functional Component: const Foo: React.FC... or export default function Foo
    const compMatch = line.match(/(?:export\s+(?:default\s+)?)?(?:const|function)\s+([A-Z][a-zA-Z0-9_]+)/);
    if (compMatch && (line.includes('React.') || line.includes(': FC') || line.includes('function ' + compMatch[1]))) {
      const name = compMatch[1];
      if (!results.some(r => r.name === name)) {
        results.push({
          name,
          file: fileKey,
          filePath: 'src/' + relPath.replace(/\\/g, '/'),
          line: lineNo,
          owner: ownerInfo.owner,
          badge: ownerInfo.badge,
          category: ownerInfo.category,
          signature: line.trim().replace(/\s*\{.*$/, '').replace(/^export\s+/, ''),
        });
      }
    }
  }

  return results;
}

const allFns = [];
Object.keys(FILE_OWNERS).forEach(f => {
  const fns = extractFunctions(f);
  allFns.push(...fns);
});

console.log('Total extracted functions:', allFns.length);
allFns.forEach(fn => {
  console.log(`- [${fn.owner}] ${fn.name} (${fn.filePath}:${fn.line})`);
});
