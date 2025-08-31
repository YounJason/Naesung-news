(function () {
  const MD_BASES = ["/articles/", "/md/", "/"];
  const TARGETS = {
    title: document.querySelector(".title"),
    meta: document.querySelector(".meta"),
    body: document.querySelector(".desc"),
  };

  function getSlug() {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("slug");
    if (q) return decodeURIComponent(q.replace(/\.md$/i, ""));
    const m = window.location.pathname.match(/\/v\/([^\/]+)\/?$/i);
    if (m && m[1]) return decodeURIComponent(m[1].replace(/\.md$/i, ""));
    const last = window.location.pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last.replace(/\.md$/i, "")) : "";
  }

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
      }
    }
    const err = new Error("Markdown 파일을 찾지 못했어요.");
    err.tried = tried;
    throw err;
  }

  function extractFrontMatter(raw) {
    const fmRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
    const m = raw.match(fmRegex);
    if (!m) return { meta: {}, body: raw };

    const yamlStr = m[1];
    const body = raw.slice(m[0].length);

    if (window.jsyaml && typeof window.jsyaml.load === "function") {
      try {
        const meta = window.jsyaml.load(yamlStr) || {};
        return { meta, body };
      } catch {
      }
    }
    const meta = {};
    yamlStr.split(/\r?\n/).forEach((line) => {
      const idx = line.indexOf(":");
      if (idx > -1) {
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        meta[key] = val;
      }
    });
    return { meta, body };
  }

  function mdToHtml(markdown) {
    if (window.marked && typeof window.marked.parse === "function") {
      return window.marked.parse(markdown, { gfm: true });
    }
    const esc = (s) => s.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
    const blocks = [];
    let text = markdown.replace(/```([\s\S]*?)```/g, (_, code) => {
      const idx = blocks.push(code) - 1;
      return `@@BLOCK${idx}@@`;
    });
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
    text = text.replace(/@@BLOCK(\d+)@@/g, (_, i) => {
      const code = esc(blocks[Number(i)]);
      return `<pre><code>${code}</code></pre>`;
    });
    return text;
  }

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
