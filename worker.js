function json(data, status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json;charset=UTF-8"}})}
function cors(res){const h=new Headers(res.headers);h.set("access-control-allow-origin","*");h.set("access-control-allow-methods","GET,POST,PUT,DELETE,OPTIONS");h.set("access-control-allow-headers","Content-Type");return new Response(res.body,{status:res.status,headers:h})}
async function cols(db, table){const r=await db.prepare(`PRAGMA table_info(${table})`).all();return new Set((r.results||[]).map(x=>x.name))}
async function api(request,env,url){
 if(!env.DB) return json({error:"D1 binding DB is missing."},500);
 if(request.method==='OPTIONS') return new Response(null,{status:204});
 const db=env.DB, path=url.pathname.replace(/^\/api\/?/,'').replace(/\/+$/,'');
 if(request.method==='GET' && path==='products'){
   const r=await db.prepare('SELECT id,barcode,sku,product_name,category,unit,beginning_stock,reorder_level,unit_cost,created_at,updated_at FROM products ORDER BY product_name').all();
   return json({products:r.results||[]});
 }
 if(request.method==='POST' && path==='products'){
   const b=await request.json(); if(!b.barcode||!b.product_name)return json({error:'Barcode and product name are required.'},400);
   const c=await cols(db,'products'); const vals={barcode:String(b.barcode).trim(),sku:String(b.sku||'').trim(),product_name:String(b.product_name).trim(),category:String(b.category||'').trim(),unit:String(b.unit||'pcs').trim()||'pcs',beginning_stock:Number(b.beginning_stock||0),reorder_level:Number(b.reorder_level||0),unit_cost:Number(b.unit_cost||0)};
   const now=new Date().toISOString(); vals.created_at=now; vals.updated_at=now; const f=[],v=[],q=[];
   for(const n of Object.keys(vals)){if(c.has(n)){f.push(n);v.push(vals[n]);q.push('?')}}
   const r=await db.prepare(`INSERT INTO products (${f.join(',')}) VALUES (${q.join(',')})`).bind(...v).run(); return json({ok:true,id:r.meta?.last_row_id??null},201);
 }
 const m=path.match(/^products\/(\d+)$/); if(m){const id=Number(m[1]);
   if(request.method==='GET'){const r=await db.prepare('SELECT * FROM products WHERE id=?').bind(id).first();return r?json({product:r}):json({error:'Product not found'},404)}
   if(request.method==='PUT'){
     const b=await request.json(),c=await cols(db,'products'); const vals={barcode:String(b.barcode||'').trim(),sku:String(b.sku||'').trim(),product_name:String(b.product_name||'').trim(),category:String(b.category||'').trim(),unit:String(b.unit||'pcs').trim()||'pcs',beginning_stock:Number(b.beginning_stock||0),reorder_level:Number(b.reorder_level||0),unit_cost:Number(b.unit_cost||0),updated_at:new Date().toISOString()};
     const s=[],v=[]; for(const [n,x] of Object.entries(vals)){if(c.has(n)){s.push(`${n}=?`);v.push(x)}} v.push(id); await db.prepare(`UPDATE products SET ${s.join(',')} WHERE id=?`).bind(...v).run(); return json({ok:true});
   }
 }
 if(request.method==='DELETE' && m){await db.prepare('DELETE FROM products WHERE id=?').bind(id).run();return json({ok:true})}
 if(request.method==='GET' && path==='meta'){
   const pc=await cols(db,'products'); const mc=await cols(db,'stock_movements');
   return json({products_columns:[...pc],movements_columns:[...mc]});
 }
 return json({error:'Not found'},404);
}
export default{async fetch(request,env){const url=new URL(request.url);if(url.pathname.startsWith('/api/')){try{return cors(await api(request,env,url))}catch(e){return cors(json({error:e?.message||String(e)},500))}}return env.ASSETS.fetch(request)}};
