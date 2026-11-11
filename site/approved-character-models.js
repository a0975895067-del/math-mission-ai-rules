import {continuousSkin} from './dino-continuous-skin.js';
// Each silhouette has its own construction. No external assets, accounts or unlock records.
export function makeCharacter(T,scene,entry){
 const [code,name,kind,color]=entry;if(!/^A(?:[2-9]|10)$/.test(code))throw new Error('Unapproved character');const root=new T.Group();scene.add(root);
 const material=(c,r=.65)=>new T.MeshStandardMaterial({color:c,roughness:r});
 const base=material(color),accent=material(new T.Color(color).multiplyScalar(.66)),light=material('#f3e2bf'),eyeMat=material('#273d3c',.25),leafMat=material('#6e9e67');
 const body=new T.Group();body.position.y=1;root.add(body);const sources=[],limbs=[],wings=[],tails=[],details=[];
 const sphere=new T.SphereGeometry(1,32,24);
 function group(p,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g;}
 function ball(p,x,y,z,a,b,c,m=base,merge=m===base){const o=new T.Mesh(sphere,m);o.position.set(x,y,z);o.scale.set(a,b,c);o.castShadow=true;o.receiveShadow=true;p.add(o);if(merge)sources.push(o);return o;}
 function tube(p,points,r,m=base){const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),o=new T.Mesh(new T.TubeGeometry(curve,40,r,10,false),m);o.castShadow=true;p.add(o);return o;}
 function eye(p,x,y,z,r=.065){ball(p,x,y,z,r,r*1.1,r*.55,eyeMat);ball(p,x-r*.22,y+r*.3,z+r*.5,r*.23,r*.26,r*.14,light);}
 function face(p,x,y,z,r=.065){eye(p,-x,y,z,r);eye(p,x,y,z,r);tube(p,[[-.035,y-.12,z+.015],[0,y-.132,z+.025],[.035,y-.12,z+.015]],.009,eyeMat);}
 function cone(p,x,y,z,r,h,m=light,rx=0,rz=0){const o=new T.Mesh(new T.ConeGeometry(r,h,16),m);o.position.set(x,y,z);o.rotation.set(rx,0,rz);o.castShadow=true;p.add(o);return o;}
 function limb(x,y,z,len=.5,width=.15){const g=group(body,x,y,z);ball(g,0,-len*.3,0,width,len*.45,width);ball(g,0,-len*.8,.07,width*.8,len*.22,width*.95);ball(g,0,-len,.12,width*1.15,.11,width*1.5);limbs.push(g);return g;}
 function blade(p,x,y,z,a,b,c,m=accent,angle=0){const o=ball(p,x,y,z,a,b,c,m,false);o.rotation.z=angle;return o;}
 function tail(points,r=.17,m=base){const g=group(body),curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),geo=new T.TubeGeometry(curve,40,r,10,false),a=geo.attributes.position;for(let j=0;j<=40;j++){const c=curve.getPointAt(j/40),scale=Math.max(.015,Math.pow(1-j/40,.75));for(let k=0;k<=10;k++){const i=j*11+k;a.setXYZ(i,c.x+(a.getX(i)-c.x)*scale,c.y+(a.getY(i)-c.y)*scale,c.z+(a.getZ(i)-c.z)*scale);}}geo.computeVertexNormals();const mesh=new T.Mesh(geo,m);mesh.castShadow=true;g.add(mesh);tails.push(g);return g;}
 function quad(y=-.2,z=.48){for(const s of [-1,1])for(const t of [-1,1])limb(s*.46,y,t*z,.55,.2);}
 let description='',motion='step';
 if(kind==='mantis'){
  ball(body,0,.15,0,.2,.7,.24);ball(body,0,.81,.07,.35,.22,.26);face(body,.23,.83,.28,.075);for(const s of [-1,1]){limb(s*.17,-.35,-.08,.65,.065);const arm=group(body,s*.25,.45,.03);tube(arm,[[0,0,0],[s*.2,-.1,.1],[s*.34,.14,.2]],.07);blade(arm,s*.34,-.05,.2,.09,.38,.055,accent,-s*.25);wings.push(arm);tube(body,[[s*.15,.95,.03],[s*.24,1.2,0],[s*.3,1.35,.1]],.018,accent);}description='修長螳螂輪廓、葉刃前臂；交叉前臂防守。';
 }else if(kind==='boar'||kind==='goat'){
  ball(body,0,0,0,.58,.47,.8);const h=group(body,0,.05,.67);ball(h,0,0,.07,.34,.3,.42);ball(h,0,-.03,.38,.25,.19,.18);face(h,.2,.1,.44,.045);quad();
  for(const s of [-1,1]){blade(h,s*.29,.27,.02,.11,.21,.07,base,s*.6);if(kind==='boar'){tube(h,[[s*.23,-.13,.43],[s*.37,-.02,.49],[s*.33,.15,.45]],.065,light);for(let i=0;i<7;i++)cone(body,0,.43,-.55+i*.17,.1,.26,accent,-.4);}else{const pts=[];for(let i=0;i<30;i++){const a=i/29*Math.PI*1.7;pts.push([s*(.23+Math.sin(a)*.22),.31+Math.cos(a)*.28,.02-i*.003]);}tube(h,pts,.075,accent);cone(h,0,-.3,.24,.12,.28,light,Math.PI);}}tail([[0,.06,-.69],[0,.23,-.94],[.12,.17,-1.04]],.055);description=kind==='boar'?'短腿、獠牙與背鬃；低頭蓄力。':'山羊肩背、雙螺旋角與鬍鬚；停步觀察。';
 }else if(kind==='crab'||kind==='scorpion'||kind==='beetle'){
  body.position.y=.65;ball(body,0,0,0,kind==='crab'?.67:.39,.28,kind==='scorpion'?.65:.45);face(body,.19,.12,.42,.05);
  for(const s of [-1,1]){for(let i=0;i<3;i++){const leg=group(body,s*.31,-.05,-.32+i*.3);tube(leg,[[0,0,0],[s*.38,.03,.15],[s*.52,-.49,.25]],.047);limbs.push(leg);}if(kind==='beetle'){tube(body,[[s*.17,.02,.4],[s*.32,.06,.78],[s*.13,.14,1.05]],.075,accent);cone(body,s*.25,.04,.78,.06,.2,accent,0,-s*1.1);}else{const claw=group(body,s*.45,.02,.32);tube(claw,[[0,0,0],[s*.21,.04,.2],[s*.25,.12,.44]],.1);ball(claw,s*.25,.12,.46,s<0?.23:.18,.19,.24);cone(claw,s*.17,.12,.65,.085,.29,accent,Math.PI/2);cone(claw,s*.36,.12,.62,.07,.24,accent,Math.PI/2);wings.push(claw);}}
  if(kind==='scorpion'){const g=tail([[0,.06,-.53],[0,.3,-.87],[0,.91,-.79],[0,1.2,-.35],[0,1.02,.02]],.105);cone(g,0,1.0,.09,.13,.29,accent,Math.PI/2);}
  if(kind==='beetle'){ball(body,0,.15,-.06,.35,.24,.4,accent);tube(body,[[0,.4,-.38],[0,.42,0],[0,.32,.28]],.012,light);}description='甲殼、細足與獨立前肢；各足交替移動，非整體平移。';
 }else if(kind==='falcon'||kind==='bird'||kind==='moth'){
  motion='fly';body.position.y=1.45;ball(body,0,0,0,.24,.43,.27);ball(body,0,.38,.1,.25,.25,.25);face(body,.135,.4,.3,.05);
  for(const s of [-1,1]){const wing=group(body,s*.17,.18,0);wings.push(wing);if(kind==='moth'){blade(wing,s*.42,.17,0,.51,.41,.055,accent,s*.4);blade(wing,s*.28,-.26,0,.34,.3,.05,base,-s*.4);ball(wing,s*.45,.2,.06,.13,.14,.025,light);tube(body,[[s*.08,.6,.12],[s*.15,.81,.08],[s*.25,.84,.14]],.015,accent);}else{for(let i=0;i<7;i++)blade(wing,s*(.18+i*.09),-.025-i*.035,-i*.065,.12,.38-i*.02,.045,i%2?base:accent,-s*(.55+i*.06));limb(s*.1,-.3,.08,.27,.04);cone(body,0,.35,.39,.09,.22,accent,Math.PI/2);}}
  if(kind!=='moth')for(let i=-1;i<=1;i++)blade(body,i*.12,-.36,-.3,.09,kind==='bird'?.66:.36,.045,accent,.15*i);description='展翼、收翼與翅膀擺動；飛行輪廓不使用四足骨架。';
 }else if(kind==='snake'||kind==='seahorse'){
  motion='float';body.position.y=.35;
  const pts=kind==='snake'?[[.65,0,.2],[.3,0,.55],[-.45,0,.45],[-.62,.1,-.16],[0,.3,-.4],[.2,.75,-.08],[.15,1.25,.15]]:[[.2,.18,.25],[-.18,.1,.17],[-.26,.32,.12],[.08,.45,0],[.2,.85,0],[0,1.3,.1],[0,1.65,.12]];
  for(let i=0;i<pts.length;i++)ball(body,...pts[i],.17,.28,.19);tube(body,pts,.18);const end=pts.at(-1),h=group(body,...end);ball(h,0,.05,.08,.23,.22,.29);face(h,.13,.11,.28,.05);if(kind==='seahorse'){ball(h,0,-.04,.37,.08,.08,.24);for(let i=0;i<4;i++)blade(body,.2,.7+i*.14,-.22,.05,.13,.19,accent,.3);}else{for(let i=0;i<5;i++)blade(body,.18,.55+i*.15,-.21,.07,.15,.2,accent,.2);}description='長身曲線與捲尾輪廓；緩慢游動和擺頭。';
 }else if(kind==='gecko'){
  body.position.y=.45;ball(body,0,0,0,.35,.17,.66);ball(body,0,.04,.62,.31,.19,.28);face(body,.23,.15,.76,.05);
  for(const s of [-1,1])for(const z of [-1,1]){const l=group(body,s*.27,0,z*.36);tube(l,[[0,0,0],[s*.22,-.08,.08],[s*.35,-.28,.16]],.065);for(let j=-2;j<=2;j++)tube(l,[[s*.35,-.28,.16],[s*(.44+Math.abs(j)*.015),-.3,.16+j*.09]],.023);limbs.push(l);}tail([[0,0,-.55],[.15,.04,-.9],[-.1,.09,-1.19],[.13,.12,-1.45]],.09);description='扁身、張開的腳趾與長尾；貼近地面移動。';

 }
 let skin=null;if(sources.length){body.updateWorldMatrix(true,true);const box=new T.Box3(),inv=body.matrixWorld.clone().invert();for(const s of sources){s.geometry.computeBoundingBox();const b=s.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inv,s.matrixWorld));box.union(b);}box.expandByScalar(.2);skin=continuousSkin(T,body,sources,base,{lo:box.min.toArray(),hi:box.max.toArray(),step:.08});
 const g=skin.mesh.geometry;g.setAttribute('restSurface',g.attributes.position.clone());const m=base.clone();m.customProgramCacheKey=()=>`roster-${kind}`;m.onBeforeCompile=sh=>{sh.vertexShader='attribute vec3 restSurface; varying vec3 vRestSurface;\n'+sh.vertexShader;sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRestSurface=restSurface;');sh.fragmentShader='varying vec3 vRestSurface;\n'+sh.fragmentShader;sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat grain=sin(vRestSurface.x*143.0)*sin(vRestSurface.y*159.0+vRestSurface.z*107.0);diffuseColor.rgb*=.97+grain*.025;\n`+(code[0]==='D'?'float stripe=smoothstep(.6,.85,sin(vRestSurface.z*13.0+vRestSurface.y*3.0))*smoothstep(0.0,.4,vRestSurface.y);diffuseColor.rgb*=1.0-stripe*.25;':''));};skin.mesh.material=m;}
 const baseY=body.position.y;
 function animate(t,mode){root.position.set(0,0,0);root.rotation.y=0;body.position.y=baseY;body.rotation.set(0,0,0);body.scale.set(1,1,1);const moving=mode==='walk',attack=mode==='attack',guard=mode==='guard',pulse=Math.max(0,Math.sin((t%4)/4*Math.PI*2));
 body.position.y+=Math.sin(t*1.5)*.01;if(motion==='float'||motion==='fly')body.position.y+=Math.sin(t*1.7)*.07;
 limbs.forEach((l,i)=>{l.rotation.x=moving?Math.sin(t*4+i*Math.PI)*.22:0;});
 wings.forEach((w,i)=>{w.rotation.x=guard?-.55:attack?-pulse*.6:0;w.rotation.z=(motion==='fly'?Math.sin(t*4)*.22:Math.sin(t*1.6)*.035)*(i%2?1:-1);if(kind==='shell')w.rotation.x=guard?1.3:attack?-pulse*.25:.1;});
 tails.forEach((ta,i)=>ta.rotation.y=Math.sin(t*1.5+i)*.06);
 if(moving){root.position.z=Math.sin(t*.6)*.18;if(motion==='wobble')body.rotation.z=Math.sin(t*3)*.07;if(motion==='crawl')body.scale.z=1+Math.sin(t*2)*.018;}
 if(attack){body.rotation.x=-pulse*.1;body.position.y-=pulse*.035;if(motion==='fly'||motion==='float')root.position.z=pulse*.22;}
 if(guard){body.position.y-=.04;body.rotation.x=.07;}
 if(mode==='hurt'){body.rotation.z=Math.sin(t*11)*.035;root.position.z=-Math.max(0,Math.sin(t*3))*.07;}
 details.forEach((d,i)=>d.scale.y=1+Math.sin(t*2-i*.5)*(attack?.06:.015));if(skin)skin.update();}
 return {root,animate,description};
}
