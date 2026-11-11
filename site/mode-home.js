(()=>{
 const host=document.getElementById('modeHome');if(!host)return;
 const node=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text||'';if(cls)e.className=cls;return e;};
 const entries=[['traditional','傳統測驗','📖','讀題・思考・安心練習','practice-panel.html'],['battle','怪物對戰','⚔️','答題出招・夥伴一起闖關','battle-panel.html'],['collection','收集精靈','🌱','慢慢探索・收集新旅伴','collection-panel.html']];
 const section=node('section',null,'play-mode-selector inline-mode-selector');section.id='playModeSelector';
 section.append(node('span','選擇學習模式','play-mode-kicker'),node('h2','今天想怎麼學數學？'),node('p','直接點選切換，下方只顯示目前模式的內容。','play-mode-intro'));
 const grid=node('div',null,'play-mode-choices');grid.setAttribute('role','tablist');grid.setAttribute('aria-label','學習模式');
 const workspace=node('div',null,'mode-workspaces'),frames=new Map(),panels=new Map(),buttons=new Map();let selected='traditional',owner='';
 const current=node('p',null,'mode-current-status');current.setAttribute('aria-live','polite');
 const theme=()=>['spring','summer','autumn','winter'].find(t=>document.body.classList.contains(t))||'spring';
 function send(mode){frames.get(mode)?.contentWindow?.postMessage({type:'math-mode-panel-state',mode,active:mode===selected,theme:theme()},location.origin);}
 function load(mode){if(frames.has(mode)||!window.MathStudentAuth?.isVerified)return;const entry=entries.find(e=>e[0]===mode),frame=document.createElement('iframe');frame.id='modeFrame-'+mode;frame.title=entry[1]+'內容';frame.className='mode-panel-frame';frame.src=entry[4];frame.setAttribute('scrolling','no');frame.addEventListener('load',()=>send(mode));frames.set(mode,frame);panels.get(mode).append(frame);}
 function select(mode){if(!panels.has(mode))return;selected=mode;for(const [key,button] of buttons){const on=key===mode;button.classList.toggle('active',on);button.setAttribute('aria-selected',String(on));button.tabIndex=on?0:-1;button.querySelector('.play-mode-state').textContent=on?'✓ 目前模式':'點選切換';button.querySelector('.play-mode-action').textContent=on?'下方顯示此模式':'切換至此模式';panels.get(key).hidden=!on;send(key);}current.textContent='目前模式：'+entries.find(e=>e[0]===mode)[1];load(mode);send(mode);}
 for(const [mode,title,icon,description] of entries){
  const b=node('button');b.type='button';b.id='modeTab-'+mode;b.dataset.playMode=mode;b.dataset.modeEntry=mode;b.setAttribute('role','tab');b.setAttribute('aria-controls','modePanel-'+mode);
  const top=node('span',null,'play-mode-top'),picture=node('span',icon,'play-mode-icon');picture.setAttribute('aria-hidden','true');top.append(picture,node('span','','play-mode-state'));
  b.append(top,node('strong',title,'play-mode-title'),node('span',description,'play-mode-description'),node('span','','play-mode-action'));b.onclick=()=>select(mode);
  b.onkeydown=event=>{const index=entries.findIndex(e=>e[0]===mode);let next;if(event.key==='ArrowRight')next=(index+1)%3;else if(event.key==='ArrowLeft')next=(index+2)%3;else if(event.key==='Home')next=0;else if(event.key==='End')next=2;else return;event.preventDefault();select(entries[next][0]);buttons.get(entries[next][0]).focus();};
  const panel=node('section',null,'mode-workspace');panel.id='modePanel-'+mode;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',b.id);panel.hidden=true;panels.set(mode,panel);buttons.set(mode,b);grid.append(b);workspace.append(panel);
 }
 section.append(grid,current);host.append(section,workspace);
 window.addEventListener('message',event=>{if(event.origin!==location.origin)return;const data=event.data;if(!data||data.type!=='math-mode-panel-size'||!panels.has(data.mode))return;const frame=frames.get(data.mode);if(!frame||event.source!==frame.contentWindow)return;if(Number.isFinite(data.height)&&data.height>=200&&data.height<=100000)frame.style.height=Math.ceil(data.height)+'px';if(data.mode===selected&&['game','coach','setup'].includes(data.focus))requestAnimationFrame(()=>{if(data.mode===selected)frame.scrollIntoView({block:'start'});});});
 function syncAuth(){const next=window.MathStudentAuth?.currentKey||'';if(next!==owner){owner=next;for(const f of frames.values())f.remove();frames.clear();selected='traditional';}if(!owner)for(const p of panels.values())p.replaceChildren();select(selected);}
 window.addEventListener('math-auth-changed',syncAuth);
 document.querySelectorAll('.theme').forEach(b=>b.addEventListener('click',()=>{for(const mode of frames.keys())send(mode);}));
 window.addEventListener('pagehide',()=>{for(const [mode,f] of frames)f.contentWindow?.postMessage({type:'math-mode-panel-state',mode,active:false,theme:theme()},location.origin);});
 window.addEventListener('pageshow',()=>{syncAuth();for(const mode of frames.keys())send(mode);});
 syncAuth();
})();
