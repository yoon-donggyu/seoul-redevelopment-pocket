import { XMLParser } from 'fast-xml-parser';
import projectsPayload from '../data/projects.json' with { type: 'json' };

const PROJECTS = projectsPayload.projects || [];
const BASE = 'https://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2';
const CODES = ['0007','0010','0005','0002','0003'];
const ROWS = 100;
const MAX_PAGES_PER_CODE = 8;
const MAX_MATCHES = 80;
const xml = new XMLParser({ ignoreAttributes:false, trimValues:true });

function key(){
  const raw=(process.env.DATA_GO_KR_SERVICE_KEY||'').trim();
  if(!raw) throw new Error('Vercel 환경변수 DATA_GO_KR_SERVICE_KEY가 없습니다.');
  try{return decodeURIComponent(raw)}catch{return raw}
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function arr(v){return v==null?[]:Array.isArray(v)?v:[v]}
function num(v){const n=Number(String(v??'').replace(/,/g,'').replace(/[^\d.-]/g,''));return Number.isFinite(n)?n:0}
function pickCI(obj,keys){const m={};for(const[k,v]of Object.entries(obj||{}))m[String(k).toLowerCase()]=v;for(const k of keys){const v=m[String(k).toLowerCase()];if(v!=null&&String(v).trim()!=='')return String(v).trim()}return ''}
function numCI(obj,keys){return num(pickCI(obj,keys))}
function projectById(id){return PROJECTS.find(p=>p.id===id)}
function bodyOf(data){return data?.response?.body||data?.body||data}
function rowsOf(data){const body=bodyOf(data);return arr(body?.items?.item??body?.items??body?.item??body?.data??body?.result??body?.list??[])}
function totalOf(data){const body=bodyOf(data);return num(body?.totalCount??body?.totalCnt??body?.totCnt??body?.total??0)}

function parseBody(text,contentType){
  const t=String(text||'').trim();
  if(!t)return {};
  if((contentType||'').includes('json')||t.startsWith('{')||t.startsWith('[')){
    try{return JSON.parse(t)}catch{}
  }
  if(t.startsWith('<')){
    try{return xml.parse(t)}catch{}
  }
  throw new Error('온비드가 JSON/XML이 아닌 응답을 반환했습니다: '+t.slice(0,120));
}

function serviceError(data){
  const h=data?.response?.header||data?.header||data?.OpenAPI_ServiceResponse?.cmmMsgHeader||data?.openAPI_ServiceResponse?.cmmMsgHeader;
  if(!h)return null;
  const code=String(h.resultCode??h.returnReasonCode??'').trim();
  const msg=String(h.resultMsg??h.errMsg??h.returnAuthMsg??h.returnReasonCode??'').trim();
  if(h.errMsg||h.returnAuthMsg||(code&&!['0','00','000'].includes(code))){
    const e=new Error(`온비드 API ${code||'오류'}: ${msg||'요청 실패'}`);
    e.apiCode=code;
    return e;
  }
  return null;
}

async function requestPage(code,page){
  const u=new URL(BASE);
  u.searchParams.set('serviceKey',key());
  u.searchParams.set('pageNo',String(page||1));
  u.searchParams.set('numOfRows',String(ROWS));
  u.searchParams.set('resultType','json');
  u.searchParams.set('prptDivCd',code);
  u.searchParams.set('pvctTrgtYn','N');

  let lastErr;
  for(let attempt=0;attempt<2;attempt++){
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),12000);
    try{
      const r=await fetch(u,{signal:ctrl.signal,headers:{Accept:'application/json,application/xml,text/xml,*/*','User-Agent':'SeoulRedevelopmentPocket/7.4'}});
      const text=await r.text();
      if(!r.ok){
        const e=new Error('HTTP '+r.status+' '+text.slice(0,160));
        e.httpStatus=r.status;
        throw e;
      }
      const data=parseBody(text,r.headers.get('content-type')||'');
      const apiErr=serviceError(data);
      if(apiErr)throw apiErr;
      return data;
    }catch(e){
      lastErr=e;
      const retryable=e?.httpStatus===429||e?.httpStatus===503||String(e?.apiCode||'')==='23'||String(e?.name||'')==='AbortError';
      if(!retryable||attempt===1)throw e;
      await sleep(550);
    }finally{clearTimeout(timer)}
  }
  throw lastErr||new Error('온비드 호출 실패');
}

function regionMatch(raw,p){
  const values=Object.values(raw||{}).map(v=>typeof v==='object'?JSON.stringify(v):String(v??''));
  const blob=values.join(' ').replace(/\s+/g,' ');
  return blob.includes(p.district)&&blob.includes(p.dong);
}

async function scanCode(code,p){
  const matched=[];
  let pagesScanned=0,totalCount=0,totalPages=1,complete=true;

  const first=await requestPage(code,1);
  let rows=rowsOf(first);
  totalCount=totalOf(first);
  totalPages=totalCount?Math.max(1,Math.ceil(totalCount/ROWS)):(rows.length>=ROWS?MAX_PAGES_PER_CODE:1);
  const limit=Math.min(totalPages,MAX_PAGES_PER_CODE);
  complete=totalPages<=MAX_PAGES_PER_CODE;
  pagesScanned=1;
  matched.push(...rows.filter(raw=>regionMatch(raw,p)));

  for(let page=2;page<=limit&&matched.length<MAX_MATCHES;page++){
    await sleep(120);
    const data=await requestPage(code,page);
    rows=rowsOf(data);
    pagesScanned=page;
    matched.push(...rows.filter(raw=>regionMatch(raw,p)));
    if(!rows.length||rows.length<ROWS){complete=true;break}
  }
  if(matched.length>=MAX_MATCHES)complete=false;
  return {code,rows:matched,totalCount,totalPages,pagesScanned,complete};
}

