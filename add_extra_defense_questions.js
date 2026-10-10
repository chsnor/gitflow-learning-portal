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

// คำถามเสริม 8 ข้อที่ผู้ใช้ต้องการเจาะจง:
// 1. อะไรเก็บไว้ยังไง (แคช, สเตท, ตัวแปร)
// 2. API GitHub ทำงานยังไง (ขั้นตอน, ส่งไปถามอะไร)
// 3. เอาข้อมูล repo มาโชว์หน้าเว็บได้ยังไง (ลำดับจาก API -> React State -> Node)
// 4. ทำไมถึงกดคลิกดูโค้ดผ่านหน้าเว็บได้ (ดึงเนื้อหาตอนไหน เก็บไว้ที่ไหน แสดงยังไง)
// 5. โค้ดที่เอามาโชว์ ดึงมาตอนไหนหรือดึงสดตอนกดคลิก?
// 6. หน้าเว็บมีสีไฮไลต์ Syntax สวยๆ เหมือน VS Code ได้ยังไง?
// 7. ถ้าคลังมีไฟล์เป็นรูปภาพ หรือวิดีโอ ระบบเอามาโชว์ในโค้ดด้วยไหม?
// 8. ถ้าเจ้าของคลังอัปเดตโค้ดใหม่บน GitHub หน้าเว็บเราจะอัปเดตตามทันทีไหม?

