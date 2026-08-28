# Archive Audit

Archive Audit is an offline-first inspector for people preserving message exports before an account or device disappears. It opens standard MIME `.eml` and text `.mbox` files in the browser, inventories messages, hashes readable embedded attachments, identifies named attachment references that are missing from a supplied folder, and creates portable HTML, CSV and JSON receipts.

Nothing in the archive is uploaded. Archive reports may be retained in browser IndexedDB until cleared; source message bytes are not retained by the app.

## Use it

1. Export mail from the provider using its normal export tool.
2. Select one or more `.eml` / `.mbox` files. Optionally select the exported attachment folder.
3. Review the ledger and any missing references.
4. Save the HTML receipt (or CSV/JSON) alongside the original export.

The parser supports standard MIME email and text MBOX. It does not decrypt, recover, export, access providers, or inspect proprietary message databases.

## Run and verify

```sh
npm install
npm run dev
npm test
npm run build
```

`npm run build` writes the static deploy artifact to `dist/`, with `index.html` at its root. For an additional browser smoke test, run `npm run test:e2e` after `npm run build`.

The optional one-time upgrade uses Sociobot’s hosted license checkout; it never handles payment card data in the app. See [Privacy](public/privacy/index.html) and [Terms](public/terms/index.html).

## Deployment

Deploy the contents of `dist/` as a static site. The included service worker pre-caches the app shell for offline use. HTTPS is required for service worker registration in production.
