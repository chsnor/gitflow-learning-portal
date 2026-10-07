// ============================================================
// data-content.js — เนื้อหาการสอนทั้งหมด (ไม่มี logic เรนเดอร์)
// FILE_META / LOGICAL_STEPS / SIM / CICD / REDTEAM / Q&A / QUIZ
// ============================================================

const LOGICAL_STEPS = [
  {
    step: 1,
    title: "1. โหลดโมดูล, แคช LRU & ความปลอดภัย Token",
    subTitle: "Import, computeCacheKey & BoundedLRUCache (บรรทัด 1 - 60)",
    pRange: [1, 60],
    pTarget: 10,
    gRange: [1, 13],
    gTarget: 13,
    objective: "ดึงเครื่องมือของเพื่อนคนที่ 1-3, สร้าง computeCacheKey (แฮช Token ด้วย SHA-256 แยกข้อมูลส่วนตัว) และ BoundedLRUCache (จำกัด 50 คลัง, อายุ 1 ชม.) ป้องกัน Cache Poisoning และการข้ามสิทธิ์",
    pMechanics: "• บรรทัด 1: import crypto สำหรับคำนวณแฮชความปลอดภัย\n• บรรทัด 10-14: computeCacheKey() ตรวจสอบ Token ถ้าไม่มีใช้คีย์สาธารณะ (#public) ถ้ามีจะแฮชด้วย SHA-256 16 ตัวอักษร เพื่อแยกพื้นที่แคชไม่ให้ปะปนกับผู้อื่น\n• บรรทัด 27-57: คลาส BoundedLRUCache กำหนด MAX_ENTRIES = 50 และ TTL = 1 ชม. พร้อม LRU Shift\n• บรรทัด 59-60: pipelineCache และ clearPipelineCache()",
    rMechanics: "• บรรทัด 1-4: route.ts import NextRequest/NextResponse และ runAnalysisPipeline\n• บรรทัด 7: POST handler\n• บรรทัด 24-27: ดักจับ Error 401 ส่ง HTTP 401 Unauthorized กลับไปทันทีเมื่อ Token ไม่ถูกต้อง",
    gMechanics: "• บรรทัด 1-13: github.ts import และประกาศ interface ParsedGitHubUrl เตรียมสัญญาข้อมูล",
    teammateContract: "รวมไฟล์เพื่อน: คนที่ 1 (github.ts), คนที่ 2 (parser.ts), คนที่ 3 (generator.ts) และ crypto",
    variables: "computeCacheKey, pipelineCache: BoundedLRUCache (MAX_ENTRIES = 50, TTL = 1 ชม.)",
    pythonAnalogy: "เหมือนใช้ hashlib.sha256(token.encode()).hexdigest()[:16] ทำ partition cache key ร่วมกับ LRUCache",
    defenseTip: "หนูเพิ่ม computeCacheKey (บรรทัด 10) แฮช Token ด้วย SHA-256 เพื่อทำ Cache Partitioning ป้องกันไม่ให้ผู้ใช้คนอื่นเข้าถึงแคชที่มีสิทธิ์ Token พิเศษ และตอบ HTTP 401 ชัดเจนค่ะ"
  },
  {
    step: 2,
    title: "2. เครื่องมือภายใน: แปลง Import เป็น Path จริง + หาความสัมพันธ์จากโครงสร้าง",
    subTitle: "Helper 4 ตัวที่หนูเขียนเอง (บรรทัด 63 - 230)",
    pRange: [63, 230],
    pTarget: 103,
    gRange: null,
    gTarget: null,
    objective: "สร้างเครื่องมือเสริมของ Pipeline: แปลงพาธ import ให้เป็นไฟล์จริง และเดาความเชื่อมโยงจากโครงสร้าง App Router โดยไม่ต้องยิง API เพิ่ม",
    pMechanics: "• บรรทัด 63: COMMON_EXTENSIONS รายการนามสกุลและ index file\n• บรรทัด 66-74: resolveAliasImport() แปลง \"@/store/gameStore\" หรือ \"~/lib/x\" ให้เป็นพาธจริง\n• บรรทัด 81-99: resolveRelativeImport() แปลง \"./x\" และ \"../x\" เทียบกับไฟล์ต้นทาง\n• บรรทัด 103-127: resolveImportToFilePath() กลยุทธ์ 3 ชั้น: Alias -> Relative -> ค้นหาจากชื่อไฟล์\n• บรรทัด 133-225: inferStructuralRelations() อ่านโครงสร้างโฟลเดอร์ app/ แล้วสร้างเส้นความสัมพันธ์อัตโนมัติ (middleware->root, layout renders page, parent->sub-route)\n• บรรทัด 139: กันเส้นซ้ำด้วย Set ของ Key \"source->target\"",
    rMechanics: "• เครื่องมือภายในเตรียมพร้อมรอใช้งาน",
    gMechanics: "• ทำงานกับ In-Memory รายชื่อไฟล์ล้วน ๆ ไม่เสียโควตา API",
    teammateContract: "โค้ดของคน 6 เองทั้งหมด พร้อมนำไปใช้งานร่วมกับผลงานคนที่ 2 ในสเต็ป 6",
    variables: "resolveImportToFilePath, resolveAliasImport, resolveRelativeImport, inferStructuralRelations",
    pythonAnalogy: "เหมือน os.path.normpath() + mapping dictionary แปลง relative import เป็น canonical path",
    defenseTip: "จุดเด่นคือ inferStructuralRelations (บรรทัด 133) ช่วยสร้างกราฟโครงสร้างได้ทันทีแม้ไม่ได้โหลดโค้ดดิบทุกไฟล์ค่ะ"
  },
  {
    step: 3,
    title: "3. แกะและตรวจ URL จากผู้ใช้",
    subTitle: "เช็กความถูกต้อง & ดึง owner/repo (บรรทัด 439 - 466)",
    pRange: [439, 466],
    pTarget: 447,
    gRange: [15, 41],
    gTarget: 15,
    objective: "รับ URL ที่ผู้ใช้กรอก แล้วส่งให้เพื่อนคนที่ 1 แกะว่าใครเป็นเจ้าของ (owner) และชื่อคลังอะไร (repo) ถ้าไม่ใช่ลิงก์ github.com ให้ปัดทิ้งทันที",
    pMechanics: "• บรรทัด 442: เริ่มจับเวลา startTime = performance.now()\n• บรรทัด 447: ส่ง URL ให้ parseGitHubUrl() ของคนที่ 1\n• บรรทัด 448-458: Fallback Guard ตัดสตริงสำรองเมื่อเกิดข้อผิดพลาด\n• บรรทัด 460-462: Guard Clause ถ้าไม่ใช่ github.com โยน Error ทันที\n• บรรทัด 464-466: เตรียม owner, repo, activeBranch และ effectiveToken",
    rMechanics: "• บรรทัด 9-10: req.json() อ่าน body { url, token }\n• บรรทัด 12-17: Guard Clause ตรวจสอบ URL ถ้าว่างตอบ HTTP 400\n• บรรทัด 19: ส่งเข้า await runAnalysisPipeline(url, token)",
    gMechanics: "• บรรทัด 15-41: parseGitHubUrl() ตรวจโดเมน github.com ตัด .git และแยก owner, repo, branch",
    teammateContract: "ส่ง URL ให้คนที่ 1 (github.ts) -> ได้ { owner, repo, branch }",
    variables: "startTime, parsed: { owner, repo, branch }, effectiveToken",
    pythonAnalogy: "เหมือน urllib.parse แยก URL แล้วตรวจโดเมน whitelist",
    defenseTip: "มี Fallback Guard บรรทัด 448-458 ช่วยตัดสตริงสำรองทำให้ระบบไม่พังแม้โมดูลเพื่อนเกิด Error ค่ะ"
  },
  {
    step: 4,
    title: "4. เช็กแคชแยกสิทธิ์ (Token-Partitioned Cache)",
    subTitle: "Cache Hit ด้วย Token Hash (บรรทัด 467 - 475)",
    pRange: [467, 475],
    pTarget: 467,
    gRange: null,
    gTarget: null,
    objective: "ตรวจสอบแคชด้วย cacheKey ที่แฮช Token แล้ว ถ้าเคยมีผลลัพธ์ภายใต้สิทธิ์เดียวกัน คืนค่าทันทีในระดับ <10ms",
    pMechanics: "• บรรทัด 467: const cacheKey = computeCacheKey(githubUrl, effectiveToken) สร้างคีย์เฉพาะสิทธิ์\n• บรรทัด 469: pipelineCache.has(cacheKey) ตรวจสอบว่ามีแคชหรือไม่\n• บรรทัด 470-474: pipelineCache.get(cacheKey) ดึงผลลัพธ์เดิม คืนค่าพร้อม isCached: true และ executionTimeMs ล่าสุด",
    rMechanics: "• บรรทัด 19-20: รับผลสำเร็จตอบ NextResponse.json 200 ทันที",
    gMechanics: "• ไม่ต้องยิง GitHub API เลย ประหยัดโควต้า 100%",
    teammateContract: "ไม่ต้องเรียกเพื่อน ตอบจากหน่วยความจำทันที",
    variables: "cacheKey: string (url + #tokenHash), cachedResult",
    pythonAnalogy: "เหมือนใช้ cache_key = f'{url}#{sha256(token)}' ในการ lookup Redis/Dict",
    defenseTip: "ตรงนี้หนูใช้ cacheKey ที่คำนวณจาก Token Hash ทำให้คำขอแบบใช้ Token กับไม่ใช้ Token ไม่ปนเปื้อนกันค่ะ"
  },
  {
    step: 5,
    title: "5. ดึงโครงสร้างโปรเจกต์ & ตรวจสอบความถูกต้องของ Token",
    subTitle: "fetchGitHubTree + ตรวจจับ 401 Unauthorized (บรรทัด 477 - 485)",
    pRange: [477, 485],
    pTarget: 481,
    gRange: [44, 60],
    gTarget: 44,
    objective: "ยิงคำขอไปที่ GitHub Trees API พร้อมตรวจจับสถานะ 401 Bad credentials ทันทีเมื่อผู้ใช้ใส่ Token ผิด และมี Fallback 2 ชั้น",
    pMechanics: "• บรรทัด 481: await fetchGitHubTree(owner, repo, activeBranch, effectiveToken)\n• บรรทัด 299-373: การทำงานใน fetchGitHubTree\n• บรรทัด 348-350: ตรวจจับ response.status === 401 โยน Error ชัดเจน '❌ GitHub Token ไม่ถูกต้อง (401 Bad credentials)'\n• บรรทัด 351-356: ตรวจจับ 404 และ 403 Rate Limit\n• บรรทัด 323-333: Fallback main -> master และ Fallback default_branch",
    rMechanics: "• บรรทัด 24-27: route.ts จับ Error 401 แล้วส่ง HTTP 401 กลับไปที่หน้าเว็บทันที ไม่ส่ง 500 คลุมเครือ",
    gMechanics: "• บรรทัด 44-60: buildGitHubApiUrl และ buildGitHubHeaders แนบ Bearer Token",
    teammateContract: "เรียกใช้ buildGitHubApiUrl และ buildGitHubHeaders ของคนที่ 1",
    variables: "treeData, activeBranch, status 401 check",
    pythonAnalogy: "เหมือน if res.status_code == 401: raise AuthError('Bad credentials')",
    defenseTip: "หนูตรวจจับ HTTP 401 โดยเฉพาะ (บรรทัด 348) เพื่อแจ้งเตือนผู้ใช้ตรงจุดเมื่อ Token ผิดพลาด และส่งต่อเป็น HTTP 401 สู่หน้าบ้านค่ะ"
  },
  {
    step: 6,
    title: "6. กรองไฟล์ สกัดความสัมพันธ์ วาดกราฟ และบันทึกแคช",
    subTitle: "ทีมคน 2 + คน 3 + บันทึกแคช LRU (บรรทัด 487 - 592)",
    pRange: [487, 592],
    pTarget: 590,
    gRange: null,
    gTarget: null,
    objective: "คัดกรองไฟล์โค้ด ดึงโค้ดจริง 45 ไฟล์แรกแบบขนาน สกัด imports/actions ให้คนที่ 3 วาดกราฟ Dagre และบันทึกลงแคชแยกสิทธิ์",
    pMechanics: "• บรรทัด 489-502: filterTreeFiles(treeData, 500) และ detectNextFileType()\n• บรรทัด 521-542: ดึงโค้ดจริง 45 ไฟล์แรกแบบขนานด้วย Promise.all พร้อม timeout 4s (บรรทัด 530)\n• บรรทัด 548-553: extractRelationsFromContent() สกัด imports/actions\n• บรรทัด 555-557: inferStructuralRelations() สกัดเส้นโครงสร้างเสริม\n• บรรทัด 558: buildFlowElements() ส่งเข้า Dagre Layout\n• บรรทัด 576-588: รวม finalResult\n• บรรทัด 590: pipelineCache.set(cacheKey, finalResult) บันทึกลงแคช LRU แยกสิทธิ์",
    rMechanics: "• บรรทัด 20: ตอบกลับ NextResponse.json(result, 200)",
    gMechanics: "• ดึงโค้ดดิบผ่าน raw.githubusercontent.com พร้อมแนบ Authorization header ถ้ามี token",
    teammateContract: "คนที่ 2 (parser) -> คนที่ 3 (generator) -> บันทึกแคชคน 6 -> ส่งผลลัพธ์ให้คน 4 และ 5",
    variables: "filteredItems, relations, flowElements, finalResult",
    pythonAnalogy: "เหมือนท่อประมวลผลสมบูรณ์: กรอง -> แกะโค้ด -> วาดกราฟ -> เซฟแคช -> รีเทิร์น JSON",
    defenseTip: "ระบบบันทึกแคชด้วย cacheKey (บรรทัด 590) ที่แยกตาม SHA-256 Token Hash ทำให้มั่นใจได้เรื่องความปลอดภัยและการใช้ซ้ำค่ะ"
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
  { key: "github", name: "github.ts", raw: RAW_GITHUB, pane: "left", icon: "TS", role: "(คน 1)", badge: "คน 1: GitHub Service", bc: "src / lib / <strong>github.ts</strong>", tech: "GitHub REST v3" },
  { key: "page", name: "page.tsx", raw: RAW_PAGE, pane: "right", icon: "TS", role: "(คน 4)", badge: "คน 4: Dashboard UI", bc: "src / app / <strong>page.tsx</strong>", tech: "React Server Component (Thin Wrapper)" },
  { key: "flowexplorer", name: "FlowExplorer.tsx", raw: RAW_FLOWEXPLORER, pane: "right", icon: "TS", role: "(คน 4)", badge: "คน 4: State Orchestrator", bc: "src / components / <strong>FlowExplorer.tsx</strong>", tech: "React Client Component (State Engine)" },
  { key: "uihelper", name: "ui-helper.ts", raw: RAW_UIHELPER, pane: "right", icon: "TS", role: "(คน 4)", badge: "คน 4: UI Helper & URL Guard", bc: "src / lib / <strong>ui-helper.ts</strong>", tech: "Validation & Share Link" },
  { key: "flowcanvas", name: "FlowCanvas.tsx", raw: RAW_FLOWCANVAS, pane: "right", icon: "TS", role: "(คน 3)", badge: "คน 3: Flow Canvas (Visualizer)", bc: "src / components / <strong>FlowCanvas.tsx</strong>", tech: "React Flow + Dagre" },
  { key: "sidedrawer", name: "SideDrawer.tsx", raw: RAW_SIDEDRAWER, pane: "right", icon: "TS", role: "(คน 5)", badge: "คน 5: Side Drawer (Inspector)", bc: "src / components / <strong>SideDrawer.tsx</strong>", tech: "React Inspector UI" },
  { key: "codeviewer", name: "code-viewer.ts", raw: RAW_CODEVIEWER, pane: "right", icon: "TS", role: "(คน 5)", badge: "คน 5: Code Viewer (Prism)", bc: "src / lib / <strong>code-viewer.ts</strong>", tech: "Prism Highlighter" },
  { key: "layout", name: "layout.tsx", raw: RAW_LAYOUT, pane: "right", icon: "TS", role: "(Shared)", badge: "Shared: Root Layout", bc: "src / app / <strong>layout.tsx</strong>", tech: "Next.js App Router" },
  { key: "types", name: "types/index.ts", raw: RAW_TYPES, pane: "right", icon: "TS", role: "(Shared)", badge: "Shared: สัญญาข้อมูลกลาง", bc: "src / types / <strong>index.ts</strong>", tech: "TypeScript Interfaces" },
  { key: "globals", name: "globals.css", raw: RAW_GLOBALS, pane: "right", icon: "CSS", role: "(Shared)", badge: "Shared: ธีม CSS", bc: "src / app / <strong>globals.css</strong>", tech: "CSS Variables Theme" },
  { key: "test1", name: "github.test.ts", raw: RAW_TEST1, pane: "right", icon: "TS", role: "(เทสคน 1)", badge: "เทสคน 1: GitHub Service", bc: "src / lib / <strong>github.test.ts</strong>", tech: "Vitest · 10 เคส" },
  { key: "test2", name: "parser.test.ts", raw: RAW_TEST2, pane: "right", icon: "TS", role: "(เทสคน 2)", badge: "เทสคน 2: Parser", bc: "src / lib / <strong>parser.test.ts</strong>", tech: "Vitest · 20 เคส" },
  { key: "test3", name: "generator.test.ts", raw: RAW_TEST3, pane: "right", icon: "TS", role: "(เทสคน 3)", badge: "เทสคน 3: Generator", bc: "src / lib / <strong>generator.test.ts</strong>", tech: "Vitest · 9 เคส" },
  { key: "test4", name: "ui-helper.test.ts", raw: RAW_TEST4, pane: "right", icon: "TS", role: "(เทสคน 4)", badge: "เทสคน 4: UI Helper", bc: "src / lib / <strong>ui-helper.test.ts</strong>", tech: "Vitest · 12 เคส" }
];
}

