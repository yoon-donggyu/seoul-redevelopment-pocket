import { XMLParser } from 'fast-xml-parser';
import projectsPayload from '../data/projects.json' with { type: 'json' };

const PROJECTS=projectsPayload.projects||[];
const BASE='https://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2';
const CODES=['0007','0010','0005','0002','0003'];
const ROWS=1000;
const CACHE='public, s-maxage=86400, stale-while-revalidate=86400';
const GAP_MS=850;
const xml=new XMLParser({ignoreAttributes:false,trimValues:true});

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function key(){const raw=(process.env.DATA_GO_KR_SERVICE_KEY||'').trim();if(!raw)throw new Error('Vercel 환경변수 DATA_GO_KR_SERVICE_KEY가 없습니다.');try{return decodeURIComponent(raw)}catch{return raw}}
function arr(v){return v==null?[]:Array.isArray(v)?v:[v]}
function num(v){const raw=String(v??'').trim();if(!raw)return null;const c=raw.replace(/,/g,'').replace(/[^\d.-]/g,'');if(!c||c==='-'||c==='.')return null;const n=Number(c);return Number.isFinite(n)?n:null}
function pickCI(obj,keys){const m={};for(const[k,v]of Object.entries(obj||{}))m[String(k).toLowerCase()]=v;for(const k of keys){const v=m[String(k).toLowerCase()];if(v!=null&&String(v).trim()!=='')return String(v).trim()}return''}
function numCI(obj,keys){return num(pickCI(obj,keys))}
function projectById(id){return PROJECTS.find(p=>p.id===id)}
function bodyOf(data){return data?.response?.body||data?.body||data}
function rowsOf(data){const b=bodyOf(data);return arr(b?.items?.item??b?.items??b?.item??b?.data??b?.result??b?.list??[])}
function totalOf(data){const b=bodyOf(data);return num(b?.totalCount??b?.totalCnt??b?.totCnt??b?.total??0)||0}
function parseBody(text,ct){const t=String(text||'').trim();if(!t)return{};if((ct||'').includes('json')||t.startsWith('{')||t.startsWith('[')){try{return JSON.parse(t)}catch{}}if(t.startsWith('<')){try{return xml.parse(t)}catch{}}throw new Error('온비드 응답 형식을 해석하지 못했습니다.')}
function serviceError(data){const h=data?.response?.header||data?.header||data?.OpenAPI_ServiceResponse?.cmmMsgHeader||data?.openAPI_ServiceResponse?.cmmMsgHeader;if(!h)return null;const code=String(h.resultCode??h.returnReasonCode??'').trim(),msg=String(h.resultMsg??h.errMsg??h.returnAuthMsg??'').trim();if(h.errMsg||h.returnAuthMsg||(code&&!['0','00','000'].includes(code)))return new Error(`온비드 API ${code||'오류'}: ${msg||'요청 실패'}`);return null}

async function requestPage(code,pageNo){
  const u=new URL(BASE);
  for(const[k,v]of Object.entries({serviceKey:key(),pageNo:String(pageNo),numOfRows:String(ROWS),resultType:'json',prptDivCd:code,pvctTrgtYn:'N'}))u.searchParams.set(k,v);
  let lastErr;
  for(let attempt=0;attempt<4;attempt++){
    if(attempt>0)await sleep(1500*Math.pow(2,attempt-1));
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
    try{
      const r=await fetch(u,{signal:ctrl.signal,headers:{Accept:'application/json,application/xml,text/xml,*/*','User-Agent':'SeoulRedevelopmentPocket/9.2'}});
      const text=await r.text();
      if(r.status===429){lastErr=new Error('HTTP 429 · 온비드 요청 제한');continue}
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const data=parseBody(text,r.headers.get('content-type')||'');const apiErr=serviceError(data);if(apiErr)throw apiErr;
      return{rows:rowsOf(data),totalCount:totalOf(data)};
    }catch(e){lastErr=e;if(attempt===3)throw e}
    finally{clearTimeout(timer)}
  }
  throw lastErr||new Error('온비드 조회 실패');
}

