export function update(rows,{id,expectedVersion,patch}) {
  for(const [key,value] of Object.entries(patch))if(!['name','description'].includes(key)||typeof value!=='string')throw new TypeError('Invalid patch');
  const old=rows.find(x=>x.id===id);
  if(!old)return {status:'missing',rows};
  if(old.version!==expectedVersion)return {status:'conflict',rows};
  return {status:'updated',rows:rows.map(x=>x.id===id?{...x,...patch,version:x.version+1}:x)};
}
