// Controlled same-origin panels share the parent's session/CSRF client, not a second login.
(()=>{
 const mode=document.documentElement.dataset.learningMode;
 let allowed=false;try{allowed=parent!==window&&parent.location.origin===location.origin&&parent.document.documentElement.dataset.learningMode==='home';}catch{}
 window.MathModeFrameActive=mode==='traditional';
 if(!allowed){document.addEventListener('DOMContentLoaded',()=>{document.body.replaceChildren();const p=document.createElement('p');p.textContent='請從數學任務站主畫面選擇學習模式。';const a=document.createElement('a');a.href='app.html';a.textContent='開啟主畫面';document.body.append(p,a);});return;}
 window.MathStudentAuth=Object.freeze({get currentKey(){return parent.MathStudentAuth?.currentKey||'';},get currentEmail(){return parent.MathStudentAuth?.currentEmail||'';},get role(){return parent.MathStudentAuth?.role||'guest';},get studentProfile(){return parent.MathStudentAuth?.studentProfile||null;},get isVerified(){return Boolean(parent.MathStudentAuth?.isVerified);}});
 window.MathSecureApi={api:(...args)=>{if(!parent.MathStudentAuth?.isVerified)return Promise.reject(Error('請先登入。'));return parent.MathSecureApi.api(...args);},refreshCsrf:()=>parent.MathSecureApi.refreshCsrf(),get csrfToken(){return parent.MathSecureApi?.csrfToken;}};
 let lastHeight=0,pending=false,shown='setup',refocus=false;
 function measure(){pending=false;const main=document.querySelector('main');if(!main)return;const view=!document.getElementById('game').classList.contains('hidden')?'game':!document.getElementById('coach').classList.contains('hidden')?'coach':'setup';const focus=view!==shown||refocus?view:null;shown=view;refocus=false;const height=Math.max(240,Math.ceil(main.getBoundingClientRect().height)+6);if(height===lastHeight&&!focus)return;lastHeight=height;parent.postMessage({type:'math-mode-panel-size',mode,height,focus},location.origin);}
 function schedule(){if(!pending){pending=true;requestAnimationFrame(measure);}}
 window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='math-mode-panel-state'||event.data.mode!==mode)return;window.MathModeFrameActive=event.data.active===true;const theme=event.data.theme;if(['spring','summer','autumn','winter'].includes(theme))document.querySelector(`.theme[data-theme="${theme}"]`)?.click();schedule();});
 document.addEventListener('click',event=>{if(event.target.closest?.('#next'))setTimeout(()=>{refocus=true;schedule();},0);});
 document.addEventListener('DOMContentLoaded',()=>{
  if(!window.MathStudentAuth.isVerified)return;
  document.querySelectorAll('.learning-area').forEach(e=>e.classList.remove('hidden'));
  document.getElementById('authGate')?.classList.add('hidden');
  const profile=window.MathStudentAuth.studentProfile;if(profile?.grade)document.querySelector(`.choice[data-group="${profile.grade}"]`)?.click();
  window.dispatchEvent(new CustomEvent('math-auth-changed',{detail:{key:window.MathStudentAuth.currentKey,email:window.MathStudentAuth.currentEmail,role:window.MathStudentAuth.role}}));
  new ResizeObserver(schedule).observe(document.querySelector('main'));new MutationObserver(schedule).observe(document.querySelector('main'),{subtree:true,childList:true,attributes:true,characterData:true});schedule();
 });
})();
