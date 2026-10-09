// ============================================================
// data-code.js — โค้ดจริงทั้ง 18 ไฟล์ (14 ไฟล์โค้ด + 4 ไฟล์เทสต์) จากโปรเจกต์ D:\git_flowcahrt
// (โหลดก่อน data-content.js เพราะ FILE_META อ้างอิง RAW_*)
// ============================================================

const RAW_PIPELINE = `import { parseGitHubUrl, buildGitHubApiUrl, buildGitHubHeaders } from './github';
import { filterTreeFiles, detectNextFileType, extractImportsFromCode } from './parser';
import { buildFlowElements } from './generator';
import { AnalysisResult, GitHubTreeItem, CodeRelation, NextFileType } from '../types';

const MAX_FILTERED_FILES = 500;
const MAX_RAW_FETCH_FILES = 45;
const FETCH_TIMEOUT_MS = 4000;

const pipelineCache = new Map<string, AnalysisResult>();

const COMMON_EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];

function resolveAliasImport(rawTarget: string, allFilePaths: string[]): string | null {
  const clean = rawTarget.slice(2);
  for (const prefix of ['src/', '']) {
    for (const ext of COMMON_EXTENSIONS) {
      const candidate = \`\${prefix}\${clean}\${ext}\`.toLowerCase();
      const match = allFilePaths.find((p) => p.toLowerCase() === candidate);
      if (match) return match;
    }
  }
  return null;
}

function resolveRelativeImport(cleanTarget: string, sourcePath: string, allFilePaths: string[]): string | null {
  const sourceDir = sourcePath.includes('/') ? sourcePath.slice(0, sourcePath.lastIndexOf('/')) : '';
  const parts = sourceDir ? sourceDir.split('/') : [];

  for (const seg of cleanTarget.split('/')) {
    if (seg === '.' || !seg) continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }

  const resolvedBase = parts.join('/');
  for (const ext of COMMON_EXTENSIONS) {
    const candidate = \`\${resolvedBase}\${ext}\`.toLowerCase();
    const match = allFilePaths.find((p) => p.toLowerCase() === candidate);
    if (match) return match;
  }
  return null;
}

function resolveImportToFilePath(
  importTarget: string,
  sourcePath: string,
  allFilePaths: string[]
): string | null {
  if (!importTarget) return null;
  const cleanTarget = importTarget.replace(/['"]/g, '').trim();

  if (cleanTarget.startsWith('@/') || cleanTarget.startsWith('~/')) {
    return resolveAliasImport(cleanTarget, allFilePaths);
  }

  if (cleanTarget.startsWith('.')) {
    return resolveRelativeImport(cleanTarget, sourcePath, allFilePaths);
  }

  const baseName = cleanTarget.split('/').pop()?.toLowerCase();
  if (baseName) {
    return allFilePaths.find((p) => {
      const fName = p.split('/').pop()?.replace(/\\.[^.]+$/, '').toLowerCase();
      return fName === baseName;
    }) || null;
  }

  return null;
}

function inferStructuralRelations(
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

  const middlewareFile = files.find((f) => f.fileType === 'middleware');
  const rootLayout =
    files.find((f) => /(^|\\/)(src\\/)?app\\/layout\\.[jt]sx?$/.test(f.path)) ||
    files.find((f) => /(^|\\/)layout\\.[jt]sx?$/.test(f.path));
  const rootPage =
    files.find((f) => /(^|\\/)(src\\/)?app\\/page\\.[jt]sx?$/.test(f.path)) ||
    files.find((f) => /(^|\\/)page\\.[jt]sx?$/.test(f.path));
  const rootEntry = rootLayout || rootPage || files.find((f) => f.fileType === 'page');

  if (middlewareFile && rootEntry) {
    addRelation({
      source: middlewareFile.path,
      target: rootEntry.path,
      type: 'import',
      label: 'routes to',
    });
  }

  const routeFiles = files.filter((f) => /(^|\\/)(app|pages)\\//.test(f.path));
  const otherFiles = files.filter((f) => !/(^|\\/)(app|pages)\\//.test(f.path));

  const routeDirMap = new Map<string, Array<{ path: string; fileType: NextFileType }>>();
  for (const file of routeFiles) {
    const lastSlash = file.path.lastIndexOf('/');
    const dir = lastSlash === -1 ? '' : file.path.substring(0, lastSlash);
    if (!routeDirMap.has(dir)) routeDirMap.set(dir, []);
    routeDirMap.get(dir)!.push(file);
  }

  for (const [dir, dirFiles] of routeDirMap.entries()) {
    const pageInDir = dirFiles.find((f) => f.fileType === 'page');
    const layoutInDir = dirFiles.find((f) => /(^|\\/)layout\\.[jt]sx?$/.test(f.path));
    const mainAnchor = pageInDir || layoutInDir;

    if (layoutInDir && pageInDir && layoutInDir.path !== pageInDir.path) {
      addRelation({
        source: layoutInDir.path,
        target: pageInDir.path,
        type: 'import',
        label: 'renders',
      });
    }

    for (const f of dirFiles) {
      if (!mainAnchor || f.path === mainAnchor.path) continue;
      if (f.fileType === 'action') {
        addRelation({
          source: mainAnchor.path,
          target: f.path,
          type: 'action',
          label: 'server action',
        });
      } else if (/(loading|error|not-found)\\.[jt]sx?$/.test(f.path)) {
        addRelation({
          source: mainAnchor.path,
          target: f.path,
          type: 'import',
          label: 'route state',
        });
      }
    }

    if (dir && mainAnchor) {
      const lastSlash = dir.lastIndexOf('/');
      const parentDir = lastSlash === -1 ? '' : dir.substring(0, lastSlash);
      const parentFiles = routeDirMap.get(parentDir);

      if (parentFiles) {
        const parentAnchor = parentFiles.find((f) => /(^|\\/)layout\\.[jt]sx?$/.test(f.path)) || parentFiles.find((f) => f.fileType === 'page');
        if (parentAnchor && parentAnchor.path !== mainAnchor.path) {
          addRelation({
            source: parentAnchor.path,
            target: mainAnchor.path,
            type: 'import',
            label: 'sub-route',
          });
        }
      } else if (rootEntry && rootEntry.path !== mainAnchor.path) {
        addRelation({
          source: rootEntry.path,
          target: mainAnchor.path,
          type: 'import',
          label: 'sub-route',
        });
      }
    }
  }

  const allPages = routeFiles.filter((f) => f.fileType === 'page');
  for (const item of otherFiles) {
    const itemName = item.path.split('/').pop()?.replace(/\\.[^.]+$/, '').toLowerCase() || '';

    const matchedPage = allPages.find((p) => {
      const pageDir = p.path.toLowerCase().split('/').slice(0, -1).pop() || '';
      return pageDir && pageDir !== 'app' && pageDir !== 'src' && itemName.includes(pageDir);
    }) || rootEntry || allPages[0];

    if (matchedPage) {
      addRelation({
        source: matchedPage.path,
        target: item.path,
        type: 'import',
        label: matchedPage !== rootEntry ? 'uses component' : 'shared UI',
      });
    }

    if (item.fileType === 'store') {
      const stem = itemName.replace(/store$/, '');
      if (stem.length >= 3) {
        for (const comp of otherFiles) {
          if (comp.fileType === 'component' && comp.path.toLowerCase().includes(stem)) {
            addRelation({
              source: comp.path,
              target: item.path,
              type: 'import',
              label: 'uses store',
            });
          }
        }
      }
    }
  }

  return relations;
}

async function fetchGitHubTree(
  owner: string,
  repo: string,
  initialBranch: string,
  token?: string
): Promise<{ treeData: GitHubTreeItem[]; activeBranch: string; treeSha?: string }> {
  let activeBranch = initialBranch;

  try {
    let response = await fetch(
      buildGitHubApiUrl(owner, repo, activeBranch),
      { headers: buildGitHubHeaders(token) }
    );

    if (response.status === 404 && activeBranch === 'main') {
      const fallbackResponse = await fetch(
        buildGitHubApiUrl(owner, repo, 'master'),
        { headers: buildGitHubHeaders(token) }
      );
      if (fallbackResponse.ok) {
        response = fallbackResponse;
        activeBranch = 'master';
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('❌ GitHub Token ไม่ถูกต้อง (401 Bad credentials) กรุณาตรวจสอบ Token อีกครั้ง หรือเว้นว่างไว้เพื่อใช้งานแบบสาธารณะ');
      }
      if (response.status === 404) {
        throw new Error('❌ ไม่พบคลังโค้ดนี้บน GitHub หรือไม่พบ Branch');
      }
      if (response.status === 403) {
        throw new Error('❌ GitHub API ติด Rate Limit หรือ Access Denied กรุณาแนบ Personal Access Token เพื่อเพิ่มโควต้า');
      }
      throw new Error(\`GitHub API Error: \${response.status}\`);
    }

    const json = await response.json();
    return {
      treeData: Array.isArray(json.tree) ? json.tree : [],
      activeBranch,
      treeSha: typeof json.sha === 'string' ? json.sha : undefined,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err?.message && (err.message.includes('❌') || err.message.includes('401') || err.message.includes('Rate Limit'))) {
      throw error;
    }
    throw new Error('ไม่สามารถเชื่อมต่อ GitHub ได้ กรุณาตรวจสอบการเชื่อมต่อหรือแนบ Token');
  }
}

function extractRelationsFromContent(
  filesContent: Record<string, string>,
  filesWithTypes: Array<{ path: string; fileType: NextFileType }>,
  allPaths: string[]
): CodeRelation[] {
  const relations: CodeRelation[] = [];
  const seenKeys = new Set<string>();

  for (const [filePath, content] of Object.entries(filesContent)) {
    try {
      const rawImports = extractImportsFromCode(filePath, content);
      for (const imp of rawImports) {
        const target = resolveImportToFilePath(imp.target, filePath, allPaths) || imp.target;
        if (target && target !== filePath) {
          const key = \`\${filePath}->\${target}\`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
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
  }

  return relations;
}

export async function runAnalysisPipeline(
  githubUrl: string,
  token?: string,
  mockTreeData?: GitHubTreeItem[],
  mockFilesContent?: Record<string, string>
): Promise<AnalysisResult> {
  const startTime = performance.now();

  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed || !parsed.owner || !parsed.repo) {
    throw new Error('URL ต้องมาจาก github.com เท่านั้น (เช่น https://github.com/owner/repo)');
  }

  const { owner, repo } = parsed;
  let activeBranch = parsed.branch || 'main';
  const effectiveToken = token?.trim() || process.env.GITHUB_TOKEN?.trim() || undefined;
  const cacheKey = githubUrl.trim().toLowerCase();

  if (pipelineCache.has(cacheKey)) {
    const cached = pipelineCache.get(cacheKey)!;
    return {
      ...cached,
      isCached: true,
      executionTimeMs: performance.now() - startTime,
    };
  }

  let treeData: GitHubTreeItem[] = [];
  let treeSha: string | undefined = undefined;
  if (mockTreeData) {
    treeData = mockTreeData;
  } else {
    const fetched = await fetchGitHubTree(owner, repo, activeBranch, effectiveToken);
    treeData = fetched.treeData;
    activeBranch = fetched.activeBranch;
    treeSha = fetched.treeSha;
  }

  const filteredItems = filterTreeFiles(treeData, MAX_FILTERED_FILES);

  const filesWithTypes = filteredItems.map((item) => ({
    path: item.path,
    fileType: detectNextFileType(item.path),
  }));

  const allPaths = filesWithTypes.map((f) => f.path);
  let relations: CodeRelation[] = [];
  let filesContentToProcess: Record<string, string> | null = mockFilesContent || null;

  if (!filesContentToProcess && !mockTreeData && filesWithTypes.length > 0) {
    try {
      const candidates = filesWithTypes.slice(0, MAX_RAW_FETCH_FILES);
      const fetchPromises = candidates.map(async (f) => {
        try {
          const rawUrl = \`https://raw.githubusercontent.com/\${owner}/\${repo}/\${activeBranch}/\${f.path}\`;
          const headers: Record<string, string> = {};
          if (effectiveToken) headers['Authorization'] = \`Bearer \${effectiveToken}\`;
          const res = await fetch(rawUrl, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
          return res.ok ? { path: f.path, text: await res.text() } : { path: f.path, text: '' };
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
      if (hasValidContent) filesContentToProcess = contentMap;
    } catch {}
  }

  if (filesContentToProcess) {
    relations = extractRelationsFromContent(filesContentToProcess, filesWithTypes, allPaths);
  }

  if (relations.length === 0 && filesWithTypes.length > 0) {
    relations.push(...inferStructuralRelations(filesWithTypes));
  }

  const flowElements = buildFlowElements(filesWithTypes, relations);

  const finalResult: AnalysisResult = {
    repoName: repo,
    owner,
    branch: activeBranch,
    commitSha: treeSha,
    totalFiles: treeData.length,
    filteredFilesCount: filteredItems.length,
    relations,
    nodes: flowElements.nodes,
    edges: flowElements.edges,
    isCached: false,
    cachedAt: Date.now(),
    executionTimeMs: performance.now() - startTime,
  };

  pipelineCache.set(cacheKey, finalResult);
  return finalResult;
}

`;

