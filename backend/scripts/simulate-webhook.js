// Локальный симулятор входящего вебхука Instagram.
// Бьет подписанным HMAC-запросом прямо в POST /webhook/instagram локального
// бэка — дальше идет НАСТОЯЩИЙ код: проверка подписи, парсинг, мэтчинг
// keyword, отправка DM, аналитика. Meta-кабинет не трогаем вообще.
//
// Запуск из папки backend:
//   node scripts/simulate-webhook.js --text "test"
//   node scripts/simulate-webhook.js --text "привет" --user localtest --media 123
//
// ВАЖНО: если текст совпадет с активным keyword, бэк попытается отправить
// НАСТОЯЩИЙ DM через Instagram API (токен из dev-БД). Для безопасной проверки
// матчинга без отправки используй заведомо несовпадающий текст.
// entry.id = INSTAGRAM_BUSINESS_ID: хендлер сматчит его на последнего
// залогиненного юзера (см. webhookRoutes.js handleCommentEvent).
const crypto = require('crypto');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function main() {
  const secret = process.env.INSTAGRAM_CLIENT_SECRET;
  const businessId = process.env.INSTAGRAM_BUSINESS_ID;
  if (!secret || !businessId) {
    console.error('Нужны INSTAGRAM_CLIENT_SECRET и INSTAGRAM_BUSINESS_ID в backend/.env.local');
    process.exit(1);
  }

  const text = arg('text', 'test');
  const username = arg('user', 'localtest');
  const mediaId = arg('media', '0');
  const commentId = arg('comment-id', `sim_${Date.now()}`);

  // Форма повторяет реальный payload Meta для comments (см. handleCommentEvent)
  const payload = {
    entry: [
      {
        id: String(businessId),
        changes: [
          {
            field: 'comments',
            value: {
              id: String(commentId),
              text,
              from: { id: '9999999999', username },
              media: { id: String(mediaId) },
            },
          },
        ],
      },
    ],
  };

  const rawBody = JSON.stringify(payload);
  const signature =
    'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  const url = 'http://localhost:5000/webhook/instagram';
  console.log(`POST ${url}\n  text="${text}" user="${username}" commentId=${commentId}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': signature,
    },
    body: rawBody,
  });

  console.log(`-> ${res.status} ${await res.text()}`);
  console.log('Смотри итог в консоли бэка: "No keyword match" | "Webhook DM sent" | "Webhook DM failed".');
}

main().catch((err) => {
  console.error(`Ошибка: ${err.message} (бэк запущен? http://localhost:5000/health)`);
  process.exit(1);
});
