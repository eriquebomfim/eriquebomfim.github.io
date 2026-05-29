/**
 * mhtml2html.js
 * Converte eMesas.mhtml → eMesas.html (standalone, pronto para servidor HTTP)
 * Uso: node mhtml2html.js
 */

const fs   = require("fs");
const path = require("path");

const INPUT  = path.join(__dirname, "eMesas.mhtml");
const OUTPUT = path.join(__dirname, "eMesas.html");

// ── 1. Ler arquivo ────────────────────────────────────────────────────────────
const raw = fs.readFileSync(INPUT, "utf8");

// ── 2. Extrair boundary ───────────────────────────────────────────────────────
const boundaryMatch = raw.match(/boundary="([^"]+)"/);
if (!boundaryMatch) throw new Error("Boundary MIME não encontrado");
const boundary = boundaryMatch[1];

// ── 3. Dividir em partes ──────────────────────────────────────────────────────
const delimiter = "--" + boundary;
const parts = raw.split(delimiter).slice(1); // descarta cabeçalho MHTML

// ── 4. Parser de parte MIME ───────────────────────────────────────────────────
function parsePart(part) {
  // Separa cabeçalhos do corpo (linha em branco como divisor)
  const sep = part.indexOf("\r\n\r\n") !== -1 ? "\r\n\r\n" : "\n\n";
  const sepIdx = part.indexOf(sep);
  if (sepIdx === -1) return null;

  const headerBlock = part.slice(0, sepIdx);
  const body        = part.slice(sepIdx + sep.length);

  const headers = {};
  for (const line of headerBlock.split(/\r?\n/)) {
    const m = line.match(/^([\w-]+):\s*(.+)/i);
    if (m) headers[m[1].toLowerCase()] = m[2].trim();
  }

  return { headers, body };
}

// ── 5. Decodificar quoted-printable ───────────────────────────────────────────
function decodeQP(str) {
  return str
    .replace(/=\r?\n/g, "")           // soft line break
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// ── 6. Processar partes ───────────────────────────────────────────────────────
const assets = {}; // location → decoded text
let htmlContent = null;

for (const rawPart of parts) {
  if (rawPart.trim() === "" || rawPart.trim() === "--") continue;
  const p = parsePart(rawPart);
  if (!p) continue;

  const ct       = (p.headers["content-type"]     || "").split(";")[0].trim();
  const enc      = (p.headers["content-transfer-encoding"] || "").toLowerCase();
  const location = (p.headers["content-location"] || p.headers["content-id"] || "").replace(/[<>]/g, "");

  const body = enc === "quoted-printable" ? decodeQP(p.body) : p.body;

  if (ct === "text/html") {
    htmlContent = body;
  } else if (ct === "text/css") {
    assets[location] = body;
  }
}

if (!htmlContent) throw new Error("Parte HTML não encontrada no MHTML");

// ── 7. Inlinar CSS ────────────────────────────────────────────────────────────
// Substitui cada <link rel="stylesheet" href="..."> pelo conteúdo <style>
let html = htmlContent;

html = html.replace(/<link\s[^>]*rel=["']stylesheet["'][^>]*>/gi, (tag) => {
  const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
  if (!hrefMatch) return tag;

  const href = hrefMatch[1];

  // Procura o asset por correspondência exata ou por sufixo de URL
  let css = assets[href];
  if (!css) {
    const found = Object.keys(assets).find(k => k.includes(href) || href.includes(k.replace(/.*\//, "")));
    if (found) css = assets[found];
  }

  if (!css) return tag; // mantém o link se não encontrar (CDN externo)

  return `<style>\n${css.trim()}\n</style>`;
});

// ── 8. Remover chave da URL da página (snapshot) ─────────────────────────────
// A chave estava na URL de snapshot; o HTML gerado é servido localmente,
// portanto não carrega dados ao vivo — mantém o snapshot como está.

// ── 9. Escrever arquivo ───────────────────────────────────────────────────────
fs.writeFileSync(OUTPUT, html, "utf8");
console.log(`✓ Gerado: ${OUTPUT}`);