const RAW_ROUTE = `import { NextRequest, NextResponse } from "next/server";
import { runAnalysisPipeline } from "../../../lib/pipeline";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { url, token } = body;

    if (!url) {
      return NextResponse.json(
        { error: "กรุณาระบุ URL ของ GitHub Repository" },
        { status: 400 },
      );
    }

    const result = await runAnalysisPipeline(url, token);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการประมวลผล";

    let status = 500;
    if (errorMessage.includes('401') || errorMessage.includes('Token ไม่ถูกต้อง')) {
      status = 401;
    } else if (errorMessage.includes('404') || errorMessage.includes('ไม่พบคลังโค้ด')) {
      status = 404;
    } else if (errorMessage.includes('403') || errorMessage.includes('Rate Limit')) {
      status = 403;
    } else if (errorMessage.includes('URL ต้องมาจาก') || errorMessage.includes('กรุณาระบุ')) {
      status = 400;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status },
    );
  }
}

`;

const RAW_PARSER = `import { GitHubTreeItem, CodeRelation, NextFileType } from '../types';

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

const COMPONENT_FOLDER_REGEX = /(^|\\/)_?(components?|ui|widgets?|views?)\\//i;
const ACTION_FOLDER_REGEX = /(^|\\/)actions?\\//i;
const STORE_FOLDER_REGEX = /(^|\\/)(stores?|contexts?|state)\\//i;
const HOOK_FOLDER_REGEX = /(^|\\/)hooks?\\//i;
const API_FOLDER_REGEX = /(^|\\/)api\\//i;
const PAGES_ROUTER_REGEX = /(^|\\/)pages\\//i;

const STORE_FILE_REGEX = /(?:[a-zA-Z0-9]*[Ss]tore|[-_.]stores?|^stores?)\\.(tsx?|jsx?)$/;
const HOOK_FILE_REGEX = /^use[A-Z][\\w-]*\\.(tsx?|jsx?)$/;

function shouldIgnorePath(lowerPath: string, fileName: string, isRootFile: boolean): boolean {
  if (fileName.startsWith('.')) return true;
  if (BLACKLIST_FILES.has(fileName)) return true;
  if (BLACKLIST_FOLDERS.some((folder) => lowerPath.includes(folder))) return true;

  if (
    fileName.endsWith('.d.ts') ||
    fileName.includes('.config.') ||
    fileName.includes('.test.') ||
    fileName.includes('.spec.') ||
    fileName.includes('.cy.') ||
    fileName.includes('.min.')
  ) {
    return true;
  }

  if (!VALID_EXTENSIONS.some((ext) => fileName.endsWith(ext))) return true;
  if (isRootFile && !ALLOWED_ROOT_FILES.has(fileName)) return true;

  return false;
}

export function filterTreeFiles(items: GitHubTreeItem[], maxLimit = 250): GitHubTreeItem[] {
  if (!Array.isArray(items)) return [];

  const filtered: GitHubTreeItem[] = [];

  for (const item of items) {
    if (filtered.length >= maxLimit) break;
    if (!item || item.type !== 'blob' || !item.path) continue;

    const normalizedPath = item.path.replace(/\\\\/g, '/');
    const lowerPath = normalizedPath.toLowerCase();
    const lastSlash = lowerPath.lastIndexOf('/');
    const fileName = lastSlash !== -1 ? lowerPath.slice(lastSlash + 1) : lowerPath;
    const isRootFile = lastSlash === -1;

    if (shouldIgnorePath(lowerPath, fileName, isRootFile)) {
      continue;
    }

    filtered.push(item);
  }

  return filtered;
}

export function detectNextFileType(filePath: string): NextFileType {
  if (!filePath || typeof filePath !== 'string') return 'other';

  const normalizedPath = filePath.replace(/\\\\/g, '/');
  const lowerPath = normalizedPath.toLowerCase();
  const lastSlash = normalizedPath.lastIndexOf('/');
  const fileName = lastSlash !== -1 ? normalizedPath.slice(lastSlash + 1) : normalizedPath;

  if (ALLOWED_ROOT_FILES.has(fileName)) {
    return 'middleware';
  }

  if (/^page\\.(tsx|ts|jsx|js)$/.test(fileName)) return 'page';
  if (/^layout\\.(tsx|ts|jsx|js)$/.test(fileName)) return 'layout';
  if (/^route\\.(tsx|ts|jsx|js)$/.test(fileName)) return 'api';

  if (PAGES_ROUTER_REGEX.test(lowerPath)) {
    return API_FOLDER_REGEX.test(normalizedPath) ? 'api' : 'page';
  }

  if (API_FOLDER_REGEX.test(normalizedPath)) return 'api';
  if (ACTION_FOLDER_REGEX.test(normalizedPath)) return 'action';
  if (STORE_FOLDER_REGEX.test(normalizedPath)) return 'store';
  if (HOOK_FOLDER_REGEX.test(normalizedPath)) return 'hook';
  if (COMPONENT_FOLDER_REGEX.test(normalizedPath)) return 'component';

  if (/^actions?\\.(tsx|ts|jsx|js)$/.test(fileName)) return 'action';
  if (STORE_FILE_REGEX.test(fileName)) return 'store';
  if (HOOK_FILE_REGEX.test(fileName)) return 'hook';

  return 'other';
}

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

    if (importPath && /^(\\.|\\.\\.|\\@|\\~)\\//.test(importPath) && !seenTargets.has(importPath)) {
      seenTargets.add(importPath);
      relations.push({
        source: sourcePath,
        target: importPath,
        type: 'import',
      });
    }
  }

  return relations;
}

`;

