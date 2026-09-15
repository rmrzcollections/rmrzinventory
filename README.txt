# RMRZ Inventory — Cloudflare D1 version

This package is configured for the existing Cloudflare D1 database:
- Database: rmrzinventory-db
- Binding: DB
- Database ID: 7c523387-2cbb-4a81-9840-6508d9058c27

Upload/push these files to the same Git repository used by the Cloudflare Pages project.

IMPORTANT:
1. This assumes the `products` table has columns:
   id, barcode, name, price, stock, created_at, updated_at.
2. If your existing `products` table has different columns, the API SQL must be adjusted before deployment.
3. The database itself remains on Cloudflare D1; this package only configures the binding and API.
4. After pushing to GitHub, let Cloudflare Pages deploy. Do not delete/recreate the D1 database.
5. The label print CSS is 50 mm × 30 mm and prints only the label.
