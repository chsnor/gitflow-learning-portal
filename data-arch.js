// ============================================================
// data-arch.js — สถาปัตยกรรมเชิงลึก 7 ชั้น + วิธีเรนเดอร์ + ระบบไฮไลต์
// ทุกเลขบรรทัดอ้างอิงจากโปรเจกต์จริง D:\git_flowcahrt
// ============================================================

const ARCH_LAYERS = [
  {
    n: 1, id: "collect", title: "ชั้นเก็บข้อมูล (Source)", owner: "คน 1", color: "#3fb950",
    goal: "ดึงโครงสร้างโปรเจกต์จาก GitHub ด้วย API 1 ครั้งต่อ 1 คลัง",
    files: ["github"],
    io: "เข้า: owner, repo, branch, token → ออก: GitHubTreeItem[] (file tree ทั้งรอบเดียว)",
    steps: [
      { t: "ตรวจโดเมน", d: "ต้องเป็น github.com เท่านั้น ผ่าน regex ใน parseGitHubUrl", ref: ["github", 7] },
      { t: "แยก segment", d: "ตัด .git ท้าย URL แล้วแยก owner / repo / branch", ref: ["github", 16] },
      { t: "ประกอบ URL", d: "buildGitHubApiUrl ประกอบ /git/trees/{branch}?recursive=1", ref: ["github", 57] },
      { t: "แนบ Token", d: "buildGitHubHeaders ใส่ User-Agent และ Bearer token ถ้ามี", ref: ["github", 66] },
      { t: "Raw CDN", d: "buildGitHubRawUrl ใช้ดึงตัวโค้ดดิบของแต่ละไฟล์ภายหลัง", ref: ["github", 86] }
    ],
    edge: [
      "repo ที่ใช้ branch 'master' → pipeline จับ 404 แล้ว fallback อัตโนมัติ (pipeline 323-332)",
      "token ว่าง/เว้นวรรค → ตัด .trim() แล้วข้าม Authorization (github 73-75)",
      "ไม่มีสิทธิ์เข้าถึง → 403 → ต้องขึ้นข้อความแนะนำให้ใส่ Token (pipeline 339-341)"
    ],
    decisions: [
      { q: "ทำไมใช้ Trees API ไม่ยิงทีละโฟลเดอร์", a: "1 คำขอ = ทั้งโปรเจกต์ rate limit จาก O(n) เหลือ O(1) และไม่ต้องเดา path" },
      { q: "ทำไมต้องมี fallback main→master", a: "repo เก่าส่วนใหญ่ใช้ master ไม่มี fallback ระบบจะใช้กับคลังเก่าไม่ได้" }
    ],
    extend: ["ต่อท้าย provider เป็น strategy object รองรับ GitLab/Bitbucket", "ใช้ GitHub GraphQL ดึงหลายไฟล์พร้อม content ในคำขอเดียว"]
  },
  {
    n: 2, id: "sanitize", title: "ชั้นความสะอาดข้อมูล (Sanitize)", owner: "คน 2", color: "#bc8cff",
    goal: "ตัดสิ่งที่ไม่ต้องวิเคราะห์ออก เหลือแต่ซอร์สโค้ดจริง",
    files: ["parser"],
    io: "เข้า: GitHubTreeItem[] → ออก: ไฟล์ที่ผ่านเกณฑ์ + fileType ของแต่ละไฟล์",
    steps: [
      { t: "Blacklist โฟลเดอร์", d: "ทิ้ง node_modules/.next/tests/docs ฯลฯ 17 รายการ", ref: ["parser", 4] },
      { t: "Blacklist ไฟล์", d: "ทิ้ง lockfile / tsconfig / config ทั้งหมด", ref: ["parser", 24] },
      { t: "รักษาไฟล์ราก", d: "เก็บเฉพาะ middleware.ts / proxy.ts ที่อยู่รากโปรเจกต์", ref: ["parser", 49] },
      { t: "เช็คนามสกุล", d: "รับเฉพาะ .ts .tsx .js .jsx", ref: ["parser", 56] },
      { t: "จำกัดจำนวน", d: "ตัดที่ maxLimit (pipeline ส่งค่า 500)", ref: ["parser", 62] },
      { t: "จำแนกชนิดไฟล์", d: "page/layout/action/middleware/store/component/api/other", ref: ["parser", 119] }
    ],
    edge: [
      "ไฟล์ 0 ไบต์หรือ binary → ตัดทิ้งก่อนแตะ raw CDN ประหยัด request",
      "โปรเจกต์เกิน 500 ไฟล์ → ตัดตามลำดับที่ GitHub ส่งมา ไม่ใช่สุ่ม",
      "MyPage.tsx → ถูกจัดเป็น component ไม่ใช่ page (ตั้งใจให้เป็นแบบนี้)"
    ],
    decisions: [
      { q: "ทำไมใช้ Set เก็บ BLACKLIST_FILES", a: "ค้น O(1) แทน O(n) ตอนกรองหลายพันไฟล์ และกันรายการซ้ำ" },
      { q: "ทำไมต้องมี try/catch ครอบใน pipeline", a: "ช่วงที่คน 2 ยังไม่ส่งงาน ระบบต้องรันได้ด้วย fallback เอง (pipeline 367-377)" }
    ],
    extend: ["เรียงลำดับความสำคัญไฟล์ entrypoint มาก่อน test", "ใช้ขนาดไฟล์เป็นเกณฑ์ตัด ไม่ดึงไฟล์ใหญ่เกิน 500KB"]
  },  {
    n: 3, id: "fetchcode", title: "ชั้นดึงโค้ดดิบ (Fetch Code)", owner: "คน 6", color: "#ff7b72",
    goal: "ดึงตัวโค้ดจริงของไฟล์ที่ผ่านการกรอง พร้อม timeout กันค้าง",
    files: ["pipeline", "github"],
    io: "เข้า: รายการไฟล์ที่ผ่านชั้น 2 → ออก: Record<path, code> สูงสุด 45 ไฟล์",
    steps: [
      { t: "เลือกเฉพาะโค้ด", d: "กรองเฉพาะ .ts/.tsx/.js/.jsx ที่ยังไม่เคยดึง", ref: ["pipeline", 397] },
      { t: "ดึงพร้อมกัน", d: "รวมเป็น batch แล้ว Promise.all", ref: ["pipeline", 405] },
      { t: "ตัดที่ 45 ไฟล์", d: "เก็บเฉพาะ 45 ไฟล์แรก คุมเวลาและขนาด payload", ref: ["pipeline", 411] },
      { t: "timeout 4 วิ", d: "ทุก fetch มี AbortController ตัดที่ 4 วินาที", ref: ["pipeline", 419] },
      { t: "กันพังรายไฟล์", d: "ไฟล์เดียวโหลดไม่ได้ ไม่ทำให้ทั้งงานพัง", ref: ["pipeline", 430] }
    ],
    edge: [
      "ไฟล์ใหญ่มาก → ตัดที่ 45 ไฟล์แรก พร้อมบอกผู้ใช้ว่ายังไม่ครบ",
      "Raw CDN ช้า/ล่ม → ข้ามไฟล์นั้น ไม่ให้ทั้ง pipeline ค้าง",
      "repo ว่างเปล่า → คืนกราฟเปล่าได้ ไม่ error"
    ],
    decisions: [
      { q: "ทำไม 45 ไฟล์", a: "สมดุลความครบถ้วนกับเวลา — ยิงราว 2-4 วินาทีบนเน็ตปกติ" },
      { q: "ทำไมต้อง AbortController", a: "fetch ใน Node/Edge runtime ไม่มี timeout เริ่มต้น ไม่ตัดจะค้างจน request ตาย" }
    ],
    extend: ["ดึงแบบ on-demand ตอนคลิก node แทนดึงล่วงหน้า", "cache โค้ดราย SHA เพื่อไม่ต้องโหลด CDN ซ้ำ"]
  },
  {
    n: 4, id: "extract", title: "ชั้นแกะความสัมพันธ์ (Extract)", owner: "คน 2", color: "#bc8cff",
    goal: "เปลี่ยนโค้ดดิบให้เป็นรายการเส้นความสัมพันธ์ที่เข้าใจได้",
    files: ["parser", "pipeline"],
    io: "เข้า: Record<path, code> → ออก: CodeRelation[] (source, target, type, label)",
    steps: [
      { t: "ตัดคอมเมนต์ออก", d: "ลบ /* */ และ // ก่อน regex ไม่ให้จับของปลอม", ref: ["parser", 183] },
      { t: "จับ import", d: "regex รองรับทั้ง import x from และ import type", ref: ["parser", 187] },
      { t: "กรองเฉพาะ relative", d: "เก็บเฉพาะ ./ ../ @/ ~/ ข้าม package ภายนอก", ref: ["parser", 193] },
      { t: "กันซ้ำ", d: "seenTargets กัน import เดิมซ้ำในไฟล์เดียว", ref: ["parser", 194] },
      { t: "จับ action/event", d: "onClick และ form action กลายเป็นเส้น animated", ref: ["parser", 211] },
      { t: "เติมเส้นสำรอง", d: "ถ้าไม่เจอ import เลย ใช้ inferStructuralRelations เดาเส้นเชิงโครงสร้าง", ref: ["pipeline", 460] }
    ],
    edge: [
      "โค้ดไม่มีคำว่า import → String Guard คืน [] ทันที ไม่เสียเวลา regex",
      "alias @/ หาไฟล์จริงไม่เจอ → ใช้ path เดิมเป็น target แล้วให้ resolveImportToFilePath ช่วย (pipeline 446)",
      "import ซ้ำ 5 ทางในไฟล์เดียว → เก็บ 1 เส้นต่อ target"
    ],
    decisions: [
      { q: "ทำไมตัดคอมเมนต์ก่อน", a: "คอมเมนต์มีคำว่า import อยู่บ่อย ไม่ตัดจะเกิดเส้นกากเทียม" },
      { q: "ทำไมไม่ใช้ AST ให้แน่นกว่า", a: "ต้องแกะโค้ดของคนอื่นแบบ runtime ที่ไม่มีไฟล์ .ts บนดิสก์ — regex deploy ได้จริง" }
    ],
    extend: ["เสริม require() แบบ CommonJS", "จับ dynamic import('...') ตอนรัน", "ย้ายไป SWC/TypeScript compiler API เมื่อมี bundler"]
  },
  {
    n: 5, id: "graph", title: "ชั้นสร้างกราฟ (Graph)", owner: "คน 3", color: "#d29922",
    goal: "แปลงรายการเส้นเป็น node/edge พร้อมพิกัดที่วางไม่ทับกัน",
    files: ["generator"],
    io: "เข้า: files + CodeRelation[] → ออก: FlowNodeItem[] + FlowEdgeItem[] + mermaid",
    steps: [
      { t: "id ปลอดภัย", d: "sanitizeNodeId แปลง path เป็น id ที่ React Flow ใช้ได้", ref: ["generator", 8] },
      { t: "สีตามชนิด", d: "COLOR_PALETTE แยกสีต่อ fileType", ref: ["generator", 33] },
      { t: "backward compat", d: "ถ้า fileType เป็น other ให้เดาจากชื่อ path อีกครั้ง", ref: ["generator", 41] },
      { t: "ลำดับคอลัมน์", d: "middleware → page → component → action → api → store", ref: ["generator", 59] },
      { t: "สร้าง node/edge", d: "edge ที่แตะ action จะ animated ให้เห็นทิศทาง", ref: ["generator", 101] },
      { t: "จัดวางด้วย Dagre", d: "rankdir LR · nodesep 55 · ranksep 170 · margin 60", ref: ["generator", 111] },
      { t: "กันเส้นซ้ำ", d: "seenRelKeys กัน edge ซ้ำข้ามกันระหว่าง import กับ action", ref: ["pipeline", 450] },
      { t: "Mermaid", d: "generateMermaidSyntax ทำสำเนาแบบข้อความไว้ส่งออก", ref: ["generator", 165] }
    ],
    edge: [
      "Dagre จัดวางไม่ได้ → ล้อม try/catch แล้วใช้พิกัด (0,0) ต่อ ไม่ให้ทั้งหน้าจอพัง",
      "edge ชี้ node ที่ไม่มีจริง → ต้องเพิ่ม placeholder node",
      "ไฟล์เกิน 200 → กราฟหนัก ควรจำกัดและมีปุ่มซูม"
    ],
    decisions: [
      { q: "ทำไมเลือก Dagre", a: "ได้ hierarchical layout อ่านทิศทางการไหลได้ และ deterministic รันซ้ำได้กราฟเดิม" },
      { q: "ทำไมส่งทั้ง graph และ mermaid", a: "React Flow ใช้บนหน้าเว็บ mermaid ใช้ตอนส่งออก — ข้อมูลชุดเดียวสองทาง" }
    ],
    extend: ["ใช้ ELK.js เมื่อกราฟเกิน 300 node", "ทำ incremental layout ไม่ต้องจัดวางใหม่ทั้งกราฟ"]
  },
  {
    n: 6, id: "orchestrate", title: "ชั้นประสานงาน (Orchestrate)", owner: "คน 6", color: "#ff7b72",
    goal: "เป็นผู้คุมจังหวะเดียวของทั้งระบบ ตั้งแต่รับ URL จนคืนผลลัพธ์",
    files: ["pipeline", "route"],
    io: "เข้า: githubUrl, token → ออก: AnalysisResult (nodes, edges, isCached, executionTimeMs)",
    steps: [
      { t: "ตั้งนาฬิกา", d: "performance.now() บรรทัดแรกของฟังก์ชัน", ref: ["pipeline", 273] },
      { t: "แกะ URL", d: "เรียก parseGitHubUrl มี fallback ตัดสตริงเอง", ref: ["pipeline", 278] },
      { t: "Guard", d: "ไม่มี owner/repo → throw พร้อมข้อความชัดเจน", ref: ["pipeline", 293] },
      { t: "เช็คแคช", d: "pipelineCache.has(url) คืนผลเดิมพร้อม isCached", ref: ["pipeline", 301] },
      { t: "ยิง Trees API", d: "พร้อม fallback main → master เมื่อได้ 404", ref: ["pipeline", 317] },
      { t: "กรอง + จำแนก", d: "เรียกงานคน 2 พร้อม catch fallback เอง", ref: ["pipeline", 366] },
      { t: "ดึงโค้ด 45 ไฟล์", d: "timeout 4 วินาทีต่อไฟล์", ref: ["pipeline", 397] },
      { t: "แกะความสัมพันธ์", d: "extractImports + extractAction + เติมเส้นเชิงโครงสร้าง", ref: ["pipeline", 444] },
      { t: "สร้างกราฟ", d: "ส่งต่อให้ generator ของคน 3", ref: ["pipeline", 480] },
      { t: "สร้าง Mermaid", d: "ข้อความสำเนาไว้ส่งออก", ref: ["pipeline", 500] },
      { t: "บันทึกแคช + คืนค่า", d: "pipelineCache.set ก่อน return ทุกครั้ง", ref: ["pipeline", 554] },
      { t: "คุม boundary", d: "route.ts: อ่าน body ตรวจ 400 เรียก ตอบ 200/500", ref: ["route", 9] }
    ],
    edge: [
      "GitHub ล่ม → 'ไม่สามารถเชื่อมต่อ GitHub ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือแนบ Token'",
      "body ไม่ใช่ JSON → catch คืน 500 พร้อม error.message",
      "ไม่มี token → Anonymous ได้ 60 req/ชม. ต่อ IP",
      "URL นอก github.com → ปฏิเสธที่ route ก่อนแตะ pipeline"
    ],
    decisions: [
      { q: "ทำไม cache เป็น Map ในหน่วยความจำ", a: "เร็วและไม่ต้องมี dependency แต่หายเมื่อ restart และแยกไม่ได้หลาย instance" },
      { q: "ทำไมมีโค้ดสำรองซ้ำ ๆ", a: "ให้ระบบรันได้ตั้งแต่วันแรกที่เพื่อนยังไม่ส่งงาน และกัน pipeline ตายเมื่อโมดูลคนอื่น throw" },
      { q: "ทำไมวัดเวลาที่ pipeline ไม่ใช่ route", a: "เวลาที่วัดต้องเป็นเวลางานวิเคราะห์จริง ไม่รวมเวลา parse JSON ของ server" }
    ],
    extend: ["ย้าย cache ไป Redis/LRU พร้อม TTL", "แยกเป็น background job + polling เมื่อคลังใหญ่เกิน 3 วินาที", "เพิ่ม rate-limit ต่อ IP ที่ชั้น route"]
  },
  {
    n: 7, id: "present", title: "ชั้นแสดงผล (Present)", owner: "คน 4", color: "#58a6ff",
    goal: "เปลี่ยน AnalysisResult ให้เป็นหน้าจอที่ผู้ใช้เข้าใจ",
    files: ["page", "flowcanvas", "sidedrawer", "uihelper", "codeviewer", "layout", "types"],
    io: "เข้า: AnalysisResult → ออก: กราฟ + รายละเอียดไฟล์ + ตัวอ่านโค้ด",
    steps: [
      { t: "รับผล", d: "page.tsx ยิง POST แล้ว setResult(data)", ref: ["page", 119] },
      { t: "ตรวจ ok", d: "ถ้า !response.ok โยน error พร้อมข้อความจาก API", ref: ["page", 125] },
      { t: "คำนวณสถิติ", d: "formatRepoStats + calculateHealthScore แปลงตัวเลขเป็นป้าย", ref: ["uihelper", 37] },
      { t: "ตรวจ URL ก่อนยิง", d: "validateUrlInput เตือนผู้ใช้ก่อนเสียเวลายิง API", ref: ["uihelper", 6] },
      { t: "วาดกราฟ", d: "FlowCanvas รับ nodes/edges แล้วส่งเข้า React Flow", ref: ["flowcanvas", 1] },
      { t: "เปิด drawer", d: "คลิก node → SideDrawer เปิดพร้อมไฟล์และบรรทัดที่เกี่ยวข้อง", ref: ["sidedrawer", 1] },
      { t: "ตัดโค้ดให้พอดี", d: "formatCodeSnippet ตัดที่ maxLines = 300 ไม่ให้หน้าค้าง", ref: ["codeviewer", 62] },
      { t: "ไฮไลต์โค้ด", d: "highlightCodeWithPrism เลือกภาษาจากนามไฟล์", ref: ["codeviewer", 99] },
      { t: "แชร์ลิงก์", d: "encodeShareableState เก็บ url + node ลง query string", ref: ["uihelper", 109] },
      { t: "ฟอนต์ไทย", d: "IBM Plex Sans Thai ผ่าน next/font + display swap", ref: ["layout", 15] }
    ],
    edge: [
      "ผู้ใช้กรอก URL ผิด → validateUrlInput เตือนก่อนยิง API",
      "คลิก node ที่ยังไม่มีโค้ดในแคช → ข้อความว่ายังไม่ได้ดึง ไม่ค้าง",
      "จอเล็ก → SideDrawer กลายเป็นแผงเต็มจอแทน slide-in",
      "ลิงก์แชร์ผิดรูปแบบ → decodeShareableState คืน null แล้วใช้ค่าเริ่มต้น"
    ],
    decisions: [
      { q: "ทำไมแยก ui-helper ออกมา", a: "ตรรกะคำนวณสถิติ/แปลงลิงก์ไม่ควรอยู่ใน component — ทดสอบเป็น unit test ได้ตรง ๆ" },
      { q: "ทำไมตัดโค้ด 300 บรรทัด", a: "บางไฟล์ยาว 500+ บรรทัด การตัดคุมขนาด DOM และเวลาคลิกวาง cursor" }
    ],
    extend: ["โหมดส่งออก PNG/SVG ของกราฟ", "deep-link ราย node ใน URL เพื่อแชร์ตำแหน่งที่คุย", "virtualized list เมื่อไฟล์ยาวกว่า 3,000 บรรทัด"]
  }
];