const RAW_GENERATOR = `import dagre from '@dagrejs/dagre';
import { CodeRelation, NextFileType, FlowNodeItem, FlowEdgeItem } from '../types';

function sanitizeNodeId(pathStr: string): string {
  const id = pathStr
    .replace(/[()]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return id || 'node';
}

const COLOR_PALETTE: Record<string, { border: string; bg: string; text: string }> = {
  middleware: { border: '#a855f7', bg: '#0e1118', text: '#e9d5ff' },
  page: { border: '#38bdf8', bg: '#0e1118', text: '#e0f2fe' },
  action: { border: '#fb923c', bg: '#0e1118', text: '#ffedd5' },
  store: { border: '#4ade80', bg: '#0e1118', text: '#dcfce7' },
  component: { border: '#f43f5e', bg: '#0e1118', text: '#ffe4e6' },
  hook: { border: '#818cf8', bg: '#0e1118', text: '#e0e7ff' },
  api: { border: '#facc15', bg: '#0e1118', text: '#fef9c3' },
  other: { border: '#94a3b8', bg: '#0e1118', text: '#e2e8f0' },
};

export function getNodeColorConfig(fileType: NextFileType): { border: string; bg: string; text: string } {
  return COLOR_PALETTE[fileType] ?? COLOR_PALETTE.other;
}

const NODE_WIDTH = 260;
const NODE_HEIGHT = 80;

function applyDagreLayout(nodes: FlowNodeItem[], edges: FlowEdgeItem[], seenIds: Set<string>): void {
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
      const pos = dagreGraph.node(node.id);
      if (pos) {
        node.position = {
          x: Math.round(pos.x - NODE_WIDTH / 2),
          y: Math.round(pos.y - NODE_HEIGHT / 2),
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
}

export function buildFlowElements(
  files: Array<{ path: string; fileType: NextFileType }>,
  relations: CodeRelation[]
): { nodes: FlowNodeItem[]; edges: FlowEdgeItem[] } {
  const typeById = new Map<string, string>();
  const seenIds = new Set<string>();
  const idByPath = new Map<string, string>();
  const nodes: FlowNodeItem[] = [];

  for (const file of files) {
    let id = sanitizeNodeId(file.path);
    if (seenIds.has(id)) {
      let suffix = 2;
      while (seenIds.has(\`\${id}_\${suffix}\`)) suffix++;
      id = \`\${id}_\${suffix}\`;
    }
    seenIds.add(id);
    idByPath.set(file.path, id);

    typeById.set(id, file.fileType);
    nodes.push({
      id,
      label: file.path,
      path: file.path,
      fileType: file.fileType,
      position: { x: 0, y: 0 },
    });
  }

  const seenEdges = new Set<string>();
  const edges: FlowEdgeItem[] = [];

  relations.forEach((rel, i) => {
    const source = idByPath.get(rel.source) ?? sanitizeNodeId(rel.source);
    const target = idByPath.get(rel.target) ?? sanitizeNodeId(rel.target);
    const label = rel.label ?? '';
    const key = \`\${source}|\${target}|\${label}\`;
    if (seenEdges.has(key)) return;
    seenEdges.add(key);

    const isAction = typeById.get(target) === 'action' || typeById.get(source) === 'action';
    const targetType = (typeById.get(target) ?? 'other') as NextFileType;

    edges.push({
      id: \`e_\${source}_\${target}_\${i}\`,
      source,
      target,
      label: label || undefined,
      animated: isAction,
      style: { stroke: getNodeColorConfig(targetType).border },
    } as FlowEdgeItem);
  });

  applyDagreLayout(nodes, edges, seenIds);

  return { nodes, edges };
}
`;

const RAW_PAGE = `import { GitFork } from 'lucide-react';
import { FlowExplorer } from '@/components/FlowExplorer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#000000] text-[#ededed] flex flex-col font-sans selection:bg-white/20 selection:text-white bg-grid-pattern relative">

      <header className="border-b border-[#262626] bg-[#000000]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#171717] border border-[#262626] flex items-center justify-center text-white">
              <GitFork className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-xs tracking-wider text-white uppercase font-mono">
              Git Flowchart
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/chsnor/git_flowcahrt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#262626] bg-[#0a0a0a] hover:bg-[#171717]"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span className="font-mono text-[11px]">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <FlowExplorer />
    </main>
  );
}
`;

const RAW_FLOWEXPLORER = `'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AnalysisResult, NextFileType, SideDrawerState, FlowNodeItem } from '../types';
import { FlowCanvas } from './FlowCanvas';
import { SideDrawer } from './SideDrawer';
import {
  validateUrlInput,
  formatRepoStats,
  encodeShareableState,
  decodeShareableState
} from '../lib/ui-helper';
import { buildGitHubRawUrl, buildGitHubBlobUrl } from '../lib/github';
import { Share2, Check, Sparkles, AlertCircle, X } from 'lucide-react';

const SAMPLE_REPOSITORIES = [
  { label: 'Next.js 101 Course', url: 'https://github.com/chsnor/nextjs101' },
  { label: 'Next.js Commerce', url: 'https://github.com/vercel/commerce' },
  { label: 'Next.js Subscription', url: 'https://github.com/vercel/nextjs-subscription-payments' },
];

export function FlowExplorer() {
  const [url, setUrl] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [isCodeLoading, setIsCodeLoading] = useState<boolean>(false);

  const [drawerState, setDrawerState] = useState<SideDrawerState>({
    isOpen: false,
    filePath: null,
    fileContent: null,
    fileType: null,
    githubRawUrl: null,
  });

  async function handleSelectNode(
    filePath: string,
    fileType: NextFileType,
    owner = result?.owner,
    repo = result?.repoName,
    branch = result?.branch || 'main'
  ) {
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
    setIsCodeLoading(true);

    try {
      const headers: Record<string, string> = {};
      if (token?.trim()) headers['Authorization'] = \`Bearer \${token.trim()}\`;

      const res = await fetch(rawUrl, { headers });
      if (!res.ok) throw new Error(\`ไม่สามารถดึงไฟล์ได้ (HTTP \${res.status})\`);
      const code = await res.text();

      setDrawerState((prev) => ({ ...prev, fileContent: code }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดโค้ด';
      setDrawerState((prev) => ({ ...prev, fileContent: null }));
      setErrorMessage(msg);
    } finally {
      setIsCodeLoading(false);
    }
  }

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
        body: JSON.stringify({ url: cleanUrl, token: githubToken?.trim() || undefined }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'ไม่สามารถวิเคราะห์ข้อมูลจาก GitHub ได้');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);

      if (activeFilePath) {
        void handleSelectNode(activeFilePath, 'other', data.owner, data.repoName, data.branch);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const decoded = decodeShareableState(searchParams.get('state') || '');
    const targetUrl = searchParams.get('url') || decoded?.url;
    const targetNode = searchParams.get('node') || decoded?.activeNode;

    if (targetUrl) {
      setTimeout(() => {
        setUrl(targetUrl);
        void executeAnalysis(targetUrl, token, targetNode || undefined);
      }, 0);
    }

  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeAnalysis(url, token);
  };

  const handleShare = () => {
    if (!url || typeof window === 'undefined') return;
    const shareQuery = encodeShareableState(
      url,
      drawerState.isOpen ? drawerState.filePath ?? undefined : undefined,
    );
    const shareUrl = \`\${window.location.origin}\${window.location.pathname}?\${shareQuery}\`;

    if (navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(shareUrl).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      });
    }
  };

  const stats = result ? formatRepoStats(result.totalFiles, result.filteredFilesCount) : null;

  const counts = useMemo(() => {
    if (!result) return {};
    const map: Record<string, number> = { all: result.nodes.length };
    result.nodes.forEach((n) => {
      map[n.fileType] = (map[n.fileType] || 0) + 1;
    });
    return map;
  }, [result]);

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

  const displayedEdges = useMemo(() => {
    if (!result) return [];
    if (filterType === 'all') return result.edges;
    const activeIds = new Set(displayedNodes.map((n: FlowNodeItem) => n.id));
    return result.edges.filter((e) => activeIds.has(e.source) && activeIds.has(e.target));
  }, [result, displayedNodes, filterType]);

  return (
    <div className="max-w-7xl w-full mx-auto px-6 py-7 flex-1 flex flex-col gap-5">
      <section className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 shadow-2xl">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-8 space-y-1.5">
              <label htmlFor="github-url" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                GitHub Repository URL <span className="text-rose-400">*</span>
              </label>
              <input
                id="github-url"
                type="text"
                placeholder="https://github.com/chsnor/nextjs101"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className={\`w-full px-3.5 py-2.5 bg-[#000000] border rounded text-white font-mono text-xs placeholder:text-zinc-600 focus:outline-none transition \${
                  errorMessage
                    ? 'border-rose-500/80 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30'
                    : 'border-[#262626] focus:border-white'
                }\`}
              />
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label htmlFor="github-token" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>GitHub Token</span>
                <span className="text-[10px] text-zinc-500 lowercase">optional</span>
              </label>
              <input
                id="github-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#000000] border border-[#262626] rounded text-white font-mono text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white transition"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs font-mono animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed text-[11px] sm:text-xs">
                {errorMessage}
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 transition cursor-pointer shrink-0"
                aria-label="ปิดการแจ้งเตือน"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-zinc-400" />
              <span>ตัวอย่าง:</span>
            </span>
            {SAMPLE_REPOSITORIES.map((repo) => (
              <button
                key={repo.url}
                type="button"
                onClick={() => {
                  setUrl(repo.url);
                  setErrorMessage(null);
                  void executeAnalysis(repo.url, token);
                }}
                className="px-2.5 py-1 rounded text-[11px] font-mono bg-[#171717] hover:bg-[#262626] text-zinc-300 hover:text-white border border-[#262626] transition cursor-pointer"
              >
                {repo.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-500">
              รองรับ App Router, Server Actions, Client Components และ Stores
            </span>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-white hover:bg-zinc-200 disabled:bg-[#262626] disabled:text-zinc-600 text-black font-semibold text-xs rounded transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-black" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>กำลังวิเคราะห์...</span>
                </>
              ) : (
                <span>สร้าง Flowchart →</span>
              )}
            </button>
          </div>
        </form>
      </section>

      {result && (
        <section className="space-y-4 flex-1 flex flex-col">

          <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-white tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {result.owner}/{result.repoName}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#171717] text-zinc-300 border border-[#262626]">
                {result.branch || 'default'}
              </span>
            </div>

            {stats && (
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span>วิเคราะห์ได้:</span>
                  <span className="text-white font-medium">
                    <span className="font-semibold">{stats.analyzedCount}</span> ไฟล์
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span>คัดกรองออก:</span>
                  <span className="text-zinc-500 font-medium">
                    <span>{stats.ignoredCount}</span> ({stats.rawCount > 0 ? Math.round((stats.ignoredCount / stats.rawCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span>เส้นเชื่อม:</span>
                  <span className="text-zinc-300 font-medium">{result.relations.length}</span>
                </div>
                {result.executionTimeMs !== undefined && (
                  <div className="hidden lg:flex items-center gap-1 text-[11px] text-zinc-500">
                    <span>(<span>{Math.round(result.executionTimeMs)}</span>ms)</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="px-3.5 py-1.5 bg-[#171717] hover:bg-[#262626] text-zinc-200 text-xs font-medium rounded border border-[#262626] transition flex items-center gap-1.5 cursor-pointer font-mono"
              >
                {shareCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{shareCopied ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 px-1 overflow-x-auto pb-1 font-mono">
            <span className="font-medium text-zinc-500 mr-1 hidden sm:inline text-[11px]">FILTER:</span>

            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={\`px-3 py-1.5 rounded border text-xs font-medium transition cursor-pointer flex items-center gap-2 \${
                filterType === 'all'
                  ? 'bg-white border-white text-black font-semibold'
                  : 'bg-[#0a0a0a] border-[#262626] text-zinc-400 hover:text-white hover:bg-[#171717]'
              }\`}
            >
              <span>ALL</span>
              <span className={\`text-[10px] px-1.5 py-0.2 rounded border \${
                filterType === 'all' ? 'bg-zinc-200 text-black border-zinc-300' : 'bg-[#171717] text-zinc-400 border-[#262626]'
              }\`}>
                {counts.all ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType((prev) => (prev === 'page' ? 'all' : 'page'))}
              className={\`px-3 py-1.5 rounded border text-xs font-medium transition cursor-pointer flex items-center gap-2 \${
                filterType === 'page'
                  ? 'bg-white border-white text-black font-semibold'
                  : 'bg-[#0a0a0a] border-[#262626] text-zinc-400 hover:text-white hover:bg-[#171717]'
              }\`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
              <span>PAGE</span>
              {((counts.page ?? 0) + (counts.middleware ?? 0)) > 0 && (
                <span className={\`text-[10px] px-1.5 py-0.2 rounded border \${
                  filterType === 'page' ? 'bg-zinc-200 text-black border-zinc-300' : 'bg-[#171717] text-zinc-400 border-[#262626]'
                }\`}>
                  {(counts.page ?? 0) + (counts.middleware ?? 0)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterType((prev) => (prev === 'component' ? 'all' : 'component'))}
              className={\`px-3 py-1.5 rounded border text-xs font-medium transition cursor-pointer flex items-center gap-2 \${
                filterType === 'component'
                  ? 'bg-white border-white text-black font-semibold'
                  : 'bg-[#0a0a0a] border-[#262626] text-zinc-400 hover:text-white hover:bg-[#171717]'
              }\`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" />
              <span>COMPONENT</span>
              {(counts.component ?? 0) > 0 && (
                <span className={\`text-[10px] px-1.5 py-0.2 rounded border \${
                  filterType === 'component' ? 'bg-zinc-200 text-black border-zinc-300' : 'bg-[#171717] text-zinc-400 border-[#262626]'
                }\`}>
                  {counts.component ?? 0}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterType((prev) => (prev === 'action' ? 'all' : 'action'))}
              className={\`px-3 py-1.5 rounded border text-xs font-medium transition cursor-pointer flex items-center gap-2 \${
                filterType === 'action'
                  ? 'bg-white border-white text-black font-semibold'
                  : 'bg-[#0a0a0a] border-[#262626] text-zinc-400 hover:text-white hover:bg-[#171717]'
              }\`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#fb923c]" />
              <span>ACTION</span>
              {((counts.action ?? 0) + (counts.api ?? 0)) > 0 && (
                <span className={\`text-[10px] px-1.5 py-0.2 rounded border \${
                  filterType === 'action' ? 'bg-zinc-200 text-black border-zinc-300' : 'bg-[#171717] text-zinc-400 border-[#262626]'
                }\`}>
                  {(counts.action ?? 0) + (counts.api ?? 0)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterType((prev) => (prev === 'store' ? 'all' : 'store'))}
              className={\`px-3 py-1.5 rounded border text-xs font-medium transition cursor-pointer flex items-center gap-2 \${
                filterType === 'store'
                  ? 'bg-white border-white text-black font-semibold'
                  : 'bg-[#0a0a0a] border-[#262626] text-zinc-400 hover:text-white hover:bg-[#171717]'
              }\`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
              <span>STORE</span>
              {(counts.store ?? 0) > 0 && (
                <span className={\`text-[10px] px-1.5 py-0.2 rounded border \${
                  filterType === 'store' ? 'bg-zinc-200 text-black border-zinc-300' : 'bg-[#171717] text-zinc-400 border-[#262626]'
                }\`}>
                  {counts.store ?? 0}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterType((prev) => (prev === 'hook' ? 'all' : 'hook'))}
              className={\`px-3 py-1.5 rounded border text-xs font-medium transition cursor-pointer flex items-center gap-2 \${
                filterType === 'hook'
                  ? 'bg-white border-white text-black font-semibold'
                  : 'bg-[#0a0a0a] border-[#262626] text-zinc-400 hover:text-white hover:bg-[#171717]'
              }\`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8]" />
              <span>HOOK</span>
              {(counts.hook ?? 0) > 0 && (
                <span className={\`text-[10px] px-1.5 py-0.2 rounded border \${
                  filterType === 'hook' ? 'bg-zinc-200 text-black border-zinc-300' : 'bg-[#171717] text-zinc-400 border-[#262626]'
                }\`}>
                  {counts.hook ?? 0}
                </span>
              )}
            </button>
          </div>

          <div className="bg-[#000000] border border-[#262626] rounded-lg overflow-hidden h-[620px] relative shadow-2xl">
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

      <SideDrawer
        isOpen={drawerState.isOpen}
        onClose={() => setDrawerState((prev) => ({ ...prev, isOpen: false }))}
        filePath={drawerState.filePath ?? ''}
        fileType={drawerState.fileType ?? 'other'}
        rawCode={drawerState.fileContent ?? ''}
        githubRawUrl={drawerState.githubRawUrl ?? ''}
        isLoading={isCodeLoading}
      />
    </div>
  );
}

`;

