/*
  Inyecta NG_APP_API_BASE_URL en el index.html generado en dist.
  Railway permite definir variables de entorno en el sitio estático
  durante el build; este script las inserta en el HTML final.
*/
const fs = require('fs');
const path = require('path');

const apiBase = process.env.NG_APP_API_BASE_URL || '';
const fallback = 'http://localhost:8000/api/v1';

const candidates = [
  path.join(__dirname, '..', 'dist', 'turnoplus', 'browser', 'index.html'),
  path.join(__dirname, '..', 'dist', 'turnoplus', 'index.html'),
];

let replaced = false;

for (const indexPath of candidates) {
  if (!fs.existsSync(indexPath)) continue;
  let html = fs.readFileSync(indexPath, 'utf8');
  const value = apiBase || fallback;
  if (html.includes('%NG_APP_API_BASE_URL%')) {
    html = html.split('%NG_APP_API_BASE_URL%').join(value);
  }
  // También intenta actualizar si ya existe una meta previa con otro valor
  html = html.replace(
    /(<meta\s+name=["']api-base-url["']\s+content=["']).*?(["']\s*\/?>)/i,
    `$1${value}$2`
  );
  fs.writeFileSync(indexPath, html);
  console.log(`inject-api-base-url: actualizado ${indexPath} -> ${value}`);
  replaced = true;
}

if (!replaced) {
  console.warn('inject-api-base-url: No se encontró index.html en dist.');
}

