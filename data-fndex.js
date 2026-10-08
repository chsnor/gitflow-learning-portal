// ============================================================
// data-fndex.js — สารบัญฟังก์ชันทั้งระบบ (All Functions Directory)
// ครบทุกฟังก์ชันหลักและย่อยจาก 10 ไฟล์ (คน 1-6)
// พร้อมคำอธิบายแบบเจาะลึก, ถอดรหัสคำศัพท์เทคนิค, และแนวทางการตอบอาจารย์
// ============================================================

const ALL_FUNCTIONS_DIRECTORY = [
  {
    "name": "computeCacheKey",
    "file": "pipeline",
    "filePath": "src/lib/pipeline.ts",
    "line": 10,
    "owner": "คน 6",
    "category": "Security & Cache",
    "badge": "คน 6: Core Pipeline",
    "signature": "function computeCacheKey(githubUrl: string, token?: string): string",
    "desc": "สร้างชื่อตู้เก็บข้อมูล (Cache Key) ประจำตัวผู้ใช้ โดยนำรหัสผ่าน (Token) มาสับรหัสคณิตศาสตร์ (SHA-256 Hash) เพื่อแยกตู้เก็บข้อมูลของแต่ละคนออกจากกัน ไม่ให้คนแปลกหน้าแอบเปิดดูข้อมูลของคลังส่วนตัว (Private Repo) ของคนอื่นได้",
    "tags": [
      "cache",
      "security",
      "sha256",
      "token",
      "partition"
    ],
    "snippet": "function computeCacheKey(githubUrl: string, token?: string): string",
    "jargon": "• Cache Key = ป้ายชื่อหน้ากล่องความจำชั่วคราว เพื่อดึงผลลัพธ์เดิมมาตอบได้ทันทีใน 0ms\\n• SHA-256 Hash = การสับรหัสผ่านเป็นตัวอักษรสุ่ม 16 ตัวทางคณิตศาสตร์แบบทางเดียว\\n• Cache Partitioning = การแบ่งห้องเก็บแคชแยกตามสิทธิ์ของ Token\\n• Cache Poisoning = การมีคนส่งข้อมูลปลอมเข้ามาปนในแคชส่วนกลาง",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมไม่ใช้แค่ URL เป็นคีย์?' ตอบว่า: 'ถ้าใช้แค่ URL คนที่ไม่มี Token จะแอบเห็นผลลัพธ์ของคลังส่วนตัวที่คนมี Token เคยสแกนไว้ได้ค่ะ หนูจึงนำ Token มาแฮชต่อท้าย เพื่อให้สิทธิ์ใครสิทธิ์มันค่ะ'",
    "pythonAnalogy": "hashlib.sha256(token.encode()).hexdigest()[:16] ทำ partition cache key ร่วมกับ Dict"
  },
  {
    "name": "parseGitHubUrl",
    "file": "github",
    "filePath": "src/lib/github.ts",
    "line": 15,
    "owner": "คน 1",
    "category": "URL & API Parsing",
    "badge": "คน 1: GitHub Service",
    "signature": "export function parseGitHubUrl(url: string): ParsedGitHubUrl | null",
    "desc": "ตรวจสอบและแกะลิงก์ GitHub ที่ผู้ใช้กรอกเข้ามา โดยตรวจดูว่ามาจากเว็บไซต์ github.com จริงไหม และแยกชิ้นส่วนออกมาเป็น: ชื่อเจ้าของ (owner), ชื่อโปรเจกต์ (repo), และชื่อกิ่งโค้ด (branch) พร้อมตัด .git ทิ้งให้อัตโนมัติ",
    "tags": [
      "url",
      "github",
      "regex",
      "parsing"
    ],
    "snippet": "export function parseGitHubUrl(url: string): ParsedGitHubUrl | null",
    "jargon": "• Owner = เจ้าของคลังโค้ดบน GitHub\\n• Repository (Repo) = คลังเก็บไฟล์โปรเจกต์\\n• Branch = กิ่งเวอร์ชันของโค้ด เช่น main หรือ master\\n• Regex (Regular Expression) = ตัวตรวจจับและตัดรูปแบบข้อความ",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ถ้าผู้ใช้พิมพ์ slash ส่วนเกินหรือใส่ลิงก์มี .git จะพังไหม?' ตอบว่า: 'ไม่พังค่ะ เพราะมี Regular Expression ตัด .git และกรอง slash ส่วนเกินออกให้สะอาดก่อนส่งไปทำงานต่อค่ะ'",
    "pythonAnalogy": "urllib.parse.urlsplit() ร่วมกับ re.sub() ตัดคำ"
  },
  {
    "name": "buildGitHubApiUrl",
    "file": "github",
    "filePath": "src/lib/github.ts",
    "line": 44,
    "owner": "คน 1",
    "category": "URL & API Parsing",
    "badge": "คน 1: GitHub Service",
    "signature": "export function buildGitHubApiUrl(owner: string, repo: string, branch = 'main'): string",
    "desc": "สร้างที่อยู่เว็บ (URL) สำหรับส่งไปถามเซิร์ฟเวอร์ของ GitHub เพื่อขอดูรายชื่อไฟล์ทั้งหมดในโปรเจกต์ โดยใส่คำสั่งพิเศษ ?recursive=1 เพื่อขอให้ GitHub ส่งรายชื่อไฟล์ที่อยู่ในโฟลเดอร์ย่อยลึก ๆ ทั้งหมดมาให้ครบจบในคำขอเดียว",
    "tags": [
      "api",
      "github",
      "trees",
      "endpoint"
    ],
    "snippet": "export function buildGitHubApiUrl(owner: string, repo: string, branch = 'main'): string",
    "jargon": "• REST API = ช่องทางที่เซิร์ฟเวอร์เปิดไว้ให้โปรแกรมส่งคำขอข้อมูล\\n• Git Trees API = สารบัญโครงสร้างไฟล์ของ Git บนเซิร์ฟเวอร์ GitHub\\n• Recursive (?recursive=1) = การเปิดดูโฟลเดอร์ย่อยลึกลงไปเรื่อย ๆ จนถึงไฟล์สุดท้าย",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมไม่ดึงทีละโฟลเดอร์?' ตอบว่า: 'เพราะจะทำให้ติดลิมิตการเรียก API (Rate Limit) ของ GitHub ค่ะ การสั่ง ?recursive=1 ช่วยให้ได้ผังไฟล์ทั้งระบบในการยิง API แค่ 1 ครั้งเท่านั้นค่ะ'",
    "pythonAnalogy": "os.walk() ดึงโครงสร้างไฟล์ทั้งโฟลเดอร์ แต่ทำผ่าน HTTP Request ครั้งเดียว"
  },
  {
    "name": "buildGitHubHeaders",
    "file": "github",
    "filePath": "src/lib/github.ts",
    "line": 51,
    "owner": "คน 1",
    "category": "HTTP & Auth",
    "badge": "คน 1: GitHub Service",
    "signature": "export function buildGitHubHeaders(token?: string): Record<string, string>",
    "desc": "สร้างหัวจดหมายส่งข้อมูล (HTTP Headers) เพื่อส่งไปให้ GitHub รู้ว่าใครเป็นคนเรียกใช้งาน โดยแนบชื่อโปรแกรมเรา (User-Agent) เสมอ และถ้าผู้ใช้กรอก Personal Access Token มา ก็จะแนบเป็นตั๋วผ่านทาง (Bearer Token) ไปด้วยเพื่อขอโควตาเพิ่ม",
    "tags": [
      "headers",
      "token",
      "auth",
      "http"
    ],
    "snippet": "export function buildGitHubHeaders(token?: string): Record<string, string>",
    "jargon": "• HTTP Headers = ข้อมูลส่วนหัวเหมือนจ่าหน้าซองจดหมาย\\n• User-Agent = ชื่อระบุตัวตนของโปรแกรมที่ส่งคำขอไปหาเซิร์ฟเวอร์\\n• Bearer Token = ตั๋วอนุญาตการเข้าถึงข้อมูลตามมาตรฐานความปลอดภัย",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ถ้าผู้ใช้ไม่ใส่ Token ระบบจะยังทำงานได้ไหม?' ตอบว่า: 'ทำงานได้ตามปกติสำหรับคลังสาธารณะ (Public Repo) ค่ะ แต่จะได้โควตาฟรี 60 ครั้งต่อชั่วโมง หากใส่ Token จะได้ 5,000 ครั้งต่อชั่วโมงค่ะ'",
    "pythonAnalogy": "headers={'Authorization': f'Bearer {token}', 'User-Agent': '...'}"
  },
  {
    "name": "buildGitHubRawUrl",
    "file": "github",
    "filePath": "src/lib/github.ts",
    "line": 66,
    "owner": "คน 1",
    "category": "Raw Content",
    "badge": "คน 1: GitHub Service",
    "signature": "export function buildGitHubRawUrl(owner: string, repo: string, filePathOrBranch: string, branchOrPath = 'main'): string",
    "desc": "สร้างที่อยู่ลิงก์สำหรับดาวน์โหลดเนื้อหาโค้ดดิบ (Raw Content) จากเครือข่ายความเร็วสูง raw.githubusercontent.com เพื่อให้ระบบเปิดอ่านโค้ดข้างในได้โดยตรงโดยไม่ต้องโหลดทั้งโปรเจกต์",
    "tags": [
      "raw",
      "cdn",
      "download",
      "content"
    ],
    "snippet": "export function buildGitHubRawUrl(owner: string, repo: string, filePathOrBranch: string, branchOrPath = 'main'): string",
    "jargon": "• Raw Content = ไฟล์เนื้อหาโค้ดล้วน ๆ ไม่มีหน้าเว็บ HTML ของ GitHub ติดมาด้วย\\n• CDN = เครือข่ายกระจายข้อมูลความเร็วสูง ช่วยให้โหลดไฟล์ได้ไว",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมไม่ใช้ Git Clone?' ตอบว่า: 'เพราะ Git Clone ต้องดาวน์โหลดประวัติ Git ทั้งหมดซึ่งหนักและช้ามาก การใช้ Raw URL ดึงเฉพาะไฟล์ที่จำเป็นจะเร็วกว่าหลายสิบเท่าค่ะ'",
    "pythonAnalogy": "requests.get() ดาวน์โหลดไฟล์โค้ดตรงจาก raw URL"
  },
  {
    "name": "buildGitHubBlobUrl",
    "file": "github",
    "filePath": "src/lib/github.ts",
    "line": 82,
    "owner": "คน 1",
    "category": "Navigation Link",
    "badge": "คน 1: GitHub Service",
    "signature": "export function buildGitHubBlobUrl(owner: string, repo: string, filePath: string, branch = 'main'): string",
    "desc": "สร้างลิงก์สำหรับคลิกเพื่อเปิดดูไฟล์นั้นบนเว็บไซต์ GitHub.com จริง ผ่านหน้าต่างแสดงโค้ด (SideDrawer) เพื่อให้ผู้ใช้กดไปดูต้นฉบับบน GitHub ได้ในแท็บใหม่",
    "tags": [
      "blob",
      "link",
      "github.com",
      "ui"
    ],
    "snippet": "export function buildGitHubBlobUrl(owner: string, repo: string, filePath: string, branch = 'main'): string",
    "jargon": "• Blob = คำศัพท์ของ Git ที่ใช้เรียกวัตถุเก็บไฟล์เดี่ยว ๆ (Binary Large Object)\\n• SideDrawer = หน้าต่างเมนูด้านข้างที่เลื่อนออกมาแสดงรายละเอียดโค้ด",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมต้องมีทั้ง Raw URL และ Blob URL?' ตอบว่า: 'Raw URL มีไว้ให้โปรแกรมเราอ่านเนื้อหาโค้ด ส่วน Blob URL มีไว้ให้ผู้ใช้คลิกเปิดหน้าเว็บ GitHub ในแท็บใหม่ค่ะ'",
    "pythonAnalogy": "สร้างลิงก์ภายนอกเปิดเบราว์เซอร์ไปที่ github.com/owner/repo/blob/main/file.ts"
  },
  {
    "name": "shouldIgnorePath",
    "file": "parser",
    "filePath": "src/lib/parser.ts",
    "line": 76,
    "owner": "คน 2",
    "category": "Filtering & Sanitization",
    "badge": "คน 2: Parser Engine",
    "signature": "function shouldIgnorePath(lowerPath: string, fileName: string, isRootFile: boolean): boolean",
    "desc": "ตัวกรองความปลอดภัยและลดขยะ ทำหน้าที่ตรวจสอบชื่อโฟลเดอร์และชื่อไฟล์ ถ้าเจอโฟลเดอร์ที่ไม่เกี่ยวกับโค้ดที่เราต้องการวิเคราะห์ เช่น node_modules, .next, dist, tests ระบบจะปัดทิ้งทันที",
    "tags": [
      "filter",
      "blacklist",
      "sanitize",
      "ignore"
    ],
    "snippet": "function shouldIgnorePath(lowerPath: string, fileName: string, isRootFile: boolean): boolean",
    "jargon": "• Blacklist = รายชื่อต้องห้ามที่ระบบจะไม่นำมาประมวลผล\\n• Node Modules = โฟลเดอร์เก็บไลบรารีภายนอกที่หนักและไม่ใช่โค้ดที่เจ้าของโปรเจกต์เขียนเอง",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมต้องตัด node_modules ทิ้ง?' ตอบว่า: 'เพราะใน node_modules มีไฟล์เป็นหมื่นไฟล์ ถ้าไม่ตัดทิ้ง กราฟจะพังและระบบจะค้างจากการประมวลผลไฟล์ที่ไม่จำเป็นค่ะ'",
    "pythonAnalogy": "เช็ค if 'venv' in path or '__pycache__' in path: continue ในลูป"
  },
  {
    "name": "filterTreeFiles",
    "file": "parser",
    "filePath": "src/lib/parser.ts",
    "line": 101,
    "owner": "คน 2",
    "category": "Filtering & Sanitization",
    "badge": "คน 2: Parser Engine",
    "signature": "export function filterTreeFiles(items: GitHubTreeItem[], maxLimit = 250): GitHubTreeItem[]",
    "desc": "คัดกรองรายชื่อไฟล์ทั้งหมดที่ได้จาก GitHub โดยรับเฉพาะไฟล์โค้ดที่เป็นภาษา TypeScript และ JavaScript (.ts, .tsx, .js, .jsx) และจำกัดจำนวนไว้ไม่เกินเกณฑ์ เพื่อความเร็วและการประมวลผลที่ไม่เกินกำลังเครื่อง",
    "tags": [
      "filter",
      "tree",
      "limit",
      "whitelist"
    ],
    "snippet": "export function filterTreeFiles(items: GitHubTreeItem[], maxLimit = 250): GitHubTreeItem[]",
    "jargon": "• Whitelist = รายชื่อไฟล์ที่อนุญาตให้นำเข้ามาทำงานได้\\n• Max Limit = เพดานจำนวนไฟล์สูงสุดที่รับเข้ามาประมวลผล (ค่าเริ่มต้น 250-500 ไฟล์)",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ถ้าโปรเจกต์มีไฟล์โค้ด 1,000 ไฟล์ ระบบจะรับไหวไหม?' ตอบว่า: 'ระบบมีเพดาน MAX_FILTERED_FILES คัดเลือกเฉพาะไฟล์สำคัญสูงสุด 500 ไฟล์ เพื่อป้องกันปัญหาหน่วยความจำล้นและไม่ทำให้หน้าเว็บค้างค่ะ'",
    "pythonAnalogy": "[f for f in files if f.endswith(('.ts', '.tsx', '.js', '.jsx'))][:500]"
  },
  {
    "name": "detectNextFileType",
    "file": "parser",
    "filePath": "src/lib/parser.ts",
    "line": 129,
    "owner": "คน 2",
    "category": "App Router Classification",
    "badge": "คน 2: Parser Engine",
    "signature": "export function detectNextFileType(filePath: string): NextFileType",
    "desc": "สมองกลจำแนกบทบาทของไฟล์ใน Next.js ว่าไฟล์นี้ทำหน้าที่อะไร เช่น เป็นหน้าจอ (Page), โครงหน้า (Layout), โค้ดส่งข้อมูลหลังบ้าน (Server Action), ตัวดักทาง (Middleware), หรือตู้เก็บข้อมูลรวม (Store)",
    "tags": [
      "classify",
      "filetype",
      "app-router",
      "detection"
    ],
    "snippet": "export function detectNextFileType(filePath: string): NextFileType",
    "jargon": "• App Router = โครงสร้างการจัดหน้าเว็บรุ่นใหม่ของ Next.js โดยใช้โฟลเดอร์ app\\n• Server Action = ฟังก์ชันฝั่งหลังบ้านที่หน้าเว็บเรียกใช้เพื่อบันทึกข้อมูล\\n• Middleware = โค้ดที่คอยดักตรวจคำขอก่อนจะยอมให้เข้าถึงหน้าเว็บ",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'รู้ได้อย่างไรว่าไฟล์ไหนคือ Server Action?' ตอบว่า: 'ตรวจดูจากชื่อโฟลเดอร์ app/actions หรือชื่อไฟล์ actions.ts รวมถึงการสแกนคำสั่ง use server ในไฟล์ค่ะ'",
    "pythonAnalogy": "การจำแนกประเภทไฟล์ใน Django ว่าไฟล์ไหนคือ views.py, models.py, urls.py"
  },
  {
    "name": "extractImportsFromCode",
    "file": "parser",
    "filePath": "src/lib/parser.ts",
    "line": 165,
    "owner": "คน 2",
    "category": "AST & Code Analysis",
    "badge": "คน 2: Parser Engine",
    "signature": "export function extractImportsFromCode(sourcePath: string, codeContent: string): CodeRelation[]",
    "desc": "เครื่องมือสแกนโค้ดเพื่อค้นหาคำว่า import ... from '...' เพื่อดูว่าไฟล์นี้กำลังไปหยิบยืมโค้ดหรือฟังก์ชันมาจากไฟล์อื่นไหนบ้าง เพื่อนำมาสร้างเป็นเส้นเชื่อมโยง (Edges)",
    "tags": [
      "import",
      "regex",
      "relation",
      "dependencies"
    ],
    "snippet": "export function extractImportsFromCode(sourcePath: string, codeContent: string): CodeRelation[]",
    "jargon": "• Dependencies = ความพึ่งพากันระหว่างไฟล์ (ไฟล์ A ต้องพึ่งพาไฟล์ B)\\n• Edges = เส้นลูกศรที่ลากเชื่อมระหว่างกล่องในไดอะแกรม",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมใช้วิธีสแกน Regular Expression ไม่ใช้ตัววิเคราะห์ AST เต็มรูปแบบ?' ตอบว่า: 'เพราะเราดึงโค้ดมาเป็นข้อความผ่านเน็ตแบบเรียลไทม์ การสแกนด้วย Regex ทำงานเร็วกว่าหลายสิบเท่าและกินแรมน้อยมาก เหมาะกับเว็บแอปพลิเคชันแบบตอบสนองทันทีค่ะ'",
    "pythonAnalogy": "สแกนหาคำว่า import os หรือ from utils import helper ในโค้ด Python"
  },
  {
    "name": "extractTargetFunction",
    "file": "parser",
    "filePath": "src/lib/parser.ts",
    "line": 195,
    "owner": "คน 2",
    "category": "AST & Code Analysis",
    "badge": "คน 2: Parser Engine",
    "signature": "function extractTargetFunction(expression: string): string | null",
    "desc": "ถอดชื่อฟังก์ชันเป้าหมายออกจาก Event Handler บนปุ่มหรือฟอร์ม เช่น onClick={() => mutate()} หรือ action={handleSubmit} เพื่อหาว่าปุ่มนี้กดแล้วไปเรียกใช้ฟังก์ชันชื่ออะไร",
    "tags": [
      "handler",
      "jsx",
      "function-name",
      "target"
    ],
    "snippet": "function extractTargetFunction(expression: string): string | null",
    "jargon": "• Event Handler = ฟังก์ชันที่ผูกไว้กับเหตุการณ์ เช่น เมื่อผู้ใช้กดคลิก (onClick) หรือกดส่งแบบฟอร์ม (onSubmit)\\n• JSX Attribute = ตัวแปรที่แปะอยู่บนปุ่มหรือฟอร์มหน้าเว็บ",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ฟังก์ชันนี้ทำหน้าที่อะไร?' ตอบว่า: 'ช่วยแกะชื่อฟังก์ชันที่ผู้ใช้กดคลิก เพื่อนำไปผูกโยงว่าปุ่มนี้ยิงไปหา Server Action ตัวไหนค่ะ'",
    "pythonAnalogy": "แกะชื่อฟังก์ชันที่ผูกไว้กับ command=button_click ใน Tkinter"
  },
  {
    "name": "extractActionTriggers",
    "file": "parser",
    "filePath": "src/lib/parser.ts",
    "line": 213,
    "owner": "คน 2",
    "category": "AST & Code Analysis",
    "badge": "คน 2: Parser Engine",
    "signature": "export function extractActionTriggers(sourcePath: string, codeContent: string): CodeRelation[]",
    "desc": "ตรวจจับว่าในหน้านี้มีปุ่มหรือแบบฟอร์มที่ยิงคำสั่งไปหา Server Action หลังบ้านหรือไม่ จากนั้นสร้างเส้นลูกศรประเภท action_trigger เพื่อแสดงให้เห็นบนกราฟว่าหน้านี้มีปุ่มยิงไปหลังบ้าน",
    "tags": [
      "action",
      "event",
      "server-action",
      "trigger"
    ],
    "snippet": "export function extractActionTriggers(sourcePath: string, codeContent: string): CodeRelation[]",
    "jargon": "• Server Action Trigger = การกระตุ้นให้โค้ดหลังบ้านทำงานผ่านการกดปุ่มหน้าเว็บ\\n• CodeRelation = อ็อบเจกต์เก็บข้อมูลความสัมพันธ์ระหว่างไฟล์ต้นทางกับไฟล์ปลายทาง",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'เส้น Action ต่างจากเส้น Import ธรรมดาอย่างไร?' ตอบว่า: 'เส้น Import คือการยืมโค้ดมาใช้ แต่เส้น Action คือการกดปุ่มเพื่อยิงคำสั่งไปรันบนเซิร์ฟเวอร์ บนกราฟจึงแสดงเป็นสีส้มพิเศษค่ะ'",
    "pythonAnalogy": "เหมือนการหาจุดเชื่อมต่อระหว่างหน้า HTML Form กับ Route Handler ใน FastAPI"
  },
  {
    "name": "sanitizeNodeId",
    "file": "generator",
    "filePath": "src/lib/generator.ts",
    "line": 7,
    "owner": "คน 3",
    "category": "Graph Building",
    "badge": "คน 3: Flow Generator",
    "signature": "export function sanitizeNodeId(pathStr: string): string",
    "desc": "แปลงชื่อที่อยู่ไฟล์ (Path) ให้กลายเป็นรหัสประจำตัว (Node ID) ที่ปลอดภัยสำหรับ React Flow โดยเปลี่ยนเครื่องหมายทับ / วงเล็บ () และจุด . ให้กลายเป็นขีดล่าง _ ทั้งหมด เพื่อไม่ให้ระบบวาดรูปพัง",
    "tags": [
      "id",
      "sanitize",
      "graph",
      "mermaid"
    ],
    "snippet": "export function sanitizeNodeId(pathStr: string): string",
    "jargon": "• Node ID = รหัสประจำตัวที่ไม่ซ้ำกันของแต่ละกล่องบนไดอะแกรม\\n• Sanitize = การล้างเครื่องหมายพิเศษที่ไม่ปลอดภัยออกไป",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมต้อง sanitize ชื่อไฟล์?' ตอบว่า: 'เพราะถ้าชื่อโหนดมีเครื่องหมายพิเศษ เช่น app/(dashboard)/page.tsx เอนจินวาดรูปจะสับสนกับไวยากรณ์ จึงต้องแปลงเป็น app_dashboard_page_tsx ค่ะ'",
    "pythonAnalogy": "re.sub(r'[^a-zA-Z0-9]', '_', path)"
  },
  {
    "name": "getNodeColorConfig",
    "file": "generator",
    "filePath": "src/lib/generator.ts",
    "line": 30,
    "owner": "คน 3",
    "category": "Theming & Colors",
    "badge": "คน 3: Flow Generator",
    "signature": "export function getNodeColorConfig(fileType: NextFileType): { border: string; bg: string; text: string }",
    "desc": "กำหนดชุดสีประจำประเภทไฟล์ เช่น สีม่วงสำหรับ Middleware, สีฟ้าสำหรับ Page, สีส้มสำหรับ Server Action, สีเขียวสำหรับ Store, และสีชมพูสำหรับ Component เพื่อให้ผู้ใช้มองเห็นบทบาทไฟล์ได้ทันที",
    "tags": [
      "theme",
      "colors",
      "nodes",
      "styling"
    ],
    "snippet": "export function getNodeColorConfig(fileType: NextFileType): { border: string; bg: string; text: string }",
    "jargon": "• Color Palette = ชุดสีที่กำหนดไว้ล่วงหน้าเพื่อคุมโทนให้สวยงามและมีความหมาย\\n• Visual Hierarchy = การใช้สีและลำดับชั้นช่วยให้สมองแยกแยะความสำคัญของข้อมูลได้ง่าย",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมต้องแยกสีตามบทบาทไฟล์?' ตอบว่า: 'เพราะช่วยให้โปรแกรมเมอร์เข้าใจสถาปัตยกรรมระบบได้ทันทีที่มองผัง โดยไม่ต้องคลิกเข้าไปอ่านโค้ดทีละไฟล์ค่ะ'",
    "pythonAnalogy": "การสร้าง Dictionary จับคู่ประเภทกับรหัสสี: COLOR_MAP = {'page': '#38bdf8', ...}"
  },
  {
    "name": "applyDagreLayout",
    "file": "generator",
    "filePath": "src/lib/generator.ts",
    "line": 40,
    "owner": "คน 3",
    "category": "Graph Layout",
    "badge": "คน 3: Flow Generator",
    "signature": "function applyDagreLayout(nodes: FlowNodeItem[], edges: FlowEdgeItem[], seenIds: Set<string>): void",
    "desc": "คำนวณตำแหน่งพิกัด X และ Y ให้กับกล่องไฟล์ทั้งหมด เพื่อจัดเรียงเป็นแผนผังตามลำดับชั้นอย่างสวยงาม โดยเรียงจากซ้ายไปขวา และเว้นระยะห่างไม่ให้เส้นลูกศรวิ่งชนกัน",
    "tags": [
      "dagre",
      "layout",
      "hierarchy",
      "graph"
    ],
    "snippet": "function applyDagreLayout(nodes: FlowNodeItem[], edges: FlowEdgeItem[], seenIds: Set<string>): void",
    "jargon": "• Directed Graph = แผนผังแบบมีลูกศรระบุทิศทางต้นทางและปลายทาง\\n• Edge Crossing Minimization = อัลกอริทึมคำนวณหลบหลีกไม่ให้เส้นลูกศรตัดกันจนอ่านไม่รู้เรื่อง\\n• Rank Separation = ระยะห่างระหว่างชั้นของกล่อง",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ถ้าไม่ใช้ Dagre จะเกิดอะไรขึ้น?' ตอบว่า: 'โหนดจะลอยกระจัดกระจาย หรือวางทับซ้อนกันทำให้อ่านโครงสร้างโค้ดไม่ออก Dagre จึงเป็นหัวใจสำคัญที่จัดผังให้เป็นระเบียบอัตโนมัติค่ะ'",
    "pythonAnalogy": "ไลบรารี NetworkX หรือ Graphviz ใน Python ที่ใช้จัดวางผัง Network Graph"
  },
  {
    "name": "buildFlowElements",
    "file": "generator",
    "filePath": "src/lib/generator.ts",
    "line": 89,
    "owner": "คน 3",
    "category": "Graph Building",
    "badge": "คน 3: Flow Generator",
    "signature": "export function buildFlowElements(relations: CodeRelation[], fileTypes?: Map<string, NextFileType>): { nodes: FlowNodeItem[]; edges: FlowEdgeItem[] }",
    "desc": "แปลงข้อมูลความสัมพันธ์ทั้งหมดให้อยู่ในรูปแบบที่ React Flow เข้าใจ (Nodes และ Edges) พร้อมกำหนดสีตามประเภทไฟล์ และส่งเข้าให้ Dagre คำนวณพิกัด (X, Y) ก่อนส่งกลับไปวาดบนหน้าจอ",
    "tags": [
      "elements",
      "nodes",
      "edges",
      "reactflow"
    ],
    "snippet": "export function buildFlowElements(relations: CodeRelation[], fileTypes?: Map<string, NextFileType>): { nodes: FlowNodeItem[]; edges: FlowEdgeItem[] }",
    "jargon": "• React Flow Elements = โครงสร้างข้อมูลกล่อง (Nodes) และเส้น (Edges) ที่ไลบรารี React Flow ใช้ในการเรนเดอร์\\n• Coordinates = พิกัดแกน X (แนวนอน) และแกน Y (แนวตั้ง) บนผืนผ้าใบ",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ขั้นตอนนี้ทำที่ไหน หน้าบ้านหรือหลังบ้าน?' ตอบว่า: 'ทำที่ฝั่งหลังบ้าน (Server-side) ค่ะ ทำให้เซิร์ฟเวอร์ส่งพิกัดที่คำนวณเสร็จแล้วไปให้หน้าบ้านวาดได้ทันที ไม่กินแรงเครื่องผู้ใช้ค่ะ'",
    "pythonAnalogy": "เตรียมข้อมูลดิกชันนารี {'nodes': [...], 'edges': [...]} ส่งคืนเป็น JSON"
  },
  {
    "name": "generateMermaidSyntax",
    "file": "generator",
    "filePath": "src/lib/generator.ts",
    "line": 169,
    "owner": "คน 3",
    "category": "Mermaid Export",
    "badge": "คน 3: Flow Generator",
    "signature": "export function generateMermaidSyntax(relations: CodeRelation[]): string",
    "desc": "แปลงรายการความสัมพันธ์ของโค้ดให้เป็นข้อความไดอะแกรมในรูปแบบ Mermaid (flowchart TD) สำหรับนำไปแปะในเอกสาร Markdown หรือนำไปสร้างภาพผังในระบบภายนอกได้ทันที",
    "tags": [
      "mermaid",
      "export",
      "markdown",
      "syntax"
    ],
    "snippet": "export function generateMermaidSyntax(relations: CodeRelation[]): string",
    "jargon": "• Mermaid Syntax = ภาษาเขียนไดอะแกรมด้วยข้อความ (Diagram as Code) ที่ GitHub และ Markdown รองรับ\\n• flowchart TD = ไดอะแกรมผังงานเรียงจากบนลงล่าง (Top to Down)",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ฟังก์ชันนี้มีไว้ทำอะไรในเมื่อมี React Flow แล้ว?' ตอบว่า: 'มีไว้สำหรับส่งออก (Export) ผังไดอะแกรมเป็นข้อความไปใส่ใน README.md หรือเอกสารรายงานของโปรเจกต์ค่ะ'",
    "pythonAnalogy": "สร้างสตริง 'graph TD\\n A --> B' เพื่อเซฟเป็นไฟล์ markdown"
  },
  {
    "name": "computeTracePath",
    "file": "flowcanvas",
    "filePath": "src/components/FlowCanvas.tsx",
    "line": 48,
    "owner": "คน 3",
    "category": "Canvas Interaction",
    "badge": "คน 3: Flow Canvas (Visualizer)",
    "signature": "function computeTracePath(selectedId: string, edges: FlowEdgeItem[]): { nodeIds: Set<string>; edgeIds: Set<string> }",
    "desc": "เมื่อผู้ใช้คลิกเลือกกล่องไฟล์ใดกล่องหนึ่ง ฟังก์ชันนี้จะคำนวณหาเส้นทางความสัมพันธ์ทั้งหมดย้อนขึ้นไปหาต้นกำเนิด (Upstream) และตามลงไปหาผลลัพธ์ (Downstream) เพื่อเปิดไฟไฮไลต์เส้นทางนั้น",
    "tags": [
      "trace",
      "highlight",
      "upstream",
      "downstream"
    ],
    "snippet": "function computeTracePath(selectedId: string, edges: FlowEdgeItem[]): { nodeIds: Set<string>; edgeIds: Set<string> }",
    "jargon": "• Graph Traversal = การท่องไปตามเส้นเชื่อมของกราฟเพื่อหาโหนดที่เกี่ยวข้องกันทั้งหมด\\n• Upstream/Downstream = ต้นน้ำ (ไฟล์ที่ไฟล์นี้ไปเรียก) และปลายน้ำ (ไฟล์ที่มาเรียกไฟล์นี้)",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'อัลกอริทึมนี้ทำงานอย่างไร?' ตอบว่า: 'ใช้วิธีท่องกราฟ (Graph Traversal) ค้นหาโหนดบรรพบุรุษและลูกหลานทั้งหมด แล้วนำ ID ไปสั่งให้ React Flow ใส่เอฟเฟกต์เรืองแสงค่ะ'",
    "pythonAnalogy": "เหมือนฟังก์ชัน BFS/DFS ท่องกราฟหา connected components ใน Python"
  },
  {
    "name": "toRfNodes",
    "file": "flowcanvas",
    "filePath": "src/components/FlowCanvas.tsx",
    "line": 122,
    "owner": "คน 3",
    "category": "Canvas Rendering",
    "badge": "คน 3: Flow Canvas (Visualizer)",
    "signature": "function toRfNodes(nodes: FlowNodeItem[], activePath: Set<string>, labelMode: LabelMode): Node[]",
    "desc": "แปลง FlowNodeItem ให้เป็นโครงสร้าง Node ของ React Flow พร้อมกำหนด Handle พิกัด และระดับความโปร่งใสตามสถานะการไฮไลต์",
    "tags": [
      "reactflow",
      "nodes",
      "rendering",
      "handles"
    ],
    "snippet": "function toRfNodes(nodes: FlowNodeItem[], activePath: Set<string>, labelMode: LabelMode): Node[]"
  },
  {
    "name": "toRfEdges",
    "file": "flowcanvas",
    "filePath": "src/components/FlowCanvas.tsx",
    "line": 224,
    "owner": "คน 3",
    "category": "Canvas Rendering",
    "badge": "คน 3: Flow Canvas (Visualizer)",
    "signature": "function toRfEdges(edges: FlowEdgeItem[], activePath: Set<string>, labelMode: LabelMode): Edge[]",
    "desc": "แปลง FlowEdgeItem ให้เป็น Edge ของ React Flow พร้อมกำหนดสีเส้น, ลูกศร markerEnd, เส้นประ/เส้นทึบ และแอนิเมชัน animated",
    "tags": [
      "reactflow",
      "edges",
      "arrows",
      "animation"
    ],
    "snippet": "function toRfEdges(edges: FlowEdgeItem[], activePath: Set<string>, labelMode: LabelMode): Edge[]"
  },
  {
    "name": "FlowCanvasInner",
    "file": "flowcanvas",
    "filePath": "src/components/FlowCanvas.tsx",
    "line": 290,
    "owner": "คน 3",
    "category": "Canvas Component",
    "badge": "คน 3: Flow Canvas (Visualizer)",
    "signature": "function FlowCanvasInner({ nodes, edges, onSelectNode }: FlowCanvasProps)",
    "desc": "คอมโพเนนต์แกนหลักของ React Flow จัดการ State การซูม, แพน, ค้นหาด่วน (Node Finder), ยุบ/ขยาย MiniMap และสลับโหมดป้ายกำกับ",
    "tags": [
      "canvas",
      "react",
      "pan-zoom",
      "controls"
    ],
    "snippet": "function FlowCanvasInner({ nodes, edges, onSelectNode }: FlowCanvasProps)"
  },
  {
    "name": "handleGlobalKeyDown",
    "file": "flowcanvas",
    "filePath": "src/components/FlowCanvas.tsx",
    "line": 373,
    "owner": "คน 3",
    "category": "Keyboard Navigation",
    "badge": "คน 3: Flow Canvas (Visualizer)",
    "signature": "const handleGlobalKeyDown = (e: KeyboardEvent) => void",
    "desc": "ตรวจจับคีย์ลัดระดับ Global เช่น Ctrl+K (เปิดกล่องค้นหาโหนดด่วน), Escape (ล้างการเลือก/ปิดกล่องค้นหา) เพื่อความสะดวกในการใช้งาน",
    "tags": [
      "shortcut",
      "ctrl-k",
      "escape",
      "keyboard"
    ],
    "snippet": "const handleGlobalKeyDown = (e: KeyboardEvent) => void"
  },
  {
    "name": "HomePage",
    "file": "page",
    "filePath": "src/app/page.tsx",
    "line": 5,
    "owner": "คน 4",
    "category": "Page Entry Point",
    "badge": "คน 4: Dashboard UI",
    "signature": "export default function HomePage(): JSX.Element",
    "desc": "คอมโพเนนต์หน้าแรกแบบ Thin Server Wrapper วางส่วนหัว Navbar, โลโก้ และติดตั้ง FlowExplorer",
    "tags": [
      "page",
      "entry",
      "wrapper",
      "navbar"
    ],
    "snippet": "export default function HomePage() {"
  },
  {
    "name": "FlowExplorer",
    "file": "flowexplorer",
    "filePath": "src/components/FlowExplorer.tsx",
    "line": 25,
    "owner": "คน 4",
    "category": "State Engine & Orchestrator",
    "badge": "คน 4: State Orchestrator",
    "signature": "export function FlowExplorer(): JSX.Element",
    "desc": "คอมโพเนนต์บริหารจัดการ State กลางของ UI ฝั่ง Client: คุม Form ค้นหา, Filter แท็บ, ดึงโค้ดสด และเชื่อมต่อ FlowCanvas กับ SideDrawer",
    "tags": [
      "explorer",
      "orchestrator",
      "state",
      "client"
    ],
    "snippet": "export function FlowExplorer() {"
  },
  {
    "name": "handleSelectNode",
    "file": "flowexplorer",
    "filePath": "src/components/FlowExplorer.tsx",
    "line": 43,
    "owner": "คน 4",
    "category": "Dashboard State & Fetch",
    "badge": "คน 4: State Orchestrator",
    "signature": "async function handleSelectNode(filePath: string, fileType: NextFileType, ...): Promise<void>",
    "desc": "เมื่อผู้ใช้คลิกที่โหนดไฟล์ใดโหนดหนึ่ง ฟังก์ชันนี้จะสั่งเปิดหน้าต่าง Side Drawer ด้านข้าง และยิงคำขอไปดาวน์โหลดโค้ดจริงจาก GitHub มาแสดงผลพร้อมระบายสีโค้ด (Syntax Highlighting) ทันที",
    "tags": [
      "node-click",
      "fetch-code",
      "sidedrawer",
      "inspect"
    ],
    "snippet": "async function handleSelectNode(filePath: string, fileType: NextFileType, ...): Promise<void>",
    "jargon": "• Side Drawer = แถบเมนูด้านข้างที่เลื่อนออกมาบนหน้าจอ\\n• Syntax Highlighting = การระบายสีคำสั่งโค้ดให้อ่านง่าย เช่น ตัวแปรสีเขียว ฟังก์ชันสีเหลือง",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ดึงโค้ดมาแสดงอย่างไรไม่ให้หน้าเว็บกระตุก?' ตอบว่า: 'ดึงโค้ดผ่าน Raw URL แบบอะซิงโครนัส (Async) เฉพาะไฟล์ที่ผู้ใช้คลิกเท่านั้น ไม่ได้โหลดโค้ดทุกไฟล์มากองไว้ล่วงหน้าค่ะ'",
    "pythonAnalogy": "ฟังก์ชันดักคลิกไอเทมในตาราง แล้วยิง requests.get() โหลดเนื้อหามาแสดงในกล่องข้อความ"
  },
  {
    "name": "executeAnalysis",
    "file": "flowexplorer",
    "filePath": "src/components/FlowExplorer.tsx",
    "line": 103,
    "owner": "คน 4",
    "category": "Dashboard State & Fetch",
    "badge": "คน 4: State Orchestrator",
    "signature": "const executeAnalysis = async (targetUrl: string, githubToken?: string, activeFileFilter?: string): Promise<void>",
    "desc": "ผู้จัดการฝั่งหน้าบ้าน ทำหน้าที่ตรวจความถูกต้องของ URL, สั่งเปิดแอนิเมชันกำลังโหลด (Spinner), ส่งคำขอ HTTP POST ไปยัง /api/analyze หลังบ้าน และเมื่อได้ผลลัพธ์กลับมา ก็นำข้อมูลแผนผังไปสั่งให้หน้าจอวาดกราฟ",
    "tags": [
      "fetch",
      "api-call",
      "loading-state",
      "analyze"
    ],
    "snippet": "const executeAnalysis = async (targetUrl: string, githubToken?: string, activeFileFilter?: string): Promise<void>",
    "jargon": "• HTTP POST = รูปแบบการส่งข้อมูลไปยังเซิร์ฟเวอร์แบบมีเนื้อหาบรรจุไปด้วย (Payload)\\n• Asynchronous (async/await) = การทำงานแบบไม่รอให้หน้าจอค้าง ทำงานเบื้องหลังได้ลื่นไหล",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ถ้าเซิร์ฟเวอร์ตอบ Error 401 ฟังก์ชันนี้ทำอย่างไร?' ตอบว่า: 'ฟังก์ชันนี้จะดักจับ status 401 แล้วเปลี่ยนข้อความแจ้งเตือนเป็นภาษาไทยให้ผู้ใช้รู้ว่าใส่ Token ผิดค่ะ'",
    "pythonAnalogy": "ฟังก์ชันยิงคำขอ requests.post('/api/analyze', json={...}) พร้อม try-except"
  },
  {
    "name": "handleSubmit",
    "file": "flowexplorer",
    "filePath": "src/components/FlowExplorer.tsx",
    "line": 168,
    "owner": "คน 4",
    "category": "Form Handler",
    "badge": "คน 4: State Orchestrator",
    "signature": "const handleSubmit = (e: React.FormEvent) => void",
    "desc": "ฟังก์ชันดักจับเมื่อผู้ใช้กดปุ่ม 'วิเคราะห์โครงสร้าง' หรือกด Enter ในแบบฟอร์ม โดยจะสั่ง e.preventDefault() เพื่อห้ามไม่ให้หน้าเว็บรีเฟรช แล้วส่ง URL และ Token ไปให้ฟังก์ชัน executeAnalysis ทำงานต่อ",
    "tags": [
      "form",
      "submit",
      "event",
      "validation"
    ],
    "snippet": "const handleSubmit = (e: React.FormEvent) => void",
    "jargon": "• e.preventDefault() = คำสั่งระงับพฤติกรรมดั้งเดิมของเบราว์เซอร์ เพื่อไม่ให้เกิดการโหลดหน้าเว็บใหม่ทั้งหน้า (Full Page Reload)\\n• Client State = ข้อมูลที่หน้าเว็บจำไว้ในหน่วยความจำของเบราว์เซอร์",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมต้อง e.preventDefault()?' ตอบว่า: 'เพราะเราเขียนเว็บแบบ Single Page Application (SPA) เราต้องการให้หน้าเว็บนิ่งและแสดงแอนิเมชันกำลังโหลด ไม่ใช่รีเฟรชหน้าเว็บทิ้งไปค่ะ'",
    "pythonAnalogy": "การดัก Event บน GUI (เช่น PyQt หรือ Tkinter) เมื่อผู้ใช้กดปุ่ม Submit"
  },
  {
    "name": "handleShare",
    "file": "flowexplorer",
    "filePath": "src/components/FlowExplorer.tsx",
    "line": 173,
    "owner": "คน 4",
    "category": "Sharing",
    "badge": "คน 4: State Orchestrator",
    "signature": "const handleShare = () => void",
    "desc": "เข้ารหัสสถานะปัจจุบัน (URL + โหนดที่เลือก) ด้วย encodeShareableState และคัดลอก Share Link ลง Clipboard",
    "tags": [
      "share",
      "clipboard",
      "url-state",
      "base64"
    ],
    "snippet": "const handleShare = () => void"
  },
  {
    "name": "displayedNodes",
    "file": "flowexplorer",
    "filePath": "src/components/FlowExplorer.tsx",
    "line": 200,
    "owner": "คน 4",
    "category": "Tab Filtering",
    "badge": "คน 4: State Orchestrator",
    "signature": "const displayedNodes = useMemo(() => FlowNodeItem[], [result, filterType])",
    "desc": "กรองโหนดที่แสดงผลตามแท็บที่ผู้ใช้เลือก: ALL, PAGE (รวม middleware), ACTION (รวม api), COMPONENT, STORE",
    "tags": [
      "filter",
      "useMemo",
      "tabs",
      "nodes"
    ],
    "snippet": "const displayedNodes = useMemo(() => FlowNodeItem[], [result, filterType])"
  },
  {
    "name": "displayedEdges",
    "file": "flowexplorer",
    "filePath": "src/components/FlowExplorer.tsx",
    "line": 212,
    "owner": "คน 4",
    "category": "Tab Filtering",
    "badge": "คน 4: State Orchestrator",
    "signature": "const displayedEdges = useMemo(() => FlowEdgeItem[], [result, displayedNodes, filterType])",
    "desc": "กรองเส้นเชื่อมให้แสดงเฉพาะเส้นที่ทั้งโหนดต้นทางและปลายทางยังปรากฏอยู่บนหน้าจอหลังจากถูกกรองด้วย filterType",
    "tags": [
      "filter",
      "useMemo",
      "edges",
      "activeIds"
    ],
    "snippet": "const displayedEdges = useMemo(() => FlowEdgeItem[], [result, displayedNodes, filterType])"
  },
  {
    "name": "validateUrlInput",
    "file": "uihelper",
    "filePath": "src/lib/ui-helper.ts",
    "line": 4,
    "owner": "คน 4",
    "category": "Validation & Stats",
    "badge": "คน 4: UI Helper & URL Guard",
    "signature": "export function validateUrlInput(input: string): { isValid: boolean; errorMessage?: string }",
    "desc": "ตัวตรวจจับความถูกต้องของ URL ที่หน้าบ้าน ตรวจสอบว่าช่องกรอกไม่ว่างเปล่า ต้องขึ้นต้นด้วย github.com และต้องระบุทั้งชื่อเจ้าของและชื่อคลังโค้ด ถ้าไม่ถูกต้องจะแจ้งเตือนทันทีโดยไม่ยิงคำขอไปกวนเซิร์ฟเวอร์",
    "tags": [
      "validation",
      "guard",
      "input",
      "url"
    ],
    "snippet": "export function validateUrlInput(input: string): { isValid: boolean; errorMessage?: string }",
    "jargon": "• Client-side Validation = การตรวจความถูกต้องของข้อมูลที่หน้าเครื่องผู้ใช้ก่อนส่งไปหาเซิร์ฟเวอร์\\n• Hostname Whitelist = การอนุญาตเฉพาะโดเมนที่กำหนดเท่านั้น เช่น github.com",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมต้องตรวจที่หน้าบ้านก่อน ในเมื่อหลังบ้านก็ตรวจ?' ตอบว่า: 'เพื่อประสบการณ์ใช้งานที่ดีของผู้ใช้ (Instant Feedback) และช่วยลดภาระของเซิร์ฟเวอร์ไม่ให้รับคำขอที่ผิดพลาดค่ะ'",
    "pythonAnalogy": "ฟังก์ชันเช็ค if not re.match(r'^https://github.com/[w-]+/[w-]+', url): return False"
  },
  {
    "name": "formatRepoStats",
    "file": "uihelper",
    "filePath": "src/lib/ui-helper.ts",
    "line": 44,
    "owner": "คน 4",
    "category": "Validation & Stats",
    "badge": "คน 4: UI Helper & URL Guard",
    "signature": "export function formatRepoStats(totalFiles: number, filteredFiles: number): { displayTotal: string; filterRatio: string }",
    "desc": "คำนวณและจัดรูปแบบตัวเลขสถิติของคลัง: จำนวนไฟล์ทั้งหมด และสัดส่วนไฟล์ที่ผ่านเกณฑ์การกรอง",
    "tags": [
      "stats",
      "ratio",
      "formatting",
      "numbers"
    ],
    "snippet": "export function formatRepoStats(totalFiles: number, filteredFiles: number): { displayTotal: string; filterRatio: string }"
  },
  {
    "name": "calculateHealthScore",
    "file": "uihelper",
    "filePath": "src/lib/ui-helper.ts",
    "line": 85,
    "owner": "คน 4",
    "category": "Validation & Stats",
    "badge": "คน 4: UI Helper & URL Guard",
    "signature": "export function calculateHealthScore(totalRelations: number, filteredFiles: number): { score: number; label: string; color: string }",
    "desc": "ประเมินระดับความเชื่อมโยงของสถาปัตยกรรม (Architectural Coupling) ออกมาเป็นคะแนนและป้ายกำกับสุขภาพระบบ",
    "tags": [
      "health",
      "score",
      "coupling",
      "metrics"
    ],
    "snippet": "export function calculateHealthScore(totalRelations: number, filteredFiles: number): { score: number; label: string; color: string }"
  },
  {
    "name": "encodeShareableState",
    "file": "uihelper",
    "filePath": "src/lib/ui-helper.ts",
    "line": 63,
    "owner": "คน 4",
    "category": "Share Link",
    "badge": "คน 4: UI Helper & URL Guard",
    "signature": "export function encodeShareableState(url: string, activeNode?: string): string",
    "desc": "เข้ารหัส URL และโหนดที่กำลังโฟกัสเป็น Base64 Safe String เพื่อสร้าง Shareable Link ให้ส่งต่อให้เพื่อนได้",
    "tags": [
      "encode",
      "base64",
      "share",
      "state"
    ],
    "snippet": "export function encodeShareableState(url: string, activeNode?: string): string"
  },
  {
    "name": "decodeShareableState",
    "file": "uihelper",
    "filePath": "src/lib/ui-helper.ts",
    "line": 87,
    "owner": "คน 4",
    "category": "Share Link",
    "badge": "คน 4: UI Helper & URL Guard",
    "signature": "export function decodeShareableState(encodedStr: string): { url: string; activeNode?: string } | null",
    "desc": "ถอดรหัส Base64 จาก URL Parameter เพื่อคืนค่าสถานะเดิมที่เพื่อนแชร์มาให้",
    "tags": [
      "decode",
      "base64",
      "restore",
      "state"
    ],
    "snippet": "export function decodeShareableState(encodedStr: string): { url: string; activeNode?: string } | null"
  },
  {
    "name": "SideDrawer",
    "file": "sidedrawer",
    "filePath": "src/components/SideDrawer.tsx",
    "line": 20,
    "owner": "คน 5",
    "category": "Inspector UI",
    "badge": "คน 5: Side Drawer (Inspector)",
    "signature": "export function SideDrawer({ isOpen, onClose, filePath, fileType, codeContent, isLoading, error }: SideDrawerProps)",
    "desc": "คอมโพเนนต์แผงสไลด์ด้านข้างสำหรับเปิดดูโค้ดจริง รองรับการกด Esc ปิด, ปุ่มคัดลอกโค้ด, และลิงก์เปิด GitHub Blob",
    "tags": [
      "drawer",
      "inspector",
      "react",
      "modal"
    ],
    "snippet": "export function SideDrawer({ isOpen, onClose, filePath, fileType, codeContent, isLoading, error }: SideDrawerProps)"
  },
  {
    "name": "handleKeyDown (SideDrawer)",
    "file": "sidedrawer",
    "filePath": "src/components/SideDrawer.tsx",
    "line": 36,
    "owner": "คน 5",
    "category": "Keyboard Navigation",
    "badge": "คน 5: Side Drawer (Inspector)",
    "signature": "const handleKeyDown = (e: KeyboardEvent) => void",
    "desc": "ดักจับปุ่ม Escape เพื่อปิดแผง SideDrawer เมื่อเปิดค้างอยู่",
    "tags": [
      "escape",
      "keydown",
      "accessibility",
      "ux"
    ],
    "snippet": "const handleKeyDown = (e: KeyboardEvent) => void"
  },
  {
    "name": "handleCopy",
    "file": "sidedrawer",
    "filePath": "src/components/SideDrawer.tsx",
    "line": 58,
    "owner": "คน 5",
    "category": "Clipboard",
    "badge": "คน 5: Side Drawer (Inspector)",
    "signature": "const handleCopy = async (): Promise<void>",
    "desc": "คัดลอกซอร์สโค้ดที่แสดงอยู่ในแผง SideDrawer ลงใน Clipboard พร้อมเปลี่ยนสถานะปุ่มเป็น Copied ชั่วคราว",
    "tags": [
      "copy",
      "clipboard",
      "feedback",
      "button"
    ],
    "snippet": "const handleCopy = async (): Promise<void>"
  },
  {
    "name": "getLanguageFromPath",
    "file": "codeviewer",
    "filePath": "src/lib/code-viewer.ts",
    "line": 28,
    "owner": "คน 5",
    "category": "Syntax Highlighting",
    "badge": "คน 5: Code Viewer (Prism)",
    "signature": "export function getLanguageFromPath(filePath: string): string",
    "desc": "จำแนกภาษาวิเคราะห์จากนามสกุลไฟล์ เช่น .tsx -> tsx, .ts -> typescript, .css -> css เพื่อป้อนให้ PrismJS ไฮไลต์สีได้อย่างถูกต้อง",
    "tags": [
      "extension",
      "language",
      "prism",
      "syntax"
    ],
    "snippet": "export function getLanguageFromPath(filePath: string): string"
  },
  {
    "name": "formatCodeSnippet",
    "file": "codeviewer",
    "filePath": "src/lib/code-viewer.ts",
    "line": 53,
    "owner": "คน 5",
    "category": "Performance & Truncation",
    "badge": "คน 5: Code Viewer (Prism)",
    "signature": "export function formatCodeSnippet(rawCode: string, maxLines: number = 300): FormattedSnippet",
    "desc": "ตัดทอนซอร์สโค้ดไม่ให้เกิน 300 บรรทัด เพื่อป้องกันไม่ให้ DOM ค้างเมื่อเปิดไฟล์ขนาดยักษ์ พร้อมระบุว่าโค้ดถูกตัดหรือไม่",
    "tags": [
      "truncate",
      "maxlines",
      "performance",
      "dom"
    ],
    "snippet": "export function formatCodeSnippet(rawCode: string, maxLines: number = 300): FormattedSnippet"
  },
  {
    "name": "escapeHtml",
    "file": "codeviewer",
    "filePath": "src/lib/code-viewer.ts",
    "line": 81,
    "owner": "คน 5",
    "category": "Security & Escaping",
    "badge": "คน 5: Code Viewer (Prism)",
    "signature": "function escapeHtml(text: string): string",
    "desc": "แปลงอักขระพิเศษ HTML (&, <, >, \", ') ให้เป็น HTML entities ป้องกันช่องโหว่ XSS เมื่อเรนเดอร์โค้ดดิบ",
    "tags": [
      "xss",
      "escape",
      "security",
      "html"
    ],
    "snippet": "function escapeHtml(text: string): string"
  },
  {
    "name": "highlightCodeWithPrism",
    "file": "codeviewer",
    "filePath": "src/lib/code-viewer.ts",
    "line": 91,
    "owner": "คน 5",
    "category": "Syntax Highlighting",
    "badge": "คน 5: Code Viewer (Prism)",
    "signature": "export function highlightCodeWithPrism(code: string, language: string): string",
    "desc": "ใช้ Prism.js แปลงสตริงโค้ดให้เป็น HTML ที่มีคลาสสี syntax highlighting หาก Prism ไม่รองรับจะ fallback ไปใช้ escapeHtml ปลอดภัย 100%",
    "tags": [
      "prism",
      "highlight",
      "tokens",
      "fallback"
    ],
    "snippet": "export function highlightCodeWithPrism(code: string, language: string): string"
  },
  {
    "name": "POST (route.ts)",
    "file": "route",
    "filePath": "src/app/api/analyze/route.ts",
    "line": 7,
    "owner": "คน 6",
    "category": "API Entry Point & Guard",
    "badge": "คน 6: API Route",
    "signature": "export async function POST(req: NextRequest): Promise<NextResponse>",
    "desc": "API Route หลักของระบบ: รับคำขอ POST ตรวจสอบ Request Body, ดักจับข้อผิดพลาด และส่งต่อไปประมวลผลที่ runAnalysisPipeline",
    "tags": [
      "route",
      "post",
      "nextrequest",
      "api"
    ],
    "snippet": "export async function POST(req: NextRequest): Promise<NextResponse>"
  },
  {
    "name": "clearPipelineCache",
    "file": "pipeline",
    "filePath": "src/lib/pipeline.ts",
    "line": 60,
    "owner": "คน 6",
    "category": "Cache Management",
    "badge": "คน 6: Core Pipeline",
    "signature": "export function clearPipelineCache(): void",
    "desc": "ล้าง In-Memory Cache (pipelineCache) ทั้งหมด ใช้สำหรับการรีเซ็ตระบบ หรือใช้ใน Unit/Integration Test เพื่อกันข้อมูลปนเปื้อน",
    "tags": [
      "cache",
      "clear",
      "test",
      "memory"
    ],
    "snippet": "export function clearPipelineCache(): void"
  },
  {
    "name": "resolveAliasImport",
    "file": "pipeline",
    "filePath": "src/lib/pipeline.ts",
    "line": 66,
    "owner": "คน 6",
    "category": "Path Resolution",
    "badge": "คน 6: Core Pipeline",
    "signature": "function resolveAliasImport(rawTarget: string, allFilePaths: string[]): string | null",
    "desc": "แปลง Path Alias เช่น @/components/Button หรือ ~/lib/db ให้กลายเป็น Relative Path จริงเทียบกับ src/ หรือรากโปรเจกต์",
    "tags": [
      "alias",
      "tsconfig",
      "path",
      "resolve"
    ],
    "snippet": "function resolveAliasImport(rawTarget: string, allFilePaths: string[]): string | null"
  },
  {
    "name": "resolveRelativeImport",
    "file": "pipeline",
    "filePath": "src/lib/pipeline.ts",
    "line": 81,
    "owner": "คน 6",
    "category": "Path Resolution",
    "badge": "คน 6: Core Pipeline",
    "signature": "function resolveRelativeImport(cleanTarget: string, sourcePath: string, allFilePaths: string[]): string | null",
    "desc": "แปลง Relative Import เช่น ../../components/Card โดยคำนวณถอยโฟลเดอร์ตามลำดับเพื่อหาไฟล์ปลายทางจริง",
    "tags": [
      "relative",
      "dot-dot",
      "normalize",
      "path"
    ],
    "snippet": "function resolveRelativeImport(cleanTarget: string, sourcePath: string, allFilePaths: string[]): string | null"
  },
  {
    "name": "resolveImportToFilePath",
    "file": "pipeline",
    "filePath": "src/lib/pipeline.ts",
    "line": 103,
    "owner": "คน 6",
    "category": "Path Resolution",
    "badge": "คน 6: Core Pipeline",
    "signature": "function resolveImportToFilePath(importTarget: string, sourcePath: string, allFilePaths: string[]): string | null",
    "desc": "ตัวประสานการแปลง Path: ลองแกะด้วย Alias ก่อน ถ้าไม่ใช่ให้ลอง Relative และ fallback ด้วยการค้นหาชื่อไฟล์แบบ index หรือ นามสกุล .tsx/.ts",
    "tags": [
      "resolver",
      "extension",
      "index-file",
      "lookup"
    ],
    "snippet": "function resolveImportToFilePath(importTarget: string, sourcePath: string, allFilePaths: string[]): string | null"
  },
  {
    "name": "inferStructuralRelations",
    "file": "pipeline",
    "filePath": "src/lib/pipeline.ts",
    "line": 133,
    "owner": "คน 6",
    "category": "Structural Heuristics",
    "badge": "คน 6: Core Pipeline",
    "signature": "export function inferStructuralRelations(filteredFiles: GitHubTreeItem[], allFilePaths: string[]): CodeRelation[]",
    "desc": "ฟังก์ชันอัจฉริยะของคน 6: แกะโครงสร้าง Next.js App Router เพื่อสร้างเส้นความสัมพันธ์ระดับโฟลเดอร์โดยไม่ต้องยิง API ดึงโค้ดดิบ (ประหยัด Rate Limit มหาศาล)",
    "tags": [
      "structural",
      "heuristics",
      "app-router",
      "zero-cost"
    ],
    "snippet": "export function inferStructuralRelations(filteredFiles: GitHubTreeItem[], allFilePaths: string[]): CodeRelation[]"
  },
  {
    "name": "fetchGitHubTree",
    "file": "pipeline",
    "filePath": "src/lib/pipeline.ts",
    "line": 299,
    "owner": "คน 6",
    "category": "Network & Fallback",
    "badge": "คน 6: Core Pipeline",
    "signature": "async function fetchGitHubTree(owner: string, repo: string, branch: string, token?: string): Promise<{ items: GitHubTreeItem[]; activeBranch: string }>",
    "desc": "ยิงดึง Trees API พร้อมระบบ Auto Fallback: หาก branch main เจอ 404 จะสลับไปลอง branch master ทันทีโดยอัตโนมัติ",
    "tags": [
      "fetch",
      "github-api",
      "fallback",
      "main-master"
    ],
    "snippet": "async function fetchGitHubTree(owner: string, repo: string, branch: string, token?: string): Promise<{ items: GitHubTreeItem[]; activeBranch: string }>"
  },
  {
    "name": "extractRelationsFromContent",
    "file": "pipeline",
    "filePath": "src/lib/pipeline.ts",
    "line": 374,
    "owner": "คน 6",
    "category": "Content Analysis & Guard",
    "badge": "คน 6: Core Pipeline",
    "signature": "function extractRelationsFromContent(file: GitHubTreeItem, content: string, allPaths: string[]): CodeRelation[]",
    "desc": "ประสานงานเรียกตัวแกะ imports และ action triggers ของคน 2 พร้อมครอบ try/catch กันพังและแปลง path ให้ตรงกับโหนดในระบบ",
    "tags": [
      "extract",
      "content",
      "parser-integration",
      "safe"
    ],
    "snippet": "function extractRelationsFromContent(file: GitHubTreeItem, content: string, allPaths: string[]): CodeRelation[]"
  },
  {
    "name": "runAnalysisPipeline",
    "file": "pipeline",
    "filePath": "src/lib/pipeline.ts",
    "line": 439,
    "owner": "คน 6",
    "category": "Core Orchestrator",
    "badge": "คน 6: Core Pipeline",
    "signature": "export async function runAnalysisPipeline(githubUrl: string, githubToken?: string): Promise<AnalysisResult>",
    "desc": "แม่ทัพคุมกระบวนการหลังบ้านทั้งหมด ทำงานเป็นสายพาน 6 จังหวะ: ตรวจ URL -> เช็คแคชในแรม -> ดึงผังไฟล์จาก GitHub -> กรองไฟล์และแยกบทบาท -> แกะความสัมพันธ์ของ import -> ส่งไปจัดผัง Dagre แล้วบันทึกแคชก่อนตอบกลับ",
    "tags": [
      "orchestrator",
      "pipeline",
      "concurrency",
      "timeout",
      "master-flow"
    ],
    "snippet": "export async function runAnalysisPipeline(githubUrl: string, githubToken?: string): Promise<AnalysisResult>",
    "jargon": "• Pipeline = ท่อประมวลผลที่ส่งงานต่อกันเป็นทอด ๆ เหมือนสายพานโรงงาน\\n• LRU Cache = แคชที่จะทิ้งข้อมูลที่ไม่ได้ใช้นานที่สุดออกไปก่อนเมื่อพื้นที่เต็ม",
    "deepExplain": "ถ้าอาจารย์ถามว่า 'ทำไมต้องรวมไว้ในฟังก์ชันเดียว?' ตอบว่า: 'เพราะเป็นศูนย์กลางควบคุมลำดับการทำงาน (Orchestrator) ทำให้ตรวจสอบเวลาทำงาน (Execution Time) และควบคุมความปลอดภัยได้ครบในจุดเดียวค่ะ'",
    "pythonAnalogy": "ฟังก์ชัน main_pipeline() ที่เรียก helper functions ย่อยตามลำดับ 1 ถึง 6"
  }
];
