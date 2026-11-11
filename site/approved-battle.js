import * as T from './vendor-three/three.module.min.js';
import {roster} from './character-roster-3d.js';
import {orangeDino} from './orange-dino-v2.js';
import {prototypes} from './character-organic-prototypes.js';
import {makeCharacter} from './character-remaining-models.js';
import {createImpactBackground} from './battle-impact-background.js?v=20261102-paired-season-scenes';
import {createCinematicFX,battlePose,contactMoves} from './battle-cinematic-fx.js';
import {createBattleEnvironment} from './battle-environment.js';
import {characterHabitatForSeason,habitats} from './character-habitats.js';
import {resolvePairScene} from './pair-battle-scenes.js';
export function createBattle(thumbnails){
 const scene=new T.Scene();scene.background=new T.Color('#dce8da');
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const camera=new T.PerspectiveCamera(38,1,.1,60);camera.position.set(0,4,14);camera.lookAt(0,1,0);
 scene.add(new T.HemisphereLight('#fff6db','#769177',2.5));const sun=new T.DirectionalLight('#fff4d6',2.6);sun.position.set(-3,9,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;sun.shadow.normalBias=.04;scene.add(sun);
 const environment=createBattleEnvironment(T,scene);
 const wrapper=document.createElement('div');wrapper.style.cssText='position:absolute;inset:0';wrapper.append(renderer.domElement);
 const impact=createImpactBackground(T,scene,camera,wrapper);
 let seasonChoice='spring',environmentMode='pair',manualHabitat='forest',foeChoice=null,allyChoice=null,environmentReason='';
 function refreshEnvironment(){let profile=characterHabitatForSeason(environmentMode==='ally'?allyChoice:foeChoice,seasonChoice),ally=characterHabitatForSeason(allyChoice,seasonChoice),foe=characterHabitatForSeason(foeChoice,seasonChoice);const pair=resolvePairScene(allyChoice,foeChoice,seasonChoice);if(environmentMode==='pair')profile={...profile,habitat:pair.habitat};if(environmentMode==='manual')profile={...profile,habitat:manualHabitat};environmentReason=environmentMode==='pair'?pair.reason:environmentMode==='manual'?'手動固定場地':`依${profile.name}的當季路線`;const palette=environment.setSeason(seasonChoice,profile,ally,foe);impact.setBaseColor(palette.sky);wrapper.dataset.environment=environment.season;wrapper.dataset.habitat=profile.habitat;return {season:seasonChoice,habitat:profile.habitat,mode:environmentMode};}
 function setSeason(season){seasonChoice=season;return refreshEnvironment();}
 function setEnvironmentMode(mode,habitat){environmentMode=['ally','manual','foe'].includes(mode)?mode:'pair';manualHabitat=Object.hasOwn(habitats,habitat)?habitat:'forest';return refreshEnvironment();}
 setSeason(['spring','summer','autumn','winter'].find(s=>document.body.classList.contains(s))||'spring');
 const cinematic=createCinematicFX(T,scene);
 const caption=document.createElement('div');caption.className='battle-action-caption';caption.setAttribute('aria-live','polite');wrapper.append(caption);
 let host=null,fighters=[],clock=0,last=performance.now(),event=null,phase=5,baseCameraZ=14;
 const ring=new T.Mesh(new T.TorusGeometry(.6,.06,8,40),new T.MeshBasicMaterial({color:'#ffcd75',transparent:true}));scene.add(ring);ring.visible=false;
 const shot=new T.Mesh(new T.SphereGeometry(.18,12,10),new T.MeshBasicMaterial({color:'#ffcd75'}));scene.add(shot);shot.visible=false;
 function dispose(f){const g=new Set(),m=new Set();f.anchor.traverse(o=>{if(o.geometry)g.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(x=>m.add(x));});scene.remove(f.anchor);g.forEach(x=>x.dispose());m.forEach(x=>x.dispose());}
 function build(id,side){const i=Number(id?.slice(-2))-1,entry=roster[i];if(!entry)return null;const anchor=new T.Group(),facing=new T.Group();anchor.add(facing);scene.add(anchor);facing.rotation.y=side?-Math.PI/2:Math.PI/2;facing.scale.setScalar(.78);let model;
  if(['rock','jelly','moss'].includes(entry[2])){const p=prototypes(T,facing),k={rock:0,jelly:1,moss:2}[entry[2]];p.select(k);model={animate:(t,m)=>p.animate(t,m,k)};}else model=entry[2]==='rex'?orangeDino(T,facing):makeCharacter(T,facing,entry);
  anchor.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});anchor.position.x=side?3:-3;return {id,entry,anchor,facing,model,side};}
 function resize(){if(!host?.isConnected)return;const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;baseCameraZ=camera.aspect<1.3?19:13;camera.position.z=baseCameraZ;camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(resize);
 function attach(next,state,effect){if(host!==next){observer.disconnect();host=next;host.replaceChildren(wrapper);observer.observe(host);}const ids=[state.activeAllyId,state.opponentId];
  impact.mountControls(host);
  allyChoice=ids[0];foeChoice=ids[1];refreshEnvironment();
  for(let side=0;side<2;side++){if(fighters[side]?.id!==ids[side]){if(fighters[side])dispose(fighters[side]);fighters[side]=build(ids[side],side);}}
  event=effect?{side:effect.side==='foe'?1:0,damage:effect.side==='foe'?30:state.records.at(-1)?.damage||0,guard:!!effect.guarded,style:effect.style}:null;phase=effect?0:5;resize();
 }
 const smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
 function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.06);last=now;if(!host?.isConnected||host.offsetParent===null||document.hidden||window.MathModeFrameActive===false)return;clock+=dt;phase+=dt;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,p=phase,e=p<3.3&&!reduced?event:null;
  fighters.forEach((f,i)=>{if(!f)return;const sign=i?-1:1,pose=e?battlePose(p,i===e.side,e.guard,contactMoves.has(e.style)):{mode:'idle',advance:0,lift:0,lean:0};
   f.model.animate(pose.mode==='attack'?p-.25:reduced?0:clock,pose.mode);f.anchor.position.x=(i?3:-3)+sign*pose.advance;f.anchor.position.y=pose.lift;f.anchor.rotation.z=-sign*pose.lean;
  });
  environment.update(clock,reduced);camera.position.z=baseCameraZ-(e?.damage?Math.sin(Math.min(p/3.3,1)*Math.PI)*.55:0);
  const target=e?fighters[1-e.side]:null;impact.update(e,p,target?.anchor.position);cinematic.update(e,p,fighters,reduced);ring.visible=false;shot.visible=false;
  const text=e?(p<.72?'蓄力準備':p<2?(window.MathCombatEffects?.moves[e.style]?.name||'原創招式'):p<2.85?(e.guard?'護盾格擋':`命中 · ${e.damage}`):'回到站位'):'';if(caption.textContent!==text)caption.textContent=text;
  if(target){const color=window.MathCombatEffects?.moves[e.style]?.color||'#ffcd75';ring.material.color.set(color);shot.material.color.set(color);if(ring.visible){ring.position.set(target.anchor.position.x,1.1,.2);ring.scale.setScalar(.6+(p-2)*2);ring.material.opacity=1-(p-2)/.65;}if(shot.visible){const from=fighters[e.side];if(from)shot.position.set(T.MathUtils.lerp(from.anchor.position.x,target.anchor.position.x,(p-1.3)/.7),1.1+Math.sin((p-1.3)*5)*.15,0);}}
  renderer.render(scene,camera);
 }
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();if(host){const note=document.createElement('p');note.textContent='3D 顯示暫停，仍可繼續作答與儲存報告。';host.append(note);}});
 function portraits(ids){for(const id of ids){if(thumbnails.has(id))continue;const f=build(id,0);if(!f)continue;fighters.forEach(x=>{if(x)x.anchor.visible=false;});f.anchor.position.x=0;f.facing.rotation.y=.55;f.model.animate(0,'idle');const c=new T.PerspectiveCamera(36,180/140,.1,60);c.position.set(0,2.5,6.8);c.lookAt(0,1,0);renderer.setSize(180,140,false);renderer.render(scene,c);thumbnails.set(id,renderer.domElement.toDataURL('image/png'));dispose(f);fighters.forEach(x=>{if(x)x.anchor.visible=true;});}resize();}
 const themeObserver=new MutationObserver(()=>{const theme=['spring','summer','autumn','winter'].find(s=>document.body.classList.contains(s));if(theme)setSeason(theme);});themeObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
 requestAnimationFrame(frame);return {attach,portraits,setSeason,setEnvironmentMode,get environment(){return {season:seasonChoice,mode:environmentMode,habitat:wrapper.dataset.habitat,reason:environmentReason};}};
}