function normalize(x){
  const appraisal=numCI(x,['apslEvlAmt','cltrApslEvlAvgAmt','apslEvlAvgAmt','APSL_EVL_AMT']);
  const minimum=numCI(x,['lowstBidPrc','minBidPrc','lowstBidAmt','frstBidPrc','LOWST_BID_PRC','MIN_BID_PRC']);
  const sido=pickCI(x,['lctnSdnm','sdnm','SIDO_NM','CTPV_NM']),district=pickCI(x,['lctnSggnm','sggnm','SGG_NM']),dong=pickCI(x,['lctnEmdNm','emdNm','EMD_NM']);
  let address=pickCI(x,['sidoSgkEmd','sidoSggEmd','radr','zadr','lctnAddr','addr','address','LDNM_ADRS','ROAD_NM_ADDR']);if(!address)address=[sido,district,dong].filter(Boolean).join(' ');
  return{cltrMngNo:pickCI(x,['cltrMngNo','CLTR_MNG_NO']),pbctCdtnNo:pickCI(x,['pbctCdtnNo','PBCT_CDTN_NO']),name:pickCI(x,['onbidCltrNm','cltrNm','goodsNm','CLTR_NM'])||'온비드 부동산 공매',address,sido,district,dong,category:pickCI(x,['ctgrFullNm','ctgrNm','CTGR_FULL_NM']),propertyType:pickCI(x,['scrnPrptDvsnNm','prptDvsnNm','PRPT_DVSN_NM']),bidStatus:pickCI(x,['pbctCltrStatNm','pbancPbctCltrStatNm','PBCT_STAT_NM']),appraisalAmount:appraisal,minimumBidAmount:minimum,discountRate:appraisal!=null&&appraisal>0&&minimum!=null?Math.round((1-minimum/appraisal)*1000)/10:null,landSqm:numCI(x,['landSqms','landSqm','LAND_SQMS']),buildingSqm:numCI(x,['bldSqms','bldSqm','BLD_SQMS']),bidStart:pickCI(x,['pbctBegnDtm','bidBegnDtm','PBCT_BEGN_DTM']),bidEnd:pickCI(x,['pbctDdlnDt','pbctLastDdlnDt','bidEndDtm','PBCT_CLS_DTM']),failedBidCount:numCI(x,['usbdNft','uscbdCnt','USBD_NFT'])||0,onbidUrl:'https://www.onbid.co.kr/'};
}
function dedupe(items){const seen=new Set(),out=[];for(const x of items){const k=[x.cltrMngNo,x.pbctCdtnNo,x.name,x.address].join('|');if(seen.has(k))continue;seen.add(k);out.push(x)}return out}
function match(x,p){const blob=[x.address,x.sido,x.district,x.dong,x.name].join(' ');return blob.includes(p.district)&&blob.includes(p.dong)}

async function collectAll(){
  const items=[],apiErrors=[],scans=[];
  for(const code of CODES){
    let first;
    try{first=await requestPage(code,1)}catch(e){apiErrors.push({propertyCode:code,page:1,message:String(e?.message||e)});scans.push({propertyCode:code,totalCount:0,pages:0,pagesScanned:0,complete:false});await sleep(GAP_MS);continue}
    items.push(...first.rows.map(normalize));
    const pages=Math.max(1,Math.ceil(first.totalCount/ROWS));
    let pagesScanned=1,complete=true;
    for(let page=2;page<=pages;page++){
      await sleep(GAP_MS);
      try{const d=await requestPage(code,page);items.push(...d.rows.map(normalize));pagesScanned=page}catch(e){apiErrors.push({propertyCode:code,page,message:String(e?.message||e)});complete=false;break}
    }
    scans.push({propertyCode:code,totalCount:first.totalCount,pages,pagesScanned,complete:complete&&pagesScanned>=pages});
    await sleep(GAP_MS);
  }
  const clean=dedupe(items);
  return{items:clean,apiErrors,scans,complete:apiErrors.length===0&&scans.every(x=>x.complete)};
}

export default async function handler(req,res){
  try{
    res.setHeader('Cache-Control',CACHE);
    if(String(req.query.all||'')==='1'){
      const d=await collectAll();
      return res.status(200).json({ok:true,version:'9.2.0',generatedAt:new Date().toISOString(),count:d.items.length,items:d.items,apiErrors:d.apiErrors,scanCoverage:{complete:d.complete,rowsPerPage:ROWS,scans:d.scans}});
    }
    const code=String(req.query.code||''),pageNo=Math.max(1,Number(req.query.page||1)||1);
    if(code){if(!CODES.includes(code))return res.status(400).json({ok:false,error:'지원하지 않는 재산유형 코드입니다.'});const d=await requestPage(code,pageNo);return res.status(200).json({ok:true,version:'9.2.0',generatedAt:new Date().toISOString(),propertyCode:code,page:pageNo,rowsPerPage:ROWS,totalCount:d.totalCount,count:d.rows.length,items:d.rows.map(normalize)});}
    const p=projectById(String(req.query.id||''));if(!p)return res.status(404).json({ok:false,error:'사업지를 찾을 수 없습니다.'});
    const d=await collectAll();
    const filtered=d.items.filter(x=>match(x,p)).sort((a,b)=>String(a.bidEnd||'9999').localeCompare(String(b.bidEnd||'9999')));
    return res.status(200).json({ok:true,version:'9.2.0',generatedAt:new Date().toISOString(),project:{id:p.id,name:p.name,district:p.district,dong:p.dong},count:filtered.length,items:filtered,apiErrors:d.apiErrors,scanCoverage:{complete:d.complete,rowsPerPage:ROWS,scans:d.scans}});
  }catch(e){res.setHeader('Cache-Control','no-store');return res.status(500).json({ok:false,error:String(e?.message||e),version:'9.2.0'})}
}
