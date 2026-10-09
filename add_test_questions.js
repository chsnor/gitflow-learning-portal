const fs = require('fs');

const content = fs.readFileSync('data-content.js', 'utf8');
const lines = content.split('\n');

const newQuestions = [
  {
    cat: '🧪 การทดสอบ & คุณภาพซอฟต์แวร์',
    q: 'ทำไมในระบบถึงเลือกใช้ Vitest แทนที่จะใช้ Jest เหมือนโปรเจกต์ทั่วไป?',
    a: 'เพราะ Vitest ถูกออกแบบมาสำหรับสถาปัตยกรรม Vite และ Next.js ยุคใหม่โดยตรง มี Native ESM & TypeScript support โดยไม่ต้องผ่าน Babel หรือ ts-jest ที่หนักหน่วง ทำงานได้เร็วกว่าหลายเท่า และแชร์การตั้งค่าโมดูลเดียวกับ Next.js ได้อย่างไร้รอยต่อค่ะ'
  },
  {
    cat: '🧪 การทดสอบ & คุณภาพซอฟต์แวร์',
    q: 'ทดสอบ Integration Pipeline ได้อย่างไรโดยไม่ต้องยิงไปกวน GitHub API จริงและไม่เปลืองโควตา Rate Limit?',
    a: 'เราใช้ Mock Injection Pattern ใน runAnalysisPipeline ค่ะ โดยสามารถส่ง parameter เสริม mockTree และ mockFileContents เข้าไปโดยตรงใน Unit/Integration Test ทำให้ Vitest ทดสอบลอจิกการแกะ Import, สร้างโหนด และคำนวณ Dagre Layout ได้ครบ 100% ภายใน 10-20ms โดยไม่แตะต้อง Network เลยค่ะ'
  },
  {
    cat: '🧪 การทดสอบ & คุณภาพซอฟต์แวร์',
    q: 'ระบบทดสอบ In-Memory Cache ใน pipeline.test.ts อย่างไรว่าแคชได้จริง?',
    a: 'ในการทดสอบ integration test เรายิง runAnalysisPipeline รอบแรกด้วย URL เดิม ระบบจะคำนวณและเก็บลง Cache จากนั้นยิงรอบที่สองด้วย URL เดียวกัน แล้วยืนยันว่าผลลัพธ์รอบสองส่ง flag isCached: true กลับมา และใช้เวลาประมวลผลเป็น 0ms ตามสัญญาของ Bounded LRU Cache ค่ะ'
  },
  {
    cat: '🧪 การทดสอบ & คุณภาพซอฟต์แวร์',
    q: 'ในส่วน UI Helper ทดสอบระบบแชร์ผังผ่าน URL อย่างไรให้มั่นใจว่ารองรับทั้งระบบใหม่และข้อมูลเวอร์ชันเก่า (Backward Compatibility)?',
    a: 'ใน ui-helper.test.ts เราทดสอบทั้งฟังก์ชัน encode/decode URLSearchParams แบบมาตรฐาน (?url=...&node=...) และทดสอบ Fallback Case สำหรับข้อมูล Legacy Base64 (b64) ที่ผู้ใช้อาจบันทึกไว้ในเวอร์ชันก่อนหน้า เพื่อให้มั่นใจว่าระบบถอดรหัสได้ถูกต้องและไม่ Crash ค่ะ'
  },
  {
    cat: '🧪 การทดสอบ & คุณภาพซอฟต์แวร์',
    q: 'ทำไมการกรองไฟล์ filterTreeFiles ถึงต้องมี Unit Test ครอบคลุมเป็นพิเศษ?',
    a: 'เพราะเป็นแนวป้องกันหลักของระบบค่ะ ใน parser.test.ts เราเขียนเทสต์ยืนยันว่าไฟล์และโฟลเดอร์ที่ไม่เกี่ยวข้อง เช่น node_modules, .next, .git, .png, .lock จะต้องถูกคัดทิ้งอย่างเด็ดขาด และไฟล์ที่เกินโควตา 1,500 รายการจะต้องถูกตัดทอนเพื่อป้องกัน Memory Overflow ค่ะ'
  },
  {
    cat: '🧪 การทดสอบ & คุณภาพซอฟต์แวร์',
    q: 'ระบบทดสอบ Security และการตรวจสอบ URL ขาเข้าอย่างไร?',
    a: 'ใน github.test.ts มีเทสต์ parseGitHubUrl ตรวจสอบอย่างเข้มงวด ทั้งรูปแบบ URL ปกติ, รูปแบบ trailing slash, URL ที่มี branch ลึก รวมถึงปฏิเสธโดเมนปลอมหรือ URL มุ่งร้าย (Non-GitHub hostname) เพื่อป้องกัน Server-Side Request Forgery (SSRF) ค่ะ'
  },
  {
    cat: '🧪 การทดสอบ & คุณภาพซอฟต์แวร์',
    q: 'ทดสอบฟังก์ชันไฮไลต์โค้ด Prism ใน code-viewer.test.ts อย่างไรในสภาพแวดล้อมที่ไม่มี DOM จริง?',
    a: 'เราทดสอบทั้งสองระดับค่ะ ในระดับที่มีไวยากรณ์ Prism รองรับ ฟังก์ชัน highlightCodeWithPrism จะคืนสตริง HTML ที่ติดแท็ก token spans และในระดับที่ไม่มีไวยากรณ์ (เช่นไฟล์ไม่รู้จัก) ฟังก์ชันจะแปลง Entity Escape อย่างปลอดภัย (& < > \") เพื่อป้องกัน XSS โดยไม่ต้องพึ่ง Browser DOM ค่ะ'
  },
  {
    cat: '🧪 การทดสอบ & คุณภาพซอฟต์แวร์',
    q: 'Automated CI Workflow (ci.yml) มีการรันเทสต์ของสมาชิกแต่ละคนอย่างไร?',
    a: 'เราใช้ Targeted Test Strategy บน GitHub Actions ค่ะ โดยตรวจจับชื่อ Branch ด้วย Regex เช่นถ้าเปิด PR จาก feat/person-6 จะรันเฉพาะเทสต์ของคน 6 ก่อนเพื่อความเร็ว จากนั้นเมื่อรวมโค้ดเข้า main จะรัน Full Test Suite ทั้ง 28 เทสต์ของทุกคนเพื่อรับประกันความสมบูรณ์ของระบบรวมค่ะ'
  }
];

let endLine = -1;
for (let i = 866; i < 1100; i++) {
  if (lines[i] && lines[i].trim() === '];' && lines[i - 1] && lines[i - 1].includes('}')) {
    endLine = i;
    break;
  }
}

if (endLine === -1) {
  console.error('Could not find insertion index for QNA_ITEMS');
  process.exit(1);
}

const formatted = newQuestions.map(item => `  {
    cat: ${JSON.stringify(item.cat)},
    q: ${JSON.stringify(item.q)},
    a: ${JSON.stringify(item.a)}
  }`).join(',\n');

lines.splice(endLine, 0, ',\n' + formatted);
fs.writeFileSync('data-content.js', lines.join('\n'), 'utf8');
console.log('Successfully appended 8 test questions to data-content.js!');
