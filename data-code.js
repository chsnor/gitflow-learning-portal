// ============================================================
// data-code.js — โค้ดจริงทั้ง 19 ไฟล์จากโปรเจกต์ D:\git_flowcahrt
// (โหลดก่อน data-content.js เพราะ FILE_META อ้างอิง RAW_*)
// ============================================================

const RAW_PIPELINE = `// src/lib/pipeline.ts
import { parseGitHubUrl, buildGitHubApiUrl, buildGitHubHeaders } from './github';
import { filterTreeFiles, detectNextFileType, extractImportsFromCode, extractActionTriggers } from './parser';
import { buildFlowElements, generateMermaidSyntax } from './generator';
import { AnalysisResult, GitHubTreeItem, CodeRelation, NextFileType, FlowNodeItem, FlowEdgeItem } from '../types';

/**
 * ตัวแปรเก็บแคชในหน่วยความจำ (In-Memory Cache) ประจำเซิร์ฟเวอร์
 * เก็บผลการวิเคราะห์โดยใช้ URL เป็น Key เพื่อลดการยิง GitHub API ซ้ำซ้อน
 */
export const pipelineCache = new Map<string, AnalysisResult>();

/**
 * ฟังก์ชันสำหรับล้างแคชทั้งหมด (ใช้สำหรับรัน Unit Test หรือรีเซ็ตระบบ)
 */
export function clearPipelineCache(): void {
  pipelineCache.clear();
}

/**
 * ฟังก์ชันสำหรับแปลงเส้นทาง Import (เช่น '@/store/gameStore' หรือ './GameCard')
 * ให้ตรงกับที่อยู่ไฟล์จริงใน Repository (เช่น 'src/store/gameStore.ts')
 */
export function resolveImportToFilePath(
  importTarget: string,
  sourcePath: string,
  allFilePaths: string[]
): string | null {
  if (!importTarget) return null;
  const cleanTarget = importTarget.replace(/['"]/g, '').trim();
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];

  // 1. Alias imports (@/ หรือ ~/)
  if (cleanTarget.startsWith('@/') || cleanTarget.startsWith('~/')) {
    const raw = cleanTarget.slice(2);
    for (const prefix of ['src/', '']) {
      for (const ext of extensions) {
        const candidate = prefix + raw + ext;
        const found = allFilePaths.find((p) => p.toLowerCase() === candidate.toLowerCase());
        if (found) return found;
      }
    }
  }

  // 2. Relative imports (./ หรือ ../)
  if (cleanTarget.startsWith('.')) {
    const sourceDir = sourcePath.includes('/') ? sourcePath.slice(0, sourcePath.lastIndexOf('/')) : '';
    const parts = sourceDir ? sourceDir.split('/') : [];
    const segs = cleanTarget.split('/');
    for (const seg of segs) {
      if (seg === '.' || seg === '') continue;
      if (seg === '..') parts.pop();
      else parts.push(seg);
    }
    const resolvedBase = parts.join('/');
    for (const ext of extensions) {
      const candidate = resolvedBase + ext;
      const found = allFilePaths.find((p) => p.toLowerCase() === candidate.toLowerCase());
      if (found) return found;
    }
  }

  // 3. Fallback: ค้นหาจากชื่อไฟล์ (Base name match)
  const baseName = cleanTarget.split('/').pop()?.toLowerCase();
  if (baseName) {
    const match = allFilePaths.find((p) => {
      const fName = p.split('/').pop()?.replace(/\\.[^.]+$/, '').toLowerCase();
      return fName === baseName;
    });
    if (match) return match;
  }

  return null;
}

/**
 * ฟังก์ชันสร้างความสัมพันธ์เชิงโครงสร้าง (Structural Relations) จาก Next.js App Router Architecture
 * ทำงานอัตโนมัติจากโครงสร้างโฟลเดอร์และไฟล์ ไม่ต้องดึงโค้ดทุกไฟล์ ป้องกันการติด GitHub API Rate Limit
 */
export function inferStructuralRelations(
  files: Array<{ path: string; fileType: NextFileType }>
): CodeRelation[] {
  const relations: CodeRelation[] = [];
  const uniqueKeys = new Set<string>();

  const addRelation = (rel: CodeRelation) => {
    if (!rel.source || !rel.target || rel.source === rel.target) return;
    const key = \`\${rel.source}->\${rel.target}\`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.add(key);
      relations.push(rel);
    }
  };

  // 1. ค้นหา Entry Points หลัก (Middleware, Root Layout, Root Page)
  const middlewareFile = files.find((f) => f.fileType === "middleware");
  const rootLayout =
    files.find((f) => /(^|\\/)(src\\/)?app\\/layout\\.[jt]sx?$/.test(f.path)) ||
    files.find((f) => /(^|\\/)layout\\.[jt]sx?$/.test(f.path));
  const rootPage =
    files.find((f) => /(^|\\/)(src\\/)?app\\/page\\.[jt]sx?$/.test(f.path)) ||
    files.find((f) => /(^|\\/)page\\.[jt]sx?$/.test(f.path));
  const rootEntry = rootLayout || rootPage || files.find((f) => f.fileType === "page");

  if (middlewareFile && rootEntry) {
    addRelation({
      source: middlewareFile.path,
      target: rootEntry.path,
      type: "import",
      label: "routes to",
    });
  }

  // 2. แยกกลุ่มระหว่าง Route Files (อยู่ใน app/ หรือ pages/) กับ Shared Files (components, lib, store)
  const routeFiles = files.filter((f) => /(^|\\/)(app|pages)\\//.test(f.path));
  const otherFiles = files.filter((f) => !/(^|\\/)(app|pages)\\//.test(f.path));

  // 3. สร้างผังเส้นทางหลักของ Next.js ตาม Folder Hierarchy
  const routeDirMap = new Map<string, Array<{ path: string; fileType: NextFileType }>>();
  for (const file of routeFiles) {
    const lastSlash = file.path.lastIndexOf("/");
    const dir = lastSlash === -1 ? "" : file.path.substring(0, lastSlash);
    if (!routeDirMap.has(dir)) routeDirMap.set(dir, []);
    routeDirMap.get(dir)!.push(file);
  }

  // เชื่อมโยงโฟลเดอร์แม่ -> โฟลเดอร์ลูกใน App Router
  for (const [dir, dirFiles] of routeDirMap.entries()) {
    const pageInDir = dirFiles.find((f) => f.fileType === "page");
    const layoutInDir = dirFiles.find((f) => /(^|\\/)layout\\.[jt]sx?$/.test(f.path));
    const mainAnchor = pageInDir || layoutInDir;

    // ถ้าในโฟลเดอร์มีทั้ง layout และ page ให้ layout -> page
    if (layoutInDir && pageInDir && layoutInDir.path !== pageInDir.path) {
      addRelation({
        source: layoutInDir.path,
        target: pageInDir.path,
        type: "import",
        label: "renders",
      });
    }

    // Co-located actions หรือ route states ในโฟลเดอร์เดียวกัน
    for (const f of dirFiles) {
      if (mainAnchor && f.path !== mainAnchor.path) {
        if (f.fileType === "action") {
          addRelation({
            source: mainAnchor.path,
            target: f.path,
            type: "action",
            label: "server action",
          });
        } else if (/(loading|error|not-found)\\.[jt]sx?$/.test(f.path)) {
          addRelation({
            source: mainAnchor.path,
            target: f.path,
            type: "import",
            label: "route state",
          });
        }
      }
    }

    // เชื่อมจาก Root Entry หรือ Parent Route มายัง Route นี้
    if (dir && mainAnchor) {
      const lastSlash = dir.lastIndexOf("/");
      const parentDir = lastSlash === -1 ? "" : dir.substring(0, lastSlash);
      const parentFiles = routeDirMap.get(parentDir);

      if (parentFiles) {
        const parentLayout = parentFiles.find((f) => /(^|\\/)layout\\.[jt]sx?$/.test(f.path));
        const parentPage = parentFiles.find((f) => f.fileType === "page");
        const parentAnchor = parentLayout || parentPage;
        if (parentAnchor && parentAnchor.path !== mainAnchor.path) {
          addRelation({
            source: parentAnchor.path,
            target: mainAnchor.path,
            type: "import",
            label: "sub-route",
          });
        }
      } else if (rootEntry && rootEntry.path !== mainAnchor.path) {
        addRelation({
          source: rootEntry.path,
          target: mainAnchor.path,
          type: "import",
          label: "sub-route",
        });
      }
    }
  }

  // 4. เชื่อมโยง Components / Stores / Shared Files ไปยังหน้าที่เกี่ยวข้องอย่างเจาะจง
  const allPages = routeFiles.filter((f) => f.fileType === "page");
  for (const item of otherFiles) {
    const itemName = item.path.split("/").pop()?.replace(/\\.[^.]+$/, "").toLowerCase() || "";

    // ค้นหาหน้าที่เกี่ยวข้องจากชื่อ เช่น CourseCard -> /courses, BandCard -> /bands, GameExplorer -> /games
    // รองรับการตัด s พหูพจน์ของ route เช่น bands -> band, games -> game, courses -> course
    let matchedPage = allPages.find((p) => {
      const pageRoute = p.path.toLowerCase();
      const segments = pageRoute.split("/").filter((s) => s && s !== "src" && s !== "app" && !s.startsWith("page."));
      return segments.some((seg) => {
        const cleanSeg = seg.replace(/[[\\]]/g, "");
        const stem = cleanSeg.endsWith("s") && cleanSeg.length > 3 ? cleanSeg.slice(0, -1) : cleanSeg;
        return (stem.length >= 3 && itemName.includes(stem)) || (cleanSeg.length >= 3 && itemName.includes(cleanSeg));
      });
    });

    // ถ้าไม่ตรงกับ Route ไหนเลย (เช่น ButtonComponent, MemberItem, Navbar) ให้ผูกกับ rootEntry หรือหน้าแรก
    if (!matchedPage) {
      matchedPage = rootEntry || allPages[0];
    }

    if (matchedPage) {
      const isFeatureMatch = matchedPage !== rootEntry;
      addRelation({
        source: matchedPage.path,
        target: item.path,
        type: "import",
        label: isFeatureMatch ? "uses component" : "shared UI",
      });
    }

    // 4.1 ถ้าไฟล์นี้เป็น store ให้เชื่อมโยงคอมโพเนนต์ในฟีเจอร์เดียวกันมาหา store ด้วย
    if (item.fileType === "store") {
      const stem = itemName.replace(/store$/, "");
      if (stem.length >= 3) {
        for (const comp of otherFiles) {
          if (comp.fileType === "component" && comp.path.toLowerCase().includes(stem)) {
            addRelation({
              source: comp.path,
              target: item.path,
              type: "import",
              label: "uses store",
            });
          }
        }
      }
    }
  }

  // 5. Fallback ปลอดภัยกรณีโปรเจกต์ไม่ได้ใช้โครงสร้าง app/ หรือ pages/
  if (relations.length === 0 && files.length > 1) {
    const anchor = rootEntry || files[0];
    for (let i = 1; i < Math.min(files.length, 10); i++) {
      if (anchor.path !== files[i].path) {
        addRelation({
          source: anchor.path,
          target: files[i].path,
          type: "import",
          label: "references",
        });
      }
    }
  }

  return relations;
}

/**
 * ฟังก์ชัน Pipeline รวบยอดทั้งระบบ (คนที่ 6 รับผิดชอบ)
 * ทำหน้าที่เชื่อมโยงการทำงานจากโมดูลของสมาชิกทุกคนตั้งแต่ต้นน้ำจนถึงปลายน้ำ
 * พร้อมระบบ In-Memory Cache และการวัด Performance
 */
export async function runAnalysisPipeline(
  githubUrl: string,
  token?: string,
  mockTreeData?: GitHubTreeItem[],
  mockFilesContent?: Record<string, string>,
): Promise<AnalysisResult> {
  // TODO 6.1: เริ่มจับเวลาด้วย const startTime = performance.now()
  const startTime = performance.now();
  // TODO 6.2: รับ URL และทำการแกะเจ้าของ/ชื่อคลังด้วย parseGitHubUrl (คนที่ 1)
  let parsed = null;

  try {
    parsed = parseGitHubUrl(githubUrl);
  } catch {
    // สำรองไว้ชั่วคราวระหว่างรอคนที่ 1 ทำงานเสร็จ
    if (githubUrl && githubUrl.includes("github.com")) {
      const parts = githubUrl
        .replace(/\\.git$/, "")
        .replace(/\\/+$/, "")
        .split("/");
      parsed = {
        owner: parts[parts.length - 2],
        repo: parts[parts.length - 1],
      };
    }
  }

  if (!parsed || !parsed.owner || !parsed.repo) {
    throw new Error("URL ต้องมาจาก github.com เท่านั้น");
  }

  const { owner, repo } = parsed;
  let activeBranch = parsed.branch || 'main';
  // TODO 6.3: ตรวจสอบ In-Memory Cache (pipelineCache)
  //           - ถ้ามีข้อมูลในแคชแล้ว ให้คืนค่าจากแคชทันที พร้อมแนบ isCached: true และ executionTimeMs
  if (pipelineCache.has(githubUrl)) {
    const cachedResult = pipelineCache.get(githubUrl)!;
    return {
      ...cachedResult,
      isCached: true,
      executionTimeMs: performance.now() - startTime,
    };
  }
  // TODO 6.4: ดึงข้อมูลโครงสร้างโฟลเดอร์จาก GitHub API หรือใช้ mockTreeData (คนที่ 1)
  let treeData: GitHubTreeItem[] = [];

  if (mockTreeData) {
    treeData = mockTreeData;
    console.log("🔄 ใช้ Mock Tree Data (สำหรับการทดสอบภายใน)");
  } else {
    try {
      let response = await fetch(
        buildGitHubApiUrl(owner, repo, activeBranch),
        { headers: buildGitHubHeaders(token) },
      );

      // หากคลังไม่ได้ใช้ branch 'main' (เช่น โปรเจกต์เก่าที่ใช้ 'master') ให้ fallback อัตโนมัติ
      if (response.status === 404 && activeBranch === 'main') {
        const fallbackResponse = await fetch(
          buildGitHubApiUrl(owner, repo, 'master'),
          { headers: buildGitHubHeaders(token) },
        );
        if (fallbackResponse.ok) {
          response = fallbackResponse;
          activeBranch = 'master';
        }
      }

      if (!response.ok) {
        // ถ้า Error 404 ไม่พบคลังโค้ดหรือ branch
        if (response.status === 404) {
          throw new Error("❌ ไม่พบคลังโค้ดนี้บน GitHub หรือไม่พบ Branch main/master");
        }
        // ถ้า Error 403 Forbidden ให้แนะนำให้ใส่ Token ใน .env
        if (response.status === 403) {
          throw new Error(
            "❌ GitHub API Rate Limit หรือ Access Denied. กรุณาเพิ่ม GitHub Token ในไฟล์ .env",
          );
        }
        throw new Error(\`GitHub API Error: \${response.status}\`);
      }

      const json = await response.json();
      if (Array.isArray(json.tree)) {
        treeData = json.tree;
      }
    } catch (error: any) {
      if (error?.message && error.message.includes("❌")) {
        throw error;
      }
      console.error("❌ ไม่สามารถเชื่อมต่อ GitHub ได้:", error);
      throw new Error(
        "ไม่สามารถเชื่อมต่อ GitHub ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือแนบ Token",
      );
    }
  }
  // TODO 6.5: นำรายการไฟล์มาคัดกรองด้วย filterTreeFiles (คนที่ 2)
  // กรองไฟล์ที่ไม่เกี่ยวข้องทิ้ง (ใช้ฟังก์ชันคนที่ 2)
  let filteredItems: GitHubTreeItem[] = [];
  try {
    filteredItems = filterTreeFiles(treeData, 500);
  } catch {
    // โค้ดสำรองระหว่างรอคนที่ 2: กรองเอาเฉพาะไฟล์ blob และนามสกุลโค้ด
    filteredItems = treeData.filter(
      (item) =>
        item.type === "blob" &&
        !item.path.includes("node_modules") &&
        !item.path.includes(".next") &&
        !item.path.endsWith(".d.ts") &&
        /\\.(tsx?|jsx?)$/.test(item.path),
    ).slice(0, 500);
  }
  // TODO 6.6: จำแนกประเภทของแต่ละไฟล์ด้วย detectNextFileType (คนที่ 2)
  const filesWithTypes = filteredItems.map((item) => {
    let fileType: NextFileType = "other";
    try {
      fileType = detectNextFileType(item.path);
    } catch {
      // โค้ดสำรองระหว่างรอคนที่ 2: เดาประเภทจากชื่อไฟล์คร่าวๆ
      if (item.path.includes("page.")) fileType = "page";
      else if (item.path.includes("actions")) fileType = "action";
      else if (item.path.includes("middleware") || item.path.includes("proxy"))
        fileType = "middleware";
      else if (item.path.includes("store") || item.path.includes("context"))
        fileType = "store";
      else if (item.path.includes("components/")) fileType = "component";
    }
    return { path: item.path, fileType };
  });
  // TODO 6.7: สกัดความสัมพันธ์ Imports และ Action/Event Triggers จากโค้ดจริง (คนที่ 2)
  const relations: CodeRelation[] = [];
  const allPaths = filesWithTypes.map((f) => f.path);
  const seenRelKeys = new Set<string>();

  let filesContentToProcess: Record<string, string> | null = mockFilesContent || null;

  // สำหรับการวิเคราะห์คลังจริงบน GitHub (เมื่อไม่ได้รัน mockTreeData) ให้ดึงไฟล์จริงผ่าน CDN เพื่อแกะ import จริง
  if (!filesContentToProcess && !mockTreeData && filesWithTypes.length > 0) {
    try {
      const candidates = filesWithTypes.slice(0, 45);
      const fetchPromises = candidates.map(async (f) => {
        try {
          const rawUrl = \`https://raw.githubusercontent.com/\${owner}/\${repo}/\${activeBranch}/\${f.path}\`;
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = \`Bearer \${token}\`;
          const res = await fetch(rawUrl, {
            headers,
            signal: AbortSignal.timeout(4000),
          });
          if (!res.ok) return { path: f.path, text: '' };
          const text = await res.text();
          return { path: f.path, text };
        } catch {
          return { path: f.path, text: '' };
        }
      });

      const fetchedResults = await Promise.all(fetchPromises);
      const contentMap: Record<string, string> = {};
      let hasValidContent = false;
      for (const item of fetchedResults) {
        if (item.text) {
          contentMap[item.path] = item.text;
          hasValidContent = true;
        }
      }
      if (hasValidContent) {
        filesContentToProcess = contentMap;
      }
    } catch {
      // Fallback ปลอดภัยหากเครือข่ายล่ม
    }
  }

  if (filesContentToProcess) {
    for (const [filePath, content] of Object.entries(filesContentToProcess)) {
      // 1. ดึงคำสั่ง import จริงจากโค้ด
      try {
        const rawImports = extractImportsFromCode(filePath, content);
        for (const imp of rawImports) {
          const resolved = resolveImportToFilePath(imp.target, filePath, allPaths);
          const target = resolved || imp.target;
          if (target && target !== filePath) {
            const key = \`\${filePath}->\${target}\`;
            if (!seenRelKeys.has(key)) {
              seenRelKeys.add(key);
              const targetType = filesWithTypes.find((f) => f.path === target)?.fileType ?? 'other';
              const label =
                targetType === 'store'
                  ? 'uses store'
                  : targetType === 'action'
                  ? 'server action'
                  : targetType === 'component'
                  ? 'uses component'
                  : 'imports';

              relations.push({
                source: filePath,
                target,
                type: targetType === 'store' ? 'import' : targetType === 'action' ? 'action' : 'import',
                label,
              });
            }
          }
        }
      } catch {}

      // 2. ดึง Event / Server Action
      try {
        const rawActions = extractActionTriggers(filePath, content);
        for (const act of rawActions) {
          const resolved = resolveImportToFilePath(act.target, filePath, allPaths);
          const target = resolved || act.target;
          const key = \`\${filePath}->\${target}:\${act.label}\`;
          if (!seenRelKeys.has(key)) {
            seenRelKeys.add(key);
            relations.push({
              source: filePath,
              target,
              type: act.type,
              label: act.label,
            });
          }
        }
      } catch {
        if (content.includes("action={updateProductAction}")) {
          relations.push({
            source: filePath,
            target: "src/app/products/actions.ts",
            type: "action",
            label: "form action",
          });
        }
      }
    }
  }

  // หากไม่มี mockFilesContent หรือยังไม่มี relations จากการแกะโค้ด ให้สร้างความสัมพันธ์เชิงโครงสร้างจาก App Router อัตโนมัติ
  if (relations.length === 0 && filesWithTypes.length > 0) {
    relations.push(...inferStructuralRelations(filesWithTypes));
  }
  // 1. สร้างโหนดและเส้นเชื่อมสำหรับ React Flow
  let flowElements: { nodes: FlowNodeItem[]; edges: FlowEdgeItem[] } = { nodes: [], edges: [] };
  try {
    flowElements = buildFlowElements(filesWithTypes, relations);
  } catch {
    // โค้ดสำรองระหว่างรอคนที่ 3: คำนวณพิกัด X, Y เบื้องต้น
    flowElements = {
      nodes: filesWithTypes.map((f, idx) => ({
        id: f.path.replace(/[^a-zA-Z0-9]/g, "_"),
        label: f.path,
        fileType: f.fileType,
        path: f.path,
        position: { x: (idx % 3) * 220, y: Math.floor(idx / 3) * 120 },
      })),
      edges: relations.map((r, idx) => ({
        id: \`e-\${idx}\`,
        source: r.source.replace(/[^a-zA-Z0-9]/g, "_"),
        target: r.target.replace(/[^a-zA-Z0-9]/g, "_"),
        label: r.label,
        animated: r.type === "action",
      })),
    };
  }

  // 2. สร้างโค้ด Mermaid Syntax สำหรับ Export
  let mermaidSyntax = "graph TD\\n";
  try {
    mermaidSyntax = generateMermaidSyntax(relations);
  } catch {
    mermaidSyntax = 'graph TD\\n  Start["Repo Root"]';
  }
  // TODO 6.9: บันทึกผลลัพธ์ลง pipelineCache.set(githubUrl, result) เพื่อใช้ในครั้งต่อไป
    const finalResult: AnalysisResult = {
      repoName: repo,
      owner,
      branch: activeBranch,
      totalFiles: treeData.length,
      filteredFilesCount: filteredItems.length,
      relations,
      nodes: flowElements.nodes,
      edges: flowElements.edges,
      mermaidSyntax,
      isCached: false,
      executionTimeMs: performance.now() - startTime,
    };

    // บันทึกลง In-Memory Cache
    pipelineCache.set(githubUrl, finalResult);

    return finalResult;
  // TODO 6.10: ส่งคืน AnalysisResult ที่สมบูรณ์ พร้อมแนบ isCached: false และ executionTimeMs
  // TODO 6.11 (Network Safety Guard): ครอบ try-catch หากยิง GitHub ไม่สำเร็จ (เช่น เน็ตหลุด หรือติด Rate Limit 403) 
  //            ให้โยน Error ที่มีข้อความชัดเจน เช่น "ไม่สามารถเชื่อมต่อ GitHub ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือแนบ Token"
  
}   
`;

