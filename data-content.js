// ============================================================
// data-content.js — เนื้อหาการสอนทั้งหมด (ไม่มี logic เรนเดอร์)
// FILE_META / LOGICAL_STEPS / SIM / CICD / REDTEAM / Q&A / QUIZ
// ============================================================

const LOGICAL_STEPS = [

  {
    step: 1,
    title: "1. โหลดโมดูล & สร้างตัวจำผลลัพธ์ (Cache)",
    subTitle: "Import โมดูล & จอง In-Memory Cache (บรรทัด 1 - 18)",
    pRange: [1, 18],
    pTarget: 11,
    gRange: [1, 2],
    gTarget: 2,
    objective: "ดึงเครื่องมือของเพื่อนคนที่ 1, 2, 3 เข้ามาใช้ แล้วสร้างตัวจำ (Cache) ไว้ในแรมของเซิร์ฟเวอร์ เพื่อจำผลงานเก่าไม่ให้ต้องคำนวณซ้ำ",
    pMechanics: "• บรรทัด 2-5: import ฟังก์ชันจากเพื่อนคนที่ 1 (github.ts), คนที่ 2 (parser.ts), คนที่ 3 (generator.ts) และ Types กลาง\n• บรรทัด 7-11: pipelineCache = new Map() จองพื้นที่แรมเก็บผลลัพธ์ โดยใช้ URL เป็นกุญแจ (Key) ของแต่ละงาน\n• บรรทัด 13-18: clearPipelineCache() คำสั่งล้างแคชทั้งหมด ใช้ตอนรัน Unit Test หรือรีเซ็ตระบบ",
    rMechanics: "• บรรทัด 2-3: route.ts import NextRequest/NextResponse และฟังก์ชัน runAnalysisPipeline จาก pipeline\n• บรรทัด 9: ประกาศ POST handler รอรับคำขอ HTTP จากหน้าเว็บ (คน 4) เข้าสู่ระบบ",
    gMechanics: "• บรรทัด 1-2: github.ts import interface ParsedGitHubUrl จาก types เตรียมสัญญาการแลกเปลี่ยนข้อมูล (Contract)",
    teammateContract: "รวมไฟล์เพื่อน: คนที่ 1 (github.ts), คนที่ 2 (parser.ts), คนที่ 3 (generator.ts) ผ่าน import บรรทัด 2-4",
    variables: "pipelineCache: Map<string, AnalysisResult> (Key = URL เต็มของคลัง)",
    pythonAnalogy: "เหมือนเขียน pipeline_cache = {} ใน Python เป็นดิกชันนารีเก็บผลลัพธ์ชั่วคราวไว้ในแรม",
    defenseTip: "หนูประกาศแคชไว้ตั้งแต่ต้นไฟล์ (บรรทัด 11) เพื่อให้งานที่เคยวิเคราะห์แล้วตอบกลับทันทีในระดับมิลลิวินาที โดยไม่ต้องยิง GitHub API ซ้ำค่ะ"
  },
  {
    step: 2,
    title: "2. เครื่องมือภายใน: แปลง Import เป็น Path จริง + หาความสัมพันธ์จากโครงสร้าง",
    subTitle: "Helper 2 ตัวที่หนูเขียนเอง (บรรทัด 20 - 259)",
    pRange: [20, 259],
    pTarget: 24,
    gRange: null,
    gTarget: null,
    objective: "สร้างเครื่องมือเสริม 2 ตัวของ Pipeline: แปลงพาธ import ให้เป็นไฟล์จริง และเดาความเชื่อมโยงจากโครงสร้าง App Router โดยไม่ต้องยิง API เพิ่ม",
    pMechanics: "• บรรทัด 24-74: resolveImportToFilePath() แปลง '@/store/gameStore' ให้เป็น path จริงด้วย 3 กลยุทธ์: Alias @//~/ (34-43), Relative ./ ../ (46-61) และค้นจากชื่อไฟล์ (64-71)\n• บรรทัด 80-259: inferStructuralRelations() อ่านโครงสร้างโฟลเดอร์ app/ แล้วสร้างเส้นความสัมพันธ์อัตโนมัติ เช่น middleware→root (105-112), layout renders page (134-141), parent→sub-route (164-190), component→page (194-223), component→store (226-240)\n• บรรทัด 86-93: กันเส้นซ้ำด้วย Set ของ Key 'source->target'",
    rMechanics: "• สเต็ปนี้เป็นการเตรียมเครื่องมือภายใน ยังไม่เกี่ยวกับคำขอที่เข้ามา\n• POST handler (บรรทัด 9) ยังรอรับคำขออยู่",
    gMechanics: "• สเต็ปนี้ไม่ได้เรียกใช้ github.ts: เครื่องมือทั้งสองตัวทำงานกับรายชื่อไฟล์ในเครื่อง (In-Memory) ล้วน ๆ จึงไม่เปลืองโควตา API",
    teammateContract: "ไม่มีการเรียกเพื่อนในสเต็ปนี้ — เป็นโค้ดของคน 6 เองทั้งหมด จะถูกใช้ร่วมกับผลงานคนที่ 2 ในสเต็ป 6",
    variables: "resolveImportToFilePath, inferStructuralRelations, uniqueKeys (Set กันซ้ำ)",
    pythonAnalogy: "เหมือนเขียน os.path.normpath() + ตาราง mapping ใน Python เพื่อแปลง from store.gameStore import x ให้เป็น path ไฟล์จริง",
    defenseTip: "จุดขายของหนูคือ inferStructuralRelations ที่แยกความสัมพันธ์จากโครงสร้างโฟลเดอร์ได้เลยโดยไม่ต้องดึงโค้ดทุกไฟล์ ทำให้ประหยัดโควตา API และเร็วขึ้นมากค่ะ"
  },
  {
    step: 3,
    title: "3. แกะและตรวจ URL จากผู้ใช้",
    subTitle: "เช็กความถูกต้อง & ดึง owner/repo (บรรทัด 261 - 298)",
    pRange: [261, 298],
    pTarget: 278,
    gRange: [4, 52],
    gTarget: 7,
    objective: "รับ URL ที่ผู้ใช้กรอก แล้วส่งให้เพื่อนคนที่ 1 แกะว่าใครเป็นเจ้าของ (owner) และชื่อคลังอะไร (repo) ถ้าไม่ใช่ลิงก์ github.com ให้ปัดทิ้งทันที",
    pMechanics: "• บรรทัด 273: เริ่มจับเวลา startTime = performance.now() เพื่อวัดความเร็วรวมตอนท้าย\n• บรรทัด 277-291: ส่ง URL ให้ parseGitHubUrl() ของคนที่ 1 ถ้าโมดูลมีปัญหา บล็อก catch จะตัดสตริงสำรองให้เอง (Fallback Guard)\n• บรรทัด 293-295: Guard Clause ถ้าไม่ได้ owner/repo โยน Error 'URL ต้องมาจาก github.com เท่านั้น'\n• บรรทัด 297-298: แยกค่า owner, repo และตั้ง activeBranch เริ่มที่ 'main'",
    rMechanics: "• บรรทัด 12-13: await req.json() อ่าน body ที่หน้าเว็บ (คน 4) ส่งมา { url, token }\n• บรรทัด 16-21: ถ้าไม่มี url ตอบ HTTP 400 กลับไปทันที\n• บรรทัด 24: ส่ง url + token เข้า runAnalysisPipeline()",
    gMechanics: "• บรรทัด 7-52: parseGitHubUrl() ตรวจค่าว่าง (9-11), เติม https:// ให้เอง (16-18), เช็ค hostname ลงท้าย github.com (23-25), แยก segment (29-34), ตัด .git (40-42) แล้วคืน { owner, repo } (48)",
    teammateContract: "ส่งสตริง URL ให้เพื่อนคนที่ 1 (github.ts บรรทัด 7-52) -> ได้รับกลับมาเป็น { owner, repo }",
    variables: "startTime, parsed: { owner, repo }, activeBranch = 'main'",
    pythonAnalogy: "เหมือนใช้ urllib.parse แยก URL แล้วเช็ก if not owner: raise ValueError('ต้องเป็นลิงก์ GitHub เท่านั้น')",
    defenseTip: "ส่วนนี้เป็นด่านคัดกรองด่านแรก หนูมีทั้งตัวแกะ URL ของคนที่ 1 และตัวตัดสตริงสำรองที่บรรทัด 279-291 ทำให้ระบบไม่พังแม้โมดูลของเพื่อนมีบั๊กค่ะ"
  },
  {
    step: 4,
    title: "4. เช็กแคชเดิม (ถ้าเคยทำแล้วตอบทันที)",
    subTitle: "Cache Hit: ตอบกลับในระดับมิลลิวินาที (บรรทัด 299 - 308)",
    pRange: [299, 308],
    pTarget: 301,
    gRange: null,
    gTarget: null,
    objective: "แอบดูในแรมก่อนว่า URL นี้เคยวิเคราะห์แล้วหรือยัง ถ้าเคยให้หยิบผลเก่าส่งกลับทันที ไม่ต้องยิง GitHub API ซ้ำ",
    pMechanics: "• บรรทัด 301: pipelineCache.has(githubUrl) เช็คว่าเคยจำงานนี้ไว้หรือยัง\n• บรรทัด 302: pipelineCache.get() ดึงผลเก่าออกมา\n• บรรทัด 303-307: คืนผลเดิมพร้อมแนบ isCached: true และ executionTimeMs ที่น้อยมาก",
    rMechanics: "• บรรทัด 24: await runAnalysisPipeline() ได้ผลจากแคชเกือบทันที\n• บรรทัด 27: NextResponse.json(result, { status: 200 }) ส่งขึ้นจอผู้ใช้ทันที",
    gMechanics: "• สเต็ปนี้ไม่ได้เรียก github.ts: การตอบจากแคชช่วยประหยัดโควตา GitHub API (จำกัด 60 ครั้ง/ชม. ถ้าไม่มี Token)",
    teammateContract: "ไม่ต้องรบกวนเพื่อนเลย — ตอบจากแคชตรง ๆ แล้วจบการทำงาน",
    variables: "cachedResult, isCached: true",
    pythonAnalogy: "เหมือน if url in cache: return cache[url] หรือใช้ @functools.lru_cache ตกแต่งฟังก์ชัน",
    defenseTip: "ตรงนี้คือหัวใจด้าน Performance ค่ะ งานซ้ำตอบเร็วขึ้นหลายเท่าตัวและไม่เปลืองโควตา API ของ GitHub เลย"
  },
  {
    step: 5,
    title: "5. ดึงโครงสร้างโปรเจกต์จาก GitHub API",
    subTitle: "fetch Trees API + Fallback branch master (บรรทัด 309 - 361)",
    pRange: [309, 361],
    pTarget: 317,
    gRange: [54, 81],
    gTarget: 57,
    objective: "ยิงคำขอไปที่ GitHub Trees API เพื่อขอรายชื่อไฟล์ทั้งโปรเจกต์ในครั้งเดียว พร้อมระบบสำรองเมื่อคลังไม่ได้ใช้ branch main",
    pMechanics: "• บรรทัด 312-314: ถ้าเป็น Unit Test ใช้ mockTreeData ข้ามการยิงเน็ต\n• บรรทัด 317-320: fetch(buildGitHubApiUrl(owner, repo, branch), { headers: buildGitHubHeaders(token) }) — ประกอบจากเครื่องมือของคนที่ 1\n• บรรทัด 323-332: ถ้า 404 ที่ branch main ให้ลอง master อัตโนมัติ (Fallback)\n• บรรทัด 334-346: จัดการ Error 404 (ไม่พบคลัง), 403 (Rate Limit แนะนำใส่ Token)\n• บรรทัด 348-351: แกะ json.tree เก็บใน treeData\n• บรรทัด 352-360: catch โยนข้อความที่อ่านง่าย ไม่ปล่อย stack ดิบ",
    rMechanics: "• บรรทัด 24: ส่ง token ที่ผู้ใช้กรอกต่อให้ Pipeline เพื่อขยายโควตา API จาก 60 เป็น 5,000 ครั้ง/ชม.",
    gMechanics: "• บรรทัด 57-60: buildGitHubApiUrl() ประกอบลิงก์ Trees API พร้อม ?recursive=1 ได้ทุกไฟล์ในครั้งเดียว\n• บรรทัด 66-81: buildGitHubHeaders() แนบ User-Agent และ Authorization: Bearer ถ้ามี Token",
    teammateContract: "เรียกใช้ buildGitHubApiUrl (บรรทัด 57-60) และ buildGitHubHeaders (บรรทัด 66-81) ของเพื่อนคนที่ 1",
    variables: "treeData (รายชื่อไฟล์ทั้งโปรเจกต์), activeBranch",
    pythonAnalogy: "เหมือน requests.get(api_url, headers=headers) แล้วเช็ก if response.status_code == 403: raise",
    defenseTip: "หนูยิง API แบบ recursive=1 รอบเดียวได้ไฟล์ทั้งโปรเจกต์ และมี Fallback main→master อัตโนมัติ (บรรทัด 323-332) ทำให้รองรับทั้งคลังเก่าและใหม่ค่ะ"
  },
  {
    step: 6,
    title: "6. กรองไฟล์ สกัดความสัมพันธ์ วาดกราฟ และส่งผลลัพธ์",
    subTitle: "ทีมคน 2 + คน 3 + แพ็กเกจผลลัพธ์ (บรรทัด 362 - 561)",
    pRange: [362, 561],
    pTarget: 554,
    gRange: null,
    gTarget: null,
    objective: "คัดเฉพาะไฟล์โค้ดที่สำคัญ แกะความเชื่อมโยงจากโค้ดจริง ส่งให้คนที่ 3 วาดกราฟ แล้วแพ็กเป็น AnalysisResult บันทึกแคชและส่งกลับหน้าจอ",
    pMechanics: "• บรรทัด 365-377: filterTreeFiles(treeData, 500) ของคนที่ 2 กรองโฟลเดอร์ขยะ จำกัดไม่เกิน 500 ไฟล์ (กันโหลดหนัก)\n• บรรทัด 379-394: detectNextFileType() จำแนกประเภทไฟล์ page/action/middleware/store/component\n• บรรทัด 403-438: ดึงโค้ดจริงจาก raw.githubusercontent.com เฉพาะ 45 ไฟล์แรก พร้อม timeout 4 วินาที (บรรทัด 413)\n• บรรทัด 443-499: แกะ import/action triggers แล้ว resolve เป็น path จริงด้วยเครื่องมือของเรา\n• บรรทัด 504-506: ถ้าไม่มีความสัมพันธ์เลย ใช้ inferStructuralRelations() เดาจากโครงสร้าง App Router\n• บรรทัด 508-537: คนที่ 3 วาดกราฟ buildFlowElements() + เขียน Mermaid\n• บรรทัด 539-556: รวม finalResult, บันทึกแคช (554) แล้ว return (556)",
    rMechanics: "• บรรทัด 27: รับผลสำเร็จส่ง NextResponse 200 กลับหน้าเว็บ\n• บรรทัด 28-36: ถ้า Pipeline โยน Error ใด ๆ แปลงเป็น HTTP 500 พร้อมข้อความที่เข้าใจง่าย",
    gMechanics: "• สเต็ปนี้ไม่ได้เรียก github.ts โดยตรง: การดึงโค้ดดิบใช้ลิงก์ raw.githubusercontent.com ที่ประกอบเองในบรรทัด 408 (เพื่อไม่เปลืองโควตา API หลัก)",
    teammateContract: "คนที่ 2 (parser.ts กรอง+แกะโค้ด) -> คนที่ 3 (generator.ts วาดกราฟ+Mermaid) -> ส่งผลต่อคนที่ 4 (หน้าจอ) และคนที่ 5 (Inspector)",
    variables: "filteredItems, relations, flowElements, mermaidSyntax, finalResult",
    pythonAnalogy: "เหมือนท่อประมวลผล: กรองไฟล์ → แกะ import → วาดกราฟ → รีเทิร์นดิกชันนารีก้อนใหญ่ก้อนเดียวจบ",
    defenseTip: "หนูคุมจังหวะการทำงานทั้งหมดตรงนี้ค่ะ ทุกโมดูลของเพื่อนถูกครอบด้วย try-catch พร้อมโค้ดสำรอง ทำให้แม้เพื่อนส่งงานไม่ครบ ระบบก็ยังวิเคราะห์ออกมาได้ และแนบเวลา executionTimeMs ให้เห็นประสิทธิภาพจริงค่ะ"
  }
];