// ---------- สแต็กเลเยอร์ของ UI ตัวนี้เอง (ถ้าอาจารย์ถามว่า layout ทำยังไง) ----------
const LAYOUT_STACK = [
  { lvl: 1, name: "app-shell", selector: ".app-shell", role: "CSS Grid 2 คอลัมน์: side-rail + content-col", detail: "กำหนดสัดส่วนทั้งหน้าจอ · ต่ำกว่า 1024px เปลี่ยนเป็นแถวเดียว" },
  { lvl: 2, name: "content-col", selector: ".content-col", role: "Flex column: top-strip + workspace + inspector", detail: "workspace ใช้ min-height:0 เพื่อให้ลูกที่ scroll ภายในบีบได้จริง" },
  { lvl: 3, name: "workspace", selector: ".workspace", role: "position:relative = containing block ของทุก overlay", detail: "เก็บ panes-wrap (ปกติ) และ overlay (z-index 5) ไว้ชั้นเดียวกัน" },
  { lvl: 4, name: "panes-wrap", selector: ".panes-wrap", role: "Grid 1fr 1fr + gap 1px สีเส้นแบ่ง", detail: "ซ้าย = ไฟล์คน 6 · ขวา = โมดูลเพื่อนที่ถูกเรียก" },
  { lvl: 5, name: "code-pane", selector: ".code-pane", role: "Flex column: pane-head → pane-strip → pane-code", detail: "pane-code มี tabindex=0 เพื่อให้คีย์บอร์ดเลื่อนได้ และเป็น target ของ scrollToLine" }
];
// ---------- ระบบไฮไลต์: ทุกคลาส ทุกสี ทุกเหตุผล ----------
const HIGHLIGHT_SYSTEM = [
  { cls: "block-highlight", color: "--accent (ฟ้า)", where: "โค้ดคน 6", meaning: "บรรทัดที่อยู่ในช่วงของสเต็ปปัจจุบัน", css: "background: var(--accent-soft) · inset 2px 0 0 var(--accent)", why: "ต่างจาก target แค่ 1px ความหนา เพื่อให้ตาแยก 'อยู่ในช่วง' ออกจาก 'คือจุดสำคัญ'" },
  { cls: "block-target", color: "--accent (ฟ้าเข้ม)", where: "โค้ดคน 6", meaning: "บรรทัดเป้าหมายหลักของสเต็ป เช่น 317", css: "background: accent 24% · inset 3px 0 0 accent", why: "ทึกขึ้น + ขอบหนา 3px ให้เป็นจุดสนใจแรกของสายตา" },
  { cls: "connected-block", color: "--ok (เขียว)", where: "github.ts เท่านั้น", meaning: "บรรทัดฝั่ง callee ที่ถูกเรียกในสเต็ปนี้", css: "background: var(--ok-soft) · inset 2px 0 0 var(--ok)", why: "สีเขียวแยก 'ของคนอื่นที่ถูกเรียก' ออกจากสีฟ้าของงานตัวเองด้วยสี ไม่ใช่ตำแหน่ง" },
  { cls: "connected-target", color: "--ok (เขียวเข้ม)", where: "github.ts", meaning: "บรรทัดที่ถูกเรียกจริง เช่น parseGitHubUrl บรรทัด 7", css: "background: ok 26% · inset 3px 0 0 ok", why: "คู่กับ block-target ให้เห็นคู่ 'ผู้เรียก → ผู้ถูกเรียก' พร้อมกัน" },
  { cls: "pinned-target", color: "--warn (เหลือง)", where: "ทุกไฟล์ ไม่จำกัด pipeline", meaning: "บรรทัดที่ผู้ใช้คลิกปักหมุดเอง", css: "background: warn 20% · inset 3px 0 0 warn", why: "สีเหลืองแยกจากสีของระบบ — บอกว่านี่คือการเลือกของผู้ใช้ ไม่ใช่ผลของสเต็ป" },
  { cls: "reader-target", color: "--warn (เหลือง)", where: "ตัวอ่านบรรทัด + การ์ดไฟล์ที่เกี่ยวข้อง", meaning: "บรรทัดเป้าหมายในกล่องขยาย", css: "เหมือน pinned-target", why: "ใช้สีเดียวกันตั้งใจ เพื่อบอกว่าเป็นบรรทัดเดียวกับที่ผู้ใช้คลิก" },
  { cls: "sim-code-target", color: "--accent (ฟ้า)", where: "การ์ดโค้ดในซิมูเลเตอร์", meaning: "บรรทัดที่จังหวะนั้นอ้างถึง", css: "background: accent 22% · inset 3px 0 0 accent", why: "สีฟ้าเพราะเป็นบริบทของสเต็ป ไม่ใช่การเลือกของผู้ใช้" },
  { cls: "has-highlight (บน .pane-code)", color: "ไม่มีสี", where: "ตัว scroll container ทั้ง pane", meaning: "เปิดโหมด dim แถวอื่นเหลือ 38% opacity", css: ".pane-code.has-highlight .code-row { opacity:.38 }", why: "ต้องอยู่บน container ไม่ใช่แถว เพราะเป็นกฎเดียวที่ลดทุกแถวพร้อมกันและ override ได้ทีเดียว" }
];
// ---------- วิธีเรนเดอร์: ฟังก์ชันไหนทำอะไร เรียกตามลำดับไหน ----------
const RENDER_FUNCS = [
  { fn: "initFileMeta()", where: "data-content.js", role: "สร้าง FILE_META 19 รายการแบบ lazy", how: ["ต้องเรียกหลัง data-code.js โหลดเสร็จ ไม่งั้น RAW_* ยังไม่มีค่า", "ถ้าเรียกตอน parse ไฟล์ จะได้ ReferenceError: RAW_PARSER is not defined"], why: "แยกข้อมูลออกจากโค้ดจริง ทำให้สลับไฟล์ในแท็บได้โดยไม่โหลดซ้ำ" },
  { fn: "buildFileGraph()", where: "app.js", role: "สแกนโค้ด 19 ไฟล์ สร้าง FILE_GRAPH", how: ["pass 1 เก็บชื่อ export ทุกไฟล์ 46 สัญลักษณ์ พร้อมเลขบรรทัด", "pass 2 ทีละบรรทัด หา import / path literal / การเรียกข้ามไฟล์", "เช็ก includes() ก่อน แล้วค่อยยืนยันด้วย regex เพื่อความเร็ว"], why: "ทำครั้งเดียวตอนโหลด 251 edge แล้วใช้ซ้ำได้ทุกครั้งที่คลิก" },
  { fn: "renderPane()", where: "app.js", role: "สร้างแถวโค้ด 1 ไฟล์ใน 1 pane", how: ["split newline แล้วข้ามแถวว่างท้ายไฟล์", "แต่ละแถวคือ div.code-row มี id fileKey-row-N", "ใส่ highlightTS เพื่อทำ syntax token", "ผูก click ไปที่ onCodeRowClick ทุกไฟล์"], why: "ใช้ DocumentFragment ต่อครั้ง โหลด 561 บรรทัดรวดเดียว ไม่กระพริบทีละแถว" },
  { fn: "renderCodePanes()", where: "app.js", role: "วาดแท็บ 19 ไฟล์ + โหลด pane เริ่มต้น", how: ["renderFileTabs สร้างแท็บจาก FILE_META ที่อยู่ pane ตรงกัน", "เรียก renderPane ซ้ายและขวา", "อัปเดต badge เจ้าของไฟล์", "renderInspector สร้างบทวิเคราะห์ใต้จอ"], why: "แยกแท็บออกจากเนื้อโค้ด เปลี่ยนไฟล์ได้โดยไม่ต้องสร้างแท็บใหม่" },
  { fn: "selectStep(i)", where: "app.js", role: "เลือกสเต็ป 1-6 แล้วไฮไลต์ทั้งสอง pane", how: ["renderStepUI วาด step dots และ ribbon", "pipeline ไฮไลต์ช่วง pRange แล้ว scrollToLine", "route ไฮไลต์ 9-37 ถ้าเปิดแท็บนี้", "github ถ้าสเต็ปมี gRange ให้สลับแท็บขวาเป็น github อัตโนมัติ", "เปลี่ยน badge ขวาเป็น Callee"], why: "สเต็ปเป็นแกนกลาง ทุกมุมมองอื่นยึด currentStepIndex เดียวกัน" },
  { fn: "highlightRange()", where: "app.js", role: "ลงคลาสไฮไลต์ลงแถวที่อยู่ในช่วง", how: ["เลือกแถวด้วย id prefix ของไฟล์นั้น", "เพิ่ม has-highlight ที่ container เพื่อ dim ที่เหลือ", "github ได้สีเขียว ไฟล์อื่นได้สีฟ้า", "targetLine ได้คลาสเข้มและขอบ 3px"], why: "id prefix เร็วกว่า data attribute เมื่อมีหลายพันแถว และ id ยังใช้ต่อกับ scrollToLine ได้" },
  { fn: "scrollToLine()", where: "app.js", role: "เลื่อน pane ไปให้เห็นบรรทัดเป้าหมาย", how: ["หาแถวจาก id", "ใช้ offsetTop ลบ 16px", "เรียก scrollTo แบบ smooth"], why: "ทำให้เส้นสำคัญอยู่เหนือขอบบน ไม่ต้องเลื่อนตามเอง" },
  { fn: "renderSimulatorView()", where: "app.js", role: "วาด 10 จังหวะ + การ์ดโค้ดแบบ inline", how: ["simCodePanel อ่าน SIM_JUMPS ของจังหวะปัจจุบัน", "แต่ละ snippet เป็นการ์ดไฟล์ พร้อมบรรทัดเป้าหมายและบริบท", "กล่องเลื่อนได้ สูงสุด 280px"], why: "ไม่บังคับให้ผู้เรียนออกจากซิมูเพื่อไปดูโค้ด ลดการสลับบริบท" },
  { fn: "relationsFor()", where: "app.js", role: "หาไฟล์ที่เกี่ยวข้องกับบรรทัดที่คลิก", how: ["ไล่ FILE_GRAPH ทั้งหมด", "from ตรงไฟล์และ line ตรงบรรทัด = เรียกใช้ เอา targetLine ของปลายทาง", "to ตรงไฟล์และ line ตรงบรรทัด = ถูกเรียก", "ไม่เจอตรง ๆ คืนความสัมพันธ์ทั้งไฟล์แทน"], why: "บรรทัดเดียวอาจเป็นแค่จุดกลางของฟังก์ชัน การหาทั้งไฟล์กันภาพรวมว่างเปล่า" },
  { fn: "renderLineReader()", where: "app.js", role: "วาดตัวอ่าน + รายการไฟล์ที่เกี่ยวข้อง", how: ["แสดงบรรทัดที่กดแบบเต็ม", "แสดงบริบท ±8 บรรทัด", "จัดกลุ่ม เรียกใช้ / ถูกเรียก / ชั้นที่ 2 แล้ว normalize ต่อไฟล์", "แต่ละการ์ดมีปุ่มขยายโค้ดและเปิดใน pane", "ยึดฝั่งตรงข้ามกับไฟล์ที่อ่านเพื่อไม่บังโค้ด"], why: "รวมบรรทัด บริบท และไฟล์ที่เกี่ยวข้องไว้ในการ์ดเดียว" }
];

const ARCH_TOTAL_EDGES = 251;
const ARCH_TOTAL_SYMBOLS = 46;
const ARCH_HTML_NOTE = "ไฟล์ portal นี้แยกข้อมูลออกจาก logic: data-code.js เก็บโค้ดจริง · data-content.js เก็บบทเรียน · data-arch.js เก็บสถาปัตยกรรม · app.js มีแต่ render + interaction";