const RAW_ROUTE = `// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runAnalysisPipeline } from "../../../lib/pipeline";

/**
 * API Route สำหรับการวิเคราะห์โครงสร้างคลังโค้ด (คนที่ 6 รับผิดชอบ)
 * ทำหน้าที่เป็น Endpoint หลังบ้านรับคำขอจากหน้าเว็บ (คนที่ 4) เพื่อส่งเข้าสู่ Pipeline
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 6.13: รับ body จากคำขอ
    const body = await req.json();
    const { url, token } = body;

    // 6.14: ตรวจสอบ URL
    if (!url) {
      return NextResponse.json(
        { error: "กรุณาระบุ URL ของ GitHub Repository" },
        { status: 400 },
      );
    }

    // 6.15: เรียก Pipeline รันการวิเคราะห์
    const result = await runAnalysisPipeline(url, token);

    // 6.16: ส่งผลลัพธ์กลับ
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // 6.17: จัดการ Error
    const errorMessage =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการประมวลผล";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}`;

const RAW_PARSER = `// src/lib/parser.ts
import { GitHubTreeItem, CodeRelation, NextFileType } from '../types';

const BLACKLIST_FOLDERS = [
  'node_modules/',
  '.next/',
  'dist/',
  'build/',
  'public/',
  '.git/',
  '.github/',
  'coverage/',
  '__tests__/',
  'tests/',
  'test/',
  'docs/',
  'scripts/',
  'config/',
  'configs/',
  'cypress/',
  'e2e/',
];

const BLACKLIST_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'tsconfig.json',
  'jsconfig.json',
  'readme.md',
  '.gitignore',
  'package.json',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'tailwind.config.js',
  'tailwind.config.ts',
  'postcss.config.js',
  'postcss.config.mjs',
  'vite.config.ts',
  'vite.config.js',
  'vitest.config.ts',
  'vitest.config.js',
  'jest.config.js',
  'jest.config.ts',
]);

const ALLOWED_ROOT_FILES = new Set([
  'middleware.ts',
  'middleware.js',
  'proxy.ts',
  'proxy.js',
]);

const VALID_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * คัดกรองเฉพาะไฟล์ซอร์สโค้ดจริง
 * กรองไฟล์ Config ระดับ Root, โฟลเดอร์ทดสอบ, และไฟล์ที่ไม่ใช่ส่วนหนึ่งของแอปพลิเคชันออกทั้งหมด
 */
export function filterTreeFiles(items: GitHubTreeItem[], maxLimit = 250): GitHubTreeItem[] {
  if (!Array.isArray(items)) return [];

  const filtered: GitHubTreeItem[] = [];

  for (let i = 0; i < items.length; i++) {
    if (filtered.length >= maxLimit) break;

    const item = items[i];
    if (!item || item.type !== 'blob' || !item.path) continue;

    const rawPath = item.path.replace(/\\\\/g, '/');
    const lowerPath = rawPath.toLowerCase();
    const lastSlash = lowerPath.lastIndexOf('/');
    const fileName = lastSlash !== -1 ? lowerPath.slice(lastSlash + 1) : lowerPath;

    // 1. ข้ามไฟล์ซ่อน (เช่น .env, .gitignore)
    if (fileName.startsWith('.')) continue;

    // 2. ข้ามไฟล์ที่อยู่ใน Blacklist
    if (BLACKLIST_FILES.has(fileName)) continue;

    // 3. ข้ามโฟลเดอร์ที่ไม่เกี่ยวข้อง
    if (BLACKLIST_FOLDERS.some((folder) => lowerPath.includes(folder))) continue;

    // 4. ข้ามไฟล์ declaration (.d.ts), config (*.config.*), test (*.test.*, *.spec.*), minified (.min.*)
    if (
      fileName.endsWith('.d.ts') ||
      fileName.includes('.config.') ||
      fileName.includes('.test.') ||
      fileName.includes('.spec.') ||
      fileName.includes('.cy.') ||
      fileName.includes('.min.')
    ) {
      continue;
    }

    // 5. ตรวจสอบนามสกุลไฟล์ซอร์สโค้ด (.ts, .tsx, .js, .jsx)
    if (!VALID_EXTENSIONS.some((ext) => fileName.endsWith(ext))) {
      continue;
    }

    // 6. กรองไฟล์ระดับ Root (กรณีไม่มี / ใน Path) ยกเว้น middleware และ proxy
    const isRootFile = lastSlash === -1;
    if (isRootFile && !ALLOWED_ROOT_FILES.has(fileName)) {
      continue;
    }

    filtered.push(item);
  }

  return filtered;
}

/**
 * จำแนกประเภทของไฟล์ตามสถาปัตยกรรม Next.js
 */
export function detectNextFileType(filePath: string): NextFileType {
  if (!filePath || typeof filePath !== 'string') return 'other';

  const normalizedPath = filePath.replace(/\\\\/g, '/');
  const lastSlash = normalizedPath.lastIndexOf('/');
  const fileName = lastSlash !== -1 ? normalizedPath.slice(lastSlash + 1) : normalizedPath;

  if (
    fileName === 'middleware.ts' ||
    fileName === 'middleware.js' ||
    fileName === 'proxy.ts' ||
    fileName === 'proxy.js'
  ) {
    return 'middleware';
  }

  if (/^page\\.(tsx|ts|jsx|js)$/.test(fileName)) return 'page';
  if (/^layout\\.(tsx|ts|jsx|js)$/.test(fileName)) return 'layout';

  if (
    /^actions?\\.(tsx|ts|jsx|js)$/.test(fileName) ||
    normalizedPath.includes('/actions/') ||
    normalizedPath.startsWith('actions/')
  ) {
    return 'action';
  }

  if (
    normalizedPath.includes('/stores/') ||
    normalizedPath.includes('/context/') ||
    normalizedPath.includes('/state/') ||
    normalizedPath.startsWith('stores/') ||
    normalizedPath.startsWith('context/') ||
    normalizedPath.startsWith('state/')
  ) {
    return 'store';
  }

  if (
    /^route\\.(tsx|ts|jsx|js)$/.test(fileName) ||
    normalizedPath.includes('/api/') ||
    normalizedPath.startsWith('api/')
  ) {
    return 'api';
  }

  if (
    normalizedPath.includes('/components/') ||
    normalizedPath.startsWith('components/')
  ) {
    return 'component';
  }

  return 'other';
}

/**
 * ดึงข้อมูลการ import โดยข้ามไฟล์ที่ไม่มีคำว่า import ด้วย String Guard Clause
 */
export function extractImportsFromCode(sourcePath: string, codeContent: string): CodeRelation[] {
  if (!codeContent || typeof codeContent !== 'string' || !codeContent.includes('import')) {
    return [];
  }

  const cleanCode = codeContent.replace(/\\/\\*[\\s\\S]*?\\*\\/|\\/\\/.*/g, '');
  const relations: CodeRelation[] = [];
  const seenTargets = new Set<string>();

  const importRegex = /import(?:\\s+type)?(?:\\s+[\\s\\S]*?\\s+from)?\\s+['"]([^'"]+)['"]/g;

  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(cleanCode)) !== null) {
    const importPath = match[1];

    if (importPath && /^(\\.|\\.\\.|\\@|\\~)\\//.test(importPath)) {
      if (!seenTargets.has(importPath)) {
        seenTargets.add(importPath);
        relations.push({
          source: sourcePath,
          target: importPath,
          type: 'import',
        });
      }
    }
  }

  return relations;
}

/**
 * ดึงข้อมูล Event Triggers (onClick) และ Server Actions (action)
 */
export function extractActionTriggers(sourcePath: string, codeContent: string): CodeRelation[] {
  if (
    !codeContent ||
    typeof codeContent !== 'string' ||
    (!codeContent.includes('onClick') && !codeContent.includes('action'))
  ) {
    return [];
  }

  const cleanCode = codeContent.replace(/\\/\\*[\\s\\S]*?\\*\\/|\\/\\/.*/g, '');
  const relations: CodeRelation[] = [];
  const seenKeys = new Set<string>();

  const RESERVED = new Set([
    'async', 'await', 'return', 'function', 'true', 'false',
    'null', 'undefined', 'e', 'event', 'evt', 'formData',
    'console', 'log', 'preventDefault', 'stopPropagation', 'void'
  ]);

  const extractTargetFn = (expr: string): string | null => {
    const tokens = expr
      .replace(/['"\`]/g, '')
      .split(/[^a-zA-Z0-9_$]+/)
      .filter(Boolean);

    for (const token of tokens) {
      if (!RESERVED.has(token) && !/^\\d+$/.test(token)) {
        return token;
      }
    }
    return null;
  };

  if (cleanCode.includes('onClick')) {
    const onClickRegex = /onClick=\\{([^}]+)\\}/g;
    let match: RegExpExecArray | null;

    while ((match = onClickRegex.exec(cleanCode)) !== null) {
      const targetFn = extractTargetFn(match[1]);
      if (targetFn) {
        const key = \`\${sourcePath}->\${targetFn}:onClick\`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          relations.push({
            source: sourcePath,
            target: targetFn,
            type: 'event',
            label: 'onClick',
          });
        }
      }
    }
  }

  if (cleanCode.includes('action')) {
    const actionRegex = /(?:form\\s+)?action=\\{([^}]+)\\}/g;
    let match: RegExpExecArray | null;

    while ((match = actionRegex.exec(cleanCode)) !== null) {
      const targetFn = extractTargetFn(match[1]);
      if (targetFn) {
        const key = \`\${sourcePath}->\${targetFn}:form action\`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          relations.push({
            source: sourcePath,
            target: targetFn,
            type: 'action',
            label: 'form action',
          });
        }
      }
    }
  }

  return relations;
}`;

