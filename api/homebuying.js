import { XMLParser } from 'fast-xml-parser';
import projectsPayload from '../data/projects.json' with { type: 'json' };

const APT_URL='https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade';
const parser=new XMLParser({ignoreAttributes:false,trimValues:true});
const PROJECTS=projectsPayload.projects||[];
const DISTRICTS=[
  ['강북구','11305'],['도봉구','11320'],['노원구','11350'],['중랑구','11260'],
  ['성북구','11290'],['은평구','11380'],['강서구','11500'],['구로구','11530'],
  ['금천구','11545'],['관악구','11620'],['양천구','11470'],['강동구','11740']
];
const SEGMENTS={
  all:{label:'전체 면적',min:0,max:Infinity},
  type59:{label:'59㎡형',min:55,max:65},
  type84:{label:'84㎡형',min:80,max:90}
};

function key(){const raw=(process.env.DATA_GO_KR_SERVICE_KEY||'').trim();if(!raw)throw new Error('DATA_GO_KR_SERVICE_KEY가 없습니다.');try{return decodeURIComponent(raw)}catch{return raw}}
function arr(x){return x==null?[]:Array.isArray(x)?x:[x]}
function num(v){const n=Number(String(v??'').replace(/,/g,'').replace(/[^\d.-]/g,''));return Number.isFinite(n)?n:null}
function median(vals){const a=vals.filter(Number.isFinite).sort((a,b)=>a-b);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2}
function closedMonths(){const d=new Date(),out=[];for(let i=1;i<=2;i++){const x=new Date(d.getFullYear(),d.getMonth()-i,1);out.push(String(x.getFullYear())+String(x.getMonth()+1).padStart(2,'0'))}return out}
function monthLabel(ym){return `${ym.slice(0,4)}.${ym.slice(4)}`}
function pyeongPrice(amount,area){return amount&&area?amount/(area/3.305785):null}
function confidence(count){return count>=20?'신뢰 높음':count>=5?'참고':'표본 부족'}
function segmentRows(rows,seg){return rows.filter(x=>x.area>=seg.min&&x.area<=seg.max)}
function summarize(latestRows,prevRows){
  const latestMedianPyeong=median(latestRows.map(x=>x.pp));
  const prevMedianPyeong=median(prevRows.map(x=>x.pp));
  const latestMedianAmount=median(latestRows.map(x=>x.amount));
  const changePct=latestMedianPyeong&&prevMedianPyeong?((latestMedianPyeong/prevMedianPyeong)-1)*100:null;
  return {
    latestCount:latestRows.length,previousCount:prevRows.length,
    latestMedianPyeong:latestMedianPyeong?Math.round(latestMedianPyeong):null,
    previousMedianPyeong:prevMedianPyeong?Math.round(prevMedianPyeong):null,
    latestMedianAmount:latestMedianAmount?Math.round(latestMedianAmount):null,
    changePct:Number.isFinite(changePct)?Math.round(changePct*10)/10:null,
    confidence:confidence(latestRows.length)
  };
}

async function fetchRows(lawdCd,ym){
  const u=new URL(APT_URL);u.searchParams.set('serviceKey',key());u.searchParams.set('LAWD_CD',lawdCd);u.searchParams.set('DEAL_YMD',ym);u.searchParams.set('numOfRows','3000');u.searchParams.set('pageNo','1');
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
  try{
    const r=await fetch(u,{signal:ctrl.signal,headers:{Accept:'application/xml,text/xml,*/*','User-Agent':'SeoulRedevelopmentPocket/8.4'}});const t=await r.text();if(!r.ok)throw new Error(`HTTP ${r.status}`);const p=parser.parse(t);const body=p?.response?.body||p?.body||p;const items=arr(body?.items?.item??body?.item??[]);
    return items.map(x=>{const amount=num(x['거래금액']??x.dealAmount),area=num(x['전용면적']??x.excluUseAr);return{amount,area,pp:pyeongPrice(amount,area)}}).filter(x=>x.amount&&x.area);
  }finally{clearTimeout(timer)}
}
function applyBurden(rows,segmentKey){
  const vals=rows.map(x=>x.segments?.[segmentKey]?.latestMedianPyeong).filter(Number.isFinite).sort((a,b)=>a-b);if(!vals.length)return;
  const q1=vals[Math.floor((vals.length-1)*.33)],q2=vals[Math.floor((vals.length-1)*.66)];
  for(const x of rows){const s=x.segments?.[segmentKey];if(!s)continue;s.priceBurden=!Number.isFinite(s.latestMedianPyeong)?'미확인':s.latestMedianPyeong<=q1?'낮음':s.latestMedianPyeong<=q2?'보통':'높음'}
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=43200');
  try{
    const months=closedMonths();
    const jobs=DISTRICTS.map(async([district,lawdCd])=>{
      const results=await Promise.allSettled(months.map(ym=>fetchRows(lawdCd,ym)));
      const byMonth=results.map((r,i)=>({ym:months[i],rows:r.status==='fulfilled'?r.value:[],error:r.status==='rejected'?String(r.reason?.message||r.reason):null}));
      const latest=byMonth[0],prev=byMonth[1],segments={};
      for(const [k,seg] of Object.entries(SEGMENTS))segments[k]={label:seg.label,...summarize(segmentRows(latest.rows,seg),segmentRows(prev.rows,seg))};
      const all=segments.all;
      return {
        district,lawdCd,latestMonth:latest.ym,previousMonth:prev.ym,
        latestCount:all.latestCount,previousCount:all.previousCount,latestMedianPyeong:all.latestMedianPyeong,previousMedianPyeong:all.previousMedianPyeong,latestMedianAmount:all.latestMedianAmount,changePct:all.changePct,confidence:all.confidence,
        redevelopmentCount:PROJECTS.filter(p=>p.district===district).length,
        segments,apiErrors:byMonth.filter(x=>x.error).map(x=>({month:x.ym,error:x.error}))
      };
    });
    const rows=await Promise.all(jobs);
    for(const k of Object.keys(SEGMENTS))applyBurden(rows,k);
    rows.sort((a,b)=>(a.segments.all.latestMedianPyeong??Infinity)-(b.segments.all.latestMedianPyeong??Infinity));
    return res.status(200).json({
      ok:true,source:'국토교통부 아파트 실거래 Open API',scope:'서울 외곽·중저가 탐색 후보 12개 자치구 비교',
      metricNote:'가격 변화율은 동일 단지 반복매매 지수가 아니라 각 월 신고거래의 평당가 중앙값 변화입니다.',
      segmentNote:'59㎡형은 전용 55~65㎡, 84㎡형은 전용 80~90㎡ 신고거래를 묶어 비교합니다.',
      cache:'6시간 CDN 캐시',months:months.map(monthLabel),segments:SEGMENTS,rows,generatedAt:new Date().toISOString()
    });
  }catch(e){return res.status(502).json({ok:false,error:String(e?.message||e)})}
}