let FILE_META = null;
// Lazy init: สร้างตอน DOMContentLoaded เพื่อไม่ผูกลำดับโหลดสคริปต์กับ RAW_*
function initFileMeta() {
  FILE_META = [
  { key: "pipeline", name: "pipeline.ts", raw: RAW_PIPELINE, pane: "left", icon: "TS", role: "(Core)", badge: "คน 6: Core Pipeline", bc: "src / lib / <strong>pipeline.ts</strong>", tech: "TypeScript 5.x" },
  { key: "route", name: "route.ts", raw: RAW_ROUTE, pane: "left", icon: "TS", role: "(API Route)", badge: "คน 6: API Route", bc: "src / app / api / analyze / <strong>route.ts</strong>", tech: "Next.js App Router (POST)" },
  { key: "parser", name: "parser.ts", raw: RAW_PARSER, pane: "left", icon: "TS", role: "(คน 2)", badge: "คน 2: Parser Engine", bc: "src / lib / <strong>parser.ts</strong>", tech: "TypeScript 5.x" },
  { key: "generator", name: "generator.ts", raw: RAW_GENERATOR, pane: "left", icon: "TS", role: "(คน 3)", badge: "คน 3: Flow Generator", bc: "src / lib / <strong>generator.ts</strong>", tech: "TypeScript + Dagre" },
  { key: "test6", name: "6_integration.test.ts", raw: RAW_TEST6, pane: "left", icon: "TS", role: "(เทสคน 6)", badge: "คน 6: Integration Test", bc: "src / tests / <strong>6_integration_pipeline.test.ts</strong>", tech: "Vitest + Mock" },
  { key: "github", name: "github.ts", raw: RAW_GITHUB, pane: "right", icon: "TS", role: "(คน 1)", badge: "คน 1: GitHub Service", bc: "src / lib / <strong>github.ts</strong>", tech: "GitHub REST v3" },
  { key: "page", name: "page.tsx", raw: RAW_PAGE, pane: "right", icon: "TS", role: "(คน 4)", badge: "คน 4: Dashboard UI", bc: "src / app / <strong>page.tsx</strong>", tech: "React Client Component" },
  { key: "uihelper", name: "ui-helper.ts", raw: RAW_UIHELPER, pane: "right", icon: "TS", role: "(คน 4)", badge: "คน 4: UI Helper & URL Guard", bc: "src / lib / <strong>ui-helper.ts</strong>", tech: "Validation & Share Link" },
  { key: "flowcanvas", name: "FlowCanvas.tsx", raw: RAW_FLOWCANVAS, pane: "right", icon: "TS", role: "(คน 3)", badge: "คน 3: Flow Canvas (Visualizer)", bc: "src / components / <strong>FlowCanvas.tsx</strong>", tech: "React Flow + Dagre" },
  { key: "sidedrawer", name: "SideDrawer.tsx", raw: RAW_SIDEDRAWER, pane: "right", icon: "TS", role: "(คน 5)", badge: "คน 5: Side Drawer (Inspector)", bc: "src / components / <strong>SideDrawer.tsx</strong>", tech: "React Inspector UI" },
  { key: "codeviewer", name: "code-viewer.ts", raw: RAW_CODEVIEWER, pane: "right", icon: "TS", role: "(คน 5)", badge: "คน 5: Code Viewer (Prism)", bc: "src / lib / <strong>code-viewer.ts</strong>", tech: "Prism Highlighter" },
  { key: "layout", name: "layout.tsx", raw: RAW_LAYOUT, pane: "right", icon: "TS", role: "(Shared)", badge: "Shared: Root Layout", bc: "src / app / <strong>layout.tsx</strong>", tech: "Next.js App Router" },
  { key: "types", name: "types/index.ts", raw: RAW_TYPES, pane: "right", icon: "TS", role: "(Shared)", badge: "Shared: สัญญาข้อมูลกลาง", bc: "src / types / <strong>index.ts</strong>", tech: "TypeScript Interfaces" },
  { key: "globals", name: "globals.css", raw: RAW_GLOBALS, pane: "right", icon: "CSS", role: "(Shared)", badge: "Shared: ธีม CSS", bc: "src / app / <strong>globals.css</strong>", tech: "CSS Variables Theme" },
  { key: "test1", name: "1_github.test.ts", raw: RAW_TEST1, pane: "right", icon: "TS", role: "(เทสคน 1)", badge: "เทสคน 1: GitHub Service", bc: "src / tests / <strong>1_github.test.ts</strong>", tech: "Vitest" },
  { key: "test2", name: "2_parser.test.ts", raw: RAW_TEST2, pane: "right", icon: "TS", role: "(เทสคน 2)", badge: "เทสคน 2: Parser", bc: "src / tests / <strong>2_parser.test.ts</strong>", tech: "Vitest" },
  { key: "test3", name: "3_generator.test.ts", raw: RAW_TEST3, pane: "right", icon: "TS", role: "(เทสคน 3)", badge: "เทสคน 3: Generator", bc: "src / tests / <strong>3_generator.test.ts</strong>", tech: "Vitest" },
  { key: "test4", name: "4_frontend_ui.test.ts", raw: RAW_TEST4, pane: "right", icon: "TS", role: "(เทสคน 4)", badge: "เทสคน 4: Frontend UI", bc: "src / tests / <strong>4_frontend_ui.test.ts</strong>", tech: "Vitest" },
  { key: "test5", name: "5_side_drawer.test.ts", raw: RAW_TEST5, pane: "right", icon: "TS", role: "(เทสคน 5)", badge: "เทสคน 5: Side Drawer", bc: "src / tests / <strong>5_side_drawer.test.ts</strong>", tech: "Vitest" }
];
}