const SIM_STEPS = [
  {
    n: 1,
    actor: "คน 4 (FlowExplorer + UI Helper)",
    color: "#58a6ff",
    title: "1. ผู้ใช้กด Submit บนหน้าเว็บ & ตรวจสอบความถูกต้องของ URL",
    fileRef: "FlowExplorer.tsx:168-171 · ui-helper.ts:4-39",
    detail: `
      <div class="sim-detail-content">
        <div class="sim-detail-block">
          <strong class="block-label">🎯 หน้าที่ / วัตถุประสงค์:</strong>
          ดักจับเหตุการณ์การส่งฟอร์มของผู้ใช้ (Submit Form / กด Enter) และส่ง URL ไปตรวจสอบความถูกต้องและความปลอดภัยที่หน้าบ้านทันที เพื่อป้องกันข้อมูลไม่สมบูรณ์และลดภาระเซิร์ฟเวอร์
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🔍 การทำงานทีละบรรทัด (อ้างอิงโค้ดจริง 100%):</strong>
          <ul>
            <li><strong>FlowExplorer.tsx บรรทัดที่ 168:</strong> รับ synthetic event <code>e: React.FormEvent</code> ในฟังก์ชัน <code>handleSubmit</code></li>
            <li><strong>FlowExplorer.tsx บรรทัดที่ 169:</strong> สั่ง <code>e.preventDefault()</code> เพื่อระงับไม่ให้เบราว์เซอร์รีเฟรชหน้าเว็บทั้งหน้า</li>
            <li><strong>FlowExplorer.tsx บรรทัดที่ 170:</strong> เรียก <code>void executeAnalysis(url, token)</code> เพื่อเริ่มต้นกระบวนการวิเคราะห์</li>
            <li><strong>ui-helper.ts บรรทัดที่ 5–7:</strong> <code>validateUrlInput</code> ตรวจค่าว่าง หากไม่มีส่งแจ้งเตือน "กรุณากรอก GitHub URL"</li>
            <li><strong>ui-helper.ts บรรทัดที่ 12–18:</strong> ใช้ <code>new URL(trimmed)</code> สกัด hostname</li>
            <li><strong>ui-helper.ts บรรทัดที่ 20–26:</strong> สแกนหาโค้ดแปลกปลอมเพื่อป้องกัน XSS (ตรวจจับ <code>&lt;script</code>, <code>javascript:</code>, <code>&lt;</code>, <code>&gt;</code>)</li>
            <li><strong>ui-helper.ts บรรทัดที่ 28–30:</strong> ตรวจสอบ hostname ต้องเป็น <code>github.com</code> หรือ <code>www.github.com</code> ตรงตัวเท่านั้น</li>
            <li><strong>ui-helper.ts บรรทัดที่ 32–36:</strong> แยก segment ของ path ตรวจสอบว่าต้องมีทั้งชื่อ Owner และ Repo ครบถ้วน (<code>segments.length &lt; 2</code>)</li>
            <li><strong>ui-helper.ts บรรทัดที่ 38:</strong> ส่งคืนผลลัพธ์ <code>{ isValid: true, errorMessage: null }</code></li>
          </ul>
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🛡️ กลไกความปลอดภัย &amp; Error Guard:</strong>
          ป้องกันทั้งช่องโหว่ XSS และการกรอกโดเมนปลอม (เช่น <code>evil.com/?x=github.com</code> หรือ <code>evilgithub.com</code>) ตั้งแต่ฝั่งไคลเอนต์
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">📦 ผลลัพธ์ส่งต่อ:</strong>
          ส่งค่า URL และ Token ที่ผ่านการรับรองเข้าสู่ <code>executeAnalysis</code>
        </div>
      </div>`
  },
  {
    n: 2,
    actor: "คน 4 → คน 6",
    color: "#58a6ff",
    title: "2. ควบคุมสถานะหน้าเว็บและส่งคำขอ HTTP POST (executeAnalysis)",
    fileRef: "FlowExplorer.tsx:103-145",
    detail: `
      <div class="sim-detail-content">
        <div class="sim-detail-block">
          <strong class="block-label">🎯 หน้าที่ / วัตถุประสงค์:</strong>
          บริหาร State วงจรชีวิตของ UI (สถานะ Loading, เคลียร์ Error เดิม) และยิง fetch แบบ POST ข้ามไปหา Backend API Route
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🔍 การทำงานทีละบรรทัด (อ้างอิงโค้ดจริง 100%):</strong>
          <ul>
            <li><strong>บรรทัดที่ 104–108:</strong> ตรวจสอบความถูกต้องของ URL ผ่าน <code>validateUrlInput</code> ซ้ำเพื่อความมั่นใจ</li>
            <li><strong>บรรทัดที่ 110–111:</strong> เคลียร์ Error เดิมด้วย <code>setError(null)</code> และเปิดสถานะโหลด <code>setLoading(true)</code></li>
            <li><strong>บรรทัดที่ 114–118:</strong> ยิง <code>fetch('/api/analyze')</code> ด้วยเมธอด POST พร้อม body JSON <code>{ url, token: token?.trim() }</code></li>
            <li><strong>บรรทัดที่ 120–129:</strong> ตรวจจับ HTTP Status จาก response หากเจอ 401 แจ้งเตือน Token ไม่ถูกต้อง หรือถ้า 403 แจ้งเรื่องโควตา Rate Limit</li>
            <li><strong>บรรทัดที่ 131–133:</strong> รับ JSON แปลงเป็น <code>AnalysisResult</code> แล้วสั่ง <code>setResult(data)</code> ให้ผังกราฟแสดงผล</li>
            <li><strong>บรรทัดที่ 141–143:</strong> ปิดสถานะโหลด <code>setLoading(false)</code> ในบล็อก <code>finally</code> เสมอ</li>
          </ul>
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🛡️ กลไกความปลอดภัย &amp; Error Guard:</strong>
          ตัดช่องว่าง Token ด้วย <code>.trim()</code> และมีบล็อก <code>finally</code> รับประกันว่าหน้าเว็บจะไม่ค้างสถานะ Loading
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">📦 ผลลัพธ์ส่งต่อ:</strong>
          ส่ง HTTP Request ข้ามเครือข่ายเข้าสู่ Next.js API Route ฝั่งเซิร์ฟเวอร์
        </div>
      </div>`
  },
  {
    n: 3,
    actor: "คน 6 (route.ts)",
    color: "#ff7b72",
    title: "3. ประตูหลังบ้าน API Route รับคำขอและตรวจความถูกต้อง (POST handler)",
    fileRef: "route.ts:7-31",
    detail: `
      <div class="sim-detail-content">
        <div class="sim-detail-block">
          <strong class="block-label">🎯 หน้าที่ / วัตถุประสงค์:</strong>
          เป็น Endpoint รับคำขอ HTTP POST ตรวจสอบ Payload เบื้องต้น และส่งต่อให้ Master Orchestrator จัดการ
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🔍 การทำงานทีละบรรทัด (อ้างอิงโค้ดจริง 100%):</strong>
          <ul>
            <li><strong>บรรทัดที่ 7:</strong> ประกาศ <code>export async function POST(req: NextRequest)</code> รองรับคำขอ</li>
            <li><strong>บรรทัดที่ 9–10:</strong> <code>await req.json()</code> แกะอ่าน body เพื่อดึงค่า url และ token</li>
            <li><strong>บรรทัดที่ 12–17:</strong> Guard Clause — ตรวจสอบ <code>!url || typeof url !== 'string'</code> หากผิดปกติส่ง <code>NextResponse.json(..., { status: 400 })</code> ทันที</li>
            <li><strong>บรรทัดที่ 19:</strong> เรียก <code>const result = await runAnalysisPipeline(url, token)</code> มอบหมายงานให้ Orchestrator</li>
            <li><strong>บรรทัดที่ 20:</strong> ส่งผลลัพธ์กลับไปยังเบราว์เซอร์ด้วย <code>NextResponse.json(result, { status: 200 })</code></li>
            <li><strong>บรรทัดที่ 24–27:</strong> ดักจับ Error 401 หรือ Bad credentials แล้วส่ง HTTP 401 Unauthorized กลับไปทันที</li>
            <li><strong>บรรทัดที่ 28–30:</strong> ดักจับ Error อื่น ๆ แล้วตอบกลับด้วย HTTP 500 พร้อมข้อความควบคุมไว้</li>
          </ul>
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🛡️ กลไกความปลอดภัย &amp; Error Guard:</strong>
          ไม่ส่ง Stack trace ดิบกลับไปหาผู้ใช้ ป้องกันช่องโหว่ Information Disclosure
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">📦 ผลลัพธ์ส่งต่อ:</strong>
          ส่ง url และ token เข้าสู่ <code>runAnalysisPipeline</code> ใน <code>pipeline.ts</code>
        </div>
      </div>`
  },
  {
    n: 4,
    actor: "คน 6 (pipeline.ts)",
    color: "#ff7b72",
    title: "4. Master Orchestrator เริ่มต้นและจับเวลาประมวลผล (runAnalysisPipeline)",
    fileRef: "pipeline.ts:439-446",
    detail: `
      <div class="sim-detail-content">
        <div class="sim-detail-block">
          <strong class="block-label">🎯 หน้าที่ / วัตถุประสงค์:</strong>
          เข้าสู่หัวใจหลักของการประมวลผล (Master Orchestrator) ที่คอยประสานงานโมดูลของเพื่อนทุกคน และเริ่มจับเวลาความเร็วระบบ
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🔍 การทำงานทีละบรรทัด (อ้างอิงโค้ดจริง 100%):</strong>
          <ul>
            <li><strong>บรรทัดที่ 439–440:</strong> ประกาศฟังก์ชัน <code>runAnalysisPipeline(githubUrl, userToken, mockTreeData, mockFilesContent)</code></li>
            <li><strong>บรรทัดที่ 442:</strong> เริ่มจับเวลาด้วย <code>const startTime = performance.now()</code> เพื่อความแม่นยำระดับเสี้ยววินาที</li>
            <li><strong>บรรทัดที่ 444–446:</strong> เตรียม <code>effectiveToken</code> โดยดึง <code>userToken?.trim()</code> หากไม่มีจะดึง <code>process.env.GITHUB_TOKEN</code> เป็นตัวสำรอง</li>
          </ul>
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🛡️ กลไกความปลอดภัย &amp; Error Guard:</strong>
          ใช้ <code>performance.now()</code> วัดเฉพาะเวลาการประมวลผลจริงใน Pipeline ไม่รวม overhead ของ HTTP network
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">📦 ผลลัพธ์ส่งต่อ:</strong>
          ส่ง URL ไปยังขั้นตอนแกะโดเมนและข้อมูลคลัง
        </div>
      </div>`
  },
  {
    n: 5,
    actor: "คน 1 (github.ts) + คน 6",
    color: "#3fb950",
    title: "5. แกะโครงสร้าง URL & ตรวจสอบ Domain Whitelist (parseGitHubUrl)",
    fileRef: "github.ts:15-41 · pipeline.ts:448-466",
    detail: `
      <div class="sim-detail-content">
        <div class="sim-detail-block">
          <strong class="block-label">🎯 หน้าที่ / วัตถุประสงค์:</strong>
          สกัด owner, repo และ branch ออกจาก URL พร้อมคัดกรองความปลอดภัยของโดเมน ป้องกันคำขอแปลกปลอม
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🔍 การทำงานทีละบรรทัด (อ้างอิงโค้ดจริง 100%):</strong>
          <ul>
            <li><strong>github.ts บรรทัดที่ 16–18:</strong> ตรวจสอบค่าว่างของ URL</li>
            <li><strong>github.ts บรรทัดที่ 20–22:</strong> เติมโปรโตคอล <code>https://</code> อัตโนมัติหากผู้ใช้พิมพ์ URL ย่อ</li>
            <li><strong>github.ts บรรทัดที่ 25–28:</strong> ตรวจสอบ hostname ต้องเป็น <code>github.com</code> หรือ <code>www.github.com</code> แบบตรงตัว</li>
            <li><strong>github.ts บรรทัดที่ 30–34:</strong> แยก segment และดึงชื่อ branch ผ่าน <code>parseBranchFromSegments</code> (เช่น <code>/tree/feat</code> หรือ <code>/blob/main</code>)</li>
            <li><strong>github.ts บรรทัดที่ 36–39:</strong> ตัดนามสกุล <code>.git</code> ออกจากชื่อคลัง</li>
            <li><strong>pipeline.ts บรรทัดที่ 448–458:</strong> Fallback Guard สำรองใน pipeline ช่วยตัดสตริงเองกรณีโมดูลเกิดข้อยกเว้น</li>
            <li><strong>pipeline.ts บรรทัดที่ 460–462:</strong> Guard Clause ตรวจสอบซ้ำ หากไม่ใช่ github.com โยน Error ทันที</li>
          </ul>
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🛡️ กลไกความปลอดภัย &amp; Error Guard:</strong>
          ป้องกันช่องโหว่ SSRF (Server-Side Request Forgery) โดยบังคับให้ปลายทางเชื่อมต่อไปยัง GitHub เท่านั้น
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">📦 ผลลัพธ์ส่งต่อ:</strong>
          ได้ข้อมูล <code>{ owner, repo, branch, activeBranch }</code> พร้อมส่งต่อ
        </div>
      </div>`
  },
  {
    n: 6,
    actor: "คน 6 (pipeline.ts)",
    color: "#ff7b72",
    title: "6. ตรวจสอบ In-Memory LRU Cache แยกสิทธิ์ (Token-Partitioned Cache)",
    fileRef: "pipeline.ts:10-14, 467-475",
    detail: `
      <div class="sim-detail-content">
        <div class="sim-detail-block">
          <strong class="block-label">🎯 หน้าที่ / วัตถุประสงค์:</strong>
          ตรวจสอบผลการวิเคราะห์ในแคชด้วย Key ที่แยกตามสิทธิ์ Token ป้องกันการดึงซ้ำ และป้องกัน Cache Poisoning หรือการข้ามสิทธิ์ดูข้อมูล
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🔍 การทำงานทีละบรรทัด (อ้างอิงโค้ดจริง 100%):</strong>
          <ul>
            <li><strong>pipeline.ts บรรทัดที่ 10–14:</strong> <code>computeCacheKey(githubUrl, effectiveToken)</code> ถ้าไม่มี Token ใช้ <code>#public</code> ถ้ามีจะแฮชด้วย SHA-256 (16 ตัวอักษร)</li>
            <li><strong>pipeline.ts บรรทัดที่ 467:</strong> สร้าง <code>const cacheKey = computeCacheKey(githubUrl, effectiveToken)</code></li>
            <li><strong>pipeline.ts บรรทัดที่ 469:</strong> เรียก <code>pipelineCache.has(cacheKey)</code> ตรวจสอบว่ามีข้อมูลในแคชหรือไม่</li>
            <li><strong>ภายใน BoundedLRUCache (บรรทัด 27–57):</strong>
              - ตรวจอายุข้อมูล TTL = 1 ชั่วโมง (3,600,000 ms) หากหมดอายุจะลบทิ้งอัตโนมัติ<br>
              - หากข้อมูลยังใหม่ จะทำ LRU Shift ย้าย Key ไปท้ายสุดของ Map</li>
            <li><strong>pipeline.ts บรรทัดที่ 470–474:</strong> หาก Cache Hit จะคืนข้อมูลเดิมทันทีพร้อมตั้ง <code>isCached: true</code> และคำนวณ <code>executionTimeMs</code> ล่าสุด (&lt;10ms)</li>
          </ul>
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🛡️ กลไกความปลอดภัย &amp; Error Guard:</strong>
          การทำ Cache Partitioning ป้องกันไม่ให้ผู้ใช้ทั่วไปแอบเห็นข้อมูลของคลังที่ใช้ Token ส่วนตัว และจำกัดขนาดแคชสูงสุด 50 คลังเพื่อคุมหน่วยความจำ
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">📦 ผลลัพธ์ส่งต่อ:</strong>
          หาก Cache Miss จะทำงานต่อไปยังสเต็ปที่ 7
        </div>
      </div>`
  },
  {
    n: 7,
    actor: "คน 1 + คน 6",
    color: "#3fb950",
    title: "7. ดึงผังไฟล์จาก GitHub Tree API ตรวจสอบ Token 401 & Fallback 2 ชั้น",
    fileRef: "pipeline.ts:299-373, 481 · github.ts:44-60",
    detail: `
      <div class="sim-detail-content">
        <div class="sim-detail-block">
          <strong class="block-label">🎯 หน้าที่ / วัตถุประสงค์:</strong>
          ยิงคำขอไปยัง GitHub Git Trees API เพื่อดึงโครงสร้างไฟล์ทั้งหมดในครั้งเดียว พร้อมตรวจจับ Token ผิดพลาด และมีระบบ Fallback สำรอง branch
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🔍 การทำงานทีละบรรทัด (อ้างอิงโค้ดจริง 100%):</strong>
          <ul>
            <li><strong>github.ts บรรทัดที่ 44–49:</strong> <code>buildGitHubApiUrl</code> ประกอบ endpoint <code>/repos/{owner}/{repo}/git/trees/{branch}?recursive=1</code></li>
            <li><strong>github.ts บรรทัดที่ 51–60:</strong> <code>buildGitHubHeaders</code> แนบ User-Agent และ <code>Authorization: Bearer</code> เมื่อมี Token</li>
            <li><strong>pipeline.ts บรรทัดที่ 348–350:</strong> ตรวจจับ <code>response.status === 401</code> โยน Error ชัดเจน '❌ GitHub Token ไม่ถูกต้อง (401 Bad credentials)'</li>
            <li><strong>pipeline.ts บรรทัดที่ 351–356:</strong> ตรวจจับ 403 Rate Limit และ 404 Not Found</li>
            <li><strong>pipeline.ts บรรทัดที่ 323–333:</strong> Fallback ชั้นที่ 1 — ถ้า branch main ติด 404 จะสลับไปลอง master อัตโนมัติ</li>
            <li><strong>pipeline.ts บรรทัดที่ 335–360:</strong> Fallback ชั้นที่ 2 — ถ้ายัง 404 จะยิงถาม Repo API เพื่อดึง <code>default_branch</code> ตัวจริง</li>
            <li><strong>pipeline.ts บรรทัดที่ 481:</strong> รับ <code>{ treeData, activeBranch }</code> เตรียมส่งต่อไปคัดกรอง</li>
          </ul>
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🛡️ กลไกความปลอดภัย &amp; Error Guard:</strong>
          พารามิเตอร์ <code>?recursive=1</code> ทำให้ดึงผังทั้งคลังได้ในคำขอเดียว ลดการใช้โควตา API จาก O(N) เหลือ O(1)
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">📦 ผลลัพธ์ส่งต่อ:</strong>
          ได้โครงสร้างต้นไม้ไฟล์ดิบ <code>GitHubTreeItem[]</code>
        </div>
      </div>`
  },
  {
    n: 8,
    actor: "คน 2 (parser.ts)",
    color: "#bc8cff",
    title: "8. คัดกรองไฟล์ขยะและจำแนกบทบาทสถาปัตยกรรม Next.js (filter & detect)",
    fileRef: "parser.ts:101-160 · pipeline.ts:489-512",
    detail: `
      <div class="sim-detail-content">
        <div class="sim-detail-block">
          <strong class="block-label">🎯 หน้าที่ / วัตถุประสงค์:</strong>
          คัดกรองไฟล์ที่ไม่เกี่ยวข้องออกเพื่อความรวดเร็วและความปลอดภัย และจำแนกประเภทบทบาทตามสถาปัตยกรรม Next.js App Router
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🔍 การทำงานทีละบรรทัด (อ้างอิงโค้ดจริง 100%):</strong>
          <ul>
            <li><strong>parser.ts บรรทัดที่ 101–124:</strong> <code>filterTreeFiles(treeData, 500)</code> กรองเฉพาะไฟล์จริง (<code>type === 'blob'</code>)</li>
            <li><strong>parser.ts บรรทัดที่ 104–118:</strong> ผ่านฟังก์ชัน <code>shouldIgnorePath</code>:
              - ตัดโฟลเดอร์ที่ไม่เกี่ยวข้อง: node_modules, .next, dist, tests, docs, .git ฯลฯ<br>
              - ตัดไฟล์ Config และ Lockfile: package-lock.json, tsconfig.json, tailwind.config.*<br>
              - อนุญาตเฉพาะไฟล์รากที่จำเป็น: middleware.ts, proxy.ts<br>
              - ตรวจนามสกุล: รับเฉพาะ .ts, .tsx, .js, .jsx</li>
            <li><strong>parser.ts บรรทัดที่ 121:</strong> ตัดจำกัดไฟล์ที่ maxLimit (500 ไฟล์แรก) ป้องกัน DoS</li>
            <li><strong>parser.ts บรรทัดที่ 129–160:</strong> <code>detectNextFileType(path)</code> วนลูปจำแนกบทบาท 9 ประเภท: page, layout, action, middleware, store, hook, component, api, other</li>
          </ul>
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🛡️ กลไกความปลอดภัย &amp; Error Guard:</strong>
          ป้องกันหน่วยความจำบวมจากการประมวลผลคลังขนาดยักษ์ และไม่เสียเวลาดาวน์โหลดไฟล์ที่ไม่ใช่โค้ด
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">📦 ผลลัพธ์ส่งต่อ:</strong>
          ได้รายการไฟล์ที่ผ่านการคัดเลือกพร้อมระบุประเภทสถาปัตยกรรมครบถ้วน
        </div>
      </div>`
  },
  {
    n: 9,
    actor: "คน 2 + คน 6",
    color: "#bc8cff",
    title: "9. ดึงโค้ดดิบ 45 ไฟล์ขนานกัน, สกัด Import/Action & เชื่อมโยงความสัมพันธ์",
    fileRef: "pipeline.ts:521-557 · parser.ts:165-271",
    detail: `
      <div class="sim-detail-content">
        <div class="sim-detail-block">
          <strong class="block-label">🎯 หน้าที่ / วัตถุประสงค์:</strong>
          ดาวน์โหลดเนื้อหาโค้ดจริงของไฟล์สำคัญ 45 ไฟล์แรกพร้อมกัน สกัดคำสั่ง Import และ Event Handlers แล้วแปลงเป็น Path ไฟล์จริง
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🔍 การทำงานทีละบรรทัด (อ้างอิงโค้ดจริง 100%):</strong>
          <ul>
            <li><strong>pipeline.ts บรรทัดที่ 521–542:</strong> ดึงโค้ดดิบสูงสุด 45 ไฟล์แรกผ่าน Raw CDN แบบขนานด้วย <code>Promise.all</code></li>
            <li><strong>pipeline.ts บรรทัดที่ 530:</strong> ตั้งเวลาตัดขาด <code>AbortSignal.timeout(4000)</code> ป้องกันการค้างจากเน็ตเวิร์ก</li>
            <li><strong>parser.ts บรรทัดที่ 165–204:</strong> <code>extractImportsFromCode</code> สกัดคำสั่ง import (ลบ comment ก่อน regex กันตรวจจับผิดพลาด)</li>
            <li><strong>pipeline.ts บรรทัดที่ 66–127:</strong> แปลง import เป็น path จริงด้วยกลยุทธ์ 3 ชั้น:
              - <code>resolveAliasImport</code> (บรรทัด 66-74): แปลง @/lib/x หรือ ~/lib/x<br>
              - <code>resolveRelativeImport</code> (บรรทัด 81-99): แปลง ./ และ ../ เทียบกับโฟลเดอร์ต้นทาง<br>
              - <code>resolveImportToFilePath</code> (บรรทัด 103-127): ตรวจสอบนามสกุลและ index file</li>
            <li><strong>parser.ts บรรทัดที่ 213–271:</strong> <code>extractActionTriggers</code> สกัด onClick และ form action เชื่อม UI เข้าหา Server Action</li>
            <li><strong>pipeline.ts บรรทัดที่ 133–225:</strong> <code>inferStructuralRelations</code> เสริมเส้นความสัมพันธ์เชิงโครงสร้าง App Router อัตโนมัติ (middleware -> root, layout -> page, parent -> sub-route)</li>
          </ul>
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🛡️ กลไกความปลอดภัย &amp; Error Guard:</strong>
          ป้องกันเซิร์ฟเวอร์ค้างด้วย Timeout 4 วินาที และมี Structural Inferencing เป็น Fallback รองรับกรณีอ่านโค้ดดิบไม่ได้
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">📦 ผลลัพธ์ส่งต่อ:</strong>
          ได้ชุดความสัมพันธ์สมบูรณ์ <code>CodeRelation[]</code> (source, target, type, label)
        </div>
      </div>`
  },
  {
    n: 10,
    actor: "คน 3 (generator.ts)",
    color: "#d29922",
    title: "10. จัดวางผังกราฟด้วย Dagre Hierarchical Layout (buildFlowElements)",
    fileRef: "generator.ts:89-130 · pipeline.ts:558-570",
    detail: `
      <div class="sim-detail-content">
        <div class="sim-detail-block">
          <strong class="block-label">🎯 หน้าที่ / วัตถุประสงค์:</strong>
          คำนวณพิกัด (X, Y) ของแต่ละโหนดด้วย Dagre Graphlib จัดวางแบบลำดับชั้นไม่ให้เส้นและกล่องทับกัน
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🔍 การทำงานทีละบรรทัด (อ้างอิงโค้ดจริง 100%):</strong>
          <ul>
            <li><strong>generator.ts บรรทัดที่ 7–13:</strong> <code>sanitizeNodeId(path)</code> ทำความสะอาด ID ให้ปลอดภัย ตัดวงเล็บ Route Group เช่น (auth)</li>
            <li><strong>generator.ts บรรทัดที่ 30–46:</strong> <code>getNodeColorConfig(fileType)</code> กำหนดชุดสีตามบทบาทสถาปัตยกรรม</li>
            <li><strong>generator.ts บรรทัดที่ 40–83:</strong> <code>applyDagreLayout(nodes, edges)</code> ตั้งค่า Dagre:
              - <code>graph.setGraph({ rankdir: 'LR', nodesep: 55, ranksep: 170, marginx: 60, marginy: 60 })</code><br>
              - กำหนดขนาดโหนด: กว้าง 240px สูง 72px<br>
              - รัน <code>dagre.layout(g)</code> คำนวณพิกัด X, Y จากซ้ายไปขวา</li>
            <li><strong>generator.ts บรรทัดที่ 102–125:</strong> สร้าง <code>FlowNodeItem[]</code> และ <code>FlowEdgeItem[]</code> (เปิด <code>animated: true</code> สำหรับ Server Action)</li>
            <li><strong>generator.ts บรรทัดที่ 169–191:</strong> <code>generateMermaidSyntax</code> สร้าง Mermaid string สำรองไว้สำหรับส่งออกผัง</li>
          </ul>
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🛡️ กลไกความปลอดภัย &amp; Error Guard:</strong>
          มี try-catch ครอบ Dagre หากคำนวณล้มเหลวจะ fallback ใช้พิกัดกริดพื้นฐานแทน กราฟไม่พัง
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">📦 ผลลัพธ์ส่งต่อ:</strong>
          ได้ nodes, edges และ mermaidSyntax พร้อมสำหรับเรนเดอร์
        </div>
      </div>`
  },
  {
    n: 11,
    actor: "คน 6 → คน 4",
    color: "#ff7b72",
    title: "11. บันทึกแคช LRU, ตอบ HTTP 200 & วาดผัง React Flow บนหน้าจอ",
    fileRef: "pipeline.ts:576-591 · route.ts:20 · FlowCanvas.tsx:122-290",
    detail: `
      <div class="sim-detail-content">
        <div class="sim-detail-block">
          <strong class="block-label">🎯 หน้าที่ / วัตถุประสงค์:</strong>
          บันทึกผลลัพธ์ลงแคชแยกสิทธิ์ ส่งข้อมูล JSON กลับไปยังหน้า Dashboard และเรนเดอร์ลงบน Canvas
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🔍 การทำงานทีละบรรทัด (อ้างอิงโค้ดจริง 100%):</strong>
          <ul>
            <li><strong>pipeline.ts บรรทัดที่ 576–588:</strong> รวมผลลัพธ์เข้าเป็น <code>AnalysisResult</code> พร้อมคำนวณ <code>executionTimeMs</code></li>
            <li><strong>pipeline.ts บรรทัดที่ 590:</strong> <code>pipelineCache.set(cacheKey, finalResult)</code> บันทึกลงแคช LRU</li>
            <li><strong>route.ts บรรทัดที่ 20:</strong> ส่งผลลัพธ์กลับไปยังเบราว์เซอร์ด้วย <code>NextResponse.json(result, { status: 200 })</code></li>
            <li><strong>FlowExplorer.tsx บรรทัดที่ 133:</strong> <code>setResult(data)</code> อัปเดตข้อมูลลง State หลักของหน้าเว็บ</li>
            <li><strong>FlowCanvas.tsx บรรทัดที่ 122–218:</strong> <code>toRfNodes</code> แปลงโหนดเป็น React Flow Nodes</li>
            <li><strong>FlowCanvas.tsx บรรทัดที่ 224–287:</strong> <code>toRfEdges</code> แปลงเส้นเป็น React Flow Edges พร้อมลูกศร MarkerEnd</li>
            <li><strong>FlowCanvas.tsx บรรทัดที่ 290–528:</strong> คอมโพเนนต์ React Flow วาด Canvas พร้อม MiniMap, Controls และ Background Grid</li>
          </ul>
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🛡️ กลไกความปลอดภัย &amp; Error Guard:</strong>
          ข้อมูลถูกแคชอย่างปลอดภัยแยกตาม Token และเปิด <code>onlyRenderVisibleElements</code> ป้องกันเบราว์เซอร์กระตุก
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">📦 ผลลัพธ์ส่งต่อ:</strong>
          สิ้นสุดช่วง Auto Flow — ผัง Flowchart แสดงผลสมบูรณ์และพร้อมรับการโต้ตอบของผู้ใช้
        </div>
      </div>`
  },
  {
    n: 12,
    actor: "คน 3 (FlowCanvas)",
    color: "#d29922",
    title: "12. [On-Demand ก] คลิกโหนดเพื่อสืบย้อนความสัมพันธ์ด้วย BFS ทั้งสาย (Trace Flow)",
    fileRef: "FlowCanvas.tsx:48-119, 348-350",
    detail: `
      <div class="sim-detail-content">
        <div class="sim-detail-block">
          <strong class="block-label">🎯 หน้าที่ / วัตถุประสงค์:</strong>
          ใช้อัลกอริทึม Breadth-First Search (BFS) เพื่อค้นหาโหนดต้นทาง (Ancestors) และปลายทาง (Descendants) ทั้งหมดที่เชื่อมโยงกับโหนดที่คลิก
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🔍 การทำงานทีละบรรทัด (อ้างอิงโค้ดจริง 100%):</strong>
          <ul>
            <li><strong>FlowCanvas.tsx บรรทัดที่ 48–54:</strong> <code>computeTracePath</code> รับ selectedNodeId, edges, traceMode ('all' หรือ '1-step')</li>
            <li><strong>FlowCanvas.tsx บรรทัดที่ 55–66:</strong> โหมด 1-Step: วนลูปหาเฉพาะโหนดที่เชื่อมติดกันโดยตรง</li>
            <li><strong>FlowCanvas.tsx บรรทัดที่ 68–118:</strong> โหมดทั้งสาย (All Steps):
              - สร้าง adjacency list: outgoingMap (ทิศทางไปข้างหน้า) และ incomingMap (ทิศทางย้อนกลับ)<br>
              - BFS ขาลง (Descendants): ใช้ Queue และ visited Set วิ่งสืบหาลูกหลานทั้งหมดจนสุดสาย<br>
              - BFS ขาขึ้น (Ancestors): ใช้ Queue และ visited Set วิ่งสืบหาบรรพบุรุษต้นทางจนสุดสาย</li>
            <li><strong>FlowCanvas.tsx บรรทัดที่ 119:</strong> ส่งคืน <code>{ highlightedNodeIds, highlightedEdgeIds }</code></li>
            <li>โหนดที่ไม่อยู่ในสายจะถูกปรับความโปร่งแสงลดลงเหลือ <code>opacity: 0.35</code></li>
            <li><strong>FlowCanvas.tsx บรรทัดที่ 348–350:</strong> <code>handleClearFocus</code> ล้างสถานะเมื่อกด Esc หรือคลิกพื้นที่ว่าง</li>
          </ul>
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🛡️ กลไกความปลอดภัย &amp; Error Guard:</strong>
          ป้องกัน Circular Dependency Loop ด้วยการใช้ Set ตรวจสอบ visited ก่อน push เข้า Queue เสมอ
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">📦 ผลลัพธ์ส่งต่อ:</strong>
          ผู้ใช้เห็นเส้นทางข้อมูลและผลกระทบของไฟล์นั้นอย่างชัดเจนทั้งระบบ
        </div>
      </div>`
  },
  {
    n: 13,
    actor: "คน 4 + คน 5 (SideDrawer & CodeViewer)",
    color: "#f472b6",
    title: "13. [On-Demand ข] กด Inspect ซอร์สโค้ด ไฮไลต์ Prism และเปิด Side Drawer",
    fileRef: "FlowExplorer.tsx:43-96 · code-viewer.ts:28-110 · SideDrawer.tsx:26-181",
    detail: `
      <div class="sim-detail-content">
        <div class="sim-detail-block">
          <strong class="block-label">🎯 หน้าที่ / วัตถุประสงค์:</strong>
          ดาวน์โหลดโค้ดจริงของไฟล์ที่เลือก ตัดทอนอย่างปลอดภัย ไฮไลต์ไวยากรณ์ด้วย Prism และแสดงผลใน Side Drawer ด้านขวา
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🔍 การทำงานทีละบรรทัด (อ้างอิงโค้ดจริง 100%):</strong>
          <ul>
            <li><strong>FlowCanvas.tsx บรรทัดที่ 312–318:</strong> <code>handleInspect</code> ส่ง Event พร้อมชื่อและประเภทไฟล์กลับไปหา FlowExplorer</li>
            <li><strong>FlowExplorer.tsx บรรทัดที่ 60–61:</strong> เรียก <code>buildGitHubRawUrl</code> และ <code>buildGitHubBlobUrl</code> จาก <code>github.ts</code></li>
            <li><strong>FlowExplorer.tsx บรรทัดที่ 73–87:</strong> ยิง <code>fetch(rawUrl)</code> ดาวน์โหลดโค้ดจริงและเปิด drawerState</li>
            <li><strong>code-viewer.ts บรรทัดที่ 28–46:</strong> <code>getLanguageFromPath</code> ตรวจนามสกุลเพื่อแมปกับภาษาของ Prism</li>
            <li><strong>code-viewer.ts บรรทัดที่ 53–73:</strong> <code>formatCodeSnippet</code> ตัดทอนโค้ดเหลือ 300 บรรทัดแรก เพื่อป้องกัน DOM โตเกินไป</li>
            <li><strong>code-viewer.ts บรรทัดที่ 81–85:</strong> <code>escapeHtml</code> แปลงอักขระพิเศษเพื่อป้องกันช่องโหว่ XSS</li>
            <li><strong>code-viewer.ts บรรทัดที่ 91–110:</strong> <code>highlightCodeWithPrism</code> แปลงโค้ดเป็น HTML ที่มีสีสันสวยงาม</li>
            <li><strong>SideDrawer.tsx บรรทัดที่ 39–48:</strong> ดักจับปุ่ม Escape เพื่อปิดหน้าต่าง, ปุ่ม Copy Code คัดลอกโค้ดเต็ม, และปุ่ม 'ดูโค้ดทั้งหมด'</li>
          </ul>
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🛡️ กลไกความปลอดภัย &amp; Error Guard:</strong>
          ป้องกัน XSS Injection ด้วย escapeHtml และการตัดโค้ดที่ 300 บรรทัดป้องกันเบราว์เซอร์กระตุก
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">📦 ผลลัพธ์ส่งต่อ:</strong>
          ผู้ใช้สามารถอ่านโค้ดจริงประกอบแผนผังได้ทันทีโดยไม่ต้องสลับหน้าจอไปที่ GitHub
        </div>
      </div>`
  },
  {
    n: 14,
    actor: "คน 4 + คน 3",
    color: "#58a6ff",
    title: "14. [On-Demand ค] ค้นหาโหนด (Ctrl+K) เลื่อนมุมกล้อง & แชร์สถานะด้วย Base64 URL",
    fileRef: "FlowCanvas.tsx:353-376 · ui-helper.ts:63-119 · FlowExplorer.tsx:153-166",
    detail: `
      <div class="sim-detail-content">
        <div class="sim-detail-block">
          <strong class="block-label">🎯 หน้าที่ / วัตถุประสงค์:</strong>
          ค้นหาโหนดด้วยคีย์ลัด เลื่อนซูมมุมกล้องอัตโนมัติ และแชร์ URL แผนผังพร้อมสถานะที่เลือกให้เพื่อนร่วมทีมได้ทันที
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🔍 การทำงานทีละบรรทัด (อ้างอิงโค้ดจริง 100%):</strong>
          <ul>
            <li><strong>FlowCanvas.tsx บรรทัดที่ 353–376:</strong> <code>focusAndPanToNode</code> เมื่อเลือกโหนดจากกล่องค้นหา (Ctrl+K หรือ /) จะสั่ง <code>setCenter(x, y, { zoom: 1.2, duration: 800 })</code> เพื่อแพนกล้องอย่างนุ่มนวล</li>
            <li><strong>ui-helper.ts บรรทัดที่ 63–82:</strong> <code>encodeShareableState</code> แปลง URL และ ID ของโหนดที่โฟกัสเป็น JSON แล้วเข้ารหัสเป็น Base64 แปะท้ายลิงก์ <code>?state=&lt;base64&gt;</code> แล้วคัดลอกลง Clipboard</li>
            <li><strong>ui-helper.ts บรรทัดที่ 87–119:</strong> <code>decodeShareableState</code> เมื่อเปิดลิงก์ที่มีพารามิเตอร์ state ระบบจะถอดรหัส Base64 อย่างปลอดภัยด้วย try-catch หากข้อมูลผิดรูปจะคืน null ไม่ให้ระบบพัง</li>
            <li><strong>FlowExplorer.tsx บรรทัดที่ 153–166:</strong> อ่านพารามิเตอร์ state ตอนเปิดหน้าเว็บ และสั่งรันการวิเคราะห์อัตโนมัติผ่าน queueMicrotask</li>
          </ul>
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">🛡️ กลไกความปลอดภัย &amp; Error Guard:</strong>
          ป้องกัน State Injection และ Malformed State Crashing ด้วยการ Wrap ใน Safe Try-Catch เสมอ
        </div>
        <div class="sim-detail-block">
          <strong class="block-label">📦 ผลลัพธ์ส่งต่อ:</strong>
          ผู้ใช้คนอื่นสามารถเปิดลิงก์และเห็นมุมมองผังกราฟเดียวกันได้ทันที 100%
        </div>
      </div>`
  }
];

