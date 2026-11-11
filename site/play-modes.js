/* Optional presentation modes; original scoring, question bank and reports remain intact. */
(()=>{
 'use strict';
 const names={traditional:'傳統選擇題',battle:'怪物對戰',collection:'收集精靈'};
 const selected=document.documentElement.dataset.learningMode==='collection'?'collection':'battle';
 let active=selected,state=null,current=null,serial=0;
 let encounters=[],rewards=null,selectedAlly='',rewardGeneration=0;
 const ownedIds=()=>['monster-01',...(rewards?.unlockedIds||[])].filter((id,i,all)=>all.indexOf(id)===i);
 function partner(){if(!state)return null;let ally=state.party.find(x=>x.id===state.activeAllyId&&x.hp>0);if(!ally){ally=state.party.find(x=>x.hp>0);if(ally&&state.activeAllyId!==ally.id)state.replacements++;state.activeAllyId=ally?.id||null;}state.playerHp=ally?.hp||0;return ally;}
 function nextMonster(excludeId,partyIds=[]){if(!encounters.length)encounters=window.MathMonsterRoster?.deck()||[{id:'monster-01',name:'岩甲守衛',attack:18,motion:'hop'}];let i=encounters.findIndex(x=>x.id!==excludeId&&!partyIds.includes(x.id));if(i<0)i=encounters.findIndex(x=>x.id!==excludeId);if(i<0){encounters=window.MathMonsterRoster.deck();i=encounters.findIndex(x=>x.id!==excludeId);}return encounters.splice(i,1)[0];}
 function setRewards(value){rewards=value;renderRewards();}
 async function refreshRewards(){if(!window.MathStudentAuth?.isVerified||!window.MathSecureApi)return;const ticket=++rewardGeneration,owner=window.MathStudentAuth.currentKey;try{const value=await window.MathSecureApi.api('/api/play/progress');if(ticket===rewardGeneration&&owner===window.MathStudentAuth.currentKey&&window.MathStudentAuth.isVerified)setRewards(value);}catch{const box=$('#playRewards');if(box&&ticket===rewardGeneration)box.textContent='獎勵進度暫時無法讀取；可繼續試玩，不會在瀏覽器自行發放獎勵。';}}
 function renderRewards(){const box=$('#playRewards');if(!box)return;box.replaceChildren();box.append(node('h3','成長徽章與新夥伴'),node('p','完成兩階段測驗，原測驗首次答對率達 80% 可獲 1 枚徽章與 5 顆星；每 3 枚徽章解鎖 1 位新夥伴。首次全對再加 10 顆星。未達標不扣徽章；獎勵不改動答對率。'));
  if(!rewards){box.append(node('p',window.MATH_STATIC_EDITION?'本次獎勵進度會顯示在目前頁面，重新整理後重新開始。':'登入後載入自己的獎勵進度。'));return;}
  box.append(node('p',`起始只有岩甲守衛 1 位夥伴。已累積 ${rewards.qualified} 枚徽章、${rewards.stars} 顆星；目前擁有 ${ownedIds().length} / 40 位。${rewards.nextUnlock?`再達標 ${rewards.nextUnlock} 次可解鎖下一位。`:'已完成 40 位夥伴圖鑑。'}${selected==='battle'?'請選擇首發，其他已解鎖夥伴會在首發倒下後替補。':'一起看看已經認識的旅伴。'}`));
  const owned=node('div',null,'play-owned');for(const id of ownedIds()){const item=window.MathMonsterRoster?.items.find(x=>x.id===id);if(!item)continue;const b=node(selected==='battle'?'button':'div');if(selected==='battle')b.type='button';const art=node('div',null,'party-portrait');art.innerHTML=window.MathMonsterRoster.svg(item);b.append(art,node('span',item.name+(selected==='battle'?((selectedAlly||'monster-01')===id?'｜首發 ✓':''):'｜已收藏')));if(selected==='battle')b.onclick=()=>{selectedAlly=id;renderRewards();};owned.append(b);}box.append(owned);
 }
 const $=s=>document.querySelector(s),node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 function damage(attempt,elapsedMs){
  if(attempt!==1&&attempt!==2)return 0;
  const seconds=Math.max(0,Number(elapsedMs)||0)/1000,penalty=seconds<=15?0:seconds<=30?5:seconds<=60?10:15;
  return (attempt===1?100:85)-penalty;
 }
 function install(){
  const setup=$('#setup');if(!setup||$('#playModeExtras')||!['battle','collection'].includes(document.documentElement.dataset.learningMode))return;
  const section=node('section',null,'mode-extras');section.id='playModeExtras';
  const detail=node('details',null,'play-damage-rules');detail.append(node('summary','怪物對戰：秒數與攻擊規則'));
  const table=node('table');const rows=[['作答時間','首次答對傷害','一次修正答對傷害'],['15 秒內','100','85'],['超過 15 至 30 秒','95','80'],['超過 30 至 60 秒','90','75'],['超過 60 秒','85','70']];
  for(const [i,row] of rows.entries()){const tr=node('tr');for(const text of row)tr.append(node(i?'td':'th',text));table.append(tr);}detail.append(table,node('p','每題首次答錯後，僅下一次修正答對可攻擊；第二次仍錯，之後答對也不攻擊。修正秒數從首次答錯重新起算。不限時、不淘汰，答對後仍可前進；傷害不等於學習成績。'));
  const guide=node('p','起始只有 1 位夥伴；完整測驗首次答對率達 80% 可得徽章，每 3 枚解鎖新夥伴。體力歸零即退場，下次作答或下一題由其他已解鎖、未倒下的夥伴替補，不會自動復活。全隊倒下改為無戰鬥陪練，仍可完成測驗與報告。整次測驗含補強共 3 次防守，每次減少下一次反擊的 75% 傷害；按下即消耗、換角也不補回。');detail.append(guide);
  const rewardBox=node('section',null,'play-rewards');rewardBox.id='playRewards';if(selected==='battle')section.append(detail);section.append(rewardBox);const gallery=node('a','查看 40 隻新版立體角色');gallery.href='approved-characters.html';gallery.target='_blank';gallery.rel='noopener';section.append(gallery);setup.prepend(section);renderRewards();refreshRewards();
  const panel=node('section',null,'play-stage hidden');panel.id='playStage';panel.setAttribute('aria-label','互動學習遊戲');$('#game').prepend(panel);
  const result=node('p',null,'play-live hidden');result.id='playAnswerMessage';$('#game').append(result);
  const start=$('#start').onclick;$('#start').onclick=async(...args)=>{begin();try{await start(...args);if(!$('#game').classList.contains('hidden')){render();if(active!=='traditional')$('#game').scrollIntoView?.({behavior:'smooth',block:'start'});}}catch(error){state=null;$('#playStage').classList.add('hidden');$('#start').disabled=false;$('#setupNote').textContent='暫時無法準備題目，請保留頁面並再試一次。';}};
 }
 function begin(){active=selected;serial=0;current=null;const owned=ownedIds(),first=owned.includes(selectedAlly)?selectedAlly:'monster-01',party=[first,...owned.filter(id=>id!==first)].map(id=>({id,hp:300}));state={mode:active,records:[],total:0,kills:0,hp:300,playerHp:300,party,activeAllyId:first,replacements:0,totalReceived:0,blocked:0,defensesUsed:0,recoveries:0,foe:nextMonster(first,owned),units:[],expected:Math.max(1,Number(questionCount)||10)+5};}
 function present(item,phase,index){if(!state)return;if(active==='battle')partner();if(state.hp<=0){state.foe=nextMonster(state.activeAllyId,state.party.map(x=>x.id));state.hp=300;}current={key:`${phase}:${index}`,phase,index,unit:item.u,attempts:[],guardAttempt:0,guardUsed:false,incoming:0,startedAt:Date.now(),firstWrongAt:null,settled:false};render();}
 function defend(){if(active!=='battle'||!state||!current||current.settled||current.guardUsed||state.defensesUsed>=3||state.playerHp<=0)return;state.defensesUsed++;current.effect=null;current.guardUsed=true;current.guardAttempt=current.attempts.length+1;render(`已準備防守！下一次反擊減少 75% 傷害；本次測驗剩餘 ${3-state.defensesUsed} 次防守（含補強共用）。`);$('#playStage').classList.add('play-guard');}
 function answerResult(ok,reportedElapsed){
  if(!state||!current||current.settled)return;
  if(active==='battle')partner();
  const elapsed=Number.isFinite(reportedElapsed)?Math.max(0,reportedElapsed):Math.max(0,Date.now()-current.startedAt),attempt=current.attempts.length+1;
  current.attempts.push({correct:ok,elapsedMs:elapsed});
  if(!ok){if(attempt===1)current.firstWrongAt=elapsed;let received=0,guarded=false;if(active==='battle'){guarded=current.guardAttempt===attempt;const hit=guarded?Math.max(1,Math.floor(state.foe.attack*.25)):state.foe.attack;received=Math.min(state.playerHp,hit);state.playerHp-=received;const slot=state.party.find(x=>x.id===state.activeAllyId);if(slot)slot.hp=state.playerHp;state.totalReceived+=received;current.incoming+=received;if(guarded&&slot)state.blocked++;}
   const move=window.MathCombatEffects?.choose(state.foe,current.index+attempt)||'dash';current.effect=received?{style:move,side:'foe',guarded}:null;
   const message=active==='collection'?'先用提示整理想法；修正答對後仍能累積探索能量，不會失去精靈。':`${state.foe.name} 使用「${window.MathCombatEffects?.moves[move]?.name||state.foe.skill}」！${guarded?'防守成功，':'受到'} ${received} 傷害。${state.playerHp===0?'護符守護中；下一題會回復體力。':''}${attempt===1?'你還有一次修正答對可以攻擊的機會。':'本題不能再攻擊，但可繼續修正到答對。'}`;
   const notice=active==='battle'&&state.playerHp===0?(state.party.some(x=>x.hp>0)?' 本夥伴倒下；下次作答由其他已解鎖夥伴接手。':' 全隊暫時休息，改為無戰鬥陪練；仍可使用提示、完成作答與報告。'):'';
   render(message.replace('護符守護中；下一題會回復體力。','')+notice);if(active==='battle'&&received){const target=$('#playStage').querySelector?.('.ally');if(target)target.dataset.hit=`−${received}`;if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('#playStage').classList.add('play-counter',guarded?'play-guard':'play-wounded');}return;}
  current.settled=true;
  const elapsedForAttack=attempt===2?Math.max(0,elapsed-current.firstWrongAt):elapsed,hit=active==='battle'&&state.playerHp>0?damage(attempt,elapsedForAttack):0;
  const record={phase:current.phase,index:current.index,attempt,damage:hit,elapsedMs:elapsedForAttack,guardAttempt:current.guardAttempt,opponentId:state.foe.id,incoming:current.incoming,partyIds:state.party.map(x=>x.id)};state.records.push(record);state.total+=hit;if(!state.units.includes(current.unit))state.units.push(current.unit);
  if(hit){state.hp=Math.max(0,state.hp-hit);if(state.hp===0)state.kills++;}
  let message=active==='battle'?(hit?`${attempt===1?'首次答對':'唯一一次修正成功'}！${(elapsedForAttack/1000).toFixed(1)} 秒，發動 ${hit} 傷害。`:'已修正答對，可以前進；本題攻擊傷害 0。'):active==='collection'?'完成理解的一步！探索能量增加，旅伴正在靠近。':'已完成本題。';
  const ally=window.MathMonsterRoster?.items.find(x=>x.id===state.activeAllyId)||{family:0,variant:0},move=window.MathCombatEffects?.choose(ally,state.records.length-1)||'dash';current.effect=hit?{style:move,side:'ally'}:null;
  if(active==='battle'&&hit)message+=` 使用「${window.MathCombatEffects?.moves[move]?.name||'狐影突進'}」！`+(state.hp===0?` ${state.foe.name} 的迷霧已散開，下一題遇見新怪獸！`:' 招式命中，對手暫時踉蹌！');render(message);serial++;document.dispatchEvent(new CustomEvent('math-play-progress',{detail:snapshot()}));
 }
 function snapshot(){return state?{mode:active,totalDamage:state.total,defeated:state.kills,playerHp:state.playerHp,activeAllyId:state.activeAllyId,party:state.party.map(x=>({...x})),replacements:state.replacements,totalReceived:state.totalReceived,blocked:state.blocked,defensesUsed:state.defensesUsed,defensesRemaining:3-state.defensesUsed,recoveries:0,opponentId:state.foe.id,completed:state.records.length,total:state.expected,companions:active==='collection'?ownedIds().length:0,records:state.records.map(r=>({...r,partyIds:[...r.partyIds]}))}:{mode:'traditional'};}
 function render(message){
  const result=$('#playAnswerMessage');if(result){result.classList.toggle('hidden',active==='traditional'||!message);result.textContent=message||'';}
  const panel=$('#playStage');if(!panel)return;panel.classList.remove('play-hit','play-counter','play-guard','play-wounded');panel.classList.toggle('play-battle-panel',active==='battle');panel.classList.toggle('hidden',active==='traditional'||!state);if(!state||active==='traditional')return;
  panel.replaceChildren();delete panel.dataset.attackStyle;delete panel.dataset.attackKind;delete panel.dataset.attackSide;const top=node('div',null,'play-stage-heading');top.append(node('h3',active==='battle'?'森林迷霧戰｜單人闖關':'精靈花園｜探索旅伴'),node('span',`完成 ${state.records.length} / ${state.expected} 題（含 5 題補強）`));panel.append(top);
  if(active==='battle'){
   const arena=node('div',null,'play-arena approved-arena'),owned=window.MathMonsterRoster?.items.find(x=>x.id===state.activeAllyId),foe=node('span');panel.append(arena);const labels=node('div',null,'approved-battle-names');labels.append(node('span',owned?.name||'全隊休息｜無戰鬥陪練'),node('span',state.foe.name));panel.append(labels);window.MathCharacterBattle?.attach(arena,snapshot(),current?.effect);

   const team=node('div',null,'battle-party');for(const slot of state.party){const creature=window.MathMonsterRoster?.items.find(x=>x.id===slot.id);const badge=node('span',`${creature?.name||slot.id} ${slot.hp<=0?'休息':slot.id===state.activeAllyId?'出戰':'替補'} · ${slot.hp}/300`);badge.className=slot.hp<=0?'party-fainted':'party-ready';team.append(badge);}panel.append(team);
   if(state.playerHp===0&&state.party.some(x=>x.hp>0)){const swap=node('button','更換為下一位已解鎖夥伴');swap.type='button';swap.id='playSwitch';swap.onclick=()=>{partner();if(current)current.effect=null;render('新夥伴已接手！防守剩餘次數與作答紀錄均保留。');};panel.append(swap);}
   for(const [label,value] of [['你的夥伴體力',state.playerHp],[state.foe.name+'體力',state.hp]]){const row=node('div',null,'play-hp-row');if(label==='你的夥伴體力')row.classList.add('ally-hp');const meter=node('progress');meter.max=300;meter.value=value;meter.setAttribute('aria-label',label);row.append(node('span',label+' '+value+' / 300'),meter);panel.append(row);}
   foe.dataset.hit=`−${state.records.at(-1)?.damage||0}`;
   const guard=node('button',current?.guardUsed?`本題已準備防守｜全程剩 ${3-state.defensesUsed} 次`:state.defensesUsed>=3?'本次測驗 3 次防守已用完':`準備防守（全程剩 ${3-state.defensesUsed} / 3 次）`);guard.id='playDefend';guard.type='button';guard.disabled=!current||current.settled||current.guardUsed||state.defensesUsed>=3||state.playerHp<=0;guard.onclick=defend;panel.append(guard,node('p',`本題作答 ${current?.attempts.length||0} 次；防守含補強全程共 3 次，按下即消耗，換題不補回。`, 'play-small'));
  }else{
   const garden=node('div',null,'play-garden');for(const id of ownedIds()){const item=window.MathMonsterRoster?.items.find(x=>x.id===id);if(!item)continue;const card=node('div',null,'play-companion found');card.innerHTML=window.MathMonsterRoster.svg(item);card.append(node('strong',item.name),node('span',id==='monster-01'?'起始夥伴':'已完成任務解鎖'));garden.append(card);}panel.append(garden,node('p','起始 1 位夥伴。完成兩階段測驗且首次答對率達 80% 可得徽章，每 3 枚解鎖新夥伴；只看圖鑑、答對一題或刷新頁面不會直接解鎖。','play-small'));
  }
  const status=node('p',message||(active==='battle'?'先讀題再作答。首次答對可攻擊；首次答錯後，只有下一次修正答對仍可攻擊。':'每完成一題，就離新的旅伴更近一步。'),'play-live');status.setAttribute('role','status');status.setAttribute('aria-live','polite');panel.append(status);
  // New approved 3D renderer owns attack visuals; old SVG creatures are no longer mounted.
  if(message&&active==='battle'&&current?.settled&&state.records.at(-1)?.damage&&!matchMedia('(prefers-reduced-motion: reduce)').matches){panel.classList.remove('play-hit');void panel.offsetWidth;panel.classList.add('play-hit');}
 }
 function reportSummary(){const report=window.MathLatestReport;if(!report)return;report.playMode=active;if(!report.backendSaved)report.playSummary=snapshot();for(const item of [...(report.attempts||[]),...(report.followup?.attempts||[])]){const phase=report.attempts?.includes(item)?1:2,record=state?.records.find(r=>r.phase===phase&&r.index===item.index);if(record){item.playDefenseAttempt=record.guardAttempt;item.playOpponentId=record.opponentId;item.playPartyIds=[...record.partyIds];}}let box=$('#playReportSummary');if(!box){box=node('section',null,'play-report-summary');box.id='playReportSummary';$('#diagnosis').prepend(box);}box.replaceChildren();box.hidden=active==='traditional';if(active==='traditional')return;const s=report.playSummary||snapshot(),count=Array.isArray(s.companions)?s.companions.length:s.companions;box.append(node('h3',names[active]+'｜本次旅程'),node('p',active==='battle'?`累積 ${s.totalDamage} 傷害，受到 ${s.totalReceived||0} 傷害，防守 ${s.blocked||0} 次、夥伴替補 ${s.replacements||0} 次；驅散 ${s.defeated} 位怪獸。傷害不會更改首次答對率。`:`目前擁有 ${count} / 40 位夥伴；新夥伴須達標解鎖。${report.backendSaved?'旅程已與本次 PDF 報告一併整理。':'完成補強後，旅程會併入本次 PDF 報告。'}`));if(rewards)box.append(node('p',`成長徽章 ${rewards.qualified} 枚；${rewards.stars} 顆星；另解鎖 ${rewards.unlockedIds.length} 位新夥伴。`));}
 document.addEventListener('learning-stage1',reportSummary);
 document.addEventListener('learning-stage2',reportSummary);
 document.addEventListener('math-demo-reset',()=>{$('#playReportSummary')?.remove();});
 window.addEventListener?.('math-auth-changed',()=>{rewardGeneration++;rewards=null;selectedAlly='';encounters=[];renderRewards();refreshRewards();});
 window.MathPlayModes={damage,present,answerResult,snapshot,begin,reportSummary,defend,setRewards,get mode(){return active;}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