const SIM_STEPS = [
  { n: 1, actor: "คน 4", color: "#58a6ff", title: "ผู้ใช้กรอก URL บนหน้าเว็บ Dashboard", detail: "ผู้ใช้พิมพ์ลิงก์ GitHub และกดปุ่มวิเคราะห์บนหน้า Dashboard ที่เพื่อนคนที่ 4 สร้างไว้ — จุดเริ่มต้นของทุกอย่าง", fileRef: "src/app/page.tsx" },
  { n: 2, actor: "คน 4 → คน 6", color: "#58a6ff", title: "ยิงคำขอ POST /api/analyze", detail: "หน้าเว็บส่ง fetch แบบ POST พร้อม JSON body { url, token } เข้าหา Endpoint ของคนที่ 6 ที่วางรอไว้", fileRef: "page.tsx → /api/analyze" },
  { n: 3, actor: "คน 6", color: "#ff7b72", title: "route.ts รับและตรวจคำขอ", detail: "await req.json() อ่าน body (บรรทัด 12-13) แล้ว Guard Clause เช็คว่ามี url หรือไม่ ถ้าไม่มีตอบ HTTP 400 กลับไปทันที (บรรทัด 16-21)", fileRef: "route.ts:12-21" },
  { n: 4, actor: "คน 6", color: "#ff7b72", title: "ส่งต่อเข้า Core Pipeline", detail: "route เรียก await runAnalysisPipeline(url, token) มอบงานให้ตัวคุมจังหวะกลางของคนที่ 6 ลงมือประสานงานทุกโมดูล", fileRef: "route.ts:24" },
  { n: 5, actor: "คน 1", color: "#3fb950", title: "แกะ URL → owner/repo", detail: "parseGitHubUrl() ตรวจโดเมน github.com ตัด .git และแยก segment ได้ { owner, repo } พร้อม Fallback ตัดสตริงสำรองของคนที่ 6 (บรรทัด 278-291)", fileRef: "github.ts:7-52" },
  { n: 6, actor: "คน 6", color: "#ff7b72", title: "เช็กแคชก่อนลงมือ", detail: "pipelineCache.has(githubUrl) — ถ้าเคยวิเคราะห์แล้ว คืนผลเก่าพร้อม isCached: true จบในระดับมิลลิวินาที ไม่ต้องยิง API ซ้ำ (บรรทัด 301-308)", fileRef: "pipeline.ts:301-308" },
  { n: 7, actor: "คน 1 + 6", color: "#3fb950", title: "ยิง GitHub Trees API", detail: "buildGitHubApiUrl + buildGitHubHeaders แล้ว fetch แบบ ?recursive=1 ได้ไฟล์ทั้งโปรเจกต์รอบเดียว มี Fallback main→master อัตโนมัติ (บรรทัด 317-332)", fileRef: "pipeline.ts:317-332 / github.ts:57-81" },
  { n: 8, actor: "คน 2", color: "#bc8cff", title: "กรองและจำแนกไฟล์", detail: "filterTreeFiles(treeData, 500) ตัดโฟลเดอร์ขยะ แล้ว detectNextFileType() จำแนกประเภท page/action/middleware/store/component (บรรทัด 365-394)", fileRef: "pipeline.ts:365-394 / parser.ts" },
  { n: 9, actor: "คน 2 + 3", color: "#d29922", title: "แกะความสัมพันธ์และวาดกราฟ", detail: "ดึงโค้ดจริงจาก raw CDN (45 ไฟล์แรก, timeout 4s) แกะ imports/actions เสริมด้วย inferStructuralRelations แล้วให้คนที่ 3 สร้างโหนด/เส้น + Mermaid (บรรทัด 397-537)", fileRef: "pipeline.ts:397-537 / generator.ts" },
  { n: 10, actor: "คน 6 → คน 4", color: "#ff7b72", title: "แพ็กผลลัพธ์ส่งกลับหน้าจอ", detail: "รวม AnalysisResult พร้อม executionTimeMs, บันทึกลงแคช (บรรทัด 554), route ตอบ NextResponse 200 ให้ Dashboard ขึ้นกราฟทันที", fileRef: "pipeline.ts:539-556 / route.ts:27" }
];

// SIM_JUMPS: จังหวะซิมูแลเตอร์ -> ช่วงโค้ดจริงที่เกี่ยวข้อง (ไฟล์ + บรรทัด จากโปรเจกต์จริง)
// file/line = จุดเป้าหมายหลัก · snippets = ช่วงโค้ดที่แสดง inline ในซิมูเลเตอร์ (start/end ครอบเป้าหมาย)
const SIM_JUMPS = [
  {
    file: "page", line: 262,
    snippets: [
      { file: "page", line: 262, start: 259, end: 268, note: "ฟอร์มบนหน้า Dashboard — onSubmit ผูกกับ handleSubmit ของคนที่ 4" }
    ]
  },
  {
    file: "page", line: 119,
    snippets: [
      { file: "page", line: 119, start: 114, end: 123, note: "fetch() แบบ POST ไป /api/analyze พร้อม body { url, token }" }
    ]
  },
  {
    file: "route", line: 12,
    snippets: [
      { file: "route", line: 12, start: 11, end: 21, note: "อ่าน body จาก request แล้วเข้า Guard Clause ตรวจ url ก่อน" }
    ]
  },
  {
    file: "route", line: 24,
    snippets: [
      { file: "route", line: 24, start: 22, end: 27, note: "ส่งต่อเข้า runAnalysisPipeline — หัวใจงานของคนที่ 6" }
    ]
  },
  {
    file: "github", line: 7,
    snippets: [
      { file: "github", line: 7, start: 7, end: 22, note: "parseGitHubUrl() — แกะโดเมน github.com ออกเป็น { owner, repo }" }
    ]
  },
  {
    file: "pipeline", line: 301,
    snippets: [
      { file: "pipeline", line: 301, start: 299, end: 308, note: "เช็ค In-Memory Cache — ถ้ามีผลแล้วคืนค่าเดิม isCached: true จบในระดับมิลลิวินาที" }
    ]
  },
  {
    file: "pipeline", line: 317,
    snippets: [
      { file: "pipeline", line: 317, start: 316, end: 322, note: "ยิง GitHub Trees API แบบ ?recursive=1 ได้ไฟล์ทั้งโปรเจกต์รอบเดียว" },
      { file: "github", line: 57, start: 57, end: 70, note: "buildGitHubApiUrl + buildGitHubHeaders ของคนที่ 1 ประกอบ URL และแนบ Token" }
    ]
  },
  {
    file: "pipeline", line: 366,
    snippets: [
      { file: "pipeline", line: 366, start: 364, end: 367, note: "เรียก filterTreeFiles และมี catch fallback ไว้กัน pipeline พัง" },
      { file: "parser", line: 62, start: 62, end: 68, note: "ตัวแกนจริงของคนที่ 2: ตัดโฟลเดอร์ขยะ + จำกัดจำนวนไฟล์" },
      { file: "parser", line: 119, start: 119, end: 124, note: "detectNextFileType — จำแนก page/action/middleware/store/component" }
    ]
  },
  {
    file: "pipeline", line: 444,
    snippets: [
      { file: "pipeline", line: 444, start: 442, end: 449, note: "ดึงคำสั่ง import จริงจากโค้ดดิบ แล้วผูกเป้าหมายเข้ากับไฟล์จริง" },
      { file: "generator", line: 65, start: 65, end: 72, note: "buildFlowElements — สร้าง node/edge แล้วจัดวางด้วย Dagre" },
      { file: "generator", line: 165, start: 165, end: 172, note: "generateMermaidSyntax — แปลงความสัมพันธ์เป็นกราฟ Mermaid" }
    ]
  },
  {
    file: "pipeline", line: 554,
    snippets: [
      { file: "pipeline", line: 554, start: 546, end: 556, note: "แพ็ก AnalysisResult พร้อมเวลา แล้วบันทึกลงแคชก่อนคืนค่า" },
      { file: "route", line: 27, start: 26, end: 27, note: "ตอบ NextResponse.json(result, 200) กลับหน้า Dashboard" }
    ]
  }
];