const RAW_GENERATOR = `// src/lib/generator.ts
import dagre from '@dagrejs/dagre';
import { CodeRelation, NextFileType, FlowNodeItem, FlowEdgeItem } from '../types';

/**
 * ฟังก์ชันสำหรับแปลงชื่อ path ให้เป็น Node ID ที่ปลอดภัยตามไวยากรณ์ของ Flow และ Mermaid
 */
export function sanitizeNodeId(pathStr: string): string {
  const id = pathStr
    // 3.1: กำจัดวงเล็บของ Next.js Route Groups เช่น (auth) -> auth
    .replace(/[()]/g, '')
    // 3.2: แทนที่อักขระพิเศษทุกตัวด้วย underscore
    .replace(/[^a-zA-Z0-9]+/g, '_')
    // 3.3: ตัด underscore หัวท้าย
    .replace(/^_+|_+$/g, '');

  return id || 'node';
}

const COLOR_PALETTE: Record<string, { border: string; bg: string; text: string }> = {
  middleware: { border: '#a855f7', bg: '#1e293b', text: '#e9d5ff' },
  page: { border: '#38bdf8', bg: '#1e293b', text: '#e0f2fe' },
  action: { border: '#fb923c', bg: '#1e293b', text: '#ffedd5' },
  store: { border: '#4ade80', bg: '#1e293b', text: '#dcfce7' },
  component: { border: '#f43f5e', bg: '#1e293b', text: '#ffe4e6' },
  api: { border: '#facc15', bg: '#1e293b', text: '#fef9c3' },
  other: { border: '#94a3b8', bg: '#1e293b', text: '#e2e8f0' },
};

/**
 * ฟังก์ชันคืนค่าการกำหนดสีตามประเภทไฟล์ของ Next.js
 */
export function getNodeColorConfig(fileType: NextFileType): { border: string; bg: string; text: string } {
  // 3.4
  return COLOR_PALETTE[fileType] ?? COLOR_PALETTE.other;
}

/**
 * ฟังก์ชันกำหนดสีขอบและพื้นหลังสำหรับ Mermaid Syntax (Backward Compatibility)
 */
export function getNodeStyle(nodeId: string, originalPath: string, fileType: NextFileType = 'other'): string {
  // 3.5: ถ้า fileType ยังเป็น 'other' ให้เดาจากชื่อ path เพื่อรองรับโค้ดเก่า
  let type: NextFileType = fileType;
  if (type === 'other') {
    const p = originalPath.toLowerCase();
    if (/(^|\\/)middleware\\.[jt]sx?$/.test(p)) type = 'middleware' as NextFileType;
    else if (/(^|\\/)page\\.[jt]sx?$/.test(p)) type = 'page' as NextFileType;
    else if (/(^|\\/)route\\.[jt]s$/.test(p) || p.includes('/api/')) type = 'api' as NextFileType;
    else if (/action/.test(p)) type = 'action' as NextFileType;
    else if (/(store|zustand|redux)/.test(p)) type = 'store' as NextFileType;
    else if (/components?\\//.test(p)) type = 'component' as NextFileType;
  }

  const { border, bg } = getNodeColorConfig(type);
  return \`style \${nodeId} fill:\${bg},stroke:\${border},stroke-width:2px\`;
}

// คอลัมน์ของแต่ละประเภทไฟล์ (ซ้าย -> ขวา ตามลำดับการไหลของข้อมูล)
const COLUMN_ORDER: string[] = ['middleware', 'page', 'component', 'action', 'api', 'store', 'other'];

/**
 * ฟังก์ชันสร้าง Nodes และ Edges สำหรับ React Flow (@xyflow/react)
 * พร้อมคำนวณพิกัด X, Y ด้วย Hierarchical Graph Layout (Dagre Algorithm)
 */
export function buildFlowElements(
  files: Array<{ path: string; fileType: NextFileType }>,
  relations: CodeRelation[]
): { nodes: FlowNodeItem[]; edges: FlowEdgeItem[] } {
  const typeById = new Map<string, string>();
  const seenIds = new Set<string>();
  const nodes: FlowNodeItem[] = [];

  for (const file of files) {
    const id = sanitizeNodeId(file.path);
    if (seenIds.has(id)) continue; // กัน id ซ้ำ
    seenIds.add(id);

    typeById.set(id, file.fileType);

    nodes.push({
      id,
      label: file.path,
      path: file.path,
      fileType: file.fileType,
      position: { x: 0, y: 0 },
    });
  }

  // 3.7: สร้าง edges พร้อม label และ animated ถ้าปลายทางเป็น action
  const seenEdges = new Set<string>();
  const edges: FlowEdgeItem[] = [];

  relations.forEach((rel, i) => {
    const source = sanitizeNodeId(rel.source);
    const target = sanitizeNodeId(rel.target);
    const label = rel.label ?? '';
    const key = \`\${source}|\${target}|\${label}\`;
    if (seenEdges.has(key)) return;
    seenEdges.add(key);

    edges.push({
      id: \`e_\${source}_\${target}_\${i}\`,
      source,
      target,
      label: label || undefined,
      animated: typeById.get(target) === 'action' || typeById.get(source) === 'action',
      style: { stroke: getNodeColorConfig((typeById.get(target) ?? 'other') as NextFileType).border },
    } as FlowEdgeItem);
  });

  // 3.8: จัดวางพิกัดด้วย Dagre Hierarchical Layout (เรียงซ้ายไปขวาตาม Rank ความสัมพันธ์ ลดเส้นทับซ้อน)
  const NODE_WIDTH = 260;
  const NODE_HEIGHT = 80;

  try {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: 'LR',
      align: 'UL',
      nodesep: 55,
      ranksep: 170,
      edgesep: 35,
      marginx: 60,
      marginy: 60,
    });

    for (const node of nodes) {
      dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }

    for (const edge of edges) {
      if (seenIds.has(edge.source) && seenIds.has(edge.target)) {
        dagreGraph.setEdge(edge.source, edge.target);
      }
    }

    dagre.layout(dagreGraph);

    for (const node of nodes) {
      const nodeWithPos = dagreGraph.node(node.id);
      if (nodeWithPos) {
        node.position = {
          x: Math.round(nodeWithPos.x - NODE_WIDTH / 2),
          y: Math.round(nodeWithPos.y - NODE_HEIGHT / 2),
        };
      }
    }
  } catch (err) {
    console.warn('Dagre layout fallback:', err);
    nodes.forEach((node, idx) => {
      node.position = {
        x: (idx % 4) * 300,
        y: Math.floor(idx / 4) * 120,
      };
    });
  }

  return { nodes, edges };
}

/**
 * ฟังก์ชันสร้าง Mermaid Graph Syntax จากรายการความสัมพันธ์ของโค้ด
 */
export function generateMermaidSyntax(relations: CodeRelation[]): string {
  // 3.8: Empty State
  if (!relations || relations.length === 0) {
    return 'graph TD\\n  Empty["No local relations found"]';
  }

  // 3.9: หัว diagram
  const lines: string[] = ['graph TD'];
  const seen = new Set<string>();

  const esc = (s: string) => s.replace(/"/g, '#quot;');

  for (const rel of relations) {
    const from = sanitizeNodeId(rel.source);
    const to = sanitizeNodeId(rel.target);
    const label = rel.label ? esc(rel.label) : '';

    // 3.11: ตัดความสัมพันธ์ซ้ำ
    const key = \`\${from}|\${to}|\${label}\`;
    if (seen.has(key)) continue;
    seen.add(key);

    // 3.10: เส้นเชื่อมพร้อม label (ถ้ามี)
    const arrow = label ? \`-->|"\${label}"|\` : '-->';
    lines.push(\`  \${from}["\${esc(rel.source)}"] \${arrow} \${to}["\${esc(rel.target)}"]\`);
  }

  return lines.join('\\n');
}`;

const RAW_PAGE = `'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AnalysisResult, NextFileType, SideDrawerState, FlowNodeItem } from '../types';
import { FlowCanvas } from '../components/FlowCanvas';
import { SideDrawer } from '../components/SideDrawer';
import { 
  validateUrlInput, 
  formatRepoStats, 
  encodeShareableState, 
  decodeShareableState 
} from '../lib/ui-helper';
import { buildGitHubRawUrl, buildGitHubBlobUrl, parseGitHubUrl } from '../lib/github';

export default function HomePage() {
  // =========================================================================
  // พื้นที่ทำงานของ คนที่ 4: Dashboard & State Orchestrator
  // =========================================================================

  // TODO 4.11: สร้าง State สำหรับจัดการหน้าจอ
  const [url, setUrl] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('all');

  const [drawerState, setDrawerState] = useState<SideDrawerState>({
    isOpen: false,
    filePath: null,
    fileContent: null,
    fileType: null,
    githubRawUrl: null,
  });

  // TODO 4.13: ฟังก์ชัน handleSelectNode(filePath: string, fileType: NextFileType)
  async function handleSelectNode(
    filePath: string, 
    fileType: NextFileType,
    overrideOwner?: string,
    overrideRepo?: string,
    overrideBranch?: string
  ) {
    const targetUrl = url;
    const parsed = parseGitHubUrl(targetUrl);
    const owner = overrideOwner || result?.owner || parsed?.owner || '';
    const repo = overrideRepo || result?.repoName || parsed?.repo || '';
    const branch = overrideBranch || result?.branch || parsed?.branch || 'HEAD';

    if (!owner || !repo) {
      setErrorMessage('ไม่พบข้อมูล Repository หรือ Owner สำหรับดึงโค้ด');
      return;
    }

    const rawUrl = buildGitHubRawUrl(owner, repo, filePath, branch);
    const blobUrl = buildGitHubBlobUrl(owner, repo, filePath, branch);

    setDrawerState({
      isOpen: true,
      filePath,
      fileType,
      fileContent: null,
      githubRawUrl: blobUrl,
    });

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = \`Bearer \${token}\`;
      }

      let res = await fetch(rawUrl, { headers });
      // หาก fetch ด้วย branch ไม่สำเร็จ (เช่น กรณี branch เปลี่ยน) ให้ลองดึงด้วย HEAD
      if (!res.ok && res.status === 404 && branch !== 'HEAD') {
        const headRawUrl = buildGitHubRawUrl(owner, repo, filePath, 'HEAD');
        const headRes = await fetch(headRawUrl, { headers });
        if (headRes.ok) {
          res = headRes;
          setDrawerState((prev) => ({
            ...prev,
            githubRawUrl: buildGitHubBlobUrl(owner, repo, filePath, 'HEAD'),
          }));
        }
      }

      if (!res.ok) {
        throw new Error(\`ไม่สามารถดึงไฟล์ได้ (HTTP \${res.status})\`);
      }
      const code = await res.text();

      setDrawerState((prev) => ({
        ...prev,
        fileContent: code,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดโค้ด';
      setDrawerState((prev) => ({
        ...prev,
        fileContent: null,
      }));
      setErrorMessage(msg);
    }
  }

  // ฟังก์ชันกลางสำหรับการยิง API วิเคราะห์ข้อมูล
  const executeAnalysis = async (targetUrl: string, githubToken?: string, activeFilePath?: string | null) => {
    const validation = validateUrlInput(targetUrl);
    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage || 'URL ไม่ถูกต้อง');
      return;
    }

    const cleanUrl = targetUrl.trim();
    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, token: githubToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'ไม่สามารถวิเคราะห์ข้อมูลจาก GitHub ได้');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);

      // ถ้ามี activeFilePath จากการแชร์ ให้เปิด SideDrawer ดึงโค้ดอัตโนมัติ
      if (activeFilePath) {
        const parsed = parseGitHubUrl(cleanUrl);
        if (parsed) {
          void handleSelectNode(activeFilePath, 'other', parsed.owner, parsed.repo, parsed.branch);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // โหลด state จาก Query Parameter (?state=...) เมื่อโหลดหน้าเว็บครั้งแรก
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stateParam = new URLSearchParams(window.location.search).get('state');
    if (stateParam) {
      const decoded = decodeShareableState(stateParam);
      if (decoded?.url) {
        setUrl(decoded.url);
        void executeAnalysis(decoded.url, '', decoded.activeNode);
      }
    }
  }, []);

  // TODO 4.12: ฟังก์ชัน handleSubmit(e: React.FormEvent)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeAnalysis(url, token);
  };

  // TODO 4.14: ฟังก์ชัน handleShare()
  const handleShare = () => {
    if (!url || typeof window === 'undefined') return;
    const shareCode = encodeShareableState(
      url,
      drawerState.isOpen ? drawerState.filePath ?? undefined : undefined,
    );
    
    const shareUrl = \`\${window.location.origin}\${window.location.pathname}?state=\${shareCode}\`;

    if (navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(shareUrl).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      }).catch(() => {
        // Fallback / ignore clipboard failure
      });
    }
  };

  // คำนวณสถิติไฟล์ล่วงหน้าถ้ามีผลลัพธ์
  const stats = result ? formatRepoStats(result.totalFiles, result.filteredFilesCount) : null;

  // คำนวณจำนวนโหนดแยกตามประเภท
  const counts = useMemo(() => {
    if (!result) return {};
    const map: Record<string, number> = { all: result.nodes.length };
    result.nodes.forEach((n) => {
      map[n.fileType] = (map[n.fileType] || 0) + 1;
    });
    return map;
  }, [result]);

  // กรองโหนดตามเลเยอร์ที่ผู้ใช้เลือก
  const displayedNodes = useMemo(() => {
    if (!result) return [];
    if (filterType === 'all') return result.nodes;
    if (filterType === 'page') {
      return result.nodes.filter((n) => n.fileType === 'page' || n.fileType === 'middleware');
    }
    if (filterType === 'action') {
      return result.nodes.filter((n) => n.fileType === 'action' || n.fileType === 'api');
    }
    return result.nodes.filter((n) => n.fileType === filterType);
  }, [result, filterType]);

  // กรองเส้นเชื่อมเฉพาะที่ต้นทางและปลายทางยังคงแสดงผลอยู่
  const displayedEdges = useMemo(() => {
    if (!result) return [];
    if (filterType === 'all') return result.edges;
    const activeIds = new Set(displayedNodes.map((n: FlowNodeItem) => n.id));
    return result.edges.filter((e) => activeIds.has(e.source) && activeIds.has(e.target));
  }, [result, displayedNodes, filterType]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-white">
      {/* Top Engineering Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="18" r="3" />
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M18 9a9 9 0 0 1-9 9" />
                <line x1="6" y1="9" x2="6" y2="15" />
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">
              GitFlow Visualizer
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/chsnor/git_flowcahrt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl w-full mx-auto px-6 py-8 flex-1 flex flex-col gap-6">
        
        {/* Repository Input Section */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-8 space-y-1.5">
                <label htmlFor="github-url" className="block text-xs font-medium text-slate-300">
                  GitHub Repository URL <span className="text-rose-400">*</span>
                </label>
                <input
                  id="github-url"
                  type="text"
                  placeholder="https://github.com/chsnor/nextjs101"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/60 transition"
                  required
                />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label htmlFor="github-token" className="block text-xs font-medium text-slate-400 flex items-center justify-between">
                  <span>GitHub Token</span>
                  <span className="text-[10px] text-slate-500 font-normal">ทางเลือก (Private/Rate Limit)</span>
                </label>
                <input
                  id="github-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/60 transition"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-lg text-xs flex items-center justify-between">
                <span>{errorMessage}</span>
                <button 
                  type="button" 
                  onClick={() => setErrorMessage(null)} 
                  className="text-rose-400 hover:text-white text-xs ml-4"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                รองรับ App Router, Server Actions, Client Components และ Stores
              </span>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-white hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-medium text-xs rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-slate-950" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>กำลังวิเคราะห์สถาปัตยกรรม...</span>
                  </>
                ) : (
                  <span>เริ่มวิเคราะห์สถาปัตยกรรม</span>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Dashboard Status & Flowchart */}
        {result && (
          <section className="space-y-4 flex-1 flex flex-col">
            {/* Engineering Status Bar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-white tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {result.owner}/{result.repoName}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                  {result.branch || 'default'}
                </span>
              </div>

              {stats && (
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>วิเคราะห์ได้:</span>
                    <span className="text-sky-400 font-medium">
                      <span className="font-mono font-semibold">{stats.analyzedCount}</span> ไฟล์
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>คัดกรองออก:</span>
                    <span className="text-slate-400 font-medium">
                      <span className="font-mono text-slate-500">{stats.ignoredCount}</span> ({stats.rawCount > 0 ? Math.round((stats.ignoredCount / stats.rawCount) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>เส้นเชื่อม:</span>
                    <span className="font-mono text-slate-300 font-medium">{result.relations.length}</span>
                  </div>
                  {result.executionTimeMs !== undefined && (
                    <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-500">
                      <span>(<span className="font-mono">{Math.round(result.executionTimeMs)}</span>ms)</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  <span>{shareCopied ? 'คัดลอกเรียบร้อย!' : 'คัดลอก Share Link'}</span>
                </button>
              </div>
            </div>

            {/* Architecture Legend & Interactive Layer Filter Strip */}
            <div className="flex items-center gap-2 text-xs text-slate-400 px-1 overflow-x-auto pb-1">
              <span className="font-medium text-slate-500 mr-1 hidden sm:inline text-[11px]">กรองสถาปัตยกรรม:</span>
              
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={\`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-2 \${
                  filterType === 'all'
                    ? 'bg-slate-800 border-slate-600 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }\`}
              >
                <span>ทั้งหมด</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  {counts.all ?? 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType((prev) => (prev === 'page' ? 'all' : 'page'))}
                className={\`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-2 \${
                  filterType === 'page'
                    ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }\`}
              >
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                <span>Page / Route</span>
                {((counts.page ?? 0) + (counts.middleware ?? 0)) > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {(counts.page ?? 0) + (counts.middleware ?? 0)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterType((prev) => (prev === 'component' ? 'all' : 'component'))}
                className={\`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-2 \${
                  filterType === 'component'
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }\`}
              >
                <span className="w-2 h-2 rounded-full bg-[#f43f5e]" />
                <span>Component</span>
                {(counts.component ?? 0) > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {counts.component ?? 0}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterType((prev) => (prev === 'action' ? 'all' : 'action'))}
                className={\`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-2 \${
                  filterType === 'action'
                    ? 'bg-orange-500/15 border-orange-500/50 text-orange-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }\`}
              >
                <span className="w-2 h-2 rounded-full bg-[#fb923c]" />
                <span>Server Action</span>
                {((counts.action ?? 0) + (counts.api ?? 0)) > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {(counts.action ?? 0) + (counts.api ?? 0)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterType((prev) => (prev === 'store' ? 'all' : 'store'))}
                className={\`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-2 \${
                  filterType === 'store'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }\`}
              >
                <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
                <span>Store / State</span>
                {(counts.store ?? 0) > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {counts.store ?? 0}
                  </span>
                )}
              </button>
            </div>

            {/* Interactive Flow Canvas */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden h-[620px] relative shadow-lg">
              <FlowCanvas
                nodes={displayedNodes}
                edges={displayedEdges}
                onSelectNode={(filePath, fileType) => {
                  void handleSelectNode(filePath, fileType);
                }}
              />
            </div>
          </section>
        )}

        {/* Side Inspector Drawer (TODO 4.16) */}
        <SideDrawer
          isOpen={drawerState.isOpen}
          onClose={() => setDrawerState((prev) => ({ ...prev, isOpen: false }))}
          filePath={drawerState.filePath ?? ''}
          fileType={drawerState.fileType ?? 'other'}
          rawCode={drawerState.fileContent ?? ''}
          githubRawUrl={drawerState.githubRawUrl ?? ''}
        />

      </div>
    </main>
  );
}`;

