RMRZ Collections - Inventory
Restored/rebuilt interface matching the supplied original screenshot, with Cloudflare Workers + D1 connection.

Worker deploy command: npx wrangler deploy
D1 binding: DB -> rmrzinventory-db

IMPORTANT: replace the current website files in GitHub with this package as a whole.
Keep worker.js and wrangler.toml at repository root, and keep index.html/style.css/app.js inside assets/.
