import { XMLParser } from 'fast-xml-parser';
const BASE='https://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2';
const CODES=['0007','0010','0005','0002','0003'];
const ROWS=1000;
const xml=new XMLParser({ignoreAttributes:false,trimValues:true});
function key(){const raw=(process.env.DATA_GO_KR_SERVICE_KEY||'').trim();if(!raw)throw new Error('DATA_GO_KR_SERVICE_KEY가 없습니다.');try{return decodeURIComponent(raw)}catch{return raw}}
function arr(v){return v==null?[]:Array.isArray(v)?v:[v]}
function num(v){const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:0}
function bodyOf(d){return d?.response?.body||d?.body||d}
function rowsOf(d){const b=bodyOf(d);return arr(b?.items?.item??b?.items??b?.item??b?.data??b?.result??b?.list??[])}
function totalOf(d){const b=bodyOf(d);return num(b?.totalCount??b?.totalCnt??b?.totCnt??b?.total)}
function parse(text,ct){const t=String(text||'').trim();if(!t)return{};if((ct||'').includes('json')||t.startsWith('{'))return JSON.parse(t);if(t.startsWith('<'))return xml.parse(t);throw new Error('온비드 응답 형식 오류')}
async function load(code){const u=new URL(BASE);for(const[k,v]of Object.entries({serviceKey:key(),pageNo:'1',numOfRows:String(ROWS),resultType:'json',prptDivCd:code,pvctTrgtYn:'N'}))u.searchParams.set(k,v);const c=new AbortController(),timer=setTimeout(()=>c.abort(),12000);try{const r=await fetch(u,{signal:c.signal,headers:{Accept:'application/json,application/xml,text/xml,*/*'}});const text=await r.text();if(!r.ok)throw new Error('HTTP '+r.status);const d=parse(text,r.headers.get('content-type')||'');return{code,rows:rowsOf(d),totalCount:totalOf(d)}}finally{clearTimeout(timer)}}
export default async function handler(req,res){try{const settled=await Promise.allSettled(CODES.map(load));const rows=[],scans=[],errors=[];settled.forEach((r,i)=>{if(r.status==='fulfilled'){rows.push(...r.value.rows);scans.push({propertyCode:CODES[i],returned:r.value.rows.length,totalCount:r.value.totalCount,complete:r.value.totalCount<=r.value.rows.length})}else errors.push({propertyCode:CODES[i],message:String(r.reason?.message||r.reason)})});res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=43200');return res.status(200).json({ok:true,version:'1.0.0',generatedAt:new Date().toISOString(),rows,scans,errors})}catch(e){res.setHeader('Cache-Control','no-store');return res.status(500).json({ok:false,error:String(e?.message||e)})}}
