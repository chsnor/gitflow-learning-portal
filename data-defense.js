// ============================================================
// data-defense.js — แผนการพรีเซนต์ 15 นาที + คำตอบลึกสำหรับการป้องกันงาน + แนวทางต่อยอด + ไลบรารี
// ============================================================

const PRESENTATION_PLAN = [
  {
    phase: "1",
    time: "2 นาที",
    badge: "00:00 - 02:00",
    title: "ที่มา วัตถุประสงค์ และขอบเขตระบบ",
    roleFocus: "ภาพรวมโครงการ & ปัญหาของสถาปัตยกรรม Next.js App Router",
    script: "เรียนอาจารย์ที่เคารพและเพื่อน ๆ ทุกคนครับ โครงงานของเราคือ 'Git Flowchart' เว็บช่วยวิเคราะห์และแปลงโค้ดจากคลัง GitHub ให้เป็นผังไดอะแกรมแบบ Interactive ในหน้าเดียว\n\nที่มาและปัญหาคือ ในโปรเจกต์ Next.js ยุคใหม่แบบ App Router มีไฟล์กระจัดกระจายเยอะมาก ทั้ง Page, Layout, Server Action, Middleware และ Store ย่อย เวลาโปรแกรมเมอร์เข้ามาอ่านโค้ดของคนอื่น จะไล่ดูยากมากว่าไฟล์ไหนเรียกไฟล์ไหน ปุ่มนี้กดแล้วยิงไปหา Action อะไร\n\nวัตถุประสงค์ของเรามี 4 ข้อหลัก:\n1. ดึงโครงสร้างไฟล์จาก GitHub API มาวิเคราะห์อัตโนมัติ\n2. สกัดความสัมพันธ์ทั้ง Import และ Action Triggers ออกมาเป็นไดอะแกรมที่กดโต้ตอบได้\n3. มีหน้าต่าง Side Drawer ส่องโค้ดจริงพร้อม Prism syntax highlighting โดยไม่ต้องสลับจอไป GitHub\n4. คำนวณคะแนน Coupling Health Score เพื่อประเมินคุณภาพสถาปัตยกรรมของโปรเจกต์\n\nขอบเขตระบบ: รองรับคลัง GitHub สาธารณะ, คัดกรองโฟลเดอร์ขยะ 16 ชนิด (node_modules, .next, tests), แยกประเภทไฟล์ 8 เลเยอร์, มี In-Memory Cache เพื่อการตอบสนองทันที, และระบบ Full-chain Trace Flow ไล่สายโค้ดตั้งแต่ต้นน้ำถึงปลายน้ำครับ",
    keyPoints: [
      "ระบุชื่อระบบ: 'Git Flowchart' (ไม่ใช่แค่แผนภาพธรรมดา แต่เป็นเครื่องมือช่วยอ่านโค้ด Next.js)",
      "ปัญหาแท้จริง: ความซับซ้อนของ App Router ที่มี Server/Client Component และ Server Action ซ้อนกัน",
      "ขอบเขตชัดเจน: คัดกรอง 16 โฟลเดอร์ขยะ, แยก 8 เลเยอร์, ทำแคชความเร็วสูง และมี Trace Flow",
      "บทบาทของ Mali (คน 6): ดูแล Orchestration ทั้งหมด (API Route + Pipeline + Integration QA)"
    ],
    demoAction: "เปิดหน้าเว็บ https://git-flowcahrt.vercel.app โชว์หน้าตา Dark Minimal และ IBM Plex Sans Thai typography",
    jumpFile: "page",
    jumpLine: 15
  },
  {
    phase: "2",
    time: "5 นาที",
    badge: "02:00 - 07:00",
    title: "สาธิตการใช้งานระบบจริง (Live Demo)",
    roleFocus: "ขั้นตอนการทำงานจากมุมมองผู้ใช้ (User Experience & Capabilities)",
    script: "ต่อไปเป็นการสาธิตการใช้งานจริงครับ โดยแบ่งออกเป็น 4 สเต็ปหลักที่อาจารย์สามารถทดลองตามได้เลยครับ:\n\n1. การวิเคราะห์คลังโค้ด: นำ URL ของ GitHub (เช่น https://github.com/chsnor/git_flowcahrt) มาวางในช่องค้นหา สามารถใส่ Personal Access Token เพื่อเพิ่มโควตา API ได้ กดปุ่ม 'วิเคราะห์โค้ด' ระบบจะใช้เวลาเพียง 1-2 วินาทีในครั้งแรก และถ้ากดซ้ำจะตอบกลับจาก In-Memory Cache ภายในไม่กี่มิลลิวินาที (isCached: true)\n\n2. ผืนผ้าใบไดอะแกรม (React Flow + Dagre Layout): โหนดถูกจัดเรียงตามลำดับชั้นอย่างเป็นระเบียบ แบ่งสีตามบทบาทของไฟล์ชัดเจน (สีม่วง=Middleware, สีฟ้า=Page, สีส้ม=Action, สีเขียว=Store, สีชมพู=Component) สามารถซูม เลื่อน ย้ายโหนด และมี MiniMap ย่อมุมขวาล่าง\n\n3. ระบบสืบย้อนความสัมพันธ์ (Full-Chain Trace Flow): เมื่อคลิกที่โหนดใดโหนดหนึ่ง ระบบจะทำ Transitive Traversal ทั้งขาขึ้น (Ancestors) และขาลง (Descendants) เส้นเชื่อมและโหนดที่เกี่ยวข้องจะเรืองแสงชัดเจน ส่วนโหนดที่ไม่เกี่ยวข้องจะถูกเฟดจางลง ช่วยให้เข้าใจ Flow ได้ทันที\n\n4. แถบส่องซอร์สโค้ดจริง (Side Drawer): ดึงโค้ดจริงจาก GitHub ผ่าน CDN พร้อม PrismJS Syntax Highlighting มีเลขบรรทัด และปุ่มคัดลอกโค้ด รวมถึงแสดงคะแนน Coupling Health Score ของโปรเจกต์",
    keyPoints: [
      "โชว์ความเร็ว In-Memory Cache: วิเคราะห์ครั้งที่ 2 ตอบกลับทันที 0ms",
      "โชว์ Dagre Hierarchical Layout: โหนดไม่ทับกัน ไม่ลอยเคว้ง เป็นระเบียบ",
      "โชว์ Trace Flow: ส่อง lineage ทั้งขาขึ้น (Upstream) และขาลง (Downstream) แบบ full chain",
      "โชว์ Side Drawer: อ่านโค้ดจริงได้ในหน้าเดียว ไม่ต้องสลับแท็บไป GitHub"
    ],
    demoAction: "กดลองคลังจริง → กดโหนด page.tsx เพื่อดูเส้นเชื่อมต่อ → เปิด Drawer ส่องโค้ด → ชี้ให้ดูคะแนน Coupling",
    jumpFile: "flowcanvas",
    jumpLine: 45
  },
  {
    phase: "3",
    time: "5 นาที",
    badge: "07:00 - 12:00",
    title: "อธิบายโครงสร้างและ Flow ของโค้ด (Architecture)",
    roleFocus: "สถาปัตยกรรม 3 ส่วน, Pipeline Orchestrator & บทบาทคน 6",
    script: "ในส่วนโครงสร้างและ Flow ของโค้ด ระบบของเราออกแบบเป็น 3 ส่วนหลักตามหลัก Modular Architecture:\n\nส่วนที่ 1: Frontend (Client-side) — รับผิดชอบโดยคน 4 (page.tsx), คน 3 (FlowCanvas.tsx), และคน 5 (SideDrawer.tsx) คุม state และแสดงผลกราฟ\n\nส่วนที่ 2: API & Pipeline (Orchestrator) — รับผิดชอบโดยคน 6 (ผม/มะลิ) มี 2 ไฟล์หัวใจสำคัญ:\n- route.ts: เป็น API Boundary รับคำขอ POST /api/analyze, มี Guard ตรวจสอบ URL และจัดการ Error ปลอดภัย\n- pipeline.ts: เป็นผู้คุมคิว 6 จังหวะ (Orchestrator) ประสานงานเพื่อนทั้ง 5 คน:\n  • จังหวะ 1: โหลดโมดูล & ตรวจ In-Memory Cache (O(1))\n  • จังหวะ 2: Helper ประจำตัว resolveImportToFilePath & inferStructuralRelations เดาความสัมพันธ์อัตโนมัติ\n  • จังหวะ 3: ส่ง URL ให้ github.ts (คน 1) แกะ owner/repo\n  • จังหวะ 4: ดึง Trees API แบบ ?recursive=1 แล้วส่งให้ parser.ts (คน 2) กรองไฟล์และแยกเลเยอร์\n  • จังหวะ 5: สกัด Import และ Action triggers พร้อม fallback branch 'master' ถ้า main ตอบ 404\n  • จังหวะ 6: ส่งต่อให้ generator.ts (คน 3) คำนวณ Dagre layout และคืนค่า AnalysisResult\n\nส่วนที่ 3: Integration QA & Test Suite — คน 6 ออกแบบ Integration Test ครอบคลุม 6 ไฟล์ 98 เคสทดสอบ รันอัตโนมัติบน GitHub Actions CI/CD ทุกครั้งที่มีการ Push ครับ",
    keyPoints: [
      "อธิบายบทบาท Orchestrator: route.ts = Contract / pipeline.ts = Policy",
      "Integration-First & Defensive Coding: มี Fallback Guard ทุกจุด เพื่อนพังระบบก็ไม่ล่ม",
      "Branch Auto-Fallback: main 404 → ลอง master อัตโนมัติ",
      "QA Coverage: เทสต์ 6 ไฟล์ 98 เคส รันผ่าน CI ทุก commit"
    ],
    demoAction: "สลับไปโหมด 'เจาะสเต็ป' โชว์โค้ดคู่ขนานซ้าย-ขวา ระหว่าง pipeline.ts กับโมดูลเพื่อน",
    jumpFile: "pipeline",
    jumpLine: 261
  },
  {
    phase: "4",
    time: "3 นาที",
    badge: "12:00 - 15:00",
    title: "ตอบคำถามและข้อเสนอแนะ (Defense Q&A)",
    roleFocus: "ความแม่นยำในการตอบคำถามเชิงลึก, ข้อจำกัด และแนวทางขยายระบบ",
    script: "เข้าสู่ช่วงตอบคำถามครับ ซึ่งผมได้เตรียมคำตอบสำหรับประเด็นที่อาจารย์อาจสงสัยไว้เรียบร้อยแล้วครับ:\n\n1. ทำไมใช้ In-Memory Cache แทน Redis?\n→ ในเวอร์ชันส่งงาน รันบน single instance การใช้ JavaScript Map มี overhead เป็น 0 (O(1)) ไม่ต้องพึ่งพา infrastructure ภายนอก หากสเกลเป็น Multi-instance ในอนาคต จะเปลี่ยนเป็น Redis + TTL ตาม Roadmap P1 ครับ\n\n2. ทำไมแกะ import ด้วย Regex แทน AST Parser?\n→ เพราะระบบดึงโค้ดจาก GitHub CDN เป็น string ใน runtime ไม่มี compiler environment ของโปรเจกต์เป้าหมาย Regex จึงเบาและเร็วที่สุด พร้อมทั้งมี inferStructuralRelations มาช่วยเติมเต็มความสัมพันธ์ระดับโฟลเดอร์\n\n3. การรับมือ Rate Limit ของ GitHub API?\n→ รองรับการแนบ Personal Access Token ในหน้า UI (เพิ่มจาก 60 เป็น 5,000 req/hr) และคัดกรองดึงเฉพาะไฟล์จำเป็นไม่เกิน 45 ไฟล์ พร้อม timeout 4 วินาที\n\n4. แผนการพัฒนาต่อยอด (Future Work)?\n→ จัดลำดับ 5 ลำดับความสำคัญ: ผูกแคชกับ Commit SHA, เปลี่ยนงานใหญ่เป็น Async Background Job, ยกระดับ Parser ด้วย Web-tree-sitter (WASM), และระบบ Full-edit commit กลับ GitHub ครับ",
    keyPoints: [
      "ตอบอย่างมั่นใจด้วยหลักวิศวกรรมซอฟต์แวร์ (Trade-off Analysis)",
      "ยอมรับข้อจำกัดของระบบปัจจุบันอย่างโปร่งใส พร้อมเสนอ Solution ใน Roadmap",
      "ชี้ให้เห็นว่าระบบมี Seam และแยกโมดูลอย่างเป็นอิสระ (Decoupled Architecture)"
    ],
    demoAction: "เปิดแท็บ 'ซ้อม' หรือ 'ระบบ' โชว์ Red Team Insights และคำตอบเจาะลึก 5 มิติ",
    jumpFile: "route",
    jumpLine: 9
  }
];