const CICD_SECTIONS = [
  {
    title: "ทริกเกอร์: เมื่อไหร่ CI ถึงทำงาน",
    badge: "ci.yml บรรทัด 1-7",
    desc: "Workflow ชื่อ 'CI Pipeline' จะทำงานเมื่อมีการ push หรือเปิด pull_request เข้า branch main เท่านั้น — งานบน branch ย่อยจะถูกตรวจผ่าน PR",
    code: "name: CI Pipeline\n\non:\n  push:\n    branches: [ main ]\n  pull_request:\n    branches: [ main ]"
  },
  {
    title: "Job test: เตรียมสนามทดสอบ",
    badge: "ci.yml บรรทัด 9-25",
    desc: "รันบนเครื่อง ubuntu-latest: checkout โค้ดด้วย actions/checkout@v4, ติดตั้ง Node.js 20 พร้อมแคช npm, และ npm ci ติดตั้ง dependency ตาม lock file แบบพอดีเป๊ะ",
    code: "jobs:\n  test:\n    name: Run Unit Tests\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'\n      - name: Install Dependencies\n        run: npm ci"
  },
  {
    title: "Targeted Test: อ่านชื่อ Branch ด้วย Regex",
    badge: "ci.yml บรรทัด 27-38",
    desc: "ไส้เดือนของทีม 6 คน: ถ้า branch ชื่อ feat/person-X จะรันเทสเฉพาะของคน X + Integration Test ของคน 6 ประหยัดเวลาไม่ต้องรันเทสทั้งโปรเจกต์ แต่ถ้าเป็น main จะรันเต็มทุกตัว",
    code: "REF_NAME=\"${{ github.head_ref || github.ref_name }}\"\nif [[ \"$REF_NAME\" =~ feat/person-([1-6]) ]]; then\n  PERSON=\"${BASH_REMATCH[1]}\"\n  echo \"Running targeted tests for Person $PERSON...\"\n  npx vitest run src/tests/${PERSON}_*.test.ts \\\n     src/tests/6_integration_pipeline.test.ts\nelse\n  echo \"Running full test suite for main...\"\n  npm test\nfi"
  },
  {
    title: "Build Check: ประตูสุดท้ายก่อนรับโค้ด",
    badge: "ci.yml บรรทัด 40-41",
    desc: "สุดท้ายสั่ง npm run build — ถ้า TypeScript หรือ Next.js คอมไพล์ไม่ผ่าน CI จะขึ้นสถานะแดงทันที ป้องกันโค้ดพังขึ้น main",
    code: "- name: Run Next.js Build\n  run: npm run build"
  },
  {
    title: "Dockerfile: แพ็กระบบเป็นคอนเทนเนอร์",
    badge: "Dockerfile บรรทัด 1-20",
    desc: "ใช้ base image node:20-alpine ที่เบาเป็นพิเศษ ติดตั้ง dependency → คัดลอกโค้ด → build → เปิดพอร์ต 3000 ในโหมด production พร้อมรันด้วย compose.yaml ได้ทันที",
    code: "FROM node:20-alpine AS base\nWORKDIR /app\nCOPY package.json package-lock.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\nEXPOSE 3000\nENV PORT=3000\nENV NODE_ENV=production\nCMD [\"npm\", \"start\"]"
  },
  {
    title: "ทำไมสถาปัตยกรรมนี้ถึงเวิร์กกับทีม 6 คน",
    badge: "สรุปเจตนา",
    desc: "ทุกคน push งานบน branch feat/person-X ของตัวเอง → CI จับชื่อ branch ด้วย Regex แล้วรันเทสเฉพาะของคนนั้น + Integration ของคน 6 → ผ่านค่อย merge เข้า main ทำให้งานไม่ทับกัน รู้ทันทีว่าใครทำอะไรพัง และประหยัดเวลารันเทสมหาศาล",
    code: null
  }
];

const REDTEAM_ITEMS = [
  {
    icon: "⏱️",
    title: "GitHub API Rate Limit",
    risk: "GitHub จำกัด 60 ครั้ง/ชม. ต่อ IP ถ้าไม่มี Token — ผู้ใช้เยอะเมื่อไหร่ ระบบตายก่อนพัง",
    fix: "แคช In-Memory (บรรทัด 301) ตอบงานซ้ำโดยไม่ยิง API + รับ Token จากผู้ใช้ขยายเป็น 5,000/ชม. + inferStructuralRelations สร้างกราฟจากโครงสร้างโฟลเดอร์โดยไม่ต้องดึงโค้ดทุกไฟล์"
  },
  {
    icon: "🌊",
    title: "DoS ด้วยคลังขนาดยักษ์",
    risk: "ถ้าผู้ใช้วิเคราะห์ repo หลักแสนไฟล์ เซิร์ฟเวอร์จะโหลดหนักจนล่มทั้ง Memory และ Network",
    fix: "filterTreeFiles(treeData, 500) จำกัด 500 ไฟล์ (บรรทัด 366) และดึงเนื้อโค้ดแค่ 45 ไฟล์แรก พร้อม AbortSignal.timeout(4000) ตัดการรอเมื่อเน็ตช้า (บรรทัด 405, 413)"
  },
  {
    icon: "🧠",
    title: "หน่วยความจำของแคชเต็ม",
    risk: "pipelineCache โตได้ไม่จำกัด — ถ้ายิงหลายพัน URL ติดกัน แรมเซิร์ฟเวอร์จะบวมจนช้าลง",
    fix: "ยอมรับข้อจำกัดตรง ๆ และเสนอทางแก้ไว้ล่วงหน้า: ใช้ LRU Cache หรือกำหนด TTL ลบงานเก่า พร้อมมี clearPipelineCache() ไว้รีเซ็ตทันที (บรรทัด 13-18)"
  },
  {
    icon: "🎯",
    title: "SSRF / URL แปลกปลอม",
    risk: "ถ้ารับ URL อะไรก็ได้ ผู้ไม่หวังดีอาจชี้ระบบให้ไปยิง API ภายในเครือข่าย (Server-Side Request Forgery)",
    fix: "parseGitHubUrl บังคับ hostname ลงท้าย github.com เท่านั้น (github.ts 23-25) + Guard Clause ตรวจซ้ำใน pipeline (บรรทัด 293-295) และ URL ปลายทางประกอบจาก owner/repo ที่ผ่านการแกะแล้วเท่านั้น"
  },
  {
    icon: "🔑",
    title: "Token หลุดรั่ว",
    risk: "Token GitHub ที่ผู้ใช้กรอก ถ้าไปโผล่ใน log หรือแคช จะกลายเป็นช่องทางเจาะบัญชีของผู้ใช้",
    fix: "Token ถูกใช้แค่เป็น Authorization: Bearer header ชั่วคราว (github.ts 76) ไม่ถูกบันทึกลงแคช (แคชเก็บแค่ผลลัพธ์) และไม่มีจุดใด console.log ค่า Token"
  },
  {
    icon: "🕳️",
    title: "ข้อมูลภายในรั่วผ่าน Error",
    risk: "Stack trace ดิบที่ส่งกลับผู้ใช้ ช่วยให้แฮ็กเกอร์สำรวจโครงสร้างเซิร์ฟเวอร์ได้ฟรี ๆ",
    fix: "route.ts catch ทุก Error แล้วส่งเฉพาะ error.message ที่ควบคุมไว้ กรณีไม่รู้จักใช้ข้อความกลาง 'เกิดข้อผิดพลาดในการประมวลผล' (route.ts 29-35) ไม่โชว์ stack trace เด็ดขาด"
  }
];

