#!/usr/bin/env node
// Render a markdown file (with Mermaid code blocks) to PNG screenshots, so a
// Claude run can visually validate doc changes without relying on the GitHub
// renderer being viewable from the agent.
//
// Usage:
//   node .github/scripts/visual-check-md.mjs <md-file> <out-dir> [--width=1280] [--height=2400]
//
// Produces in <out-dir>:
//   preview.html      - self-contained HTML page with the rendered markdown
//   full-page.png     - full-page screenshot at the configured viewport
//   diagram-N.png     - one PNG per ```mermaid block, rendered at a larger size
//
// Implementation:
//   - markdown-it (loaded from jsDelivr CDN inside the page) renders the
//     markdown to HTML; mermaid code blocks are passed through as
//     <div class="mermaid"> nodes.
//   - mermaid@10 (also from CDN) renders those nodes client-side.
//   - System Chrome ($CHROME_BIN or `google-chrome`) takes the screenshots
//     in --headless=new mode. No node-side npm install is required.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("usage: visual-check-md.mjs <markdown-file> <out-dir> [--width=N] [--height=N]");
  process.exit(2);
}

const [mdPath, outDir, ...rest] = args;
const optWidth = Number((rest.find(a => a.startsWith("--width=")) || "--width=1280").split("=")[1]);
const optHeight = Number((rest.find(a => a.startsWith("--height=")) || "--height=2400").split("=")[1]);

const md = fs.readFileSync(mdPath, "utf8");
fs.mkdirSync(outDir, { recursive: true });

const chromeBin = process.env.CHROME_BIN || "google-chrome";

function renderHtmlPage(mdSource) {
  const mdLiteral = JSON.stringify(mdSource);
  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<title>preview</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; max-width: 1012px; margin: 32px auto; padding: 0 24px; color: #1f2328; line-height: 1.5; }
  h1, h2 { border-bottom: 1px solid #d0d7de; padding-bottom: .3em; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #d0d7de; padding: 6px 13px; }
  th { background: #f6f8fa; }
  pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
  code { background: #eaeef2; padding: .2em .4em; border-radius: 4px; font-size: 85%; }
  pre code { background: transparent; padding: 0; font-size: 100%; }
  .mermaid { background: white; padding: 12px 0; }
  blockquote { border-left: .25em solid #d0d7de; color: #57606a; padding: 0 1em; }
  .render-error { color: #b91c1c; background: #fef2f2; padding: 12px; border: 1px solid #fecaca; border-radius: 4px; }
</style>
</head><body>
<div id="content">Loading…</div>
<script type="module">
  try {
    const mditMod = await import("https://cdn.jsdelivr.net/npm/markdown-it@14/+esm");
    const mdit = mditMod.default || mditMod;
    const mermaid = (await import("https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs")).default;
    const md = mdit({ html: true, linkify: true });
    const defaultFence = md.renderer.rules.fence;
    md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
      const t = tokens[idx];
      if (t.info && t.info.trim() === "mermaid") {
        return '<div class="mermaid">' + t.content + '</div>';
      }
      return defaultFence(tokens, idx, options, env, slf);
    };
    document.getElementById("content").innerHTML = md.render(${mdLiteral});
    mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });
    await mermaid.run();
    document.title = "ready";
    window.__renderDone = true;
  } catch (e) {
    document.body.innerHTML = '<div class="render-error">Render failed: ' + (e && e.message || e) + '</div>';
  }
</script>
</body></html>`;
}

function renderMermaidPage(diagramSource) {
  // Inline the source directly into innerHTML — the browser HTML parser decodes
  // entity references (e.g. &lt;) and turns Mermaid's <br/> markers into real
  // <br> nodes, which is exactly what mermaid expects. This matches what
  // markdown-it does for the full-page render.
  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<title>diagram</title>
<style>body{margin:0;padding:24px;background:white;font-family:system-ui;}</style>
</head><body>
<div class="mermaid">${diagramSource}</div>
<script type="module">
  const mermaid = (await import("https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs")).default;
  mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });
  await mermaid.run();
  document.title = "ready";
</script>
</body></html>`;
}

function chromeScreenshot(htmlPath, outPng, width, height) {
  const r = spawnSync(chromeBin, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    `--window-size=${width},${height}`,
    "--virtual-time-budget=15000",
    `--screenshot=${outPng}`,
    "file://" + path.resolve(htmlPath),
  ], { stdio: "pipe" });
  if (r.status !== 0) {
    console.error("chrome failed for", htmlPath, "status", r.status);
    if (r.stderr) console.error(r.stderr.toString().split("\n").slice(-5).join("\n"));
    return false;
  }
  return true;
}

// 1) Full-page render of the markdown.
const previewHtml = path.join(outDir, "preview.html");
fs.writeFileSync(previewHtml, renderHtmlPage(md));
const fullPng = path.join(outDir, "full-page.png");
if (!chromeScreenshot(previewHtml, fullPng, optWidth, optHeight)) process.exit(1);
console.log("wrote", fullPng);

// 2) Per-mermaid-block renders for high-res inspection.
const fenceRegex = /```mermaid\n([\s\S]*?)```/g;
let m, idx = 0;
while ((m = fenceRegex.exec(md)) !== null) {
  idx += 1;
  const src = m[1].trimEnd();
  const htmlOut = path.join(outDir, `diagram-${idx}.html`);
  const pngOut = path.join(outDir, `diagram-${idx}.png`);
  fs.writeFileSync(htmlOut, renderMermaidPage(src));
  if (!chromeScreenshot(htmlOut, pngOut, 1600, 1100)) process.exit(1);
  console.log("wrote", pngOut);
}
console.log(`done: ${idx} mermaid block(s)`);