const DEFENSE_DEEP = [
  {
    id: "scope", cat: "การแบ่งงาน", q: "ทำไมคนที่ 6 ได้แค่ 2 ไฟล์ แต่เป็นคนถือทั้งระบบ?",
    short: "เพราะ 2 ไฟล์นั้นคือ 'สัญญาระหว่างทีม' — จุดที่ของคนอื่นเข้ามาและออกไป",
    deep: "route.ts คือ boundary ที่รับอินพุตจากฝั่ง UI และแปลงเป็นผลลัพธ์กลับ ส่วน pipeline.ts คือ orchestrator ที่กำหนดลำดับว่าใครทำอะไรก่อนหลัง ถ้าแยกย้อยกลับไป ทุกคนต้องตัดสินใจเรื่อง cache, error message และรูปแบบผลลัพธ์เอง → จะได้ของไม่ตรงกัน",
    bullets: [
      "route.ts ตัดสินเรื่อง protocol (400/200/500) — ไม่มีใครอื่นยุ่ง",
      "pipeline.ts ตัดสินเรื่อง policy (แคช, ลำดับ, fallback, เวลา) — คนอื่นทำแค่ pure function",
      "ทุกโมดูลของเพื่อนเป็นฟังก์ชันบริสุทธิ์: รับเข้า string/object → คืน object ไม่มีผลข้างเคียง ทดสอบง่าย",
      "ถ้าเปลี่ยนวิธีเก็บ cache ทั้งระบบ แก้ที่ pipeline จุดเดียว"
    ],
    libs: [{ name: "ไม่ต้องเพิ่มไลบรารี", why: "contract ควรเป็น TypeScript interface ใน types/index.ts ไม่ใช่ zod schema หรือ protobuf เพราะทีม 6 คนและงานจบใน 1 เทอม", trade: "ถ้าต่อยอดเป็นไมโครเซอร์วิสจริง ๆ ค่อยใส่ zod ที่ route" }],
    extend: ["แยก pipeline.ts เป็น pipeline/ subfolder เมื่อเกิน 800 บรรทัด", "ทำ pipeline เป็น plugin chain: registerStep(fn) แทนการเรียกตรง ๆ"]
  },
  {
    id: "apiroute", cat: "ความปลอดภัย", q: "ทำไมหน้าเว็บต้องยิงผ่าน /api/analyze ไม่ยิง GitHub ตรงจาก browser?",
    short: "เพราะ PAT ของผู้ใช้ต้องไม่เดินทางผ่าน client และเราต้องคุม rate limit ได้",
    deep: "ถ้ายิงจาก browser ตรง ๆ: token จะอยู่ใน client ทุกครั้ง (เสี่ยงหลุดจาก devtools, history, log) และเราคุมจำนวน request ไม่ได้เลย การมี route เป็นตัวกลางทำให้ตรวจ input, จำกัดขนาด, cache ผล และซ่อนรายละเอียดของ API key ได้",
    bullets: [
      "route.ts:12-13 อ่าน body → :16-21 ตรวจ url ว่าง → :24 เรียก pipeline → :27 ตอบ 200 → :28-36 จับ error เป็น 500",
      "token อยู่ฝั่ง server เท่านั้น ไม่ถูกส่งต่อไปยัง client",
      "ข้อความ error ที่ตอบกลับถูกเขียนให้ผู้ใช้แก้ได้จริง ไม่ใช่ stack trace",
      "ถ้าจะทำ production จริงต้องเพิ่ม: rate limit ต่อ IP, ตรวจ Origin, ล็อก audit token ที่ใช้"
    ],
    libs: [
      { name: "@octokit/rest", why: "ถ้าต่อยอดจะเรียก GitHub หลาย endpoint ใช้ตัวนี้แทน fetch เอง มี rate limit helper ให้", trade: "เพิ่ม dependency ~50KB และผูกกับ GitHub เท่านั้น — ถ้าจะรองรับ GitLab ต้องมี strategy แยก" },
      { name: "zod", why: "validate body ที่ route แทน if เดียว ป้องกันชนิดข้อมูลผิด", trade: "เพิ่มโค้ดซ้ำสำหรับ payload 2 ฟิลด์" }
    ],
    extend: ["เพิ่ม /api/analyze/status/:jobId สำหรับงานที่ยาวเกิน 3 วินาที", "เพิ่ม Content-Security-Policy + rate limit แบบ token bucket"]
  },
  {
    id: "fallback", cat: "การตัดสินใจ", q: "ทำไมมีโค้ดสำรองซ้ำ ๆ ทั้งที่คน 1/2 ก็เขียนฟังก์ชันเหมือนกัน?",
    short: "เพื่อให้ระบบรันได้ในวันที่เพื่อนยังไม่ส่งงาน และกัน pipeline ตายเมื่อโมดูลคนอื่น throw",
    deep: "เป็นการเขียนแบบ integration-first: ทุกจุดที่เรียกโมดูลคนอื่นมี try/catch + ค่า fallback เช่น pipeline:422-432 แกะ URL เองถ้า parseGitHubUrl ล้ม, pipeline:467-478 กรองเองถ้า filterTreeFiles ล้ม, pipeline:482-490 จำแนกชนิดไฟล์เองถ้า detectNextFileType ล้ม ข้อดีคือ demo ได้วันแรกและไม่มี single point of failure ข้อเสียคือโค้ดซ้ำและอาจได้ผลลัพธ์ไม่เหมือนกัน",
    bullets: [
      "pipeline:423 เรียก parseGitHubUrl → ถ้าพังใช้การตัดสตริงเองที่ :281-290",
      "pipeline:468 เรียก filterTreeFiles → ถ้าพังกรองเองที่ :369-376",
      "pipeline:483 เรียก detectNextFileType → ถ้าพังเดาจากชื่อไฟล์ที่ :384-391",
      "ทุกจุดมีคอมเมนต์บอกว่าเป็น 'สำรองระหว่างรอ' ของใคร"
    ],
    libs: [{ name: "Vitest spy / vi.mock", why: "ทดสอบว่า fallback ทำงานจริง โดย mock ให้ฟังก์ชันของเพื่อน throw", trade: "ต้องมี seam (dependency injection หรือ import ตรง ๆ) ถ้า mock ไม่ได้แปลว่าโค้ดผูกกันแน่นเกิน" }],
    extend: ["ย้าย fallback ไปเป็น registry เดียวแล้วเลือกได้ว่าใช้ของจริงหรือของสำรอง", "ทำ feature flag ให้เปิด/ปิด fallback ได้ตอน runtime"]
  },
  {
    id: "cache", cat: "ประสิทธิภาพ", q: "ทำไมใช้ cache เป็น Map ในหน่วยความจำ ไม่ใช้ Redis?",
    short: "เพราะ deployment นี้รัน instance เดียว ใช้ Map ได้ผลทันทีและไม่ต้องมี dependency ภายนอก",
    deep: "pipeline:23 ประกาศ pipelineCache เป็น Map<string, AnalysisResult> ตรวจที่ :301 และบันทึกที่ :554 ทุกครั้ง ข้อดีคือ O(1) และไม่มี network hop ข้อเสียที่ต้องยอมรับ: หายเมื่อ process restart, แยกข้อมูลไม่ได้หลาย instance, ไม่มี TTL และโตไม่จำกัด (คนยิง URL แปลง ๆ ได้จนกิน RAM) ถ้าจะต่อยอดจริงต้องมีทั้ง LRU + TTL และย้ายไป Redis เมื่อมีหลาย instance",
    bullets: [
      "คีย์คือ URL ที่ผู้ใช้กรอก ไม่ใช่ SHA ของโค้ด → ถ้าคลังอัปเดต ผลเก่าจะค้าง จึงควรมี TTL",
      "isCached: true บอก UI ว่าเป็นผลจากแคช ไม่ใช่การวิเคราะห์ใหม่",
      "clearPipelineCache() ที่ :16 มีไว้ให้เทสต์รีเซ็ตสถานะระหว่างเคส"
    ],
    libs: [
      { name: "ioredis + cache-manager", why: "cache ข้าม instance + TTL + LRU ได้", trade: "ต้องมี infra เพิ่ม (Redis) และเพิ่ม latency ~1-5ms ต่อครั้ง" },
      { name: "lru-cache", why: "ถ้ายังไม่มี Redis แต่อยากจำกัดหน่วยความจำใน instance เดียว", trade: "ยังแก้ข้อจำกัดเรื่อง multi-instance ไม่ได้" }
    ],
    extend: ["คีย์เป็น owner/repo/branch + commit SHA เพื่อแคชตามเวอร์ชันจริง", "ใส่ TTL 15 นาทีและสุ่มมากไป 20% เพื่อกัน cache stampede"]
  },
  {
    id: "limits", cat: "ประสิทธิภาพ", q: "ตัวเลข 45 ไฟล์ / timeout 4 วินาที / จำกัด 500 ไฟล์ มาจากไหน?",
    short: "มาจากสมดุลระหว่างความครบถ้วนกับเวลาตอบกลับที่ยอมรับได้ ไม่ใช่ตัวเลขสุ่ม",
    deep: "ดึงโค้ดดิบคือขั้นที่แพงที่สุด เพราะแต่ละไฟล์คือ 1 HTTP request ไป raw.githubusercontent.com การยิงครั้งละ 45 ไฟล์ด้วย Promise.all ใช้เวลาประมาณ 2-4 วินาทีบนเน็ตปกติ ถ้าเกิน 500 ไฟล์กราฟจะใหญ่จนอ่านไม่ออกและเวลาเรนเดอร์ของคน 4 จะหนัก เกณฑ์เหล่านี้ควรเป็น config ไม่ใช่ตัวเลขฝังในโค้ด",
    bullets: [
      "pipeline:493 เลือกเฉพาะไฟล์ซอร์สโค้ด → :411 ตัดที่ 45 → :419 AbortController 4 วินาที → :430 กันพังรายไฟล์",
      "filterTreeFiles ถูกส่ง maxLimit = 500 ที่ pipeline:468",
      "code-viewer.ts:62 ตัดโค้ดที่แสดงผลไว้ 300 บรรทัด เพื่อคุมขนาด DOM",
      "executionTimeMs ที่ pipeline:564 ใช้วัดจริงว่าช้าตรงไหน"
    ],
    libs: [{ name: "p-limit / Bottleneck", why: "จำกัดจำนวน request พร้อมกันแทน Promise.all เต็มพลัง ลดโอกาสโดน rate limit", trade: "ช้าลงเล็กน้อยแต่เสถียรกว่า" }],
    extend: ["ย้ายค่าทั้งหมดเป็น config แล้วให้ผู้ใช้ปรับผ่านตัวเลือกใน UI", "ดึงโค้ดแบบ on-demand ตอนคลิก node แทนดึงล่วงหน้า 45 ไฟล์"]
  },
  {
    id: "regex", cat: "คุณภาพโค้ด", q: "ทำไมแกะ import ด้วย regex ไม่ใช้ AST parser?",
    short: "เพราะเราต้องแกะโค้ดของคนอื่นที่รันมาแบบ runtime ซึ่งไม่มีไฟล์บนดิสก์ให้ compiler อ่าน",
    deep: "ถ้ามีไฟล์จริงบนเครื่อง เราจะใช้ TypeScript compiler API หรือ SWC ได้ แต่ GitFlow ดึงโค้ดเป็นสตริงจาก raw CDN ไม่ได้มี module resolution ของโปรเจกต์นั้นมา การใช้ regex จึงเป็นทางเลือกที่รันได้ทุกที่ไม่ต้องมี bundler ข้อเสียที่ต้องรู้คือมันพลาดกรณีซับซ้อน: dynamic import, require แบบ CommonJS, multiline ซับซ้อน และโค้ดที่ถูกสร้างด้วย template literal ทางแก้คือจำกัดขอบเขตให้ชัด (เก็บแค่ import ที่ขึ้นต้นด้วย ./ ../ @/ ~ ตาม parser:213) และมีเส้นสำรอง inferStructuralRelations เติมส่วนที่ regex หาไม่เจอ",
    bullets: [
      "parser:200 String Guard คืน [] ทันทีถ้าไม่มีคำว่า import ประหยัดเวลา",
      "parser:204 ตัดคอมเมนต์ออกก่อน ไม่งั้นจะจับ import ในคอมเมนต์",
      "parser:207 regex รองรับทั้ง import x from และ import type",
      "parser:214 ใช้ seenTargets กัน import ซ้ำ",
      "ทั้งหมดนี้มีเทสต์ครอบใน 2_parser.test.ts (177 บรรทัด)"
    ],
    libs: [
      { name: "web-tree-sitter (WASM)", why: "parse AST จริงใน runtime ได้แม้ไม่มีไฟล์ .ts เพราะใช้ grammar ที่ compile เป็น WASM", trade: "เพิ่ม ~1MB wasm + โหลดช้ากว่า regex หลายเท่า และต้องเลือก grammar ให้ถูกภาษา" },
      { name: "@typescript-eslint/typescript-estree", why: "ได้ AST คุณภาพสูงสุด", trade: "หนักเกินไปสำหรับงานที่ต้องรันบน serverless ทุกคำขอ และต้องมี node_modules ของโปรเจกต์เป้าหมาย" }
    ],
    extend: ["เพิ่มการจับ dynamic import() และ require()", "ถ้าคลังใหญ่เกิน 300 ไฟล์ ให้ย้ายการ parse ไป Web Worker เพื่อไม่บล็อก event loop"]
  },
  {
    id: "security", cat: "ความปลอดภัย", q: "มีจุดเสี่ยงด้านความปลอดภัยอะไรบ้าง แล้วกันไว้ตรงไหน?",
    short: "4 จุดหลัก: token, SSRF จาก URL, XSS จากการแสดงโค้ด, และการไม่จำกัดอัตราการเรียก",
    deep: "ระบบรับ URL จากผู้ใช้แล้วไปยิงต่อ จึงต้องระวังการใช้ URL เป็นช่องทางออกนอกระบบ (SSRF) รวมถึงการแสดงโค้ดของคนอื่นในหน้าเว็บต้อง escape เสมอ สิ่งที่ทำไปแล้วคือ pipeline:434-436 บล็อก URL ที่แกะไม่ได้, route.ts:16-21 ตรวจ body, github.ts ตรวจโดเมนเป็น github.com เท่านั้น และไม่ส่ง token กลับมาที่ client ส่วนที่ยังควรเพิ่มคือ rate limit, ตรวจ redirect ของ raw CDN และห้าม path ที่ขึ้นต้นด้วย ..",
    bullets: [
      "github.ts:25 parseGitHubUrl ทำหน้าที่เป็น allowlist ของโดเมน — ขวัญคือจุดแรกที่ต้องเข้ม",
      "pipeline:425-431 โค้ดสำรองตัดสตริงจาก URL ต้องระวังไม่ให้กลายเป็นช่องเปิดกว้างเกินไป",
      "หน้าเว็บแสดงโค้ดที่ดึงมาจากคลังคนอื่น → ต้อง escape HTML ก่อน render เสมอ",
      "โครงการนี้เป็นเครื่องมือช่วยอ่านโค้ด ไม่ใช่ระบบที่รับไฟล์อัปโหลด → พื้นที่การรันโค้ดของคนอื่นจึงไม่มี"
    ],
    libs: [
      { name: "DOMPurify", why: "sanitize HTML ที่มาจากโค้ดของคนอื่นก่อนแสดง", trade: "เพิ่ม dependency และถ้า escape ถูกที่แล้วอาจไม่จำเป็น" },
      { name: "upstash/ratelimit", why: "rate limit แบบ distributed เหมาะกับ serverless", trade: "ต้องมี Redis ผูกไว้กับ deploy" }
    ],
    extend: ["เพิ่ม allowlist owner สำหรับคลังสาธารณะที่อนุญาต", "บันทึก audit log ว่าใครใช้ token อะไรเมื่อไร"]
  },
  {
    id: "testing", cat: "คุณภาพโค้ด", q: "มีเทสต์ 4 ไฟล์ ครอบอะไรบ้าง และพอสำหรับงานระดับนี้ไหม?",
    short: "ครอบหน่วยของทุกโมดูลฝั่ง logic (คน 1-4) รวม 51 เคส และรันอัตโนมัติบน CI",
    deep: "โครงสร้างเทสต์บอกเจตนาชัด: github.test.ts (79) ทดสอบการแกะ URL รวมชื่อ branch และการปฏิเสธ hostname ปลอม, parser.test.ts (193) ทดสอบการกรองไฟล์และการจำแนกเลเยอร์ 9 บทบาท, generator.test.ts (106) ทดสอบ node/edge/สี/Mermaid, ui-helper.test.ts (98) ทดสอบด่านตรวจ URL สถิติ เกรด และระบบแชร์ลิงก์ รวม 51 เคส และรันด้วย npm test บน CI ทุกครั้งที่ push/PR ข้อเสียที่ยอมรับได้คือยังไม่มี e2e จริง และ route.ts เอง (37 บรรทัด) ยังไม่มีเทสต์ตรง",
    bullets: [
      "ใช้ Vitest ตาม scripts ใน package.json (npm test = vitest run)",
      "เทสต์ฝั่ง UI ทดสอบฟังก์ชันล้วน ไม่ต้องมี DOM จริง เพราะ logic ถูกแยกไว้ใน ui-helper.ts",
      "เทสต์ integration ใช้ mockTreeData และ mockFilesContent ที่ pipeline:415-416 รับเข้ามา",
      "beforeEach/afterEach มีการคืน mocks เพื่อไม่ให้เคสรั่วกัน"
    ],
    libs: [{ name: "Playwright", why: "เติม e2e จริง: กรอก URL → เห็นกราฟ → คลิก node → เห็นโค้ด", trade: "ต้องมี browser ใน CI ช้ากว่า unit test หลายเท่า" }, { name: "MSW", why: "mock network ระดับ request แทนการ stub fetch", trade: "เพิ่มความซับซ้อนในการตั้งค่า" }],
    extend: ["เพิ่มเทสต์ของ route.ts โดยเรียก POST handler โดยตรง", "เพิ่ม coverage threshold ใน vitest config ให้ pipeline.ts ไม่ต่ำกว่า 80%"]
  },
  {
    id: "libs", cat: "ไลบรารี", q: "ทำไมเลือกไลบรารีชุดนี้ และถ้าเปลี่ยนจะเลือกอะไร?",
    short: "เลือกของที่ติดตั้งจริงใน package.json และอธิบายข้อแลกเปลี่ยนได้ทุกตัว",
    deep: "ระบบใช้ @xyflow/react วาดกราฟแบบ interactive, @dagrejs/dagre จัดพิกัดแบบลำดับชั้น, mermaid สร้างข้อความกราฟสำหรับส่งออก, prismjs ไฮไลต์โค้ดใน drawer, lucide-react ไอคอน, Tailwind v4 สำหรับสไตล์ และ Vitest สำหรับเทสต์ แต่ละตัวถูกเลือกเพราะทำงานบน client ได้และไม่ต้องมี backend เพิ่ม จุดที่ควรรู้คือ React Flow ใหญ่และถ้ากราฟไม่ต้อง interactive เราอาจใช้ mermaid อย่างเดียวแทนทั้งระบบ",
    bullets: [
      "กราฟ: @xyflow/react (ใช้แล้ว) — ทางเลือก elkjs เมื่อกราฟใหญ่กว่า 300 node",
      "ไฮไลต์โค้ด: prismjs (ใช้แล้ว) — ทางเลือก shiki คุณภาพสูงกว่าแต่ช้ากว่าและหนักกว่า",
      "ตัวแก้โค้ดแบบเต็ม: ปัจจุบันใช้ code-viewer.ts ตัด 300 บรรทัด — ถ้าต้องการแก้โค้ดจริงควรใช้ Monaco",
      "state ฝั่ง client: ปัจจุบันใช้ useState ธรรมดา พอสเกลขึ้นค่อยใช้ zustand",
      "ข้อมูลจาก server: ปัจจุบัน fetch ตรงใน handleSubmit — ถ้ามีหลายหน้าจอค่อยใช้ TanStack Query เพื่อแคชและ retry"
    ],
    libs: [
      { name: "monaco-editor", why: "ต้องแก้โค้ดในตัวเว็บจริง ๆ", trade: "หนักหลาย MB ต้องโหลดแบบ lazy" },
      { name: "zustand", why: "แยก state ของกราฟออกจาก component ไม่ต้องส่ง props ลึก ๆ", trade: "เพิ่มแนวคิด store ในโปรเจกต์ที่ใช้แค่ useState ก็ยังทำได้" },
      { name: "@tanstack/react-query", why: "แคชฝั่ง client, retry, และ stale time ให้ตรงกับ pipeline cache", trade: "ต้องออกแบบ cache key ให้ดี ไม่งั้นจะได้ผลซ้ำซ้อนกับแคชฝั่ง server" }
    ],
    extend: ["ถ้าต้องการแก้โค้ดในระบบจริง: ย้าย raw CDN fetch ไปฝั่ง server proxy แล้วเปิดให้เขียนผ่าน GitHub API", "แยกชุดไลบรารี client กับ server ใน bundle เพื่อลดขนาด"]
  },
  {
    id: "scale", cat: "การต่อยอด", q: "ถ้าให้ระบบดีขึ้นอีก ผมจะเพิ่มอะไรตรงไหนก่อน?",
    short: "5 อันดับ: แคช → งาน async → ความแม่นของการแกะโค้ด → rate limit → ประสิทธิภาพหน้าจอ",
    deep: "ลำดับนี้มาจากผลตอบแทนต่อความเสี่ยง ไม่ใช่ความยาก เพราะแคชคือบรรทัดเดียวที่เปลี่ยนประสิทธิภาพได้มากที่สุดในงานสั้น ๆ ส่วนการแกะโค้ดให้แม่นขึ้นคืองานใหญ่ที่สุดแต่ค่อยเป็นค่อยไป",
    bullets: [
      "อันดับ 1: เพิ่ม TTL + LRU ให้แคชที่ pipeline:23 แล้วผูกกับ SHA ของ commit",
      "อันดับ 2: ถ้าคลังใหญ่เกิน ~3 วินาที เปลี่ยนเป็น background job แล้วให้ client poll สถานะ",
      "อันดับ 3: ย้ายการแกะ import จาก regex ไปเป็น AST (web-tree-sitter) เพิ่มความแม่น",
      "อันดับ 4: เพิ่ม rate limit ต่อ IP ที่ route.ts และล็อก audit log",
      "อันดับ 5: ใช้ ELK เมื่อกราฟใหญ่ และ virtualized list เมื่อไฟล์ยาวมาก"
    ],
    libs: [{ name: "BullMQ / Trigger.dev", why: "ทำคิวงานแบบ background แล้ว poll สถานะได้", trade: "ต้องมี Redis และเพิ่มโครงสร้างงานควบคุม" }],
    extend: ["แสดง progress ระหว่างรัน (ดึงไฟล์กี่ไฟล์แล้ว)", "เพิ่มโหมดเปรียบเทียบก่อน-หลังปรับปรุง"]
  },
  {
    id: "demo", cat: "การนำเสนอ", q: "ถ้าอาจารย์ถามว่าจะแก้อะไรเพิ่มในสิ้นเทอม แล้วทำไมไม่ทำเลย?",
    short: "เพราะขอบเขตที่ส่งต้องไม่เสี่ยง แต่แนวทางต่อยอดต้องพูดออกมาให้ชัด",
    deep: "การส่งงานให้เสร็จและตรงตามขอบเขตคือหน้าที่ การเพิ่มของใหม่ที่ไม่มีใครขอคือความเสี่ยงที่ทำให้ของเดิมพัง ผมจึงแยกเป็นสองระดับ: ของที่ทำเสร็จแล้วคือ pipeline ที่ครบ 6 สเต็ปพร้อม cache/fallback/เวลา, route ที่มี guard ครบ และเทสต์ครบ 6 ไฟล์ ส่วนของที่เสนอให้ทำต่อคือรายการด้านบนซึ่งจัดลำดับไว้พร้อมเหตุผลและต้นทุน การบอกว่า 'ผมรู้ว่าต้องปรับตรงไหน เพราะอะไร และจะเสียอะไรถ้าทำ' สื่อความเข้าใจระบบได้ดีกว่าการทำเพิ่มแล้วพัง",
    bullets: [
      "รู้จุดที่อ่อนของงานตัวเองแล้วบอกตรง ๆ ได้ — เช่น pipeline.ts ยาว 561 บรรทัดและมี fallback ซ้ำ",
      "ทุกข้อเสนอผูกกับไฟล์และบรรทัดจริง ไม่พูดกว้าง ๆ",
      "แยกชัดว่าอันไหนควรทำต่อทันที อันไหนต้องรอเทอมหน้า"
    ],
    libs: [{ name: "ไม่มี", why: "คำถามนี้วัดการตัดสินใจ ไม่ใช่ความรู้ไลบรารี", trade: "-" }],
    extend: ["ทำ PR ย่อย ๆ ที่รีวิวได้จริง แทนการเปลี่ยนทีเดียวหลายร้อยบรรทัด"]
  }
];