const RAW_UIHELPER = `import { parseGitHubUrl } from './github';

export function validateUrlInput(input: string): { isValid: boolean; errorMessage: string | null } {
  if (!input || !input.trim()) {
    return { isValid: false, errorMessage: 'กรุณากรอก GitHub URL' };
  }

  const parsed = parseGitHubUrl(input.trim());
  if (!parsed || !parsed.owner || !parsed.repo) {
    return { isValid: false, errorMessage: 'URL ต้องมาจาก github.com และระบุเจ้าของกับคลังโค้ด (เช่น https://github.com/owner/repo)' };
  }

  return { isValid: true, errorMessage: null };
}

export function formatRepoStats(totalFiles: number, filteredFiles: number): {
  rawCount: number;
  analyzedCount: number;
  ignoredCount: number;
} {
  const rawCount = Math.max(0, Number.isFinite(totalFiles) ? totalFiles : 0);
  const analyzedCount = Math.max(0, Number.isFinite(filteredFiles) ? filteredFiles : 0);
  const ignoredCount = Math.max(0, rawCount - analyzedCount);

  return {
    rawCount,
    analyzedCount,
    ignoredCount,
  };
}

export function encodeShareableState(url: string, activeNode?: string): string {
  if (!url) return '';
  const params = new URLSearchParams();
  params.set('url', url);
  if (activeNode) params.set('node', activeNode);
  return params.toString();
}

export function decodeShareableState(paramStr: string): { url: string; activeNode?: string } | null {
  if (!paramStr || typeof paramStr !== 'string') return null;

  try {

    if (paramStr.includes('url=')) {
      const params = new URLSearchParams(paramStr.startsWith('?') ? paramStr.slice(1) : paramStr);
      const url = params.get('url');
      if (url) {
        return {
          url,
          activeNode: params.get('node') || undefined,
        };
      }
    }

    const raw = typeof window !== 'undefined' ? window.atob(paramStr) : Buffer.from(paramStr, 'base64').toString('utf-8');
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (parsed && typeof parsed.url === 'string') {
      return { url: parsed.url, activeNode: parsed.activeNode || undefined };
    }
  } catch {}

  return null;
}
`;

const RAW_CODEVIEWER = `import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup';

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'jsx',
  json: 'json',
  css: 'css',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
};

export function getLanguageFromPath(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') return 'clike';

  const lastDot = filePath.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filePath.length - 1) {
    return 'clike';
  }

  const extension = filePath.slice(lastDot + 1).toLowerCase();
  return EXTENSION_LANGUAGE_MAP[extension] ?? 'clike';
}

export interface FormattedCodeResult {
  snippet: string;
  code: string;
  totalLines: number;
  isTruncated: boolean;
  displayedLines: number;
}

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
  const isTruncated = totalLines > maxLines;
  const code = isTruncated ? lines.slice(0, maxLines).join('\\n') : rawCode;

  return {
    snippet: code,
    code,
    totalLines,
    isTruncated,
    displayedLines: isTruncated ? maxLines : totalLines,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function highlightCodeWithPrism(code: string, language: string): string {
  if (!code) return '';

  const grammar = Prism.languages[language];
  if (!grammar) {
    return escapeHtml(code);
  }

  try {
    return Prism.highlight(code, grammar, language);
  } catch {
    return escapeHtml(code);
  }
}
`;