const SIM_JUMPS = [
  {
    file: "flowexplorer", line: 168,
    snippets: [
      { file: "flowexplorer", line: 168, start: 168, end: 171, note: "handleSubmit — ดักการกด Submit และสั่ง e.preventDefault() ป้องกันรีเฟรช" },
      { file: "uihelper", line: 16, start: 16, end: 56, note: "validateUrlInput — ตรวจสอบค่าว่าง สกัด hostname และตรวจ Whitelist โดเมน" }
    ]
  },
  {
    file: "flowexplorer", line: 114,
    snippets: [
      { file: "flowexplorer", line: 114, start: 103, end: 145, note: "executeAnalysis — บริหาร State โหลด/ผิดพลาด และยิง fetch POST /api/analyze" }
    ]
  },
  {
    file: "route", line: 7,
    snippets: [
      { file: "route", line: 7, start: 7, end: 31, note: "POST handler — รับ JSON body, Guard Clause เช็ค URL และส่ง HTTP 401/500" }
    ]
  },
  {
    file: "route", line: 19,
    snippets: [
      { file: "route", line: 19, start: 18, end: 20, note: "ส่งมอบงานให้ Orchestrator หลักผ่าน runAnalysisPipeline(url, token)" },
      { file: "pipeline", line: 439, start: 439, end: 446, note: "runAnalysisPipeline ทางเข้าหลัก — เริ่มจับเวลาด้วย performance.now()" }
    ]
  },
  {
    file: "github", line: 25,
    snippets: [
      { file: "github", line: 25, start: 15, end: 41, note: "parseGitHubUrl — แยก owner/repo/branch และบังคับโดเมน github.com" },
      { file: "pipeline", line: 448, start: 448, end: 466, note: "Fallback Guard สำรองของ pipeline และ Whitelist Check" }
    ]
  },
  {
    file: "pipeline", line: 467,
    snippets: [
      { file: "pipeline", line: 10, start: 10, end: 14, note: "computeCacheKey — คำนวณ SHA-256 Token Hash ทำ Cache Partitioning" },
      { file: "pipeline", line: 467, start: 467, end: 475, note: "pipelineCache.has() ตรวจสอบแคชแยกสิทธิ์ คืนค่ารวดเร็ว <10ms" }
    ]
  },
  {
    file: "pipeline", line: 481,
    snippets: [
      { file: "pipeline", line: 348, start: 345, end: 358, note: "ตรวจจับ HTTP 401 Bad credentials ใน fetchGitHubTree" },
      { file: "pipeline", line: 481, start: 477, end: 485, note: "fetchGitHubTree พร้อม Fallback 2 ชั้น main -> master -> default_branch" },
      { file: "github", line: 56, start: 44, end: 60, note: "buildGitHubApiUrl & buildGitHubHeaders แนบ Bearer Token" }
    ]
  },
  {
    file: "parser", line: 104,
    snippets: [
      { file: "parser", line: 104, start: 101, end: 124, note: "filterTreeFiles — ตัดโฟลเดอร์ขยะ/ไฟล์คอนฟิก และจำกัด 500 ไฟล์" },
      { file: "parser", line: 129, start: 129, end: 160, note: "detectNextFileType — จำแนก 9 บทบาทสถาปัตยกรรม App Router" },
      { file: "pipeline", line: 489, start: 487, end: 512, note: "ลูปจำแนกบทบาทไฟล์ใน pipeline" }
    ]
  },
  {
    file: "pipeline", line: 521,
    snippets: [
      { file: "pipeline", line: 521, start: 521, end: 542, note: "Promise.all ดึงโค้ดดิบ 45 ไฟล์แรกแบบขนาน พร้อม timeout 4s" },
      { file: "parser", line: 165, start: 165, end: 204, note: "extractImportsFromCode — สกัด import จากโค้ดดิบ" },
      { file: "pipeline", line: 103, start: 103, end: 127, note: "resolveImportToFilePath — กลยุทธ์แปลง import เป็น path จริง 3 ชั้น" },
      { file: "parser", line: 213, start: 213, end: 271, note: "extractActionTriggers — สกัด onClick และ form action" },
      { file: "pipeline", line: 133, start: 133, end: 225, note: "inferStructuralRelations — เสริมเส้นโครงสร้าง Next.js อัตโนมัติ" }
    ]
  },
  {
    file: "generator", line: 48,
    snippets: [
      { file: "generator", line: 48, start: 40, end: 83, note: "applyDagreLayout — กำหนดค่า Dagre 'LR' และคำนวณพิกัด X, Y" },
      { file: "generator", line: 102, start: 89, end: 130, note: "buildFlowElements — สร้าง nodes, edges และสีตามบทบาท" }
    ]
  },
  {
    file: "pipeline", line: 590,
    snippets: [
      { file: "pipeline", line: 590, start: 576, end: 592, note: "pipelineCache.set บันทึกลงแคช LRU ด้วย cacheKey แยกสิทธิ์" },
      { file: "route", line: 20, start: 19, end: 28, note: "NextResponse.json ส่งผลลัพธ์กลับหน้า Dashboard 200 OK" },
      { file: "flowcanvas", line: 129, start: 122, end: 218, note: "toRfNodes & toRfEdges — แปลงข้อมูลและวาดผังบน React Flow Canvas" }
    ]
  },
  {
    file: "flowcanvas", line: 57,
    snippets: [
      { file: "flowcanvas", line: 57, start: 48, end: 119, note: "computeTracePath — ค้นหาสายสัมพันธ์ Ancestors & Descendants ด้วย BFS" },
      { file: "flowcanvas", line: 348, start: 348, end: 350, note: "handleClearFocus — ล้างการไฮไลต์กลับสู่มุมมองปกติ" }
    ]
  },
  {
    file: "flowexplorer", line: 60,
    snippets: [
      { file: "flowexplorer", line: 60, start: 43, end: 96, note: "handleSelectNode — ดึง rawUrl และสั่ง fetch ดาวน์โหลดโค้ดจริง" },
      { file: "codeviewer", line: 62, start: 53, end: 110, note: "formatCodeSnippet ตัด 300 บรรทัด & highlightCodeWithPrism" },
      { file: "sidedrawer", line: 25, start: 25, end: 90, note: "SideDrawer — แผงตรวจโค้ดด้านขวาพร้อมปุ่ม Copy Code" }
    ]
  },
  {
    file: "flowcanvas", line: 353,
    snippets: [
      { file: "flowcanvas", line: 353, start: 353, end: 376, note: "focusAndPanToNode — ค้นหาโหนดด่วน (Ctrl+K) และสั่ง setCenter แพนกล้อง" },
      { file: "uihelper", line: 129, start: 63, end: 119, note: "encodeShareableState & decodeShareableState — จัดการ Base64 State URL" }
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
    desc: "รันบนเครื่อง ubuntu-latest: job ชื่อ 'Run Unit Tests and Build' เริ่มจาก checkout โค้ดด้วย actions/checkout@v4, ติดตั้ง Node.js 20 พร้อมแคช npm แล้ว npm ci เพื่อติดตั้ง dependency ตาม lock file แบบพอดีเป๊ะ",
    code: "jobs:\n  test:\n    name: Run Unit Tests and Build\n    runs-on: ubuntu-latest\n\n    steps:\n      - name: Checkout Code\n        uses: actions/checkout@v4\n\n      - name: Setup Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'\n\n      - name: Install Dependencies\n        run: npm ci"
  },
  {
    title: "Run Unit Tests: ด่านบังคับให้เทสต์ผ่านก่อน",
    badge: "ci.yml บรรทัด 27-28",
    desc: "ขั้นนี้สั่ง npm test ซึ่งรัน Vitest ทั้ง 4 ไฟล์ (src/lib/github.test.ts, parser.test.ts, generator.test.ts, ui-helper.test.ts) รวม 51 เทสต์ — ใครแก้โค้ดจนเทสต์ใดล้ม PR จะขึ้นกากบาททันที ยังไม่ทัน merge เข้า main",
    code: "- name: Run Unit Tests\n  run: npm test"
  },
  {
    title: "Build Check: ประตูสุดท้ายก่อนรับโค้ด",
    badge: "ci.yml บรรทัด 30-31",
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
    title: "สรุปเจตนา: ทำไม CI ชุดนี้ถึงพอ",
    badge: "สรุปเจตนา",
    desc: "ทุกคน push งานบน branch ของตัวเองแล้วเปิด PR เข้า main → CI รันสองด่านที่จำเป็นที่สุด: npm test (เทสต์ 51 เคสจาก 4 ไฟล์ใน src/lib) และ npm run build (คอมไพล์ทั้งโปรเจกต์ด้วย TypeScript + Next.js) ผ่านทั้งคู่แล้วจึง merge ได้ ทำให้ไม่มีโค้ดที่ทำเทสต์หรือ build พังหลุดขึ้น main",
    code: null
  }
];

const REDTEAM_ITEMS = [
  {
    icon: "⏱️",
    title: "GitHub API Rate Limit",
    risk: "GitHub จำกัด 60 ครั้ง/ชม. ต่อ IP ถ้าไม่มี Token — ผู้ใช้เยอะเมื่อไหร่ ระบบตายก่อนพัง",
    fix: "แคช In-Memory (บรรทัด 446) ตอบงานซ้ำโดยไม่ยิง API + รับ Token จากผู้ใช้ขยายเป็น 5,000/ชม. + inferStructuralRelations สร้างกราฟจากโครงสร้างโฟลเดอร์โดยไม่ต้องดึงโค้ดทุกไฟล์"
  },
  {
    icon: "🌊",
    title: "DoS ด้วยคลังขนาดยักษ์",
    risk: "ถ้าผู้ใช้วิเคราะห์ repo หลักแสนไฟล์ เซิร์ฟเวอร์จะโหลดหนักจนล่มทั้ง Memory และ Network",
    fix: "filterTreeFiles(treeData, 500) จำกัด 500 ไฟล์ (บรรทัด 468) และดึงเนื้อโค้ดแค่ 45 ไฟล์แรก พร้อม AbortSignal.timeout(4000) ตัดการรอเมื่อเน็ตช้า (บรรทัด 501, 507)"
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
    fix: "parseGitHubUrl บังคับ hostname ให้เป็น github.com ตรงตัวด้วยการเทียบ hostname (github.ts 34-37) + Guard Clause ตรวจซ้ำใน pipeline (บรรทัด 434-436) และ URL ปลายทางประกอบจาก owner/repo ที่ผ่านการแกะแล้วเท่านั้น"
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
    a: "ระบบจะเจอ 404 แล้ว Fallback ไปลอง branch master อัตโนมัติ (บรรทัด 281-290) ถ้าเจอใช้ตัวนั้นต่อและบันทึก activeBranch ไว้ในผลลัพธ์ ถ้าไม่เจอทั้งคู่จะโยน Error ชี้ชัดว่าไม่พบคลังหรือ branch เพื่อให้ผู้ใช้เช็คลิงก์ได้ทันที"
  },
  {
    q: "หนูวัดผลว่า Pipeline ของตัวเองทำงานดีแค่ไหนยังไง?",
    a: "แนบ executionTimeMs คำนวณจาก performance.now() ตั้งแต่บรรทัด 418 ถึงตอนสร้างผลลัพธ์ (577) + แฟล็ก isCached บอกว่าเป็นงานจากแคชหรืองานใหม่ + เทสต์ทั้ง 4 ไฟล์ใน src/lib รวม 51 เคสรันบน CI ทุกครั้งที่ push เพื่อยืนยันว่าการเชื่อมต่อทุกโมดูลยังครบถ้วน"
  }
];

const QUIZ_QUESTIONS = [
  {
    q: "ตัวแปร pipelineCache ใน pipeline.ts เก็บข้อมูลในรูปแบบใด?",
    options: ["Array ของ string", "Map โดยใช้ URL เป็น Key และ AnalysisResult เป็น Value", "JSON string ที่เก็บลง localStorage", "Object เดียวเขียนทับกันไปมา"],
    answer: 1,
    explain: "บรรทัด 23: pipelineCache = new Map<string, AnalysisResult>() — ใช้ URL เป็นกุญแจเพื่อหยิบผลเก่ากลับมาได้เร็วระดับ O(1)"
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
    explain: "github.ts บรรทัด 57: ต่อท้ายลิงก์ด้วย ?recursive=1 เพื่อขอ tree ทั้งหมดแบบเวียนเกิด (recursive) ประหยัดการยิง API ทีละโฟลเดอร์"
  },
  {
    q: "ถ้าคลังเป้าหมายใช้ branch 'master' แทน 'main' ระบบทำอย่างไร?",
    options: ["โยน Error ทันทีให้ผู้ใช้แก้ URL", "ลองสร้าง branch main ให้อัตโนมัติ", "รอให้ผู้ใช้กดซ้ำจนสำเร็จ", "เจอ 404 แล้วลอง master อัตโนมัติแล้ววิเคราะห์ต่อ"],
    answer: 3,
    explain: "pipeline.ts บรรทัด 281-290: เมื่อตอบ 404 ที่ branch main จะ fetch ซ้ำด้วย master ถ้าสำเร็จเปลี่ยน activeBranch เป็น 'master' แล้วทำงานต่อโดยผู้ใช้ไม่ต้องทำอะไร"
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
// FILE_GUIDES — บทวิเคราะห์รายไฟล์ครบทั้ง 18 ไฟล์ (แสดงใน Inspector ด้านล่าง)
// mechanics ใช้รูปแบบ "• บรรทัด X-Y: ..." เพื่อให้ formatMechanicsLines() เน้นเลขบรรทัดได้
// ============================================================

const FILE_GUIDES = {
  pipeline: {
    role: "ตัวคุมจังหวะกลาง (Orchestrator) — ประสานงานทุกโมดูลตั้งแต่รับ URL จนส่งกราฟกลับหน้าจอ",
    mechanics: "• บรรทัด 15-18: import เครื่องมือของคน 1 (github), คน 2 (parser), คน 3 (generator) + Types กลาง\n• บรรทัด 20-23: pipelineCache = new Map() จองแคชในแรม ใช้ URL เป็น Key\n• บรรทัด 25-30: clearPipelineCache() ล้างแคชทั้งหมด ใช้ตอนรันเทส/รีเซ็ตระบบ\n• บรรทัด 32-95: เครื่องมือแปลง import เป็นพาธไฟล์จริง — COMMON_EXTENSIONS (32), resolveAliasImport (35-46) สำหรับ @/ ~/, resolveRelativeImport (48-66) สำหรับ ./ ../ และ resolveImportToFilePath (68-95) ตัวคุมกลยุทธ์\n• บรรทัด 97-264: inferStructuralRelations() เดาความสัมพันธ์จากโครงสร้าง App Router (middleware->root, layout renders page, parent->sub-route, component->page, component->store) พร้อมกันเส้นซ้ำด้วย Set ใน addRelation (103-110)\n• บรรทัด 266-343: fetchGitHubTree() ยิง Trees API, Fallback main->master (281-290) และถาม default_branch จาก Repo API เมื่อยัง 404 (294-327) แล้วคืน { treeData, activeBranch } ที่ 330-333\n• บรรทัด 345-406: extractRelationsFromContent() แกะ import/action จากเนื้อโค้ดจริงแล้ว resolve เป็นพาธด้วยเครื่องมือด้านบน\n• บรรทัด 412-581: runAnalysisPipeline() หัวใจหลัก — จับเวลา 418, แกะ URL พร้อม Fallback Guard 421-432, กัน URL ปลอม 434-436, อ่าน GITHUB_TOKEN จาก env เป็นตัวสำรอง 441-443, เช็กแคช 446-452, ดึงโครงสร้าง 454-463, กรองไฟล์ 467-478, ดึงโค้ดจริง 45 ไฟล์ timeout 4s 499-525, แกะความสัมพันธ์ 527-533, วาดกราฟ 536-563, แพ็กผล + บันทึกแคช 566-581",
    links: "เรียกใช้: คน 1 (parseGitHubUrl, buildGitHubApiUrl, buildGitHubHeaders) · คน 2 (filterTreeFiles, detectNextFileType, extractImportsFromCode, extractActionTriggers) · คน 3 (buildFlowElements, generateMermaidSyntax) — ถูกเรียกโดย route.ts บรรทัด 68",
    defense: "หนูออกแบบให้ pipeline เป็นจุดเชื่อมเดียวของทุกโมดูล ทุกการเรียกเพื่อนครอบด้วย try-catch พร้อมโค้ดสำรอง และแนบ executionTimeMs ให้เห็นประสิทธิภาพจริงทุกครั้งค่ะ"
  },
  route: {
    role: "ประตูรับคำขอ HTTP (POST /api/analyze) — แปลงคำขอจากหน้าเว็บเป็นการเรียก Pipeline",
    mechanics: "• บรรทัด 1-3: import NextRequest/NextResponse และ runAnalysisPipeline จาก pipeline\n• บรรทัด 9: ประกาศ POST handler รอรับคำขอจากหน้าเว็บ (คน 4)\n• บรรทัด 12-13: await req.json() อ่าน body { url, token }\n• บรรทัด 16-21: Guard Clause — ถ้าไม่มี url ตอบ HTTP 400 กลับทันที\n• บรรทัด 24: ส่ง url + token เข้า runAnalysisPipeline()\n• บรรทัด 27: ตอบ NextResponse 200 พร้อมผลวิเคราะห์\n• บรรทัด 28-36: catch ทุก Error แปลงเป็น HTTP 500 พร้อมข้อความควบคุมไว้ ไม่รั่ว stack trace",
    links: "รับคำขอจาก page.tsx (fetch POST) → เรียก pipeline.ts — เป็นหน้าด่านเดียวที่โลกภายนอกติดต่อ",
    defense: "route ของหนูบางแค่ 37 บรรทัดเพราะตัดสินใจอะไรไม่เองเลย แค่ตรวจความถูกต้องเบื้องต้นแล้วส่งต่อให้ Pipeline ทำงานตามหน้าที่เดียวชัดเจนค่ะ"
  },
  github: {
    role: "ผู้เชี่ยวชาญ GitHub API (คน 1) — แกะ URL ประกอบลิงก์และ Headers ทุกชนิด",
    mechanics: "• บรรทัด 13: import ParsedGitHubUrl จาก types (สัญญาข้อมูลกลาง)\n• บรรทัด 19-23: parseBranchFromSegments() อ่านชื่อ branch จาก URL รูปแบบ /tree/<branch> หรือ /blob/<branch>\n• บรรทัด 25-51: parseGitHubUrl() ตรวจค่าว่าง (26-28), เติม https:// ให้เอง (31), เทียบ hostname แบบตรงตัวจึงกัน evilgithub.com ได้ (34-37), แยก segment (39-40), ตัด .git (45) แล้วคืน { owner, repo, branch } ที่ 47\n• บรรทัด 56-58: buildGitHubApiUrl() ประกอบลิงก์ Trees API พร้อม ?recursive=1 ได้ทุกไฟล์ในครั้งเดียว\n• บรรทัด 63-73: buildGitHubHeaders() แนบ User-Agent เสมอ และ Authorization: Bearer (68-70) เมื่อมี Token\n• บรรทัด 78-89: buildGitHubRawUrl() ลิงก์ดึงโค้ดดิบสำหรับ Side Inspector (กันสลับพารามิเตอร์ filePath/branch)\n• บรรทัด 94-96: buildGitHubBlobUrl() ลิงก์เปิดดูไฟล์บนเว็บ GitHub",
    links: "ถูกเรียกโดย: pipeline.ts (แกะ URL, ประกอบ API) และ FlowExplorer.tsx (buildGitHubRawUrl/BlobUrl ตอนเปิด Drawer)",
    defense: "ฟังก์ชันของหนูเป็น Pure Function ทดสอบง่าย มี github.test.ts ครอบ 10 เคส รวมกรณี hostname ปลอมอย่าง evilgithub.com และ Token มีเว้นวรรค ทำให้ด่านแรกของระบบแน่นหนาค่ะ"
  },
  parser: {
    role: "เครื่องกรองและแกะความสัมพันธ์จากโค้ด (คน 2) — คัดไฟล์ขยะ จำแนกเลเยอร์ แกะ import/action",
    mechanics: "• บรรทัด 16-35: BLACKLIST_FOLDERS รายชื่อโฟลเดอร์ขยะ (node_modules, .next, dist, tests ฯลฯ)\n• บรรทัด 37-61: BLACKLIST_FILES ชุดไฟล์ config/lockfile ที่ไม่ใช่ซอร์สโค้ด\n• บรรทัด 63-69: ALLOWED_ROOT_FILES ยกเว้น middleware.ts/proxy.ts ที่ต้องอยู่นอกราก\n• บรรทัด 71-83: VALID_EXTENSIONS รับแค่ .ts .tsx .js .jsx และ RESERVED_IDENTIFIERS กันคำสงวนของภาษา\n• บรรทัด 85-101: Regex ชุดจำแนกโฟลเดอร์/ไฟล์ที่พบจริง — component(s?)/ui/widgets?/views?, action(s?), store(s?)/context(s?)/state, hooks?, api/, pages/, store ที่เป็นไฟล์ และ use* hook\n• บรรทัด 104-124: shouldIgnorePath() รวมกฎทั้งหมดไว้เป็นด่านเดียว ใช้ร่วมกันทั้งการกรองไฟล์\n• บรรทัด 129-152: filterTreeFiles() กรองเฉพาะ blob ที่ผ่านเกณฑ์ พร้อมตัดที่ maxLimit กันโหลดหนัก\n• บรรทัด 159-194: detectNextFileType() จำแนก 9 บทบาท เรียงจากเฉพาะเจาะจงไปกว้าง: page -> layout -> middleware -> Pages Router -> api -> action -> store -> hook -> component -> other\n• บรรทัด 199-225: extractImportsFromCode() แกะ import บรรทัดเดียว/หลายบรรทัด/type import ข้ามบรรทัดคอมเมนต์ และตัดซ้ำ\n• บรรทัด 227-240: extractTargetFunction() ช่วยแกะชื่อฟังก์ชันเป้าหมายจาก onClick\n• บรรทัด 245-302: extractActionTriggers() จับ onClick และ form action เชื่อม UI เข้าหา Server Action",
    links: "ถูกเรียกโดย pipeline.ts ขั้นกรองไฟล์ (467-492) และขั้นแกะความสัมพันธ์ (527-529) — ผลงานคน 2",
    defense: "จุดขายของหนูคือลำดับการจำแนก detectNextFileType ที่เรียงจากเฉพาะเจาะจงไปกว้าง และรองรับคำเอกพจน์/พหูพจน์กับชื่อโฟลเดอร์ที่พบจริงในโปรเจกต์ Next.js (ui/, widgets/, _components, hooks/) ทำให้ไฟล์ชื่อซ้อนกัน เช่น actions/page.tsx ยังตัดสินถูกค่ะ"
  },
  generator: {
    role: "โรงงานวาดกราฟ (คน 3) — แปลง relations เป็นโหนด/เส้นของ React Flow และ Mermaid",
    mechanics: "• บรรทัด 19-27: sanitizeNodeId() แปลงพาธเป็น id ปลอดภัย ตัดวงเล็บ route group เช่น (auth)\n• บรรทัด 29-46: COLOR_PALETTE + getNodeColorConfig() ชุดสีมาตรฐานตามบทบาท: middleware ม่วง, page ฟ้า, action ส้ม, store เขียว, hook อินดิโก #818cf8, component แดงชมพู, api เหลือง พร้อม fallback เป็น other\n• บรรทัด 48-97: applyDagreLayout() + ค่าคงที่ NODE_WIDTH/NODE_HEIGHT จัดพิกัดโหนดด้วย Dagre ให้อ่านง่ายและไม่ทับกัน\n• บรรทัด 102-164: buildFlowElements() แปลงไฟล์+relations เป็น Nodes/Edges — กันพาธต่างกันแต่ sanitize ได้ id เดียวกันด้วย idByPath, ไม่ใส่ edge ซ้ำ และมี fallback เมื่อ Dagre ล้ม\n• บรรทัด 169-191: generateMermaidSyntax() ต่อสตริง graph TD พร้อม label ถ้าไม่มี relation เลยส่งผังว่างกลับ ไม่ให้ error",
    links: "ถูกเรียกโดย pipeline.ts บรรทัด 536-563 — ผลลัพธ์ส่งตรงเข้า FlowCanvas.tsx ของคน 3 เองบนหน้าจอ",
    defense: "หนูแยกส่วนสร้างข้อมูลกราฟออกจากการแสดงผลชัดเจน buildFlowElements คืนข้อมูลล้วน ส่วน FlowCanvas จัดการ interactive เอง ทำให้เทสได้โดยไม่ต้องเปิดเบราว์เซอร์ (generator.test.ts 9 เคส) ค่ะ"
  },
  page: {
    role: "หน้าแรกของเว็บแอป (คน 4) — Thin Wrapper วาง Navbar และเรียก FlowExplorer",
    mechanics: "• บรรทัด 1-3: import React, ไอคอน GitFork และ FlowExplorer\n• บรรทัด 5: export default function HomePage() คอมโพเนนต์หน้าแรก\n• บรรทัด 9-34: ส่วนหัว Navbar สไตล์ Vercel Minimalist พร้อมโลโก้ Git Flowchart และลิงก์ GitHub\n• บรรทัด 36-37: เรียกใช้ <FlowExplorer /> ส่งมอบ State ทั้งหมดให้แยกทำงานแบบโมดูลาร์",
    links: "เรียกใช้: FlowExplorer.tsx (State Orchestrator) — ครอบด้วย layout.tsx · ตัวไฟล์ page.tsx มีแค่ 39 บรรทัด ไม่ถือ logic ใด ๆ",
    defense: "ผม refactor แยก page.tsx ให้เป็น Thin Wrapper (39 บรรทัด) และส่ง State ทั้งหมดไปไว้ใน FlowExplorer.tsx ตามหลัก Clean Architecture ทำให้โค้ดอ่านง่ายและดูแลรักษาได้ดีขึ้นมากครับ"
  },
  flowexplorer: {
    role: "State Engine & UI Orchestrator (คน 4) — คุม Form, Filter, FlowCanvas และ SideDrawer",
    mechanics: "• บรรทัด 27-31: SAMPLE_REPOSITORIES ชุดตัวอย่างให้กดลองวิเคราะห์เร็ว ๆ\n• บรรทัด 33: export function FlowExplorer() คอมโพเนนต์หลัก\n• บรรทัด 35-42: useState 8 ตัว — url, token, loading, errorMessage, result, shareCopied, filterType, isCodeLoading\n• บรรทัด 45-51: drawerState คุม SideDrawer (isOpen, filePath, fileContent, fileType, githubRawUrl)\n• บรรทัด 114-158: executeAnalysis() ตรวจ URL ด้วย validateUrlInput (115) แล้วยิง POST /api/analyze (126) ได้ผล set result\n• บรรทัด 160-167: useEffect เก็บ executeAnalysis ตัวล่าสุดไว้ใน ref กันวิเคราะห์ซ้ำเมื่อ state เปลี่ยน\n• บรรทัด 170-182: อ่าน ?state= แล้วเรียกวิเคราะห์ผ่าน queueMicrotask เพื่อเลี่ยง cascading re-render\n• บรรทัด 184-188: handleSubmit() ดักจับ submit ของฟอร์ม\n• บรรทัด 190-200: handleShare() encodeShareableState แล้วคัดลอก share link ลง clipboard\n• บรรทัด 210-240: useMemo คำนวณ counts (210), displayedNodes (220) และ displayedEdges (233) กรองตามแท็บที่เลือก\n• บรรทัด 528: ติดตั้ง FlowCanvas · บรรทัด 540: ติดตั้ง SideDrawer",
    links: "ยิงคำขอ: POST /api/analyze (คน 6) · เรียกเครื่องมือ: ui-helper, github.ts · ส่งต่อผลลัพธ์: FlowCanvas (คน 3), SideDrawer (คน 5)",
    defense: "FlowExplorer เป็นศูนย์กลางการบริหาร State ของ UI ฝั่ง Client ทั้งหมด แยกอิสระจาก Server Wrapper ทำให้สามารถนำไป Re-use หรือเปลี่ยน Layout หน้าเว็บได้สะดวกครับ"
  },
  uihelper: {
    role: "เครื่องมือกลางฝั่ง UI (คน 4) — ตรวจ URL คำนวณสถิติและระบบแชร์ลิงก์",
    mechanics: "• บรรทัด 16-56: validateUrlInput() ด่านแรกก่อนยิง API — ค่าว่าง (17-19), ตรวจ hostname จริงด้วย new URL() จึงกัน https://evil.com/?x=github.com/a/b ได้ (24-32, 44-47), ดักแท็ก <script> ป้องกัน XSS (35-42) และบังคับให้มีทั้ง owner/repo (49-53)\n• บรรทัด 61-80: formatRepoStats() คำนวณจำนวนไฟล์ที่คัดกรองออกพร้อมเปอร์เซ็นต์ กัน NaN และค่าติดลบ\n• บรรทัด 85-124: calculateHealthScore() ให้เกรดสถาปัตยกรรม A (ratio 0.8-2.5), B (2.5-4.0), C (อื่น ๆ), N/A (0 ไฟล์)\n• บรรทัด 129-148: encodeShareableState() ฝัง url + activeNode เป็น base64 แนบใน ?state=\n• บรรทัด 153-184: decodeShareableState() ถอดกลับอย่างปลอดภัยด้วย try-catch ลิงก์ปลอมไม่ทำระบบพัง",
    links: "ถูกเรียกโดย FlowExplorer.tsx (ตรวจ URL, สถิติ, แชร์) — เทสโดย ui-helper.test.ts ของคน 4 เอง",
    defense: "validateUrlInput ของหนูตรวจ hostname จริงด้วยตัวแยกวิเคราะห์ URL จึงกันลิงก์หลอกอย่าง https://evil.com/?x=github.com/a/b ได้ และดักการฝังสคริปต์ ช่วยลดภาระฝั่งเซิร์ฟเวอร์ตั้งแต่ปลายทางผู้ใช้ค่ะ"
  },
  codeviewer: {
    role: "ตัวจัดการโค้ดใน Inspector (คน 5) — ระบุภาษา ตัดทอน และไฮไลต์ด้วย Prism",
    mechanics: "• บรรทัด 22-51: EXTENSION_LANGUAGE_MAP (22-34) และ getLanguageFromPath() (39-51) แผนที่นามสกุลไฟล์เป็นชื่อภาษา Prism (tsx/typescript/javascript/json) พร้อม fallback ที่ไม่ crash\n• บรรทัด 62-94: formatCodeSnippet() ตัดโค้ดไม่เกิน maxLines (300) พร้อมคืน totalLines และธง isTruncated และ escapeHtml() (88-94) ช่วย escape ก่อนไฮไลต์\n• บรรทัด 96-108: highlightCodeWithPrism() เรียก Prism.highlight แปลงโค้ดเป็น HTML มีสี กรณีภาษาไม่รู้จักคืนข้อความ escape ปลอดภัย",
    links: "ถูกเรียกโดย SideDrawer.tsx ของคน 5 — ใช้ตัดโค้ด 300 บรรทัดก่อนแสดงและไฮไลต์ด้วย Prism ใน Drawer",
    defense: "หนูจำกัดโค้ดที่แสดงไว้ 300 บรรทัดเพื่อประสิทธิภาพ DOM และมีปุ่ม \"ดูโค้ดทั้งหมด\" ใน SideDrawer เมื่อต้องการอ่านเต็ม ผู้ใช้รู้ทันทีว่าเห็นโค้ดบางส่วนค่ะ"
  },
  flowcanvas: {
    role: "ผืนผ้าใบกราฟแบบอินเทอร์แอกทีฟ (คน 3) — แสดง/โฟกัส/ไล่เส้นทางบน React Flow",
    mechanics: "• บรรทัด 52-54: ค่าคงที่ผังกราฟ COLUMNS = 4 คอลัมน์ ความกว้างช่อง 320 และความสูงแถว 120 (ใช้เป็นค่าตั้งต้นของกริด)\n• บรรทัด 57-127: computeTracePath() ไล่หาโหนดเชื่อมโยงทั้งสาย (Ancestors + Descendants) รองรับ 2 โหมด: ทั้งสาย และ 1 สเต็ป\n• บรรทัด 129-225: toRfNodes() แปลง FlowNodeItem เป็นโหนด React Flow พร้อมไฮไลต์เมื่ออยู่ในเส้นทางที่โฟกัส\n• บรรทัด 227-228: CRITICAL_ARCHITECTURAL_LABELS ป้ายสำคัญทางสถาปัตยกรรมที่โหมด Smart แสดงเฉพาะป้ายที่มีความหมาย\n• บรรทัด 230-297: toRfEdges() กรองป้ายตามโหมด สมาร์ท/ทั้งหมด/ปิด และทำเส้น animated เมื่อถูกโฟกัส\n• บรรทัด 299-697: คอมโพเนนต์ FlowCanvasInner — state 8 ตัว (300-309), useMemo เตรียมโหนด/เส้น/ไฮไลต์เส้นทาง (316-339), ค้นหาโหนด (404-408), ข้อความเมื่อยังไม่มีโหนด (425-431), Toolbar ลอย (436+), onNodeClick แจ้ง onSelectNode (661-668) พร้อม MiniMap และ onlyRenderVisibleElements (673)\n• บรรทัด 700-705: FlowCanvas ตัวนอกห่อ ReactFlowProvider เพื่อให้ hook useReactFlow ทำงานได้",
    links: "รับ nodes/edges จาก FlowExplorer.tsx (มาจาก generator ผ่าน API ของคน 6) — คลิกโหนดส่งกลับเป็นเหตุการณ์เปิด SideDrawer",
    defense: "หนูใช้ onlyRenderVisibleElements และ useMemo ทุกจุดเพื่อรองรับกราฟหลายร้อยโหนดแบบลื่น ๆ และโหมดสมาร์ทช่วยลดสัญญาณรบกวนจากป้ายที่ไม่จำเป็นค่ะ"
  },
  sidedrawer: {
    role: "กล่องตรวจโค้ดเด้งด้านขวา (คน 5) — Dialog แสดงโค้ดจริงของโหนดที่คลิก",
    mechanics: "• บรรทัด 25: SideDrawer component รับ props isOpen/filePath/fileType/rawCode/githubRawUrl\n• บรรทัด 34-36: state copied + fullCodeFilePath พร้อม showFullCode ที่คิดจาก filePath ปัจจุบัน (ไม่ค้างสถานะเมื่อสลับไฟล์)\n• บรรทัด 50-61: useMemo เตรียมผลลัพธ์ครบชุด — getLanguageFromPath + formatCodeSnippet(300) + highlightCodeWithPrism และขยายเป็น 20,000 บรรทัดเมื่อกดดูโค้ดทั้งหมด\n• บรรทัด 63-70: handleCopy() คัดลอกโค้ดเต็มลง clipboard พร้อมข้อความยืนยัน 2 วินาที\n• บรรทัด 74-90: โครง dialog — backdrop ปิดเมื่อคลิกนอก (77-81), role=\"dialog\" aria-modal รองรับ screen reader (86-88)\n• บรรทัด 92-116: แถบหัว Drawer — badge ประเภทไฟล์ (95-98), ชื่อไฟล์แบบ truncate (100), ปุ่มปิด (108-111)\n• บรรทัด 117-131: นับจำนวนบรรทัดจริง พร้อมปุ่ม \"ดูโค้ดทั้งหมด\" เมื่อโค้ดเกิน 300 บรรทัด\n• บรรทัด 132-155: ปุ่มเปิดบน GitHub ↗ (blob URL) และปุ่ม Copy Code",
    links: "ถูกเปิดโดย FlowExplorer.tsx เมื่อคลิกโหนดบน FlowCanvas — ใช้เครื่องมือ code-viewer.ts ของคน 5 เอง",
    defense: "หนูใส่ aria-modal และ aria-label ให้ dialog ตั้งแต่ต้น และใช้ useMemo รวมการประมวลผล Prism ไว้จุดเดียว ทำให้เปิด-ปิด Drawer หลายรอบไม่หน่วงค่ะ"
  },
  layout: {
    role: "โครงหน้ารายของ Next.js (Shared) — โหลดฟอนต์และครอบทุกหน้า",
    mechanics: "• บรรทัด 1-3: import ฟอนต์จาก next/font/google และ globals.css\n• บรรทัด 5-19: ประกาศฟอนต์ 3 ตระกูล — Geist (หลัก), Geist Mono (โค้ด), IBM Plex Sans Thai weight 400-700 subsets thai+latin รองรับภาษาไทยเต็มรูปแบบ\n• บรรทัด 22-25: metadata ชื่อเว็บ \"GitFlow Visualizer\" + description\n• บรรทัด 27-41: RootLayout ครอบ <html><body> ส่งต่อ font variables ผ่าน className พร้อม antialiased",
    links: "ครอบ page.tsx โดยอัตโนมัติผ่าน App Router — ธีมสีและฟอนต์มาจาก globals.css",
    defense: "หนูเลือก IBM Plex Sans Thai เพราะอ่านภาษาไทยได้สวยทั้งขนาดเล็ก-ใหญ่ และใช้ next/font ที่ preload ให้เอง ทำให้ไม่มีปัญหา FOUT ตอนโหลดครั้งแรกค่ะ"
  },
  types: {
    role: "สัญญาข้อมูลกลางของทั้งทีม (Shared) — Interface หนึ่งเดียวที่ทุกโมดูลอ้างอิง",
    mechanics: "• บรรทัด 3: NextFileType 8 บทบาท — page/layout/action/middleware/store/component/api/other\n• บรรทัด 5-12: GitHubTreeItem โครงไฟล์จาก Trees API (path, mode, type blob|tree, sha)\n• บรรทัด 14-18: ParsedGitHubUrl ผลแกะ URL { owner, repo, branch? }\n• บรรทัด 20-26: CodeRelation เส้นความสัมพันธ์ — type import/action/event/middleware + label\n• บรรทัด 27-33: FlowNodeItem โหนดกราฟ (id, label, fileType, position x,y)\n• บรรทัด 35-41: FlowEdgeItem เส้นกราฟ (animated, style stroke)\n• บรรทัด 44-57: AnalysisResult ผลรวมสุดท้าย — totalFiles, relations, nodes, edges, mermaidSyntax, isCached, executionTimeMs\n• บรรทัด 58-64: SideDrawerState สถานะกล่องตรวจโค้ดของคน 4",
    links: "ถูก import โดยทุกโมดูล — เป็นจุดสัญญาณที่ทำให้ 6 คนพัฒนาแยกกันได้โดยไม่ทับกัน",
    defense: "ตรงนี้คือสัญญาประชาคมของทีม ใครเปลี่ยน interface ตรงนี้ TypeScript จะตะโกนทุกไฟล์ทันที ทำให้เราจับความเสียหายได้ตั้งแต่ตอน build ไม่ต้องรอ runtime ค่ะ"
  },
  globals: {
    role: "ธีมพื้นฐานของเว็บแอป (Shared) — สี ฟอนต์ และ scrollbar ระดับทั้งโปรเจกต์",
    mechanics: "• บรรทัด 1-7: @import tailwindcss และ @theme inline ผูกสี/ฟอนต์เข้ากับตัวแปร CSS\n• บรรทัด 9-12: :root กำหนดพื้นหลังดำ #000000 ตัวอักษร #ededed\n• บรรทัด 14-22: body ใช้ฟอนต์ไทย (font-thai) พร้อม font-feature-settings และ text-rendering optimizeLegibility\n• บรรทัด 24-30: .bg-grid-pattern พื้นหลังตารางจาง ๆ สไตล์ Vercel\n• บรรทัด 33-36: ::selection สีขาวโปร่งแสงสำหรับข้อความที่ลากคลุม\n• บรรทัด 38-55: scrollbar บาง 4px สไตล์มืด ทั้งแนวตั้งและแนวนอน",
    links: "ถูก import โดย layout.tsx — ทุกคอมโพเนนต์ได้ธีมจากไฟล์นี้ผ่าน Tailwind theme",
    defense: "หนูตั้งพื้นหลังดำสนิท #000000 พร้อมพื้นหลังตารางจาง ๆ ช่วยให้แยกชั้นพื้นผิวได้ บวก scrollbar บาง 4px ให้ความรู้สึกเหมือนเครื่องมือดีไซเนอร์ระดับมืออาชีพค่ะ"
  },
  test1: {
    role: "เทสของคน 1 — พิสูจน์ว่า github.ts แกะ URL (รวมชื่อ branch) และประกอบลิงก์ได้ครบทุกกรณี",
    mechanics: "• บรรทัด 1-2: import ฟังก์ชันทั้ง 5 ตัวจาก './github' เข้ามาทดสอบ\n• บรรทัด 4-45: parseGitHubUrl 5 เคส — URL ปกติ, ไม่มี protocol + ตัด .git, อ่านชื่อ branch จาก /tree/<branch> และ /blob/<branch>, ปฏิเสธ hostname ปลอมอย่าง evilgithub.com, รับ www.github.com และปัดค่าที่ไม่ครบ\n• บรรทัด 47-58: buildGitHubApiUrl / buildGitHubHeaders — ต่อ endpoint พร้อม branch และใส่ Authorization เฉพาะเมื่อ token ใช้งานได้\n• บรรทัด 60-77: buildGitHubRawUrl / buildGitHubBlobUrl — สร้าง raw/blob url, สลับ argument ได้เมื่อผู้เรียกส่งสลับกัน, ตัด slash ซ้ำด้านหน้า",
    links: "ทดสอบโมดูลคน 1 (github.ts) — รันพร้อมเทสอีก 3 ไฟล์ด้วย npm test บน CI",
    defense: "เทสชุดนี้ล็อกบั๊กด้านความปลอดภัยไว้ 2 ข้อ: hostname ปลอมที่เคยหลุดเพราะใช้ endsWith และการอ่านชื่อ branch จาก URL ที่ผู้ใช้ก๊อปมาจากหน้า /tree/main ค่ะ"
  },
  test2: {
    role: "เทสของคน 2 — ตรวจการจำแนกเลเยอร์ (รวม hook และคำเอกพจน์) การกรองไฟล์ และการแกะ import/action",
    mechanics: "• บรรทัด 17-36: detectNextFileType ข้อบังคับของ Next.js — page/layout/route, middleware ที่ root และใน src, Pages Router\n• บรรทัด 38-57: เอกพจน์/พหูพจน์ — store/ กับ stores/, component/ กับ components/, action/ กับ actions/ (บั๊กเดิมรองรับแค่พหูพจน์)\n• บรรทัด 59-107: ชื่อโฟลเดอร์ที่พบจริง — ui/, widgets/, views/, private folder _components, hooks/ และไฟล์ use* hook, ไม่นับ user.ts/restore.ts ผิดประเภท, store ที่เป็นไฟล์\n• บรรทัด 109-138: filterTreeFiles — ตัด config/lock/เทสต์, อนุญาต root file เฉพาะ middleware/proxy, ไม่เกิน maxLimit และทน input ผิดรูป\n• บรรทัด 140-159: extractImportsFromCode — เก็บเฉพาะ import ที่อ้างถึงไฟล์ในโปรเจ็ค, ไม่ซ้ำ และคืน [] เมื่อไม่มี\n• บรรทัด 161-191: extractActionTriggers — จับ onClick และ form action, ไม่คืนผลเมื่อไม่มี event",
    links: "ทดสอบโมดูลคน 2 (parser.ts) — 20 เคส ครอบคลุมทุกฟังก์ชันที่ pipeline เรียกใช้",
    defense: "หนูเขียนเคสสั้นแต่จำเพาะ แต่ละ it ตัดสินพฤติกรรมเดียว ทำให้เทสล้มเมื่อไหร่รู้ทันทีว่ากฎข้อไหนพังค่ะ"
  },
  test3: {
    role: "เทสของคน 3 — ตรวจการทำ id, ชุดสี, พิกัดกราฟ และ Mermaid",
    mechanics: "• บรรทัด 9-24: sanitizeNodeId — แปลงพาธเป็น id ที่ใช้อักขระปลอดภัย และไม่คืนค่าว่าง\n• บรรทัด 26-34: getNodeColorConfig — คืนสีตามประเภทไฟล์ และ fallback เป็น other เมื่อไม่รู้จัก\n• บรรทัด 36-88: buildFlowElements — 1 โหนดต่อ 1 ไฟล์, เชื่อม edge ตามพาธจริง, ไม่ทิ้งโหนดเมื่อพาธต่างกันแต่ได้ id เดียวกัน (บั๊กเดิม), คำนวณพิกัด ไม่ใส่ edge ซ้ำ และไม่ crash เมื่อไม่มีไฟล์เลย\n• บรรทัด 90-104: generateMermaidSyntax — คืนผังว่างปลอดภัยเมื่อไม่มี relation และสร้าง graph TD พร้อมป้ายกำกับ",
    links: "ทดสอบโมดูลคน 3 (generator.ts) — ชุดสีที่ตรวจที่นี่ต้องตรงกับที่ FlowCanvas ใช้จริง",
    defense: "หนูล็อกชุดสีไว้ในเทสเลย เพราะสีคือภาษาสื่อสารของกราฟ ถ้าใครเผลอเปลี่ยน CI จะจับได้ก่อนขึ้น main ค่ะ"
  },
  test4: {
    role: "เทสของคน 4 — ตรวจเครื่องมือฝั่ง UI ทั้งตรวจ URL สถิติ เกรดสถาปัตยกรรม และระบบแชร์ลิงก์",
    mechanics: "• บรรทัด 10-39: validateUrlInput — ผ่านเมื่อเป็น github.com ที่มี owner/repo ครบ, ปฏิเสธโดเมนอื่น, ปฏิเสธ URL ที่เพียงแค่มีคำว่า github.com อยู่ข้างใน (บั๊กเดิม) และปฏิเสธ input ว่างหรือมีอักขระอันตราย\n• บรรทัด 41-56: formatRepoStats — คำนวณจำนวนไฟล์ที่ละเว้นพร้อมข้อความสรุป และไม่คืนค่าติดลบหรือ NaN\n• บรรทัด 58-73: calculateHealthScore — ให้ N/A เมื่อไม่มีไฟล์, ให้เกรดตามสัดส่วนเส้นเชื่อมต่อต่อจำนวนไฟล์ และไม่คืน NaN เมื่อ input ผิดปกติ\n• บรรทัด 75-96: encodeShareableState / decodeShareableState — ไป-กลับได้ค่าเดิม, คืน activeNode เป็น undefined เมื่อไม่ได้ส่งมา และทนข้อมูลเสียโดยคืน null แทนการ throw",
    links: "ทดสอบโมดูลคน 4 (ui-helper.ts) — ครอบคลุมฟังก์ชันที่หน้า Dashboard เรียกใช้ทุกตัว",
    defense: "หนูให้น้ำหนักเคสกันพังพิเศษ เช่น ลิงก์ปลอมที่แค่มีคำว่า github.com อยู่ข้างใน ต้องถูกปฏิเสธตั้งแต่ฝั่งผู้ใช้ ไม่ต้องรอให้เซิร์ฟเวอร์ตอบค่ะ"
  }
};
