// Eight different landforms, all retaining a clear, level combat lane at z=0.
export function createBattleTerrain(T,parent,kind,season,palette){
 const root=new T.Group();root.name='terrain-'+kind;parent.add(root);const water=[],snow=season==='winter';
 function mesh(geo,color,x,y,z,sx=1,sy=1,sz=1){const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.9}));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
 const box=(color,x,y,z,w,h,d)=>mesh(new T.BoxGeometry(w,h,d),color,x,y,z);
 const rock=(color,x,y,z,w,h,d)=>mesh(new T.IcosahedronGeometry(1,1),color,x,y,z,w,h,d);
 function plane(color,x,z,w,d,y=-.16){const p=mesh(new T.PlaneGeometry(w,d),color,x,y,z);p.rotation.x=-Math.PI/2;return p;}
 function waterPlane(x,z,w,d){const p=plane(snow?'#b0d2dc':'#62b3c3',x,z,w,d,-.18);p.material.roughness=.3;for(let i=0;i<13;i++){const a=plane('#d5f0ec',x-w*.42+(i*7%11)/11*w*.85,z-d*.4+i%5*d*.16,1.4+i%3,.065,-.165);water.push({m:a,z:a.position.z});}return p;}
 function cliff(x,z,w,h,color=palette.rock){const geo=new T.CylinderGeometry(.86,1,1,7,5),positions=geo.attributes.position,colors=[],base=new T.Color(color);for(let i=0;i<positions.count;i++){const xx=positions.getX(i),yy=positions.getY(i),zz=positions.getZ(i),r=Math.hypot(xx,zz),jitter=1+.11*Math.sin(xx*4.7+zz*3.2+yy*11);positions.setXYZ(i,xx*jitter,yy+(r>.4?.018*Math.sin(xx*6+zz*4):0),zz*jitter);const c=base.clone().multiplyScalar(.9+.13*Math.sin(yy*27)+.035*Math.cos(xx*8));colors.push(c.r,c.g,c.b);}geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const m=mesh(geo,'#ffffff',x,h/2-.35,z,w*.61,h,1.6);m.material.vertexColors=true;m.material.flatShading=true;m.rotation.y=.11*Math.sin(x+z);if(snow)rock('#e5edf0',x,h-.3,z,w*.54,.17,1.4);}
 function path(color,width=3){const points=[[-width*2.4,20],[width*2.4,20],[width*.55,-24],[-width*.55,-24]],shape=new T.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const m=mesh(new T.ShapeGeometry(shape),color,0,-.14,0);m.rotation.x=-Math.PI/2;return m;}
 function mountain(x,z,w,h,color){mesh(new T.ConeGeometry(w,h,5),color,x,h/2-1,z,1,1,.7);if(snow)mesh(new T.ConeGeometry(w*.42,h*.4,5),'#edf1f2',x,h*.8-1,z,1,1,.7);}
 function fence(x,z,length){for(let i=0;i<length;i++){box('#c1aa7c',x+i*.9,.45,z,.08,.95,.08);if(i<length-1){box('#c1aa7c',x+i*.9+.45,.35,z,.9,.06,.06);box('#c1aa7c',x+i*.9+.45,.7,z,.9,.06,.06);}}}
 const grass=snow?'#e6eced':palette.ground;
 if(kind==='highland'){
  plane('#a89e88',0,-15,140,140,-3.4);
  box('#8a877c',0,-1.7,-.5,25,3.1,11);box(snow?'#e4eaf0':'#b8b09c',0,-.24,-.5,25,.2,11);
  for(let i=0;i<7;i++){cliff(-13+i*4.5,-8-(i%2),4.5,4.2+i%3*1.3);mountain(-22+i*7,-30,6,7+i%3*2,'#92999a');}
  for(let i=0;i<9;i++){const x=-10+i*2.5;plane('#8b887f',x,-1.7+i%3*.5,1.2,.07,-.13);}
 }else if(kind==='shore'){
  plane(snow?'#dbe5e7':'#e9d5a5',0,10,160,30);waterPlane(0,-38,180,70);
  plane(snow?'#e7edf0':'#f0dfb5',0,8,160,22,-.14);
  for(let i=0;i<6;i++){const line=plane('#e4eee1',0,-2.2-i*.28,55,.14,-.135);water.push({m:line,z:line.position.z});}
  cliff(-17,-10,6,4,'#9eaaa5');rock('#8b9b99',11,.6,-5,1.8,1,1.3);rock('#899a96',13,.3,-4,1.1,.6,1);
  rock('#91aaa7',-12,.3,-23,4,1.8,2.5);rock('#91aaa7',-10,.2,-22,2,1,1.5);
 }else if(kind==='forest'){
  plane(grass,0,-20,140,140);plane(snow?'#d7e4e8':'#c5bea0',0,1,24,6,-.14);
  waterPlane(0,-5.7,70,5);for(let i=0;i<24;i++){const x=-16+i*1.4;rock('#919d94',x,-.02,-3.1+Math.sin(i*.7)*.23,.5,.25,.4);}
  for(let i=0;i<4;i++){const r=rock('#bbc1b0',-3.6+i*1.6,-.03,-5.2,0.65,.14,.48);r.name='stream-stepping-stone';}
  cliff(-13,-12,5,3.4);cliff(13,-13,5,4);for(let i=0;i<5;i++)mountain(-20+i*10,-32,8,6+i%2*3,'#94aaa0');
 }else if(kind==='garden'){
  plane(grass,0,-30,150,150);path(snow?'#e2e8e6':'#ceb892',4.2);
  for(const sign of [-1,1])for(let row=0;row<7;row++){const strip=plane(snow?'#d6e0dc':row%2?'#9baf70':'#b1b77c',sign*(8+row*.95),-13,.65,28,-.145);}
  fence(-14,-3,8);fence(8,-3,8);
  const barn=box('#c19277',-7,1.3,-13,3.7,3,3);const roof=mesh(new T.ConeGeometry(3.2,1.6,4),'#8c7564',-7,3.5,-13,1,1,.8);roof.rotation.y=Math.PI/4;box('#665e52',-7,.65,-11.47,.9,1.6,.04);
  for(let i=0;i<4;i++)rock(snow?'#d6e2df':'#a2b889',-24+i*15,.2,-32,12,3.5,6);
 }else if(kind==='wetland'){
  waterPlane(0,-15,160,160);
  for(let i=0;i<38;i++)box(snow?'#d1d8d3':i%3?'#b4a183':'#a89170',-9.25+i*.5,-.24,0,.48,.2,4.9);
  for(const sign of [-1,1]){for(let i=0;i<6;i++)box('#86785f',sign*9,-.75,1.7-i*.7,.23,1.2,.2);}
  for(let i=0;i<16;i++){const x=-22+i*3;rock(grass,x,-.2,-8-i%4*2,2.2,.32,1.4);}
  for(let i=0;i<24;i++){const x=-17+i*1.5,z=-4-i%4*1.1;mesh(new T.CylinderGeometry(.035,.05,1.6+i%3*.3,5),snow?'#b2b39e':'#7f9859',x,.6,z);rock('#a88f65',x,1.4,z,.075,.24,.075);}
 }else if(kind==='prehistoric'){
  plane(snow?'#d7e1dd':'#a5a17d',0,-20,140,140);path(snow?'#e4e9e3':'#c3ae8a',5);
  for(const sign of [-1,1])for(let i=0;i<6;i++)cliff(sign*(10+i*.45),-3-i*4,3.7,5+i*.65,snow?'#a5b1ad':'#9c937c');
  mountain(0,-42,7,12,'#a6aaa0');for(let i=0;i<10;i++)rock(palette.rock,(i%2?1:-1)*(5+i%3),.12,3-i,.8,.3,.5);
 }else if(kind==='grove'){
  plane(snow?'#d7dfda':'#7c9180',0,-20,100,100);plane(snow?'#dce7dd':'#9da98c',0,1,18,7,-.14);
  for(const sign of [-1,1])for(let i=0;i<4;i++)cliff(sign*(9-i*.25),-5-i*3,3.2,4+i*.65,'#76887d');
  const arch=mesh(new T.TorusGeometry(5.8,.85,8,14,Math.PI),'#8d9681',0,.2,-16,1,1.05,1);arch.name='moss-rock-arch';
 }else{
  plane(snow?'#dce5e7':'#93998e',0,-20,120,120);
  for(let x=-11;x<=11;x+=2.2)for(let z=2;z>=-12;z-=2.2)box(snow?'#e1e8e9':(Math.round(x+z)%3?'#c1baaa':'#a9ac9e'),x,-.25,z,2.1,.2,2.1);
  for(const x of [-9,-5,5,9]){mesh(new T.CylinderGeometry(.55,.65,4,8),'#aaa99c',x,1.8,-10);box('#c7bfaa',x,3.95,-10,1.5,.3,1.4);}box('#b5ae9a',7,4.25,-10,6,.4,1.5);
  for(let i=0;i<4;i++)rock(palette.rock,-14+i*9,.4,-19,3,1.6,2);
 }
 return {root,update(t,reduced){if(reduced||snow)return;water.forEach((v,i)=>{v.m.position.z=v.z+Math.sin(t*.6+i*.5)*.13;});}};
}