const RAW_UIHELPER = `// src/lib/ui-helper.ts

/**
 * ฟังก์ชันช่วยตรวจสอบความถูกต้องและความปลอดภัยของ URL ก่อนส่งคำขอ
 */
export function validateUrlInput(input: string): { isValid: boolean; errorMessage: string | null } {
  // TODO 4.1: ตรวจสอบความยาวและค่าว่าง (Empty & Whitespace Check)
  if (!input || !input.trim()) {
    return { isValid: false, errorMessage: 'กรุณากรอก GitHub URL' };
  }

  const trimmed = input.trim();
  const lowerInput = trimmed.toLowerCase();

  // TODO 4.2: ตรวจสอบความปลอดภัยเบื้องต้น (XSS / Suspicious Input Guard)
  // ตรวจสอบแบบ string search และการเช็คแท็กพื้นฐานอย่างปลอดภัย
  const containsXss = lowerInput.includes('<script') || 
                      lowerInput.includes('javascript:') || 
                      (lowerInput.includes('<') && lowerInput.includes('>'));

  if (containsXss) {
    return { isValid: false, errorMessage: 'URL ต้องมาจาก github.com เท่านั้น' };
  }

  // TODO 4.3: ตรวจสอบโดเมน (Domain Verification) - ต้องมี github.com
  if (!trimmed.includes('github.com')) {
    return { isValid: false, errorMessage: 'URL ต้องมาจาก github.com เท่านั้น' };
  }

  // TODO 4.4: เมื่อผ่านการตรวจสอบทั้งหมด ให้ส่ง isValid: true
  return { isValid: true, errorMessage: null };
}

/**
 * ฟังก์ชันคำนวณและจัดรูปแบบตัวเลขสถิติสำหรับนำไปแสดงบนหน้าจอ Dashboard
 */
export function formatRepoStats(totalFiles: number, filteredFiles: number): {
  rawCount: number;
  analyzedCount: number;
  ignoredCount: number;
  summaryText: string;
} {
  // TODO 4.5: ป้องกันข้อผิดพลาดทางตัวเลข (Math Safety)
  const rawCount = Math.max(0, Number.isFinite(totalFiles) ? totalFiles : 0);
  const analyzedCount = Math.max(0, Number.isFinite(filteredFiles) ? filteredFiles : 0);
  const ignoredCount = Math.max(0, rawCount - analyzedCount);

  // TODO 4.6: สร้างข้อความสรุปผล (Summary Text Construction)
  const dropPercentage = rawCount > 0 ? Math.round((ignoredCount / rawCount) * 100) : 0;
  const summaryText = \`วิเคราะห์โค้ดทั้งหมด \${analyzedCount} ไฟล์ จากทั้งหมด \${rawCount} ไฟล์ (ละเว้น \${ignoredCount} ไฟล์ คิดเป็น \${dropPercentage}%)\`;

  // TODO 4.7: ส่งคืนค่าในรูปแบบ Object
  return {
    rawCount,
    analyzedCount,
    ignoredCount,
    summaryText,
  };
}

/**
 * ฟังก์ชันคำนวณคะแนนสุขภาพสถาปัตยกรรม (Architecture Health Score)
 */
export function calculateHealthScore(totalRelations: number, filteredFiles: number): {
  grade: 'A' | 'B' | 'C' | 'N/A';
  ratio: number;
  description: string;
} {
  if (!filteredFiles || filteredFiles <= 0) {
    return {
      grade: 'N/A',
      ratio: 0,
      description: 'ไม่พบไฟล์ที่วิเคราะห์ได้ หรือไม่มีข้อมูลไฟล์',
    };
  }

  const validRelations = Math.max(0, Number.isFinite(totalRelations) ? totalRelations : 0);
  const computedRatio = validRelations / filteredFiles;
  const ratio = Math.round(computedRatio * 100) / 100;

  if (ratio >= 0.8 && ratio <= 2.5) {
    return {
      grade: 'A',
      ratio,
      description: 'โครงสร้างแยกส่วนกำลังพอดี ไม่ซับซ้อนเกินไป (Balanced Coupling)',
    };
  }

  if (ratio > 2.5 && ratio <= 4.0) {
    return {
      grade: 'B',
      ratio,
      description: 'เริ่มมีความผูกพันกันค่อนข้างแน่น (High Coupling)',
    };
  }

  return {
    grade: 'C',
    ratio,
    description: ratio < 0.8 
      ? 'แทบไม่มีการแยกส่วนคอมโพเนนต์ หรือการเชื่อมโยงต่ำเกินไป' 
      : 'โค้ดผูกติดกันแน่นเกินไป แก้ไขหรือดูแลรักษาได้ยาก (Tight Coupling)',
  };
}

/**
 * ฟังก์ชันเข้ารหัส State ของหน้าจอเพื่อสร้าง URL ที่สามารถแชร์ได้
 */
export function encodeShareableState(url: string, activeNode?: string): string {
  if (!url) return '';

  try {
    const payload = { url, activeNode: activeNode || null };
    const jsonString = JSON.stringify(payload);
    
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return window.btoa(encodeURIComponent(jsonString));
    }
    
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(encodeURIComponent(jsonString), 'utf-8').toString('base64');
    }

    return '';
  } catch {
    return '';
  }
}

/**
 * ฟังก์ชันถอดรหัส State จาก URL query string
 */
export function decodeShareableState(encodedStr: string): { url: string; activeNode?: string } | null {
  if (!encodedStr || typeof encodedStr !== 'string') return null;

  try {
    let rawDecoded = '';
    
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      rawDecoded = window.atob(encodedStr);
    } else if (typeof Buffer !== 'undefined') {
      rawDecoded = Buffer.from(encodedStr, 'base64').toString('utf-8');
    } else {
      return null;
    }

    let jsonString = rawDecoded;
    try {
      jsonString = decodeURIComponent(rawDecoded);
    } catch {
      // If rawDecoded is already valid JSON without percent-encoding, keep it
    }

    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === 'object' && typeof parsed.url === 'string') {
      return {
        url: parsed.url,
        activeNode: typeof parsed.activeNode === 'string' ? parsed.activeNode : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}`;

const RAW_CODEVIEWER = `import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup';

/**
 * 1. ตรวจสอบภาษาจากนามสกุลไฟล์
 */
export function getLanguageFromPath(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') return 'clike';

  const cleanPath = filePath.split('?')[0].split('#')[0];
  const lastDot = cleanPath.lastIndexOf('.');

  // ถ้าไม่มีจุด หรือไม่มีนามสกุลไฟล์ (เช่น Dockerfile)
  if (lastDot === -1 || lastDot === cleanPath.length - 1) {
    return 'clike';
  }

  const extension = cleanPath.slice(lastDot + 1).toLowerCase();

  switch (extension) {
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'tsx';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'jsx':
      return 'jsx';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'html':
    case 'xml':
    case 'svg':
      return 'markup';
    default:
      return 'clike';
  }
}

export interface FormattedCodeResult {
  snippet: string;
  code: string;
  totalLines: number;
  isTruncated: boolean;
  displayedLines: number;
}

/**
 * 2. ตัดทอนและนับบรรทัดของโค้ด
 */
export function formatCodeSnippet(rawCode: string, maxLines: number = 300): FormattedCodeResult {
  if (typeof rawCode !== 'string') {
    return {
      snippet: '',
      code: '',
      totalLines: 0,
      isTruncated: false,
      displayedLines: 0,
    };
  }

  const lines = rawCode.split('\\n');
  const totalLines = lines.length;

  if (totalLines > maxLines) {
    const truncatedCode = lines.slice(0, maxLines).join('\\n');
    return {
      snippet: truncatedCode,
      code: truncatedCode,
      totalLines,
      isTruncated: true,
      displayedLines: maxLines,
    };
  }

  return {
    snippet: rawCode,
    code: rawCode,
    totalLines,
    isTruncated: false,
    displayedLines: totalLines,
  };
}

/**
 * 3. ทำ Syntax Highlighting ปลอดภัยต่อการเรนเดอร์
 */
export function highlightCodeWithPrism(code: string, language: string): string {
  if (!code) return '';

  const grammar = Prism.languages[language];

  if (!grammar) {
    // Escape HTML กรณีไม่รู้จักภาษา เพื่อความปลอดภัยและไม่ crash
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  try {
    return Prism.highlight(code, grammar, language);
  } catch {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}`;

