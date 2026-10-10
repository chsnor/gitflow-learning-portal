const fs = require('fs');

const content = fs.readFileSync('data-content.js', 'utf8');
const lines = content.split('\n');

const qIdx = lines.findIndex(l => l.includes('const QNA_ITEMS ='));
const endIdx = lines.findIndex((l, i) => i > qIdx && l.trim() === '];');

const currentCode = lines.slice(qIdx, endIdx + 1).join('\n') + '; QNA_ITEMS;';
const qna = eval(currentCode);

const jumpLine = lines.findIndex(l => l.includes('const QNA_JUMPS ='));
const endJumpLine = lines.findIndex((l, i) => i > jumpLine && l.trim().startsWith('];'));
const currentJumpsCode = lines.slice(jumpLine, endJumpLine + 1).join('\n') + '; QNA_JUMPS;';
const jumps = eval(currentJumpsCode);

// 3 คำถามใหม่ที่ตรงกับสิ่งที่คุยกันเป๊ะๆ:
// 1. Raw CDN คืออะไร ทำไมต้องใช้?
// 2. ถ้าคลังมีเกิน 45 ไฟล์ ไฟล์ที่ 46 ขึ้นไหม? แล้วถ้ากดคลิกดูโค้ดจะเห็นไหม?
// 3. ระบบรู้ได้ยังไงว่า 45 ไฟล์แรกคือไฟล์สำคัญ คัดเลือกยังไง?

const rawCdnQuestions = [
  {
    cat: "📡 ข้อมูล & API",
    q: "Raw CDN (raw.githubusercontent.com) คืออะไร ทำไมเราไม่ดึงผ่านเว็บ github.com ปกติ?",
    a: "เพราะ github.com ปกติจะส่งโค้ดมาพร้อมกับโค้ดหน้าเว็บ ปุ่ม แถบเมนู ซึ่งเหมาะกับคนอ่าน แต่ Raw CDN จะส่งเฉพาะ 'ข้อความตัวหนังสือโค้ดดิบๆ เพียวๆ' ไม่มีหน้าเว็บติดมาด้วย โปรแกรมของเราจึงดึงไปสแกนหา import และเอามาโชว์ในถาดดูโค้ดได้ง่ายและเร็วที่สุดค่ะ",
    jump: { file: "pipeline", line: 362 }
  },
  {
    cat: "📡 ข้อมูล & API",
    q: "ถ้าโปรเจกต์มีไฟล์เยอะมาก ไฟล์ที่ 46 เป็นต้นไปจะขึ้นบนผังไหม และกดดูโค้ดได้ไหม?",
    a: "ขึ้นครบแน่นอนค่ะ! ระบบรองรับการวาดผังสูงสุดถึง 250 ไฟล์ ส่วน 45 ไฟล์นั้นเป็นแค่โควตาที่เซิร์ฟเวอร์แอบดูดล่วงหน้ามาสแกนเส้นเชื่อม แต่ถ้าผู้ใช้คลิกที่กล่องไฟล์ที่ 46 บนผัง หน้าเว็บจะยิงไปดึงโค้ดจาก Raw CDN ณ วินาทีนั้นทันที (On-Demand Fetch) และเปิดโค้ดให้ดูได้ตามปกติค่ะ",
    jump: { file: "flowexplorer", line: 52 }
  },
  {
    cat: "📡 ข้อมูล & API",
    q: "ระบบรู้ได้ยังไงว่าไฟล์ไหนสำคัญ ถึงเลือก 45 ไฟล์แรกมาวิเคราะห์?",
    a: "ดูจาก 2 อย่างค่ะ: (1) เราตัดไฟล์ขยะทิ้งก่อน เช่น node_modules, .next, รูปภาพ และเทสต์ และ (2) ลำดับที่ GitHub ส่งมาเป็นลำดับโฟลเดอร์จากบนลงล่าง ซึ่งไฟล์แกนหลักของ Next.js เช่น layout, page, api, components มักจะอยู่ระดับบนๆ ของ src/ เสมอ 45 ไฟล์แรกจึงเป็นไฟล์หลักที่คุมระบบทั้งหมดค่ะ",
    jump: { file: "parser", line: 89 }
  }
];

rawCdnQuestions.forEach(item => {
  qna.push({
    cat: item.cat,
    q: item.q,
    a: item.a
  });
  jumps.push(item.jump);
});

const newQnaCode = 'const QNA_ITEMS = ' + JSON.stringify(qna, null, 2) + ';';
lines.splice(qIdx, endIdx - qIdx + 1, newQnaCode);

const updatedContentTemp = lines.join('\n');
const tempLines = updatedContentTemp.split('\n');
const newJumpLine = tempLines.findIndex(l => l.includes('const QNA_JUMPS ='));
const newEndJumpLine = tempLines.findIndex((l, i) => i > newJumpLine && l.trim().startsWith('];'));

const newJumpsCode = 'const QNA_JUMPS = ' + JSON.stringify(jumps, null, 2) + ';';
tempLines.splice(newJumpLine, newEndJumpLine - newJumpLine + 1, newJumpsCode);

fs.writeFileSync('data-content.js', tempLines.join('\n'), 'utf8');
console.log('Successfully added Raw CDN questions! Total QNA:', qna.length, 'Total Jumps:', jumps.length);
