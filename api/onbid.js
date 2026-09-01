import { XMLParser } from 'fast-xml-parser';
import projectsPayload from '../data/projects.json' with { type: 'json' };

const PROJECTS=projectsPayload.projects||[];
const BASE='https://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2';
const CODES=['0007','0010','0005','0002','0003'];
const ROWS=100;
const xml=new XMLParser({ignoreAttributes:false,trimValues:true});

function key(){const raw=(process.env.DATA_GO_KR_SERVICE_KEY||'').trim();if(!raw)throw new Error('Vercel 환경변수 DATA_GO_KR_SERVICE_KEY가 없습니다.');try{return decodeURIComponent(raw)}catch{return raw}}
function arr(v){return v==null?[]:Array.isArray(v)?v:[v]}
function num(v){const raw=String(v??'').trim();if(!raw)return null;const c=raw.replace(/,/g,'').replace(/[^\d.-]/g,'');if(!c||c==='-'||c==='.'||c==='-.')return null;const n=Number(c);return Number.isFinite(n)?n:null}
function pickCI(obj,keys){const m={};for(const[k,v]of Object.entries(obj||{}))m[String(k).toLowerCase()]=v;for(const k of keys){const v=m[String(k).toLowerCase()];if(v!=null&&String(v).trim()!=='')return String(v).trim()}return''}
function numCI(obj,keys){return num(pickCI(obj,keys))}
function projectById(id){return PROJECTS.find(p=>p.id===id)}
function bodyOf(data){return data?.response?.body||data?.body||data}
function rowsOf(data){const b=bodyOf(data);return arr(b?.items?.item??b?.items??b?.item??b?.data??b?.result??b?.list??[])}
function totalOf(data){const b=bodyOf(data);return num(b?.totalCount??b?.totalCnt??b?.totCnt??b?.total??0)||0}
function parseBody(text,ct){const t=String(text||'').trim();if(!t)return{};if((ct||'').includes('json')||t.startsWith('{')||t.startsWith('[')){try{return JSON.parse(t)}catch{}}if(t.startsWith('<')){try{return xml.parse(t)}catch{}}throw new Error('온비드 응답 형식을 해석하지 못했습니다.')}
function serviceError(data){const h=data?.response?.header||data?.header||data?.OpenAPI_ServiceResponse?.cmmMsgHeader||data?.openAPI_ServiceResponse?.cmmMsgHeader;if(!h)return null;const code=String(h.resultCode??h.returnReasonCode??'').trim(),msg=String(h.resultMsg??h.errMsg??h.returnAuthMsg??'').trim();if(h.errMsg||h.returnAuthMsg||(code&&!['0','00','000'].includes(code))){const e=new Error(`온비드 API ${code||'오류'}: ${msg||'요청 실패'}`);e.apiCode=code;return e}return null}
function regionMatch(raw,p){const blob=Object.values(raw||{}).map(v=>typeof v==='object'?JSON.stringify(v):String(v??'')).join(' ').replace(/\s+/g,' ');return blob.includes(p.district)&&blob.includes(p.dong)}

async function requestCode(code,p){
  const u=new URL(BASE);
  // 차세대 목록 API 공식 문서의 필수/공통 파라미터만 사용한다.
  for(const[k,v]of Object.entries({serviceKey:key(),pageNo:'1',numOfRows:String(ROWS),resultType:'json',prptDivCd:code,pvctTrgtYn:'N'}))u.searchParams.set(k,v);
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),8000);
  try{
    const r=await fetch(u,{signal:ctrl.signal,headers:{Accept:'application/json,application/xml,text/xml,*/*','User-Agent':'SeoulRedevelopmentPocket/7.6'}});
    const text=await r.text();
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const data=parseBody(text,r.headers.get('content-type')||'');
    const apiErr=serviceError(data);if(apiErr)throw apiErr;
    const rawRows=rowsOf(data),matched=rawRows.filter(x=>regionMatch(x,p)),totalCount=totalOf(data);
    return{code,rows:matched,totalCount,returned:rawRows.length,complete:totalCount<=rawRows.length};
  }finally{clearTimeout(timer)}
}

