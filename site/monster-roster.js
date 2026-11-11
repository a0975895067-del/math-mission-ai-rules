import {roster} from './character-roster-3d.js';
// Stable storage IDs preserve historical reports and earned unlock positions.
const items=roster.map((entry,i)=>Object.freeze({id:'monster-'+String(i+1).padStart(2,'0'),characterId:entry[0],name:entry[1],family:Math.floor(i/4),variant:i%3,color:entry[3],skill:['岩影突擊','流光波動','森林旋風','烈焰衝鋒'][Math.floor(i/10)],attack:18+Math.floor(i/3)*2+(i%3)*2,motion:'walk'}));
const thumbnails=new Map();
function svg(item){const src=thumbnails.get(item.id);if(!src)queueMicrotask(()=>preparePortraits([item.id]));return src?`<img src="${src}" alt="${item.name}" width="160" height="130">`:`<span class="approved-portrait-label" data-character-id="${item.id}">${item.characterId} · ${item.name}</span>`;}
function deck(random=Math.random){const rows=[...items];for(let i=rows.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[rows[i],rows[j]]=[rows[j],rows[i]];}return rows;}
window.MathMonsterRoster=Object.freeze({items:Object.freeze(items),svg,deck});
let engine;
function loadEngine(){return engine ||= import('./approved-battle.js?v=20261102-paired-season-scenes').then(m=>m.createBattle(thumbnails));}
function preparePortraits(ids){loadEngine().then(b=>b.portraits(ids)).then(()=>{for(const el of document.querySelectorAll('[data-character-id]')){const id=el.dataset.characterId,src=thumbnails.get(id);if(src){const img=document.createElement('img');img.src=src;img.alt=items.find(x=>x.id===id)?.name||'';img.width=160;img.height=130;el.replaceWith(img);}}}).catch(()=>{});}
window.MathCharacterBattle={attach(host,state,effect){
  host.textContent='正在載入新版角色…';
  engine = loadEngine();
  engine.then(b=>{if(host.isConnected)b.attach(host,state,effect);}).catch(()=>{if(host.isConnected)host.textContent='3D 暫時無法顯示；作答、提示與報告仍可使用。可重新整理後再試。';});
}};
