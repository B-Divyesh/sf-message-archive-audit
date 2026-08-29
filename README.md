# Archive Audit

Archive Audit checks email exports before account or device access ends. It is for people who need a clear record of saved messages and attachments.

It reads EML message files and MBOX email collections in the browser. It counts messages and checks named attachment files. It hashes readable attachments as file hashes (SHA-256). It exports HTML, CSV, and JSON receipts. Messages without attachments remain in every receipt.

Message and attachment bytes stay on the device. A real audit stores a local audit summary in browser storage (IndexedDB). That summary survives reload until cleared. The complete audit and every receipt format are free and need no account. The installed app works offline after the first visit.

## Try the isolated demo

Open `/?demo=1`, `/demo`, or choose “Try it with sample data.” The sample contains two EML message files and one MBOX email collection. Demo state stays in memory and never reads or writes the real audit database.

## Run and verify

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
```

`npm run build` writes the static deployment to `dist/`. The browser suite uses Playwright 1.58.2 and validates each listed claim in `.factory/claims.json`.

## Limits

Archive Audit does not decrypt mail, recover missing messages, contact providers, or read proprietary message databases. A receipt inventories selected files; it does not certify that a provider supplied every message.

See [Privacy](public/privacy/index.html) and [Terms](public/terms/index.html). The project is available under the [MIT License](LICENSE).

## Deploy

Deploy `dist/` as a static site. Keep `staticwebapp.config.json` at the deployment root so routes, security headers, and cache policies apply. HTTPS is required for service workers.
