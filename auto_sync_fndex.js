const fs = require('fs');
const path = require('path');

const SRC_DIR = 'D:/git_flowcahrt/src';

// Read generate_real_fndex.js
const genScript = fs.readFileSync('D:/gitflow_learning_portal/generate_real_fndex.js', 'utf8');

// We can evaluate FILE_MAP from generate_real_fndex.js
const vm = require('vm');
const sandbox = { require, console, __dirname, fs, path };
vm.createContext(sandbox);

// Extract FILE_MAP definition
const mapMatch = genScript.match(/const FILE_MAP = (\[[\s\S]*?\]);\s*\n\s*\/\/ Flatten into/);
if (!mapMatch) {
  console.error('Could not find FILE_MAP in generate_real_fndex.js');
  process.exit(1);
}

const fileMap = eval(mapMatch[1]);

console.log('Verifying and updating function line numbers from real source files:');

let updatedAny = false;

for (const group of fileMap) {
  const fullPath = path.join('D:/git_flowcahrt', group.filePath);
  if (!fs.existsSync(fullPath)) {
    console.error('File not found:', fullPath);
    continue;
  }
  const fileContent = fs.readFileSync(fullPath, 'utf8');
  const lines = fileContent.split('\n');

  for (const fn of group.functions) {
    let foundLine = -1;
    let foundSig = '';

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      // Regex to match function definition or const/export function
      // e.g. function fnName, export function fnName, const fnName =
      const regex1 = new RegExp(`\\bfunction\\s+${fn.name}\\b`);
      const regex2 = new RegExp(`\\bexport\\s+function\\s+${fn.name}\\b`);
      const regex3 = new RegExp(`\\bconst\\s+${fn.name}\\s*=\\s*`);
      const regex4 = new RegExp(`\\bexport\\s+const\\s+${fn.name}\\s*=\\s*`);
      const regex5 = new RegExp(`\\bexport\\s+async\\s+function\\s+${fn.name}\\b`);
      const regex6 = new RegExp(`\\basync\\s+function\\s+${fn.name}\\b`);

      if (regex1.test(lineText) || regex2.test(lineText) || regex3.test(lineText) || 
          regex4.test(lineText) || regex5.test(lineText) || regex6.test(lineText)) {
        foundLine = i + 1;
        foundSig = lineText.trim();
        break;
      }
    }

    if (foundLine !== -1) {
      if (fn.line !== foundLine) {
        console.log(`[LINE CHANGED] ${fn.name} in ${group.filePath}: ${fn.line} -> ${foundLine}`);
        fn.line = foundLine;
        updatedAny = true;
      }
      // If signature changed, let's see
      if (fn.name === 'computeTracePath') {
        fn.signature = "function computeTracePath(selectedNodeId: string | null, edges: FlowEdgeItem[], traceMode: TraceMode = 'full'): { connectedNodeIds: Set<string>; connectedEdgeIds: Set<string> }";
        fn.desc = "คำนวณหาเส้นทางและโหนดที่เกี่ยวข้องกันเมื่อผู้ใช้คลิกเลือกกล่อง ด้วยอัลกอริทึม Breadth-First Search (BFS) พร้อมตัวป้องกันลูป (Visited Set) รองรับทั้งโหมด 1-Step (เพื่อนบ้านติดกัน) และ Full Trace (ทั้งสายงาน)";
        fn.jargon = "• BFS (Breadth-First Search) = การค้นหาแบบกว้าง ทีละระดับชั้น เพื่อหาโหนดที่เชื่อมโยงกันอย่างเป็นระบบ\\n• Visited Set = ตารางจดจำโหนดที่เคยแวะแล้ว ป้องกันไม่ให้โปรแกรมวนลูปไม่รู้จบ (Infinite Loop)\\n• 1-Step vs Full = สลับระหว่างดูเฉพาะเพื่อนบ้านติดกัน 1 ก้าว หรือท่องหาทั้งสายงาน";
        fn.deepExplain = "ถ้าอาจารย์ถามว่า 'ถ้าในโค้ดมีการเรียกแบบวนรอบ (Circular Dependency) เช่น A เรียก B แล้ว B เรียก A ระบบจะค้างไหม?' ตอบว่า: 'ไม่ค้างค่ะ เพราะเราใช้ Visited Set คอยดักจับโหนดที่เคยสำรวจไปแล้ว ทำให้กระบวนการ BFS หยุดทำงานได้ถูกต้อง 100% ค่ะ'";
        fn.pythonAnalogy = "อัลกอริทึม BFS โดยใช้ collections.deque ร่วมกับ visited = set()";
        updatedAny = true;
      }
      if (fn.name === 'sanitizeNodeId') {
        fn.signature = "function sanitizeNodeId(pathStr: string): string";
      }
      if (fn.name === 'inferStructuralRelations') {
        fn.signature = "function inferStructuralRelations(filesWithTypes: Array<{ path: string; fileType: NextFileType }>): CodeRelation[]";
      }
    } else {
      console.log(`[NOT FOUND] ${fn.name} in ${group.filePath}`);
    }
  }
}

// Rebuild generate_real_fndex.js
const updatedScript = genScript.replace(
  /const FILE_MAP = \[[\s\S]*?\];\s*\n\s*\/\/ Flatten into/,
  `const FILE_MAP = ${JSON.stringify(fileMap, null, 2)};\n\n// Flatten into`
);

fs.writeFileSync('D:/gitflow_learning_portal/generate_real_fndex.js', updatedScript, 'utf8');
console.log('Updated generate_real_fndex.js successfully!');