const RAW_FLOWCANVAS = `'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
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
import { Search, Code2, X, SlidersHorizontal, Map as MapIcon, Layers } from 'lucide-react';

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

type TraceMode = 'full' | 'direct';

const COLUMNS = 4;
const COL_WIDTH = 320;
const ROW_HEIGHT = 120;

function computeTracePath(
  selectedNodeId: string | null,
  edges: FlowEdgeItem[],
  traceMode: TraceMode = 'full'
): { connectedNodeIds: Set<string>; connectedEdgeIds: Set<string> } {
  if (!selectedNodeId) {
    return { connectedNodeIds: new Set(), connectedEdgeIds: new Set() };
  }

  const connectedEdgeIds = new Set<string>();
  const visitedNodes = new Set<string>([selectedNodeId]);

  if (traceMode === 'direct') {
    for (const edge of edges) {
      if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
        connectedEdgeIds.add(edge.id);
        visitedNodes.add(edge.source);
        visitedNodes.add(edge.target);
      }
    }
    return { connectedNodeIds: visitedNodes, connectedEdgeIds };
  }

  const downstreamQueue: string[] = [selectedNodeId];
  while (downstreamQueue.length > 0) {
    const current = downstreamQueue.shift()!;
    for (const edge of edges) {
      if (edge.source === current) {
        connectedEdgeIds.add(edge.id);
        if (!visitedNodes.has(edge.target)) {
          visitedNodes.add(edge.target);
          downstreamQueue.push(edge.target);
        }
      }
    }
  }

  const upstreamQueue: string[] = [selectedNodeId];
  while (upstreamQueue.length > 0) {
    const current = upstreamQueue.shift()!;
    for (const edge of edges) {
      if (edge.target === current) {
        connectedEdgeIds.add(edge.id);
        if (!visitedNodes.has(edge.source)) {
          visitedNodes.add(edge.source);
          upstreamQueue.push(edge.source);
        }
      }
    }
  }

  return { connectedNodeIds: visitedNodes, connectedEdgeIds };
}

function toRfNodes(
  items: FlowNodeItem[],
  selectedNodeId: string | null,
  connectedNodeIds: Set<string>,
  onInspectNode?: (path: string, fileType: NextFileType) => void
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
    const opacity = isConnected ? 1 : 0.35;

    const nodeLabel = (
      <div className="flex flex-col gap-1.5 text-left select-none relative group">
        <div className="flex items-center justify-between">
          <span
            className="text-[9px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{ background: \`\${colors.border}15\`, color: colors.border, border: \`1px solid \${colors.border}30\` }}
          >
            {item.fileType}
          </span>
          <div className="flex items-center gap-1.5">
            {onInspectNode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspectNode(item.path, item.fileType);
                }}
                className="opacity-0 group-hover:opacity-100 hover:scale-105 p-1 rounded bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
                title="คลิกเพื่อดูโค้ดไฟล์นี้"
              >
                <Code2 className="w-3 h-3" />
              </button>
            )}
            <span
              className="w-1.5 h-1.5 rounded-full transition-transform"
              style={{
                background: colors.border,
                transform: isSelected ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          </div>
        </div>
        <div
          className={\`font-medium text-xs truncate transition-colors \${
            isSelected ? 'text-white font-semibold' : isConnected ? 'text-slate-200' : 'text-slate-400'
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
          ? \`1.5px solid \${colors.border}99\`
          : \`1px solid \${colors.border}45\`,
        background: '#0a0a0a',
        color: '#ededed',
        borderRadius: 6,
        padding: '12px 14px',
        fontSize: 12,
        width: 260,
        opacity,
        transition: 'all 0.15s ease',
        boxShadow: isSelected
          ? \`0 0 0 1px \${colors.border}, 0 8px 28px \${colors.border}35\`
          : '0 2px 8px rgba(0, 0, 0, 0.8)',
      },
    };
  });
}

function toRfEdges(
  items: FlowEdgeItem[],
  selectedNodeId: string | null,
  connectedEdgeIds: Set<string>
): Edge[] {
  return (items ?? []).map((item) => {
    const isConnected = selectedNodeId ? connectedEdgeIds.has(item.id) : true;

    const displayLabel = selectedNodeId && isConnected ? item.label : undefined;

    const strokeColor = item.style?.stroke || '#737373';
    const isHighlighted = selectedNodeId && isConnected;
    const isDimmed = selectedNodeId && !isConnected;

    return {
      id: item.id,
      source: item.source,
      target: item.target,
      label: displayLabel,
      animated: isHighlighted ? true : Boolean(item.animated),
      type: 'default',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: isHighlighted ? (strokeColor as string) : isDimmed ? '#1c1c1c' : '#525252',
      },
      style: {
        stroke: isHighlighted ? (strokeColor as string) : isDimmed ? '#1c1c1c' : '#525252',
        strokeWidth: isHighlighted ? 2 : 1.2,
        opacity: isDimmed ? 0.2 : 0.85,
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      labelStyle: {
        fill: isHighlighted ? '#ffffff' : '#a1a1aa',
        fontSize: 10,
        fontWeight: isHighlighted ? 600 : 500,
        fontFamily: 'var(--font-sans)',
      },
      labelBgStyle: {
        fill: '#0a0a0a',
        fillOpacity: 0.95,
        stroke: isHighlighted ? strokeColor : '#262626',
        strokeWidth: 1,
      },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 6,
    };
  });
}

function FlowCanvasInner({ nodes, edges, onSelectNode }: FlowCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [traceMode, setTraceMode] = useState<TraceMode>('full');
  const [showMiniMap, setShowMiniMap] = useState<boolean>(false);
  const [autoInspect, setAutoInspect] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  const { setCenter, fitView } = useReactFlow();

  const { connectedNodeIds, connectedEdgeIds } = useMemo(
    () => computeTracePath(selectedNodeId, edges, traceMode),
    [selectedNodeId, edges, traceMode]
  );

  const handleInspect = useCallback(
    (path: string, fileType: NextFileType) => {
      onSelectNode?.(path, fileType);
    },
    [onSelectNode]
  );

  const initialNodes = useMemo(
    () => toRfNodes(nodes, selectedNodeId, connectedNodeIds, handleInspect),
    [nodes, selectedNodeId, connectedNodeIds, handleInspect]
  );

  const initialEdges = useMemo(
    () => toRfEdges(edges, selectedNodeId, connectedEdgeIds),
    [edges, selectedNodeId, connectedEdgeIds]
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node<NodeData>>(initialNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  useEffect(() => {
    setRfNodes((prevNodes) => {
      const prevPositions = new Map(prevNodes.map((n) => [n.id, n.position]));
      return initialNodes.map((node) => {
        const prevPosition = prevPositions.get(node.id);
        return prevPosition ? { ...node, position: prevPosition } : node;
      });
    });
  }, [initialNodes, setRfNodes]);

  useEffect(() => {
    setRfEdges(initialEdges);
  }, [initialEdges, setRfEdges]);

  const handleClearFocus = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const focusAndPanToNode = useCallback(
    (nodeItem: FlowNodeItem) => {
      setSelectedNodeId(nodeItem.id);
      setIsSearchOpen(false);
      setSearchQuery('');

      const pos = (nodeItem as unknown as { position?: { x: number; y: number } }).position;
      if (pos) {
        void setCenter(pos.x + 130, pos.y + 40, { zoom: 1.2, duration: 500 });
      }

      if (autoInspect) {
        onSelectNode?.(nodeItem.path, nodeItem.fileType);
      }
    },
    [setCenter, autoInspect, onSelectNode]
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setShowSettingsMenu(false);
        if (selectedNodeId) {
          handleClearFocus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedNodeId, handleClearFocus]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    return nodes.filter((n) => n.path.toLowerCase().includes(query)).slice(0, 10);
  }, [nodes, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as globalThis.Node;
      if (!searchContainerRef.current?.contains(target)) setIsSearchOpen(false);
      if (!settingsMenuRef.current?.contains(target)) setShowSettingsMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="h-[550px] w-full rounded-2xl border border-dashed border-slate-800 bg-slate-950 flex items-center justify-center text-sm text-slate-500 font-sans">
        ยังไม่มีข้อมูลโหนดให้แสดง
      </div>
    );
  }

  return (
    <div className="h-[620px] w-full rounded-lg border border-[#262626] bg-[#000000] overflow-hidden relative font-sans shadow-2xl">

      <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2 max-w-[90%]">

        <div ref={searchContainerRef} className="relative">
          <div className="flex items-center gap-2 bg-[#000000]/90 backdrop-blur-md border border-[#262626] rounded-md px-2.5 py-1.5 text-zinc-300 shadow-md focus-within:border-white focus-within:ring-1 focus-within:ring-white/20 transition">
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="ค้นหาโหนด... (Ctrl+K)"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              className="w-28 sm:w-36 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none font-sans"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#171717] text-zinc-400 border border-[#262626]">
                /
              </kbd>
            )}
          </div>

          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute right-0 top-full mt-1.5 w-72 max-h-64 overflow-y-auto bg-[#0a0a0a] border border-[#262626] rounded-md shadow-2xl z-50 p-1.5 flex flex-col gap-1">
              <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                ผลการค้นหา ({searchResults.length})
              </div>
              {searchResults.map((item) => {
                const color = getNodeColorConfig(item.fileType).border;
                const fileName = item.path.split('/').pop() || item.path;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => focusAndPanToNode(item)}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-[#171717] text-left transition cursor-pointer group"
                  >
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                        {fileName}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono truncate">
                        {item.path}
                      </span>
                    </div>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold shrink-0"
                      style={{ background: \`\${color}15\`, color, border: \`1px solid \${color}30\` }}
                    >
                      {item.fileType}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedNodeId && (
          <div className="flex items-center gap-1 bg-[#000000]/90 backdrop-blur-md border border-[#262626] rounded-md p-1 shadow-md text-xs">
            <button
              type="button"
              onClick={handleClearFocus}
              className="px-2 py-1 rounded bg-[#171717] hover:bg-[#262626] text-zinc-300 hover:text-white transition flex items-center gap-1 cursor-pointer font-medium text-[11px]"
              title="ยกเลิกการ Focus โหนด (Esc)"
            >
              <X className="w-3 h-3 text-rose-400" />
              <span>ล้าง Focus</span>
            </button>
            <div className="h-3 w-[1px] bg-[#262626]" />
            <div className="flex items-center bg-[#0a0a0a] rounded p-0.5 border border-[#262626]">
              <button
                type="button"
                onClick={() => setTraceMode('full')}
                className={\`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer \${
                  traceMode === 'full'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }\`}
                title="เรืองแสงสืบย้อนต้นทางและปลายทางครบทั้งสาย"
              >
                ทั้งสาย
              </button>
              <button
                type="button"
                onClick={() => setTraceMode('direct')}
                className={\`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer \${
                  traceMode === 'direct'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }\`}
                title="เรืองแสงเฉพาะโหนดที่เชื่อมต่อติดกันโดยตรง"
              >
                1-Step
              </button>
            </div>
          </div>
        )}

        <div ref={settingsMenuRef} className="relative">
          <div className="flex items-center gap-1 bg-[#000000]/90 backdrop-blur-md border border-[#262626] rounded-md p-1 shadow-md text-xs">
            <button
              type="button"
              onClick={() => setShowMiniMap((prev) => !prev)}
              className={\`p-1.5 rounded transition cursor-pointer \${
                showMiniMap ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-[#171717]'
              }\`}
              title="เปิด/ปิด แผนที่ย่อ MiniMap"
            >
              <MapIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowSettingsMenu((prev) => !prev)}
              className={\`p-1.5 rounded transition cursor-pointer flex items-center gap-1 \${
                showSettingsMenu ? 'bg-[#262626] text-white' : 'text-zinc-400 hover:text-white hover:bg-[#171717]'
              }\`}
              title="ตัวเลือกการแสดงผลเพิ่มเติม"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {showSettingsMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#0a0a0a] border border-[#262626] rounded-md shadow-2xl z-50 p-2 flex flex-col gap-2 text-xs">

              <div>
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  พฤติกรรมการคลิก
                </span>
                <button
                  type="button"
                  onClick={() => setAutoInspect((prev) => !prev)}
                  className="w-full flex items-center justify-between p-1.5 rounded hover:bg-[#171717] transition cursor-pointer"
                >
                  <span className="text-zinc-300 text-[11px]">ดูโค้ดอัตโนมัติ</span>
                  <span
                    className={\`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold \${
                      autoInspect ? 'bg-white text-black' : 'bg-[#171717] text-zinc-400'
                    }\`}
                  >
                    {autoInspect ? 'เปิด' : 'ปิด'}
                  </span>
                </button>
              </div>

              <div className="h-[1px] bg-[#262626]" />

              <button
                type="button"
                onClick={() => {
                  void fitView({ padding: 0.2, duration: 400 });
                  setShowSettingsMenu(false);
                }}
                className="w-full flex items-center gap-1.5 p-1.5 rounded hover:bg-[#171717] text-zinc-300 hover:text-white transition cursor-pointer text-[11px]"
              >
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>จัดมุมมองพอดีจอ (Fit View)</span>
              </button>
            </div>
          )}
        </div>

      </div>

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
          const data = node.data as NodeData;
          if (autoInspect) {
            onSelectNode?.(data.path, data.fileType);
          }
        }}
        onPaneClick={handleClearFocus}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        onlyRenderVisibleElements={true}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#262626" />
        <Controls position="bottom-left" />
        {showMiniMap && (
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            maskColor="rgba(0, 0, 0, 0.85)"
            style={{
              background: '#0a0a0a',
              border: '1px solid #262626',
              borderRadius: '6px',
              width: 170,
              height: 110,
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.9)',
            }}
            nodeColor={(node) => getNodeColorConfig((node.data as NodeData).fileType).border}
          />
        )}
      </ReactFlow>
    </div>
  );
}

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
`;