const QNA_ITEMS = [
  {
    q: "ทำไมระบบต้องมีไฟล์ pipeline.ts แยกออกมาเป็นตัวกลาง?",
    a: "เพราะถ้าหน้าเว็บ (คน 4) ไปเรียกโมดูลของเพื่อนทุกตัวเอง โค้ดจะพันกันเป็นก้อนเดียว แก้ยากและเทสยาก pipeline.ts ทำหน้าที่เป็นตัวคุมจังหวะกลาง (Orchestrator) — ใครจะเปลี่ยน Parser เวอร์ชันใหม่ก็แก้ที่ไฟล์นี้ที่เดียว และเทสได้แยกจาก UI พร้อม mock ข้อมูลได้เลยผ่านพารามิเตอร์ mockTreeData และ mockFilesContent"
  },
  {
    q: "ถ้าเพื่อนส่งโค้ดมาไม่ครบหรือโมดูลมีบั๊ก ระบบจะพังไหม?",
    a: "ไม่พังค่ะ เพราะทุกการเรียกโมดูลเพื่อนถูกครอบด้วย try-catch พร้อมโค้ดสำรอง (Fallback Guard) เช่น แกะ URL เอง (บรรทัด 279-291), กรองไฟล์เอง (367-377), เดาประเภทไฟล์เอง (383-392) และวาดกราฟพิกัดง่าย ๆ เอง (511-529) — ผลลัพธ์อาจคร่าวกว่าปกติ แต่ระบบยังตอบผู้ใช้ได้ตลอดเวลา"
  },
  {
    q: "ทำไมต้องทำ In-Memory Cache ด้วย?",
    a: "สามเหตุผล: (1) GitHub จำกัด 60 ครั้ง/ชม. ถ้าไม่มี Token ยิงซ้ำเมื่อไหร่ก็โดนบล็อก (2) ความเร็ว — งานเดิมตอบในระดับมิลลิวินาที แทนที่จะรันวิเคราะห์ใหม่หลายวินาที (3) ลดต้นทุนการดึงโค้ดจาก raw CDN ที่ต้องใช้เน็ตเวิร์กจริงทุกครั้ง"
  },
  {
    q: "ถ้าคลังที่วิเคราะห์ไม่ได้ใช้ branch main จะเกิดอะไรขึ้น?",
    a: "ระบบจะเจอ 404 แล้ว Fallback ไปลอง branch master อัตโนมัติ (บรรทัด 323-332) ถ้าเจอใช้ตัวนั้นต่อและบันทึก activeBranch ไว้ในผลลัพธ์ ถ้าไม่เจอทั้งคู่จะโยน Error ชี้ชัดว่าไม่พบคลังหรือ branch เพื่อให้ผู้ใช้เช็คลิงก์ได้ทันที"
  },
  {
    q: "หนูวัดผลว่า Pipeline ของตัวเองทำงานดีแค่ไหนยังไง?",
    a: "แนบ executionTimeMs คำนวณจาก performance.now() ตั้งแต่บรรทัด 273 ถึงตอนสร้างผลลัพธ์ (550) + แฟล็ก isCached บอกว่าเป็นงานจากแคชหรืองานใหม่ + มีเทสชุด 6_integration_pipeline.test.ts รันบน CI ทุกครั้งที่ push เพื่อยืนยันว่าการเชื่อมต่อทุกโมดูลยังครบถ้วน"
  }
];

const QUIZ_QUESTIONS = [
  {
    q: "ตัวแปร pipelineCache ใน pipeline.ts เก็บข้อมูลในรูปแบบใด?",
    options: ["Array ของ string", "Map โดยใช้ URL เป็น Key และ AnalysisResult เป็น Value", "JSON string ที่เก็บลง localStorage", "Object เดียวเขียนทับกันไปมา"],
    answer: 1,
    explain: "บรรทัด 11: pipelineCache = new Map<string, AnalysisResult>() — ใช้ URL เป็นกุญแจเพื่อหยิบผลเก่ากลับมาได้เร็วระดับ O(1)"
  },
  {
    q: "ถ้าผู้ใช้กดวิเคราะห์โดยไม่กรอก URL ระบบตอบ HTTP Status อะไร?",
    options: ["200 OK", "301 Redirect", "400 Bad Request", "500 Internal Server Error"],
    answer: 2,
    explain: "route.ts บรรทัด 16-21: Guard Clause ตรวจ !url แล้วตอบ NextResponse.json(..., { status: 400 }) ทันทีโดยไม่ปล่อยเข้า Pipeline"
  },
  {
    q: "ฟังก์ชันใดต่อไปนี้ 'ไม่ใช่' ผลงานของเพื่อนคนที่ 1 (github.ts)?",
    options: ["parseGitHubUrl", "buildGitHubApiUrl", "filterTreeFiles", "buildGitHubHeaders"],
    answer: 2,
    explain: "filterTreeFiles เป็นของคนที่ 2 (parser.ts) ทำหน้าที่กรองไฟล์ขยะ ส่วนคนที่ 1 ดูแลเรื่อง URL และ Headers ทั้งหมด"
  },
  {
    q: "พารามิเตอร์ ?recursive=1 ใน GitHub Trees API มีความหมายว่าอะไร?",
    options: ["ยิง API ซ้ำ 2 รอบเพื่อความแม่นยำ", "ได้รายชื่อไฟล์ทุกโฟลเดอร์ย่อยทั้งโปรเจกต์ในครั้งเดียว", "ลบไฟล์ที่ซ้ำกันออกจากผลลัพธ์", "บังคับใช้ HTTPS เท่านั้น"],
    answer: 1,
    explain: "github.ts บรรทัด 59: ต่อท้ายลิงก์ด้วย ?recursive=1 เพื่อขอ tree ทั้งหมดแบบเวียนเกิด (recursive) ประหยัดการยิง API ทีละโฟลเดอร์"
  },
  {
    q: "ถ้าคลังเป้าหมายใช้ branch 'master' แทน 'main' ระบบทำอย่างไร?",
    options: ["โยน Error ทันทีให้ผู้ใช้แก้ URL", "ลองสร้าง branch main ให้อัตโนมัติ", "รอให้ผู้ใช้กดซ้ำจนสำเร็จ", "เจอ 404 แล้วลอง master อัตโนมัติแล้ววิเคราะห์ต่อ"],
    answer: 3,
    explain: "pipeline.ts บรรทัด 323-332: เมื่อตอบ 404 ที่ branch main จะ fetch ซ้ำด้วย master ถ้าสำเร็จเปลี่ยน activeBranch เป็น 'master' แล้วทำงานต่อโดยผู้ใช้ไม่ต้องทำอะไร"
  }
];

const QNA_JUMPS = [
  { file: "pipeline", line: 266 },
  { file: "pipeline", line: 279 },
  { file: "pipeline", line: 301 },
  { file: "pipeline", line: 323 },
  { file: "pipeline", line: 273 }
];

// ============================================================
// FILE_GUIDES — บทวิเคราะห์รายไฟล์ครบทั้ง 19 ไฟล์ (แสดงใน Inspector ด้านล่าง)
// mechanics ใช้รูปแบบ "• บรรทัด X-Y: ..." เพื่อให้ formatMechanicsLines() เน้นเลขบรรทัดได้
// ============================================================

