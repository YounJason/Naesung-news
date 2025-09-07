const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
@@ -77,59 +74,69 @@ function stripMarkdown(text) {
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

function buildIndex(contentDirName, outputFileName) {
  const CONTENT_DIR = path.join(process.cwd(), contentDirName);
  const OUTPUT_FILE = path.join(process.cwd(), 'data', outputFileName);

  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`No content dir: ${CONTENT_DIR}`);
    return;
  }

  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  
  const files = walk(CONTENT_DIR).filter((p) => p.toLowerCase().endsWith('.md'));

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
      return { title, slug, path: rel, author, img, desc, committedAt, firstCommittedAt };
    })
    .sort((a, b) => {
      if (!a.committedAt && !b.committedAt) return 0;
      if (!a.committedAt) return 1;
      if (!b.committedAt) return -1;
      return new Date(b.committedAt) - new Date(a.committedAt);
    });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${OUTPUT_FILE} with ${index.length} items.`);
}

function main() {
  buildIndex('articles', 'articles.json');
  buildIndex('sports', 'sports.json');
}

main();