const RAW_SIDEDRAWER = `'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, ExternalLink, Copy, Check, Loader2 } from 'lucide-react';
import { getLanguageFromPath, formatCodeSnippet, highlightCodeWithPrism } from '@/lib/code-viewer';
import 'prismjs/themes/prism-tomorrow.css';

export interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filePath?: string;
  fileType?: string;
  rawCode?: string;
  githubRawUrl?: string;
  isLoading?: boolean;
}

export function SideDrawer({
  isOpen,
  onClose,
  filePath = '',
  fileType = 'other',
  rawCode = '',
  githubRawUrl = '',
  isLoading = false,
}: SideDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [fullCodeFilePath, setFullCodeFilePath] = useState<string | null>(null);
  const showFullCode = Boolean(filePath && fullCodeFilePath === filePath);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { formattedCode, totalLines, isTruncated, language, highlightedHtml } = useMemo(() => {
    const lang = getLanguageFromPath(filePath);
    const lineLimit = showFullCode ? 20000 : 300;
    const snippet = formatCodeSnippet(rawCode, lineLimit);
    return {
      formattedCode: snippet.code,
      totalLines: snippet.totalLines,
      isTruncated: !showFullCode && snippet.isTruncated,
      language: lang,
      highlightedHtml: highlightCodeWithPrism(snippet.code, lang),
    };
  }, [filePath, rawCode, showFullCode]);

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
    <div className="fixed inset-0 z-50 flex justify-end">

      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Code Inspector Drawer"
        className="relative z-10 flex w-full max-w-2xl flex-col bg-[#000000] border-l border-[#262626] text-[#ededed] shadow-2xl animate-in slide-in-from-right duration-150"
      >

        <div className="flex items-center justify-between border-b border-[#262626] px-6 py-4 bg-[#0a0a0a]">
          <div className="flex flex-col gap-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <span data-testid="file-type-badge" className="rounded px-2 py-0.5 text-xs font-mono font-semibold uppercase bg-white text-black">
                {fileType}
              </span>
              <span className="text-xs text-zinc-400 font-mono">({language})</span>
            </div>
            <h2 title={filePath} className="truncate text-sm font-mono text-zinc-200">
              {filePath || 'ไม่ได้เลือกไฟล์'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-[#171717] transition-colors cursor-pointer"
            title="ปิดหน้าต่าง (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-[#262626] bg-[#000000] px-6 py-2.5 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-2">
            <span>{totalLines} บรรทัด</span>
            {isTruncated && (
              <span className="text-amber-400 font-mono text-[11px]">(แสดง 300 บรรทัดแรก)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isTruncated && (
              <button
                type="button"
                onClick={() => setFullCodeFilePath(filePath || null)}
                className="rounded bg-[#171717] hover:bg-[#262626] px-2.5 py-1 text-white text-xs transition-colors cursor-pointer border border-[#262626]"
              >
                ดูโค้ดทั้งหมด
              </button>
            )}
            {githubRawUrl && (
              <a
                href={githubRawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded bg-[#171717] hover:bg-[#262626] px-2.5 py-1 text-zinc-300 transition-colors cursor-pointer border border-[#262626]"
              >
                <span>เปิดบน GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={handleCopy}
              disabled={isLoading || !rawCode}
              className="flex items-center gap-1.5 rounded bg-[#171717] hover:bg-[#262626] disabled:opacity-50 px-2.5 py-1 text-zinc-300 transition-colors cursor-pointer border border-[#262626]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกโค้ด</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-auto p-6 font-mono text-sm bg-[#000000]">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
              <span className="text-xs">กำลังโหลดซอร์สโค้ดจาก GitHub...</span>
            </div>
          ) : rawCode ? (
            <pre className={\`language-\${language} m-0 overflow-x-auto !bg-transparent !p-0\`}>
              <code className={\`language-\${language} !bg-transparent font-mono\`} dangerouslySetInnerHTML={{ __html: highlightedHtml || formattedCode }} />
            </pre>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500 text-xs">
              ไม่พบเนื้อหาโค้ดในไฟล์นี้
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;

const RAW_LAYOUT = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Git Flowchart",
  description: "Next.js App Router Architecture & Flowchart Visualizer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

`;

const RAW_TYPES = `export type NextFileType = 'page' | 'layout' | 'action' | 'middleware' | 'store' | 'component' | 'hook' | 'api' | 'other';

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
  mermaidSyntax?: string;
  isCached?: boolean;
  cachedAt?: number;
  commitSha?: string;
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
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "IBM Plex Sans Thai", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

:root {
  --background: #000000;
  --foreground: #ededed;
}

body {
  font-family: var(--font-sans);
  background-color: var(--background);
  color: var(--foreground);
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.bg-grid-pattern {
  background-size: 32px 32px;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
}

::selection {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: #000000;
}

::-webkit-scrollbar-thumb {
  background: #262626;
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: #404040;
}

.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
  color: #71717a !important;
  font-style: italic;
}

.token.punctuation {
  color: #a1a1aa !important;
}

.token.property,
.token.tag,
.token.boolean,
.token.number,
.token.constant,
.token.symbol {
  color: #fb923c !important;
}

.token.selector,
.token.attr-name,
.token.string,
.token.char,
.token.builtin {
  color: #4ade80 !important;
}

.token.operator,
.token.entity,
.token.url {
  color: #38bdf8 !important;
}

.token.atrule,
.token.attr-value,
.token.keyword {
  color: #c084fc !important;
}

.token.function,
.token.class-name {
  color: #60a5fa !important;
}

.token.regex,
.token.important,
.token.variable {
  color: #f43f5e !important;
}

`;

const RAW_TEST1 = `import { describe, it, expect } from 'vitest';
import { parseGitHubUrl, buildGitHubApiUrl, buildGitHubHeaders, buildGitHubRawUrl, buildGitHubBlobUrl } from './github';

describe('parseGitHubUrl', () => {
  it('แยก owner/repo จาก URL ปกติ', () => {
    expect(parseGitHubUrl('https://github.com/chsnor/nextjs101')).toEqual({
      owner: 'chsnor',
      repo: 'nextjs101',
      branch: undefined,
    });
  });

  it('รับ URL ที่ไม่มี protocol และตัด .git ออก', () => {
    expect(parseGitHubUrl('github.com/owner/repo')).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: undefined,
    });
    expect(parseGitHubUrl('https://github.com/owner/repo.git')).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: undefined,
    });
  });

  it('อ่านชื่อ branch จาก /tree/<branch> และ /blob/<branch>', () => {
    expect(parseGitHubUrl('https://github.com/owner/repo/tree/develop')?.branch).toBe('develop');
    expect(parseGitHubUrl('https://github.com/owner/repo/blob/main/src/a.ts')?.branch).toBe('main');
    expect(parseGitHubUrl('https://github.com/owner/repo/tree')?.branch).toBeUndefined();
  });

  it('ปฏิเสธ hostname ปลอมที่เดิมหลุดได้ด้วย endsWith', () => {
    expect(parseGitHubUrl('https://evilgithub.com/owner/repo')).toBeNull();
    expect(parseGitHubUrl('https://github.com.evil.com/owner/repo')).toBeNull();
    expect(parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull();
  });

  it('รับ www.github.com และปฏิเสธค่าที่ไม่ครบหรือผิดรูปแบบ', () => {
    expect(parseGitHubUrl('https://www.github.com/owner/repo')?.owner).toBe('owner');
    expect(parseGitHubUrl('https://github.com')).toBeNull();
    expect(parseGitHubUrl('https://github.com/owner')).toBeNull();
    expect(parseGitHubUrl('')).toBeNull();
    expect(parseGitHubUrl('not a url')).toBeNull();
  });
});

describe('buildGitHubApiUrl / buildGitHubHeaders', () => {
  it('สร้าง endpoint ดึง tree พร้อม branch', () => {
    expect(buildGitHubApiUrl('o', 'r')).toBe('https://api.github.com/repos/o/r/git/trees/main?recursive=1');
    expect(buildGitHubApiUrl('o', 'r', 'master')).toContain('/trees/master?recursive=1');
  });

  it('ใส่ Authorization เฉพาะเมื่อมี token ที่ใช้งานได้', () => {
    expect(buildGitHubHeaders()).toEqual({ 'User-Agent': 'GitFlow-Visualizer' });
    expect(buildGitHubHeaders('   ')).not.toHaveProperty('Authorization');
    expect(buildGitHubHeaders(' ghp_abc ').Authorization).toBe('Bearer ghp_abc');
  });
});

describe('buildGitHubRawUrl / buildGitHubBlobUrl', () => {
  it('สร้าง raw url ตามพาธและ branch', () => {
    expect(buildGitHubRawUrl('o', 'r', 'src/app/page.tsx', 'master')).toBe(
      'https://raw.githubusercontent.com/o/r/master/src/app/page.tsx',
    );
  });

  it('สลับ argument ได้เมื่อผู้เรียบเรียงส่งสลับกัน', () => {
    expect(buildGitHubRawUrl('o', 'r', 'develop', 'src/app/page.tsx')).toBe(
      'https://raw.githubusercontent.com/o/r/develop/src/app/page.tsx',
    );
  });

  it('สร้าง blob url และตัด slash ซ้ำซ้อนด้านหน้า', () => {
    expect(buildGitHubBlobUrl('o', 'r', '/src/a.ts', 'main')).toBe(
      'https://github.com/o/r/blob/main/src/a.ts',
    );
  });
});
`;

