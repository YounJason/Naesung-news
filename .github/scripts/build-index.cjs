// .github/scripts/build-index.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIGS = [
  { dir: 'articles', out: 'data/articles.json' },
  { dir: 'sports', out: 'data/sports.json' }
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
}

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function parseFrontMatter(raw) {
  // 시작이 --- 인 블록을 간단 파싱해요
  if (!raw.startsWith('---')) return { data: {}, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { data: {}, body: raw };
  const fmBlock = raw.slice(3, end).trim();
  const body = raw.slice(end + 4);
  const data = {};
  for (const line of fmBlock.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    data[key] = val;
  }
  return { data, body };
}

function extractTitle({ data, body }) {
  if (data.title) return String(data.title);
  const m = body.match(/^#\s+(.+)\s*$/m);
  return m ? m[1].trim() : '';
}

function posixPath(p) {
  return p.split(path.sep).join('/');
}

// 추가: 본문에서 첫 번째 이미지를 찾아 반환 (없으면 undefined)
function extractFirstImage(body) {
  // 1) Markdown 이미지: ![alt](url "title")
  const mdImg = body.match(/!\[[^\]]*\]\((\S+?)(?:\s+"[^"]*")?\)/);
  if (mdImg && mdImg[1]) return mdImg[1];

  // 2) HTML 이미지: <img src="url" ...>
  const htmlImg = body.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (htmlImg && htmlImg[1]) return htmlImg[1];

  return undefined;
}

function stripMarkdown(text) {
  return text
    // 이미지 제거 ![alt](url)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    // 링크 텍스트만 남기기 [text](url)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // 인라인 코드 `code`
    .replace(/`([^`]+)`/g, '$1')
    // 헤더 ### Title
    .replace(/^#+\s+/gm, '')
    // 굵게/기울임 **text** *text*
    .replace(/(\*{1,2}|_{1,2})(.*?)\1/g, '$2')
    // HTML 태그 제거 <tag>
    .replace(/<\/?[^>]+(>|$)/g, '')
    // 줄바꿈/공백 정리
    .replace(/\s+/g, ' ')
    .trim();
}

function gitLatestCommitISO(relPath) {
  try {
    const cmd = `git log -1 --format=%cI -- "${relPath}"`;
    const out = execSync(cmd, { encoding: 'utf8' }).trim();
    return out || null;
  } catch {
    return null;
  }
}


function gitFirstCommitISO(relPath) {
  try {
    const cmd = `git log --reverse --format=%cI -- "${relPath}" | head -n 1`;
    const out = execSync(cmd, { encoding: 'utf8' }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function buildIndex({ dir, out }) {
  const contentDir = path.join(process.cwd(), dir);
  const outputFile = path.join(process.cwd(), out);
  if (!fs.existsSync(contentDir)) {
    console.error(`No content dir: ${contentDir}`);
    return;
  }
  const outDir = path.dirname(outputFile);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const files = walk(contentDir).filter((p) => p.toLowerCase().endsWith('.md'));

  const index = files
    .map((absPath) => {
      const rel = posixPath(path.relative(process.cwd(), absPath));
      const raw = readFileSafe(absPath);
      const { data, body } = parseFrontMatter(raw);
      const title = extractTitle({ data, body });
      const slug = path.basename(absPath, path.extname(absPath));
      const author = data.author || '';
      const img = extractFirstImage(body);
      const desc = stripMarkdown(body).slice(0, 100);
      const committedAt = gitLatestCommitISO(rel); // ISO 8601 string or null
      const firstCommittedAt = gitFirstCommitISO(rel);
      const score = data.score;
      const item = { title, slug, path: rel, author, img, desc, committedAt, firstCommittedAt };
      if (score !== undefined) item.score = score;
      return item;
    })
    .sort((a, b) => {
      if (!a.committedAt && !b.committedAt) return 0;
      if (!a.committedAt) return 1;
      if (!b.committedAt) return -1;
      return new Date(b.committedAt) - new Date(a.committedAt);
    });

  fs.writeFileSync(outputFile, JSON.stringify(index, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${outputFile} with ${index.length} items.`);
}

function main() {
  for (const cfg of CONFIGS) buildIndex(cfg);
}

main();
