import fs from "node:fs/promises";
import path from "node:path";
import * as esbuild from "esbuild";

const releaseRoot = path.resolve("dist/games/mahjong");
const indexPath = path.join(releaseRoot, "index.html");

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fileSize(filePath) {
  return (await fs.stat(filePath)).size;
}

function minifyHtmlShell(html) {
  return html
    .replace(/<!--(?!\[if\b)[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .trim();
}

async function minifyStyleBlocks(html) {
  const stylePattern = /<style([^>]*)>([\s\S]*?)<\/style>/gi;
  const blocks = [];
  html.replace(stylePattern, (match, attrs, css) => {
    blocks.push({ match, attrs, css });
    return match;
  });
  for (const block of blocks) {
    const result = await esbuild.transform(block.css, { loader: "css", minify: true });
    html = html.replace(block.match, `<style${block.attrs}>${result.code.trim()}</style>`);
  }
  return html;
}

async function minifyInlineScripts(html) {
  const scriptPattern = /<script((?:(?!\bsrc=)[^>])*)>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  html.replace(scriptPattern, (match, attrs, js) => {
    if (js.trim()) blocks.push({ match, attrs, js });
    return match;
  });
  for (const block of blocks) {
    const result = await esbuild.transform(block.js, { loader: "js", minify: true, target: "es2020" });
    html = html.replace(block.match, `<script${block.attrs}>${result.code.trim()}</script>`);
  }
  return html;
}

async function minifyJsDirectory(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      count += await minifyJsDirectory(entryPath);
      continue;
    }
    if (!entry.name.endsWith(".js")) continue;
    const source = await fs.readFile(entryPath, "utf8");
    const result = await esbuild.transform(source, { loader: "js", minify: true, target: "es2020" });
    await fs.writeFile(entryPath, result.code);
    count += 1;
  }
  return count;
}

if (!(await exists(indexPath))) {
  console.log("[Mahjong Release Optimize] skipped: dist/games/mahjong/index.html not found");
  process.exit(0);
}

const beforeHtml = await fileSize(indexPath);
const beforeJs = await fileSize(path.join(releaseRoot, "src/render-view.js")).catch(() => 0);
let html = await fs.readFile(indexPath, "utf8");
html = await minifyStyleBlocks(html);
html = await minifyInlineScripts(html);
html = minifyHtmlShell(html);
await fs.writeFile(indexPath, html);
const minifiedJs = await minifyJsDirectory(path.join(releaseRoot, "src"));
const afterHtml = await fileSize(indexPath);
const afterJs = await fileSize(path.join(releaseRoot, "src/render-view.js")).catch(() => 0);
console.log(`[Mahjong Release Optimize] HTML ${beforeHtml} -> ${afterHtml} bytes; JS files minified: ${minifiedJs}; render-view ${beforeJs} -> ${afterJs} bytes`);