const extraQuestions = [
  {
    cat: "📡 ข้อมูล & API",
    q: "API ของ GitHub ทำงานยังไง ทำไมเราขอยิงครั้งเดียวได้รายชื่อทั้งโปรเจกต์เลย?",
    a: "เพราะเราใช้ Git Trees API พร้อมพารามิเตอร์ recursive=1 ค่ะ ตัว GitHub จะไปอ่านโครงสร้างต้นไม้ของ Git (Git Tree Object) ที่ผูกกับ Commit ล่าสุด แล้วแพ็กรายชื่อไฟล์และโฟลเดอร์ย่อยทั้งหมดส่งกลับมาเป็นก้อนเดียวในคำขอเดียวค่ะ",
    jump: { file: "github", line: 44 }
  },
  {
    cat: "📡 ข้อมูล & API",
    q: "จากที่ได้ข้อมูล JSON ของ GitHub มา ระบบเอามาแปลงเป็นผังกล่องๆ โชว์บนหน้าเว็บได้ยังไง?",
    a: "พอได้รายชื่อไฟล์มา เราจะเอาไปสร้างโหนดของ React Flow ค่ะ โดยเอา Path ของไฟล์มาตั้งชื่อกล่อง ใช้ชนิดไฟล์กำหนดสีของกล่อง และให้อัลกอริทึม Dagre คำนวณหาตำแหน่งแกน X กับ Y บนหน้าจอ แล้วนำเส้นเชื่อมการ import มาโยงต่อกันเป็นผังต้นไม้ค่ะ",
    jump: { file: "generator", line: 48 }
  },
  {
    cat: "📡 ข้อมูล & API",
    q: "ทำไมคลิกที่กล่องบนผังแล้วเปิดดูโค้ดข้างในไฟล์ผ่านหน้าเว็บได้ มันทำงานยังไง?",
    a: "เพราะตั้งแต่ตอนเริ่มวิเคราะห์ ระบบเราได้แอบดึงเนื้อหาโค้ดของไฟล์เหล่านั้นผ่าน Raw URL ของ GitHub มาเก็บไว้ในตัวแปรบนหน่วยความจำแล้วค่ะ พอผู้ใช้คลิกเลือกกล่อง หน้าเว็บจะส่งไอดีไฟล์ไปเปิดถาด Side Drawer แล้วหยิบข้อความโค้ดมาแสดงผลให้ดูทันทีค่ะ",
    jump: { file: "sidedrawer", line: 20 }
  },
  {
    cat: "📡 ข้อมูล & API",
    q: "โค้ดในไฟล์ดึงมาตอนไหน ดึงสดตอนกดคลิกกล่อง หรือดึงมารอไว้ก่อนแล้ว?",
    a: "ดึงมารอไว้ล่วงหน้าตั้งแต่ตอนกดปุ่มวิเคราะห์รอบแรกเลยค่ะ โดยดึงเฉพาะ 45 ไฟล์แรกที่สำคัญแบบขนานพร้อมกัน ผลดีคือตอนผู้ใช้กดคลิกกล่องบนผัง โค้ดจะเด้งขึ้นมาให้ดูทันที 0 วินาที ไม่ต้องหมุนรอโหลดใหม่ค่ะ",
    jump: { file: "pipeline", line: 493 }
  },
  {
    cat: "📡 ข้อมูล & API",
    q: "หน้าต่างดูโค้ดมีสีไฮไลต์คำสั่ง (Syntax Highlighting) เหมือนใน VS Code ได้ยังไง?",
    a: "ใช้โมดูล PrismJS ใน code-viewer.ts ค่ะ ตัวระบบจะตรวจนามสกุลไฟล์ เช่น .ts หรือ .tsx แล้วส่งเนื้อหาโค้ดเข้า Prism เพื่อตัดคำและใส่สีตามไวยากรณ์ของภาษานั้นๆ ทำให้โค้ดอ่านง่าย สบายตาค่ะ",
    jump: { file: "code-viewer", line: 51 }
  },
  {
    cat: "💾 การเก็บข้อมูล & แคช",
    q: "ในระบบทั้งหมด อะไรถูกเก็บไว้ที่ไหนบ้าง? (สรุปภาพรวมการเก็บข้อมูล)",
    a: "แบ่งเป็น 3 ที่ชัดเจนค่ะ: (1) ผลวิเคราะห์และโค้ดดิบ เก็บใน RAM เซิร์ฟเวอร์ผ่าน In-Memory Map, (2) ผังกล่องและตำแหน่งบนจอ เก็บใน State ของ React บนเบราว์เซอร์ผู้ใช้, และ (3) คลังที่เลือกดู บันทึกลง URL Query Parameters เพื่อให้ก๊อปลิงก์แชร์ได้ค่ะ",
    jump: { file: "pipeline", line: 20 }
  },
  {
    cat: "💾 การเก็บข้อมูล & แคช",
    q: "ถ้าเจ้าของคลังอัปเดตโค้ดใหม่บน GitHub หน้าเว็บเราจะอัปเดตตามทันทีไหม?",
    a: "ถ้าเพิ่งกดวิเคราะห์ไป ระบบจะจำผลเดิมไว้ในแคชแรมประมาณ 1 ชั่วโมงเพื่อความเร็วค่ะ แต่ถ้าผู้ใช้ต้องการดูโค้ดที่เพิ่งแก้สดๆ สามารถกดปุ่มเคลียร์แคชหรือส่ง URL พร้อมระบุ Branch ใหม่เพื่อสั่งให้ระบบไปดึงจาก GitHub สดๆ ได้ค่ะ",
    jump: { file: "pipeline", line: 446 }
  },
  {
    cat: "🛡️ การรับมือ Error",
    q: "ถ้าในคลังมีไฟล์ขยะ ไฟล์รูปภาพ หรือวิดีโอ ระบบจะเอามาโชว์ในผังหรือดึงโค้ดไหม?",
    a: "ไม่ดึงค่ะ เรามีฟังก์ชัน filterTreeFiles ของคนที่ 2 ช่วยคัดกรองตั้งแต่แรก โดยจะตัดไฟล์รูปภาพ, วิดีโอ, ไฟล์ zip, โฟลเดอร์ node_modules และ .next ทิ้งไปทั้งหมด จะเก็บเฉพาะไฟล์ซอร์สโค้ดจริงๆ เท่านั้นค่ะ",
    jump: { file: "parser", line: 20 }
  }
];

// Add extra questions and jumps
extraQuestions.forEach(item => {
  qna.push({
    cat: item.cat,
    q: item.q,
    a: item.a
  });
  jumps.push(item.jump);
});

const newQnaCode = 'const QNA_ITEMS = ' + JSON.stringify(qna, null, 2) + ';';
lines.splice(qIdx, endIdx - qIdx + 1, newQnaCode);

// Recalculate jumpLine after lines splice
const updatedContentTemp = lines.join('\n');
const tempLines = updatedContentTemp.split('\n');
const newJumpLine = tempLines.findIndex(l => l.includes('const QNA_JUMPS ='));
const newEndJumpLine = tempLines.findIndex((l, i) => i > newJumpLine && l.trim().startsWith('];'));

const newJumpsCode = 'const QNA_JUMPS = ' + JSON.stringify(jumps, null, 2) + ';';
tempLines.splice(newJumpLine, newEndJumpLine - newJumpLine + 1, newJumpsCode);

fs.writeFileSync('data-content.js', tempLines.join('\n'), 'utf8');
console.log('Successfully added extra questions! Total QNA:', qna.length, 'Total Jumps:', jumps.length);
