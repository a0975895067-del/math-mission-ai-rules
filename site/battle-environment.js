import {createBattleTerrain} from './battle-terrain.js';
// Original low-poly scenery. Geometry lives behind the combat lane; no game state.
export const battleSeasons={
 spring:{name:'花溪森林',sky:'#bddfe0',ground:'#88ae74',leaf:'#94bc85',flower:'#edbad2',rock:'#8b9f94'},
 summer:{name:'晴海棕櫚灣',sky:'#a9dbe9',ground:'#dfd2a6',leaf:'#589d78',flower:'#f2cd80',rock:'#8ea9aa'},
 autumn:{name:'楓林山徑',sky:'#e9cfb0',ground:'#bcaa78',leaf:'#c47747',flower:'#e3ad59',rock:'#9b9586'},
 winter:{name:'雪峰松林',sky:'#cbdce9',ground:'#e4edf1',leaf:'#627f83',flower:'#edf4f6',rock:'#9baebf'}
};
export function createBattleEnvironment(T,scene){
 const root=new T.Group();root.name='seasonal-battle-environment';scene.add(root);let current='',palette=null,clouds=[],drifters=[],signature='',activeHabitat='forest',terrain=null;
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.95,...extra});
 function mesh(geometry,color,x,y,z,sx=1,sy=1,sz=1,parent=root){const o=new T.Mesh(geometry,material(color));o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const ball=(color,x,y,z,sx,sy,sz,parent)=>mesh(new T.IcosahedronGeometry(1,1),color,x,y,z,sx,sy,sz,parent);
 function tree(x,z,size,index){
  const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(size);root.add(g);
  mesh(new T.CylinderGeometry(.14,.23,2.5,7),'#786750',0,1.2,0,1,1,1,g);
  if(current==='winter'){
   for(let i=0;i<3;i++){mesh(new T.ConeGeometry(1.3-i*.23,1.6,8),palette.leaf,0,1.7+i*.65,0,1,1,1,g);mesh(new T.ConeGeometry(1.15-i*.23,.95,8),'#e8f0f3',0,2.03+i*.65,0,1,1,1,g);}
  }else if(activeHabitat==='shore'&&current==='summer'){
   for(let i=0;i<6;i++){const a=i*Math.PI/3,l=ball(palette.leaf,Math.cos(a)*.7,2.4,Math.sin(a)*.7,1.1,.15,.35,g);l.rotation.y=-a;l.rotation.z=Math.cos(a)*.3;}
   ball('#ad8958',.1,2.25,.15,.2,.22,.2,g);
  }else{
   for(let i=0;i<4;i++){const a=i*2.4;ball(current==='spring'&&i%2===0?palette.flower:i%2?palette.leaf:palette.flower,Math.cos(a)*.55,2.3+(i%2)*.55,Math.sin(a)*.45,1,.85,.9,g);}
  }
 }
 function clear(){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});root.clear();geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());clouds=[];drifters=[];}
 function landmark(profile,x,z){
  if(!profile)return;const color=profile.color||palette.flower,g=new T.Group();g.name='landmark-'+profile.code;g.position.set(x,0,z);g.rotation.y=x<0?.35:-.35;root.add(g);const motif=profile.motif,v=profile.variant||0;
  if(['crystal','storm','star','lantern'].includes(motif)){
   for(let i=0;i<3;i++){const h=1+(i+v)%3*.4;const c=mesh(new T.ConeGeometry(.3,h,5),color,(i-1)*.6,h/2,0,1,1,1,g);c.rotation.z=(i-1)*.18;}
   if(motif==='star'){const r=mesh(new T.TorusGeometry(.7,.12,6,5),color,0,1.8,0,1,1,1,g);r.rotation.z=.3;}
   if(motif==='lantern'){mesh(new T.CylinderGeometry(.05,.05,2.8,6),'#82735e',0,1.4,0,1,1,1,g);ball('#f5d698',0,2.2,0,.45,.6,.45,g);}
  }else if(['leaf','feather','reed'].includes(motif)){
   for(let i=0;i<5;i++){const a=i*1.25;mesh(new T.CylinderGeometry(.035,.05,1.7,5),palette.leaf,Math.cos(a)*.6,.8,Math.sin(a)*.4,1,1,1,g);const l=ball(motif==='feather'?color:palette.leaf,Math.cos(a)*.9,1.1+i%2*.4,Math.sin(a)*.5,.22,.75,.12,g);l.rotation.z=-Math.cos(a)*.7;}
  }else if(['shell','coral','bubble'].includes(motif)){
   for(let i=0;i<5;i++){const a=i*.8-.3;const o=ball(color,(i-2)*.35,.3+Math.sin(i)*.1,0,motif==='coral'?.12:.32,motif==='coral'?.8:.3,.26,g);o.rotation.z=a-.9;}
   if(motif==='shell')ball('#f4e7cd',0,.45,.15,.2,.2,.2,g);
  }else if(motif==='mushroom'){
   for(let i=0;i<3;i++){mesh(new T.CylinderGeometry(.12,.19,.8,8),'#eee2bf',(i-1)*.65,.4,0,1,1,1,g);ball(color,(i-1)*.65,.9,0,.52,.25,.52,g);}
  }else if(motif==='flower'){
   for(let i=0;i<4;i++){const xx=(i-1.5)*.45,yy=.7+i%2*.35;mesh(new T.CylinderGeometry(.025,.035,yy,5),palette.leaf,xx,yy/2,0,1,1,1,g);for(let j=0;j<5;j++)ball(color,xx+Math.cos(j*1.26)*.16,yy+Math.sin(j*1.26)*.16,0,.15,.15,.07,g);ball('#f1d683',xx,yy,.05,.1,.1,.1,g);}
  }else if(['tea','pastry'].includes(motif)){
   mesh(new T.CylinderGeometry(1,1,.15,12),'#b6946b',0,.45,0,1,1,1,g);mesh(new T.CylinderGeometry(.13,.2,.4,8),'#947456',0,.2,0,1,1,1,g);
   for(let i=0;i<3;i++){const xx=(i-1)*.5;mesh(new T.CylinderGeometry(.2,.17,.3,10),color,xx,.68,0,1,1,1,g);if(motif==='tea'){const r=mesh(new T.TorusGeometry(.12,.035,6,12),color,xx+.2,.7,0,1,1,1,g);r.rotation.y=.1;}else ball('#f4dfb0',xx,.86,0,.22,.09,.22,g);}
  }else if(motif==='acorn'){
   for(let i=0;i<3;i++){ball('#ac7b48',(i-1)*.5,.35,0,.25,.35,.25,g);ball('#795b3e',(i-1)*.5,.57,0,.3,.13,.3,g);}
  }else if(motif==='log'){
   const log=mesh(new T.CylinderGeometry(.5,.6,2,10),'#8f7657',0,.4,0,1,1,1,g);log.rotation.z=Math.PI/2;const r=mesh(new T.TorusGeometry(.36,.12,6,14),'#b59c75',1,.4,0,1,1,1,g);r.rotation.y=Math.PI/2;
  }else if(motif==='cloud'){
   for(let i=0;i<4;i++)ball('#e4e9e4',(i-1.5)*.4,1.6+Math.sin(i)*.2,0,.55,.4,.35,g);
  }else if(motif==='fossil'){
   const arch=mesh(new T.TorusGeometry(.85,.12,6,12,Math.PI),'#d8c7a4',0,.55,0,1,1,1,g);for(let i=0;i<3;i++)ball('#a8a292',(i-1)*.65,.13,.1,.5,.22,.3,g);
  }else{for(let i=0;i<3;i++)ball(color,(i-1)*.6,.3+i%2*.2,0,.45,.4,.4,g);}
 }
 function setSeason(value,profile=null,ally=null,foe=null){
  const key=battleSeasons[value]?value:'spring',nextSignature=[key,profile?.habitat,profile?.code,ally?.code,foe?.code].join(':');if(signature===nextSignature)return palette;clear();signature=nextSignature;current=key;activeHabitat=profile?.habitat||'forest';palette={...battleSeasons[key]};
  if(activeHabitat==='highland')palette.ground=current==='winter'?'#dce6eb':'#a4a58d';if(activeHabitat==='grove'){palette.sky=current==='winter'?'#c9d9df':'#c5d2cb';palette.ground=current==='winter'?'#e0e8e5':'#879980';}if(activeHabitat==='ruins')palette.ground=current==='winter'?'#e0e6ec':'#b3a995';
  scene.background=new T.Color(palette.sky);scene.fog=new T.Fog(palette.sky,24,65);
  terrain=createBattleTerrain(T,root,activeHabitat,current,palette);
  const treeCount={forest:12,highland:0,shore:current==='summer'?2:0,wetland:2,garden:3,grove:6,ruins:0,prehistoric:3}[activeHabitat]??0;
  for(let i=0;i<treeCount;i++){const side=i%2?-1:1,x=side*(8.5+(i%4)*1.3),z=-7-Math.floor(i/2)*2;tree(x,z,.85+i%3*.19,i);}
  if(activeHabitat==='prehistoric'){for(let i=0;i<8;i++){const side=i%2?1:-1;landmark({code:'fern'+i,motif:'leaf',color:palette.leaf,variant:i},side*(6.6+i%3),-3-i);}}
  if(activeHabitat==='grove'){for(let i=0;i<6;i++)landmark({code:'fungi'+i,motif:'mushroom',color:current==='winter'?'#d5dddd':'#b49ca6',variant:i},i%2?7:-7,-4-i*1.4);}
  if(activeHabitat==='garden'){for(let i=0;i<6;i++)landmark({code:'flowers'+i,motif:'flower',color:palette.flower,variant:i},i%2?7:-7,-3-i*1.6);}
  landmark(foe||profile,6.1,-2.5);landmark(ally,-6.1,-2.5);
  for(let i=0;i<(['highland','shore','wetland','ruins'].includes(activeHabitat)?0:14);i++){const side=i%2?-1:1,x=side*(6.3+i%5*1.1),z=2.7-Math.floor(i/2)*1.1;
   if(i%4===0)ball(palette.rock,x,.12,z,.45,.3,.36);else{
    const stem=mesh(new T.ConeGeometry(.14,.5,5),palette.leaf,x,.1,z);stem.rotation.z=(i%3-1)*.25;
    if(current!=='winter')ball(palette.flower,x,.35,z,.15,.1,.15);
   }
  }
  for(let i=0;i<5;i++){const g=new T.Group();g.position.set(-22+i*11,9+i%2*2,-24-i%3*4);root.add(g);for(let j=0;j<3;j++)ball('#f8f5e9',j*.8,Math.sin(j)*.3,0,1.4,.6,.65,g);clouds.push({g,x:g.position.x});}
  const sun=mesh(new T.SphereGeometry(1.5,16,12),'#fff1bf',13,11,-29);sun.material.emissive.set('#fff1bf');sun.material.emissiveIntensity=.6;sun.castShadow=false;
  for(let i=0;i<16;i++){const m=mesh(new T.OctahedronGeometry(.06,0),palette.flower,-12+i*1.6,2+i%4*.7,-5-i%5*.8);m.castShadow=false;drifters.push({m,x:m.position.x,y:m.position.y,z:m.position.z});}
  return palette;
 }
 function update(t,reduced=false){terrain?.update(t,reduced);if(reduced)return;for(const c of clouds)c.g.position.x=c.x+Math.sin(t*.035)*1.3;drifters.forEach((d,i)=>{d.m.position.set(d.x+Math.sin(t*.28+i)*.5,d.y-(t*.17+i*.13)%2.8,d.z+Math.cos(t*.2+i)*.2);d.m.rotation.set(t*.3,i,t*.2);});}
 return {setSeason,update,root,get season(){return current;}};
}
