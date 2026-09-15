RMRZ Inventory restored-style package for Cloudflare Workers + D1.

This package recreates the original dashboard layout from the saved reference and keeps the working D1 binding:
DB -> rmrzinventory-db

Worker entry point: worker.js
Assets directory: ./assets
Deploy command: npx wrangler deploy

The products API is wired to the verified products schema. Stock movement history/sales writing is intentionally not guessed because the stock_movements column schema has not yet been verified.
