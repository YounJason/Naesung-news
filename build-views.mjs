// build-views.mjs (중요 부분만 발췌/갱신)
import fs from "fs-extra";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://naesung-news.netlify.app/";
const DIST = "dist";
const ARTICLES_DIR = "articles";
const TEMPLATE_PATH = "templates/page.html";

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])
  );

// JSON 인덱스 읽어와서 slug -> 레코드 맵 생성
function loadIndexMap() {
  const jsonPath = path.join(process.cwd(), "data", "articles.json");
  if (!fs.existsSync(jsonPath)) return {};
  const arr = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const map = {};
  for (const it of arr) {
    if (it.slug) map[it.slug] = it;
  }
  return map;
}

// 상대 경로 이미지를 절대 URL로 승격
function toAbsoluteUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  // '/img/...' 같이 루트 기준이면 SITE_ORIGIN 붙임
  if (u.startsWith("/")) return SITE_ORIGIN.replace(/\/$/, "") + u;
  // 상대 경로는 루트 기준으로 처리
  return SITE_ORIGIN.replace(/\/$/, "") + "/" + u.replace(/^\.\//, "");
}

async function main() {
  // 1) dist 초기화 + 루트 전체 복사 (v만이 아니라 루트 통째로 복사)
  await fs.emptyDir(DIST);
  const exclude = ["articles", "templates", "dist", ".git", "node_modules"];
  for (const item of await fs.readdir(process.cwd())) {
    if (!exclude.includes(item)) await fs.copy(item, path.join(DIST, item));
  }

  // 2) 템플릿/인덱스 로드
  const tpl = await fs.readFile(TEMPLATE_PATH, "utf8");
  const idxBySlug = loadIndexMap();

  // 3) 각 글 빌드
  const files = (await fs.readdir(ARTICLES_DIR)).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const slug = path.basename(file, ".md");
    const raw = await fs.readFile(path.join(ARTICLES_DIR, file), "utf8");
    const { data: fm, content } = matter(raw);

    // a) JSON 인덱스 우선, 없으면 frontmatter/본문에서 보강
    const idx = idxBySlug[slug] || {};
    const title = idx.title || fm.title || slug;
    const author = idx.author || fm.author || "";
    // desc: JSON → fm.description → 본문 요약
    const plain = content
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[#>*_`]/g, " ")
      .replace(/<\/?[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    // description 처리
const description = idx.desc || fm.description || "";
    // 이미지: JSON → fm.image → 기본값
    const image = toAbsoluteUrl(idx.img || fm.image || "/default.jpg");
    // 날짜: JSON.firstCommittedAt → JSON.committedAt
    const published = idx.firstCommittedAt || idx.committedAt || "";
    const modified = idx.committedAt || published || "";

    const metaLine = [author ? author + " 기자" : "", idx.committedAt || ""]
      .filter(Boolean)
      .join(" · ");

    // b) 본문 HTML
    const bodyHtml = marked.parse(content, { gfm: true });

    // c) 템플릿 치환 + OG/트위터/SEO 값 주입
    const url = `${SITE_ORIGIN.replace(/\/$/, "")}/v/${encodeURIComponent(slug)}`;

    const html = tpl
      .replaceAll("${titleSafe}", esc(title) + " - 내성 신문")
      .replaceAll("${titleHtml}", esc(title))
      .replaceAll("${descSafe}", esc(description))
      .replaceAll("${metaLine}", esc(metaLine))
      .replaceAll("${bodyHtml}", bodyHtml)
      .replaceAll("${url}", esc(url))
      .replaceAll("${image}", esc(image || `${SITE_ORIGIN}/default.jpg`))
      .replaceAll("${ogSiteName}", "내성 신문")
      .replaceAll("${ogLocale}", "ko_KR")
      .replaceAll("${articlePublished}", esc(published))
      .replaceAll("${articleModified}", esc(modified))
      .replaceAll("${articleAuthor}", esc(author));

    const outDir = path.join(DIST, "v", slug);
    await fs.ensureDir(outDir);
    await fs.writeFile(path.join(outDir, "index.html"), html, "utf8");
  }

  console.log("✅ OG 데이터(articles.json 우선) 반영 완료.");
}

main().catch((e) => { console.error(e); process.exit(1); });
