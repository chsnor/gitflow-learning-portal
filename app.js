// ============================================================
// app.js — Render & Interaction Layer v3
// โค้ดจริง (RAW_*) อยู่ใน data-code.js · ข้อมูลสอนอยู่ใน data-content.js
// ============================================================

// ============================================================
// app.js — Render & Interaction Layer v3 (รื้อใหม่ทั้งชุด)
// ข้อมูลโค้ดจริง (RAW_*) อยู่ด้านบน · ข้อมูลสอนอยู่ใน data-content.js
// ============================================================

// Helper: Escape HTML
function esc(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Lightweight TypeScript Syntax Tokenizer
function highlightTS(code) {
  if (!code) return "";
  const tokenRegex = /(\/\/[^\n]*)|("(?:\.|[^"\])*"|'(?:\.|[^'\])*'|`(?:\.|[^`\])*`)|(\/(?!\/)(?:\/|[^\/\n])+\/[gimsuy]*)|(\b(?:import|from|export|default|const|let|var|function|async|await|return|if|else|try|catch|throw|new|typeof|void|as|interface|type)\b)|(\b(?:string|number|boolean|any|null|undefined|Map|Promise|Record|AnalysisResult|GitHubTreeItem|CodeRelation|NextFileType|FlowNodeItem|FlowEdgeItem|ParsedGitHubUrl)\b)|(\b(?:console|performance|fetch|JSON|Math|Error)\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\())|(\b\d+\b)/g;
  let lastIndex = 0;
  let html = "";
  let match;
  while ((match = tokenRegex.exec(code)) !== null) {
    if (match.index > lastIndex) html += esc(code.slice(lastIndex, match.index));
    if (match[1]) html += `<span class="tok-comment">${esc(match[1])}</span>`;
    else if (match[2]) html += `<span class="tok-string">${esc(match[2])}</span>`;
    else if (match[3]) html += `<span class="tok-regex">${esc(match[3])}</span>`;
    else if (match[4]) html += `<span class="tok-keyword">${esc(match[4])}</span>`;
    else if (match[5]) html += `<span class="tok-type">${esc(match[5])}</span>`;
    else if (match[6]) html += `<span class="tok-builtin">${esc(match[6])}</span>`;
    else if (match[7]) html += `<span class="tok-fn">${esc(match[7])}</span>`;
    else if (match[8]) html += `<span class="tok-number">${esc(match[8])}</span>`;
    lastIndex = tokenRegex.lastIndex;
  }
  if (lastIndex < code.length) html += esc(code.slice(lastIndex));
  return html;
}

// ===== State (เจ้าของเดียวของสถานะ UI) =====
let currentStepIndex = 0;        // 0-5
let currentMainView = "blocks";  // section ที่กำลังแสดง: blocks | summary | sim | cicd | redteam | arch | deep | quiz
let currentMode = "blocks";      // โหมดหลัก: blocks | sim | system | drill
let currentLeftTab = "pipeline";
let currentRightTab = "github";
let currentMobilePane = "pipeline";
let focusedPane = "left";        // ฝั่งที่แผลข้างขวาจะอธิบาย
let fileQuery = "";              // คำค้นในรายการไฟล์
let pinnedLine = null;    // { file, line } — บรรทัดที่ผู้ใช้กดปักหมุดไว้ (ครอบคลุมทั้ง 19 ไฟล์)
let relExpanded = false;  // ขยายดูไฟล์ที่เกี่ยวข้องชั้นที่ 2 หรือไม่
const openRelKeys = new Set(); // การ์ดความสัมพันธ์ที่ผู้ใช้กดขยายดูโค้ด

// ===== กราฟความสัมพันธ์ 19 ไฟล์ — คำนวณจากโค้ดจริง (import / path / การเรียกฟังก์ชันข้ามไฟล์) =====
let FILE_GRAPH = null;
const REL_KIND = { import: "import", call: "เรียกฟังก์ชัน", path: "อ้าง path" };

function metaPath(meta) {
  return String(meta.bc || "").replace(/<[^>]*>/g, "").split("/").map((s) => s.trim()).filter(Boolean).join("/");
}

// แปลง import specifier (เช่น "../../lib/pipeline" หรือ "@/types") ให้เป็น path ในโปรเจกต์
function specifierToKeys(spec, fromPath, byPath) {
  let base = null;
  if (spec.startsWith("@/") || spec.startsWith("~/")) base = "src/" + spec.slice(2);
  else if (spec.startsWith(".")) {
    const parts = fromPath.split("/").slice(0, -1);
    spec.split("/").forEach((seg) => {
      if (seg === "." || seg === "") return;
      if (seg === "..") parts.pop(); else parts.push(seg);
    });
    base = parts.join("/");
  } else return [];

  const noExt = base.replace(/\.(tsx?|jsx?|mjs|cjs|json)$/, "");
  const cands = [base, noExt, `${base}/index`, `${noExt}/index`, `${noExt}/index.ts`, `${noExt}/index.tsx`];
  const keys = [];
  cands.forEach((c) => {
    const k = byPath[c.toLowerCase()];
    if (k && !keys.includes(k)) keys.push(k);
  });
  return keys;
}

