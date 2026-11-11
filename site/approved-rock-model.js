// Approved A1 model only.
import {continuousSkin} from './dino-continuous-skin.js';
export function prototypes(T,scene){
 const roots=[],rigs=[];
 const mat=(color,roughness=.65)=>new T.MeshStandardMaterial({color,roughness});
 const rock=mat('#667c81'),gold=mat('#d5b36b'),ivory=mat('#fff3d2'),dark=mat('#283b40'),stone=mat('#b6b4a0'),moss=mat('#648b48');
 const sphere=new T.SphereGeometry(1,32,24);
 const group=(p,x=0,y=0,z=0)=>{const g=new T.Group();g.position.set(x,y,z);p.add(g);return g;};
 function mesh(p,geo,m,x=0,y=0,z=0){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
 function ball(p,m,x,y,z,a,b,c){const o=mesh(p,sphere,m,x,y,z);o.scale.set(a,b,c);return o;}
 function eyes(p,spread,y,z,r){for(const s of [-1,1]){ball(p,dark,s*spread,y,z,r,r*1.12,r*.55);ball(p,ivory,s*spread-r*.24,y+r*.35,z+r*.45,r*.23,r*.26,r*.12);}}
 function coating(skin,kind){const g=skin.mesh.geometry;g.setAttribute('surfaceRest',g.attributes.position.clone());const m=skin.mesh.material.clone();m.customProgramCacheKey=()=>`organic-${kind}-1`;
 m.onBeforeCompile=s=>{s.vertexShader='attribute vec3 surfaceRest; varying vec3 vSurface;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSurface=surfaceRest;');s.fragmentShader='varying vec3 vSurface;\n'+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float grain=sin(vSurface.x*177.0+sin(vSurface.z*68.0))*sin(vSurface.y*201.0+vSurface.z*171.0);
 diffuseColor.rgb*=.96+grain*.035;
 `+(kind==='rock'?`float vein=pow(1.0-abs(sin(vSurface.z*9.0+sin(vSurface.x*11.0)*.8+vSurface.y*4.0)),18.0);diffuseColor.rgb*=1.0-vein*.19;`:`float mossPatch=sin(vSurface.x*9.0+sin(vSurface.z*8.0))*sin(vSurface.z*11.0+vSurface.y*6.0);float moss=smoothstep(.22,.48,vSurface.y+mossPatch*.12);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.16,.29,.065),moss*.85);`));};skin.mesh.material=m;}
 // A1: unified quadruped surface with low, embedded armor plates.
 let root=group(scene),body=group(root,0,.93,0);roots.push(root);const sources=[];
 const rb=(p,x,y,z,a,b,c)=>{const o=ball(p,rock,x,y,z,a,b,c);sources.push(o);return o;};
 rb(body,0,.02,0,.78,.52,.91);const head=group(body,0,.08,.69);rb(head,0,0,.13,.45,.32,.44);rb(head,0,-.09,.39,.33,.22,.3);eyes(head,.24,.075,.505,.064);
 for(const sign of [-1,1]){const brow=ball(head,rock,sign*.24,.17,.5,.17,.055,.085);brow.rotation.z=sign*.23;}
 const legs=[];
 for(const x of [-1,1])for(const z of [-1,1]){const hip=group(body,x*.57,-.14,z*.55);rb(hip,0,-.14,0,.27,.3,.3);const knee=group(hip,0,-.3,.01);rb(knee,0,-.09,0,.2,.23,.21);const paw=group(knee,0,-.23,.065);rb(paw,0,0,.04,.25,.145,.3);for(let n=-1;n<=1;n++)ball(paw,gold,n*.12,-.01,.285,.045,.045,.065);legs.push({hip,knee,paw});}
 const skin=continuousSkin(T,body,sources,rock,{lo:[-1.2,-1.15,-1.2],hi:[1.2,.85,1.65]});coating(skin,'rock');
 for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++){const plate=mesh(body,new T.IcosahedronGeometry(1,1),rock,x*.4,.4-Math.abs(x)*.05,z*.42);plate.scale.set(.28,.115,.32);plate.rotation.z=-x*.22;}
 for(const x of [-1,1]){const crest=mesh(body,new T.ConeGeometry(.1,.27,6),gold,x*.42,.55,-.22);crest.rotation.z=-x*.25;}
 rigs.push({root,body,head,legs,skin});
 const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 return {select(i){roots.forEach((r,j)=>r.visible=i===j);},animate(t,mode,i){const r=rigs[i];if(!r)return;r.root.position.set(0,0,0);r.root.rotation.set(0,0,0);r.body.rotation.set(0,0,0);r.body.scale.set(1,1,1);
 if(i===0){r.body.position.y=.93+Math.sin(t*1.6)*.009;r.head.rotation.set(Math.sin(t*.8)*.02,Math.sin(t*.6)*.07,0);r.legs.forEach(l=>{l.hip.rotation.x=0;l.knee.rotation.x=0;l.paw.rotation.x=0;});
 if(mode==='walk'){const phase=t%6,move=Math.min(phase,4.5),angle=(Math.floor(t/6)*4.5+move)*.25;r.root.position.set((1-Math.cos(angle))*.4,0,Math.sin(angle)*.4);r.root.rotation.y=angle;
 if(phase<4.5)r.legs.forEach((l,k)=>{const p=(move/1.4+[0,.75,.5,.25][k])%1,sw=p<.3,a=sw?ease(p/.3):1-(p-.3)/.7;l.hip.rotation.x=(a-.5)*.32;l.knee.rotation.x=sw?Math.sin(p/.3*Math.PI)*.36:0;l.paw.rotation.x=-l.hip.rotation.x-l.knee.rotation.x;});else r.head.rotation.y=Math.sin((phase-4.5)*2)*.2;}
 if(mode==='attack'){const a=t%4.5,load=ease(a/.7)*(1-ease((a-.8)/.4)),strike=ease((a-.8)/.3)*(1-ease((a-1.3)/.8));r.body.position.y-=load*.06;const l=r.legs[1];l.hip.rotation.x=-strike*.6;l.knee.rotation.x=strike*.18;l.paw.rotation.x=strike*.28;r.body.rotation.z=strike*.04;r.head.rotation.x=-strike*.07;}
 if(mode==='guard'){r.head.rotation.x=.15;r.body.position.y-=.045;r.legs.forEach(l=>{l.hip.rotation.x=-.1;l.knee.rotation.x=.2;l.paw.rotation.x=-.1;});}}
 if(mode==='hurt'){r.body.rotation.z=Math.sin(t*11)*.035;r.root.position.z=-Math.max(0,Math.sin(t*3))*.08;}
 if(r.skin)r.skin.update();
 }};
}
