/* Observations, not predictive signals. Every unassessed value remains missing. */
(function(root){
const fields={
volume:['Volumenbereich',{long:'Unterstützt Long',short:'Unterstützt Short',neutral:'Neutral',unclear:'Unklar'}],
stopping:['Stopping / Topping',{stopping:'Stopping beobachtet',topping:'Topping beobachtet',none:'Keines beobachtet',unclear:'Unklar'}],
cvd:['CVD',{rising:'Steigend',falling:'Fallend',flat:'Seitwärts',unclear:'Unklar'}],
delta:['Delta · betrachtete Kerze',{positive:'Positiv',negative:'Negativ',neutral:'Neutral',unclear:'Unklar'}],
vpoc:['Volumen-POC',{above:'Preis darüber',at:'Preis daran',below:'Preis darunter',unclear:'Unklar'}],
vwap:['VWAP',{above:'Preis darüber',at:'Preis daran',below:'Preis darunter',unclear:'Unklar'}],
zone:['Lage in der Zone',{top:'Oben',middle:'Mitte',bottom:'Unten',outside:'Außerhalb',unclear:'Unklar'}],
zone_direction:['Erwartung an der Zone',{long:'Long',short:'Short',neutral:'Neutral',unclear:'Unklar'}],
aggression:['Market-Druck',{buy:'Market-Käufe',sell:'Market-Verkäufe',balanced:'Ausgeglichen',unclear:'Unklar'}],
absorption:['Passive Reaktion',{buy_absorbed:'Market-Käufe absorbiert',sell_absorbed:'Market-Verkäufe absorbiert',none:'Keine beobachtet',unclear:'Unklar'}],
cvd_divergence:['CVD-Divergenz',{bullish:'Bullisch',bearish:'Bärisch',none:'Keine beobachtet',unclear:'Unklar'}],
delta_divergence:['Delta-Divergenz',{bullish:'Bullisch',bearish:'Bärisch',none:'Keine beobachtet',unclear:'Unklar'}],
liquidity_target:['Liquiditätsziel',{above:'Oberhalb',below:'Unterhalb',both:'Beide Seiten',none:'Kein Ziel'}],
assessment:['LTF-Einschätzung',{long:'Long',short:'Short',neutral:'Neutral',unclear:'Unklar'}],
liquidity:['Erkennbare Liquidität',{above:'Oberhalb',below:'Unterhalb',both:'Beidseitig',none:'Keine erkennbar',unclear:'Unklar'}]
};
const model={fields,ticks:{NQ:5,MNQ:.5,ES:12.5,MES:1.25},risk(rows){return rows.reduce((n,r)=>n+this.ticks[r.instrument]*r.quantity*r.ticks,0)},
validLtf(p){if(p?.schema===813){return ['reviewed','not_reviewed','unavailable'].includes(p.status)&&Array.isArray(p.images)&&p.images.length<=4&&Object.entries(p.values||{}).every(([k,v])=>fields[k]&&(v==='not_relevant'||Object.hasOwn(fields[k][1],v)));}if(!p||!['reviewed','not_reviewed','unavailable'].includes(p.status))return false;if(p.status==='reviewed'){if(!p.timeframe||!p.reference||Object.keys(fields).filter(k=>!["cvd_divergence","delta_divergence","liquidity_target","assessment"].includes(k)).some(k=>!p.values?.[k]||!Object.hasOwn({...fields[k][1],not_reviewed:1,unavailable:1},p.values[k])))return false;}return !!(p.images?.length||p.image_absence);},
activeNews(rows,now=Date.now()){return(rows||[]).filter(r=>r.rule==='avoid'&&Number.isFinite(Date.parse(r.from))&&Number.isFinite(Date.parse(r.to))&&Date.parse(r.from)<=now&&now<=Date.parse(r.to));},
newsKey(r){return [r.id,r.title,r.at,r.from,r.to,r.rule].join(':');},
changes(standard,actual){return ['instrument','quantity','ticks'].filter(k=>standard[k]!=null&&standard[k]!==actual[k]).map(field=>({field,expected:standard[field],actual:actual[field]}));}
};root.TT811=model;if(typeof module!=='undefined')module.exports=model;
})(typeof globalThis!=='undefined'?globalThis:this);
