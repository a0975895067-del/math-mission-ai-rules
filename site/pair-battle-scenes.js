import {characterHabitat,characterHabitatForSeason,characterHabitats,habitats,seasonOrder} from './character-habitats.js';
// Fictional habitat compatibility, not battle stats or real-world species claims.
const edges={forest:['garden','grove','wetland','prehistoric','highland'],highland:['forest','prehistoric','ruins'],shore:['wetland'],wetland:['shore','forest','garden'],garden:['forest','wetland','ruins'],grove:['forest','ruins'],ruins:['grove','garden','highland'],prehistoric:['forest','highland']};
const keys=Object.keys(habitats),cache=new Map();
export function habitatDistance(a,b){const queue=[[a,0]],seen=new Set([a]);for(let i=0;i<queue.length;i++){const [node,d]=queue[i];if(node===b)return d;for(const next of edges[node]||[])if(!seen.has(next)){seen.add(next);queue.push([next,d+1]);}}return 9;}
export function pairSeasonRoute(first,second){
 const a=characterHabitat(first),b=characterHabitat(second),sorted=[a,b].sort((x,y)=>x.id.localeCompare(y.id)),key=sorted.map(p=>p.id).join(':');if(cache.has(key))return cache.get(key);
 // A global four-season plan prevents all seasons falling back to the same bridge.
 const costs=seasonOrder.map(s=>keys.map(h=>{const d=sorted.map(p=>habitatDistance(h,p.seasonHabitats[s]));return (d[0]+d[1])*4+Math.max(...d)*2+sorted.reduce((n,p)=>n+habitatDistance(h,p.habitat),0)*.35;}));
 let best=Infinity,winner=[];function choose(route,score){const i=route.length;if(i===4){if(score<best){best=score;winner=[...route];}return;}for(let j=0;j<keys.length;j++){if(route.includes(j))continue;const next=score+costs[i][j];if(next>best)continue;choose([...route,j],next);}}
 choose([],0);const result=Object.freeze(Object.fromEntries(seasonOrder.map((s,i)=>[s,keys[winner[i]]])));cache.set(key,result);return result;
}
export function resolvePairScene(first,second,season){
 const a=characterHabitatForSeason(first,season),b=characterHabitatForSeason(second,season),h=pairSeasonRoute(a.id,b.id)[a.season];
 const reason=a.habitat===b.habitat&&h===a.habitat?`雙方當季都適合${habitats[h]}`:h===a.habitat?`以${a.name}的當季場地為主，加入${b.name}的相關景物`:h===b.habitat?`以${b.name}的當季場地為主，加入${a.name}的相關景物`:`選擇連接雙方棲地的${habitats[h]}，保留兩方景物`;
 return {habitat:h,reason,first:a,second:b};
}
export function nextDifferentOpponent(ally,current,recent=[],random=Math.random){
 const candidates=characterHabitats.filter(p=>p.id!==ally&&p.id!==current&&!recent.includes(p.id));const pool=candidates.length?candidates:characterHabitats.filter(p=>p.id!==ally&&p.id!==current);
 return pool[Math.min(pool.length-1,Math.max(0,Math.floor(random()*pool.length)))].id;
}
