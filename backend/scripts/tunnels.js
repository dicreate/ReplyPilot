// Поднимает два quick-туннеля cloudflared (backend + frontend),
// вылавливает их https-URL из вывода и пишет в tunnel-urls.json.
//
// Запуск из папки backend:
//   npm run tunnels
// Остановка: Ctrl+C (оба туннеля гасятся).
//
// Порты: BACKEND_PORT (по умолч. 5000) и FRONTEND_PORT (по умолч. 5173).
// Важно: quick-туннели выдают НОВЫЙ URL при каждом запуске —
// скрипт патчит только ЛОКАЛЬНЫЕ файлы (backend/.env.local, frontend/.env.local),
// продовые backend/.env и frontend/.env он НЕ трогает.
// После рестарта: в Meta секции 4 добавь новый URL туннеля вторым
// (секцию 3 - webhook - НЕ трогай, она смотрит на Render).
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKEND_PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 5173;
const OUT_FILE = path.join(__dirname, '..', 'tunnel-urls.json');
const URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;
const CAPTURE_TIMEOUT_MS = 60000;

const state = { backend: null, frontend: null };
const children = [];
let exiting = false;

function buildData() {
  return {
    updatedAt: new Date().toISOString(),
    backendTunnel: state.backend,
    frontendTunnel: state.frontend,
    // Готовые значения для вставки в настройки Meta:
    webhookCallbackUrl: state.backend ? `${state.backend}/webhook/instagram` : null, // секция 3
    oauthRedirectUri: state.frontend ? `${state.frontend}/auth/instagram/callback` : null, // секция 4
  };
}

function save() {
  fs.writeFileSync(OUT_FILE, JSON.stringify(buildData(), null, 2) + '\n');
}

// Патчит только ЛОКАЛЬНЫЕ файлы под свежие URL туннелей:
// backend/.env.local (INSTAGRAM_REDIRECT_URI), frontend/.env.local
// (VITE_INSTAGRAM_REDIRECT_URI), backend/app.js (FRONTEND_TUNNEL_URL для CORS).
// Продовые backend/.env и frontend/.env не трогаем — реальные прод-значения
// живут в Render/Vercel Dashboard и в деплой эти файлы не едут (git-ignored).
// Настройки Meta скрипт тронуть не может — секцию 4 обновляешь руками
// (добавляешь новый URL туннеля вторым, продовый Vercel-URL не удаляешь).
function patchLocalFiles() {
  const d = buildData();
  if (!d.frontendTunnel) return;

  const patches = [
    {
      file: path.join(__dirname, '..', '.env.local'),
      regex: /^INSTAGRAM_REDIRECT_URI=.*$/m,
      replacement: `INSTAGRAM_REDIRECT_URI=${d.oauthRedirectUri}`,
      label: 'backend/.env.local INSTAGRAM_REDIRECT_URI',
    },
    {
      file: path.join(__dirname, '..', '..', 'frontend', '.env.local'),
      regex: /^VITE_INSTAGRAM_REDIRECT_URI=.*$/m,
      replacement: `VITE_INSTAGRAM_REDIRECT_URI=${d.oauthRedirectUri}`,
      label: 'frontend/.env.local VITE_INSTAGRAM_REDIRECT_URI',
    },
    {
      file: path.join(__dirname, '..', 'app.js'),
      regex: /const FRONTEND_TUNNEL_URL = ".*";/,
      replacement: `const FRONTEND_TUNNEL_URL = "${d.frontendTunnel}";`,
      label: 'backend/app.js FRONTEND_TUNNEL_URL',
    },
  ];

  for (const p of patches) {
    try {
      if (!fs.existsSync(p.file)) {
        console.log(`[tunnels] пропущен ${p.label}: файл не найден`);
        continue;
      }
      const content = fs.readFileSync(p.file, 'utf8');
      if (!p.regex.test(content)) {
        console.log(`[tunnels] пропущен ${p.label}: строка не найдена`);
        continue;
      }
      fs.writeFileSync(p.file, content.replace(p.regex, p.replacement));
      console.log(`[tunnels] обновлен ${p.label}`);
    } catch (err) {
      console.log(`[tunnels] не смог обновить ${p.label}: ${err.message}`);
    }
  }
  console.log('[tunnels] НЕ ЗАБУДЬ: перезапусти backend и фронт (они читают .env.local при старте),');
  console.log('[tunnels] а в Meta в секции 4 добавь новый URL вторым (продовый не удаляй). Секцию 3 не трогай.');
}

function printBlock() {
  const d = buildData();
  console.log('\n================ TUNNEL URLS ================');
  console.log(`Backend tunnel : ${d.backendTunnel || '(ждём...)'}`);
  console.log(`Frontend tunnel: ${d.frontendTunnel || '(ждём...)'}`);
  if (d.webhookCallbackUrl) console.log(`\nСекция 3 (Webhooks URL):\n  ${d.webhookCallbackUrl}`);
  if (d.oauthRedirectUri) console.log(`\nСекция 4 (URL переадресации):\n  ${d.oauthRedirectUri}`);
  console.log(`\nЛокальные файлы (.env.local, CORS) пропатчены скриптом сам. Прод (.env, Render, Vercel) не тронут.`);
  console.log(`В Meta секцию 4 дополни руками (секцию 3 не трогай).`);
  console.log(`Файл: ${OUT_FILE}`);
  console.log('=============================================\n');
}

function shutdown(code = 0) {
  if (exiting) return;
  exiting = true;
  for (const c of children) {
    try { c.kill(); } catch (_) { /* ignore */ }
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

function startTunnel(name, port) {
  console.log(`[tunnels] поднимаю ${name} -> http://localhost:${port} ...`);
  const child = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], {
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(child);

  child.on('error', (err) => {
    console.error(`\n[tunnels] НЕ УДАЛОСЬ запустить cloudflared для ${name}: ${err.message}`);
    console.error('[tunnels] Проверь, что cloudflared установлен и виден в PATH: cloudflared --version');
    shutdown(1);
  });

  const onData = (chunk) => {
    const text = chunk.toString();
    if (!state[name]) {
      const m = text.match(URL_RE);
      if (m) {
        state[name] = m[0];
        console.log(`[tunnels] ${name}: ${m[0]}`);
        save();
        patchLocalFiles();
        printBlock();
      }
    }
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);

  child.on('exit', (code) => {
    if (!exiting && !state[name]) {
      console.error(`\n[tunnels] cloudflared для ${name} завершился (код ${code}) до выдачи URL.`);
      shutdown(1);
    } else if (!exiting) {
      console.error(`\n[tunnels] туннель ${name} упал (код ${code}). Перезапусти скрипт.`);
      shutdown(1);
    }
  });

  setTimeout(() => {
    if (!state[name] && !exiting) {
      console.error(`\n[tunnels] ${name}: URL не получен за ${CAPTURE_TIMEOUT_MS / 1000}с. Проверь интернет и вывод cloudflared выше.`);
    }
  }, CAPTURE_TIMEOUT_MS);
}

save(); // начальный файл (значения null, пока URL не пойманы)
startTunnel('backend', BACKEND_PORT);
startTunnel('frontend', FRONTEND_PORT);
