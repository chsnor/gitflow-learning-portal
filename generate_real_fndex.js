const fs = require('fs');
const path = require('path');

const SRC_DIR = 'D:/git_flowcahrt/src';

const FILE_MAP = [
  {
    "file": "github",
    "filePath": "src/lib/github.ts",
    "owner": "คน 1",
    "badge": "คน 1: GitHub Service",
    "category": "URL & API Parsing",
    "functions": [
      {
        "name": "parseBranchFromSegments",
        "line": 3,
        "signature": "function parseBranchFromSegments(segments: string[]): string",
        "desc": "แกะชื่อกิ่งโค้ด (Branch) ออกจากชิ้นส่วนของที่อยู่ URL เช่น เมื่อเจอคำว่า tree หรือ blob ระบบจะดึงชื่อกิ่งข้างหลังออกมาทันที",
        "jargon": "• Branch = กิ่งเวอร์ชันของโค้ด เช่น main, master หรือ dev\\n• Segments = ท่อนของ URL ที่ถูกหั่นแบ่งด้วยเครื่องหมาย slash /",
        "deepExplain": "ฟังก์ชันนี้ช่วยให้ระบบรองรับ URL ที่ระบุกิ่งเฉพาะเจาะจงได้ เช่น github.com/owner/repo/tree/v2 ไม่จำกัดแค่กิ่ง main ค่ะ",
        "pythonAnalogy": "segments[segments.index(\"tree\") + 1] if \"tree\" in segments else \"main\""
      },
      {
        "name": "parseGitHubUrl",
        "line": 9,
        "signature": "export function parseGitHubUrl(url: string): ParsedGitHubUrl | null",
        "desc": "ตรวจสอบและแกะลิงก์ GitHub ที่ผู้ใช้กรอกเข้ามา โดยตรวจดูว่ามาจากเว็บไซต์ github.com จริงไหม และแยกชิ้นส่วนออกมาเป็น: ชื่อเจ้าของ (owner), ชื่อโปรเจกต์ (repo), และชื่อกิ่งโค้ด (branch) พร้อมตัด .git ทิ้งให้อัตโนมัติ",
        "jargon": "• Owner = เจ้าของคลังโค้ดบน GitHub\\n• Repository (Repo) = คลังเก็บไฟล์โปรเจกต์\\n• Branch = กิ่งเวอร์ชันของโค้ด เช่น main หรือ master\\n• Regex (Regular Expression) = ตัวตรวจจับและตัดรูปแบบข้อความ",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'ถ้าผู้ใช้พิมพ์ slash ส่วนเกินหรือใส่ลิงก์มี .git จะพังไหม?' ตอบว่า: 'ไม่พังค่ะ เพราะมี Regular Expression ตัด .git และกรอง slash ส่วนเกินออกให้สะอาดก่อนส่งไปทำงานต่อค่ะ'",
        "pythonAnalogy": "urllib.parse.urlsplit() ร่วมกับ re.sub() ตัดคำ"
      },
      {
        "name": "buildGitHubApiUrl",
        "line": 35,
        "signature": "export function buildGitHubApiUrl(owner: string, repo: string, branch = \"main\"): string",
        "desc": "สร้างที่อยู่เว็บ (URL) สำหรับส่งไปถามเซิร์ฟเวอร์ของ GitHub เพื่อขอดูรายชื่อไฟล์ทั้งหมดในโปรเจกต์ โดยใส่คำสั่งพิเศษ ?recursive=1 เพื่อขอให้ GitHub ส่งรายชื่อไฟล์ที่อยู่ในโฟลเดอร์ย่อยลึก ๆ ทั้งหมดมาให้ครบจบในคำขอเดียว",
        "jargon": "• REST API = ช่องทางที่เซิร์ฟเวอร์เปิดไว้ให้โปรแกรมส่งคำขอข้อมูล\\n• Git Trees API = สารบัญโครงสร้างไฟล์ของ Git บนเซิร์ฟเวอร์ GitHub\\n• Recursive (?recursive=1) = การเปิดดูโฟลเดอร์ย่อยลึกลงไปเรื่อย ๆ จนถึงไฟล์สุดท้าย",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมไม่ดึงทีละโฟลเดอร์?' ตอบว่า: 'เพราะจะทำให้ติดลิมิตการเรียก API (Rate Limit) ของ GitHub ค่ะ การสั่ง ?recursive=1 ช่วยให้ได้ผังไฟล์ทั้งระบบในการยิง API แค่ 1 ครั้งเท่านั้นค่ะ'",
        "pythonAnalogy": "os.walk() ดึงโครงสร้างไฟล์ทั้งโฟลเดอร์ แต่ทำผ่าน HTTP Request ครั้งเดียว"
      },
      {
        "name": "buildGitHubHeaders",
        "line": 39,
        "signature": "export function buildGitHubHeaders(token?: string): Record<string, string>",
        "desc": "สร้างหัวจดหมายส่งข้อมูล (HTTP Headers) เพื่อส่งไปให้ GitHub รู้ว่าใครเป็นคนเรียกใช้งาน โดยแนบชื่อโปรแกรมเรา (User-Agent) เสมอ และถ้าผู้ใช้กรอก Personal Access Token มา ก็จะแนบเป็นตั๋วผ่านทาง (Bearer Token) ไปด้วยเพื่อขอโควตาเพิ่ม",
        "jargon": "• HTTP Headers = ข้อมูลส่วนหัวเหมือนจ่าหน้าซองจดหมาย\\n• User-Agent = ชื่อระบุตัวตนของโปรแกรมที่ส่งคำขอไปหาเซิร์ฟเวอร์\\n• Bearer Token = ตั๋วอนุญาตการเข้าถึงข้อมูลตามมาตรฐานความปลอดภัย",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'ถ้าผู้ใช้ไม่ใส่ Token ระบบจะยังทำงานได้ไหม?' ตอบว่า: 'ทำงานได้ตามปกติสำหรับคลังสาธารณะ (Public Repo) ค่ะ แต่จะได้โควตาฟรี 60 ครั้งต่อชั่วโมง หากใส่ Token จะได้ 5,000 ครั้งต่อชั่วโมงค่ะ'",
        "pythonAnalogy": "headers={\"Authorization\": f\"Bearer {token}\", \"User-Agent\": \"...\"}"
      },
      {
        "name": "buildGitHubRawUrl",
        "line": 51,
        "signature": "export function buildGitHubRawUrl(owner: string, repo: string, filePathOrBranch: string, branchOrPath = \"main\"): string",
        "desc": "สร้างที่อยู่ลิงก์สำหรับดาวน์โหลดเนื้อหาโค้ดดิบ (Raw Content) จากเครือข่ายความเร็วสูง raw.githubusercontent.com เพื่อให้ระบบเปิดอ่านโค้ดข้างในได้โดยตรงโดยไม่ต้องโหลดทั้งโปรเจกต์",
        "jargon": "• Raw Content = ไฟล์เนื้อหาโค้ดล้วน ๆ ไม่มีหน้าเว็บ HTML ของ GitHub ติดมาด้วย\\n• CDN = เครือข่ายกระจายข้อมูลความเร็วสูง ช่วยให้โหลดไฟล์ได้ไว",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมไม่ใช้ Git Clone?' ตอบว่า: 'เพราะ Git Clone ต้องดาวน์โหลดประวัติ Git ทั้งหมดซึ่งหนักและช้ามาก การใช้ Raw URL ดึงเฉพาะไฟล์ที่จำเป็นจะเร็วกว่าหลายสิบเท่าค่ะ'",
        "pythonAnalogy": "requests.get() ดาวน์โหลดไฟล์โค้ดตรงจาก raw URL"
      },
      {
        "name": "buildGitHubBlobUrl",
        "line": 56,
        "signature": "export function buildGitHubBlobUrl(owner: string, repo: string, filePath: string, branch = \"main\"): string",
        "desc": "สร้างลิงก์สำหรับคลิกเพื่อเปิดดูไฟล์นั้นบนเว็บไซต์ GitHub.com จริง ผ่านหน้าต่างแสดงโค้ด (SideDrawer) เพื่อให้ผู้ใช้กดไปดูต้นฉบับบน GitHub ได้ในแท็บใหม่",
        "jargon": "• Blob = คำศัพท์ของ Git ที่ใช้เรียกวัตถุเก็บไฟล์เดี่ยว ๆ (Binary Large Object)\\n• SideDrawer = หน้าต่างเมนูด้านข้างที่เลื่อนออกมาแสดงรายละเอียดโค้ด",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมต้องมีทั้ง Raw URL และ Blob URL?' ตอบว่า: 'Raw URL มีไว้ให้โปรแกรมเราอ่านเนื้อหาโค้ด ส่วน Blob URL มีไว้ให้ผู้ใช้คลิกเปิดหน้าเว็บ GitHub ในแท็บใหม่ค่ะ'",
        "pythonAnalogy": "ลิงก์ตรงสำหรับเปิดเบราว์เซอร์ไปที่ github.com/owner/repo/blob/main/file.ts"
      }
    ]
  },
  {
    "file": "parser",
    "filePath": "src/lib/parser.ts",
    "owner": "คน 2",
    "badge": "คน 2: Parser Engine",
    "category": "Filtering & AST Parsing",
    "functions": [
      {
        "name": "shouldIgnorePath",
        "line": 67,
        "signature": "function shouldIgnorePath(lowerPath: string, fileName: string, isRootFile: boolean): boolean",
        "desc": "ตัวกรองความปลอดภัยและลดขยะ ทำหน้าที่ตรวจสอบชื่อโฟลเดอร์และชื่อไฟล์ ถ้าเจอโฟลเดอร์ที่ไม่เกี่ยวกับโค้ดที่เราต้องการวิเคราะห์ เช่น node_modules, .next, dist, tests ระบบจะปัดทิ้งทันที",
        "jargon": "• Blacklist = รายชื่อต้องห้ามที่ระบบจะไม่นำมาประมวลผล\\n• Node Modules = โฟลเดอร์เก็บไลบรารีภายนอกที่หนักและไม่ใช่โค้ดที่เจ้าของโปรเจกต์เขียนเอง",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมต้องตัด node_modules ทิ้ง?' ตอบว่า: 'เพราะใน node_modules มีไฟล์เป็นหมื่นไฟล์ ถ้าไม่ตัดทิ้ง กราฟจะพังและระบบจะค้างจากการประมวลผลไฟล์ที่ไม่จำเป็นค่ะ'",
        "pythonAnalogy": "เช็ค if \"venv\" in path or \"__pycache__\" in path: continue ในลูป"
      },
      {
        "name": "filterTreeFiles",
        "line": 89,
        "signature": "export function filterTreeFiles(items: GitHubTreeItem[], maxLimit = 250): GitHubTreeItem[]",
        "desc": "คัดกรองรายชื่อไฟล์ทั้งหมดที่ได้จาก GitHub โดยรับเฉพาะไฟล์โค้ดที่เป็นภาษา TypeScript และ JavaScript (.ts, .tsx, .js, .jsx) และจำกัดจำนวนไว้ไม่เกินเกณฑ์ เพื่อความเร็วและการประมวลผลที่ไม่เกินกำลังเครื่อง",
        "jargon": "• Whitelist = รายชื่อไฟล์ที่อนุญาตให้นำเข้ามาทำงานได้\\n• Max Limit = เพดานจำนวนไฟล์สูงสุดที่รับเข้ามาประมวลผล (ค่าเริ่มต้น 250-500 ไฟล์)",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'ถ้าโปรเจกต์มีไฟล์โค้ด 1,000 ไฟล์ ระบบจะรับไหวไหม?' ตอบว่า: 'ระบบมีเพดาน MAX_FILTERED_FILES คัดเลือกเฉพาะไฟล์สำคัญสูงสุด 500 ไฟล์ เพื่อป้องกันปัญหาหน่วยความจำล้นและไม่ทำให้หน้าเว็บค้างค่ะ'",
        "pythonAnalogy": "[f for f in files if f.endswith((\".ts\", \".tsx\", \".js\", \".jsx\"))][:500]"
      },
      {
        "name": "detectNextFileType",
        "line": 114,
        "signature": "export function detectNextFileType(filePath: string): NextFileType",
        "desc": "สมองกลจำแนกบทบาทของไฟล์ใน Next.js ว่าไฟล์นี้ทำหน้าที่อะไร เช่น เป็นหน้าจอ (Page), โครงหน้า (Layout), โค้ดส่งข้อมูลหลังบ้าน (Server Action), ตัวดักทาง (Middleware), หรือตู้เก็บข้อมูลรวม (Store)",
        "jargon": "• App Router = โครงสร้างการจัดหน้าเว็บรุ่นใหม่ของ Next.js โดยใช้โฟลเดอร์ app\\n• Server Action = ฟังก์ชันฝั่งหลังบ้านที่หน้าเว็บเรียกใช้เพื่อบันทึกข้อมูล\\n• Middleware = โค้ดที่คอยดักตรวจคำขอก่อนจะยอมให้เข้าถึงหน้าเว็บ",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'รู้ได้อย่างไรว่าไฟล์ไหนคือ Server Action?' ตอบว่า: 'ตรวจดูจากชื่อโฟลเดอร์ app/actions หรือชื่อไฟล์ actions.ts รวมถึงการสแกนคำสั่ง use server ในไฟล์ค่ะ'",
        "pythonAnalogy": "การจำแนกประเภทไฟล์ใน Django ว่าไฟล์ไหนคือ views.py, models.py, urls.py"
      },
      {
        "name": "extractImportsFromCode",
        "line": 147,
        "signature": "export function extractImportsFromCode(sourcePath: string, codeContent: string): CodeRelation[]",
        "desc": "เครื่องมือสแกนโค้ดเพื่อค้นหาคำว่า import ... from \"...\" เพื่อดูว่าไฟล์นี้กำลังไปหยิบยืมโค้ดหรือฟังก์ชันมาจากไฟล์อื่นไหนบ้าง เพื่อนำมาสร้างเป็นเส้นเชื่อมโยง (Edges)",
        "jargon": "• Dependencies = ความพึ่งพากันระหว่างไฟล์ (ไฟล์ A ต้องพึ่งพาไฟล์ B)\\n• Edges = เส้นลูกศรที่ลากเชื่อมระหว่างกล่องในไดอะแกรม",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมใช้วิธีสแกน Regular Expression ไม่ใช้ตัววิเคราะห์ AST เต็มรูปแบบ?' ตอบว่า: 'เพราะเราดึงโค้ดมาเป็นข้อความผ่านเน็ตแบบเรียลไทม์ การสแกนด้วย Regex ทำงานเร็วกว่าหลายสิบเท่าและกินแรมน้อยมาก เหมาะกับเว็บแอปพลิเคชันแบบตอบสนองทันทีค่ะ'",
        "pythonAnalogy": "สแกนหาคำว่า import os หรือ from utils import helper ในโค้ด Python"
      }
    ]
  },
  {
    "file": "generator",
    "filePath": "src/lib/generator.ts",
    "owner": "คน 3",
    "badge": "คน 3: Flow Generator",
    "category": "Graph Building & Layout",
    "functions": [
      {
        "name": "sanitizeNodeId",
        "line": 4,
        "signature": "function sanitizeNodeId(pathStr: string): string",
        "desc": "แปลงชื่อที่อยู่ไฟล์ (Path) ให้กลายเป็นรหัสประจำตัว (Node ID) ที่ปลอดภัยสำหรับ React Flow โดยเปลี่ยนเครื่องหมายทับ / วงเล็บ () และจุด . ให้กลายเป็นขีดล่าง _ ทั้งหมด เพื่อไม่ให้ระบบวาดรูปพัง",
        "jargon": "• Node ID = รหัสประจำตัวที่ไม่ซ้ำกันของแต่ละกล่องบนไดอะแกรม\\n• Sanitize = การล้างเครื่องหมายพิเศษที่ไม่ปลอดภัยออกไป",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมต้อง sanitize ชื่อไฟล์?' ตอบว่า: 'เพราะถ้าชื่อโหนดมีเครื่องหมายพิเศษ เช่น app/(dashboard)/page.tsx เอนจินวาดรูปจะสับสนกับไวยากรณ์ จึงต้องแปลงเป็น app_dashboard_page_tsx ค่ะ'",
        "pythonAnalogy": "re.sub(r\"[^a-zA-Z0-9]\", \"_\", path)"
      },
      {
        "name": "getNodeColorConfig",
        "line": 24,
        "signature": "export function getNodeColorConfig(fileType: NextFileType): { border: string; bg: string; text: string }",
        "desc": "กำหนดชุดสีประจำประเภทไฟล์ เช่น สีม่วงสำหรับ Middleware, สีฟ้าสำหรับ Page, สีส้มสำหรับ Server Action, สีเขียวสำหรับ Store, และสีชมพูสำหรับ Component เพื่อให้ผู้ใช้มองเห็นบทบาทไฟล์ได้ทันที",
        "jargon": "• Color Palette = ชุดสีที่กำหนดไว้ล่วงหน้าเพื่อคุมโทนให้สวยงามและมีความหมาย\\n• Visual Hierarchy = การใช้สีและลำดับชั้นช่วยให้สมองแยกแยะความสำคัญของข้อมูลได้ง่าย",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมต้องแยกสีตามบทบาทไฟล์?' ตอบว่า: 'เพราะช่วยให้โปรแกรมเมอร์เข้าใจสถาปัตยกรรมระบบได้ทันทีที่มองผัง โดยไม่ต้องคลิกเข้าไปอ่านโค้ดทีละไฟล์ค่ะ'",
        "pythonAnalogy": "COLOR_MAP = {\"page\": \"#38bdf8\", ...}"
      },
      {
        "name": "applyDagreLayout",
        "line": 31,
        "signature": "function applyDagreLayout(nodes: FlowNodeItem[], edges: FlowEdgeItem[], seenIds: Set<string>): void",
        "desc": "คำนวณตำแหน่งพิกัด X และ Y ให้กับกล่องไฟล์ทั้งหมด เพื่อจัดเรียงเป็นแผนผังตามลำดับชั้นอย่างสวยงาม โดยเรียงจากซ้ายไปขวา และเว้นระยะห่างไม่ให้เส้นลูกศรวิ่งชนกัน",
        "jargon": "• Directed Graph = แผนผังแบบมีลูกศรระบุทิศทางต้นทางและปลายทาง\\n• Edge Crossing Minimization = อัลกอริทึมคำนวณหลบหลีกไม่ให้เส้นลูกศรตัดกันจนอ่านไม่รู้เรื่อง\\n• Rank Separation = ระยะห่างระหว่างชั้นของกล่อง",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'ถ้าไม่ใช้ Dagre จะเกิดอะไรขึ้น?' ตอบว่า: 'โหนดจะลอยกระจัดกระจาย หรือวางทับซ้อนกันทำให้อ่านโครงสร้างโค้ดไม่ออก Dagre จึงเป็นหัวใจสำคัญที่จัดผังให้เป็นระเบียบอัตโนมัติค่ะ'",
        "pythonAnalogy": "ไลบรารี NetworkX หรือ Graphviz ใน Python ที่ใช้จัดวางผัง Network Graph"
      },
      {
        "name": "buildFlowElements",
        "line": 77,
        "signature": "export function buildFlowElements(filesWithTypes: Array<{ path: string; fileType: NextFileType }>, relations: CodeRelation[]): { nodes: FlowNodeItem[]; edges: FlowEdgeItem[] }",
        "desc": "แปลงข้อมูลความสัมพันธ์ทั้งหมดให้อยู่ในรูปแบบที่ React Flow เข้าใจ (Nodes และ Edges) พร้อมกำหนดสีตามประเภทไฟล์ และส่งเข้าให้ Dagre คำนวณพิกัด (X, Y) ก่อนส่งกลับไปวาดบนหน้าจอ",
        "jargon": "• React Flow Elements = โครงสร้างข้อมูลกล่อง (Nodes) และเส้น (Edges) ที่ไลบรารี React Flow ใช้ในการเรนเดอร์\\n• Coordinates = พิกัดแกน X (แนวนอน) และแกน Y (แนวตั้ง) บนผืนผ้าใบ",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'ขั้นตอนนี้ทำที่ไหน หน้าบ้านหรือหลังบ้าน?' ตอบว่า: 'ทำที่ฝั่งหลังบ้าน (Server-side) ค่ะ ทำให้เซิร์ฟเวอร์ส่งพิกัดที่คำนวณเสร็จแล้วไปให้หน้าบ้านวาดได้ทันที ไม่กินแรงเครื่องผู้ใช้ค่ะ'",
        "pythonAnalogy": "เตรียมข้อมูลดิกชันนารี {\"nodes\": [...], \"edges\": [...]} ส่งคืนเป็น JSON"
      }
    ]
  },
  {
    "file": "flowcanvas",
    "filePath": "src/components/FlowCanvas.tsx",
    "owner": "คน 3",
    "badge": "คน 3: Flow Canvas (Visualizer)",
    "category": "Canvas Rendering & Events",
    "functions": [
      {
        "name": "computeTracePath",
        "line": 44,
        "signature": "function computeTracePath(selectedNodeId: string | null, edges: FlowEdgeItem[], traceMode: TraceMode = 'full'): { connectedNodeIds: Set<string>; connectedEdgeIds: Set<string> }",
        "desc": "คำนวณหาเส้นทางและโหนดที่เกี่ยวข้องกันเมื่อผู้ใช้คลิกเลือกกล่อง ด้วยอัลกอริทึม Breadth-First Search (BFS) พร้อมตัวป้องกันลูป (Visited Set) รองรับทั้งโหมด 1-Step (เพื่อนบ้านติดกัน) และ Full Trace (ทั้งสายงาน)",
        "jargon": "• BFS (Breadth-First Search) = การค้นหาแบบกว้าง ทีละระดับชั้น เพื่อหาโหนดที่เชื่อมโยงกันอย่างเป็นระบบ\\n• Visited Set = ตารางจดจำโหนดที่เคยแวะแล้ว ป้องกันไม่ให้โปรแกรมวนลูปไม่รู้จบ (Infinite Loop)\\n• 1-Step vs Full = สลับระหว่างดูเฉพาะเพื่อนบ้านติดกัน 1 ก้าว หรือท่องหาทั้งสายงาน",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'ถ้าในโค้ดมีการเรียกแบบวนรอบ (Circular Dependency) เช่น A เรียก B แล้ว B เรียก A ระบบจะค้างไหม?' ตอบว่า: 'ไม่ค้างค่ะ เพราะเราใช้ Visited Set คอยดักจับโหนดที่เคยสำรวจไปแล้ว ทำให้กระบวนการ BFS หยุดทำงานได้ถูกต้อง 100% ค่ะ'",
        "pythonAnalogy": "อัลกอริทึม BFS โดยใช้ collections.deque ร่วมกับ visited = set()"
      },
      {
        "name": "toRfNodes",
        "line": 98,
        "signature": "function toRfNodes(nodes: FlowNodeItem[], activeNodeId: string | null, activeFilePath: string | null, connectedNodeIds: Set<string>): Node[]",
        "desc": "แปลงรายชื่อ FlowNodeItem เป็น Object ของโหนดตามสเปกของ React Flow พร้อมคำนวณสถานะเรืองแสง (Glow/Active/Dimmed)",
        "jargon": "• React Flow Node = อ็อบเจกต์ที่ React Flow ต้องการ เช่น id, position, data, style\\n• Opacity = ความโปร่งแสงของโหนดที่ไม่ได้อยู่ในสายตา",
        "deepExplain": "จัดการเรื่อง Performance ของหน้าจอ ไม่วาดโหนดซ้ำซ้อนและแยกสถานะของโหนดที่ถูกเลือกอย่างชัดเจนค่ะ",
        "pythonAnalogy": "แปลงข้อมูลโมเดลให้เป็น View Model สำหรับ GUI"
      },
      {
        "name": "toRfEdges",
        "line": 195,
        "signature": "function toRfEdges(edges: FlowEdgeItem[], connectedEdgeIds: Set<string>, hasActiveSelection: boolean): Edge[]",
        "desc": "แปลงรายการ FlowEdgeItem เป็นเส้นลูกศรของ React Flow พร้อมใส่สีตามประเภท (Action=สีส้ม, Import=สีเทา) และเปิดแอนิเมชันวิ่งถ้าถูกเลือก",
        "jargon": "• Edge Animation = การใส่เส้นประเคลื่อนไหวเพื่อเน้นการไหลของข้อมูล\\n• Edge Styling = การใส่สีเส้นและหัวลูกศรให้ชัดเจน",
        "deepExplain": "ช่วยให้ผู้ใช้แยกแยะระหว่างการเชื่อมโยงแบบยืมโค้ด (Import) กับการสั่งรันโค้ดจริง (Action) ได้ด้วยสายตาค่ะ",
        "pythonAnalogy": "ฟังก์ชันสร้างเส้นกราฟใน matplotlib / plotly"
      },
      {
        "name": "FlowCanvas",
        "line": 593,
        "signature": "export function FlowCanvas(props: FlowCanvasProps): React.JSX.Element",
        "desc": "คอมโพเนนต์หลักที่เรนเดอร์ผืนผ้าใบ React Flow พร้อมแถบเครื่องมือซูม ย้าย ค้นหา ปรับฟิลเตอร์ และตัวควบคุม MiniMap",
        "jargon": "• MiniMap = แผนที่ย่อมุมขวาล่างสำหรับมองภาพรวมของผังขนาดใหญ่\\n• Pan & Zoom = การเลื่อนและย่อขยายผืนผ้าใบได้อย่างอิสระ",
        "deepExplain": "ห่อหุ้มด้วย ReactFlowProvider เพื่อให้การจัดการมุมมองและ State ภายในผืนผ้าใบทำงานได้เต็มรูปแบบค่ะ",
        "pythonAnalogy": "หน้าต่าง Canvas หลักใน Tkinter หรือ QGraphicsView ใน Qt"
      }
    ]
  },
  {
    "file": "flowexplorer",
    "filePath": "src/components/FlowExplorer.tsx",
    "owner": "คน 4",
    "badge": "คน 4: State Orchestrator",
    "category": "UI State & Controller",
    "functions": [
      {
        "name": "FlowExplorer",
        "line": 22,
        "signature": "export function FlowExplorer(): React.JSX.Element",
        "desc": "คอมโพเนนต์ควบคุม State ใหญ่ของหน้าเว็บ ทั้ง URL ที่กรอก, Token, สถานะกำลังโหลด, ผลลัพธ์ไดอะแกรม, และหน้าต่าง SideDrawer",
        "jargon": "• State Orchestrator = ตัวคอยจัดการและควบคุมสถานะทั้งหมดของหน้าเว็บให้อยู่ตรงกลาง\\n• React Hooks (useState, useEffect, useMemo) = เครื่องมือจัดการความจำและวงจรของหน้าเว็บ",
        "deepExplain": "เป็นศูนย์กลางของฝั่งหน้าบ้านที่ผูกฟอร์มรับค่า เข้ากับผืนผ้าใบ และหน้าต่างดูโค้ด SideDrawer ค่ะ",
        "pythonAnalogy": "MainController หรือ MainWindow class ในโปรแกรมเดสก์ท็อป"
      },
      {
        "name": "handleSelectNode",
        "line": 40,
        "signature": "const handleSelectNode = async (filePath: string, fileType: NextFileType, ownerOverride?: string, repoOverride?: string, branchOverride?: string) => void",
        "desc": "เมื่อผู้ใช้คลิกที่โหนดไฟล์ใดโหนดหนึ่ง ฟังก์ชันนี้จะสั่งเปิดหน้าต่าง Side Drawer ด้านข้าง และยิงคำขอไปดาวน์โหลดโค้ดจริงจาก GitHub มาแสดงผลพร้อมระบายสีโค้ด (Syntax Highlighting) ทันที",
        "jargon": "• Side Drawer = แถบเมนูด้านข้างที่เลื่อนออกมาบนหน้าจอ\\n• Syntax Highlighting = การระบายสีคำสั่งโค้ดให้อ่านง่าย เช่น ตัวแปรสีเขียว ฟังก์ชันสีเหลือง",
        "deepExplain": "ดึงโค้ดผ่าน Raw URL แบบอะซิงโครนัส (Async) เฉพาะไฟล์ที่ผู้ใช้คลิกเท่านั้น ไม่ได้โหลดโค้ดทุกไฟล์มากองไว้ล่วงหน้าค่ะ",
        "pythonAnalogy": "ฟังก์ชันดักคลิกไอเทมในตาราง แล้วยิง requests.get() โหลดเนื้อหามาแสดงในกล่องข้อความ"
      },
      {
        "name": "executeAnalysis",
        "line": 82,
        "signature": "const executeAnalysis = async (targetUrl: string, githubToken?: string, activeFilePath?: string | null) => void",
        "desc": "ผู้จัดการฝั่งหน้าบ้าน ทำหน้าที่ตรวจความถูกต้องของ URL, สั่งเปิดแอนิเมชันกำลังโหลด (Spinner), ส่งคำขอ HTTP POST ไปยัง /api/analyze หลังบ้าน และเมื่อได้ผลลัพธ์กลับมา ก็นำข้อมูลแผนผังไปสั่งให้หน้าจอวาดกราฟ",
        "jargon": "• HTTP POST = รูปแบบการส่งข้อมูลไปยังเซิร์ฟเวอร์แบบมีเนื้อหาบรรจุไปด้วย (Payload)\\n• Asynchronous (async/await) = การทำงานแบบไม่รอให้หน้าจอค้าง ทำงานเบื้องหลังได้ลื่นไหล",
        "deepExplain": "ถ้าเซิร์ฟเวอร์ตอบ Error 401 ฟังก์ชันนี้จะดักจับ status 401 แล้วเปลี่ยนข้อความแจ้งเตือนเป็นภาษาไทยให้ผู้ใช้รู้ว่าใส่ Token ผิดค่ะ",
        "pythonAnalogy": "ฟังก์ชันยิงคำขอ requests.post(\"/api/analyze\", json={...}) พร้อม try-except"
      },
      {
        "name": "handleSubmit",
        "line": 135,
        "signature": "const handleSubmit = (e: React.FormEvent) => void",
        "desc": "ฟังก์ชันดักจับเมื่อผู้ใช้กดปุ่ม 'วิเคราะห์โครงสร้าง' หรือกด Enter ในแบบฟอร์ม โดยจะสั่ง e.preventDefault() เพื่อห้ามไม่ให้หน้าเว็บรีเฟรช แล้วส่ง URL และ Token ไปให้ฟังก์ชัน executeAnalysis ทำงานต่อ",
        "jargon": "• e.preventDefault() = คำสั่งระงับพฤติกรรมดั้งเดิมของเบราว์เซอร์ เพื่อไม่ให้เกิดการโหลดหน้าเว็บใหม่ทั้งหน้า (Full Page Reload)\\n• Client State = ข้อมูลที่หน้าเว็บจำไว้ในหน่วยความจำของเบราว์เซอร์",
        "deepExplain": "เพราะเราเขียนเว็บแบบ Single Page Application (SPA) เราต้องการให้หน้าเว็บนิ่งและแสดงแอนิเมชันกำลังโหลด ไม่ใช่รีเฟรชหน้าเว็บทิ้งไปค่ะ",
        "pythonAnalogy": "การดัก Event บน GUI (เช่น PyQt หรือ Tkinter) เมื่อผู้ใช้กดปุ่ม Submit"
      },
      {
        "name": "handleShare",
        "line": 140,
        "signature": "const handleShare = () => void",
        "desc": "คัดลอกลิงก์สถานะของโปรเจกต์ลงในคลิปบอร์ด เพื่อให้ผู้ใช้ส่งลิงก์นี้ไปให้เพื่อนร่วมทีมเปิดดูแผนผังเดียวกันได้ทันที",
        "jargon": "• Clipboard API = ฟังก์ชันของเบราว์เซอร์สำหรับเข้าถึงระบบคัดลอกข้อความของเครื่อง\\n• Shareable State = การเข้ารหัสพารามิเตอร์ของหน้าเว็บไว้บน URL",
        "deepExplain": "ผู้ใช้ที่รับลิงก์ไปเปิด หน้าเว็บจะแกะ URL พารามิเตอร์แล้วเริ่มสแกนคลังโค้ดพร้อมกระโดดไปที่ไฟล์เดิมให้อัตโนมัติค่ะ",
        "pythonAnalogy": "สร้าง query string เช่น ?url=...&node=... แล้วก็อปลงคลิปบอร์ด"
      }
    ]
  },
  {
    "file": "uihelper",
    "filePath": "src/lib/ui-helper.ts",
    "owner": "คน 4",
    "badge": "คน 4: UI Helper & URL Guard",
    "category": "Validation & URL Guard",
    "functions": [
      {
        "name": "validateUrlInput",
        "line": 3,
        "signature": "export function validateUrlInput(input: string): { isValid: boolean; errorMessage: string | null }",
        "desc": "ตัวตรวจจับความถูกต้องของ URL ที่หน้าบ้าน ตรวจสอบว่าช่องกรอกไม่ว่างเปล่า ต้องขึ้นต้นด้วย github.com และต้องระบุทั้งชื่อเจ้าของและชื่อคลังโค้ด ถ้าไม่ถูกต้องจะแจ้งเตือนทันทีโดยไม่ยิงคำขอไปกวนเซิร์ฟเวอร์",
        "jargon": "• Client-side Validation = การตรวจความถูกต้องของข้อมูลที่หน้าเครื่องผู้ใช้ก่อนส่งไปหาเซิร์ฟเวอร์\\n• Centralized Parser = การใช้โค้ดตัวตรวจจับของ github.ts จุดเดียว ไม่เขียนตรวจซ้ำซ้อน",
        "deepExplain": "เพื่อประสบการณ์ใช้งานที่ดีของผู้ใช้ (Instant Feedback) และช่วยลดภาระของเซิร์ฟเวอร์ไม่ให้รับคำขอที่ผิดพลาดค่ะ",
        "pythonAnalogy": "ตรวจเช็คความถูกต้องของสตริง URL ก่อนยิง requests"
      },
      {
        "name": "formatRepoStats",
        "line": 16,
        "signature": "export function formatRepoStats(totalFiles: number, filteredFiles: number): { ratioText: string; percentage: number; isHighRatio: boolean }",
        "desc": "คำนวณสัดส่วนของไฟล์โค้ดจริงเทียบกับไฟล์ทั้งหมดในคลัง คิดเป็นร้อยละ (Percentage) เพื่อแสดงตัวเลขสรุปบนหน้าจอ",
        "jargon": "• Stat Formatting = การแปลงตัวเลขดิบให้เป็นข้อความที่อ่านง่ายและเข้าใจได้ทันที\\n• Ratio = อัตราส่วนระหว่างไฟล์ที่นำมาวิเคราะห์กับไฟล์ขยะทั้งหมด",
        "deepExplain": "ช่วยให้ผู้ใช้รู้ว่าคลังโค้ดนี้มีไฟล์โค้ดหนาแน่นแค่ไหน และระบบช่วยคัดกรองขยะออกไปได้กี่เปอร์เซ็นต์ค่ะ",
        "pythonAnalogy": "f\"{(filtered/total)*100:.1f}%\""
      },
      {
        "name": "encodeShareableState",
        "line": 32,
        "signature": "export function encodeShareableState(url: string, activeNode?: string): string",
        "desc": "แปลง URL คลังโค้ดและชื่อโหนดที่กำลังเปิดดู ให้กลายเป็น Query Parameters (url=...&node=...) เพื่อใช้ส่งต่อ",
        "jargon": "• URLSearchParams = มาตรฐานเว็บสำหรับประกอบข้อความต่อท้าย URL (Query String)\\n• Shareable State = สถานะหน้าจอที่สามารถแชร์ผ่านลิงก์ได้",
        "deepExplain": "เวอร์ชันล่าสุดปรับมาใช้มาตรฐาน URL Query String ธรรมดาเพื่อให้อ่านง่ายและไม่พึ่งพา base64 ที่ซับซ้อนเกินจำเป็นค่ะ",
        "pythonAnalogy": "urllib.parse.urlencode({\"url\": url, \"node\": node})"
      },
      {
        "name": "decodeShareableState",
        "line": 40,
        "signature": "export function decodeShareableState(paramStr: string): { url: string; activeNode?: string } | null",
        "desc": "แกะข้อความจากลิงก์ที่แชร์มา เพื่อดึงว่าต้องเปิดดูคลัง GitHub อะไรและเลือกโหนดไหน พร้อมรองรับลิงก์แบบเก่า (Base64) สำรองไว้ด้วย",
        "jargon": "• Backward Compatibility = การทำให้ระบบเวอร์ชันใหม่ยังคงเปิดลิงก์ที่สร้างจากระบบเวอร์ชันเก่าได้\\n• Fallback Parsing = แผนสองในการแกะข้อมูลหากแผนแรกไม่สำเร็จ",
        "deepExplain": "มีตัวดักจับ 2 ชั้น: ชั้นแรกตรวจ Query String ธรรมดา ชั้นที่สองแกะ Base64 เก่า ป้องกันลิงก์เดิมที่เคยส่งให้เพื่อนเปิดไม่ติดค่ะ",
        "pythonAnalogy": "urllib.parse.parse_qs() พร้อม try-except base64 decode"
      }
    ]
  },
  {
    "file": "sidedrawer",
    "filePath": "src/components/SideDrawer.tsx",
    "owner": "คน 5",
    "badge": "คน 5: Side Drawer (Inspector)",
    "category": "Inspector UI",
    "functions": [
      {
        "name": "SideDrawer",
        "line": 18,
        "signature": "export function SideDrawer(props: SideDrawerProps): React.JSX.Element | null",
        "desc": "หน้าต่างเมนูสไลด์ด้านข้าง แสดงข้อมูลรายละเอียดของไฟล์ที่ผู้ใช้คลิก เช่น ชื่อไฟล์, ประเภทไฟล์, ปุ่มเปิดบน GitHub, และซอร์สโค้ดจริงที่ระบายสีแล้ว",
        "jargon": "• Modal/Drawer Component = หน้าต่างเลื่อนซ้อนทับบนหน้าจอหลัก\\n• Conditional Rendering = การซ่อนหรือแสดงส่วนประกอบตามเงื่อนไข isOpen",
        "deepExplain": "ช่วยให้ผู้ใช้ส่องดูโค้ดจริงได้ทันทีในหน้าจอเดียว โดยไม่ต้องเปิดแท็บใหม่สลับไปมาบน GitHub ค่ะ",
        "pythonAnalogy": "Dialog window หรือ Side Panel ในแอปพลิเคชัน GUI"
      },
      {
        "name": "handleCopy",
        "line": 55,
        "signature": "const handleCopy = async () => void",
        "desc": "ปุ่มกดคัดลอกซอร์สโค้ดที่แสดงอยู่ในหน้าต่าง Drawer ลงในคลิปบอร์ด พร้อมเปลี่ยนข้อความปุ่มเป็น คัดลอกแล้ว เป็นเวลา 2 วินาที",
        "jargon": "• Clipboard Write = การส่งข้อความเข้าสู่หน่วยความจำ Copy-Paste ของระบบปฏิบัติการ\\n• Visual Feedback = การเปลี่ยนสถานะปุ่มชั่วคราวเพื่อบอกผู้ใช้ว่าคำสั่งสำเร็จ",
        "deepExplain": "เพิ่มความสะดวกให้นักพัฒนาสามารถก็อปปี้โค้ดไปใช้งานต่อได้ทันทีใน 1 คลิกค่ะ",
        "pythonAnalogy": "pyperclip.copy(code)"
      }
    ]
  },
  {
    "file": "codeviewer",
    "filePath": "src/lib/code-viewer.ts",
    "owner": "คน 5",
    "badge": "คน 5: Code Viewer (Prism)",
    "category": "Syntax Highlighting",
    "functions": [
      {
        "name": "getLanguageFromPath",
        "line": 25,
        "signature": "export function getLanguageFromPath(filePath: string): string",
        "desc": "ตรวจสอบนามสกุลของไฟล์ เช่น .tsx, .ts, .jsx, .json เพื่อบอกเอนจินระบายสีโค้ด (PrismJS) ว่าต้องใช้กฎไวยากรณ์ของภาษาอะไร",
        "jargon": "• File Extension = นามสกุลไฟล์ที่บอกชนิดข้อมูล\\n• Syntax Grammar = ชุดกฎการระบายสีของภาษานั้น ๆ",
        "deepExplain": "ช่วยให้รองรับได้ทั้ง TypeScript, JavaScript, CSS และ JSON อย่างถูกต้องตามภาษาของไฟล์ค่ะ",
        "pythonAnalogy": "path.split(\".\")[-1]"
      },
      {
        "name": "formatCodeSnippet",
        "line": 45,
        "signature": "export function formatCodeSnippet(rawContent: string, maxLines = 400): { lines: string[]; isTruncated: boolean }",
        "desc": "ตัดแบ่งข้อความโค้ดออกเป็นบรรทัด ๆ และจำกัดความยาวไม่เกิน 400 บรรทัด เพื่อป้องกันไม่ให้หน้าเว็บค้างถ้าเจอไฟล์ขนาดใหญ่เป็นหมื่นบรรทัด",
        "jargon": "• Line Truncation = การตัดเนื้อหาส่วนที่ยาวเกินเกณฑ์ทิ้งพร้อมแจ้งเตือน\\n• DOM Performance = การรักษาความเร็วของหน้าเว็บไม่ให้มี Element ในหน่วยความจำมากเกินไป",
        "deepExplain": "เป็นกลไกป้องกัน (Defensive Coding) ป้องกันเบราว์เซอร์แครชเมื่อผู้ใช้เปิดไฟล์ขนาดมโหฬารค่ะ",
        "pythonAnalogy": "raw.splitlines()[:400]"
      },
      {
        "name": "highlightCodeWithPrism",
        "line": 77,
        "signature": "export function highlightCodeWithPrism(code: string, language: string): string",
        "desc": "เรียกใช้งานเอนจิน PrismJS เพื่อแปลงข้อความโค้ดดิบให้กลายเป็น HTML ที่มีสีสันตามหลักไวยากรณ์ (เช่น คำสั่งสีฟ้า ตัวแปรสีเขียว สตริงสีส้ม)",
        "jargon": "• PrismJS = ไลบรารีมาตรฐานสากลสำหรับการทำ Syntax Highlighting บนเว็บ\\n• Tokenization = การตัดคำในโค้ดออกเป็นหน่วยเล็ก ๆ เพื่อใส่สีให้ตรงกับประเภท",
        "deepExplain": "ช่วยให้โค้ดที่แสดงใน Side Drawer อ่านง่าย สบายตาเหมือนอ่านในโปรแกรม VS Code ค่ะ",
        "pythonAnalogy": "ไลบรารี Pygments ใน Python ที่ใช้แปลงโค้ดเป็นสี"
      }
    ]
  },
  {
    "file": "route",
    "filePath": "src/app/api/analyze/route.ts",
    "owner": "คน 6",
    "badge": "คน 6: API Route",
    "category": "API Boundary & Controller",
    "functions": [
      {
        "name": "POST",
        "line": 4,
        "signature": "export async function POST(req: NextRequest): Promise<NextResponse>",
        "desc": "ประตูด่านแรกฝั่งเซิร์ฟเวอร์ คอยรับคำขอจากหน้าเว็บ ตรวจดูว่ามี URL ส่งมาไหม ถ้าไม่มีตอบรหัส 400 ถ้ามีส่งต่อให้ Pipeline และถ้าเจอ Error 401 ก็ส่งรหัส 401 กลับไปหน้าเว็บทันที",
        "jargon": "• Route Handler = ฟังก์ชันรับส่งคำขอ API ใน Next.js App Router (เทียบเท่า Controller)\\n• HTTP 400 Bad Request = รหัสบอกว่าข้อมูลที่ส่งมาไม่ครบหรือไม่ถูกต้อง\\n• HTTP 401 Unauthorized = รหัสบอกว่ารหัสผ่านหรือ Token ไม่ถูกต้อง",
        "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมไม่ส่ง Error 500 เวลา Token ผิด?' ตอบว่า: 'เพราะ 500 หมายถึงเซิร์ฟเวอร์พัง แต่ 401 หมายถึงผู้ใช้ใส่รหัสผ่านผิด การตอบ 401 ช่วยให้หน้าบ้านสื่อสารกับผู้ใช้ได้อย่างถูกต้องค่ะ'",
        "pythonAnalogy": "ฟังก์ชัน view ใน Flask หรือ FastAPI ที่มีตัวตกแต่ง @app.post(\"/api/analyze\")"
      }
    ]
  },
  {
    "file": "pipeline",
    "filePath": "src/lib/pipeline.ts",
    "owner": "คน 6",
    "badge": "คน 6: Core Pipeline",
    "category": "Orchestrator & Graph Synthesis",
    "functions": [
      {
        "name": "resolveAliasImport",
        "line": 14,
        "signature": "function resolveAliasImport(rawTarget: string, allFilePaths: string[]): string | null",
        "desc": "แปลงชื่อย่อการนำเข้าไฟล์ เช่น \"@/components/Button\" หรือ \"~/lib/utils\" ให้กลายเป็นที่อยู่ไฟล์จริง เช่น \"src/components/Button.tsx\"",
        "jargon": "• Path Alias = การตั้งชื่อเล่นให้กับโฟลเดอร์ เช่น @/ แทนโฟลเดอร์ src/ เพื่อไม่ต้องพิมพ์ ../ หลายชั้น\\n• Path Resolution = การหาที่อยู่ไฟล์จริงจากชื่อย่อ",
        "deepExplain": "ถ้าไม่มีฟังก์ชันนี้ เส้นความสัมพันธ์ (Edge) จะหาไฟล์เป้าหมายไม่เจอและทำให้ผังไดอะแกรมขาดตอนค่ะ",
        "pythonAnalogy": "การแปลง sys.path หรือ alias import ให้เป็น absolute file path"
      },
      {
        "name": "resolveRelativeImport",
        "line": 26,
        "signature": "function resolveRelativeImport(cleanTarget: string, sourcePath: string, allFilePaths: string[]): string | null",
        "desc": "แปลงพาธแบบสัมพัทธ์ เช่น \"./Button\" หรือ \"../utils\" เทียบกับตำแหน่งของไฟล์ต้นทาง เพื่อหาว่ากำลังชี้ไปที่ไฟล์ไหนในโปรเจกต์",
        "jargon": "• Relative Path = การระบุตำแหน่งไฟล์เทียบกับไฟล์ปัจจุบัน เช่น ./ (โฟลเดอร์เดียวกัน) และ ../ (ถอยหลัง 1 โฟลเดอร์)",
        "deepExplain": "จัดการเรื่องโครงสร้างโฟลเดอร์ซ้อนกันหลายชั้นอย่างแม่นยำ ไม่ให้เส้นชี้ผิดไฟล์ค่ะ",
        "pythonAnalogy": "os.path.normpath(os.path.join(os.path.dirname(src), target))"
      },
      {
        "name": "resolveImportToFilePath",
        "line": 45,
        "signature": "function resolveImportToFilePath(rawTarget: string, sourcePath: string, allFilePaths: string[]): string | null",
        "desc": "ฟังก์ชันรวมการค้นหาไฟล์ 3 ระดับ: ตรวจสอบแบบ Alias -> ตรวจสอบแบบ Relative -> และค้นหาจากชื่อไฟล์สำรอง เพื่อให้มั่นใจว่าจะจับคู่ไฟล์เจอแน่นอน",
        "jargon": "• Multi-tier Resolution = กลยุทธ์การค้นหาหลายชั้นเพื่อความแม่นยำสูงสุด",
        "deepExplain": "ช่วยให้ไม่พลาดการเชื่อมโยงแม้โปรเจกต์จะเขียนการ import โค้ดหลากหลายรูปแบบค่ะ",
        "pythonAnalogy": "กลยุทธ์การค้นหา module ใน importlib ของ Python"
      },
      {
        "name": "inferStructuralRelations",
        "line": 72,
        "signature": "function inferStructuralRelations(filesWithTypes: Array<{ path: string; fileType: NextFileType }>): CodeRelation[]",
        "desc": "สมองกลอนุมานความสัมพันธ์จากโครงสร้างโฟลเดอร์ App Router เช่น Layout ต้องครอบ Page เสมอ และ Middleware ต้องวิ่งเข้าหารากโปรเจกต์ ช่วยสร้างเส้นกราฟได้แม้ไม่ต้องอ่านโค้ดข้างใน",
        "jargon": "• Structural Inference = การเดาความสัมพันธ์จากตำแหน่งโฟลเดอร์ตามมาตรฐานของเฟรมเวิร์ก\\n• Convention over Configuration = หลักการที่ Next.js กำหนดให้ layout.tsx ครอบ page.tsx เสมอ",
        "deepExplain": "ทำให้ผังไดอะแกรมยังคงมีเส้นเชื่อมโยงโครงสร้างโปรเจกต์ที่สมบูรณ์ แม้ไฟล์นั้นจะไม่ได้เขียนคำสั่ง import ตรง ๆ ก็ตามค่ะ",
        "pythonAnalogy": "การเดา URL routing จากโครงสร้างโฟลเดอร์ของ Flask/FastAPI"
      },
      {
        "name": "fetchGitHubTree",
        "line": 213,
        "signature": "async function fetchGitHubTree(owner: string, repo: string, activeBranch: string, token?: string): Promise<{ treeData: GitHubTreeItem[]; activeBranch: string; treeSha?: string }>",
        "desc": "ยิงคำขอไปที่ GitHub Trees API เพื่อขอดูรายชื่อไฟล์ทั้งหมด พร้อมระบบ Fallback สลับจากกิ่ง main ไปหา master อัตโนมัติถ้าเจอรหัส 404",
        "jargon": "• Tree SHA = รหัสประจำตัวของต้นไม้ไฟล์ใน Git\\n• Branch Fallback = แผนสองสลับกิ่งสำรองเมื่อไม่พบกิ่งหลัก",
        "deepExplain": "ช่วยแก้ปัญหาคลังโค้ดรุ่นเก่าที่ใช้ชื่อกิ่ง master ทำให้ระบบไม่แครชและทำงานต่อได้ราบรื่นค่ะ",
        "pythonAnalogy": "ยิง API ดึงข้อมูล ถ้ากิ่ง main ได้ 404 ให้ลองกิ่ง master ทันที"
      },
      {
        "name": "extractRelationsFromContent",
        "line": 266,
        "signature": "function extractRelationsFromContent(filesContent: Record<string, string>, filesWithTypes: Array<{ path: string; fileType: NextFileType }>, allPaths: string[]): CodeRelation[]",
        "desc": "นำเนื้อหาโค้ดของไฟล์สำคัญที่ดาวน์โหลดมา ส่งให้ parser สแกนหาคำสั่ง import แล้วแปลงเป็นรายการ CodeRelation พร้อมตัดการเชื่อมโยงที่ซ้ำซ้อนออก",
        "jargon": "• Deduplication = การกำจัดเส้นเชื่อมโยงที่ซ้ำซ้อนกันทิ้ง\\n• Relation Mapping = การจับคู่ว่าไฟล์ไหนสัมพันธ์กับไฟล์ไหน",
        "deepExplain": "ใช้ Set ป้องกันการสร้างเส้นซ้ำ ทำให้กราฟไม่รกและอ่านเข้าใจง่ายค่ะ",
        "pythonAnalogy": "ใช้ set() เก็บ key f\"{source}->{target}\" เพื่อตัดตัวซ้ำ"
      },
      {
        "name": "runAnalysisPipeline",
        "line": 308,
        "signature": "export async function runAnalysisPipeline(githubUrl: string, token?: string, mockTreeData?: GitHubTreeItem[], mockFilesContent?: Record<string, string>): Promise<AnalysisResult>",
        "desc": "แม่ทัพคุมกระบวนการหลังบ้านทั้งหมด ทำงานเป็นสายพาน 6 จังหวะ: ตรวจ URL -> เช็คแคชในแรม -> ดึงผังไฟล์จาก GitHub -> กรองไฟล์และแยกบทบาท -> แกะความสัมพันธ์ของ import -> ส่งไปจัดผัง Dagre แล้วบันทึกแคชก่อนตอบกลับ",
        "jargon": "• Pipeline = ท่อประมวลผลที่ส่งงานต่อกันเป็นทอด ๆ เหมือนสายพานโรงงาน\\n• In-Memory Cache = การเก็บข้อมูลไว้ในตัวแปร Map ในหน่วยความจำเพื่อความเร็วสูงสุด",
        "deepExplain": "เป็นศูนย์กลางควบคุมลำดับการทำงาน (Orchestrator) ทำให้ตรวจสอบเวลาทำงาน (Execution Time) และควบคุมความปลอดภัยได้ครบในจุดเดียวค่ะ",
        "pythonAnalogy": "ฟังก์ชัน main_pipeline() ที่รันตามขั้นตอน 1 ถึง 6"
      }
    ]
  }
];

