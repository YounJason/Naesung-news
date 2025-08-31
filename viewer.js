// viewer.js
(function () {
  // 기본 설정: /articles/<slug>.md에서 파일을 가져오도록 해요.
  const MD_BASES = ["/articles/", "/md/", "/"]; // 순차 시도 경로
  const TARGETS = {
    title: document.querySelector(".title"),
    meta: document.querySelector(".meta"),
    body: document.querySelector(".desc"),
  };

  // 1) slug 얻기: ?slug=... 또는 /v/<slug> 형태 모두 지원해요.
  function getSlug() {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("slug");
    if (q) return decodeURIComponent(q.replace(/\.md$/i, ""));
    // /v/<slug> or /v/<slug>/ 형태
    const m = window.location.pathname.match(/\/v\/([^\/]+)\/?$/i);
    if (m && m[1]) return decodeURIComponent(m[1].replace(/\.md$/i, ""));
    // 마지막 대안: 경로의 마지막 세그먼트
    const last = window.location.pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last.replace(/\.md$/i, "")) : "";
  }

  // 2) Markdown 파일을 순차적으로 시도해서 받아와요.
  async function fetchMarkdown(slug) {
    const tried = [];
    for (const base of MD_BASES) {
      const url = base + slug + ".md";
      tried.push(url);
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          return { url, text: await res.text() };
        }
      } catch (_) {
        // 다른 경로 시도
      }
    }
    const err = new Error("Markdown 파일을 찾지 못했어요.");
    err.tried = tried;
    throw err;
  }

  // 3) 프론트매터 추출: --- ... --- 블록을 떼어내고 meta+body 반환해요.
  function extractFrontMatter(raw) {
    const fmRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
    const m = raw.match(fmRegex);
    if (!m) return { meta: {}, body: raw };

    const yamlStr = m[1];
    const body = raw.slice(m[0].length);

    // js-yaml이 있으면 최대한 정확히 파싱
    if (window.jsyaml && typeof window.jsyaml.load === "function") {
      try {
        const meta = window.jsyaml.load(yamlStr) || {};
        return { meta, body };
      } catch {
        // 실패하면 간단 파서로 폴백
      }
    }
    // 초간단 키:값 파서 (배열/중첩 미지원)
    const meta = {};
    yamlStr.split(/\r?\n/).forEach((line) => {
      const idx = line.indexOf(":");
      if (idx > -1) {
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        // 양끝 따옴표 제거
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        meta[key] = val;
      }
    });
    return { meta, body };
  }

  // 4) Markdown -> HTML 변환: marked가 있으면 활용, 없으면 폴백
  function mdToHtml(markdown) {
    if (window.marked && typeof window.marked.parse === "function") {
      // marked v5+
      return window.marked.parse(markdown, { gfm: true });
    }
    // 아주 간단한 폴백: 최소한의 가독성만
    const esc = (s) => s.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
    // 코드블록 보존
    const blocks = [];
    let text = markdown.replace(/```([\s\S]*?)```/g, (_, code) => {
      const idx = blocks.push(code) - 1;
      return `@@BLOCK${idx}@@`;
    });
    // 간단한 치환들
    text = esc(text)
      .replace(/^######\s+(.*)$/gm, "<h6>$1</h6>")
      .replace(/^#####\s+(.*)$/gm, "<h5>$1</h5>")
      .replace(/^####\s+(.*)$/gm, "<h4>$1</h4>")
      .replace(/^###\s+(.*)$/gm, "<h3>$1</h3>")
      .replace(/^##\s+(.*)$/gm, "<h2>$1</h2>")
      .replace(/^#\s+(.*)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+?)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2">$1</a>')
      .replace(/(\r?\n){2,}/g, "</p><p>")
      .replace(/\r?\n/g, "<br>")
      .replace(/^/, "<p>")
      .replace(/$/, "</p>");
    // 코드블록 복원
    text = text.replace(/@@BLOCK(\d+)@@/g, (_, i) => {
      const code = esc(blocks[Number(i)]);
      return `<pre><code>${code}</code></pre>`;
    });
    return text;
  }

  // 5) 렌더링
  function render({ meta, html }) {
    if (TARGETS.title) {
      TARGETS.title.textContent = meta.title || "";
      if (meta.title) document.title = meta.title + " - 내성 신문";
    }
    if (TARGETS.meta) {
      const bits = [];
      if (meta.author) bits.push(meta.author);
      if (meta.date) bits.push(meta.date);
      TARGETS.meta.textContent = bits.join(" · ");
    }
    if (TARGETS.body) {
      TARGETS.body.innerHTML = html;
    }
  }

  // 6) 실행
  (async function run() {
    const slug = getSlug();
    if (!slug) {
      render({
        meta: { title: "글을 찾을 수 없어요" },
        html: "<p>URL에 <code>slug</code>가 없어요. <code>?slug=예시</code>나 <code>/v/예시</code> 형태로 접근해 주세요.</p>"
      });
      return;
    }
    try {
      const { text } = await fetchMarkdown(slug);
      const { meta, body } = extractFrontMatter(text);
      const html = mdToHtml(body);
      render({ meta, html });
    } catch (err) {
      render({
        meta: { title: "글을 불러오지 못했어요" },
        html: `<p>요청한 파일을 찾지 못했어요. ${
          err.tried ? "시도한 경로: <br>" + err.tried.map(escHTML).join("<br>") : ""
        }</p>`
      });
    }

    function escHTML(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      }[c]));
    }
  })();
})();