const RAW_FLOWCANVAS = `'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { FlowNodeItem, FlowEdgeItem, NextFileType } from '../types';
import { getNodeColorConfig } from '../lib/generator';

export interface FlowCanvasProps {
  nodes: FlowNodeItem[];
  edges: FlowEdgeItem[];
  onSelectNode?: (path: string, fileType: NextFileType) => void;
}

type NodeData = {
  label: React.ReactNode;
  path: string;
  fileType: NextFileType;
  [key: string]: unknown;
};

type LabelFilterMode = 'smart' | 'all' | 'none';
type TraceMode = 'full' | 'direct';

const COLUMNS = 4;
const COL_WIDTH = 320;
const ROW_HEIGHT = 120;

/**
 * คำนวณโหนดและเส้นเชื่อมทั้งหมดในสายการไหล (Transitive Flow Path / Upstream & Downstream Traverse)
 */
function computeTracePath(
  selectedNodeId: string | null,
  edges: FlowEdgeItem[],
  traceMode: TraceMode
): { connectedNodeIds: Set<string>; connectedEdgeIds: Set<string> } {
  if (!selectedNodeId) {
    return { connectedNodeIds: new Set(), connectedEdgeIds: new Set() };
  }

  const connectedNodeIds = new Set<string>();
  const connectedEdgeIds = new Set<string>();

  // กรณี 1-Step (เฉพาะโหนดที่แตะกันตรงๆ)
  if (traceMode === 'direct') {
    for (const edge of edges) {
      if (edge.source === selectedNodeId) {
        connectedNodeIds.add(edge.target);
        connectedEdgeIds.add(edge.id);
      }
      if (edge.target === selectedNodeId) {
        connectedNodeIds.add(edge.source);
        connectedEdgeIds.add(edge.id);
      }
    }
    return { connectedNodeIds, connectedEdgeIds };
  }

  // กรณี Full Chain (สืบย้อนสายต้นทาง Upstream และสืบต่อไปปลายทาง Downstream ครบทั้งวงรอบ)
  // 1. Upstream (Ancestors: ใครเรียกหรือส่งต่อข้อมูลมาหาโหนดนี้บ้าง)
  const upQueue: string[] = [selectedNodeId];
  const visitedUp = new Set<string>([selectedNodeId]);

  while (upQueue.length > 0) {
    const curr = upQueue.shift()!;
    for (const edge of edges) {
      if (edge.target === curr) {
        connectedEdgeIds.add(edge.id);
        if (!visitedUp.has(edge.source)) {
          visitedUp.add(edge.source);
          connectedNodeIds.add(edge.source);
          upQueue.push(edge.source);
        }
      }
    }
  }

  // 2. Downstream (Descendants: โหนดนี้เรียกใช้หรือกระจายข้อมูลไปหาใครบ้าง)
  const downQueue: string[] = [selectedNodeId];
  const visitedDown = new Set<string>([selectedNodeId]);

  while (downQueue.length > 0) {
    const curr = downQueue.shift()!;
    for (const edge of edges) {
      if (edge.source === curr) {
        connectedEdgeIds.add(edge.id);
        if (!visitedDown.has(edge.target)) {
          visitedDown.add(edge.target);
          connectedNodeIds.add(edge.target);
          downQueue.push(edge.target);
        }
      }
    }
  }

  return { connectedNodeIds, connectedEdgeIds };
}

/**
 * แปลง FlowNodeItem[] เป็น Node[] ของ React Flow พร้อมรองรับการ Focus / Highlight
 */
function toRfNodes(
  items: FlowNodeItem[],
  selectedNodeId: string | null,
  connectedNodeIds: Set<string>
): Node<NodeData>[] {
  return (items ?? []).map((item, index) => {
    const pos = (item as unknown as { position?: { x: number; y: number } }).position ?? {
      x: (index % COLUMNS) * COL_WIDTH,
      y: Math.floor(index / COLUMNS) * ROW_HEIGHT,
    };
    const colors = getNodeColorConfig(item.fileType);

    const parts = item.path.split('/');
    const fileName = parts.pop() || item.path;
    const folderPath = parts.join('/');

    const isSelected = selectedNodeId === item.id;
    const isConnected = selectedNodeId ? isSelected || connectedNodeIds.has(item.id) : true;
    const opacity = isConnected ? 1 : 0.22;

    const nodeLabel = (
      <div className="flex flex-col gap-1.5 text-left select-none">
        <div className="flex items-center justify-between">
          <span
            className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{ background: \`\${colors.border}1a\`, color: colors.border, border: \`1px solid \${colors.border}33\` }}
          >
            {item.fileType}
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full transition-transform"
            style={{
              background: colors.border,
              boxShadow: isSelected ? \`0 0 10px \${colors.border}\` : isConnected && selectedNodeId ? \`0 0 6px \${colors.border}80\` : 'none',
              transform: isSelected ? 'scale(1.5)' : 'scale(1)',
            }}
          />
        </div>
        <div
          className={\`font-semibold text-xs truncate transition-colors \${
            isSelected ? 'text-white font-bold' : isConnected ? 'text-slate-100' : 'text-slate-400'
          }\`}
          title={item.path}
        >
          {fileName}
        </div>
        {folderPath && (
          <div className="text-[10px] text-slate-400 truncate font-mono" title={folderPath}>
            {folderPath}
          </div>
        )}
      </div>
    );

    return {
      id: item.id,
      position: pos,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: { label: nodeLabel, path: item.path, fileType: item.fileType },
      style: {
        border: isSelected
          ? \`2px solid \${colors.border}\`
          : isConnected && selectedNodeId
          ? \`1.5px solid \${colors.border}aa\`
          : \`1px solid \${colors.border}40\`,
        background: '#0b1120',
        color: '#f8fafc',
        borderRadius: 12,
        padding: '12px 14px',
        fontSize: 12,
        width: 260,
        opacity,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isSelected
          ? \`0 0 24px -2px \${colors.border}60, 0 10px 25px -5px rgba(0, 0, 0, 0.7)\`
          : isConnected && selectedNodeId
          ? \`0 0 16px -4px \${colors.border}35, 0 8px 20px -4px rgba(0, 0, 0, 0.5)\`
          : '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      },
    };
  });
}

/**
 * ป้ายกำกับที่เป็นคำซ้ำซ้อนระดับ boilerplate ซึ่งทำให้ผังรกเมื่อซ้อนทับกัน
 */
const BOILERPLATE_LABELS = new Set(['shared UI', 'uses component', 'references']);

/**
 * แปลง FlowEdgeItem[] เป็น Edge[] ของ React Flow พร้อมเส้นโค้ง Smooth Bezier และระบบ Focus ตลอดสาย
 */
function toRfEdges(
  items: FlowEdgeItem[],
  selectedNodeId: string | null,
  connectedEdgeIds: Set<string>,
  labelMode: LabelFilterMode
): Edge[] {
  return (items ?? []).map((item) => {
    const isConnected = selectedNodeId
      ? connectedEdgeIds.has(item.id)
      : true;

    // เลือกการแสดง Label ตามโหมด
    let displayLabel: string | undefined = undefined;
    if (labelMode === 'all') {
      displayLabel = item.label;
    } else if (labelMode === 'smart') {
      // แสดงเฉพาะคำสำคัญ หรือเส้นที่กำลังถูก Focus ตลอดสาย
      if (selectedNodeId && isConnected) {
        displayLabel = item.label;
      } else if (item.label && !BOILERPLATE_LABELS.has(item.label)) {
        displayLabel = item.label;
      }
    }

    const strokeColor = item.style?.stroke || '#64748b';
    const isHighlighted = selectedNodeId && isConnected;
    const isDimmed = selectedNodeId && !isConnected;

    return {
      id: item.id,
      source: item.source,
      target: item.target,
      label: displayLabel,
      animated: isHighlighted ? true : Boolean(item.animated),
      type: 'bezier',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: isHighlighted ? (strokeColor as string) : isDimmed ? '#1e293b' : '#64748b',
      },
      style: {
        stroke: isHighlighted ? (strokeColor as string) : isDimmed ? '#1e293b' : (strokeColor as string),
        strokeWidth: isHighlighted ? 2.5 : 1.5,
        opacity: isDimmed ? 0.06 : 0.85,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      labelStyle: {
        fill: isHighlighted ? '#ffffff' : '#94a3b8',
        fontSize: 10,
        fontWeight: isHighlighted ? 600 : 500,
        fontFamily: 'var(--font-sans)',
      },
      labelBgStyle: {
        fill: '#090d16',
        fillOpacity: 0.92,
        stroke: isHighlighted ? strokeColor : '#1e293b',
        strokeWidth: 1,
      },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 6,
    };
  });
}

/**
 * คอมโพเนนต์ผืนผ้าใบ Interactive Flowchart
 * รองรับการซูม แพน ย้ายโหนด คลิก Focus เส้นทางเชื่อมโยงตลอดสาย (Full Trace) และปรับโหมดป้ายกำกับ
 */
export function FlowCanvas({ nodes, edges, onSelectNode }: FlowCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [labelMode, setLabelMode] = useState<LabelFilterMode>('smart');
  const [traceMode, setTraceMode] = useState<TraceMode>('full');
  const [showMiniMap, setShowMiniMap] = useState<boolean>(false);

  // คำนวณเซตของโหนดและเส้นเชื่อมที่เชื่อมโยงกับ selectedNodeId ตลอดสาย (Ancestors + Descendants)
  const { connectedNodeIds, connectedEdgeIds } = useMemo(
    () => computeTracePath(selectedNodeId, edges, traceMode),
    [selectedNodeId, edges, traceMode]
  );

  const initialNodes = useMemo(
    () => toRfNodes(nodes, selectedNodeId, connectedNodeIds),
    [nodes, selectedNodeId, connectedNodeIds]
  );

  const initialEdges = useMemo(
    () => toRfEdges(edges, selectedNodeId, connectedEdgeIds, labelMode),
    [edges, selectedNodeId, connectedEdgeIds, labelMode]
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node<NodeData>>(initialNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  useEffect(() => {
    setRfNodes(initialNodes);
  }, [initialNodes, setRfNodes]);

  useEffect(() => {
    setRfEdges(initialEdges);
  }, [initialEdges, setRfEdges]);

  // ฟังก์ชันล้างการ Focus โหนด
  const handleClearFocus = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="h-[550px] w-full rounded-2xl border border-dashed border-slate-800 bg-slate-950 flex items-center justify-center text-sm text-slate-500 font-sans">
        ยังไม่มีข้อมูลโหนดให้แสดง
      </div>
    );
  }

  return (
    <div className="h-[620px] w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden relative font-sans">
      {/* Floating Canvas Toolbar */}
      <div className="absolute top-3.5 right-3.5 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-lg text-xs">
        {/* Clear Focus Button */}
        {selectedNodeId && (
          <button
            type="button"
            onClick={handleClearFocus}
            className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition flex items-center gap-1 cursor-pointer font-medium"
            title="คลิกเพื่อยกเลิกการ Focus โหนด"
          >
            <span>✕ ล้าง Focus</span>
          </button>
        )}

        {/* Trace Mode Switcher (Full Path vs Direct) */}
        {selectedNodeId && (
          <div className="flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setTraceMode('full')}
              className={\`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer \${
                traceMode === 'full'
                  ? 'bg-sky-500/20 text-sky-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }\`}
              title="เรืองแสงสืบย้อนต้นทางและปลายทางครบทั้งสายการไหล"
            >
              ทั้งสาย
            </button>
            <button
              type="button"
              onClick={() => setTraceMode('direct')}
              className={\`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer \${
                traceMode === 'direct'
                  ? 'bg-sky-500/20 text-sky-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }\`}
              title="เรืองแสงเฉพาะโหนดที่เชื่อมตรง 1 สเต็ป"
            >
              1 สเต็ป
            </button>
          </div>
        )}

        {/* Label Mode Switcher */}
        <div className="flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-slate-800">
          <button
            type="button"
            onClick={() => setLabelMode('smart')}
            className={\`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer \${
              labelMode === 'smart'
                ? 'bg-slate-800 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }\`}
            title="ซ่อนคำซ้ำซ้อน แสดงเฉพาะเส้นทางสำคัญ"
          >
            สมาร์ท
          </button>
          <button
            type="button"
            onClick={() => setLabelMode('all')}
            className={\`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer \${
              labelMode === 'all'
                ? 'bg-slate-800 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }\`}
            title="แสดงป้ายกำกับความสัมพันธ์ทุกเส้น"
          >
            ป้ายทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => setLabelMode('none')}
            className={\`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer \${
              labelMode === 'none'
                ? 'bg-slate-800 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }\`}
            title="ซ่อนป้ายกำกับทั้งหมดเพื่อความสบายตา"
          >
            ปิดป้าย
          </button>
        </div>

        {/* MiniMap Toggle */}
        <button
          type="button"
          onClick={() => setShowMiniMap((prev) => !prev)}
          className={\`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 \${
            showMiniMap
              ? 'bg-slate-800 border-slate-700 text-white'
              : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }\`}
          title="เปิด/ปิด แผนที่ย่อ"
        >
          <span>แผนที่ย่อ</span>
        </button>
      </div>

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
          const data = node.data as NodeData;
          onSelectNode?.(data.path, data.fileType);
        }}
        onPaneClick={handleClearFocus}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        proOptions={{ hideAttribution: true }}
        onlyRenderVisibleElements={true}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
        <Controls position="bottom-left" />
        {showMiniMap && (
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            maskColor="rgba(2, 6, 23, 0.75)"
            style={{
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              width: 170,
              height: 110,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
            }}
            nodeColor={(node) => getNodeColorConfig((node.data as NodeData).fileType).border}
          />
        )}
      </ReactFlow>
    </div>
  );
}`;

const RAW_SIDEDRAWER = `'use client';

import React, { useState, useMemo } from 'react';
import { getLanguageFromPath, formatCodeSnippet, highlightCodeWithPrism } from '@/lib/code-viewer';

export interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filePath?: string;
  fileType?: string;
  rawCode?: string;
  githubRawUrl?: string;
}

export function SideDrawer({
  isOpen,
  onClose,
  filePath = '',
  fileType = 'other',
  rawCode = '',
  githubRawUrl = '',
}: SideDrawerProps) {
  const [copied, setCopied] = useState(false);

  const { formattedCode, totalLines, isTruncated, language, highlightedHtml } = useMemo(() => {
    const lang = getLanguageFromPath(filePath);
    const snippet = formatCodeSnippet(rawCode, 300);
    return {
      formattedCode: snippet.code,
      totalLines: snippet.totalLines,
      isTruncated: snippet.isTruncated,
      language: lang,
      highlightedHtml: highlightCodeWithPrism(snippet.code, lang),
    };
  }, [filePath, rawCode]);

  const handleCopy = async () => {
    if (!rawCode) return;
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Code Inspector Drawer"
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-slate-900 border-l border-slate-700 text-slate-100 shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span data-testid="file-type-badge" className="rounded px-2 py-0.5 text-xs font-semibold uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {fileType}
            </span>
            <span className="text-xs text-slate-400">({language})</span>
          </div>
          <h2 title={filePath} className="truncate text-sm font-mono text-slate-200">
            {filePath || 'No file selected'}
          </h2>
        </div>
        <button onClick={onClose} aria-label="Close drawer" className="p-2 text-slate-400 hover:text-white">✕</button>
      </div>

      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40 px-6 py-2 text-xs text-slate-400">
        <div>
          <span>{totalLines} lines</span>
          {isTruncated && <span className="ml-2 text-amber-400">(Truncated to first 300 lines)</span>}
        </div>
        <div className="flex items-center gap-2">
          {githubRawUrl && (
            <a href={githubRawUrl} target="_blank" rel="noopener noreferrer" className="rounded bg-slate-800 px-2.5 py-1 text-slate-300">
              Open on GitHub ↗
            </a>
          )}
          <button onClick={handleCopy} className="rounded bg-slate-800 px-2.5 py-1 text-slate-300">
            {copied ? '✓ Copied' : 'Copy Code'}
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto p-6 font-mono text-sm bg-slate-950">
        <pre className="m-0 overflow-x-auto">
          <code className={\`language-\${language}\`} dangerouslySetInnerHTML={{ __html: highlightedHtml || formattedCode }} />
        </pre>
      </div>
    </div>
  );
}

// รองรับทั้งแบบ Named Export และ Default Export
export default SideDrawer;`;

const RAW_LAYOUT = `import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GitFlow Visualizer",
  description: "Next.js App Router Architecture & Flowchart Visualizer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={\`\${geistSans.variable} \${geistMono.variable} \${ibmPlexSansThai.variable} h-full antialiased\`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

`;

const RAW_TYPES = `// src/types/index.ts

export type NextFileType = 'page' | 'layout' | 'action' | 'middleware' | 'store' | 'component' | 'api' | 'other';

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url?: string;
}

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch?: string;
}

export interface CodeRelation {
  source: string;
  target: string;
  type?: 'import' | 'action' | 'event' | 'middleware';
  label?: string;
}

export interface FlowNodeItem {
  id: string;
  label: string;
  fileType: NextFileType;
  path: string;
  position: { x: number; y: number };
}

export interface FlowEdgeItem {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: { stroke?: string; [key: string]: unknown };
}

export interface AnalysisResult {
  repoName: string;
  owner: string;
  branch?: string;
  totalFiles: number;
  filteredFilesCount: number;
  relations: CodeRelation[];
  nodes: FlowNodeItem[];
  edges: FlowEdgeItem[];
  mermaidSyntax: string;
  isCached?: boolean;
  executionTimeMs?: number;
}

export interface SideDrawerState {
  isOpen: boolean;
  filePath: string | null;
  fileContent: string | null;
  fileType: NextFileType | null;
  githubRawUrl: string | null;
}
`;

const RAW_GLOBALS = `@import "tailwindcss";
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-thai), var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

:root {
  --background: #090d16;
  --foreground: #f1f5f9;
}

body {
  font-family: var(--font-thai), var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: var(--background);
  color: var(--foreground);
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Impeccable Browser Surfaces */
::selection {
  background: rgba(56, 189, 248, 0.25);
  color: #ffffff;
}

/* Custom Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #090d16;
}

::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: #334155;
}
`;

const RAW_TEST1 = `// src/tests/1_github.test.ts
import { describe, it, expect } from 'vitest';
import { parseGitHubUrl, buildGitHubApiUrl, buildGitHubHeaders, buildGitHubRawUrl, buildGitHubBlobUrl } from '../lib/github';

describe('คนที่ 1: github.ts (Data Ingestion & GitHub Service)', () => {
  describe('parseGitHubUrl', () => {
    it('แกะ url แบบ https ปกติได้', () => {
      expect(parseGitHubUrl('https://github.com/chsnor/testauth')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('แกะ url แบบ http ได้', () => {
      expect(parseGitHubUrl('http://github.com/chsnor/testauth')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('แกะ url ที่ไม่มี https นำหน้าได้', () => {
      expect(parseGitHubUrl('github.com/chsnor/testauth')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('แกะ url ที่มี www ได้', () => {
      expect(parseGitHubUrl('https://www.github.com/chsnor/testauth')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('ตัด .git ท้าย url ออกได้', () => {
      expect(parseGitHubUrl('https://github.com/chsnor/testauth.git')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('ตัด slash ท้าย url หลายตัวได้', () => {
      expect(parseGitHubUrl('https://github.com/chsnor/testauth///')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('ตัด query string กับ hash ออกได้', () => {
      expect(parseGitHubUrl('https://github.com/chsnor/testauth?tab=repositories#readme')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('ตัด path ข้างหลัง เช่น /tree/main ออกได้', () => {
      expect(parseGitHubUrl('https://github.com/chsnor/testauth/tree/main/src')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('ถ้าใส่ค่าว่างต้องได้ null', () => {
      expect(parseGitHubUrl('')).toBeNull();
      expect(parseGitHubUrl('    ')).toBeNull();
    });

    it('ถ้าไม่ใช่เว็บ github ต้องได้ null', () => {
      expect(parseGitHubUrl('https://gitlab.com/chsnor/testauth')).toBeNull();
      expect(parseGitHubUrl('https://google.com')).toBeNull();
    });

    it('ถ้าไม่มีชื่อ repo ต้องได้ null', () => {
      expect(parseGitHubUrl('https://github.com/chsnor')).toBeNull();
      expect(parseGitHubUrl('https://github.com/chsnor/')).toBeNull();
    });
  });

  describe('buildGitHubApiUrl', () => {
    it('ต่อ url ดึง tree เป็น main ตามปกติ', () => {
      expect(buildGitHubApiUrl('chsnor', 'testauth')).toBe(
        'https://api.github.com/repos/chsnor/testauth/git/trees/main?recursive=1'
      );
    });

    it('ต่อ url ดึง branch อื่นได้', () => {
      expect(buildGitHubApiUrl('chsnor', 'testauth', 'master')).toBe(
        'https://api.github.com/repos/chsnor/testauth/git/trees/master?recursive=1'
      );
    });
  });

  describe('buildGitHubHeaders (รองรับ Token ทางเลือก)', () => {
    it('ถ้าไม่ใส่ token มา ต้องมี header User-Agent ขั้นต่ำ', () => {
      const headers = buildGitHubHeaders();
      expect(headers['User-Agent']).toBe('GitFlow-Visualizer');
      expect(headers['Authorization']).toBeUndefined();
    });

    it('ถ้าใส่ token ว่างเปล่ามา ต้องไม่มี Authorization', () => {
      const headers = buildGitHubHeaders('   ');
      expect(headers['Authorization']).toBeUndefined();
    });

    it('ถ้าใส่ token มา ต้องแนบ Bearer Token ใน Authorization header ถูกต้อง', () => {
      const headers = buildGitHubHeaders('ghp_myfaketoken12345');
      expect(headers['User-Agent']).toBe('GitFlow-Visualizer');
      expect(headers['Authorization']).toBe('Bearer ghp_myfaketoken12345');
    });

    it('ถ้า token มีเว้นวรรคหัวท้าย ต้องตัด trim ให้อัตโนมัติ', () => {
      const headers = buildGitHubHeaders('  ghp_myfaketoken12345  ');
      expect(headers['Authorization']).toBe('Bearer ghp_myfaketoken12345');
    });
  });

  describe('buildGitHubRawUrl (ดึงโค้ดจริงสำหรับ Side Inspector)', () => {
    it('สร้าง URL ดึง raw code จาก GitHub ได้ถูกต้อง', () => {
      const url = buildGitHubRawUrl('chsnor', 'testauth', 'src/app/page.tsx', 'main');
      expect(url).toBe('https://raw.githubusercontent.com/chsnor/testauth/main/src/app/page.tsx');
    });

    it('ใช้ branch เริ่มต้นเป็น main หากไม่ระบุ branch', () => {
      const url = buildGitHubRawUrl('chsnor', 'testauth', 'src/actions/auth.ts');
      expect(url).toBe('https://raw.githubusercontent.com/chsnor/testauth/main/src/actions/auth.ts');
    });

    it('ป้องกันบั๊กสลับตำแหน่งระหว่าง filePath และ branch', () => {
      const url = buildGitHubRawUrl('chsnor', 'testauth', 'main', 'src/app/page.tsx');
      expect(url).toBe('https://raw.githubusercontent.com/chsnor/testauth/main/src/app/page.tsx');
    });
  });

  describe('buildGitHubBlobUrl (เปิดดูไฟล์บนหน้าเว็บ GitHub)', () => {
    it('สร้าง URL สำหรับเปิดดูไฟล์บน GitHub blob viewer ได้ถูกต้อง', () => {
      const url = buildGitHubBlobUrl('chsnor', 'nextjs101', 'src/app/page.tsx', 'main');
      expect(url).toBe('https://github.com/chsnor/nextjs101/blob/main/src/app/page.tsx');
    });
  });
});
`;

