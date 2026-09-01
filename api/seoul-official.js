import projectsPayload from '../data/projects.json' with { type: 'json' };
const PROJECTS=projectsPayload.projects||[];
const CLEANUP={
  mia258:'https://cleanup.seoul.go.kr/cafe/mastr-cleanup-bsnsSumry/execute.do?cafeId=305900001243V01&div=sumry&stepSeCode=101',
  sindang10:'https://cleanup.seoul.go.kr/assc/scrin-bbs/execute.do?cafeId=140900000749O48'
};
function stripHtml(s){return String(s||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim()}
function num(v){const n=Number(String(v||'').replace(/,/g,''));return Number.isFinite(n)?n:null}
function match1(text,res){for(const re of res){const m=text.match(re);if(m)return m}return null}
function normalizeDate(v){return String(v||'').replace(/년|월/g,'-').replace(/일/g,'').replace(/[.\s]+/g,'-').replace(/-+/g,'-').replace(/-$/,'')}
function parseOfficial(text){
  const out={};
  let m=match1(text,[/정비구역\s*면적\s*\(?㎡\)?\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i,/사업지\s*면적[^\d]{0,20}([\d,]+(?:\.\d+)?)\s*㎡/i,/구역\s*면적[^\d]{0,20}([\d,]+(?:\.\d+)?)\s*㎡/i]);if(m)out.areaSqm=num(m[1]);
  m=match1(text,[/계획\s*세대수[^\d]{0,20}([\d,]+)\s*세대/i,/총\s*([\d,]+)\s*세대/i,/([\d,]+)\s*세대\s*(?:공급|조성|건립)/i]);if(m)out.units=num(m[1]);
  m=match1(text,[/권리산정기준일[^0-9]{0,20}(20\d{2}[.\-년\s]+\d{1,2}[.\-월\s]+\d{1,2})/i]);if(m)out.rightsDate=normalizeDate(m[1]);
  m=match1(text,[/정비구역\s*지정(?:일)?[^0-9]{0,30}(20\d{2}[.\-년\s]+\d{1,2}[.\-월\s]+\d{1,2})/i]);if(m)out.designationDate=normalizeDate(m[1]);
  return out;
}
async function fetchOfficial(url){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);try{const r=await fetch(url,{signal:ctrl.signal,headers:{'User-Agent':'SeoulRedevelopmentPocket/7.4','Accept':'text/html,*/*'}});const raw=await r.text();if(!r.ok)throw new Error(`HTTP ${r.status}`);return stripHtml(raw)}finally{clearTimeout(timer)}}
export default async function handler(req,res){
  const id=String(req.query.id||'');const p=PROJECTS.find(x=>x.id===id);if(!p)return res.status(404).json({ok:false,error:'사업지를 찾을 수 없습니다.'});
  const sources=[];if(CLEANUP[id])sources.push({type:'정비사업 정보몽땅',url:CLEANUP[id]});if(p.sourceUrl)sources.push({type:'서울시 공식자료',url:p.sourceUrl});
  const merged={},results=[];
  for(const s of sources){try{const text=await fetchOfficial(s.url);const parsed=parseOfficial(text);Object.entries(parsed).forEach(([k,v])=>{if(merged[k]==null&&v!=null)merged[k]=v});results.push({...s,ok:true,parsed})}catch(e){results.push({...s,ok:false,error:String(e?.message||e)})}}
  return res.status(200).json({ok:true,version:'7.4.1',project:{id:p.id,name:p.name,district:p.district,dong:p.dong},official:merged,sources:results,note:'공식 페이지에서 항목명이 함께 확인되는 값만 보강합니다. 추정은 하지 않습니다.',generatedAt:new Date().toISOString()});
}
