import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(rootDir, 'dist');

const META_LINE = /^\/\/\s*@(\w+)\s+(.*)$/;

async function loadBookmarklets() {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const jsFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => entry.name)
    .sort();

  const bookmarklets = [];
  for (const fileName of jsFiles) {
    const raw = await readFile(path.join(rootDir, fileName), 'utf8');
    bookmarklets.push(parseBookmarklet(fileName, raw));
  }
  return bookmarklets;
}

function parseBookmarklet(fileName, raw) {
  const lines = raw.split(/\r?\n/);
  const meta = {};
  let i = 0;
  while (i < lines.length) {
    const match = META_LINE.exec(lines[i]);
    if (!match) break;
    meta[match[1]] = match[2].trim();
    i++;
  }

  const code = lines
    .slice(i)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' ');

  return {
    file: fileName,
    name: meta.name || fileName.replace(/\.js$/, ''),
    description: meta.description || '',
    version: meta.version || '',
    author: meta.author || '',
    updated: meta.updated || '',
    href: 'javascript:' + encodeURIComponent(code),
  };
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderCard(bookmarklet) {
  const metaParts = [];
  if (bookmarklet.version) metaParts.push(`バージョン ${escapeHtml(bookmarklet.version)}`);
  if (bookmarklet.updated) metaParts.push(`更新日 ${escapeHtml(bookmarklet.updated)}`);
  const metaLine = metaParts.length
    ? `<p class="card__meta">${metaParts.join(' ・ ')}</p>`
    : '';

  return `
      <article class="card">
        <h2 class="card__name">${escapeHtml(bookmarklet.name)}</h2>
        <p class="card__description">${escapeHtml(bookmarklet.description)}</p>
        ${metaLine}
        <div class="card__actions">
          <a class="drag-link" href="${bookmarklet.href}" data-code="${bookmarklet.href}">
            ${escapeHtml(bookmarklet.name)}
          </a>
          <button type="button" class="copy-button" data-code="${bookmarklet.href}">
            コードをコピー
          </button>
        </div>
        <p class="card__status" role="status" aria-live="polite"></p>
        <p class="card__source"><a href="./${encodeURIComponent(bookmarklet.file)}">ソースを見る</a></p>
      </article>`;
}

function renderPage(bookmarklets) {
  const cards = bookmarklets.map(renderCard).join('\n');
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>My Bookmarklets</title>
<style>
  :root {
    --bg: #fafafa;
    --fg: #1a1a1a;
    --fg-muted: #4b4b4b;
    --card-bg: #ffffff;
    --card-border: #767676;
    --link: #0645ad;
    --link-visited: #551a8b;
    --button-bg: #f0f0f0;
    --button-border: #4b4b4b;
    --focus-ring: #0645ad;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #18181b;
      --fg: #f2f2f2;
      --fg-muted: #c9c9c9;
      --card-bg: #232326;
      --card-border: #8a8a92;
      --link: #8ab4ff;
      --link-visited: #c9a4ff;
      --button-bg: #2c2c30;
      --button-border: #9a9aa2;
      --focus-ring: #8ab4ff;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 2rem 1rem 4rem;
    background: var(--bg);
    color: var(--fg);
    font-family: sans-serif;
    font-size: 16px;
    line-height: 1.7;
  }
  main {
    max-width: 40rem;
    margin: 0 auto;
  }
  h1 {
    font-size: 1.75rem;
  }
  .intro {
    color: var(--fg-muted);
  }
  .intro-note {
    border: 1px solid var(--card-border);
    border-radius: 0.5rem;
    padding: 1rem;
    background: var(--card-bg);
  }
  .card-list {
    list-style: none;
    margin: 2rem 0 0;
    padding: 0;
    display: grid;
    gap: 1.5rem;
  }
  .card {
    border: 1px solid var(--card-border);
    border-radius: 0.5rem;
    padding: 1.25rem;
    background: var(--card-bg);
  }
  .card__name {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
  }
  .card__description {
    margin: 0 0 0.5rem;
  }
  .card__meta {
    margin: 0 0 1rem;
    font-size: 0.9rem;
    color: var(--fg-muted);
  }
  .card__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }
  .drag-link {
    display: inline-block;
    padding: 0.5rem 1rem;
    border: 1px solid var(--button-border);
    border-radius: 0.375rem;
    background: var(--button-bg);
    color: var(--link);
    text-decoration: underline;
    font-weight: bold;
    cursor: grab;
  }
  .drag-link:hover, .drag-link:focus-visible {
    text-decoration: underline;
    text-decoration-thickness: 2px;
  }
  .drag-link:visited {
    color: var(--link-visited);
  }
  .copy-button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--button-border);
    border-radius: 0.375rem;
    background: var(--button-bg);
    color: var(--fg);
    font: inherit;
    cursor: pointer;
  }
  a:focus-visible, button:focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 2px;
  }
  .card__status {
    min-height: 1.5em;
    margin: 0.75rem 0 0;
    font-size: 0.9rem;
  }
  .card__source {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
  }
  footer {
    max-width: 40rem;
    margin: 3rem auto 0;
    color: var(--fg-muted);
    font-size: 0.9rem;
  }
  footer a {
    color: var(--link);
  }
</style>
</head>
<body>
<main>
  <h1>My Bookmarklets</h1>
  <p class="intro">個人的なブックマークレット集です。誰かの役に立つかもしれないということで公開しています。</p>
  <p class="intro-note">
    各ブックマークレット名のリンクをブラウザのブックマークバーへ<strong>ドラッグ&amp;ドロップ</strong>すると登録できます。
    ドラッグができない場合は「コードをコピー」ボタンでコードをコピーし、ブックマークの登録画面でURLとして貼り付けてください。
  </p>
  <ul class="card-list">
${cards}
  </ul>
</main>
<footer>
  <p><a href="https://github.com/securecat/my-bookmarklets">GitHub リポジトリを見る</a></p>
</footer>
<script>
(function () {
  document.querySelectorAll('.drag-link').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      alert('このリンクはブックマークバーへドラッグして登録してください。クリックでは実行されません。');
    });
  });

  document.querySelectorAll('.copy-button').forEach(function (button) {
    button.addEventListener('click', function () {
      var code = button.getAttribute('data-code');
      var status = button.closest('.card').querySelector('.card__status');
      navigator.clipboard.writeText(code).then(function () {
        status.textContent = 'コードをコピーしました。';
      }, function () {
        status.textContent = 'コピーに失敗しました。手動で選択してコピーしてください。';
      });
    });
  });
})();
</script>
</body>
</html>
`;
}

async function main() {
  const bookmarklets = await loadBookmarklets();
  const html = renderPage(bookmarklets);
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'index.html'), html, 'utf8');

  for (const bookmarklet of bookmarklets) {
    const src = await readFile(path.join(rootDir, bookmarklet.file), 'utf8');
    await writeFile(path.join(outDir, bookmarklet.file), src, 'utf8');
  }

  console.log(`Built dist/index.html with ${bookmarklets.length} bookmarklet(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
