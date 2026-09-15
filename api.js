function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json;charset=UTF-8"}})}
function envDB(env){if(!env.DB)throw new Error("D1 binding DB is missing. Redeploy after adding the binding.");return env.DB}
export async function onRequest(context){
  const {request,env,params}=context; const db=envDB(env); const path=(params.path||[]).join('/');
  try{
    if(request.method==='GET'&&path==='products'){
      const {results}=await db.prepare('SELECT id, barcode, name, price, stock, created_at, updated_at FROM products ORDER BY name').all();
      return json({products:results});
    }
    if(request.method==='POST'&&path==='products'){
      const b=await request.json();
      if(!b.barcode||!b.name)return json({error:'Barcode and product name are required.'},400);
      const now=new Date().toISOString();
      const r=await db.prepare('INSERT INTO products (barcode,name,price,stock,created_at,updated_at) VALUES (?,?,?,?,?,?)').bind(String(b.barcode),String(b.name),Number(b.price||0),Number(b.stock||0),now,now).run();
      return json({ok:true,id:r.meta.last_row_id},201);
    }
    const m=path.match(/^products\/(\d+)$/); if(m){
      const id=Number(m[1]);
      if(request.method==='PUT'){const b=await request.json();const now=new Date().toISOString();await db.prepare('UPDATE products SET barcode=?,name=?,price=?,stock=?,updated_at=? WHERE id=?').bind(String(b.barcode),String(b.name),Number(b.price||0),Number(b.stock||0),now,id).run();return json({ok:true})}
      if(request.method==='DELETE'){await db.prepare('DELETE FROM products WHERE id=?').bind(id).run();return json({ok:true})}
    }
    return json({error:'Not found'},404);
  }catch(e){return json({error:e.message||String(e)},500)}
}