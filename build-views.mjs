// build-views.mjs
import fs from "fs-extra";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://naesung-news.netlify.app/";
const DIST = "dist";
const DEFAULT_TEMPLATE = "templates/viewer.html"; // ✅ 기본 템플릿 상수로 분리

// ✅ 카테고리별 템플릿 지정 (sports는 sports.html 사용)
const CATEGORIES = [
  { dir: "articles", json: "articles.json", out: "v", template: "templates/viewer.html" },
  { dir: "sports",   json: "sports.json",   out: "s", template: "templates/sports.html" }
];

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])
  );

function loadIndexMap(jsonFile) {
  const jsonPath = path.join(process.cwd(), "data", jsonFile);
  if (!fs.existsSync(jsonPath)) return {};
  const arr = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const map = {};
  for (const it of arr) {
    if (it.slug) map[it.slug] = it;
  }
  return map;
}

function toAbsoluteUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return SITE_ORIGIN.replace(/\/$/, "") + u;
  return SITE_ORIGIN.replace(/\/$/, "") + "/" + u.replace(/^\.\//, "");
}

async function main() {
  // 1) dist 초기화 + 루트 전체 복사
  await fs.emptyDir(DIST);
  const exclude = ["articles", "sports", "templates", "dist", ".git", "node_modules"];
  for (const item of await fs.readdir(process.cwd())) {
    if (!exclude.includes(item)) await fs.copy(item, path.join(DIST, item));
  }

  // ❌ (기존) 템플릿을 하나만 읽던 로직 제거
  // ✅ (변경) 루프 안에서 카테고리별 템플릿을 읽어 사용
  for (const cfg of CATEGORIES) {
    const dir = cfg.dir;
    if (!(await fs.pathExists(dir))) continue;

    // ✅ 카테고리별 템플릿 결정 + 안전한 폴백
    const tplPath = cfg.template || DEFAULT_TEMPLATE;
    const tpl = await fs.readFile(
      (await fs.pathExists(tplPath)) ? tplPath : DEFAULT_TEMPLATE,
      "utf8"
    );

    const idxBySlug = loadIndexMap(cfg.json);
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const slug = path.basename(file, ".md");
      const raw = await fs.readFile(path.join(dir, file), "utf8");
      const { data: fm, content } = matter(raw);

      // a) JSON 인덱스 우선, 없으면 frontmatter/본문에서 보강
      const idx = idxBySlug[slug] || {};
      const title = idx.title || fm.title || slug;
      const author = idx.author || fm.author || "";
      const plain = content
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/[#>*_`]/g, " ")
        .replace(/<\/?[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // desc: JSON → fm.description → (필요 시) plain 120자 트림으로 폴백
      const description = (idx.desc || fm.description || "").trim() || plain.slice(0, 120);

      // 이미지: JSON → fm.image → 기본값
      const image = toAbsoluteUrl(idx.img || fm.image || "/default.jpg");
      const published = idx.firstCommittedAt || idx.committedAt || "";
      const modified  = idx.committedAt || published || "";

      const metaLine = [
        author ? esc(author) + " 기자" : "",
        published
          ? `작성일: <time class="time-local" datetime="${esc(published)}">${esc(published)}</time>`
          : "",
        modified
          ? `수정일: <time class="time-local" datetime="${esc(modified)}">${esc(modified)}</time>`
          : "",
      ].filter(Boolean).join("<br />");

      // b) 본문 HTML
      const bodyHtml = marked.parse(content, { gfm: true });

      // c) 템플릿 치환 + OG/트위터/SEO 값 주입
      const url = `${SITE_ORIGIN.replace(/\/$/, "")}/${cfg.out}/${encodeURIComponent(slug)}`;

      const html = tpl
        .replaceAll("${titleSafe}", esc(title) + " - 내성 신문")
        .replaceAll("${titleHtml}", esc(title))
        .replaceAll("${descSafe}", esc(description))
        .replaceAll("${metaLine}", metaLine)
        .replaceAll("${bodyHtml}", bodyHtml)
        .replaceAll("${url}", esc(url))
        .replaceAll("${image}", esc(image || `${SITE_ORIGIN}/default.jpg`))
        .replaceAll("${ogSiteName}", "내성 신문")
        .replaceAll("${ogLocale}", "ko_KR")
        .replaceAll("${articlePublished}", esc(published))
        .replaceAll("${articleModified}", esc(modified))
        .replaceAll("${articleAuthor}", esc(author));

      const outDir = path.join(DIST, cfg.out, slug);
      await fs.ensureDir(outDir);
      await fs.writeFile(path.join(outDir, "index.html"), html, "utf8");
    }
  }

  console.log("✅ 카테고리별 템플릿 적용 및 OG 데이터 반영 완료.");
}

main().catch((e) => { console.error(e); process.exit(1); });