const RAW_TEST2 = `import { describe, it, expect } from "vitest";
import {
  filterTreeFiles,
  detectNextFileType,
  extractImportsFromCode,
  extractActionTriggers,
} from "./parser";
import type { GitHubTreeItem } from "../types";

const blob = (path: string): GitHubTreeItem => ({
  path,
  mode: "100644",
  type: "blob",
  sha: "x",
});

describe("detectNextFileType: ข้อบังคับของ Next.js (เชื่อถือได้เสมอ)", () => {
  it("จำแนกไฟล์พิเศษของ App Router", () => {
    expect(detectNextFileType("src/app/about/page.tsx")).toBe("page");
    expect(detectNextFileType("src/app/(marketing)/page.tsx")).toBe("page");
    expect(detectNextFileType("src/app/layout.tsx")).toBe("layout");
    expect(detectNextFileType("src/app/api/route.ts")).toBe("api");
  });

  it("จำแนก middleware ที่ระดับ root และใน src", () => {
    expect(detectNextFileType("middleware.ts")).toBe("middleware");
    expect(detectNextFileType("src/middleware.ts")).toBe("middleware");
  });

  it("จำแนก Pages Router (legacy)", () => {
    expect(detectNextFileType("pages/index.tsx")).toBe("page");
    expect(detectNextFileType("pages/about.tsx")).toBe("page");
    expect(detectNextFileType("pages/blog/[slug].tsx")).toBe("page");
    expect(detectNextFileType("pages/api/users.ts")).toBe("api");
  });
});

describe("detectNextFileType: รองรับเอกพจน์/พหูพจน์ (บั๊กเดิมรองรับแค่พหูพจน์)", () => {
  it("จำแนก store ทั้ง store/ และ stores/", () => {
    expect(detectNextFileType("src/store/gameStore.ts")).toBe("store");
    expect(detectNextFileType("src/stores/gameStore.ts")).toBe("store");
    expect(detectNextFileType("src/state/cart.ts")).toBe("store");
    expect(detectNextFileType("src/context/Theme.tsx")).toBe("store");
    expect(detectNextFileType("src/contexts/Theme.tsx")).toBe("store");
  });

  it("จำแนก component ทั้ง component/ และ components/", () => {
    expect(detectNextFileType("src/components/Foo.tsx")).toBe("component");
    expect(detectNextFileType("src/component/Foo.tsx")).toBe("component");
  });

  it("จำแนก action ทั้ง action/ และ actions/", () => {
    expect(detectNextFileType("src/actions/doThing.ts")).toBe("action");
    expect(detectNextFileType("src/action/doThing.ts")).toBe("action");
    expect(detectNextFileType("src/app/products/actions.ts")).toBe("action");
  });
});

describe("detectNextFileType: ชื่อโฟลเดอร์ที่พบจริงในโปรเจกต์ Next.js", () => {
  it("รองรับ ui/, widgets/, views/ เป็น component", () => {
    expect(detectNextFileType("src/ui/Button.tsx")).toBe("component");
    expect(detectNextFileType("src/widgets/Header/Header.tsx")).toBe(
      "component",
    );
    expect(detectNextFileType("src/views/Home.tsx")).toBe("component");
    expect(detectNextFileType("packages/ui/src/Button.tsx")).toBe("component");
  });

  it("รองรับ private folder _components ของ Next.js", () => {
    expect(detectNextFileType("app/blog/_components/Post.tsx")).toBe(
      "component",
    );
  });

  it("รองรับโฟลเดอร์ hooks/ และไฟล์ use hook", () => {
    expect(detectNextFileType("src/hooks/useAuth.ts")).toBe("hook");
    expect(detectNextFileType("src/lib/useAuth.ts")).toBe("hook");
    expect(detectNextFileType("src/useGameStore.ts")).toBe("store");
  });

  it("ไม่นับ user.ts / restore.ts ผิดเป็น hook หรือ store", () => {
    expect(detectNextFileType("src/lib/user.ts")).toBe("other");
    expect(detectNextFileType("src/lib/restore.ts")).toBe("other");
    expect(detectNextFileType("src/lib/restoreState.ts")).toBe("other");
  });

  it("รองรับ store ที่เป็นไฟล์ ไม่ใช่โฟลเดอร์", () => {
    expect(detectNextFileType("src/store.ts")).toBe("store");
    expect(detectNextFileType("src/lib/gameStore.ts")).toBe("store");
    expect(detectNextFileType("src/lib/ZustandStore.ts")).toBe("store");
    expect(detectNextFileType("src/lib/auth-store.ts")).toBe("store");
    expect(detectNextFileType("src/features/cart/model/store.ts")).toBe(
      "store",
    );
  });

  it("โปรเจ็คที่ไม่ตาม convention เลยจะตกเป็น other", () => {
    expect(detectNextFileType("lib/application.js")).toBe("other");
    expect(detectNextFileType("src/services/auth.ts")).toBe("other");
    expect(detectNextFileType("src/App.tsx")).toBe("other");
  });

  it("รับค่าที่ไม่ใช่นามสกุลที่รองรับหรือค่าผิดปกติได้", () => {
    expect(detectNextFileType("")).toBe("other");
    expect(detectNextFileType("src/styles/globals.css")).toBe("other");
  });
});

describe("filterTreeFiles", () => {
  it("ตัดไฟล์ติดตั้ง config lock และไฟล์ทดสอบออก", () => {
    const result = filterTreeFiles([
      blob("src/app/page.tsx"),
      blob("node_modules/react/index.js"),
      blob("package-lock.json"),
      blob("next.config.ts"),
      blob("src/lib/parser.test.ts"),
      blob("src/types/index.d.ts"),
      blob(".gitignore"),
    ]);
    expect(result.map((f) => f.path)).toEqual(["src/app/page.tsx"]);
  });

  it("อนุญาต root file เฉพาะ middleware/proxy", () => {
    const result = filterTreeFiles([blob("middleware.ts"), blob("random.ts")]);
    expect(result.map((f) => f.path)).toEqual(["middleware.ts"]);
  });

  it("ไม่เกิน maxLimit และทน input ผิดรูปแบบ", () => {
    const many = Array.from({ length: 10 }, (_, i) => blob(\`src/lib/f\${i}.ts\`));
    expect(filterTreeFiles(many, 3)).toHaveLength(3);
    expect(
      filterTreeFiles([{ path: "x.ts", type: "tree", mode: "", sha: "" }]),
    ).toEqual([]);
    expect(
      filterTreeFiles("not-an-array" as unknown as GitHubTreeItem[]),
    ).toEqual([]);
  });
});

describe("extractImportsFromCode", () => {
  it("เก็บเฉพาะ import ที่อ้างถึงไฟล์ในโปรเจ็ค", () => {
    const code = [
      "import { a } from './local';",
      "import type { B } from '@/types';",
      "import React from 'react';",
      "import fs from 'node:fs';",
    ].join("\\n");
    const relations = extractImportsFromCode("src/x.ts", code);
    expect(relations.map((r) => r.target)).toEqual(["./local", "@/types"]);
    expect(relations.every((r) => r.type === "import")).toBe(true);
  });

  it("ไม่ซ้ำเป้าหมายเดิม และคืน [] เมื่อไม่มี import", () => {
    const code = "import a from './x';\\nimport b from './x';";
    expect(extractImportsFromCode("src/x.ts", code)).toHaveLength(1);
    expect(extractImportsFromCode("src/x.ts", "const a = 1;")).toEqual([]);
    expect(extractImportsFromCode("src/x.ts", "")).toEqual([]);
  });
});

describe("extractActionTriggers", () => {
  it("สกัด onClick event และ form action", () => {
    const code = [
      "export function X() {",
      "  return (",
      "    <form action={submitOrder}>",
      "      <button onClick={handleClick}>go</button>",
      "    </form>",
      "  );",
      "}",
    ].join("\\n");
    const relations = extractActionTriggers("src/components/X.tsx", code);
    expect(relations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target: "handleClick",
          type: "event",
          label: "onClick",
        }),
        expect.objectContaining({
          target: "submitOrder",
          type: "action",
          label: "form action",
        }),
      ]),
    );
  });

  it("ไม่คืนผลเมื่อไม่มี event หรือ action", () => {
    expect(extractActionTriggers("src/x.ts", "const a = 1;")).toEqual([]);
  });
});
`;

