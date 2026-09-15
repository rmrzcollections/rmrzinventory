function json(data, status=200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"content-type":"application/json;charset=UTF-8"}
  });
}

function withCors(res) {
  const h = new Headers(res.headers);
  h.set("access-control-allow-origin", "*");
  h.set("access-control-allow-methods", "GET,POST,PUT,DELETE,OPTIONS");
  h.set("access-control-allow-headers", "Content-Type");
  return new Response(res.body, {status: res.status, headers: h});
}

async function getCols(db) {
  const result = await db.prepare("PRAGMA table_info(products)").all();
  return new Set((result.results || []).map(x => x.name));
}

async function handleApi(request, env, url) {
  if (!env.DB) return json({error:"D1 binding DB is missing."}, 500);
  if (request.method === "OPTIONS") return new Response(null, {status:204});

  const db = env.DB;
  const path = url.pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");

  if (request.method === "GET" && path === "products") {
    const { results } = await db.prepare("SELECT * FROM products ORDER BY product_name").all();
    return json({ products: results || [] });
  }

  if (request.method === "POST" && path === "products") {
    const body = await request.json();
    if (!body.barcode || !(body.product_name || body.name)) {
      return json({error:"Barcode and product name are required."}, 400);
    }

    const cols = await getCols(db);
    const fields = [];
    const values = [];
    const placeholders = [];
    const add = (name, value) => {
      if (cols.has(name)) {
        fields.push(name);
        values.push(value);
        placeholders.push("?");
      }
    };

    add("barcode", String(body.barcode).trim());
    add("product_name", String(b.product_name || b.name || "").trim());
    add("price", Number(body.price || 0));
    add("stock", Number(body.stock || 0));

    const now = new Date().toISOString();
    add("created_at", now);
    add("updated_at", now);

    if (!fields.length) {
      return json({error:"The products table schema is not recognized."}, 500);
    }

    const result = await db
      .prepare(`INSERT INTO products (${fields.join(",")}) VALUES (${placeholders.join(",")})`)
      .bind(...values)
      .run();

    return json({ok:true, id:result.meta?.last_row_id ?? null}, 201);
  }

  const match = path.match(/^products\/(\d+)$/);
  if (match) {
    const id = Number(match[1]);

    if (request.method === "PUT") {
      const body = await request.json();
      const cols = await getCols(db);
      const sets = [];
      const values = [];
      const set = (name, value) => {
        if (cols.has(name)) {
          sets.push(`${name}=?`);
          values.push(value);
        }
      };

      set("barcode", String(body.barcode ?? "").trim());
      set("product_name", String(b.product_name ?? b.name ?? "").trim());
      set("price", Number(body.price || 0));
      set("stock", Number(body.stock || 0));
      set("updated_at", new Date().toISOString());
      values.push(id);

      await db.prepare(`UPDATE products SET ${sets.join(",")} WHERE id=?`).bind(...values).run();
      return json({ok:true});
    }

    if (request.method === "DELETE") {
      await db.prepare("DELETE FROM products WHERE id=?").bind(id).run();
      return json({ok:true});
    }
  }

  return json({error:"Not found"}, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        return withCors(await handleApi(request, env, url));
      } catch (error) {
        return withCors(json({error:error?.message || String(error)}, 500));
      }
    }

    return env.ASSETS.fetch(request);
  }
};