const RAW_TEST2 = `// src/tests/2_parser.test.ts
import { describe, it, expect } from 'vitest';
import { filterTreeFiles, detectNextFileType, extractImportsFromCode, extractActionTriggers } from '../lib/parser';
import { GitHubTreeItem } from '../types';

describe('คนที่ 2: parser.ts (AST & Event Parser Engine)', () => {
  describe('filterTreeFiles', () => {
    it('กรองพวก node_modules, lockfile, รูปภาพ, config ทิ้ง เอาเฉพาะไฟล์โค้ด', () => {
      const items: GitHubTreeItem[] = [
        { path: 'node_modules/@types/react/index.d.ts', mode: '100644', type: 'blob', sha: '1' },
        { path: '.next/server/pages/index.js', mode: '100644', type: 'blob', sha: '2' },
        { path: 'dist/bundle.js', mode: '100644', type: 'blob', sha: '3' },
        { path: 'build/index.html', mode: '100644', type: 'blob', sha: '4' },
        { path: 'public/images/logo.png', mode: '100644', type: 'blob', sha: '5' },
        { path: 'package-lock.json', mode: '100644', type: 'blob', sha: '6' },
        { path: 'pnpm-lock.yaml', mode: '100644', type: 'blob', sha: '7' },
        { path: '.env.local', mode: '100644', type: 'blob', sha: '8' },
        { path: '.gitignore', mode: '100644', type: 'blob', sha: '9' },
        { path: 'tsconfig.json', mode: '100644', type: 'blob', sha: '10' },
        { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '11' },
        { path: 'src/components/Button.tsx', mode: '100644', type: 'blob', sha: '12' },
        { path: 'src/lib/auth.ts', mode: '100644', type: 'blob', sha: '13' },
      ];

      const filtered = filterTreeFiles(items);
      const paths = filtered.map(i => i.path);

      expect(paths).toEqual([
        'src/app/page.tsx',
        'src/components/Button.tsx',
        'src/lib/auth.ts'
      ]);
    });

    it('ไม่เอาโฟลเดอร์มาคิด เอาเฉพาะไฟล์ที่เป็น blob', () => {
      const items: GitHubTreeItem[] = [
        { path: 'src', mode: '040000', type: 'tree', sha: '100' },
        { path: 'src/app', mode: '040000', type: 'tree', sha: '101' },
        { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '102' }
      ];

      const filtered = filterTreeFiles(items);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].path).toBe('src/app/page.tsx');
    });

    it('ถ้ามีไฟล์โค้ดมากกว่า maxLimit ให้ตัดทอนเฉพาะ maxLimit ไฟล์แรกเพื่อความปลอดภัย', () => {
      const items: GitHubTreeItem[] = Array.from({ length: 30 }, (_, i) => ({
        path: \`src/components/Card\${i}.tsx\`,
        mode: '100644',
        type: 'blob',
        sha: \`sha-\${i}\`
      }));

      const filtered = filterTreeFiles(items, 10);
      expect(filtered).toHaveLength(10);
      expect(filtered[0].path).toBe('src/components/Card0.tsx');
      expect(filtered[9].path).toBe('src/components/Card9.tsx');
    });
  });

  describe('detectNextFileType (จำแนกเลเยอร์สถาปัตยกรรม Next.js)', () => {
    it('ตรวจจับหน้าจอ page.tsx เป็น page', () => {
      expect(detectNextFileType('src/app/dashboard/page.tsx')).toBe('page');
    });

    it('ตรวจจับ layout.tsx เป็น layout', () => {
      expect(detectNextFileType('src/app/(auth)/layout.tsx')).toBe('layout');
    });

    it('ตรวจจับ middleware.ts หรือ proxy.ts เป็น middleware', () => {
      expect(detectNextFileType('src/middleware.ts')).toBe('middleware');
      expect(detectNextFileType('src/proxy.ts')).toBe('middleware');
    });

    it('ตรวจจับ Server Action เช่น actions.ts หรือ โฟลเดอร์ actions/ เป็น action', () => {
      expect(detectNextFileType('src/app/products/actions.ts')).toBe('action');
      expect(detectNextFileType('src/actions/user.ts')).toBe('action');
    });

    it('ตรวจจับ data store หรือ context เป็น store', () => {
      expect(detectNextFileType('src/stores/cartStore.ts')).toBe('store');
      expect(detectNextFileType('src/context/AuthContext.tsx')).toBe('store');
    });

    it('ตรวจจับ API Route เป็น api', () => {
      expect(detectNextFileType('src/app/api/auth/route.ts')).toBe('api');
    });

    it('ตรวจจับ components เป็น component', () => {
      expect(detectNextFileType('src/components/Header.tsx')).toBe('component');
    });

    it('ตรวจจับโปรเจกต์ที่ไม่มีโฟลเดอร์ src/ นำหน้าได้ (Root Folder)', () => {
      expect(detectNextFileType('app/page.tsx')).toBe('page');
      expect(detectNextFileType('app/dashboard/layout.tsx')).toBe('layout');
      expect(detectNextFileType('components/Modal.tsx')).toBe('component');
      expect(detectNextFileType('app/api/user/route.ts')).toBe('api');
    });
  });

  describe('extractImportsFromCode', () => {
    it('แกะ import บรรทัดเดียวปกติได้', () => {
      const code = \`import { Navbar } from '@/components/Navbar';\`;
      const res = extractImportsFromCode('src/app/page.tsx', code);
      expect(res).toEqual([{ source: 'src/app/page.tsx', target: '@/components/Navbar', type: 'import' }]);
    });

    it('แกะ import หลายบรรทัดที่มีการเคาะขึ้นบรรทัดใหม่ได้', () => {
      const code = \`
        import {
          Button,
          Modal,
          Card
        } from '@/components/ui';
      \`;
      const res = extractImportsFromCode('src/app/page.tsx', code);
      expect(res).toEqual([{ source: 'src/app/page.tsx', target: '@/components/ui', type: 'import' }]);
    });

    it('แกะ type import ของ typescript ได้', () => {
      const code = \`import type { UserSession } from '../types/session';\`;
      const res = extractImportsFromCode('src/lib/auth.ts', code);
      expect(res).toEqual([{ source: 'src/lib/auth.ts', target: '../types/session', type: 'import' }]);
    });

    it('ไม่ไปแกะบรรทัดที่คอมเมนต์ทิ้งไว้', () => {
      const code = \`
        // import { OldComp } from '@/components/OldComp';
        import { NewComp } from '@/components/NewComp';
      \`;
      const res = extractImportsFromCode('src/app/page.tsx', code);
      expect(res).toEqual([{ source: 'src/app/page.tsx', target: '@/components/NewComp', type: 'import' }]);
    });

    it('ตัดตัวซ้ำถ้าในไฟล์เดียวกัน import ซ้ำที่เดิม', () => {
      const code = \`
        import { A } from './utils';
        import { B } from './utils';
      \`;
      const res = extractImportsFromCode('src/app/page.tsx', code);
      expect(res).toHaveLength(1);
      expect(res[0].target).toBe('./utils');
    });
  });

  describe('extractActionTriggers (ตรวจจับ Event และ Server Action)', () => {
    it('ตรวจจับ onClick event และดึงชื่อฟังก์ชันเป้าหมายได้', () => {
      const code = \`
        <button onClick={handleDeleteProduct}>Delete</button>
      \`;
      const relations = extractActionTriggers('src/components/ProductCard.tsx', code);
      expect(relations).toContainEqual({
        source: 'src/components/ProductCard.tsx',
        target: 'handleDeleteProduct',
        type: 'event',
        label: 'onClick'
      });
    });

    it('ตรวจจับ form action สำหรับ Next.js Server Action ได้', () => {
      const code = \`
        <form action={updateProductAction}>
          <input name="name" />
          <button type="submit">Save</button>
        </form>
      \`;
      const relations = extractActionTriggers('src/app/products/page.tsx', code);
      expect(relations).toContainEqual({
        source: 'src/app/products/page.tsx',
        target: 'updateProductAction',
        type: 'action',
        label: 'form action'
      });
    });
  });
});
`;

const RAW_TEST3 = `// src/tests/3_generator.test.ts
import { describe, it, expect } from 'vitest';
import { sanitizeNodeId, getNodeColorConfig, buildFlowElements, generateMermaidSyntax } from '../lib/generator';
import { CodeRelation, NextFileType } from '../types';

describe('คนที่ 3: generator.ts (Interactive Flow Visualizer)', () => {
  describe('sanitizeNodeId', () => {
    it('เปลี่ยนพวก slash จุด ขีดกลาง @ ให้เป็น underscore ทั้งหมด', () => {
      expect(sanitizeNodeId('@/components/ui/nav-bar.tsx')).toBe('components_ui_nav_bar_tsx');
    });

    it('ตัดพวกวงเล็บ route group ของ next เช่น (auth) ทิ้งไป', () => {
      expect(sanitizeNodeId('src/app/(auth)/login/page.tsx')).toBe('src_app_auth_login_page_tsx');
    });

    it('ตัด underscore หัวท้ายที่เกินมาออก', () => {
      expect(sanitizeNodeId('///src/app/page.tsx///')).toBe('src_app_page_tsx');
    });
  });

  describe('getNodeColorConfig (ชุดสีแยกตามบทบาทไฟล์ใน Next.js)', () => {
    it('middleware และ proxy ต้องได้สีม่วง (#a855f7)', () => {
      const config = getNodeColorConfig('middleware');
      expect(config.border).toBe('#a855f7');
    });

    it('หน้าเพจ page ต้องได้สีฟ้า (#38bdf8)', () => {
      const config = getNodeColorConfig('page');
      expect(config.border).toBe('#38bdf8');
    });

    it('server action ต้องได้สีส้ม (#fb923c)', () => {
      const config = getNodeColorConfig('action');
      expect(config.border).toBe('#fb923c');
    });

    it('data store หรือ context ต้องได้สีเขียว (#4ade80)', () => {
      const config = getNodeColorConfig('store');
      expect(config.border).toBe('#4ade80');
    });
  });

  describe('buildFlowElements (สร้างโหนดและเส้นเชื่อมสำหรับ React Flow)', () => {
    it('แปลงรายการไฟล์และ relations เป็น Nodes และ Edges พร้อมพิกัด position ได้', () => {
      const mockFiles: Array<{ path: string; fileType: NextFileType }> = [
        { path: 'src/app/page.tsx', fileType: 'page' },
        { path: 'src/actions/auth.ts', fileType: 'action' }
      ];
      const mockRelations: CodeRelation[] = [
        {
          source: 'src/app/page.tsx',
          target: 'src/actions/auth.ts',
          type: 'action',
          label: 'form action'
        }
      ];

      const elements = buildFlowElements(mockFiles, mockRelations);
      expect(elements.nodes).toHaveLength(2);
      expect(elements.edges).toHaveLength(1);

      expect(elements.nodes[0].id).toBe('src_app_page_tsx');
      expect(elements.nodes[0].position).toHaveProperty('x');
      expect(elements.nodes[0].position).toHaveProperty('y');

      expect(elements.edges[0].source).toBe('src_app_page_tsx');
      expect(elements.edges[0].target).toBe('src_actions_auth_ts');
      expect(elements.edges[0].label).toBe('form action');
      expect(elements.edges[0].animated).toBe(true);
    });
  });

  describe('generateMermaidSyntax', () => {
    it('ต่อสตริง graph TD พร้อมใส่ label ชื่อไฟล์ได้ถูกต้อง', () => {
      const relations: CodeRelation[] = [
        { source: 'src/app/page.tsx', target: '@/components/Navbar.tsx' }
      ];
      const output = generateMermaidSyntax(relations);

      expect(output).toContain('graph TD');
      expect(output).toContain('src_app_page_tsx["src/app/page.tsx"] --> components_Navbar_tsx["@/components/Navbar.tsx"]');
    });

    it('ถ้าไม่มี relation เลย ให้ส่งโหนดเริ่มต้นกลับไป จะได้ไม่ error', () => {
      const output = generateMermaidSyntax([]);
      expect(output).toBe('graph TD\\n  Empty["No local relations found"]');
    });
  });
});
`;

const RAW_TEST4 = `// src/tests/4_frontend_ui.test.ts
import { describe, it, expect } from 'vitest';
import {
  validateUrlInput,
  formatRepoStats,
  calculateHealthScore,
  encodeShareableState,
  decodeShareableState
} from '../lib/ui-helper';

describe('คนที่ 4: ui-helper.ts (Dashboard & State Orchestrator)', () => {
  describe('validateUrlInput', () => {
    it('ถ้าไม่พิมพ์อะไรเลย หรือเคาะ space มา ให้แจ้งเตือนว่ากรุณากรอก URL', () => {
      expect(validateUrlInput('')).toEqual({ isValid: false, errorMessage: 'กรุณากรอก GitHub URL' });
      expect(validateUrlInput('   ')).toEqual({ isValid: false, errorMessage: 'กรุณากรอก GitHub URL' });
    });

    it('ถ้าไม่ใช่ github ให้เตือนว่าต้องมาจาก github เท่านั้น', () => {
      expect(validateUrlInput('https://gitlab.com/repo')).toEqual({
        isValid: false,
        errorMessage: 'URL ต้องมาจาก github.com เท่านั้น'
      });
    });

    it('ดักจับแท็ก script แปลกๆ ในช่องกรอกได้', () => {
      const check = validateUrlInput('<script>alert("hacked")</script>');
      expect(check.isValid).toBe(false);
      expect(check.errorMessage).toBe('URL ต้องมาจาก github.com เท่านั้น');
    });

    it('ถ้ามี space หน้าหลัง ให้ trim ออกให้อัตโนมัติแล้วผ่านได้', () => {
      const check = validateUrlInput('   https://github.com/chsnor/testauth   ');
      expect(check.isValid).toBe(true);
      expect(check.errorMessage).toBeNull();
    });
  });

  describe('formatRepoStats', () => {
    it('คำนวณจำนวนไฟล์ที่กรองทิ้ง และจัดข้อความสรุปได้ถูกต้อง', () => {
      const stats = formatRepoStats(100, 20);
      expect(stats.rawCount).toBe(100);
      expect(stats.analyzedCount).toBe(20);
      expect(stats.ignoredCount).toBe(80);
      expect(stats.summaryText).toContain('วิเคราะห์โค้ดทั้งหมด 20 ไฟล์');
    });

    it('ถ้าไม่มีไฟล์เลย ต้องไม่บั๊ก ไม่เออเร่อเป็น NaN หรือติดลบ', () => {
      const stats = formatRepoStats(0, 0);
      expect(stats.rawCount).toBe(0);
      expect(stats.analyzedCount).toBe(0);
      expect(stats.ignoredCount).toBe(0);
      expect(stats.summaryText).toContain('0 ไฟล์');
    });

    it('ถ้าไฟล์ที่วิเคราะห์มีมากกว่าไฟล์ดิบ ตัวเลขที่ตัดทิ้งต้องเป็น 0 เสมอ ไม่ติดลบ', () => {
      const stats = formatRepoStats(10, 15);
      expect(stats.ignoredCount).toBe(0);
    });
  });

  describe('calculateHealthScore (ประเมินคะแนนสถาปัตยกรรมโค้ด)', () => {
    it('ถ้า ratio อยู่ระหว่าง 0.8 ถึง 2.5 ต้องได้เกรด A', () => {
      const score = calculateHealthScore(20, 15); // ratio = 1.33
      expect(score.grade).toBe('A');
    });

    it('ถ้า ratio อยู่ระหว่าง 2.5 ถึง 4.0 ต้องได้เกรด B', () => {
      const score = calculateHealthScore(30, 10); // ratio = 3.0
      expect(score.grade).toBe('B');
    });

    it('ถ้า ratio มากกว่า 4.0 หรือน้อยกว่า 0.8 ต้องได้เกรด C', () => {
      const scoreHigh = calculateHealthScore(50, 10); // ratio = 5.0
      expect(scoreHigh.grade).toBe('C');

      const scoreLow = calculateHealthScore(5, 10); // ratio = 0.5
      expect(scoreLow.grade).toBe('C');
    });

    it('ถ้าไม่มีไฟล์โค้ด (0 ไฟล์) ต้องได้เกรด N/A', () => {
      const score = calculateHealthScore(0, 0);
      expect(score.grade).toBe('N/A');
    });
  });

  describe('encodeShareableState และ decodeShareableState (ระบบแชร์สถานะไดอะแกรม)', () => {
    it('เข้ารหัสและถอดรหัส URL State กลับมาได้ถูกต้องครบถ้วน', () => {
      const originalUrl = 'https://github.com/chsnor/testauth';
      const activeNode = 'src/app/page.tsx';

      const encoded = encodeShareableState(originalUrl, activeNode);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);

      const decoded = decodeShareableState(encoded);
      expect(decoded).toEqual({
        url: originalUrl,
        activeNode: activeNode
      });
    });

    it('ถ้าถอดรหัสข้อความที่ผิดรูปแบบ ให้ส่งค่ากลับเป็น null', () => {
      expect(decodeShareableState('invalid-base64-string!!')).toBeNull();
    });
  });
});
`;

