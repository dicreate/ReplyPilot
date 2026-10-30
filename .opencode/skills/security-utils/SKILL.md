---
name: security-utils
description: Crypto, hashing and ids with crypto-js 4.1 and uuid 10. Use when hashing, checksumming, generating ids, signing download links, or guarding property access. Frontend crypto is integrity/UX only, never access control.
---

# Security Utils (pinned: crypto-js@4.1, uuid@10)

Offline-first. Rule #0: browser crypto never replaces server auth/validation.

## 1. Hashing (crypto-js)

```ts
import MD5 from 'crypto-js/md5'
import SHA256 from 'crypto-js/sha256'

const salt = import.meta.env.VITE_MD5_SALT // salt from env, never hardcoded
const checksum = MD5(fileText + salt).toString()
const digest = SHA256(JSON.stringify(payload)).toString()
```

Import per-algorithm (`crypto-js/md5`), never whole `crypto-js` (bundle). MD5 only for legacy checksums/dedup keys per `VITE_MD5_SALT`; new integrity → SHA256. Compare hashes in constant style (string compare of hex is fine here; real secrets never in frontend).

## 2. UUIDs (uuid@10)

```ts
import { v4 as uuidv4 } from 'uuid'

const clientKey = uuidv4() // idempotency key, temp row id, trace id
```

`v4` for client keys/dedup; never invent `Math.random()` ids. Persist idempotency keys with the mutation payload so retries reuse them.

## 3. Safe property checks (нативный ES2022)

```ts
// Object.hasOwn() — нативный, прототип-безопасный (ES2022)
if (Object.hasOwn(obj, 'automations')) {
  /* own property, prototype-safe */
}

// НЕ используй: obj.hasOwnProperty (перезаписываемый)
// НЕ используй: 'key' in obj (включает прототип)
```

`Object.hasOwn()` доступен во всех современных браузерах и Node 16+. Пакет `has` не нужен.

## 4. Env + secrets discipline

- `VITE_*` vars ship to the browser — public by definition. Tokens/keys requiring secrecy stay server-side.
- Auth tokens: memory + httpOnly refresh pattern; never log tokens, never put in URLs (except short-lived signed download links verified server-side).
- Sanitize anything rendered from Excel/JSON imports (no `dangerouslySetInnerHTML` without sanitizer).

## Checklist

- [ ] Per-algorithm crypto-js imports; salt from env.
- [ ] uuid v4 for client keys, no Math.random ids.
- [ ] `Object.hasOwn()` вместо `hasOwnProperty` или `has` пакета.
- [ ] No secrets in VITE_* or URLs; imports sanitized.
