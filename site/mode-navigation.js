(()=>{
 const mode=document.documentElement.dataset.learningMode||'home';
 const embedded=document.documentElement.dataset.modePanel==='true';
 const definitions={traditional:['📖 安心練習','傳統測驗','專心讀題與思考，提示和觀念引導會陪你練習。','開始傳統測驗'],battle:['⚔️ 森林闖關','怪物對戰','準備好夥伴，用理解化成力量，一起挑戰數學。','開始怪物對戰'],collection:['🌱 旅伴探索','收集精靈','用自己的步調探索數學，累積徽章，認識新旅伴。','開始精靈探索']};
 window.MATH_PAGE_MODE=mode;
 if(mode==='home'){
  document.querySelectorAll('.theme').forEach(button=>button.onclick=()=>{
   document.body.classList.remove('spring','summer','autumn','winter');document.body.classList.add(button.dataset.theme);
   document.querySelectorAll('.theme').forEach(b=>b.classList.toggle('active',b===button));
   const mark=document.querySelector('.season-mark');if(mark)mark.textContent={spring:'✿',summer:'☀',autumn:'🍁',winter:'❄'}[button.dataset.theme];
  });
 }
 const themeKey='math-mission-page-theme';
 try{const saved=sessionStorage.getItem(themeKey);if(['spring','summer','autumn','winter'].includes(saved))document.querySelector(`.theme[data-theme="${saved}"]`)?.click();}catch{}
 document.querySelectorAll('.theme').forEach(button=>button.addEventListener('click',()=>{try{sessionStorage.setItem(themeKey,button.dataset.theme);}catch{}}));
 window.addEventListener('math-auth-changed',event=>{if(event.detail?.key&&!embedded&&!window.MATH_STATIC_EDITION)(mode==='home'?document.getElementById('modeHome'):document.querySelector('.mode-page-header'))?.scrollIntoView({block:'start'});});
 if(mode==='home')return;
 const def=definitions[mode];if(!def)return;
 document.title=def[1]+'｜數學任務站';
 document.querySelector('.mode-page-tag').textContent=def[0];document.querySelector('.mode-page-title').textContent=def[1];document.querySelector('.mode-page-description').textContent=def[2];
 const start=document.getElementById('start');start.textContent=def[3];
 const ruleTitle=[...document.querySelectorAll('#setup h2')].find(e=>e.textContent.includes('遊戲規則'));if(ruleTitle)ruleTitle.textContent='5. '+(mode==='traditional'?'練習說明':'本次任務說明');
 const updateReturn=()=>{const setup=document.getElementById('setup'),game=document.getElementById('game'),coach=document.getElementById('coach');const canLeave=(!setup.classList.contains('hidden')&&game.classList.contains('hidden')&&coach.classList.contains('hidden'))||Boolean(window.MathLatestReport?.stage2Completed&&window.MathLatestReport?.backendSaved);document.querySelector('.mode-home-link').hidden=!canLeave;};
 const observer=new MutationObserver(updateReturn);for(const id of ['setup','game','coach'])observer.observe(document.getElementById(id),{attributes:true,subtree:true,childList:true});
 document.addEventListener('DOMContentLoaded',updateReturn);window.addEventListener('math-auth-changed',updateReturn);updateReturn();
})();