const RAW_TEST5 = `// src/tests/5_side_drawer.test.ts
import { describe, it, expect } from 'vitest';
import { getLanguageFromPath, formatCodeSnippet, highlightCodeWithPrism } from '../lib/code-viewer';

describe('คนที่ 5: code-viewer.ts (Side Inspector & PrismJS Code Viewer)', () => {
  describe('getLanguageFromPath', () => {
    it('ระบุภาษา tsx สำหรับไฟล์คอมโพเนนต์ React TSX ได้', () => {
      expect(getLanguageFromPath('src/components/Header.tsx')).toBe('tsx');
    });

    it('ระบุภาษา typescript สำหรับไฟล์ .ts ทั่วไปได้', () => {
      expect(getLanguageFromPath('src/lib/auth.ts')).toBe('typescript');
    });

    it('ระบุภาษา javascript สำหรับไฟล์ .js ได้', () => {
      expect(getLanguageFromPath('server.js')).toBe('javascript');
    });

    it('ระบุภาษา json สำหรับไฟล์คอนฟิกได้', () => {
      expect(getLanguageFromPath('package.json')).toBe('json');
    });

    it('ถ้าไม่ทราบนามสกุล ให้ fallback เป็น clike หรือ markup', () => {
      const lang = getLanguageFromPath('Dockerfile');
      expect(['clike', 'markup', 'text', 'none']).toContain(lang);
    });
  });

  describe('formatCodeSnippet (การตัดทอนโค้ดไฟล์ใหญ่)', () => {
    it('นับจำนวนบรรทัดของโค้ดสั้นได้ถูกต้อง และไม่ขึ้นสถานะ isTruncated', () => {
      const code = "console.log('line 1');\\nconsole.log('line 2');\\nconsole.log('line 3');";
      const result = formatCodeSnippet(code, 10);
      expect(result.totalLines).toBe(3);
      expect(result.isTruncated).toBe(false);
      expect(result.snippet).toBe(code);
    });

    it('ถ้าบรรทัดเกิน maxLines ให้ตัดทอนเฉพาะส่วนแรก และขึ้น isTruncated เป็น true', () => {
      const lines = Array.from({ length: 50 }, (_, i) => \`line \${i + 1}\`).join('\\n');
      const result = formatCodeSnippet(lines, 20);
      expect(result.totalLines).toBe(50);
      expect(result.isTruncated).toBe(true);
      expect(result.snippet.split('\\n')).toHaveLength(20);
    });
  });

  describe('highlightCodeWithPrism (แปลงโค้ดเป็น HTML ที่มีสี)', () => {
    it('สามารถแปลงโค้ด TypeScript เป็น HTML ที่มีคลาส token ของ Prism ได้', () => {
      const code = \`const greeting: string = "Hello World";\`;
      const html = highlightCodeWithPrism(code, 'typescript');
      expect(html).toContain('token');
      expect(html).toContain('const');
    });

    it('ถ้าส่งภาษาที่ไม่รองรับมา ต้องไม่ crash และส่งคืนข้อความที่ escape ปลอดภัย', () => {
      const code = \`<div>test</div>\`;
      const html = highlightCodeWithPrism(code, 'unknown_language');
      expect(typeof html).toBe('string');
      expect(html).toContain('test');
    });
  });
});
`;

const RAW_TEST6 = `// src/tests/6_integration_pipeline.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runAnalysisPipeline, clearPipelineCache, pipelineCache } from '../lib/pipeline';
import { GitHubTreeItem } from '../types';

describe('คนที่ 6: pipeline.ts (Integration Pipeline, QA & Deployment)', () => {
  beforeEach(() => {
    clearPipelineCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // ส่วนที่ 1: Unit & Functional Flow Tests
  // ==========================================
  it('ทดสอบโฟลว์ครบวงจร: URL -> กรองไฟล์ -> สกัด Action/Event -> สร้าง React Flow Nodes/Edges และ Mermaid', async () => {
    const inputUrl = 'https://github.com/chsnor/testauth.git';

    const mockTree: GitHubTreeItem[] = [
      { path: 'node_modules/next/package.json', mode: '100644', type: 'blob', sha: '1' },
      { path: '.next/types/routes.d.ts', mode: '100644', type: 'blob', sha: '2' },
      { path: 'src/middleware.ts', mode: '100644', type: 'blob', sha: '3' },
      { path: 'src/app/products/page.tsx', mode: '100644', type: 'blob', sha: '4' },
      { path: 'src/app/products/actions.ts', mode: '100644', type: 'blob', sha: '5' },
      { path: 'src/stores/cartStore.ts', mode: '100644', type: 'blob', sha: '6' },
      { path: 'public/banner.png', mode: '100644', type: 'blob', sha: '7' }
    ];

    const mockContents: Record<string, string> = {
      'src/app/products/page.tsx': \`
        import { updateProductAction } from './actions';
        export default function ProductsPage() {
          return (
            <form action={updateProductAction}>
              <button type="submit">Save</button>
            </form>
          );
        }
      \`
    };

    const result = await runAnalysisPipeline(inputUrl, undefined, mockTree, mockContents);

    expect(result.owner).toBe('chsnor');
    expect(result.repoName).toBe('testauth');
    expect(result.totalFiles).toBe(7);
    expect(result.filteredFilesCount).toBe(4);

    // ตรวจสอบว่าโหนด React Flow ถูกสร้างขึ้นครบตามประเภทไฟล์
    const pageNode = result.nodes.find(n => n.path === 'src/app/products/page.tsx');
    expect(pageNode).toBeDefined();
    expect(pageNode?.fileType).toBe('page');

    const actionNode = result.nodes.find(n => n.path === 'src/app/products/actions.ts');
    expect(actionNode).toBeDefined();
    expect(actionNode?.fileType).toBe('action');

    const middlewareNode = result.nodes.find(n => n.path === 'src/middleware.ts');
    expect(middlewareNode).toBeDefined();
    expect(middlewareNode?.fileType).toBe('middleware');

    // ตรวจสอบเส้น Edge ที่เชื่อมโยง Event/Action
    const actionEdge = result.edges.find(e => e.label === 'form action' || e.animated === true);
    expect(actionEdge).toBeDefined();

    // ตรวจสอบ Mermaid Syntax ว่ามีข้อมูล
    expect(result.mermaidSyntax).toContain('graph TD');
  });

  it('ทดสอบระบบ In-Memory Cache: วิเคราะห์ซ้ำ URL เดิมต้องดึงจากแคชทันทีโดยไม่ต้องคำนวณใหม่', async () => {
    const inputUrl = 'https://github.com/chsnor/testauth';
    const mockTree: GitHubTreeItem[] = [
      { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '1' }
    ];

    // ครั้งแรก: ต้องประมวลผลใหม่ และบันทึกลงแคช (isCached เป็น false)
    const firstResult = await runAnalysisPipeline(inputUrl, undefined, mockTree);
    expect(firstResult.isCached).toBe(false);
    expect(pipelineCache.has(inputUrl)).toBe(true);

    // ครั้งที่สอง: ต้องดึงผลลัพธ์จากแคชทันที (isCached เป็น true)
    const secondResult = await runAnalysisPipeline(inputUrl, undefined, mockTree);
    expect(secondResult.isCached).toBe(true);
    expect(secondResult.repoName).toBe('testauth');
  });

  it('ทดสอบความเร็วและ Performance Benchmark: ทดสอบกับ 500 ไฟล์ ต้องประมวลผลเสร็จในเสี้ยววินาที', async () => {
    const startTime = performance.now();

    const largeTree: GitHubTreeItem[] = Array.from({ length: 500 }, (_, i) => ({
      path: i % 2 === 0 ? \`node_modules/pkg-\${i}/index.js\` : \`src/components/Comp\${i}.tsx\`,
      mode: '100644',
      type: 'blob',
      sha: \`sha-\${i}\`
    }));

    const result = await runAnalysisPipeline('https://github.com/chsnor/bigrepo', undefined, largeTree);
    expect(result.filteredFilesCount).toBe(250);
    expect(result.nodes.length).toBe(250);

    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(150);
  });

  // ==========================================
  // ส่วนที่ 2: Boundary Value & Negative Tests (Red Team QA)
  // ==========================================
  it('BVA: รองรับกรณีคลังไฟล์ว่างเปล่า (Empty Tree 0 ไฟล์) ได้อย่างปลอดภัยโดยไม่ Crash', async () => {
    const result = await runAnalysisPipeline('https://github.com/chsnor/empty-repo', undefined, []);
    expect(result.totalFiles).toBe(0);
    expect(result.filteredFilesCount).toBe(0);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
    expect(result.mermaidSyntax).toBeDefined();
  });

  it('Negative: จัดการกรณี URL ไม่ถูกต้องโดย Throw ข้อผิดพลาดที่อ่านเข้าใจง่าย', async () => {
    await expect(runAnalysisPipeline('https://gitlab.com/invalid/repo')).rejects.toThrow(
      'URL ต้องมาจาก github.com เท่านั้น'
    );
  });

  it('Adversarial: จำลองกรณีติด Rate Limit 403 Forbidden ต้อง Throw ข้อผิดพลาดแจ้งเตือน Token', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ message: 'API rate limit exceeded' })
    } as Response);

    await expect(runAnalysisPipeline('https://github.com/chsnor/rate-limited-repo')).rejects.toThrow(
      '❌ GitHub API Rate Limit หรือ Access Denied. กรุณาเพิ่ม GitHub Token ในไฟล์ .env'
    );

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('Adversarial: จำลองกรณีระบบ Network ล่ม (Fetch Reject) ต้องโยนข้อผิดพลาดการเชื่อมต่อ', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network connection aborted'));

    await expect(runAnalysisPipeline('https://github.com/chsnor/offline-repo')).rejects.toThrow(
      'ไม่สามารถเชื่อมต่อ GitHub ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือแนบ Token'
    );

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('API Route POST /api/analyze: ถ้าไม่ส่ง URL มาต้องตอบกลับ status 400', async () => {
    const { POST } = await import('../app/api/analyze/route');
    const fakeReq = {
      json: async () => ({})
    };
    const res = await POST(fakeReq as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(400);
  });

  // ==========================================
  // ส่วนที่ 3: Integration Tests
  // ==========================================
  describe('เฟสที่ 1: Integration Test เชื่อมต่อ Person 1 (GitHub) + Person 6 (Pipeline & API)', () => {
    it('1. ส่ง URL รูปแบบซับซ้อน (มี .git และ Slash ท้าย) เข้า Pipeline ต้องเชื่อมต่อกับ parseGitHubUrl ของคนที่ 1 ได้ถูกต้อง', async () => {
      const complexUrl = 'https://github.com/chsnor/real-next-project.git/';
      const mockTree: GitHubTreeItem[] = [
        { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '101' },
        { path: 'src/middleware.ts', mode: '100644', type: 'blob', sha: '102' }
      ];

      const result = await runAnalysisPipeline(complexUrl, undefined, mockTree);

      expect(result.owner).toBe('chsnor');
      expect(result.repoName).toBe('real-next-project');
      expect(result.totalFiles).toBe(2);
      expect(result.filteredFilesCount).toBe(2);
    });

    it('2. ตรวจสอบการส่งต่อ Token และการเรียก buildGitHubApiUrl + buildGitHubHeaders ของคนที่ 1 ผ่าน vi.spyOn(fetch)', async () => {
      const testToken = 'ghp_mockIntegrationSecretToken999';

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          tree: [
            { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '1' }
          ]
        })
      } as Response);

      const result = await runAnalysisPipeline('https://github.com/chsnor/secure-app', testToken);

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.github.com/repos/chsnor/secure-app/git/trees/main?recursive=1',
        {
          headers: expect.objectContaining({
            'User-Agent': 'GitFlow-Visualizer',
            'Authorization': \`Bearer \${testToken}\`
          })
        }
      );

      expect(result.owner).toBe('chsnor');
      expect(result.repoName).toBe('secure-app');
    });

    it('3. Integration เต็มรูปแบบ: API Route POST -> runAnalysisPipeline -> parseGitHubUrl (คน 1) -> ส่งผลลัพธ์ HTTP 200', async () => {
      const { POST } = await import('../app/api/analyze/route');
      const mockReq = {
        json: async () => ({
          url: 'https://github.com/chsnor/api-integrated-repo'
        })
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          tree: [{ path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '1' }]
        })
      } as Response);

      const response = await POST(mockReq as unknown as import('next/server').NextRequest);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.owner).toBe('chsnor');
      expect(data.repoName).toBe('api-integrated-repo');
      expect(data.totalFiles).toBe(1);
    });

    it('4. Fallback master branch: หาก branch main ตอบกลับ 404 ต้องสลับไปดึง master และบันทึก branch ในผลลัพธ์', async () => {
      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ message: 'Not Found' })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            tree: [{ path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '1' }]
          })
        } as Response);

      const result = await runAnalysisPipeline('https://github.com/chsnor/legacy-master-repo');
      expect(result.branch).toBe('master');
      expect(result.owner).toBe('chsnor');
      expect(result.repoName).toBe('legacy-master-repo');
    });
  });

  // ==========================================
  // ส่วนที่ 4: Future Integration Tests (เตรียมพร้อมสำหรับสมาชิกคนที่ 2 ถึง 5)
  // ==========================================
  describe('เฟสที่ 2: Integration Test (คนที่ 2: Parser Engine)', () => {
    it('1. filterTreeFiles: ต้องคัดกรอง node_modules, .next, .d.ts ออกอย่างถูกต้อง และเคารพ maxLimit', async () => {
      const { filterTreeFiles } = await import('../lib/parser');
      const sampleItems: GitHubTreeItem[] = [
        { path: 'node_modules/react/index.js', mode: '100644', type: 'blob', sha: '1' },
        { path: '.next/types/routes.d.ts', mode: '100644', type: 'blob', sha: '2' },
        { path: 'dist/bundle.js', mode: '100644', type: 'blob', sha: '3' },
        { path: 'public/favicon.ico', mode: '100644', type: 'blob', sha: '4' },
        { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '5' },
        { path: 'src/app/actions.ts', mode: '100644', type: 'blob', sha: '6' },
        { path: 'src/middleware.ts', mode: '100644', type: 'blob', sha: '7' }
      ];

      const filtered = filterTreeFiles(sampleItems, 150);
      expect(filtered.length).toBe(3);
      expect(filtered.map(f => f.path)).toEqual([
        'src/app/page.tsx',
        'src/app/actions.ts',
        'src/middleware.ts'
      ]);
    });

    it('2. detectNextFileType: ต้องจำแนก page, action, middleware, store, component ได้ถูกต้องทั้งมีและไม่มี src/', async () => {
      const { detectNextFileType } = await import('../lib/parser');
      
      // กรณีมี src/
      expect(detectNextFileType('src/app/page.tsx')).toBe('page');
      expect(detectNextFileType('src/app/products/actions.ts')).toBe('action');
      expect(detectNextFileType('src/middleware.ts')).toBe('middleware');
      expect(detectNextFileType('src/stores/authStore.ts')).toBe('store');
      expect(detectNextFileType('src/components/Header.tsx')).toBe('component');

      // กรณีไม่มี src/ (Root App Router)
      expect(detectNextFileType('app/dashboard/page.tsx')).toBe('page');
      expect(detectNextFileType('app/login/actions.ts')).toBe('action');
      expect(detectNextFileType('middleware.ts')).toBe('middleware');
    });

    it('3. extractImportsFromCode: ต้องสกัดเฉพาะ Local / Alias Imports และตัดโมดูลภายนอกทิ้ง', async () => {
      const { extractImportsFromCode } = await import('../lib/parser');
      const codeSnippet = \`
        import React, { useState } from 'react';
        import { updateItem } from './actions';
        import { useCartStore } from '@/stores/cartStore';
        // import { oldFeature } from './legacy';
      \`;

      const relations = extractImportsFromCode('src/app/page.tsx', codeSnippet);
      const targets = relations.map(r => r.target);

      expect(targets).toContain('./actions');
      expect(targets).toContain('@/stores/cartStore');
      expect(targets).not.toContain('react');
      expect(targets).not.toContain('./legacy');
    });

    it('4. extractActionTriggers: ต้องตรวจจับ form action และ onClick ส่งต่อเป็น CodeRelation', async () => {
      const { extractActionTriggers } = await import('../lib/parser');
      const codeSnippet = \`
        export default function Page() {
          return (
            <form action={handleSubmitAction}>
              <button onClick={handleReset}>Reset</button>
            </form>
          );
        }
      \`;

      const relations = extractActionTriggers('src/app/page.tsx', codeSnippet);
      expect(relations.length).toBeGreaterThanOrEqual(1);
      
      const formAction = relations.find(r => r.label === 'form action');
      expect(formAction).toBeDefined();
    });
  });

  describe('เฟสที่ 3: Integration Test (คนที่ 3: Flow & Mermaid Generator)', () => {
    it('1. sanitizeNodeId: ลบวงเล็บ Next.js Route Groups และแทนที่อักขระพิเศษด้วย Underscore', async () => {
      const { sanitizeNodeId } = await import('../lib/generator');
      expect(sanitizeNodeId('src/app/(auth)/login/page.tsx')).toBe('src_app_auth_login_page_tsx');
      expect(sanitizeNodeId('src/components/Button.tsx')).toBe('src_components_Button_tsx');
    });

    it('2. getNodeColorConfig: คืนค่าสีตรงตามประเภทไฟล์ Next.js', async () => {
      const { getNodeColorConfig } = await import('../lib/generator');
      expect(getNodeColorConfig('page').border).toBe('#38bdf8'); // ฟ้า
      expect(getNodeColorConfig('action').border).toBe('#fb923c'); // ส้ม
      expect(getNodeColorConfig('middleware').border).toBe('#a855f7'); // ม่วง
      expect(getNodeColorConfig('store').border).toBe('#4ade80'); // เขียว
    });

    it('3. buildFlowElements: คำนวณพิกัด {x, y} ของ Nodes อย่างเป็นระเบียบ และสร้าง Edges พร้อม Animation สำหรับ Action', async () => {
      const { buildFlowElements } = await import('../lib/generator');
      const files = [
        { path: 'src/app/page.tsx', fileType: 'page' as const },
        { path: 'src/app/actions.ts', fileType: 'action' as const }
      ];
      const relations = [
        { source: 'src/app/page.tsx', target: 'src/app/actions.ts', type: 'action' as const, label: 'form action' }
      ];

      const elements = buildFlowElements(files, relations);
      expect(elements.nodes.length).toBe(2);
      expect(elements.nodes[0].position).toHaveProperty('x');
      expect(elements.nodes[0].position).toHaveProperty('y');
      
      expect(elements.edges.length).toBe(1);
      expect(elements.edges[0].animated).toBe(true);
      expect(elements.edges[0].label).toBe('form action');
    });

    it('4. generateMermaidSyntax: ส่งออกไวยากรณ์ graph TD ที่ถูกต้อง พร้อม Style สีของโหนด', async () => {
      const { generateMermaidSyntax } = await import('../lib/generator');
      const relations = [
        { source: 'src/app/page.tsx', target: 'src/app/actions.ts', type: 'action' as const, label: 'submit' }
      ];

      const syntax = generateMermaidSyntax(relations);
      expect(syntax).toContain('graph TD');
      expect(syntax).toMatch(/-->\\|"?submit"?\\|/);
    });
  });

  describe('เฟสที่ 4 และ 5: Contract Test (คนที่ 4: Dashboard UI & คนที่ 5: Side Inspector)', () => {
    it('ตรวจสอบโครงสร้าง AnalysisResult ว่าส่งต่อฟิลด์ที่ SideDrawer และ FlowCanvas ต้องใช้ครบ 100%', async () => {
      const mockTree: GitHubTreeItem[] = [
        { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '1' }
      ];
      const result = await runAnalysisPipeline('https://github.com/chsnor/contract-check', undefined, mockTree);

      // ตรวจสอบฟิลด์ที่ Dashboard ของคนที่ 4 ต้องแสดงบนหัวจอ
      expect(result).toHaveProperty('repoName');
      expect(result).toHaveProperty('owner');
      expect(result).toHaveProperty('totalFiles');
      expect(result).toHaveProperty('filteredFilesCount');
      expect(result).toHaveProperty('executionTimeMs');
      expect(result).toHaveProperty('isCached');

      // ตรวจสอบฟิลด์ที่ SideDrawer ของคนที่ 5 ต้องใช้เปิดส่องโค้ด
      result.nodes.forEach(node => {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('path');
        expect(node).toHaveProperty('fileType');
      });
    });
  });

  // ==========================================
  // ส่วนที่ 5: System Test / End-to-End User Scenarios (ระบบโดยรวม)
  // ==========================================
  describe('ระบบโดยรวม: System Test / End-to-End User Scenarios', () => {
    it('Scenario 1 (Happy Path E2E): ผู้ใช้งานกรอก URL โปรเจกต์ Next.js จริง -> รับแผนผัง Flow ครบ 100%', async () => {
      const { POST } = await import('../app/api/analyze/route');
      const userRequest = {
        json: async () => ({
          url: 'https://github.com/chsnor/ecommerce-next'
        })
      };

      // จำลองโครงสร้างไฟล์ของโปรเจกต์ Next.js ของจริง
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          tree: [
            { path: 'node_modules/react/index.js', mode: '100644', type: 'blob', sha: '1' },
            { path: 'src/middleware.ts', mode: '100644', type: 'blob', sha: '2' },
            { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '3' },
            { path: 'src/app/actions.ts', mode: '100644', type: 'blob', sha: '4' },
            { path: 'src/stores/cart.ts', mode: '100644', type: 'blob', sha: '5' }
          ]
        })
      } as Response);

      const response = await POST(userRequest as unknown as import('next/server').NextRequest);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.owner).toBe('chsnor');
      expect(result.repoName).toBe('ecommerce-next');
      expect(result.totalFiles).toBe(5);
      expect(result.filteredFilesCount).toBe(4);
      expect(result.nodes.length).toBe(4);
      expect(result.mermaidSyntax).toContain('graph TD');
    });

    it('Scenario 2 (Cache Acceleration E2E): ร้องขอซ้ำด้วย URL เดิม ต้องได้ความเร็วระดับ < 10ms', async () => {
      const testUrl = 'https://github.com/chsnor/fast-cached-app';
      const mockTree: GitHubTreeItem[] = [
        { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '1' }
      ];

      // ยิงครั้งแรก: ประมวลผลและแคช
      const firstRun = await runAnalysisPipeline(testUrl, undefined, mockTree);
      expect(firstRun.isCached).toBe(false);

      // ยิงครั้งที่สอง: ดึงแคชใน RAM ทันที
      const secondRun = await runAnalysisPipeline(testUrl, undefined, mockTree);
      expect(secondRun.isCached).toBe(true);
      expect(secondRun.executionTimeMs).toBeLessThan(10);
      expect(secondRun.nodes).toEqual(firstRun.nodes);
    });

    it('Scenario 3 (Adversarial Error Boundary E2E): ส่ง URL แปลกปลอมหรือ XSS -> ระบบตัดจบด้วย HTTP 400/500 ปลอดภัย', async () => {
      const { POST } = await import('../app/api/analyze/route');
      const maliciousRequest = {
        json: async () => ({
          url: 'https://evil-phishing.com/<script>alert(1)</script>'
        })
      };

      const response = await POST(maliciousRequest as unknown as import('next/server').NextRequest);
      expect(response.status).toBeGreaterThanOrEqual(400);

      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('Scenario 4 (Stress Scalability E2E): คลังขนาดใหญ่ 1,000 ไฟล์ ต้องประมวลผลเสร็จในเวลาน้อยกว่า 500ms', async () => {
      const massiveTree: GitHubTreeItem[] = Array.from({ length: 1000 }, (_, i) => ({
        path: i % 2 === 0 ? \`node_modules/pkg-\${i}/index.js\` : \`src/app/page-\${i}.tsx\`,
        mode: '100644',
        type: 'blob',
        sha: \`sha-\${i}\`
      }));

      const startTime = performance.now();
      const result = await runAnalysisPipeline('https://github.com/chsnor/massive-repo', undefined, massiveTree);
      const duration = performance.now() - startTime;

      expect(result.totalFiles).toBe(1000);
      expect(result.filteredFilesCount).toBe(500);
      expect(duration).toBeLessThan(500);
    });

    it('Scenario 5 (Structural Inference E2E): สกัดความสัมพันธ์อัตโนมัติจากโครงสร้าง Next.js แม้ไม่มีการดึงโค้ดดิบ', async () => {
      const { inferStructuralRelations } = await import('../lib/pipeline');
      const files = [
        { path: 'src/middleware.ts', fileType: 'middleware' as const },
        { path: 'src/app/layout.tsx', fileType: 'page' as const },
        { path: 'src/app/page.tsx', fileType: 'page' as const },
        { path: 'src/app/dashboard/layout.tsx', fileType: 'page' as const },
        { path: 'src/app/dashboard/page.tsx', fileType: 'page' as const },
        { path: 'src/app/dashboard/actions.ts', fileType: 'action' as const },
        { path: 'src/app/dashboard/components/Chart.tsx', fileType: 'component' as const }
      ];

      const relations = inferStructuralRelations(files);
      expect(relations.length).toBeGreaterThan(0);

      // ตรวจสอบว่า middleware ชี้ไป root
      const middlewareEdge = relations.find(r => r.source === 'src/middleware.ts');
      expect(middlewareEdge).toBeDefined();

      // ตรวจสอบ server action edge
      const actionEdge = relations.find(r => r.target === 'src/app/dashboard/actions.ts');
      expect(actionEdge).toBeDefined();
      expect(actionEdge?.type).toBe('action');

      // ตรวจสอบ sub-route edge
      const subRouteEdge = relations.find(r => r.label === 'sub-route');
      expect(subRouteEdge).toBeDefined();
    });

    it('Scenario 6 (Component & Shared UI Linking): จับคู่ Component เอกพจน์เข้ากับ Route พหูพจน์ และเชื่อม Shared UI ไปยัง Root Entry', async () => {
      const { inferStructuralRelations } = await import('../lib/pipeline');
      const files = [
        { path: 'src/app/layout.tsx', fileType: 'page' as const },
        { path: 'src/app/page.tsx', fileType: 'page' as const },
        { path: 'src/app/bands/page.tsx', fileType: 'page' as const },
        { path: 'src/app/games/page.tsx', fileType: 'page' as const },
        { path: 'src/components/BandCard.tsx', fileType: 'component' as const },
        { path: 'src/components/GameExplorer.tsx', fileType: 'component' as const },
        { path: 'src/components/ButtonComponent.tsx', fileType: 'component' as const },
        { path: 'src/components/MemberItem.tsx', fileType: 'component' as const },
      ];

      const relations = inferStructuralRelations(files);
      
      // BandCard -> src/app/bands/page.tsx
      const bandCardRel = relations.find(r => r.target === 'src/components/BandCard.tsx');
      expect(bandCardRel).toBeDefined();
      expect(bandCardRel?.source).toBe('src/app/bands/page.tsx');
      expect(bandCardRel?.label).toBe('uses component');

      // GameExplorer -> src/app/games/page.tsx
      const gameExplorerRel = relations.find(r => r.target === 'src/components/GameExplorer.tsx');
      expect(gameExplorerRel).toBeDefined();
      expect(gameExplorerRel?.source).toBe('src/app/games/page.tsx');
      expect(gameExplorerRel?.label).toBe('uses component');

      // ButtonComponent -> src/app/layout.tsx (Shared UI)
      const buttonRel = relations.find(r => r.target === 'src/components/ButtonComponent.tsx');
      expect(buttonRel).toBeDefined();
      expect(buttonRel?.source).toBe('src/app/layout.tsx');
      expect(buttonRel?.label).toBe('shared UI');

      // MemberItem -> src/app/layout.tsx (Shared UI)
      const memberRel = relations.find(r => r.target === 'src/components/MemberItem.tsx');
      expect(memberRel).toBeDefined();
      expect(memberRel?.source).toBe('src/app/layout.tsx');
      expect(memberRel?.label).toBe('shared UI');
    });
  });
});
`;


