import fs from "fs-extra";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const SITE_ORIGIN = "https://example.netlify.app";
const DIST = "dist";
const ARTICLES_DIR = "articles";
const TEMPLATE_PATH = "templates/page.html";

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );

async function main() {
  // 🔑 dist를 깨끗하게 비우고
  await fs.emptyDir(DIST);

  // 🔑 루트 파일/폴더를 통째로 dist로 복사
  const exclude = ["articles", "templates", "dist", ".git", "node_modules"];
  const items = await fs.readdir(process.cwd());
  for (const item of items) {
    if (exclude.includes(item)) continue;
    await fs.copy(item, path.join(DIST, item));
  }
  console.log("📦 루트 파일/폴더 복사 완료");

  // 템플릿 불러오기
  const tpl = await fs.readFile(TEMPLATE_PATH, "utf8");

  // 마크다운 파일 빌드
  const files = (await fs.readdir(ARTICLES_DIR)).filter((f) =>
    f.endsWith(".md")
  );

  for (const file of files) {
    const slug = path.basename(file, ".md");
    const raw = await fs.readFile(path.join(ARTICLES_DIR, file), "utf8");
    const { data: meta, content } = matter(raw);

    const title = meta.title || slug;
    const author = meta.author || "";
    const date = meta.date || "";
    const metaLine = [author ? author + " 기자" : "", date]
      .filter(Boolean)
      .join(" · ");

    const bodyHtml = marked.parse(content, { gfm: true });
    const description =
      meta.description || content.replace(/\s+/g, " ").slice(0, 120);
    const image = meta.image || `${SITE_ORIGIN}/default.jpg`;
    const url = `${SITE_ORIGIN}/v/${encodeURIComponent(slug)}`;

    const html = tpl
      .replaceAll("${titleSafe}", esc(title))
      .replaceAll("${titleHtml}", esc(title))
      .replaceAll("${descSafe}", esc(description))
      .replaceAll("${metaLine}", esc(metaLine))
      .replaceAll("${bodyHtml}", bodyHtml)
      .replaceAll("${url}", esc(url))
      .replaceAll("${image}", esc(image));

    const outDir = path.join(DIST, "v", slug);
    await fs.ensureDir(outDir);
    await fs.writeFile(path.join(outDir, "index.html"), html, "utf8");
  }

  console.log("✅ 글 페이지 생성 완료 (dist/v/*).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
