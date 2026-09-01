const SERVICE='IndividuallyPostedLandPriceService';

function seg(v){return encodeURIComponent(String(v??''))}
function rows(data){return data?.[SERVICE]?.row||data?.[SERVICE]?.ROW||[]}

export default async function handler(req,res){
  const key=(process.env.SEOUL_OPEN_API_KEY||'').trim();if(!key)return res.status(500).json({ok:false,error:'SEOUL_OPEN_API_KEY가 없습니다.'});
  const district=String(req.query.district||'').trim();const dong=String(req.query.dong||'').trim();const bon=String(req.query.bon||'').trim();const bu=String(req.query.bu||'').trim();
  const year=String(req.query.year||new Date().getFullYear()).trim();
  if(!district)return res.status(400).json({ok:false,error:'district(자치구명)가 필요합니다.'});
  try{
    const parts=['https://openapi.seoul.go.kr:8088',seg(key),'json',SERVICE,'1','100',seg(district),seg(dong),seg(bon),seg(bu),'',seg(year)];
    const url=parts.join('/');
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
    let r,text;try{r=await fetch(url,{signal:ctrl.signal,headers:{Accept:'application/json','User-Agent':'SeoulRedevelopmentPocket/8.0'}});text=await r.text()}finally{clearTimeout(timer)}
    if(!r.ok)throw new Error(`서울 열린데이터 HTTP ${r.status}`);
    let data;try{data=JSON.parse(text)}catch{throw new Error('서울 열린데이터 응답 형식 오류')}
    const result=data?.[SERVICE]?.RESULT||data?.RESULT||{};if(result.CODE&&result.CODE!=='INFO-000')throw new Error(`${result.CODE} ${result.MESSAGE||''}`.trim());
    const list=rows(data).map(x=>({district:x.SIGUNGU_NM,dong:x.BJDONG_NM,bon:x.BONBEON,bu:x.BUBEON,parcelType:x.PILGI_NM,baseMonth:x.BASE_MON,landPricePerSqm:Number(x.JIGA)||null,year:x.YEAR}));
    return res.status(200).json({ok:true,source:'서울 열린데이터광장 개별공시지가',query:{district,dong,bon,bu,year},count:list.length,items:list,generatedAt:new Date().toISOString()});
  }catch(e){return res.status(502).json({ok:false,error:String(e?.message||e),source:'서울 열린데이터광장'})}
}