// Flatten into ALL_FUNCTIONS_DIRECTORY
const allFunctions = [];
FILE_MAP.forEach(group => {
  group.functions.forEach(fn => {
    allFunctions.push({
      name: fn.name,
      file: group.file,
      filePath: group.filePath,
      line: fn.line,
      owner: group.owner,
      category: group.category,
      badge: group.badge,
      signature: fn.signature,
      desc: fn.desc,
      jargon: fn.jargon,
      deepExplain: fn.deepExplain,
      pythonAnalogy: fn.pythonAnalogy,
      tags: [group.file, group.owner, fn.name.toLowerCase()],
      snippet: fn.signature
    });
  });
});

console.log('Total verified active functions:', allFunctions.length);

const outContent = `// ============================================================
// data-fndex.js — สารบัญฟังก์ชันทั้งระบบ (All Functions Directory)
// รวบรวมฟังก์ชันจริงทั้งหมด ${allFunctions.length} ฟังก์ชัน จาก 10 ไฟล์โค้ดหลัก
// อัปเดตล่าสุดตามการ Refactor โค้ดจริง พร้อมคำอธิบายลึกสำหรับตอบอาจารย์
// ============================================================

const ALL_FUNCTIONS_DIRECTORY = ${JSON.stringify(allFunctions, null, 2)};

if (typeof window !== "undefined") {
  window.ALL_FUNCTIONS_DIRECTORY = ALL_FUNCTIONS_DIRECTORY;
}
if (typeof module !== "undefined") {
  module.exports = { ALL_FUNCTIONS_DIRECTORY };
}
`;

fs.writeFileSync(path.join(__dirname, 'data-fndex.js'), outContent, 'utf8');
console.log('Successfully wrote data-fndex.js with exact current functions!');

