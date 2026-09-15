function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json;charset=UTF-8"}})}
function withCors(res){const h=new Headers(res.headers);h.set("access-control-allow-origin","*");h.set("access-control-allow-methods","GET,POST,PUT,DELETE,OPTIONS");h.set("access-control-allow-headers","Content-Type");return new Response(res.body,{status:res.status,headers:h})}
async function cols(db){const {results}=await db.prepare("PRAGMA table_info(products)").all();return new Set((results||[]).map(x=>x.name))}
async function api(request,env,url){
 const db=env.DB;if(!db)return json({error:"D1 binding DB is missing."},500);
 if(request.method==="OPTIONS")return new Response(null,{status:204});
 const path=url.pathname.replace(/^\/api\/?/,"").replace(/\/+$/,"");
 if(request.method==="GET"&&path==="products"){const {results}=await db.prepare("SELECT * FROM products ORDER BY name").all();return json({products:results||[]})}
 if(request.method==="POST"&&path==="products"){
  const b=await request.json();if(!b.barcode||!b.name)return json({error:"Barcode and product name are required."},400);
  const c=await cols(db),f=[],v=[],q=[];const add=(n,x)=>{if(c.has(n)){f.push(n);v.push(x);q.push("?")}};
  add("barcode",String(b.barcode).trim());add("name",String(b.name).trim());add("price",Number(b.price||0));add("stock",Number(b.stock||0));
  const now=new Date().toISOString();add("created_at",now);add("updated_at",now);
  const r=await db.prepare(`INSERT INTO products (${f.join(",")}) VALUES (${q.join(",")})`).bind(...v).run();
  return json({ok:true,id:r.meta?.last_row_id??null},201)
 }
 const m=path.match(/^products\/(\d+)$/);
 if(m){const id=Number(m[1]);
  if(request.method==="PUT"){const b=await request.json(),c=await cols(db),s=[],v=[],set=(n,x)=>{if(c.has(n)){s.push(`${n}=?`);v.push(x)}};
   set("barcode",String(b.barcode??"").trim());set("name",String(b.name??"").trim());set("price",Number(b.price||0));set("stock",Number(b.stock||0));set("updated_at",new Date().toISOString());v.push(id);
   await db.prepare(`UPDATE products SET ${s.join(",")} WHERE id=?`).bind(...v).run();return json({ok:true})}
  if(request.method==="DELETE"){await db.prepare("DELETE FROM products WHERE id=?").bind(id).run();return json({ok:true})}
 }
 return json({error:"Not found"},404)
}
export default{async fetch(request,env){const url=new URL(request.url);if(url.pathname.startsWith("/api/")){try{return withCors(await api(request,env,url))}catch(e){return withCors(json({error:e?.message||String(e)},500))}}return env.ASSETS.fetch(request)};