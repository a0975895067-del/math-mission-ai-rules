// Presentation only: no answers, damage calculation or reward writes.
export const contactMoves=new Set(['dash','roll','petal']);
export function battlePose(p,attacker,guard=false,contact=false){
 const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
 if(attacker){
  const advance=contact?2.55*(ease((p-.72)/.85)-ease((p-2.3)/.8)):0;
  return {advance:advance-.18*Math.sin(clamp(p/.72)*Math.PI),lift:contact?.18*Math.sin(clamp((p-.8)/1.5)*Math.PI):0,lean:p<.72?-.06*Math.sin(p/.72*Math.PI):p<2?.07:0,mode:p<.72?'guard':p<1.3?(contact?'walk':'attack'):p<2.2?'attack':p<3.1&&contact?'walk':'idle'};
 }
 const t=clamp((p-2)/.8),hit=p>=2&&p<2.8;
 return {advance:hit&&!guard?-.4*Math.sin(t*Math.PI):0,lift:0,lean:hit&&!guard?-.12*Math.sin(t*Math.PI):0,mode:p>=1.5&&p<2.85?(guard?'guard':hit?'hurt':'idle'):'idle'};
}
export function createCinematicFX(T,scene){
 const group=new T.Group();scene.add(group);
 const sphere=new T.SphereGeometry(1,10,8),leaf=new T.OctahedronGeometry(1,0),flame=new T.ConeGeometry(1,3,7),ringGeo=new T.TorusGeometry(1,.045,6,40);
 const material=color=>new T.MeshBasicMaterial({color,transparent:true,opacity:0,depthWrite:false});
 const particles=Array.from({length:30},()=>{const m=new T.Mesh(sphere,material('#ffd188'));group.add(m);return m;});
 const aura=new T.Mesh(ringGeo,material('#ffd188'));group.add(aura);
 const shield=new T.Mesh(new T.SphereGeometry(1,22,14),new T.MeshBasicMaterial({color:'#94d6da',transparent:true,opacity:0,depthWrite:false,wireframe:true}));group.add(shield);
 const streak=new T.Mesh(new T.CylinderGeometry(.14,.28,1,10),material('#ffe3ab'));group.add(streak);
 const colors={flame:'#f89948',bubble:'#75cee3',ice:'#b1e0ef',leaf:'#9dc87a',petal:'#eda6c7',crystal:'#bda5eb',wind:'#b4e0d5',echo:'#c0a9df',thunder:'#ffdc79',beam:'#ffe0a0',dash:'#efc382',roll:'#c5a47e'};
 function update(e,p,fighters,reduced=false){
  for(const m of [...particles,aura,shield,streak])m.visible=false;
  if(!e||!e.damage||reduced)return;
  const a=fighters[e.side],d=fighters[1-e.side];if(!a||!d)return;
  const color=colors[e.style]||colors.dash,sign=e.side?-1:1,u=Math.max(0,Math.min(1,(p-1.3)/.7));
  const from=a.anchor.position.x+sign*.55,to=d.anchor.position.x-sign*.2;
  if(p<1.25){aura.visible=true;aura.position.set(from,1.2,.2);aura.scale.setScalar(.18+p*.32);aura.rotation.z=p*3;aura.material.color.set(color);aura.material.opacity=Math.sin(p/1.25*Math.PI)*.65;}
  if(e.guard&&p>1.5&&p<2.85){shield.visible=true;shield.position.set(d.anchor.position.x,1,0);shield.scale.set(1,1.3,1);shield.material.opacity=.2+.14*Math.sin(p*11);shield.rotation.y=p*.4;}
  const contact=contactMoves.has(e.style),burst=p>=2&&p<2.7;
  if(!contact&&p>=1.3&&p<2){
   particles.forEach((m,i)=>{const trail=Math.max(0,u-i*.012),angle=i*2.399;m.visible=true;m.geometry=e.style==='flame'?flame:['leaf','crystal','ice','petal'].includes(e.style)?leaf:sphere;m.material.color.set(e.style==='flame'&&i%3===0?'#ffe5a0':color);m.material.opacity=(1-i/40)*.85;m.position.set(T.MathUtils.lerp(from,to,trail),1.15+Math.sin(angle+u*6)*(.1+i%3*.04),Math.cos(angle+u*6)*.22);m.scale.setScalar((e.style==='bubble'?.14:.09)*(1-i/55));m.rotation.set(p*4,angle,e.style==='flame'?-sign*Math.PI/2:p*3);});
   if(['beam','thunder','wind'].includes(e.style)){streak.visible=true;streak.position.set((from+T.MathUtils.lerp(from,to,u))/2,1.15,0);streak.rotation.z=Math.PI/2;streak.scale.set(1,Math.max(.01,Math.abs(to-from)*u),1);streak.material.color.set(color);streak.material.opacity=.65;}
  }
  if(burst){const t=(p-2)/.7;particles.forEach((m,i)=>{const angle=i*2.399;m.visible=true;m.geometry=sphere;m.position.set(d.anchor.position.x+Math.cos(angle)*t*1.8,1.15+Math.sin(angle)*t*1.4,.2+Math.sin(i)*t*.4);m.scale.setScalar((1-t)*.1);m.material.color.set(e.guard?'#a3dce6':color);m.material.opacity=(1-t)*.9;});aura.visible=true;aura.position.set(d.anchor.position.x,1.15,.25);aura.rotation.set(0,0,0);aura.scale.setScalar(.2+t*1.25);aura.material.color.set(color);aura.material.opacity=(1-t)*.7;}
 }
 return {update};
}