function normalize(x){
  const appraisal=numCI(x,['apslEvlAmt','cltrApslEvlAvgAmt','apslEvlAvgAmt','APSL_EVL_AMT']);
  const minimum=numCI(x,['lowstBidPrc','minBidPrc','lowstBidAmt','frstBidPrc','LOWST_BID_PRC','MIN_BID_PRC']);
  const sido=pickCI(x,['lctnSdnm','sdnm','SIDO_NM','CTPV_NM']),district=pickCI(x,['lctnSggnm','sggnm','SGG_NM']),dong=pickCI(x,['lctnEmdNm','emdNm','EMD_NM']);
  let address=pickCI(x,['sidoSgkEmd','sidoSggEmd','radr','zadr','lctnAddr','addr','address','LDNM_ADRS','ROAD_NM_ADDR']);if(!address)address=[sido,district,dong].filter(Boolean).join(' ');
  return{cltrMngNo:pickCI(x,['cltrMngNo','CLTR_MNG_NO']),pbctCdtnNo:pickCI(x,['pbctCdtnNo','PBCT_CDTN_NO']),name:pickCI(x,['onbidCltrNm','cltrNm','goodsNm','CLTR_NM'])||'온비드 부동산 공매',address,sido,district,dong,category:pickCI(x,['ctgrFullNm','ctgrNm','CTGR_FULL_NM']),propertyType:pickCI(x,['scrnPrptDvsnNm','prptDvsnNm','PRPT_DVSN_NM']),bidStatus:pickCI(x,['pbctCltrStatNm','pbancPbctCltrStatNm','PBCT_STAT_NM']),appraisalAmount:appraisal,minimumBidAmount:minimum,discountRate:appraisal!=null&&appraisal>0&&minimum!=null?Math.round((1-minimum/appraisal)*1000)/10:null,landSqm:numCI(x,['landSqms','landSqm','LAND_SQMS']),buildingSqm:numCI(x,['bldSqms','bldSqm','BLD_SQMS']),bidStart:pickCI(x,['pbctBegnDtm','bidBegnDtm','PBCT_BEGN_DTM']),bidEnd:pickCI(x,['pbctDdlnDt','pbctLastDdlnDt','bidEndDtm','PBCT_CLS_DTM']),failedBidCount:numCI(x,['usbdNft','uscbdCnt','USBD_NFT'])||0,onbidUrl:'https://www.onbid.co.kr/'};
}

export default async function handler(req,res){
  try{
    const p=projectById(String(req.query.id||''));if(!p)return res.status(404).json({ok:false,error:'사업지를 찾을 수 없습니다.'});
    const settled=await Promise.allSettled(CODES.map(code=>requestCode(code,p)));
    const items=[],apiErrors=[],scans=[],fields=new Set();
    settled.forEach((r,i)=>{const code=CODES[i];if(r.status==='fulfilled'){const s=r.value;scans.push({propertyCode:code,totalCount:s.totalCount,returned:s.returned,pagesScanned:1,complete:s.complete,matched:s.rows.length});for(const raw of s.rows){Object.keys(raw||{}).forEach(k=>fields.add(k));items.push(normalize(raw))}}else{apiErrors.push({propertyCode:code,stage:'official-list',message:String(r.reason?.message||r.reason),apiCode:String(r.reason?.apiCode||'')||null});scans.push({propertyCode:code,pagesScanned:0,complete:false,matched:0,error:true})}});
    const seen=new Set(),dedup=[];for(const x of items){const k=[x.cltrMngNo,x.pbctCdtnNo,x.name,x.address].join('|');if(seen.has(k))continue;seen.add(k);dedup.push(x)}
    dedup.sort((a,b)=>String(a.bidEnd||'9999').localeCompare(String(b.bidEnd||'9999')));
    const complete=apiErrors.length===0&&scans.every(s=>s.complete===true);
    res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json({ok:true,version:'7.6.0',generatedAt:new Date().toISOString(),project:{id:p.id,name:p.name,district:p.district,dong:p.dong},scope:`${p.district} ${p.dong} · 온비드 목록 조회 범위 내 일치 물건`,queryMode:'official-first-page-local-filter',count:dedup.length,items:dedup,apiErrors,scanCoverage:{complete,maxPagesPerPropertyCode:1,scans},availableFields:[...fields].sort(),exactProjectBoundary:false,exactProjectBoundaryNote:'사업구역 Polygon 좌표 매칭 전이므로 동일 구/동 참고 공매입니다.',coverageNote:complete?'조회된 유형의 전체 목록 범위 확인':'온비드 전국 목록의 첫 페이지 범위에서 지역 일치 물건을 찾습니다. 0건은 전체 공매 0건을 뜻하지 않을 수 있습니다.'});
  }catch(e){res.setHeader('Cache-Control','no-store');return res.status(500).json({ok:false,error:String(e?.message||e),version:'7.6.0'})}
}