function buildFileGraph() {
  const pathOf = {};
  const byPath = {};
  FILE_META.forEach((m) => {
    const p = metaPath(m);
    pathOf[m.key] = p;
    const low = p.toLowerCase();
    byPath[low] = m.key;
    byPath[low.replace(/\.(tsx?|jsx?|css)$/, "")] = m.key;
    byPath[low.replace(/\/index\.(tsx?|jsx?)$/, "")] = m.key;
  });

  // ชั้นที่ 1: เก็บชื่อที่ export ของแต่ละไฟล์ เพื่อหา "การเรียกข้ามไฟล์"
  const symbols = [];
  FILE_META.forEach((m) => {
    if (!/\.(tsx?|jsx?)$/.test(pathOf[m.key])) return;
    m.raw.split("\n").forEach((text, i) => {
      const hit = /^\s*export\s+(?:default\s+)?(?:async\s+)?(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/.exec(text);
      if (hit) symbols.push({ name: hit[1], key: m.key, defLine: i + 1 });
    });
  });

  // ชั้นที่ 2: สแกนทีละบรรทัดของทุกไฟล์ หา 3 ชนิดความสัมพันธ์
  const edges = [];
  const seen = new Set();
  const byPairLine = new Map();
  const KIND_PRIORITY = { import: 3, call: 2, path: 1 };
  // line = บรรทัดในไฟล์ต้นทาง (ที่เรียก/ที่ import) · targetLine = บรรทัดในไฟล์ปลายทาง (null = ทั้งไฟล์)
  const addEdge = (from, to, line, kind, targetLine) => {
    if (from === to) return;
    const pair = `${from}>${to}:${line}`;
    const exist = byPairLine.get(pair);
    if (exist) {
      if ((KIND_PRIORITY[kind] || 0) > (KIND_PRIORITY[exist.kind] || 0)) {
        exist.kind = kind;
        if (targetLine) exist.targetLine = targetLine;
      }
      return;
    }
    const edge = { from, to, line, kind, targetLine: targetLine || null };
    byPairLine.set(pair, edge);
    seen.add(`${pair}:${kind}`);
    edges.push(edge);
  };

  FILE_META.forEach((m) => {
    const lines = m.raw.split("\n");
    lines.forEach((text, i) => {
      const lineNo = i + 1;
      if (!text.trim()) return;

      // (1) import / require / vi.mock ที่ระบุโมดูล
      const specRe = /(?:from|import|require|vi\.mock|vi\.doMock|jest\.mock)\s*\(?\s*['"]([^'"]+)['"]/g;
      let mm;
      while ((mm = specRe.exec(text)) !== null) {
        specifierToKeys(mm[1], pathOf[m.key], byPath).forEach((k) => addEdge(m.key, k, lineNo, "import", null));
      }

      // (2) สตริงที่พูดถึง path ของไฟล์อื่นใน 19 ไฟล์ (เช่น 'src/components/MemberItem.tsx')
      const litRe = /['"`]([^'"`\s]*?)['"`]/g;
      while ((mm = litRe.exec(text)) !== null) {
        const target = specifierToKeys(mm[1], pathOf[m.key], byPath);
        target.forEach((k) => addEdge(m.key, k, lineNo, "path", null));
        if (mm[1].includes("/")) {
          Object.keys(byPath).forEach((p) => {
            if (p.length > 6 && mm[1].toLowerCase().includes(p)) addEdge(m.key, byPath[p], lineNo, "path", null);
          });
        }
      }

      // (3) เรียกฟังก์ชัน/ค่าที่ export จากไฟล์อื่น (เช็กชื่อก่อน แล้วค่อยยืนยันด้วย regex)
      symbols.forEach((s) => {
        if (s.key === m.key || !text.includes(s.name)) return;
        if (new RegExp(`\\b${s.name.replace(/\$/g, "\\$")}\\s*[(<]`).test(text) || new RegExp(`new\\s+${s.name}\\s*\\(`).test(text)) {
          addEdge(m.key, s.key, lineNo, "call", s.defLine);
        }
      });
    });
  });

  FILE_GRAPH = { pathOf, symbols, edges };
  return FILE_GRAPH;
}

// ไฟล์ที่เกี่ยวข้องกับบรรทัดที่ผู้ใช้กด: เรียกจากบรรทัดนี้ (↓) + ถูกเรียกที่บรรทัดนี้ (↑)
function relationsFor(fileKey, line, depth) {
  if (!FILE_GRAPH) return { exact: false, out: [], incoming: [], second: [] };
  const out = [];
  const incoming = [];
  FILE_GRAPH.edges.forEach((e) => {
    // เรียกจากบรรทัดนี้ → ไฟล์ปลายทาง (บรรทัดสำคัญอยู่ฝั่งปลายทาง)
    if (e.from === fileKey && e.line === line) out.push({ file: e.to, line: e.targetLine, srcLine: e.line, kind: e.kind });
    // ถูกเรียกที่บรรทัดนี้ → ไฟล์ผู้เรียก (บรรทัดที่เรียกอยู่ฝั่งผู้เรียก)
    if (e.to === fileKey && e.line === line) incoming.push({ file: e.from, line: e.line, kind: e.kind });
  });
  if (out.length || incoming.length) {
    return { exact: true, out, incoming, second: depth > 1 ? secondDegree(fileKey, out, incoming) : [] };
  }
  const fout = [];
  const fin = [];
  FILE_GRAPH.edges.forEach((e) => {
    if (e.from === fileKey) fout.push({ file: e.to, line: e.targetLine, srcLine: e.line, kind: e.kind });
    if (e.to === fileKey) fin.push({ file: e.from, line: e.line, kind: e.kind });
  });
  return { exact: false, out: fout, incoming: fin, second: depth > 1 ? secondDegree(fileKey, fout, fin) : [] };
}

function secondDegree(fileKey, out, incoming) {
  if (!FILE_GRAPH) return [];
  const seen = new Set([fileKey, ...out.map((r) => r.file), ...incoming.map((r) => r.file)]);
  const extra = [];
  FILE_GRAPH.edges.forEach((e) => {
    if (e.from === fileKey || e.to === fileKey) return;
    if (!seen.has(e.from) && !seen.has(e.to)) return;
    const known = seen.has(e.from) ? e.from : e.to;
    const other = seen.has(e.from) ? e.to : e.from;
    if (other === fileKey || seen.has(other) || other === known) return;
    seen.add(other);
    extra.push({ file: other, line: e.from === other ? e.targetLine : e.line, kind: e.kind });
  });
  return extra;
}

function relKey(rel) {
  return `${rel.file}@${rel.line}@${rel.dir || "out"}@${rel.kind}`;
}

function normalizeRelList(list, dir) {
  const byFile = {};
  list.forEach((r) => {
    if (!byFile[r.file]) byFile[r.file] = { file: r.file, lines: [], srcLines: [], kinds: new Set(), dir };
    const item = byFile[r.file];
    if (r.line && !item.lines.includes(r.line)) item.lines.push(r.line);
    if (r.srcLine && !item.srcLines.includes(r.srcLine)) item.srcLines.push(r.srcLine);
    item.kinds.add(r.kind);
  });
  return Object.values(byFile)
    .map((it) => ({ ...it, lines: it.lines.sort((a, b) => a - b).slice(0, 6), srcLines: it.srcLines.slice(0, 6) }))
    .sort((a, b) => (b.lines.length - a.lines.length) || a.file.localeCompare(b.file));
}

function toggleRel(key) {
  if (openRelKeys.has(key)) openRelKeys.delete(key); else openRelKeys.add(key);
  renderLineReader();
}
window.toggleRel = toggleRel;

function toggleRelDepth() {
  relExpanded = !relExpanded;
  renderLineReader();
}
window.toggleRelDepth = toggleRelDepth;

// เปิดไฟล์ที่เกี่ยวข้องใน pane จริง (สลับแท็บ + ไฮไลต์บรรทัดนั้น) โดยไม่ทิ้งตัวอ่าน
function openRelated(fileKey, line) {
  const meta = FILE_META.find((f) => f.key === fileKey);
  if (!meta) return;
  switchFileTab(meta.pane, fileKey);
  pinLine(fileKey, line);
}
window.openRelated = openRelated;

const VIEW_TITLES = {
  blocks: ["เจาะสเต็ป — โค้ดจริงคู่ขนาน", "ซ้าย = งานคน 6 · ขวา = โมดูลเพื่อนที่ถูกเรียก"],
  summary: ["ภาพรวมสถาปัตยกรรม", "โฟลว์ 6 สเต็ปของคน 6 ที่เชื่อมคน 1-5 ทั้งหมด"],
  sim: ["Pipeline Simulator", "10 จังหวะ — ตั้งแต่ผู้ใช้กดปุ่มจนกราฟขึ้นจอ"],
  cicd: ["CI/CD & Dockerfile", "ถอดรหัส ci.yml ตัวจริง — Targeted Test ด้วย Regex feat/person-X"],
  redteam: ["Red Team Insights", "6 จุดเสี่ยงจากสายตาแฮ็กเกอร์ และจุดที่คน 6 ป้องกันไว้"],
  arch: ["สถาปัตยกรรมเชิงลึก", "7 ชั้น · ทุกจุดตัดสินใจ · ทุกเคสพลาด · วิธีเรนเดอร์"],
  deep: ["ป้องกันงานลึก", "ทำไมเลือกแบบนี้ · ไลบรารีตัวเลือก · แผนต่อยอด"],
  quiz: ["Defense Q&A & Quiz", "สคริปต์ตอบอาจารย์ 5 ข้อ + แบบทดสอบพร้อมเฉลย"]
};

// ===== 4 โหมด — รวมมุมมองเดิม 8 อันเป็น "หมวดย่อย" ของแต่ละโหมด =====
// section id เดิมทั้งหมดยังเรียกผ่าน switchMainView('...') ได้ตามปกติ
const MODES = {
  blocks: { btn: "nav-blocks", sections: [{ id: "blocks", label: "โค้ดคู่ขนาน" }, { id: "summary", label: "ภาพรวบ 6 สเต็ป" }] },
  sim:    { btn: "nav-sim",    sections: [{ id: "sim", label: "ไทม์ไลน์ 10 จังหวะ" }] },
  system: { btn: "nav-arch",   sections: [{ id: "arch", label: "สถาปัตยกรรม" }, { id: "cicd", label: "CI/CD" }, { id: "redteam", label: "Red Team" }, { id: "deep", label: "ป้องกันงานลึก" }] },
  drill:  { btn: "nav-quiz",   sections: [{ id: "quiz", label: "Q&A + แบบทดสอบ" }] }
};
const SECTION_MODE = {};
Object.entries(MODES).forEach(([m, cfg]) => cfg.sections.forEach((s) => { SECTION_MODE[s.id] = m; }));

const PERSON_COLORS = { "1": "#3fb950", "2": "#bc8cff", "3": "#d29922", "4": "#58a6ff", "5": "#f472b6", "6": "#ff7b72", s: "#8b949e" };
function personColor(badge) {
  const m = /คน\s*(\d)/.exec(badge || "");
  return m ? PERSON_COLORS[m[1]] : PERSON_COLORS.s;
}

// ===== หัว pane = 3 element แยกกัน: ชื่อไฟล์ · เจ้าของ · ความสัมพันธ์กับสเต็ป =====
// เดิม selectStep() เขียนทับป้ายด้วยความสัมพันธ์ ทำให้ "ชื่อไฟล์" หายไปจากสายตา
// → ตอนนี้ syncPaneChrome() เป็นแหล่งความจริงเดียว ทุกค่ามาจาก state เสมอ
function paneFileKey(pane) { return pane === "left" ? currentLeftTab : currentRightTab; }

function paneRelation(pane) {
  const step = LOGICAL_STEPS[currentStepIndex] || LOGICAL_STEPS[0];
  const key = paneFileKey(pane);
  if (pane === "left") {
    if (key === "pipeline" || key === "route") return { text: `งานของคน 6 · สเต็ป ${step.step}`, cls: "rel-owner" };
    return { text: "เปิดเทียบ · ไฟล์ประกอบ", cls: "" };
  }
  if (key === "github") {
    return step.gRange
      ? { text: `ถูกเรียกในสเต็ป ${step.step}`, cls: "rel-callee" }
      : { text: "สเต็ปนี้ไม่ได้เรียก", cls: "rel-none" };
  }
  return { text: "เปิดเทียบ · ไม่ใช่ callee ของสเต็ป", cls: "" };
}

function renderPaneChrome(pane) {
  const meta = FILE_META.find((f) => f.key === paneFileKey(pane));
  if (!meta) return;
  const head = document.getElementById(`${pane}-tabs`);
  if (head) {
    head.innerHTML = `
      <span class="pane-file"><span class="file-icon${meta.icon === "CSS" ? " css-icon" : ""}" aria-hidden="true">${meta.icon}</span>${esc(meta.name)}</span>
      <button type="button" class="pane-swap" onclick="focusFileList('${pane}')" title="เปิดรายการไฟล์ทั้งหมด">เปลี่ยนไฟล์ ▾</button>
      <button type="button" class="pane-open-here" onclick="focusPane('${pane}')">อธิบายไฟล์นี้ →</button>`;
  }
  const strip = document.getElementById(`pane-${pane}-strip`);
  if (strip) {
    const rel = paneRelation(pane);
    strip.innerHTML = `
      <span class="pane-badge" style="color:${personColor(meta.badge)}">${esc(meta.badge)}</span>
      <span class="pane-rel ${rel.cls}">${esc(rel.text)}</span>
      <span class="pane-badge owner-muted">${fileLineCount(meta)} บรรทัด</span>`;
  }
}
window.renderPaneChrome = renderPaneChrome;

function renderFocusChips() {
  ["left", "right"].forEach((pane) => {
    const btn = document.getElementById(`focus-${pane}`);
    if (btn) btn.setAttribute("aria-pressed", String(focusedPane === pane));
  });
}

function syncPaneChrome() {
  renderPaneChrome("left");
  renderPaneChrome("right");
  renderFocusChips();
}
window.syncPaneChrome = syncPaneChrome;

function renderPane(containerId, rawCode, fileType) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const lines = rawCode.split("\n");
  container.innerHTML = "";
  const frag = document.createDocumentFragment();
  let lastReal = lines.length - 1;
  while (lastReal >= 0 && lines[lastReal].trim() === "") lastReal--;
  lines.forEach((lineText, idx) => {
    if (idx > lastReal) return; // ไม่เรนเดอร์แถวว่างท้ายไฟล์จริง
    const lineNum = idx + 1;
    const row = document.createElement("div");
    row.className = "code-row";
    row.id = `${fileType}-row-${lineNum}`;
    row.innerHTML = `<span class="line-num">${lineNum}</span><span class="line-code">${highlightTS(lineText)}</span>`;
    row.addEventListener("click", () => onCodeRowClick(fileType, lineNum));
    frag.appendChild(row);
  });
  container.appendChild(frag);
  applyPinHighlight(fileType);
}

function renderCodePanes() {
  const leftMeta = FILE_META.find((f) => f.key === currentLeftTab);
  const rightMeta = FILE_META.find((f) => f.key === currentRightTab);
  if (leftMeta) renderPane("left-pane-body", leftMeta.raw, leftMeta.key);
  if (rightMeta) renderPane("right-pane-body", rightMeta.raw, rightMeta.key);
  syncPaneChrome();
  renderInspector();
}

function switchFileTab(pane, key) {
  const meta = FILE_META.find((f) => f.key === key && f.pane === pane);
  if (!meta) return;

  if (pane === "left") currentLeftTab = key; else currentRightTab = key;
  renderPane(pane === "left" ? "left-pane-body" : "right-pane-body", meta.raw, key);
  focusedPane = pane;
  syncPaneChrome();

  if (pane === "left") {
    const step = LOGICAL_STEPS[currentStepIndex];
    if (key === "pipeline") {
      highlightRange("pipeline", step.pRange[0], step.pRange[1], step.pTarget);
      scrollToLine("pipeline", step.pRange[0], step.pTarget);
    } else if (key === "route") {
      highlightRange("route", 9, 37, 24);
      scrollToLine("route", 9, 24);
    } else {
      clearHighlight(key);
    }
  } else {
    clearHighlight(key);
    if (key === "github") {
      const step = LOGICAL_STEPS[currentStepIndex];
      if (step.gRange) {
        highlightRange("github", step.gRange[0], step.gRange[1], step.gTarget);
        scrollToLine("github", step.gRange[0], step.gTarget);
      }
    }
  }
  renderInspector();
  renderMobileTabs();
}

// ===== Highlight & scroll =====
function getPaneContainer(fileType) {
  const meta = FILE_META.find((f) => f.key === fileType);
  if (meta && meta.pane === "right") return document.getElementById("right-pane-body");
  return document.getElementById("left-pane-body");
}

function highlightRange(fileType, startLine, endLine, targetLine) {
  const container = getPaneContainer(fileType);
  if (container) container.classList.add("has-highlight");
  const rows = document.querySelectorAll(`[id^="${fileType}-row-"]`);
  rows.forEach((r) => {
    r.classList.remove("block-highlight", "block-target", "connected-block", "connected-target");
    const lineNum = parseInt(r.id.split("-").pop(), 10);
    if (lineNum >= startLine && lineNum <= endLine) {
      // github.ts = Callee ของสเต็ป → สีเขียว, ไฟล์อื่นทั้งหมด → สีน้ำเงิน
      const isCalleeFile = fileType === "github";
      if (!isCalleeFile) r.classList.add(lineNum === targetLine ? "block-target" : "block-highlight");
      else r.classList.add(lineNum === targetLine ? "connected-target" : "connected-block");
    }
  });
}

function clearHighlight(fileType) {
  const container = getPaneContainer(fileType);
  if (container) container.classList.remove("has-highlight");
  const rows = document.querySelectorAll(`[id^="${fileType}-row-"]`);
  rows.forEach((r) => r.classList.remove("block-highlight", "block-target", "connected-block", "connected-target"));
}

function scrollToLine(fileType, startLine, targetLine) {
  const container = getPaneContainer(fileType);
  const focusLine = startLine !== undefined ? startLine : targetLine;
  const row = document.getElementById(`${fileType}-row-${Math.max(1, focusLine)}`);
  if (container && row) {
    container.scrollTo({ top: Math.max(0, row.offsetTop - 16), behavior: "smooth" });
  }
}

// ===== ปักหมุดบรรทัด: กดที่บรรทัดไหนก็ได้ (ครบ 19 ไฟล์) = ไฮไลต์ + ตัวอ่านขยาย =====
const PIN_CONTEXT = 8; // จำนวนบรรทัดบริบทรอบบรรทัดเป้าหมาย

// จำนวนบรรทัดจริง — ตัดแถวว่างท้ายไฟล์ทิ้งทั้งหมด ไม่ใช่แค่แถวสุดท้าย
function fileLineCount(meta) {
  const lines = meta.raw.split("\n");
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
  return lines.length;
}

function onCodeRowClick(fileKey, lineNum) {
  // pipeline.ts เดิมมีพฤติกรรมกระโดดสเต็ป — คงไว้ แล้วปักหมุดบรรทัดที่กดต่อ
  if (fileKey === "pipeline") {
    const foundIndex = LOGICAL_STEPS.findIndex((s) => lineNum >= s.pRange[0] && lineNum <= s.pRange[1]);
    if (foundIndex !== -1) selectStep(foundIndex);
  }
  pinLine(fileKey, lineNum);
}

function pinLine(fileKey, lineNum) {
  const meta = FILE_META.find((f) => f.key === fileKey);
  if (!meta) return;
  const total = fileLineCount(meta);
  pinnedLine = { file: fileKey, line: Math.max(1, Math.min(total, lineNum)) };
  applyPinHighlight();
  renderLineReader();
  scrollPaneToPin("smooth");
  announcePin();
}

// เลื่อน pane ให้บรรทัดที่ปักหมุดอยู่บนสุด เพื่อไม่ให้ถูกตัวอ่านบรรทัดบัง (บริบทรอบ ๆ ดูจากตัวอ่านแทน)
function scrollPaneToPin(behavior) {
  if (!pinnedLine) return;
  const row = document.getElementById(`${pinnedLine.file}-row-${pinnedLine.line}`);
  const container = row ? row.closest(".pane-code") : null;
  if (!row || !container) return;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // วัดระยะจากขอบบนจริงของ pane (offsetTop อาจอ้าง offsetParent คนละชั้นกับ .pane-code)
  const delta = row.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
  container.scrollTo({ top: Math.max(0, delta - 12), behavior: reduce ? "auto" : behavior || "auto" });
}
window.pinLine = pinLine;

function applyPinHighlight(fileKey) {
  document.querySelectorAll(".code-row.pinned-target").forEach((r) => r.classList.remove("pinned-target"));
  if (!pinnedLine) return;
  if (fileKey && fileKey !== pinnedLine.file) return;
  const row = document.getElementById(`${pinnedLine.file}-row-${pinnedLine.line}`);
  if (row) row.classList.add("pinned-target");
}

function clearPinned() {
  pinnedLine = null;
  applyPinHighlight();
  const el = document.getElementById("line-reader");
  if (el) { el.hidden = true; el.innerHTML = ""; }
  announcePin();
}
window.clearPinned = clearPinned;

// เลื่อนบรรทัดที่ปักหมุด (↑/↓ = 1 บรรทัด, Shift+↑/↓ = 10 บรรทัด) — ใช้ "อ่านต่อ" ได้โดยไม่ต้องเลื่อน pane เอง
function movePin(delta) {
  if (!pinnedLine) return false;
  const meta = FILE_META.find((f) => f.key === pinnedLine.file);
  if (!meta) return false;
  const total = fileLineCount(meta);
  const next = Math.max(1, Math.min(total, pinnedLine.line + delta));
  if (next === pinnedLine.line) return true;
  pinnedLine.line = next;
  applyPinHighlight();
  renderLineReader();
  scrollPaneToPin("auto");
  announcePin();
  return true;
}
window.movePin = movePin;

function announcePin() {
  const live = document.getElementById("pin-live");
  if (!live || !pinnedLine) return;
  const meta = FILE_META.find((f) => f.key === pinnedLine.file);
  if (!meta) return;
  live.textContent = `${meta.name} บรรทัด ${pinnedLine.line} จาก ${fileLineCount(meta)}`;
}

function relPreviewRows(meta, line, ctx) {
  const lines = meta.raw.split("\n");
  const total = fileLineCount(meta);
  const start = Math.max(1, line - ctx);
  const end = Math.min(total, line + ctx);
  const rows = [];
  for (let n = start; n <= end; n++) {
    rows.push(`<div class="code-row reader-row${n === line ? " reader-target" : ""}"><span class="line-num">${n}</span><span class="line-code">${highlightTS(lines[n - 1] || "")}</span></div>`);
  }
  return rows.join("");
}

function relItemHTML(rel) {
  const rm = FILE_META.find((f) => f.key === rel.file);
  if (!rm) return "";
  const total = fileLineCount(rm);
  const hasLine = rel.lines.length > 0;
  const line = hasLine ? rel.lines[0] : Math.min(1, total);
  const preview = (rm.raw.split("\n")[line - 1] || "").trim();
  const key = `${rel.file}@${hasLine ? line : 0}@${rel.dir}`;
  const isOpen = openRelKeys.has(key);
  const ownerColor = personColor(rm.badge);
  const extra = rel.lines.length > 1 ? ` +${rel.lines.length - 1}` : "";
  const lineLabel = hasLine ? `บรรทัด ${line}${extra}` : "ทั้งไฟล์";
  const srcNote = rel.srcLines.length ? `<span class="rel-src">จากบรรทัด ${rel.srcLines.slice(0, 4).join(", ")}</span>` : "";
  return `
    <div class="rel-item">
      <div class="rel-top">
        <span class="rel-dir rel-dir-${rel.dir}">${rel.dir === "out" ? "↓ เรียกใช้" : rel.dir === "in" ? "↑ ถูกเรียก" : "⇄ ชั้นที่ 2"}</span>
        <span class="file-icon${rm.icon === "CSS" ? " css-icon" : ""}" aria-hidden="true">${rm.icon}</span>
        <span class="rel-name">${rm.name}</span>
        <span class="rel-line">${lineLabel}</span>
        <span class="rel-owner" style="color:${ownerColor}">${esc(rm.badge)}</span>
        <span class="rel-kind">${[...rel.kinds].map((k) => REL_KIND[k] || k).join(" · ")}</span>
      </div>
      ${srcNote}
      <div class="rel-preview">${esc(preview) || "<em>— บรรทัดว่าง —</em>"}</div>
      ${isOpen ? `<div class="rel-code">${relPreviewRows(rm, line, hasLine ? 4 : 10)}</div>` : ""}
      <div class="rel-actions">
        <button type="button" class="nav-btn reader-btn" onclick="toggleRel('${key}')" aria-expanded="${isOpen}">${isOpen ? "ย่อโค้ด" : "ดูโค้ดรอบบรรทัดนี้"}</button>
        <button type="button" class="nav-btn reader-btn" onclick="openRelated('${rel.file}', ${line})">เปิดใน pane →</button>
      </div>
    </div>`;
}

function relGroupHTML(title, list, note) {
  if (!list.length) return "";
  return `
    <div class="rel-group">
      <div class="rel-group-head">${esc(title)}${note ? ` <span>${esc(note)}</span>` : ""}</div>
      ${list.map((rel) => relItemHTML(rel)).join("")}
    </div>`;
}

function renderLineReader() {
  const el = document.getElementById("line-reader");
  if (!el) return;
  if (!pinnedLine) { el.hidden = true; el.innerHTML = ""; return; }

  const prevScroll = el.querySelector(".reader-rel") ? el.querySelector(".reader-rel").scrollTop : 0;

  const meta = FILE_META.find((f) => f.key === pinnedLine.file);
  if (!meta) return;
  const lines = meta.raw.split("\n");
  const total = fileLineCount(meta);
  const line = pinnedLine.line;
  const start = Math.max(1, line - PIN_CONTEXT);
  const end = Math.min(total, line + PIN_CONTEXT);

  const rows = [];
  for (let n = start; n <= end; n++) {
    rows.push(`<div class="code-row reader-row${n === line ? " reader-target" : ""}"><span class="line-num">${n}</span><span class="line-code">${highlightTS(lines[n - 1] || "")}</span></div>`);
  }

  const ownerColor = personColor(meta.badge);
  const isOpenInPane = meta.key === currentLeftTab || meta.key === currentRightTab;
  const clicked = (lines[line - 1] || "").trim();
  const simHit = SIM_JUMPS.findIndex((j) => (j.snippets || []).some((s) => s.file === meta.key && line >= s.start && line <= s.end));
  const stepHit = meta.key === "pipeline"
    ? LOGICAL_STEPS.findIndex((s) => line >= s.pRange[0] && line <= s.pRange[1])
    : LOGICAL_STEPS.findIndex((s) => s.gRange && meta.key === "github" && line >= s.gRange[0] && line <= s.gRange[1]);

  const rel = relationsFor(meta.key, line, 2);
  const outList = normalizeRelList(rel.out, "out");
  const inList = normalizeRelList(rel.incoming, "in");
  const secondList = normalizeRelList(rel.second || [], "second");
  const showSecond = relExpanded && secondList.length > 0;
  const relatedCount = new Set([...outList, ...inList, ...(showSecond ? secondList : [])].map((r) => r.file)).size;

  el.innerHTML = `
    <div class="reader-head">
      <span class="file-icon${meta.icon === "CSS" ? " css-icon" : ""}" aria-hidden="true">${meta.icon}</span>
      <span class="reader-name">${meta.name}</span>
      <span class="reader-line">บรรทัด ${line} / ${total}</span>
      ${relatedCount ? `<span class="badge badge-blue">${relatedCount} ไฟล์ที่เกี่ยวข้อง</span>` : ""}
      <span class="reader-owner" style="color:${ownerColor}">${esc(meta.badge)}</span>
      ${isOpenInPane ? "" : `<button type="button" class="nav-btn reader-btn" onclick="openFileFromList('${meta.key}')">เปิด ${esc(meta.name)} ใน pane →</button>`}
      ${secondList.length ? `<button type="button" class="reader-toggle" onclick="toggleRelDepth()" aria-expanded="${relExpanded}">${relExpanded ? "ซ่อนชั้นที่ 2" : `ดูอีก ${secondList.length} ไฟล์ (ชั้นที่ 2)`}</button>` : ""}
      <button type="button" class="reader-close" onclick="clearPinned()" aria-label="ปิดตัวอ่านบรรทัด">✕</button>
    </div>
    <div class="reader-focus">${esc(clicked) || "<em>— บรรทัดว่าง —</em>"}</div>
    <div class="reader-body" id="reader-body">${rows.join("")}</div>
    <div class="reader-rel" id="reader-rel">
      ${relatedCount === 0
        ? `<p class="rel-empty">ไฟล์นี้ไม่มีการเรียก/อ้างถึงไฟล์อื่นในชุด 19 ไฟล์ (หรือเป็นไฟล์ที่ทุกคน import)</p>`
        : `${relGroupHTML(rel.exact ? "ไฟล์ที่บรรทัดนี้เรียกใช้" : "ไฟล์ที่ทั้งไฟล์นี้เรียกใช้", outList)}${relGroupHTML(rel.exact ? "ไฟล์ที่เรียกบรรทัดนี้" : "ไฟล์ที่เรียกไฟล์นี้", inList)}${showSecond ? relGroupHTML("เชื่อมโยงชั้นที่ 2", secondList) : ""}`}
    </div>
    <div class="reader-foot">
      <span class="reader-hint"><kbd>↑</kbd><kbd>↓</kbd> อ่านต่อ · <kbd>Shift</kbd> 10 บรรทัด · <kbd>Esc</kbd> ปิด</span>
      <span class="reader-actions">
        ${stepHit >= 0 ? `<button type="button" class="nav-btn reader-btn" onclick="switchMainView('blocks'); selectStep(${stepHit});">ไปสเต็ป ${stepHit + 1}</button>` : ""}
        ${simHit >= 0 ? `<button type="button" class="nav-btn reader-btn" onclick="switchMainView('sim'); simGo(${simHit});">ไปจังหวะซิมู ${simHit + 1}</button>` : ""}
      </span>
    </div>
    <div class="reader-path">${meta.bc}</div>`;
  el.hidden = false;
  el.className = "line-reader";   // ตัวอ่านเป็น bottom sheet ใน flow ไม่ลอยทับโค้ด

  const body = document.getElementById("reader-body");
  const target = body && body.querySelector(".reader-target");
  if (body && target) body.scrollTop = Math.max(0, target.offsetTop - body.clientHeight / 2 + target.offsetHeight / 2);
  const relBox = document.getElementById("reader-rel");
  if (relBox && prevScroll) relBox.scrollTop = prevScroll;
}
window.renderLineReader = renderLineReader;

// ===== Steps =====
function selectStep(stepIndex) {
  if (stepIndex < 0) stepIndex = 0;
  if (stepIndex >= LOGICAL_STEPS.length) stepIndex = LOGICAL_STEPS.length - 1;
  currentStepIndex = stepIndex;

  if (currentMainView === "summary") switchMainView("blocks");

  renderStepUI();

  const step = LOGICAL_STEPS[currentStepIndex];
  if (currentLeftTab === "pipeline") {
    highlightRange("pipeline", step.pRange[0], step.pRange[1], step.pTarget);
    scrollToLine("pipeline", step.pRange[0], step.pTarget);
  } else if (currentLeftTab === "route") {
    highlightRange("route", 9, 37, 24);
    scrollToLine("route", 9, 24);
  }

  if (step.gRange) {
    if (currentRightTab !== "github") switchFileTab("right", "github");
    highlightRange("github", step.gRange[0], step.gRange[1], step.gTarget);
    scrollToLine("github", step.gRange[0], step.gTarget);
  } else {
    clearHighlight("github");
  }
  syncPaneChrome();
  renderMobileTabs();
}

function prevStep() { selectStep(currentStepIndex - 1); }
function nextStep() { selectStep(currentStepIndex + 1); }

function renderStepDots() {
  const bar = document.getElementById("step-dots");
  if (!bar) return;
  bar.innerHTML = LOGICAL_STEPS.map((s, idx) =>
    `<button type="button" class="step-dot${idx === currentStepIndex ? " active" : ""}" onclick="selectStep(${idx})" title="${esc(s.title)}" aria-label="สเต็ป ${s.step}: ${esc(s.title)}" aria-pressed="${idx === currentStepIndex}">${s.step}</button>`
  ).join("");
  const posEl = document.getElementById("stepnav-pos");
  if (posEl) posEl.textContent = `${LOGICAL_STEPS[currentStepIndex].step}/6`;
}

function renderStepRibbon() {
  const el = document.getElementById("step-ribbon");
  if (!el) return;
  const s = LOGICAL_STEPS[currentStepIndex];
  el.innerHTML = `
    <div class="ribbon-top">
      <span class="ribbon-badge">สเต็ป ${s.step}/6 · บรรทัด ${s.pRange[0]}-${s.pRange[1]}</span>
      <span class="ribbon-title">${s.title}</span>
    </div>
    <div class="ribbon-objective">${s.objective}</div>
    <div class="ribbon-defense">
      <span class="ribbon-defense-label">แนวพูดตอบอาจารย์</span>
      <span class="ribbon-defense-text">"${s.defenseTip}"</span>
    </div>`;
}

function renderStepUI() {
  renderStepDots();
  renderStepRibbon();
}

// ===== Inspector: บทวิเคราะห์รายไฟล์ (ครอบคลุมทั้ง 19 ไฟล์จาก FILE_GUIDES) =====
function formatMechanicsLines(rawText) {
  if (!rawText) return "";
  return rawText.split("\n").map((line) => {
    const match = line.match(/^•\s*(บรรทัด\s*[^:]+):\s*(.*)$/);
    if (match) return `<div class="mechanics-line"><strong>${match[1]}:</strong> ${esc(match[2])}</div>`;
    return `<div class="mechanics-line">${esc(line)}</div>`;
  }).join("");
}

function guideCard(key) {
  const meta = FILE_META.find((f) => f.key === key);
  if (!meta) return "";
  const g = (typeof FILE_GUIDES !== "undefined" && FILE_GUIDES[key]) || null;
  if (!g) {
    return `<div class="guide-card"><div class="guide-head"><span class="guide-file">${meta.name}</span></div><p class="guide-empty">ยังไม่มีบทวิเคราะห์สำหรับไฟล์นี้</p></div>`;
  }
  const color = personColor(meta.badge);
  return `
    <div class="guide-card">
      <div class="guide-head">
        <span class="guide-file">${meta.name}</span>
        <span class="guide-owner" style="color:${color}">${esc(meta.badge)}</span>
        <span class="guide-tech">${esc(meta.tech)}</span>
      </div>
      <div class="guide-path">${meta.bc}</div>
      <div class="guide-role">${g.role}</div>
      <div class="mechanics-list">${formatMechanicsLines(g.mechanics)}</div>
      <div class="guide-links"><strong>จุดเชื่อมต่อ:</strong> ${esc(g.links)}</div>
      <div class="guide-defense">
        <span class="guide-defense-label">แนวตอบอาจารย์</span>
        <span class="guide-defense-text">${esc(g.defense)}</span>
      </div>
    </div>`;
}

// ===== แผลข้างขวา: อธิบายไฟล์ที่โฟกัส + รายการไฟล์ทั้งหมด (แทน dock ล่างจอ) =====
function renderInspector() {
  const guide = document.getElementById("inspector-left");
  if (guide) guide.innerHTML = guideCard(paneFileKey(focusedPane));
  const dir = document.getElementById("inspector-right");
  if (dir) dir.innerHTML = fileDirectoryHTML();
  renderFocusChips();
}

function focusPane(pane) {
  if (pane !== "left" && pane !== "right") return;
  focusedPane = pane;
  renderInspector();
}
window.focusPane = focusPane;

function fileDirectoryHTML() {
  const q = fileQuery.trim().toLowerCase();
  const groups = [];
  FILE_META.forEach((f) => {
    if (q && !(f.name.toLowerCase().includes(q) || f.badge.toLowerCase().includes(q) || String(f.bc || "").toLowerCase().includes(q))) return;
    let g = groups.find((x) => x.badge === f.badge);
    if (!g) { g = { badge: f.badge, color: personColor(f.badge), files: [] }; groups.push(g); }
    g.files.push(f);
  });
  if (!groups.length) return `<p class="guide-empty">ไม่พบไฟล์ที่ตรงกับ “${esc(fileQuery)}”</p>`;
  return groups.map((g) => `
    <div>
      <div class="file-group-head" style="color:${g.color}">${esc(g.badge)}</div>
      ${g.files.map((f) => {
        const where = f.key === currentLeftTab ? "left" : f.key === currentRightTab ? "right" : "";
        return `<button type="button" class="file-dir-item" data-file="${f.key}" aria-current="${where === focusedPane ? "true" : "false"}" onclick="openFileFromList('${f.key}')" title="${esc(f.bc)}">
          <span class="file-icon${f.icon === "CSS" ? " css-icon" : ""}" aria-hidden="true">${f.icon}</span>
          <span class="file-name">${esc(f.name)}</span>
          <span class="file-lines">${fileLineCount(f)}</span>
        </button>`;
      }).join("")}
    </div>`).join("");
}

function filterFileList(query) {
  fileQuery = query || "";
  renderInspector();
}
window.filterFileList = filterFileList;

function fileSearchKey(e) {
  if (e.key === "Enter") {
    const first = document.querySelector("#inspector-right .file-dir-item");
    if (first) { openFileFromList(first.getAttribute("data-file")); e.preventDefault(); }
  } else if (e.key === "Escape") {
    filterFileList("");
    const inp = document.getElementById("file-search");
    if (inp) { inp.value = ""; inp.blur(); }
  }
}
window.fileSearchKey = fileSearchKey;

function openFileFromList(key) {
  const meta = FILE_META.find((f) => f.key === key);
  if (!meta) return;
  if (window.innerWidth < 1024) { switchMobilePane(key); return; }
  focusedPane = meta.pane;
  switchFileTab(meta.pane, key);
}
window.openFileFromList = openFileFromList;

function focusFileList(pane) {
  if (pane) focusedPane = pane;
  renderInspector();
  const rail = document.getElementById("inspector");
  if (rail) rail.classList.add("rail-open");
  const inp = document.getElementById("file-search");
  if (inp) { inp.focus(); inp.select(); }
}
window.focusFileList = focusFileList;

function toggleContextRail() {
  const rail = document.getElementById("inspector");
  if (!rail) return;
  rail.classList.remove("inspector-hidden");
  const open = rail.classList.toggle("rail-open");
  rail.setAttribute("aria-expanded", String(open));
}
window.toggleContextRail = toggleContextRail;

function toggleInspector() {
  const dock = document.getElementById("inspector");
  const btn = document.getElementById("inspector-toggle-btn");
  if (!dock) return;
  const collapsed = dock.classList.toggle("inspector-collapsed");
  if (btn) btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
}
window.toggleInspector = toggleInspector;

// ===== เปลี่ยนหมวดย่อย (ชื่อ section เดิมทุกตัวยังเรียกได้) =====
function renderSectionTabs() {
  const bar = document.getElementById("section-tabs");
  if (!bar) return;
  const cfg = MODES[currentMode] || MODES.blocks;
  bar.innerHTML = cfg.sections.map((s) => `
    <button type="button" class="side-chip" onclick="switchMainView('${s.id}')" aria-pressed="${s.id === currentMainView}" title="${esc((VIEW_TITLES[s.id] || [])[1] || s.label)}">${esc(s.label)}</button>
  `).join("");
}
window.renderSectionTabs = renderSectionTabs;

function switchMainView(section) {
  const sec = SECTION_MODE[section] ? section : "blocks";
  currentMainView = sec;
  currentMode = SECTION_MODE[sec];

  Object.entries(MODES).forEach(([m, cfg]) => {
    const btn = document.getElementById(cfg.btn);
    if (btn) btn.setAttribute("aria-pressed", String(m === currentMode));
  });
  renderSectionTabs();

  const titles = VIEW_TITLES[sec] || VIEW_TITLES.blocks;
  const titleEl = document.getElementById("view-title");
  const subEl = document.getElementById("view-sub");
  if (titleEl) titleEl.textContent = titles[0];
  if (subEl) subEl.textContent = titles[1];

  // overlay ของแต่ละ section ("blocks" ไม่มี overlay — โค้ดอยู่ใน layout หลัก)
  Object.keys(SECTION_MODE).forEach((id) => {
    const el = document.getElementById(`${id}-view`);
    if (el) el.classList.toggle("active", id === sec && id !== "blocks");
  });
  const panes = document.getElementById("blocks-panes");
  if (panes) panes.classList.toggle("hidden", sec !== "blocks");

  const showRail = sec === "blocks";
  const rail = document.getElementById("inspector");
  if (rail) {
    rail.classList.toggle("inspector-hidden", !showRail);
    if (!showRail) rail.classList.remove("rail-open");
  }
  const shell = document.getElementById("app-shell");
  if (shell) shell.classList.toggle("rail-off", !showRail);

  const reader = document.getElementById("line-reader");
  if (reader) reader.hidden = sec !== "blocks";   // ตัวอ่านบรรทัดผูกกับโหมดเจาะสเต็ปเท่านั้น
  const stepNav = document.getElementById("step-nav");
  if (stepNav) stepNav.classList.toggle("hidden", sec !== "blocks");

  if (sec === "blocks") {
    selectStep(currentStepIndex);
    renderInspector();
  } else if (sec === "summary") {
    renderSummaryView();
  } else if (sec === "sim") {
    renderSimulatorView();
  } else if (sec === "cicd") {
    renderCicdView();
  } else if (sec === "redteam") {
    renderRedteamView();
  } else if (sec === "quiz") {
    renderQuizView();
  } else if (sec === "arch") {
    renderArchView();
  } else if (sec === "deep") {
    renderDeepView();
  }
}
window.switchMainView = switchMainView;

// ===== Mobile (จอเล็ก: โชว์ pane เดียว + แถบเลือกไฟล์ 19 ไฟล์) =====
function renderMobileTabs() {
  const bar = document.getElementById("mobile-pane-switcher");
  if (!bar) return;
  bar.innerHTML = FILE_META.map((f) => {
    const active = currentMobilePane === f.key;
    return `<button type="button" class="mobile-tab-btn${active ? " active" : ""}" role="tab" aria-selected="${active}" onclick="switchMobilePane('${f.key}')">
      <span class="file-icon${f.icon === "CSS" ? " css-icon" : ""}" aria-hidden="true">${f.icon}</span>
      <span>${f.name}</span>
    </button>`;
  }).join("");
}

function switchMobilePane(key) {
  const meta = FILE_META.find((f) => f.key === key);
  if (!meta) return;
  currentMobilePane = key;
  const leftPane = document.getElementById("left-pane-body")?.closest(".code-pane");
  const rightPane = document.getElementById("right-pane-body")?.closest(".code-pane");
  if (meta.pane === "left") {
    leftPane?.classList.remove("mobile-hidden");
    rightPane?.classList.add("mobile-hidden");
    switchFileTab("left", key);
  } else {
    leftPane?.classList.add("mobile-hidden");
    rightPane?.classList.remove("mobile-hidden");
    switchFileTab("right", key);
  }
  renderMobileTabs();
}

// ===== ภาพรวมสถาปัตยกรรม =====
function renderSummaryView() {
  const container = document.getElementById("summary-grid");
  if (!container) return;

  const roleCard = `
    <div class="summary-card" style="grid-column: 1 / -1; border-color: color-mix(in oklab, var(--accent) 40%, transparent);">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
        <span class="badge badge-primary">ขอบเขตหน้าที่คนที่ 6 (Mali)</span>
        <span class="badge badge-outline">รับผิดชอบ 2 ไฟล์หลัก: route.ts + pipeline.ts</span>
      </div>
      <div style="font-size:14px; font-weight:700;">1. API Route Endpoint (route.ts) → 2. Core Integration Pipeline (pipeline.ts)</div>
      <div style="font-size:12px; color:var(--ink-dim); line-height:1.65;">
        รับคำขอจากหน้าเว็บคนที่ 4 เข้ามาที่ <code>src/app/api/analyze/route.ts</code> (บรรทัด 9-27) ตรวจความถูกต้องของ URL แล้วเรียก
        <code>runAnalysisPipeline()</code> ใน <code>src/lib/pipeline.ts</code> เพื่อประสานงานกับเพื่อนคนที่ 1, 2, 3 จนเสร็จสิ้นค่ะ
      </div>
    </div>`;

  container.innerHTML = roleCard + LOGICAL_STEPS.map((s) => `
    <div class="summary-card" onclick="selectStep(${s.step - 1}); switchMainView('blocks');">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <span class="summary-step-num">STEP 0${s.step}</span>
        <span class="badge badge-blue">บรรทัด ${s.pRange[0]}-${s.pRange[1]}</span>
      </div>
      <div class="summary-card-title">${s.title}</div>
      <div class="summary-card-desc">${s.objective}</div>
      <div class="code-snippet-box">${s.teammateContract}</div>
      <div class="defense-box">
        <span class="defense-label">ตอบอาจารย์</span>
        <span class="defense-content">${s.defenseTip}</span>
      </div>
    </div>`).join("");
}

// ===== Interactive Pipeline Simulator (10 จังหวะ) =====
let simStepIndex = 0;

function simGo(i) {
  simStepIndex = Math.max(0, Math.min(SIM_STEPS.length - 1, i));
  renderSimulatorView();
}
window.simGo = simGo;

// ===== Simulator: โค้ดจริงแบบ inline (ไม่ต้องออกจากซิมูเลเตอร์ไปดูโค้ด) =====
function simSnippetBlock(sn) {
  const meta = FILE_META.find((f) => f.key === sn.file);
  if (!meta) return "";
  const lines = meta.raw.split("\n");
  const total = lines.length - (lines[lines.length - 1] === "" ? 1 : 0);
  const start = Math.max(1, sn.start || Math.max(1, sn.line - 5));
  const end = Math.min(total, sn.end || Math.min(total, sn.line + 5));

  const rows = [];
  for (let n = start; n <= end; n++) {
    const isTarget = n === sn.line;
    rows.push(`<div class="code-row sim-code-row${isTarget ? " sim-code-target" : ""}"><span class="line-num">${n}</span><span class="line-code">${highlightTS(lines[n - 1] || "")}</span></div>`);
  }

  const ownerColor = personColor(meta.badge);
  return `
    <div class="sim-code-card">
      <div class="sim-code-head">
        <span class="file-icon${meta.icon === "CSS" ? " css-icon" : ""}" aria-hidden="true">${meta.icon}</span>
        <span class="sim-code-name">${meta.name}</span>
        <span class="sim-code-line">บรรทัด ${sn.line} · ช่วง ${start}-${end}</span>
        <span class="sim-code-owner" style="color:${ownerColor}">${esc(meta.badge)}</span>
      </div>
      ${sn.note ? `<div class="sim-code-note">${esc(sn.note)}</div>` : ""}
      <div class="sim-code-body">${rows.join("")}</div>
      <div class="sim-code-path">${meta.bc}</div>
    </div>`;
}

function simCodePanel() {
  const entry = SIM_JUMPS[simStepIndex];
  if (!entry) return "";
  const snippets = Array.isArray(entry.snippets) && entry.snippets.length
    ? entry.snippets
    : [{ file: entry.file, line: entry.line }];
  return `
    <section class="sim-code-panel" aria-label="โค้ดจริงที่เกี่ยวข้องกับจังหวะนี้">
      <div class="sim-code-panel-head">
        <span class="badge badge-blue">โค้ดจริงในจังหวะนี้</span>
        <span class="sim-code-panel-sub">${snippets.length} ช่วง · ดึงจากไฟล์จริงในโปรเจกต์</span>
        <button type="button" class="nav-btn sim-code-open" onclick="simJumpToCode()" title="เปิดไฟล์เต็มในโหมดเจาะสเต็ป">เปิดไฟล์เต็ม →</button>
      </div>
      ${snippets.map((sn) => simSnippetBlock(sn)).join("")}
    </section>`;
}

function renderSimulatorView() {
  const el = document.getElementById("sim-body");
  if (!el) return;
  const s = SIM_STEPS[simStepIndex];
  const pct = ((simStepIndex + 1) / SIM_STEPS.length) * 100;
  const atStart = simStepIndex === 0;
  const atEnd = simStepIndex === SIM_STEPS.length - 1;

  el.innerHTML = `
    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
      <button type="button" class="nav-btn" onclick="simGo(${simStepIndex - 1})" ${atStart ? "disabled" : ""}>◀ ก่อนหน้า</button>
      <button type="button" class="nav-btn" onclick="simGo(${simStepIndex + 1})" ${atEnd ? "disabled" : ""}>ถัดไป ▶</button>
      <button type="button" class="nav-btn" onclick="simGo(0)" style="color:var(--ink-faint); border-color:var(--line);">เริ่มใหม่</button>
      <div class="sim-progress-track"><div class="sim-progress-fill" style="width:${pct}%;"></div></div>
      <span class="badge badge-blue">จังหวะ ${simStepIndex + 1}/${SIM_STEPS.length}</span>
    </div>
    <div class="sim-current" style="border-left:4px solid ${s.color};">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
        <span class="actor-badge" style="background:${s.color}22; color:${s.color}; border:1px solid ${s.color}55;">${esc(s.actor)}</span>
        <span style="display:flex; align-items:center; gap:8px;">
          <span style="font-family:var(--font-mono); font-size:11px; color:var(--ink-faint);">${esc(s.fileRef)}</span>
        </span>
      </div>
      <div style="font-size:15px; font-weight:700;">${s.title}</div>
      <div style="font-size:12.5px; color:var(--ink-dim); line-height:1.7;">${s.detail}</div>
    </div>
    ${simCodePanel()}
    <div class="sim-timeline">
      ${SIM_STEPS.map((x, i) => `
        <button type="button" class="sim-step-row${i === simStepIndex ? " active" : i < simStepIndex ? " done" : ""}" onclick="simGo(${i})">
          <span class="sim-step-num"${i <= simStepIndex ? ` style="background:${x.color};"` : ""}>${x.n}</span>
          <span style="flex:1; text-align:left;">${x.title}</span>
          <span class="actor-badge" style="background:${x.color}18; color:${x.color}; font-size:9px;">${esc(x.actor)}</span>
        </button>`).join("")}
    </div>`;
}

// ===== Jump: เด้งไปไฟล์ + บรรทัดจริง (ใช้ทั้งซิมูและ Q&A) =====
function jumpToCodeLine(fileKey, line, syncStep = true) {
  const meta = FILE_META.find((f) => f.key === fileKey);
  if (!meta) return;
  switchMainView("blocks");
  switchFileTab(meta.pane, fileKey);

  let start = line;
  let end = line;

  if (fileKey === "pipeline") {
    const idx = LOGICAL_STEPS.findIndex((s) => line >= s.pRange[0] && line <= s.pRange[1]);
    if (idx !== -1) {
      currentStepIndex = idx;
      renderStepUI();
      renderInspector();
      start = LOGICAL_STEPS[idx].pRange[0];
      end = LOGICAL_STEPS[idx].pRange[1];
    }
  } else if (fileKey === "route") {
    start = 9;
    end = 37;
  } else if (fileKey === "github" && syncStep) {
    const idx = LOGICAL_STEPS.findIndex((s) => s.gRange && line >= s.gRange[0] && line <= s.gRange[1]);
    if (idx !== -1) {
      currentStepIndex = idx;
      renderStepUI();
      renderInspector();
      start = LOGICAL_STEPS[idx].gRange[0];
      end = LOGICAL_STEPS[idx].gRange[1];
    }
  }

  highlightRange(fileKey, start, end, line);
  scrollToLine(fileKey, line, line);
  pinLine(fileKey, line);   // เปิดตัวอ่านบรรทัดให้ด้วยเสมอ ไม่ว่าจะกดจาก Q&A หรือจากการ์ดสถาปัตยกรรม
}

function simJumpToCode() {
  const j = SIM_JUMPS[simStepIndex];
  if (j) jumpToCodeLine(j.file, j.line);
}
window.simJumpToCode = simJumpToCode;

function qnaJumpToCode(qi) {
  const j = QNA_JUMPS[qi];
  if (j) jumpToCodeLine(j.file, j.line);
}
window.qnaJumpToCode = qnaJumpToCode;

// ===== CI/CD & Dockerfile =====
function renderCicdView() {
  const el = document.getElementById("cicd-body");
  if (!el) return;
  el.innerHTML = CICD_SECTIONS.map((c) => `
    <div class="summary-card">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
        <span class="card-badge card-badge-blue">${esc(c.title)}</span>
        <span class="badge badge-neutral">${esc(c.badge)}</span>
      </div>
      <div class="summary-card-desc">${c.desc}</div>
      ${c.code ? `<div class="code-snippet-box" style="white-space:pre;">${esc(c.code)}</div>` : ""}
    </div>`).join("");
}

// ===== Red Team & Defensive Insights =====
function renderRedteamView() {
  const el = document.getElementById("redteam-body");
  if (!el) return;
  el.innerHTML = REDTEAM_ITEMS.map((r) => `
    <div class="summary-card" style="border-left:3px solid var(--warn);">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:17px;" aria-hidden="true">${r.icon}</span>
        <span style="font-size:13.5px; font-weight:700;">${r.title}</span>
      </div>
      <div style="font-size:12px; color:var(--danger); background:var(--danger-soft); border:1px solid color-mix(in oklab, var(--danger) 30%, transparent); border-radius:9px; padding:8px 11px; line-height:1.6;">
        <strong>ความเสี่ยง:</strong> ${r.risk}
      </div>
      <div class="defense-box">
        <span class="defense-label">วิธีที่คน 6 ป้องกันไว้</span>
        <span class="defense-content">${r.fix}</span>
      </div>
    </div>`).join("");
}

// ===== Defense Q&A + Self-Test Quiz =====
const quizAnswers = {};

function quizPick(qi, oi) {
  quizAnswers[qi] = oi;
  renderQuizView();
}
window.quizPick = quizPick;

function quizReset() {
  Object.keys(quizAnswers).forEach((k) => delete quizAnswers[k]);
  renderQuizView();
}
window.quizReset = quizReset;

function renderQuizView() {
  const el = document.getElementById("quiz-body");
  if (!el) return;
  const answered = Object.keys(quizAnswers).length;
  const correct = QUIZ_QUESTIONS.reduce((acc, q, qi) => acc + (quizAnswers[qi] === q.answer ? 1 : 0), 0);

  const qnaHtml = `
    <h3 style="font-size:14px; margin:0 0 2px;">สคริปต์ตอบคำถามยอดฮิต (Defense Q&A) — กดแต่ละข้อเพื่อดูเฉลย</h3>
    ${QNA_ITEMS.map((x, i) => `
      <details class="qna-item">
        <summary><span class="qna-num">Q${i + 1}</span> ${x.q}</summary>
        <div class="qna-answer">
          <button type="button" class="nav-btn" style="font-size:11px; padding:3px 10px; margin-bottom:8px;" onclick="qnaJumpToCode(${i})" title="เด้งไปดูโค้ดจริงที่ใช้ตอบ">ดูโค้ดจริง →</button>
          <div>${x.a}</div>
        </div>
      </details>`).join("")}`;

  const quizHtml = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin:18px 0 2px;">
      <h3 style="font-size:14px; margin:0;">แบบทดสอบตรวจความพร้อมก่อนพรีเซนต์ (${QUIZ_QUESTIONS.length} ข้อ)</h3>
      <div style="display:flex; gap:8px; align-items:center;">
        <span class="badge badge-blue">ตอบแล้ว ${answered}/${QUIZ_QUESTIONS.length}</span>
        <span class="badge badge-green">ถูกต้อง ${correct}/${QUIZ_QUESTIONS.length}</span>
        <button type="button" class="nav-btn" onclick="quizReset()">ล้างคำตอบ</button>
      </div>
    </div>
    ${QUIZ_QUESTIONS.map((q, qi) => {
      const picked = quizAnswers[qi];
      return `
      <div class="quiz-card">
        <div class="quiz-q"><span class="chip-num">${qi + 1}</span> ${q.q}</div>
        <div class="quiz-options">
          ${q.options.map((opt, oi) => {
            let cls = "quiz-option";
            if (picked !== undefined) {
              if (oi === q.answer) cls += " correct";
              else if (oi === picked) cls += " wrong";
              else cls += " dim";
            }
            return `<button type="button" class="${cls}" onclick="quizPick(${qi}, ${oi})"><span class="quiz-letter" aria-hidden="true">${"ABCD"[oi]}</span> ${opt}</button>`;
          }).join("")}
        </div>
        ${picked !== undefined ? `<div class="quiz-explain">${picked === q.answer ? "ถูกต้อง — " : "ยังไม่ใช่นะ — "}${q.explain}</div>` : ""}
      </div>`;
    }).join("")}`;

  el.innerHTML = qnaHtml + quizHtml;
}

// ===== Keyboard: A/D หรือลูกศร · ↑/↓ อ่านต่อ · 1-4 สลับโหมด · [ ] สลับไฟล์ · f ค้นไฟล์ =====
const MODE_KEYS = { "1": "blocks", "2": "sim", "3": "system", "4": "drill" };
const MODE_FIRST_SECTION = { blocks: "blocks", sim: "sim", system: "arch", drill: "quiz" };

function cycleFile(dir) {
  const pane = focusedPane;
  const list = FILE_META.filter((f) => f.pane === pane);
  if (!list.length) return;
  const cur = list.findIndex((f) => f.key === paneFileKey(pane));
  const next = list[(cur + dir + list.length) % list.length];
  if (window.innerWidth < 1024) switchMobilePane(next.key);
  else switchFileTab(pane, next.key);
}
window.cycleFile = cycleFile;

window.addEventListener("keydown", (e) => {
  const tag = (e.target && e.target.tagName) || "";
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  if (MODE_KEYS[e.key]) {
    switchMainView(MODE_FIRST_SECTION[MODE_KEYS[e.key]]);
    e.preventDefault();
  } else if (e.key === "[" ) {
    cycleFile(-1);
    e.preventDefault();
  } else if (e.key === "]") {
    cycleFile(1);
    e.preventDefault();
  } else if (e.key === "f" || e.key === "F") {
    focusFileList(focusedPane);
    e.preventDefault();
  } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    if (currentMainView === "sim") simGo(simStepIndex + 1); else nextStep();
  } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    if (currentMainView === "sim") simGo(simStepIndex - 1); else prevStep();
  } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    const dir = e.key === "ArrowDown" ? 1 : -1;
    const stepSize = e.shiftKey ? 10 : 1;
    // ถ้ายังไม่ได้ปักหมุด ให้เริ่มจากบรรทัดเป้าหมายของสเต็ปปัจจุบันในไฟล์ที่เปิดอยู่
    if (!pinnedLine && currentMainView === "blocks") {
      const startMeta = FILE_META.find((f) => f.key === currentLeftTab);
      const startLine = startMeta && startMeta.key === "pipeline" ? LOGICAL_STEPS[currentStepIndex].pTarget : 1;
      pinLine(startMeta ? startMeta.key : "pipeline", startLine);
    }
    if (movePin(dir * stepSize)) e.preventDefault();
  } else if (e.key === "Escape") {
    const rail = document.getElementById("inspector");
    if (rail && rail.classList.contains("rail-open")) { rail.classList.remove("rail-open"); e.preventDefault(); }
    else if (pinnedLine) { clearPinned(); e.preventDefault(); }
  }
});

// ===== Init (ชุดเดียว) =====
window.addEventListener("DOMContentLoaded", () => {
  initFileMeta();       // สร้าง FILE_META ก่อนใช้งาน (อ้างอิง RAW_* จาก data-code.js)
  buildFileGraph();     // กราฟความสัมพันธ์ 19 ไฟล์ คำนวณจากโค้ดจริง
  renderCodePanes();    // โค้ด 2 pane + หัว pane + แผลข้างขวา
  renderSummaryView();
  renderMobileTabs();
  renderStepUI();       // step chips + ribbon
  switchMainView("blocks");
  switchMobilePane("pipeline");
  // เปิด/ปิดแผลข้างขวาตามความกว้างจอจริง
  window.addEventListener("resize", () => {
    const rail = document.getElementById("inspector");
    if (rail && window.innerWidth >= 1280) rail.classList.remove("rail-open");
  });
});

// ===== สถาปัตยกรรมเชิงลึก: 7 ชั้น + สแต็กเลเยอร์ + ระบบไฮไลต์ + วิธีเรนเดอร์ =====
function archFileChips(fileKeys) {
  return (fileKeys || []).map((k) => {
    const m = FILE_META.find((f) => f.key === k);
    if (!m) return "";
    return `<button type="button" class="file-chip" onclick="jumpToCodeLine('${k}', 1)" title="${esc(m.badge)}">
      <span class="file-icon${m.icon === "CSS" ? " css-icon" : ""}" aria-hidden="true">${m.icon}</span>${m.name}
    </button>`;
  }).join("");
}

function renderArchView() {
  const el = document.getElementById("arch-body");
  if (!el) return;

  const layers = ARCH_LAYERS.map((L) => `
    <article class="layer-card" style="border-left:4px solid ${L.color};">
      <div class="layer-head">
        <span class="layer-num" style="background:${L.color}22; color:${L.color}; border:1px solid ${L.color}55;">ชั้น ${L.n}</span>
        <span class="layer-title">${esc(L.title)}</span>
        <span class="actor-badge" style="background:${L.color}18; color:${L.color};">${esc(L.owner)}</span>
      </div>
      <div class="layer-goal">${esc(L.goal)}</div>
      <div class="layer-io">${esc(L.io)}</div>
      <div class="layer-chips">${archFileChips(L.files)}</div>
      <div class="layer-steps">
        ${L.steps.map((s, i) => {
          const ref = s.ref ? FILE_META.find((f) => f.key === s.ref[0]) : null;
          return `<button type="button" class="layer-step" onclick="jumpToCodeLine('${s.ref[0]}', ${s.ref[1]})">
            <span class="layer-step-n">${i + 1}</span>
            <span class="layer-step-t">${esc(s.t)}</span>
            <span class="layer-step-d">${esc(s.d)}</span>
            <span class="layer-step-ref">${ref ? esc(ref.name) + ":" + s.ref[1] : ""}</span>
          </button>`;
        }).join("")}
      </div>
      <div class="layer-block">
        <div class="layer-block-head">เคสพลาดที่ต้องรู้</div>
        ${L.edge.map((e) => `<div class="layer-bullet">${esc(e)}</div>`).join("")}
      </div>
      <div class="layer-block">
        <div class="layer-block-head">จุดตัดสินใจ — ทำไมเลยแบบนี้</div>
        ${L.decisions.map((d) => `<div class="layer-qa"><strong>${esc(d.q)}</strong><span>${esc(d.a)}</span></div>`).join("")}
      </div>
      <div class="layer-block">
        <div class="layer-block-head">ถ้าต่อยอด</div>
        ${L.extend.map((e) => `<div class="layer-bullet">→ ${esc(e)}</div>`).join("")}
      </div>
    </article>`).join("");

  el.innerHTML = `
    <div class="arch-summary">
      <div class="arch-summary-card"><span class="arch-sum-n">${ARCH_LAYERS.length}</span><span>ชั้นงาน</span></div>
      <div class="arch-summary-card"><span class="arch-sum-n">${FILE_META.length}</span><span>ไฟล์จริง</span></div>
      <div class="arch-summary-card"><span class="arch-sum-n">${ARCH_TOTAL_SYMBOLS}</span><span>สัญลักษณ์ export</span></div>
      <div class="arch-summary-card"><span class="arch-sum-n">${ARCH_TOTAL_EDGES}</span><span>ความสัมพันธ์ข้ามไฟล์</span></div>
      <p class="arch-summary-note">${esc(ARCH_HTML_NOTE)}</p>
    </div>
    ${layers}
    <section class="arch-table-card">
      <h3>สแต็กเลเยอร์ของ UI ตัวนี้ — layout ทำอย่างไร</h3>
      <table class="arch-table"><thead><tr><th>ชั้น</th><th>ชื่อ</th><th>selector</th><th>หน้าที่</th><th>จุดที่ต้องรู้</th></tr></thead><tbody>
        ${LAYOUT_STACK.map((r) => `<tr><td>${r.lvl}</td><td><code>${esc(r.name)}</code></td><td><code>${esc(r.selector)}</code></td><td>${esc(r.role)}</td><td>${esc(r.detail)}</td></tr>`).join("")}
      </tbody></table>
    </section>
    <section class="arch-table-card">
      <h3>ระบบไฮไลต์ — ครบทุกคลาสที่ใช้</h3>
      <table class="arch-table"><thead><tr><th>คลาส</th><th>สี</th><th>ใช้ที่ไหน</th><th>แปลว่าอะไร</th><th>CSS</th><th>ทำไมต้องเป็นแบบนี้</th></tr></thead><tbody>
        ${HIGHLIGHT_SYSTEM.map((r) => `<tr><td><code>${esc(r.cls)}</code></td><td>${esc(r.color)}</td><td>${esc(r.where)}</td><td>${esc(r.meaning)}</td><td><code>${esc(r.css)}</code></td><td>${esc(r.why)}</td></tr>`).join("")}
      </tbody></table>
    </section>
    <section class="arch-table-card">
      <h3>วิธีเรนเดอร์ — ฟังก์ชันไหนทำอะไร เรียกตามลำดับไหน</h3>
      <div class="render-funcs">
        ${RENDER_FUNCS.map((f, i) => `
          <div class="render-func">
            <div class="render-func-head"><span class="render-func-n">${i + 1}</span><code>${esc(f.fn)}</code><span class="render-func-where">${esc(f.where)}</span></div>
            <div class="render-func-role">${esc(f.role)}</div>
            <ul class="render-func-how">${f.how.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
            <div class="render-func-why"><strong>ทำไม:</strong> ${esc(f.why)}</div>
          </div>`).join("")}
      </div>
    </section>
    <section class="arch-table-card">
      <h3>คำถามที่อาจารย์อาจถามเรื่องตัวพอร์ทัลนี้</h3>
      ${PORTAL_QA.map((q) => `<div class="layer-qa"><strong>${esc(q.q)}</strong><span>${esc(q.a)}</span></div>`).join("")}
    </section>`;
}

// ===== ป้องกันงานลึก + แผนต่อยอด =====
function renderDeepView() {
  const el = document.getElementById("deep-body");
  if (!el) return;

  const cards = DEFENSE_DEEP.map((d) => `
    <article class="qa-card">
      <div class="qa-cat">${esc(d.cat)}</div>
      <h3 class="qa-q">${esc(d.q)}</h3>
      <div class="qa-short">${esc(d.short)}</div>
      <div class="qa-deep">${esc(d.deep)}</div>
      <div class="qa-block">
        <div class="qa-block-head">รายละเอียด</div>
        <ul class="qa-list">${d.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
      </div>
      ${d.libs && d.libs.length ? `<div class="qa-block">
        <div class="qa-block-head">ไลบรารีที่เกี่ยวข้อง</div>
        ${d.libs.map((l) => `<div class="lib-row"><span class="lib-name">${esc(l.name)}</span><span class="lib-why">${esc(l.why)}</span><span class="lib-trade">ข้อแลกเปลี่ยน: ${esc(l.trade)}</span></div>`).join("")}
      </div>` : ""}
      ${d.extend && d.extend.length ? `<div class="qa-block">
        <div class="qa-block-head">ถ้าอยากต่อยอด</div>
        ${d.extend.map((e) => `<div class="qa-extend">→ ${esc(e)}</div>`).join("")}
      </div>` : ""}
    </article>`).join("");

  el.innerHTML = `
    <div class="deep-grid">${cards}</div>
    <section class="arch-table-card">
      <h3>แผนต่อยอด 5 เฟส — เรียงตามผลตอบแทนต่อความเสี่ยง</h3>
      <div class="roadmap">
        ${ROADMAP.map((r) => `
          <div class="roadmap-card">
            <div class="roadmap-head"><span class="roadmap-phase">${esc(r.phase)}</span><span class="roadmap-title">${esc(r.title)}</span></div>
            <div class="roadmap-meta"><span>ใช้เวลา ${esc(r.effort)}</span><span>ผลตอบแทน ${esc(r.impact)}</span><span>ความเสี่ยง ${esc(r.risk)}</span></div>
            <div class="roadmap-why">${esc(r.why)}</div>
            <ul class="roadmap-items">${r.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
          </div>`).join("")}
      </div>
    </section>
    <section class="arch-table-card">
      <h3>คำถามที่อาจารย์อาจถามเรื่องตัวพอร์ทัล</h3>
      ${PORTAL_QA.map((q) => `<div class="layer-qa"><strong>${esc(q.q)}</strong><span>${esc(q.a)}</span></div>`).join("")}
    </section>`;
}