function normalize(x){
  const appraisal=numCI(x,['apslEvlAmt','cltrApslEvlAvgAmt','apslEvlAvgAmt','APSL_EVL_AMT']);
  const minimum=numCI(x,['lowstBidPrc','minBidPrc','lowstBidAmt','frstBidPrc','LOWST_BID_PRC','MIN_BID_PRC']);
  const sido=pickCI(x,['lctnSdnm','sdnm','SIDO_NM','CTPV_NM']);
  const district=pickCI(x,['lctnSggnm','sggnm','SGG_NM']);
  const dong=pickCI(x,['lctnEmdNm','emdNm','EMD_NM']);
  let address=pickCI(x,['sidoSgkEmd','sidoSggEmd','radr','zadr','lctnAddr','addr','address','LDNM_ADRS','ROAD_NM_ADDR']);
  if(!address)address=[sido,district,dong].filter(Boolean).join(' ');
  return {
    cltrMngNo:pickCI(x,['cltrMngNo','CLTR_MNG_NO']),
    pbctCdtnNo:pickCI(x,['pbctCdtnNo','PBCT_CDTN_NO']),
    name:pickCI(x,['onbidCltrNm','cltrNm','goodsNm','CLTR_NM'])||'온비드 부동산 공매',
    address,sido,district,dong,
    category:pickCI(x,['ctgrFullNm','ctgrNm','CTGR_FULL_NM']),
    propertyType:pickCI(x,['scrnPrptDvsnNm','prptDvsnNm','PRPT_DVSN_NM']),
    bidStatus:pickCI(x,['pbctCltrStatNm','pbancPbctCltrStatNm','PBCT_STAT_NM']),
    appraisalAmount:appraisal||null,
    minimumBidAmount:minimum||null,
    discountRate:appraisal&&minimum?Math.round((1-minimum/appraisal)*1000)/10:null,
    landSqm:numCI(x,['landSqms','landSqm','LAND_SQMS'])||null,
    buildingSqm:numCI(x,['bldSqms','bldSqm','BLD_SQMS'])||null,
    bidStart:pickCI(x,['pbctBegnDtm','bidBegnDtm','PBCT_BEGN_DTM']),
    bidEnd:pickCI(x,['pbctDdlnDt','pbctLastDdlnDt','bidEndDtm','PBCT_CLS_DTM']),
    failedBidCount:numCI(x,['usbdNft','uscbdCnt','USBD_NFT'])||0,
    onbidUrl:'https://www.onbid.co.kr/'
  };
}

export default async function handler(req,res){
  try{
    const p=projectById(String(req.query.id||''));
    if(!p)return res.status(404).json({ok:false,error:'사업지를 찾을 수 없습니다.'});

    const items=[],apiErrors=[],fields=new Set(),scans=[];
    for(const code of CODES){
      try{
        const scan=await scanCode(code,p);
        scans.push({propertyCode:code,totalCount:scan.totalCount,totalPages:scan.totalPages,pagesScanned:scan.pagesScanned,complete:scan.complete,matched:scan.rows.length});
        for(const raw of scan.rows){
          Object.keys(raw||{}).forEach(k=>fields.add(k));
          items.push(normalize(raw));
        }
      }catch(e){
        apiErrors.push({propertyCode:code,stage:'official-list',message:String(e?.message||e),apiCode:String(e?.apiCode||'')||null});
        scans.push({propertyCode:code,totalCount:null,totalPages:null,pagesScanned:0,complete:false,matched:0,error:true});
      }
    }

    const seen=new Set(),dedup=[];
    for(const x of items){
      const k=[x.cltrMngNo,x.pbctCdtnNo,x.name,x.address].join('|');
      if(seen.has(k))continue;
      seen.add(k);dedup.push(x);
    }
    dedup.sort((a,b)=>String(a.bidEnd||'9999').localeCompare(String(b.bidEnd||'9999')));

    const coverageComplete=scans.length===CODES.length&&scans.every(s=>s.complete&&!s.error);
    res.setHeader('Cache-Control','public, s-maxage=1800, stale-while-revalidate=7200');
    return res.status(200).json({
      ok:true,version:'7.4.0',generatedAt:new Date().toISOString(),
      project:{id:p.id,name:p.name,district:p.district,dong:p.dong},
      scope:`${p.district} ${p.dong} 현재 입찰중/예정 부동산 공매`,
      queryMode:'official-list-local-region-filter',
      count:dedup.length,items:dedup,apiErrors,
      scanCoverage:{complete:coverageComplete,maxPagesPerPropertyCode:MAX_PAGES_PER_CODE,scans},
      availableFields:[...fields].sort(),
      exactProjectBoundary:false,
      exactProjectBoundaryNote:'사업구역 Polygon 좌표 매칭 전이므로 동일 구/동 참고 공매입니다.'
    });
  }catch(e){
    return res.status(500).json({ok:false,error:String(e?.message||e),version:'7.4.0'});
  }
}