const FILE_GUIDES = {
  pipeline: {
    role: "ตัวคุมจังหวะกลาง (Orchestrator) — ประสานงานทุกโมดูลตั้งแต่รับ URL จนส่งกราฟกลับหน้าจอ",
    mechanics: "• บรรทัด 2-5: import เครื่องมือของคน 1 (github), คน 2 (parser), คน 3 (generator) + Types กลาง\n• บรรทัด 7-11: pipelineCache = new Map() จองแคชในแรม ใช้ URL เป็น Key\n• บรรทัด 13-18: clearPipelineCache() ล้างแคชทั้งหมด ใช้ตอนรันเทส/รีเซ็ตระบบ\n• บรรทัด 20-74: resolveImportToFilePath() แปลง import เป็น path จริง 3 กลยุทธ์ (Alias 34-43, Relative 46-61, ค้นจากชื่อไฟล์ 64-71)\n• บรรทัด 80-259: inferStructuralRelations() เดาความสัมพันธ์จากโครงสร้าง App Router (middleware→root 105-112, layout renders page 134-141, parent→sub-route 164-190, component→page 194-223, component→store 226-240) กันเส้นซ้ำด้วย Set ที่ 86-93\n• บรรทัด 266-561: runAnalysisPipeline() หัวใจหลัก — จับเวลา 273, แกะ URL พร้อม Fallback Guard 277-291, กัน URL ปลอม 293-295, เช็กแคช 301-308, ยิง Trees API + Fallback main→master 317-332, จัดการ 404/403 334-346, กรองไฟล์ 365-377, ดึงโค้ดจริง 45 ไฟล์ timeout 4s 403-438, resolve ความสัมพันธ์ 443-499, วาดกราฟ 508-537, แพ็กผล + บันทึกแคช 539-556",
    links: "เรียกใช้: คน 1 (parseGitHubUrl, buildGitHubApiUrl, buildGitHubHeaders) · คน 2 (filterTreeFiles, detectNextFileType, extractImportsFromCode, extractActionTriggers) · คน 3 (buildFlowElements, generateMermaidSyntax) — ถูกเรียกโดย route.ts บรรทัด 24",
    defense: "หนูออกแบบให้ pipeline เป็นจุดเชื่อมเดียวของทุกโมดูล ทุกการเรียกเพื่อนครอบด้วย try-catch พร้อมโค้ดสำรอง และแนบ executionTimeMs ให้เห็นประสิทธิภาพจริงทุกครั้งค่ะ"
  },
  route: {
    role: "ประตูรับคำขอ HTTP (POST /api/analyze) — แปลงคำขอจากหน้าเว็บเป็นการเรียก Pipeline",
    mechanics: "• บรรทัด 1-6: import NextRequest/NextResponse และ runAnalysisPipeline จาก pipeline\n• บรรทัด 9: ประกาศ POST handler รอรับคำขอจากหน้าเว็บ (คน 4)\n• บรรทัด 12-13: await req.json() อ่าน body { url, token }\n• บรรทัด 16-21: Guard Clause — ถ้าไม่มี url ตอบ HTTP 400 กลับทันที\n• บรรทัด 24: ส่ง url + token เข้า runAnalysisPipeline()\n• บรรทัด 27: ตอบ NextResponse 200 พร้อมผลวิเคราะห์\n• บรรทัด 28-36: catch ทุก Error แปลงเป็น HTTP 500 พร้อมข้อความควบคุมไว้ ไม่รั่ว stack trace",
    links: "รับคำขอจาก page.tsx (fetch POST) → เรียก pipeline.ts — เป็นหน้าด่านเดียวที่โลกภายนอกติดต่อ",
    defense: "route ของหนูบางแค่ 37 บรรทัดเพราะตัดสินใจอะไรไม่เองเลย แค่ตรวจความถูกต้องเบื้องต้นแล้วส่งต่อให้ Pipeline ทำงานตามหน้าที่เดียวชัดเจนค่ะ"
  },
  github: {
    role: "ผู้เชี่ยวชาญ GitHub API (คน 1) — แกะ URL ประกอบลิงก์และ Headers ทุกชนิด",
    mechanics: "• บรรทัด 1-2: import ParsedGitHubUrl จาก types (สัญญาข้อมูลกลาง)\n• บรรทัด 7-52: parseGitHubUrl() ตรวจค่าว่าง 9-11, เติม https:// ให้เอง 16-18, เช็ค hostname ลงท้าย github.com 23-25, แยก segment 29-34, ตัด .git 40-42 แล้วคืน { owner, repo } ที่ 48\n• บรรทัด 57-60: buildGitHubApiUrl() ประกอบลิงก์ Trees API พร้อม ?recursive=1 ได้ทุกไฟล์ในครั้งเดียว\n• บรรทัด 66-81: buildGitHubHeaders() แนบ User-Agent เสมอ และ Authorization: Bearer ที่ 76 เมื่อมี Token\n• บรรทัด 86-101: buildGitHubRawUrl() ลิงก์ดึงโค้ดดิบสำหรับ Side Inspector (กันสลับพารามิเตอร์ filePath/branch)\n• บรรทัด 103-106: buildGitHubBlobUrl() ลิงก์เปิดดูไฟล์บนเว็บ GitHub",
    links: "ถูกเรียกโดย: pipeline.ts (แกะ URL, ประกอบ API) และ page.tsx (buildGitHubRawUrl/BlobUrl ตอนเปิด Drawer)",
    defense: "ฟังก์ชันของหนูเป็น Pure Function ทดสอบง่าย เทสคลอบคลุม 22 เคสรวมกรณี URL ปลอมและ Token มีเว้นวรรค ทำให้ด่านแรกของระบบแน่นหนาค่ะ"
  },
  parser: {
    role: "เครื่องกรองและแกะความสัมพันธ์จากโค้ด (คน 2) — คัดไฟล์ขยะ จำแนกเลเยอร์ แกะ import/action",
    mechanics: "• บรรทัด 4-19: BLACKLIST_FOLDERS รายชื่อ 16 โฟลเดอร์ขยะ (node_modules, .next, dist, tests ฯลฯ)\n• บรรทัด 24-46: BLACKLIST_FILES ชุดไฟล์ config/lockfile ที่ไม่ใช่ซอร์สโค้ด\n• บรรทัด 49-51: ALLOWED_ROOT_FILES ยกเว้น middleware.ts/proxy.ts ที่ต้องอยู่นอก src\n• บรรทัด 56: VALID_EXTENSIONS รับแค่ .ts .tsx .js .jsx\n• บรรทัด 62-117: filterTreeFiles() กรองเฉพาะ blob ที่ผ่านเกณฑ์ พร้อมตัดที่ maxLimit กันโหลดหนัก\n• บรรทัด 119-176: detectNextFileType() จำแนก 8 บทบาท: page → layout → middleware → action → store → api → component → other ตามลำดับความจำเพาะ\n• บรรทัด 178-209: extractImportsFromCode() แกะ import บรรทัดเดียว/หลายบรรทัด/type import ข้ามบรรทัดคอมเมนต์ และตัดซ้ำ\n• บรรทัด 211-286: extractActionTriggers() จับ onClick และ form action เชื่อม UI เข้าหา Server Action",
    links: "ถูกเรียกโดย pipeline.ts ขั้นกรองไฟล์ (365-394) และขั้นแกะความสัมพันธ์ (443-499) — ผลงานคน 2",
    defense: "จุดขายของหนูคือลำดับการจำแนก detectNextFileType ที่เรียงจากเฉพาะเจาะจงไปกว้าง ทำให้ไฟล์ชื่อซ้อนกัน เช่น actions/page.tsx ยังตัดสินถูกค่ะ"
  },
  generator: {
    role: "โรงงานวาดกราฟ (คน 3) — แปลง relations เป็นโหนด/เส้นของ React Flow และ Mermaid",
    mechanics: "• บรรทัด 8-23: sanitizeNodeId() แปลง path เป็น id ปลอดภัย ตัดวงเล็บ route group เช่น (auth)\n• บรรทัด 33-39: getNodeColorConfig() ชุดสีมาตรฐานตามบทบาท: middleware ม่วง, page ฟ้า, action ส้ม, store เขียว\n• บรรทัด 41-63: getNodeStyle() สร้าง inline style ต่อโหนดให้เหมาะกับธีมมืด\n• บรรทัด 65-163: buildFlowElements() แปลงไฟล์+relations เป็น Nodes/Edges พร้อมพิกัด position จัดกริดให้อ่านง่าย\n• บรรทัด 165-192: generateMermaidSyntax() ต่อสตริง graph TD พร้อม label ถ้าไม่มี relation เลยส่งโหนดเริ่มต้นกลับ ไม่ให้ error",
    links: "ถูกเรียกโดย pipeline.ts บรรทัด 508-537 — ผลลัพธ์ส่งตรงเข้า FlowCanvas.tsx ของคน 3 เองบนหน้าจอ",
    defense: "หนูแยกส่วนสร้างข้อมูลกราฟออกจากการแสดงผลชัดเจน buildFlowElements คืนข้อมูลล้วน ส่วน FlowCanvas จัดการ interactive เอง ทำให้เทสได้โดยไม่ต้องเปิดเบราว์เซอร์ค่ะ"
  },
  page: {
    role: "Dashboard หลักของเว็บแอป (คน 4) — รับ URL ยิง API และคุม State ทั้งหน้า",
    mechanics: "• บรรทัด 15: export default HomePage เริ่มคอมโพเนนต์\n• บรรทัด 17-24: useState 7 ตัว — url, token, loading, errorMessage, result, shareCopied, filterType\n• บรรทัด 26-32: drawerState คุม SideDrawer (isOpen, filePath, fileContent, githubRawUrl)\n• บรรทัด 32-97: handleSelectNode() ประกอบลิงก์ด้วยเครื่องมือคน 1 แล้ว fetch โค้ดจริง (73-84) พร้อม Fallback ดึงด้วย HEAD เมื่อ branch เปลี่ยน\n• บรรทัด 102-146: executeAnalysis() ตรวจ URL ด้วย validateUrlInput (105) แล้วยิง POST /api/analyze (119) ได้ผล set result (125)\n• บรรทัด 149-160: useEffect อ่าน ?state= เรียก decodeShareableState วิเคราะห์ต่อทันทีเมื่อเปิดลิงก์แชร์\n• บรรทัด 168-185: handleShare() encodeShareableState (172) แล้วคัดลอกลิงก์ลง clipboard\n• บรรทัด 195-230: useMemo คำนวณ stats, counts, displayedNodes/displayedEdges กรองตามเลเยอร์ที่เลือก\n• บรรทัด 265-290: ฟอร์มกรอก URL + Token พร้อมกล่องแจ้งเตือน error\n• บรรทัด 488: ติดตั้ง FlowCanvas · บรรทัด 498: ติดตั้ง SideDrawer",
    links: "เรียกหา: /api/analyze (ของคน 6), ui-helper (ตรวจ/แชร์), github.ts (ลิงก์ raw/blob) — ส่งงานให้ FlowCanvas + SideDrawer แสดงผล",
    defense: "หน้าของหนูเป็น State Orchestrator ล้วน ไม่มีตรรกะวิเคราะห์ปนเลย ทุกอย่างหนัก ๆ ฝาก API ของคน 6 ทำให้แยกเทสและแยกหน้าที่ชัดเจนค่ะ"
  },
  uihelper: {
    role: "เครื่องมือกลางฝั่ง UI (คน 4) — ตรวจ URL คำนวณสถิติและระบบแชร์ลิงก์",
    mechanics: "• บรรทัด 6-34: validateUrlInput() ด่านแรกก่อนยิง API — ค่าว่าง (8-10), ไม่ใช่ github.com (12-15), ดักแท็ก <script> ป้องกัน XSS (17-20) และ trim ให้เอง\n• บรรทัด 37-61: formatRepoStats() คำนวณจำนวนไฟล์ที่คัดกรองออกพร้อมเปอร์เซ็นต์ กัน NaN และค่าติดลบ\n• บรรทัด 64-106: calculateHealthScore() ให้เกรดสถาปัตยกรรม A (ratio 0.8-2.5), B (2.5-4.0), C (อื่น ๆ), N/A (0 ไฟล์)\n• บรรทัด 109-130: encodeShareableState() ฝัง url + activeNode เป็น base64 แนบใน ?state=\n• บรรทัด 133-164: decodeShareableState() ถอดกลับอย่างปลอดภัยด้วย try-catch ลิงก์ปลอมไม่ทำระบบพัง",
    links: "ถูกเรียกโดย page.tsx (ตรวจ URL, สถิติ, แชร์) — เทสโดย 4_frontend_ui.test.ts ของคน 4 เอง",
    defense: "validateUrlInput ของหนูดักทั้ง URL ผิดรูปแบบและการพยายามฝังสคริปต์ ช่วยลดภาระฝั่งเซิร์ฟเวอร์และเพิ่มชั้นความปลอดภัยตั้งแต่ปลายทางผู้ใช้ค่ะ"
  },
  codeviewer: {
    role: "ตัวจัดการโค้ดใน Inspector (คน 5) — ระบุภาษา ตัดทอน และไฮไลต์ด้วย Prism",
    mechanics: "• บรรทัด 14-59: getLanguageFromPath() แผนที่นามสกุลไฟล์เป็นชื่อภาษา Prism (tsx/typescript/javascript/json) พร้อม fallback ที่ไม่ crash\n• บรรทัด 62-96: formatCodeSnippet() ตัดโค้ดไม่เกิน maxLines (300) พร้อมคืน totalLines และธง isTruncated\n• บรรทัด 99-119: highlightCodeWithPrism() เรียก Prism.highlight แปลงโค้ดเป็น HTML มีสี กรณีภาษาไม่รู้จักคืนข้อความ escape ปลอดภัย",
    links: "ถูกเรียกโดย SideDrawer.tsx ของคน 5 — เทสโดย 5_side_drawer.test.ts (ครบทั้ง 3 ฟังก์ชัน)",
    defense: "หนูจำกัดโค้ดที่แสดงไว้ 300 บรรทัดเพื่อประสิทธิภาพ DOM และแจ้งสถานะ isTruncated ตรงไปตรงมา ผู้ใช้รู้ทันทีว่าเห็นโค้ดบางส่วนค่ะ"
  },
  flowcanvas: {
    role: "ผืนผ้าใบกราฟแบบอินเทอร์แอกทีฟ (คน 3) — แสดง/โฟกัส/ไล่เส้นทางบน React Flow",
    mechanics: "• บรรทัด 38-40: ค่ากริดผังกราฟ COLUMNS = 4 คอลัมน์ ขนาดช่อง 320×120\n• บรรทัด 45-112: computeTracePath() ไล่หาโหนดเชื่อมโยงทั้งสาย (Ancestors + Descendants) รองรับ 2 โหมด: ทั้งสาย และ 1 สเต็ป\n• บรรทัด 115-199: toRfNodes() แปลง FlowNodeItem เป็นโหนด React Flow พร้อมพิกัดกริดและสไตล์เรืองแสงเมื่ออยู่ในเส้นทาง\n• บรรทัด 202-205: BOILERPLATE_LABELS ชุดป้ายซ้ำซ้อน (shared UI ฯลฯ) ที่โหมดสมาร์ทจะซ่อน\n• บรรทัด 207-274: toRfEdges() กรองป้ายตามโหมด สมาร์ท/ทั้งหมด/ปิด และทำเส้น animated เมื่อถูกโฟกัส\n• บรรทัด 276-462: คอมโพเนนต์ FlowCanvas — state 4 ตัว (278-281), useMemo เตรียมโหนด/เส้น (284-297), Toolbar ลอย (325-405): ล้าง Focus, สวิตช์ trace, สวิตช์ป้าย, แผนที่ย่อ\n• บรรทัด 407-462: ReactFlow onNodeClick เลือกโหนดแล้วเรียก onSelectNode ให้ page.tsx เปิด Drawer พร้อม MiniMap ย่อ\n• บรรทัด 315-321: ถ้าไม่มีโหนดแสดงข้อความว่างอย่างสวยงาม ไม่ crash",
    links: "รับ nodes/edges จาก page.tsx (มาจาก generator ผ่าน API ของคน 6) — คลิกโหนดส่งกลับเป็นเหตุการณ์เปิด SideDrawer",
    defense: "หนูใช้ onlyRenderVisibleElements และ useMemo ทุกจุดเพื่อรองรับกราฟหลายร้อยโหนดแบบลื่น ๆ และโหมดสมาร์ทช่วยลดสัญญาณรบกวนจากป้ายซ้ำ ๆ ค่ะ"
  },
  sidedrawer: {
    role: "กล่องตรวจโค้ดเด้งด้านขวา (คน 5) — Dialog แสดงโค้ดจริงของโหนดที่คลิก",
    mechanics: "• บรรทัด 15: SideDrawer component รับ props isOpen/filePath/fileType/rawCode/githubRawUrl\n• บรรทัด 21-33: useMemo เตรียมผลลัพธ์ครบชุด — getLanguageFromPath + formatCodeSnippet(300) + highlightCodeWithPrism\n• บรรทัด 36-44: handleCopy() คัดลอกโค้ดเต็มลง clipboard พร้อมข้อความยืนยัน 2 วินาที\n• บรรทัด 48-96: โครง dialog — role=\"dialog\" aria-modal รองรับ screen reader (48-55), badge ประเภทไฟล์ (58-60), ชื่อไฟล์แบบ truncate (62)\n• บรรทัด 66-69: นับจำนวนบรรทัดจริง พร้อมเตือน Truncated เมื่อโค้ดเกิน 300 บรรทัด\n• บรรทัด 71-77: ปุ่ม Open on GitHub ↗ (เปิด blob URL) และ Copy Code\n• บรรทัด 79-93: แสดงโค้ดที่ผ่าน Prism ใน <pre><code> เลื่อนดูได้ทุกทิศ",
    links: "ถูกเปิดโดย page.tsx เมื่อคลิกโหนดบน FlowCanvas — ใช้เครื่องมือ code-viewer.ts ของคน 5 เอง",
    defense: "หนูใส่ aria-modal และ aria-label ให้ dialog ตั้งแต่ต้น และใช้ useMemo รวมการประมวลผล Prism ไว้จุดเดียว ทำให้เปิด-ปิด Drawer หลายรอบไม่หน่วงค่ะ"
  },
  layout: {
    role: "โครงหน้ารายของ Next.js (Shared) — โหลดฟอนต์และครอบทุกหน้า",
    mechanics: "• บรรทัด 1-3: import ฟอนต์จาก next/font/google และ globals.css\n• บรรทัด 5-19: ประกาศฟอนต์ 3 ตระกูล — Geist (หลัก), Geist Mono (โค้ด), IBM Plex Sans Thai weight 400-700 subsets thai+latin รองรับภาษาไทยเต็มรูปแบบ\n• บรรทัด 21-24: metadata ชื่อเว็บ \"GitFlow Visualizer\" + description\n• บรรทัด 26-40: RootLayout ครอบ <html><body> ส่งต่อ font variables ผ่าน className พร้อม antialiased",
    links: "ครอบ page.tsx โดยอัตโนมัติผ่าน App Router — ธีมสีและฟอนต์มาจาก globals.css",
    defense: "หนูเลือก IBM Plex Sans Thai เพราะอ่านภาษาไทยได้สวยทั้งขนาดเล็ก-ใหญ่ และใช้ next/font ที่ preload ให้เอง ทำให้ไม่มีปัญหา FOUT ตอนโหลดครั้งแรกค่ะ"
  },
  types: {
    role: "สัญญาข้อมูลกลางของทั้งทีม (Shared) — Interface หนึ่งเดียวที่ทุกโมดูลอ้างอิง",
    mechanics: "• บรรทัด 3: NextFileType 8 บทบาท — page/layout/action/middleware/store/component/api/other\n• บรรทัด 5-12: GitHubTreeItem โครงไฟล์จาก Trees API (path, mode, type blob|tree, sha)\n• บรรทัด 14-18: ParsedGitHubUrl ผลแกะ URL { owner, repo, branch? }\n• บรรทัด 20-26: CodeRelation เส้นความสัมพันธ์ — type import/action/event/middleware + label\n• บรรทัด 28-33: FlowNodeItem โหนดกราฟ (id, label, fileType, position x,y)\n• บรรทัด 35-41: FlowEdgeItem เส้นกราฟ (animated, style stroke)\n• บรรทัด 43-56: AnalysisResult ผลรวมสุดท้าย — totalFiles, relations, nodes, edges, mermaidSyntax, isCached, executionTimeMs\n• บรรทัด 58-64: SideDrawerState สถานะกล่องตรวจโค้ดของคน 4",
    links: "ถูก import โดยทุกโมดูล — เป็นจุดสัญญาณที่ทำให้ 6 คนพัฒนาแยกกันได้โดยไม่ทับกัน",
    defense: "ตรงนี้คือสัญญาประชาคมของทีม ใครเปลี่ยน interface ตรงนี้ TypeScript จะตะโกนทุกไฟล์ทันที ทำให้เราจับความเสียหายได้ตั้งแต่ตอน build ไม่ต้องรอ runtime ค่ะ"
  },
  globals: {
    role: "ธีมพื้นฐานของเว็บแอป (Shared) — สี ฟอนต์ และ scrollbar ระดับทั้งโปรเจกต์",
    mechanics: "• บรรทัด 1-7: @import tailwindcss และ @theme inline ผูกสี/ฟอนต์เข้ากับตัวแปร CSS\n• บรรทัด 9-12: :root กำหนดพื้นหลังเข้ม #090d16 ตัวอักษร #f1f5f9\n• บรรทัด 14-22: body ใช้ฟอนต์ไทย (font-thai) พร้อม font-feature-settings และ text-rendering optimizeLegibility\n• บรรทัด 24-28: ::selection สีฟ้าโปร่งแสงสำหรับข้อความที่ลากคลุม\n• บรรทัด 30-47: scrollbar บาง 6px สไตล์มืด ทั้งแนวตั้งและแนวนอน",
    links: "ถูก import โดย layout.tsx — ทุกคอมโพเนนต์ได้ธีมจากไฟล์นี้ผ่าน Tailwind theme",
    defense: "หนูตั้งพื้นหลังเข้มระดับ #090d16 ที่เข้มพอไม่ให้ขอบจอสว่างเกิน แต่ยังแยกชั้นพื้นผิวได้ บวก scrollbar บาง ๆ ให้ความรู้สึกเหมือนเครื่องมือดีไซเนอร์ระดับมืออาชีพค่ะ"
  },
  test1: {
    role: "เทสของคน 1 — พิสูจน์ github.ts แกะ URL และประกอบลิงก์ได้ครบทุกกรณี",
    mechanics: "• บรรทัด 6-78: parseGitHubUrl 12 เคส — https/http/ไม่มี scheme/www, ตัด .git, ตัด slash ท้าย, ตัด query+hash, ตัด /tree/main และ 3 เคสปัดค่าว่าง/ไม่ใช่ github/ไม่มี repo ให้ได้ null\n• บรรทัด 79-91: buildGitHubApiUrl 2 เคส — branch main ปกติ และ branch กำหนดเอง\n• บรรทัด 93-115: buildGitHubHeaders 4 เคส — ไม่มี token ต้องมี User-Agent, token ว่างต้องไม่มี Authorization, มี token แนบ Bearer ถูกต้อง, token มีเว้นวรรคต้อง trim\n• บรรทัด 117-132: buildGitHubRawUrl 3 เคส รวมป้องกันบั๊กสลับตำแหน่ง filePath/branch\n• บรรทัด 134-139: buildGitHubBlobUrl 1 เคส",
    links: "ทดสอบโมดูลคน 1 (github.ts) — รันอัตโนมัติบน CI ผ่าน Regex feat/person-1",
    defense: "เทสของหนูเน้นกรณีขอบที่ผู้ใช้เผลอทำ เช่น วางลิงก์มาจากหน้า /tree/main หรือ token มีช่องว่าง 22 เคสครอบคลุมทุกฟังก์ชันของ github.ts ค่ะ"
  },
  test2: {
    role: "เทสของคน 2 — ตรวจการกรองไฟล์ การจำแนกเลเยอร์ และการแกะ import/action",
    mechanics: "• บรรทัด 7-60: filterTreeFiles 3 เคส — กรอง node_modules/lockfile/รูป/config, เอาเฉพาะ blob ไม่เอาโฟลเดอร์, ตัดที่ maxLimit เพื่อความปลอดภัย\n• บรรทัด 62-100: detectNextFileType 9 เคส — page, layout, middleware/proxy, action, store, api, component และโปรเจกต์ไม่มี src/ นำหน้า\n• บรรทัด 102-145: extractImportsFromCode 5 เคส — import เดี่ยว, หลายบรรทัด, type import, ไม่แกะบรรทัดที่คอมเมนต์ทิ้ง, ตัดตัวซ้ำ\n• บรรทัด 147-177: extractActionTriggers 2 เคส — onClick ดึงชื่อฟังก์ชันเป้าหมาย และ form action สำหรับ Server Action",
    links: "ทดสอบโมดูลคน 2 (parser.ts) — ออกแบบร่วมกับเทสคน 6 ที่ mock ทั้ง tree และเนื้อโค้ด",
    defense: "หนูเขียนเคสสั้นแต่จำเพาะ แต่ละ it ตัดสินพฤติกรรมเดียว ทำให้เทสล้มเมื่อไหร่รู้ทันทีว่ากฎการกรองบรรทัดไหนพังค่ะ"
  },
  test3: {
    role: "เทสของคน 3 — ตรวจการทำ id, ชุดสี, พิกัดกราฟ และ Mermaid",
    mechanics: "• บรรทัด 7-18: sanitizeNodeId 3 เคส — เปลี่ยน slash/จุด/@ เป็น underscore, ตัดวงเล็บ route group เช่น (auth), ตัด underscore หัวท้ายเกิน\n• บรรทัด 21-40: getNodeColorConfig 4 เคส — middleware ม่วง #a855f7, page ฟ้า #38bdf8, action ส้ม #fb923c, store เขียว #4ade80\n• บรรทัด 43-71: buildFlowElements — แปลงไฟล์+relations เป็น Nodes/Edges พร้อมพิกัด position ครบ\n• บรรทัด 73-89: generateMermaidSyntax 2 เคส — ต่อ graph TD พร้อม label ถูกต้อง และไม่มี relation ก็ต้องไม่ error",
    links: "ทดสอบโมดูลคน 3 (generator.ts) — ชุดสีที่ตรวจที่นี่ต้องตรงกับที่ FlowCanvas ใช้จริง",
    defense: "หนูล็อกชุดสีไว้ในเทสเลย เพราะสีคือภาษาสื่อสารของกราฟ ถ้าใครเผลอเปลี่ยน CI จะจับได้ก่อนขึ้น main ค่ะ"
  },
  test4: {
    role: "เทสของคน 4 — ตรวจเครื่องมือฝั่ง UI ทั้งตรวจ URL สถิติและเกรดสถาปัตยกรรม",
    mechanics: "• บรรทัด 12-35: validateUrlInput 4 เคส — ค่าว่าง/เคาะวรรคแจ้งเตือน, ไม่ใช่ github ต้องเตือน, ดักแท็ก <script> แปลกปลอม, มีช่องว่างหน้าหลัง trim ให้เอง\n• บรรทัด 38-59: formatRepoStats 3 เคส — คำนวณสรุปถูกต้อง, 0 ไฟล์ไม่เออเร่อ NaN, ไฟล์วิเคราะห์มากกว่าดิบต้องตัดทิ้งเป็น 0 ไม่ติดลบ\n• บรรทัด 61-106: calculateHealthScore 4 เคส — ratio 0.8-2.5 ได้ A, 2.5-4.0 ได้ B, นอกช่วงได้ C, 0 ไฟล์ได้ N/A",
    links: "ทดสอบโมดูลคน 4 (ui-helper.ts) — ครอบคลุมฟังก์ชันที่หน้า Dashboard เรียกใช้ทุกตัว",
    defense: "หนูให้น้ำหนักเคสกันพังพิเศษ เช่น ไฟล์วิเคราะห์มากกว่าไฟล์ดิบต้องโชว์ 0% เพราะเคยเจอกรณี API คืนตัวเลขข้ามกันตอน branch เพิ่งถูก push ค่ะ"
  },
  test5: {
    role: "เทสของคน 5 — ตรวจเครื่องมือ Prism ทั้งระบุภาษา ตัดทอนและไฮไลต์",
    mechanics: "• บรรทัด 6-27: getLanguageFromPath 5 เคส — .tsx เป็น tsx, .ts เป็น typescript, .js เป็น javascript, .json เป็น json, นามสกุลไม่รู้จัก fallback ไม่ crash\n• บรรทัด 30-47: formatCodeSnippet 2 เคส — โค้ดสั้นนับบรรทัดถูกต้องไม่ขึ้น isTruncated, เกิน maxLines ตัดเฉพาะส่วนแรกและขึ้น isTruncated\n• บรรทัด 50-62: highlightCodeWithPrism 2 เคส — โค้ด TypeScript ต้องมีคลาส token ของ Prism, ภาษาไม่รองรับต้องคืนข้อความ escape ปลอดภัย",
    links: "ทดสอบโมดูลคน 5 (code-viewer.ts) — หน้าด่านก่อน SideDrawer แสดงโค้ดจริง",
    defense: "เคสสำคัญของหนูคือภาษาไม่รู้จักต้องไม่ crash เพราะผู้ใช้วิเคราะห์ repo อะไรก็ได้ ไฟล์แปลก ๆ เช่น Dockerfile ต้องโชว์เป็นข้อความธรรมดาอย่างปลอดภัยค่ะ"
  },
  test6: {
    role: "Integration Test ของคน 6 — พิสูจน์ว่าทั้ง 4 โมดูลเชื่อมกันได้จริงตั้งแต่ URL ถึงกราฟ",
    mechanics: "• บรรทัด 7-14: beforeEach/afterEach ล้างแคชและ restore mocks ทุกเคส กันข้อมูลตกค้าง\n• บรรทัด 21-70: โฟลว์ครบวงจร — mock tree 7 ไฟล์ (มีขยะ) ผ่าน runAnalysisPipeline ต้องได้ nodes ครบทุกประเภท, edge form action, และ mermaidSyntax มี graph TD\n• บรรทัด 74-93: แคช — ครั้งแรก isCached=false ครั้งสองดึงจาก pipelineCache ได้ isCached=true\n• บรรทัด 96-112: Performance — 500 ไฟล์ (250 ขยะ) ต้องจบใน < 150ms\n• บรรทัด 115-122: BVA — แคลงว่าง 0 ไฟล์ต้องคืน nodes/edges ว่างพร้อม mermaid ปลอดภัย\n• บรรทัด 125-131: Negative — URL gitlab ต้อง rejects พร้อมข้อความ 'URL ต้องมาจาก github.com เท่านั้น'\n• บรรทัด 133-145: Adversarial — mock fetch ตอบ 403 Rate Limit ต้อง throw แนะนำใส่ Token\n• บรรทัด 549-556: ปิดท้ายด้วยเทสเส้น shared UI — layout → ButtonComponent/MemberItem จาก inferStructuralRelations",
    links: "ทดสอบทั้งระบบรวม — คน 1+2+3 ส่งโมดูลมา หนูจับมาเดินทั้งไปป์ไลน์บน CI ทุกครั้งที่ใคร push",
    defense: "เทสนี้คือสัญญาของหนูกับทีม ใครแก้โมดูลจนการเชื่อมต่อพัง CI จะแดงภายในนาทีเดียว และเคส 500 ไฟล์ < 150ms พิสูจน์ว่าระบบไม่หน่วงแม้ repo ใหญ่ค่ะ"
  }
};