// ---------- แผนต่อยอด 5 เฟส ----------
const ROADMAP = [
  { phase: "P0", title: "ทำให้ผลลัพธ์ถูกต้องขึ้น", effort: "1 วัน", impact: "สูง", why: "แคชผูกกับ commit SHA + TTL และย้ายตัวเลข 45/500/4s ไปเป็น config", risk: "ต่ำ — แก้ใน pipeline.ts จุดเดียว", items: ["คีย์แคชเป็น owner/repo/branch+sha", "เพิ่ม TTL 15 นาทีและจำกัดขนาดแคช", "ย้ายเกณฑ์ทั้งหมดไป config.ts", "คืนค่า isCached พร้อมเวลาที่แคชเก่า"] },
  { phase: "P1", title: "ทนทานขึ้น", effort: "1-2 วัน", impact: "สูง", why: "งานใหญ่เกิน 3 วินาทีจะทำให้ serverless timeout", risk: "กลาง — ต้องมีที่เก็บสถานะงาน", items: ["แยกเป็น background job + endpoint สถานะ", "แสดง progress ใน UI", "ย้ายแคชไป Redis เมื่อมีหลาย instance", "เพิ่ม rate limit ต่อ IP"] },
  { phase: "P2", title: "แกะโค้ดแม่นขึ้น", effort: "3-5 วัน", impact: "สูง", why: "regex พลาด dynamic import และ require", risk: "กลาง — เปลี่ยนผลลัพธ์ของชั้น 4", items: ["เพิ่มการจับ dynamic import() และ require()", "ย้าย parse ไป Web Worker เมื่อไฟล์เกิน 300", "เทียบผลลัพธ์กับเทสต์ชุดเดิมทุกครั้งที่เปลี่ยน", "รองรับ tsconfig paths"] },
  { phase: "P3", title: "กราฟใช้งานจริง", effort: "2-3 วัน", impact: "กลาง", why: "กราฟใหญ่ทั้งจอทำให้อ่านยาก", risk: "ต่ำ", items: ["สลับจาก Dagre เป็น ELK เมื่อเกิน 300 node", "กรองเฉพาะ page/action/middleware ก่อน", "เพิ่มโหมดส่งออก PNG/SVG", "ทำ deep-link ราย node"] },
  { phase: "P4", title: "เปิดให้แก้โค้ดได้", effort: "1 สัปดาห์", impact: "สูง", why: "จาก 'อ่าน' ไปสู่ 'แก้' ต้องมี write path ที่ปลอดภัย", risk: "สูง — เกี่ยวกับสิทธิ์เขียน repo", items: ["proxy การดึงโค้ดไปฝั่ง server", "สร้าง branch + commit ผ่าน GitHub API", "แสดง diff ก่อนยืนยันทุกครั้ง", "จำกัดสิทธิ์เฉพาะ repo ที่ผู้ใช้เปิดเครื่องหมายอนุญาต"] }
];

