import * as T from './vendor-three/three.module.min.js';
import {roster} from './character-roster-3d.js';
import {orangeDino} from './orange-dino-v2.js';
import {prototypes} from './character-organic-prototypes.js';
import {makeCharacter} from './character-remaining-models.js';
const $=s=>document.querySelector(s),host=$('#viewport'),loading=$('#loading');
try{await init();}catch(e){loading.hidden=false;loading.textContent='3D 載入失敗，請重新整理或確認瀏覽器支援 WebGL。';console.error(e);}
async function init(){
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;host.prepend(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#e2e9df');const camera=new T.PerspectiveCamera(38,1,.1,50);
 scene.add(new T.HemisphereLight('#fff9e6','#819b82',2.4));const sun=new T.DirectionalLight('#fff5dd',2.7);sun.position.set(4,6,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.normalBias=.03;scene.add(sun);
 const floor=new T.Mesh(new T.CylinderGeometry(2.9,3,.14,64),new T.MeshStandardMaterial({color:'#bdcba8',roughness:.9}));floor.position.y=-.19;floor.receiveShadow=true;scene.add(floor);
 let current=null,index=0,mode='idle',phase=0,speed=1,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,yaw=1,pitch=.2,distance=7.6,target=1.15,request=0;
 let original=null,rex=null;const cache=new Map();let filter='全部';
 const kindName={A:'攻擊型',B:'可愛型',C:'呆萌型',D:'恐龍型'},messages={idle:'待機：觀察呼吸與小動作。',walk:'移動：觀察角色專屬步態或漂浮動作。',attack:'攻擊：動作構想試演，尚未接入遊戲傷害。',guard:'防守：觀察收臂、收翼或降低重心。',hurt:'受擊：短暫晃動後回復。'};
 const names={rock:'連續四足表皮、嵌入式岩甲與腳步停頓。',jelly:'波浪鐘罩、平滑觸手與漂浮動作。',moss:'連續石身、苔色表面與輕擺葉芽。',rex:'粗壯上臂、加長前臂與內收手肘；雙指尖爪隨關節擺動。'};
 function setMode(m){mode=m;phase=0;$('#status').textContent=messages[m];document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===m)));}
 async function select(n){const token=++request;loading.hidden=false;loading.textContent='正在建立 '+roster[n][1]+'…';await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));if(token!==request)return;
 try{let model=cache.get(n);const type=roster[n][2];if(!model){
  if(['rock','jelly','moss'].includes(type)){if(!original)original=prototypes(T,scene);const k={rock:0,jelly:1,moss:2}[type];model={show:()=>original.select(k),hide:()=>original.select(-1),animate:(t,m)=>original.animate(t,m,k),description:names[type]};}
  else if(type==='rex'){rex=orangeDino(T,scene);model={...rex,show:()=>rex.root.visible=true,hide:()=>rex.root.visible=false,description:names.rex};}
  else {const item=makeCharacter(T,scene,roster[n]);model={...item,show:()=>item.root.visible=true,hide:()=>item.root.visible=false};}
  cache.set(n,model);
 }if(current)current.hide();current=model;current.show();index=n;setMode('idle');yaw=1;pitch=.2;distance=roster[n][2]==='rex'?8:7;target=1.1;
 $('#name').textContent=roster[n][0]+' · '+roster[n][1];$('#kind').textContent=kindName[roster[n][0][0]]+' / '+'角色展示';$('#description').textContent=model.description;
 document.querySelectorAll('.card').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.index)===n)));history.replaceState(null,'','#'+roster[n][0]);loading.hidden=true;
 }catch(e){loading.textContent='此角色建立失敗，請選擇其他角色並回報編號 '+roster[n][0];console.error(e);}}
 for(const k of ['全部','攻擊型','可愛型','呆萌型','恐龍型']){const b=document.createElement('button');b.textContent=k;b.setAttribute('aria-pressed',String(k===filter));b.onclick=()=>{filter=k;document.querySelectorAll('.card').forEach(c=>c.hidden=k!=='全部'&&c.dataset.kind!==k);for(const c of $('#filters').children)c.setAttribute('aria-pressed',String(c===b));$('#count').textContent=k==='全部'?'40 隻':'10 隻';};$('#filters').append(b);}
 roster.forEach((r,n)=>{const b=document.createElement('button');b.className='card';b.dataset.index=n;b.dataset.kind=kindName[r[0][0]];const title=document.createElement('b'),sub=document.createElement('small');title.textContent=r[0]+' '+r[1];sub.textContent=kindName[r[0][0]]+' · 動作展示';b.append(title,sub);b.onclick=()=>select(n);$('#cards').append(b);});$('#count').textContent='40 隻';
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{yaw={front:0,side:Math.PI/2,back:Math.PI}[b.dataset.view];pitch=.2;});$('#reset').onclick=()=>{yaw=1;pitch=.2;distance=7.6;};$('#speed').oninput=e=>speed=Number(e.target.value);
 const pauseUI=()=>{$('#pause').textContent=paused?'繼續動作':'暫停動作';$('#pause').setAttribute('aria-pressed',String(paused));};$('#pause').onclick=()=>{paused=!paused;pauseUI();};pauseUI();$('#prev').onclick=()=>select((index+39)%40);$('#next').onclick=()=>select((index+1)%40);
 let drag=null;renderer.domElement.onpointerdown=e=>{drag=[e.clientX,e.clientY];renderer.domElement.setPointerCapture(e.pointerId);};renderer.domElement.onpointermove=e=>{if(!drag)return;yaw-=(e.clientX-drag[0])*.008;pitch=Math.max(-.1,Math.min(.9,pitch+(e.clientY-drag[1])*.006));drag=[e.clientX,e.clientY];};renderer.domElement.onpointerup=renderer.domElement.onpointercancel=()=>drag=null;renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(4.3,Math.min(12,distance+e.deltaY*.004));},{passive:false});
 const resize=()=>{renderer.setSize(host.clientWidth,host.clientHeight,false);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(host);resize();
 let last=performance.now();function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!paused&&!document.hidden)phase+=dt*speed;if(current)current.animate(phase,mode);camera.position.set(Math.sin(yaw)*distance,target+Math.sin(pitch)*distance,Math.cos(yaw)*distance);camera.lookAt(0,target,0);renderer.render(scene,camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;loading.hidden=false;loading.textContent='3D 顯示中斷，請重新整理；不影響任何正式資料。';});
 const wanted=roster.findIndex(r=>r[0]===location.hash.slice(1));await select(wanted<0?0:wanted);
}