const RAW_TEST3 = `import { describe, it, expect } from "vitest";
import {
  sanitizeNodeId,
  getNodeColorConfig,
  buildFlowElements,
  generateMermaidSyntax,
} from "../lib/generator";

describe("sanitizeNodeId", () => {
  it("แปลงพาธเป็น id ที่ใช้อักขระปลอดภัย", () => {
    expect(sanitizeNodeId("src/app/page.tsx")).toBe("src_app_page_tsx");
    expect(sanitizeNodeId("src/app/[slug]/page.tsx")).toBe(
      "src_app_slug_page_tsx",
    );
    expect(sanitizeNodeId("src/app/(marketing)/page.tsx")).toBe(
      "src_app_marketing_page_tsx",
    );
  });

  it("ไม่คืนค่าว่าง", () => {
    expect(sanitizeNodeId("")).toBe("node");
    expect(sanitizeNodeId("///")).toBe("node");
  });
});

describe("getNodeColorConfig", () => {
  it("คืนสีตามประเภทไฟล์ และ fallback เป็น other เมื่อไม่รู้จัก", () => {
    expect(getNodeColorConfig("page").border).toBe("#38bdf8");
    expect(getNodeColorConfig("hook").border).toBe("#818cf8");
    expect(getNodeColorConfig("unknown-type" as never)).toEqual(
      getNodeColorConfig("other"),
    );
  });
});

describe("buildFlowElements", () => {
  it("สร้างโหนดหนึ่งต่อหนึ่งไฟล์ และเชื่อม edge ตามพาธจริง", () => {
    const files = [
      { path: "src/app/page.tsx", fileType: "page" as const },
      { path: "src/components/Foo.tsx", fileType: "component" as const },
    ];
    const { nodes, edges } = buildFlowElements(files, [
      {
        source: "src/app/page.tsx",
        target: "src/components/Foo.tsx",
        label: "uses component",
      },
    ]);

    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe("src_app_page_tsx");
    expect(edges[0].target).toBe("src_components_Foo_tsx");
    expect(edges[0].label).toBe("uses component");
  });

  it("ไม่ทิ้งโหนดเมื่อพาธต่างกันแต่ sanitize ได้ id เดียวกัน (บั๊กเดิม)", () => {
    const files = [
      { path: "a/b.ts", fileType: "other" as const },
      { path: "a-b.ts", fileType: "other" as const },
    ];
    const { nodes, edges } = buildFlowElements(files, [
      { source: "a/b.ts", target: "a-b.ts", label: "imports" },
    ]);

    expect(nodes).toHaveLength(2);
    expect(new Set(nodes.map((n) => n.id)).size).toBe(2);
    // edge ต้องชี้ไปที่ id จริงของโหนดทั้งสอง ไม่ใช่ id ที่ชนกัน
    expect(edges[0].source).toBe("a_b_ts");
    expect(edges[0].target).toBe("a_b_ts_2");
    expect(nodes.map((n) => n.id)).toContain(edges[0].target);
  });

  it("คำนวณพิกัดโหนดและไม่ใส่ edge ซ้ำ", () => {
    const files = [{ path: "src/a.ts", fileType: "other" as const }];
    const { nodes, edges } = buildFlowElements(files, [
      { source: "src/a.ts", target: "src/b.ts", label: "imports" },
      { source: "src/a.ts", target: "src/b.ts", label: "imports" },
    ]);
    expect(edges).toHaveLength(1);
    expect(Number.isFinite(nodes[0].position.x)).toBe(true);
    expect(Number.isFinite(nodes[0].position.y)).toBe(true);
  });

  it("ไม่ crash เมื่อไม่มีไฟล์หรือ relation", () => {
    expect(buildFlowElements([], [])).toEqual({ nodes: [], edges: [] });
  });
});

describe("generateMermaidSyntax", () => {
  it("คืนผังว่างเมื่อไม่มี relation", () => {
    expect(generateMermaidSyntax([])).toBe(
      'graph TD\\n  Empty["No local relations found"]',
    );
  });

  it("สร้างผัง graph TD พร้อมป้ายกำกับ", () => {
    const mermaid = generateMermaidSyntax([
      { source: "src/a.ts", target: "src/b.ts", label: "imports" },
    ]);
    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain('src_a_ts["src/a.ts"]');
    expect(mermaid).toContain('-->|"imports"|');
  });
});
`;

const RAW_TEST4 = `import { describe, it, expect } from 'vitest';
import {
  validateUrlInput,
  formatRepoStats,
  calculateHealthScore,
  encodeShareableState,
  decodeShareableState,
} from './ui-helper';

describe('validateUrlInput', () => {
  it('ผ่านเมื่อเป็น github.com ที่มี owner/repo ครบ', () => {
    expect(validateUrlInput('https://github.com/chsnor/nextjs101')).toEqual({
      isValid: true,
      errorMessage: null,
    });
    expect(validateUrlInput('github.com/owner/repo').isValid).toBe(true);
    expect(validateUrlInput('https://www.github.com/owner/repo').isValid).toBe(true);
  });

  it('ปฏิเสธโดเมนอื่น', () => {
    const r = validateUrlInput('https://gitlab.com/owner/repo');
    expect(r.isValid).toBe(false);
    expect(r.errorMessage).toBe('URL ต้องมาจาก github.com เท่านั้น');
  });

  it('ปฏิเสธ URL ที่เพียงแค่มีคำว่า github.com อยู่ข้างใน (บั๊กเดิม)', () => {
    expect(validateUrlInput('https://evil.com/?x=github.com/owner/repo').isValid).toBe(false);
    expect(validateUrlInput('https://evilgithub.com/owner/repo').isValid).toBe(false);
  });

  it('ปฏิเสธ input ว่าง ไม่ครบ owner/repo หรือมีอักขระอันตราย', () => {
    expect(validateUrlInput('')).toEqual({ isValid: false, errorMessage: 'กรุณากรอก GitHub URL' });
    expect(validateUrlInput('   ').isValid).toBe(false);
    expect(validateUrlInput('https://github.com').isValid).toBe(false);
    expect(validateUrlInput('https://github.com/owner').isValid).toBe(false);
    expect(validateUrlInput('<script>github.com</script>').isValid).toBe(false);
    expect(validateUrlInput('javascript:alert(1)').isValid).toBe(false);
  });
});

describe('formatRepoStats', () => {
  it('คำนวณจำนวนไฟล์ที่ละเว้นและข้อความสรุป', () => {
    const stats = formatRepoStats(100, 31);
    expect(stats).toEqual({
      rawCount: 100,
      analyzedCount: 31,
      ignoredCount: 69,
      summaryText: 'วิเคราะห์โค้ดทั้งหมด 31 ไฟล์ จากทั้งหมด 100 ไฟล์ (ละเว้น 69 ไฟล์ คิดเป็น 69%)',
    });
  });

  it('ไม่คืนค่าติดลบหรือ NaN', () => {
    expect(formatRepoStats(NaN, 5).rawCount).toBe(0);
    expect(formatRepoStats(10, -1).analyzedCount).toBe(0);
  });
});

describe('calculateHealthScore', () => {
  it('ให้ N/A เมื่อไม่มีไฟล์', () => {
    expect(calculateHealthScore(0, 0).grade).toBe('N/A');
  });

  it('ให้เกรดตามสัดส่วนเส้นเชื่อมต่อจำนวนไฟล์', () => {
    expect(calculateHealthScore(10, 10).grade).toBe('A'); // ratio 1.0
    expect(calculateHealthScore(30, 10).grade).toBe('B'); // ratio 3.0
    expect(calculateHealthScore(100, 10).grade).toBe('C'); // ratio 10
    expect(calculateHealthScore(1, 10).grade).toBe('C'); // ratio 0.1 (เชื่อมโยงต่ำไป)
  });

  it('ไม่คืนค่า NaN เมื่อ input ผิดปกติ', () => {
    expect(calculateHealthScore(NaN, 10).ratio).toBe(0);
  });
});

describe('encode/decodeShareableState', () => {
  it('ไป-กลับได้ค่าเดิม', () => {
    const encoded = encodeShareableState('https://github.com/o/r', 'src/a.ts');
    expect(decodeShareableState(encoded)).toEqual({
      url: 'https://github.com/o/r',
      activeNode: 'src/a.ts',
    });
  });

  it('คืน activeNode เป็น undefined เมื่อไม่ได้ส่งมา', () => {
    const encoded = encodeShareableState('https://github.com/o/r');
    expect(decodeShareableState(encoded)).toEqual({
      url: 'https://github.com/o/r',
      activeNode: undefined,
    });
  });

  it('ทนข้อมูลเสียโดยคืน null แทนการ throw', () => {
    expect(decodeShareableState('')).toBeNull();
    expect(decodeShareableState('!!!not-base64!!!')).toBeNull();
    expect(encodeShareableState('')).toBe('');
  });
});
`;



const RAW_GITHUB = `import { ParsedGitHubUrl } from '../types';

function parseBranchFromSegments(segments: string[]): string | undefined {
  const markerIndex = segments.findIndex((seg) => seg === 'tree' || seg === 'blob');
  if (markerIndex === -1 || markerIndex + 1 >= segments.length) return undefined;
  return segments.slice(markerIndex + 1).join('/') || undefined;
}

export function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  if (!url || typeof url !== 'string') return null;
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  try {
    const fullUrl = /^https?:\\/\\//i.test(trimmedUrl) ? trimmedUrl : \`https://\${trimmedUrl}\`;
    const parsed = new URL(fullUrl);

    const hostname = parsed.hostname.toLowerCase();
    if (hostname !== 'github.com' && hostname !== 'www.github.com') return null;

    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length < 2) return null;

    const branch = parseBranchFromSegments(segments);
    const owner = segments[0];
    let repo = segments[1];
    if (repo.toLowerCase().endsWith('.git')) repo = repo.slice(0, -4);

    return owner && repo ? { owner, repo, branch } : null;
  } catch {
    return null;
  }
}

export function buildGitHubApiUrl(owner: string, repo: string, branch = 'main'): string {
  return \`https://api.github.com/repos/\${owner}/\${repo}/git/trees/\${branch}?recursive=1\`;
}

export function buildGitHubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'GitFlow-Visualizer',
  };

  if (token && typeof token === 'string' && token.trim().length > 0) {
    headers['Authorization'] = \`Bearer \${token.trim()}\`;
  }

  return headers;
}

export function buildGitHubRawUrl(owner: string, repo: string, filePath: string, branch = 'main'): string {
  const cleanPath = filePath.replace(/^\\/+/, '');
  return \`https://raw.githubusercontent.com/\${owner}/\${repo}/\${branch}/\${cleanPath}\`;
}

export function buildGitHubBlobUrl(owner: string, repo: string, filePath: string, branch = 'main'): string {
  const cleanPath = filePath.replace(/^\\/+/, '');
  return \`https://github.com/\${owner}/\${repo}/blob/\${branch}/\${cleanPath}\`;
}
`;

// 6 LOGICAL BLOCKS DEFINITION (ครอบคลุมทั้ง 3 ไฟล์: pipeline.ts, route.ts, github.ts)