// ---------- คำถามที่อาจารย์อาจถามเรื่องตัวพอร์ทัลนี้ ----------
const PORTAL_QA = [
  { q: "ทำไมถึงต้องแยก data-code.js / data-content.js / data-arch.js / app.js?", a: "แยกข้อมูลออกจาก logic ข้อมูลใหญ่โตช้าและแก้บ่อย ส่วน logic เล็กและต้องไม่พัง เมื่อแยกแล้วแก้เนื้อหาสอนได้โดยไม่แตะ render และต้องโหลดตามลำดับ เพราะ data-content อ้าง RAW_* ที่อยู่ใน data-code" },
  { q: "ทำไม FILE_META ถึงสร้างแบบ lazy?", a: "ถ้าประกาศ const FILE_META = [...] ที่ระดับไฟล์ มันจะพยายามอ่าน RAW_PARSER ตอนที่ data-content.js ยังไม่ได้โหลด จะได้ ReferenceError: RAW_PARSER is not defined การย้ายเข้าไปในฟังก์ชันแล้วเรียกจาก init จึงต้องรอให้ data-code.js โหลดเสร็จ" },
  { q: "ไฮไลต์โค้ดทำงานยังไง ไม่ใช่ repaint ทั้งไฟล์หรอ?", a: "ใช้ classList เฉพาะแถวที่อยู่ในช่วง โดยเลือกแถวด้วย querySelectorAll ที่ id ขึ้นต้นด้วย fileKey แล้วเติมคลาส ส่วนการหรี่แถวอื่นใช้คลาส has-highlight ที่ตัว scroll container แค่ 1 กฎ CSS ดังนั้นพยายามหลีกเลี่ยงการเขียน style ซ้ำ ๆ เป็นรายแถว" },
  { q: "ทำไมบรรทัดที่กดถึงอยู่บนสุดของ pane เสมอ?", a: "เพราะตัวอ่านบรรทัดเป็นการ์ดลอยที่คร่อมพื้นที่ด้านล่าง ถ้าไม่เลื่อนบรรทัดเป้าหมายขึ้นมา ผู้ใช้จะเห็นแต่การ์ดแล้วไม่เห็นโค้ดจริงที่เพิ่งคลิก การวัดระยะใช้ getBoundingClientRect หัก scrollTop เพราะ offsetTop อาจอ้างคนละ offsetParent" },
  { q: "กราฟความสัมพันธ์ 251 เส้น คำนวณยังไงไม่ช้า?", a: "ทำครั้งเดียวตอนโหลดหน้า สองรอบ: รอบแรกเก็บชื่อ export ทั้งหมด 46 ตัว รอบสองค่อยไล่ทีละบรรทัด และใช้ text.includes() กรองก่อนค่อยใช้ regex ทำให้แพงแค่บรรทัดที่เป็นไปได้ หลังจากนั้นทุกครั้งที่คลิกคือการไล่ array ขนาดคงที่" },
  { q: "ถ้า CDN ของ Tailwind ตก หน้าเว็บพังไหม?", a: "ไม่ เพราะ layout หลักทั้งหมดเขียนไว้ใน style.css เอง ส่วน Tailwind เป็นแค่ utilities เสริม ถ้าอยากให้สมบูรณ์แบบต้อง build Tailwind ตอน deploy" }
];