const RAW_GITHUB = `// src/lib/github.ts
import { ParsedGitHubUrl } from '../types';

/**
 * ฟังก์ชันสำหรับแยกค่า owner และชื่อ repo ออกจาก URL ของ GitHub
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  // TODO 1.1: ตรวจสอบความถูกต้องเบื้องต้น (Input Validation) - ตัดช่องว่าง และเช็คค่าว่าง
  if (!url || typeof url !== 'string') return null;
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  try {
    // เติม protocol ชั่วคราวกรณีที่ใส่มาแบบไม่มี https:// นำหน้า เพื่อให้ constructor ของ URL ทำงานได้
    let fullUrl = trimmedUrl;
    if (!/^https?:\\/\\//i.test(fullUrl)) {
      fullUrl = 'https://' + fullUrl;
    }

    const parsed = new URL(fullUrl);

    // TODO 1.2: ตรวจสอบว่าเป็นโดเมน github.com หรือไม่
    if (!parsed.hostname.toLowerCase().endsWith('github.com')) {
      return null;
    }

    // TODO 1.3: ลบส่วนเกินที่ไม่เกี่ยวข้องออก (เช่น .git, query string, hash, /tree/main)
    // ดึง pathname มาแยก segment โดยกรองค่าว่างออก
    const segments = parsed.pathname.split('/').filter(Boolean);

    // TODO 1.4: สกัดค่า owner และ repo ส่งกลับเป็น Object
    if (segments.length < 2) {
      return null;
    }

    const owner = segments[0];
    let repo = segments[1];

    // ตัดนามสกุล .git ท้าย repo ออก (ถ้ามี)
    if (repo.toLowerCase().endsWith('.git')) {
      repo = repo.slice(0, -4);
    }

    if (!owner || !repo) {
      return null;
    }

    return { owner, repo };
  } catch {
    return null;
  }
}

/**
 * ฟังก์ชันสร้าง URL สำหรับเรียก GitHub REST API (Tree API แบบ Recursive)
 */
export function buildGitHubApiUrl(owner: string, repo: string, branch = 'main'): string {
  // TODO 1.5: ประกอบ URL สำหรับเรียก GitHub Tree API ในรูปแบบ https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1
  return \`https://api.github.com/repos/\${owner}/\${repo}/git/trees/\${branch}?recursive=1\`;
}

/**
 * ฟังก์ชันประกอบ HTTP Headers สำหรับยิงเรียก GitHub API
 * รองรับ Personal Access Token (PAT) เป็นตัวเลือกเสริม
 */
export function buildGitHubHeaders(token?: string): Record<string, string> {
  // TODO 1.6: สร้าง headers พื้นฐานที่มี User-Agent: 'GitFlow-Visualizer'
  const headers: Record<string, string> = {
    'User-Agent': 'GitFlow-Visualizer',
  };

  // TODO 1.7: ถ้ามี token ส่งเข้ามา (และไม่ใช่สตริงว่าง) ให้แนบ Authorization: \`Bearer \${token.trim()}\`
  if (token && typeof token === 'string') {
    const trimmedToken = token.trim();
    if (trimmedToken.length > 0) {
      headers['Authorization'] = \`Bearer \${trimmedToken}\`;
    }
  }

  return headers;
}

/**
 * ฟังก์ชันสร้าง URL สำหรับดึง Raw Code ของไฟล์จริงเพื่อใช้ใน Side Inspector
 */
export function buildGitHubRawUrl(owner: string, repo: string, filePathOrBranch: string, branchOrPath = 'main'): string {
  let filePath = filePathOrBranch;
  let branch = branchOrPath;

  // ป้องกันกรณีสลับลำดับพารามิเตอร์ระหว่าง filePath กับ branch
  if (/\\.[a-zA-Z0-9]+$/.test(branchOrPath) && !/\\.[a-zA-Z0-9]+$/.test(filePathOrBranch)) {
    branch = filePathOrBranch;
    filePath = branchOrPath;
  }

  const cleanPath = filePath.replace(/^\\/+/, '');
  return \`https://raw.githubusercontent.com/\${owner}/\${repo}/\${branch}/\${cleanPath}\`;
}

/**
 * ฟังก์ชันสร้าง URL สำหรับเปิดดูไฟล์บนหน้าเว็บ GitHub จริง (blob viewer)
 */
export function buildGitHubBlobUrl(owner: string, repo: string, filePath: string, branch = 'main'): string {
  const cleanPath = filePath.replace(/^\\/+/, '');
  return \`https://github.com/\${owner}/\${repo}/blob/\${branch}/\${cleanPath}\`;
}`;

// 6 LOGICAL BLOCKS DEFINITION (ครอบคลุมทั้ง 3 ไฟล์: pipeline.ts, route.ts, github.ts)

