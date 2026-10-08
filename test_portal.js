/**
 * Test Suite สำหรับเว็บพอร์ทัลการเรียนรู้ GitFlow (GitFlow Learning Portal)
 * ตรวจสอบ:
 * 1. ความสมบูรณ์ของโครงสร้างไฟล์และ HTML/CSS
 * 2. กฎเหล็กที่ 5: การประเมินผล JavaScript และปราศจาก Syntax Error / Unescaped String
 * 3. ความตรงกันของซอร์สโค้ดจริง 14 ไฟล์ (100% Code Parity กับ D:\git_flowcahrt)
 * 4. สารบัญฟังก์ชันจริงทั้งหมด (ALL_FUNCTIONS_DIRECTORY)
 * 5. เนื้อหาเจาะลึก GitHub API Handshake (ส่งอะไรไป ⇄ ส่งอะไรกลับ)
 * 6. เนื้อหาเจาะลึก 6 โฟลว์ปฏิสัมพันธ์ของผู้ใช้ (User Interaction Flows)
 * 7. สถาปัตยกรรมระบบ 7 ชั้น (ARCH_LAYERS)
 * 8. ไทม์ไลน์จำลองระบบ 15 สเต็ป (SIM_STEPS)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORTAL_DIR = __dirname;
const SOURCE_DIR = 'D:/git_flowcahrt';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ name, error: err.message });
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function evaluateScript(filename, returnVarNames = []) {
  const code = fs.readFileSync(path.join(PORTAL_DIR, filename), 'utf8');
  return eval(code + ';\n({ ' + returnVarNames.join(', ') + ' })');
}

console.log('================================================================');
console.log('🧪 TEST SUITE: GITFLOW LEARNING PORTAL (PRE-DELIVERY AUDIT)');
console.log('================================================================\n');

// ----------------------------------------------------
// หมวด 1: โครงสร้างไฟล์และการอ้างอิงใน index.html
// ----------------------------------------------------
console.log('📦 หมวด 1: โครงสร้างไฟล์และทรัพยากรหน้าเว็บ (Static Assets & DOM)');

test('1.1 index.html มีอยู่จริงและมีขนาดสมบูรณ์', () => {
  const htmlPath = path.join(PORTAL_DIR, 'index.html');
  assert(fs.existsSync(htmlPath), 'index.html ไม่พบในไดเรกทอรี');
  assert(fs.statSync(htmlPath).size > 15000, 'index.html มีขนาดเล็กผิดปกติ');
});

test('1.2 ไฟล์ CSS ทั้งหมดมีอยู่จริงและขนาดสมบูรณ์', () => {
  const cssPath = path.join(PORTAL_DIR, 'style.css');
  assert(fs.existsSync(cssPath), 'style.css ไม่พบในไดเรกทอรี');
  assert(fs.statSync(cssPath).size > 40000, 'style.css มีขนาดเล็กผิดปกติ');
});

test('1.3 สคริปต์ที่ index.html โหลดทั้ง 6 ไฟล์มีอยู่จริงบนดิสก์', () => {
  const html = fs.readFileSync(path.join(PORTAL_DIR, 'index.html'), 'utf8');
  const requiredScripts = [
    'data-code.js',
    'data-content.js',
    'data-arch.js',
    'data-defense.js',
    'data-fndex.js',
    'app.js',
  ];
  requiredScripts.forEach(script => {
    assert(html.includes(script), `index.html ไม่ได้โหลด ${script}`);
    assert(fs.existsSync(path.join(PORTAL_DIR, script)), `ไฟล์ ${script} หายไปจากดิสก์`);
  });
});

// ----------------------------------------------------
// หมวด 2: กฎเหล็กที่ 5 และ Syntax Validation
// ----------------------------------------------------
console.log('\n⚙️ หมวด 2: กฎเหล็กที่ 5 และการตรวจสอบ Syntax JS ผ่าน Node.js Engine');

const JS_FILES = [
  'app.js',
  'data-arch.js',
  'data-code.js',
  'data-content.js',
  'data-defense.js',
  'data-fndex.js',
];

JS_FILES.forEach(file => {
  test(`2.1 Syntax check: node --check ${file} ผ่าน 0 error`, () => {
    try {
      execSync(`node --check ${file}`, { cwd: PORTAL_DIR, stdio: 'pipe' });
    } catch (e) {
      throw new Error(`Syntax Error ใน ${file}: ${e.message}`);
    }
  });
});

// ----------------------------------------------------
// หมวด 3: โค้ดดิบ 14 ไฟล์ตรงกับโปรเจกต์จริง 100% (Source Parity)
// ----------------------------------------------------
console.log('\n🔍 หมวด 3: ตรวจสอบความถูกต้องของซอร์สโค้ดจริง 14 ไฟล์ (100% Code Parity)');

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

const codeScope = evaluateScript('data-code.js', FILE_MAP.map(f => f[0]));

FILE_MAP.forEach(([varName, relPath]) => {
  test(`3.1 ${varName} ใน data-code.js ตรงกับ ${relPath} 100% (ไม่มีเพี้ยนแม้แต่อักขระเดียว)`, () => {
    const memCode = codeScope[varName];
    assert(typeof memCode === 'string', `${varName} ไม่ใช่ string`);
    const diskPath = path.join(SOURCE_DIR, relPath);
    assert(fs.existsSync(diskPath), `ไม่พบไฟล์ต้นฉบับ: ${diskPath}`);
    const diskCode = fs.readFileSync(diskPath, 'utf8');
    const normMem = memCode.replace(/\r\n/g, '\n');
    const normDisk = diskCode.replace(/\r\n/g, '\n');
    assert(normMem === normDisk, `ข้อมูลใน ${varName} ไม่ตรงกับไฟล์จริง ${relPath}`);
  });
});

// ----------------------------------------------------
// หมวด 4: ตรวจสอบสารบัญฟังก์ชันจริงทั้งหมด (ALL_FUNCTIONS_DIRECTORY)
// ----------------------------------------------------
console.log('\n📚 หมวด 4: ตรวจสอบสารบัญฟังก์ชัน (All Functions Directory)');

const fndexScope = evaluateScript('data-fndex.js', ['ALL_FUNCTIONS_DIRECTORY']);
const fns = fndexScope.ALL_FUNCTIONS_DIRECTORY;

test('4.1 ดัชนีฟังก์ชันมีข้อมูลฟังก์ชันจริงครบถ้วน (40 ฟังก์ชันหลัก)', () => {
  assert(Array.isArray(fns), 'ALL_FUNCTIONS_DIRECTORY ไม่ใช่อาร์เรย์');
  assert(fns.length >= 40, `จำนวนฟังก์ชันน้อยกว่าที่คาดการณ์ (${fns.length}/40)`);
});

test('4.2 ไม่มีฟังก์ชันที่ชื่อและไฟล์ซ้ำกันโดยไม่ตั้งใจ', () => {
  const seen = new Set();
  fns.forEach((fn, idx) => {
    const key = `${fn.filePath}:${fn.name}`;
    assert(!seen.has(key), `พบฟังก์ชันซ้ำซ้อน: ${key} ที่ลำดับ ${idx}`);
    seen.add(key);
  });
});

test('4.3 ทุกฟังก์ชันมีฟิลด์คำอธิบายลึก, บทเปรียบเทียบ Python, และโค้ดสั้นครบถ้วน', () => {
  fns.forEach(fn => {
    assert(fn.name, `ฟังก์ชันไม่มี name: ${JSON.stringify(fn)}`);
    assert(fn.filePath, `ฟังก์ชันไม่มี filePath: ${fn.name}`);
    assert(fn.desc, `ฟังก์ชันไม่มี desc: ${fn.name}`);
    assert(fn.deepExplain, `ฟังก์ชันไม่มี deepExplain: ${fn.name}`);
    assert(fn.pythonAnalogy, `ฟังก์ชันไม่มี pythonAnalogy: ${fn.name}`);
    assert(fn.snippet, `ฟังก์ชันไม่มี snippet: ${fn.name}`);
  });
});

test('4.4 ทุกฟังก์ชันอ้างอิงไฟล์ที่มีอยู่จริงใน src/', () => {
  fns.forEach(fn => {
    const fullPath = path.join(SOURCE_DIR, fn.filePath);
    assert(fs.existsSync(fullPath), `ฟังก์ชัน ${fn.name} อ้างถึงไฟล์ที่ไม่มีอยู่จริง: ${fn.filePath}`);
  });
});

// ----------------------------------------------------
// หมวด 5: เจาะลึกโปรโตคอล GitHub API Handshake (ส่งอะไรไป ⇄ ส่งอะไรกลับ)
// ----------------------------------------------------
console.log('\n📡 หมวด 5: ตรวจสอบเนื้อหา GitHub API Handshake (เราส่งอะไรไป ⇄ ส่งอะไรคืนมา)');

const defenseScope = evaluateScript('data-defense.js', ['DEFENSE_DEEP']);
const defenseCards = defenseScope.DEFENSE_DEEP;

test('5.1 มีการ์ด github_handshake อยู่ในการ์ดตอบอาจารย์ (DEFENSE_DEEP)', () => {
  const card = defenseCards.find(c => c.id === 'github_handshake');
  assert(card, 'ไม่พบการ์ด github_handshake ใน DEFENSE_DEEP');
  assert(card.q.includes('GitHub') && card.q.includes('ส่งอะไรไป'), 'หัวข้อคำถามไม่ตรงกับที่ระบุ');
});

test('5.2 การ์ดระบุรายละเอียด Client Request ชัดเจน (Endpoint, Parameters, Headers)', () => {
  const card = defenseCards.find(c => c.id === 'github_handshake');
  const fullText = JSON.stringify(card);
  assert(fullText.includes('/repos/{owner}/{repo}/git/trees/{branch}?recursive=1'), 'ขาด Trees API Endpoint หรือพารามิเตอร์ recursive=1');
  assert(fullText.includes('User-Agent: GitFlow-Visualizer'), 'ขาด Header User-Agent');
  assert(fullText.includes('Authorization: Bearer'), 'ขาด Header Authorization');
});

test('5.3 การ์ดระบุรายละเอียด GitHub API Response ชัดเจน (HTTP Status, JSON Schema, Fields)', () => {
  const card = defenseCards.find(c => c.id === 'github_handshake');
  const fullText = JSON.stringify(card);
  assert(fullText.includes('200 OK'), 'ขาดสถานะ 200 OK');
  assert(fullText.includes('401') && fullText.includes('403') && fullText.includes('404'), 'ขาดรหัสข้อผิดพลาด 401/403/404');
  assert(fullText.includes('sha') && fullText.includes('tree') && fullText.includes('truncated'), 'ขาด Schema Fields: sha, tree, truncated');
  assert(fullText.includes('blob') && fullText.includes('tree') && fullText.includes('size'), 'ขาด รายละเอียดสมาชิกใน tree: blob/tree/size');
});

test('5.4 การ์ดระบุกลไก Raw CDN Fetching และ Branch Fallback ครบถ้วน', () => {
  const card = defenseCards.find(c => c.id === 'github_handshake');
  const fullText = JSON.stringify(card);
  assert(fullText.includes('raw.githubusercontent.com'), 'ขาด Raw CDN domain');
  assert(fullText.includes('45'), 'ขาดการระบุเพดาน 45 ไฟล์แรก');
  assert(fullText.includes('AbortSignal.timeout(4000)'), 'ขาดรายละเอียด Timeout 4000ms');
  assert(fullText.includes('master'), 'ขาดรายละเอียด Fallback ไปยังกิ่ง master');
});

// ----------------------------------------------------
// หมวด 6: 6 โฟลว์การมีปฏิสัมพันธ์ของผู้ใช้ (User Interaction Flows)
// ----------------------------------------------------
console.log('\n🖱️ หมวด 6: ตรวจสอบเนื้อหา User Interaction Flows (6 โฟลว์หลัก)');

test('6.1 มีการ์ด interaction_flows อยู่ในการ์ดตอบอาจารย์ (DEFENSE_DEEP)', () => {
  const card = defenseCards.find(c => c.id === 'interaction_flows');
  assert(card, 'ไม่พบการ์ด interaction_flows ใน DEFENSE_DEEP');
  assert(card.q.includes('User Interaction Flows'), 'หัวข้อคำถามไม่ตรงกับที่ระบุ');
});

test('6.2 การ์ดระบุครบทั้ง 6 โฟลว์การโต้ตอบของผู้ใช้อย่างละเอียด', () => {
  const card = defenseCards.find(c => c.id === 'interaction_flows');
  const fullText = JSON.stringify(card);
  assert(fullText.includes('BFS Trace') && fullText.includes('computeTracePath'), 'ขาดโฟลว์ที่ 1: BFS Trace');
  assert(fullText.includes('Trace Mode') && fullText.includes('1 ก้าว'), 'ขาดโฟลว์ที่ 2: สลับโหมด');
  assert(fullText.includes('Side Drawer') && fullText.includes('300 บรรทัด'), 'ขาดโฟลว์ที่ 3: ส่องโค้ดดิบ');
  assert(fullText.includes('Node Search') && fullText.includes('setCenter'), 'ขาดโฟลว์ที่ 4: ค้นหาโหนด');
  assert(fullText.includes('URL') && fullText.includes('URLSearchParams'), 'ขาดโฟลว์ที่ 5: แชร์สถานะผ่าน URL');
  assert(fullText.includes('Filtering') && fullText.includes('useMemo'), 'ขาดโฟลว์ที่ 6: ตัวกรองชนิดไฟล์');
});

// ----------------------------------------------------
// หมวด 7: สถาปัตยกรรมระบบ 7 ชั้น (ARCH_LAYERS)
// ----------------------------------------------------
console.log('\n🏛️ หมวด 7: ตรวจสอบสถาปัตยกรรมระบบ 7 ชั้น (Architecture Layers)');

const archScope = evaluateScript('data-arch.js', ['ARCH_LAYERS']);
const layers = archScope.ARCH_LAYERS;

test('7.1 ระบบมีโครงสร้างสถาปัตยกรรมครบทั้ง 7 ชั้น', () => {
  assert(Array.isArray(layers), 'ARCH_LAYERS ไม่ใช่อาร์เรย์');
  assert(layers.length === 7, `จำนวนชั้นไม่เท่ากับ 7 (ได้ ${layers.length})`);
});

test('7.2 ชั้นที่ 1 บรรจุข้อกำหนดการดึงข้อมูลจาก Trees API และ Raw CDN', () => {
  const layer1 = layers[0];
  assert(layer1.n === 1, 'ชั้นแรกไม่ใช่หมายเลข 1');
  const fullText = JSON.stringify(layer1);
  assert(fullText.includes('Trees API') && fullText.includes('raw.githubusercontent.com'), 'ชั้นที่ 1 ขาด Trees API หรือ Raw CDN');
});

test('7.3 ชั้นที่ 7 บรรจุข้อกำหนดโฟลว์การโต้ตอบของผู้ใช้ (User Interaction Flows)', () => {
  const layer7 = layers[6];
  assert(layer7.n === 7, 'ชั้นสุดท้ายไม่ใช่หมายเลข 7');
  const fullText = JSON.stringify(layer7);
  assert(fullText.includes('Interaction Flows') || fullText.includes('โฟลว์การโต้ตอบ'), 'ชั้นที่ 7 ขาด Interaction Flows');
});

// ----------------------------------------------------
// หมวด 8: ไทม์ไลน์จำลองระบบ 15 สเต็ป (SIM_STEPS)
// ----------------------------------------------------
console.log('\n⏱️ หมวด 8: ตรวจสอบไทม์ไลน์จำลองระบบ 15 สเต็ป (Simulation Steps)');

const contentScope = evaluateScript('data-content.js', ['SIM_STEPS', 'SIM_JUMPS']);
const simSteps = contentScope.SIM_STEPS;
const simJumps = contentScope.SIM_JUMPS;

test('8.1 ไทม์ไลน์มีขั้นตอนครบทั้ง 15 สเต็ป', () => {
  assert(Array.isArray(simSteps), 'SIM_STEPS ไม่ใช่อาร์เรย์');
  assert(simSteps.length === 15, `จำนวนสเต็ปไม่เท่ากับ 15 (ได้ ${simSteps.length})`);
  assert(Object.keys(simJumps).length === 15, `จำนวน SIM_JUMPS ไม่ครบ 15 สเต็ป`);
});

test('8.2 สเต็ปที่ 7 มีกล่องเจาะลึกโปรโตคอล (เราส่งอะไรไป ⇄ GitHub ส่งอะไรกลับมา)', () => {
  const step7 = simSteps[6];
  assert(step7 && step7.n === 7, 'สเต็ปที่ 7 ไม่ถูกต้อง');
  assert(step7.detail.includes('เจาะลึกโปรโตคอล') || step7.detail.includes('GitHub Tree API'), 'สเต็ปที่ 7 ขาดเนื้อหาโปรโตคอล API');
  assert(step7.detail.includes('เราส่งอะไรไป') && step7.detail.includes('GitHub ส่งอะไรกลับมา'), 'สเต็ปที่ 7 ขาดการแจกแจงสองฝั่ง');
});

test('8.3 สเต็ปที่ 12-15 ครอบคลุมการโต้ตอบของผู้ใช้ (BFS, Drawer, Search, Filters)', () => {
  const step12 = simSteps[11];
  const step13 = simSteps[12];
  const step14 = simSteps[13];
  const step15 = simSteps[14];

  assert(step12.detail.includes('BFS') || step12.title.includes('BFS'), 'สเต็ป 12 ขาด BFS Trace');
  assert(step13.detail.includes('Drawer') || step13.title.includes('Drawer'), 'สเต็ป 13 ขาด Drawer');
  assert(step14.detail.includes('Search') || step14.title.includes('ค้นหา') || step14.detail.includes('Finder'), 'สเต็ป 14 ขาด Search/Finder');
  assert(step15.detail.includes('Filter') || step15.title.includes('กรอง'), 'สเต็ป 15 ขาด Filter');
});

// ----------------------------------------------------
// สรุปผลการทดสอบ
// ----------------------------------------------------
console.log('\n================================================================');
console.log(`📊 ผลการรันชุดทดสอบ (Test Results Summary):`);
console.log(`   - ผ่านทั้งหมด (Passed): ${passedTests} / ${totalTests} การทดสอบ`);
console.log(`   - ล้มเหลว (Failed): ${failedTests} การทดสอบ`);
console.log('================================================================');

if (failedTests > 0) {
  console.log('\n❌ รายการที่ไม่ผ่าน:');
  failures.forEach((f, i) => console.log(`   ${i + 1}. [${f.name}] → ${f.error}`));
  process.exit(1);
} else {
  console.log('\n🎉 สรุป: การตรวจสอบผ่าน 100% ทุกชุดการทดสอบ พร้อมส่งมอบ!');
  process.exit(0);
}
