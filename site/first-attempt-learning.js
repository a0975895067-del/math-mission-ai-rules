// Two-stage learning; persistence uses authenticated report APIs.
(() => {
  const mainShow=show, mainDiagnosis=diagnosis, mainHint=$('#hint').onclick, mainWhy=$('#why').onclick;
  let firstAttempts=new Map(), followup=null, mainSnapshot=null, lastSelected=null;
  const summary=()=>({total:session.length,answered:firstAttempts.size,wrong:[...firstAttempts.values()].filter(x=>!x).length,firstCorrect:[...firstAttempts.values()].filter(Boolean).length,finalCorrect:correctCount});
  function resetMain(){firstAttempts=new Map();followup=null;mainSnapshot=null;$('#fiveQuestionReview')?.remove();$('#followupSummary')?.remove();document.dispatchEvent(new CustomEvent('math-demo-reset'));}
  document.addEventListener('click',event=>{if(event.target.id==='start')resetMain();},true);
  function progress(){const s=summary();$('#score').textContent=`已作答 ${s.answered} 題｜首次答對 ${s.firstCorrect} 題｜錯題 ${s.wrong} 題｜最後答對 ${s.finalCorrect} 題`;}
  show=function(){mainShow();lastSelected=null;progress();window.MathPlayModes?.present(session[idx],1,idx+1);};
  answer=function(i,button){
    if(followup){answerFollowup(i,button);return;}
    if(correct)return;
    const item=session[idx],ok=i===item.a,first=!firstAttempts.has(idx),elapsedMs=Math.max(0,Date.now()-questionStartedAt);lastSelected=item.o[i];
    window.MathPlayModes?.answerResult(ok,elapsedMs);
    if(first)firstAttempts.set(idx,ok);
    document.dispatchEvent(new CustomEvent('math-answer',{detail:{index:idx+1,selectedIndex:i,selectedOption:item.o[i],correct:ok,correctOption:item.o[item.a],elapsedMs}}));
    if(ok){
      correct=true;correctCount++;button.classList.add('good');
      $('#feedback').textContent=first?'第一次就答對！可以繼續下一題。':'已完成修正！這題仍保留為首次答錯題，現在可以繼續。';
      $('#feedback').className='feedback answer-feedback ok';$('#next').classList.remove('hidden');
      if(idx===session.length-1)document.dispatchEvent(new CustomEvent('math-test-finished',{detail:{totalQuestions:session.length}}));
    }else{
      button.classList.add('bad');$('#why').disabled=false;
      if(first){misses[item.u]=(misses[item.u]||0)+1;errorDetails.push({index:idx+1,unit:item.u,level:item.l,question:item.t,selected:item.o[i],correct:item.o[item.a],hint:item.h,explanation:item.e});}
      $('#feedback').textContent='這題已記為首次答錯題。可保留並查看提示與為什麼，答對後才能進入下一題；多次選錯不會增加錯題題數。';
      $('#feedback').className='feedback answer-feedback no';
    }
    progress();
  };
  diagnosis=function(){
    mainDiagnosis();mainSnapshot=summary();
    const rate=mainSnapshot.total?Math.round(mainSnapshot.firstCorrect/mainSnapshot.total*10000)/100:0;
    const box=$('#diagnosis');
    box.innerHTML=`<div class="diagnosis-summary"><div><span>答題數／總題數</span><strong>${mainSnapshot.answered} / ${mainSnapshot.total}</strong></div><div><span>首次答錯題數</span><strong>${mainSnapshot.wrong} 題</strong></div><div><span>最後答對題數（含重做）</span><strong>${mainSnapshot.finalCorrect} 題</strong></div><div><span>第一次答對率</span><strong>${rate}%</strong></div></div><p>第一次答對 ${mainSnapshot.firstCorrect} 題。答錯後即使修正成功，也不會改成首次答對；此處不計分、不排名。</p>`;
    if(errorDetails.length){
      const heading=document.createElement('h3');heading.textContent='先理解錯題，再做 5 題補強';box.append(heading);
      for(const wrong of errorDetails){
        const article=document.createElement('article');article.className='item';
        const analysis=window.MathRemediation?.analyze?.({unit:wrong.unit,wrong:1,timeline:[{correct:false,selectedOption:wrong.selected}]});
        const guide={text:window.MathChoiceGuide(wrong,wrong.selected)};
        const lines=[`第 ${wrong.index} 題｜${wrong.unit}`,wrong.question,`第一次選擇：${wrong.selected}（此題已記錄為首次答錯）`,guide.text,'請先用自己的話說明：我用了什麼規則？第一個需要修正的步驟是哪裡？'];
        lines.filter(Boolean).forEach((text,index)=>{const el=document.createElement(index===0?'h4':'p');el.textContent=text;article.append(el);});box.append(article);
      }
    }
      const section=document.createElement('section');section.id='fiveQuestionReview';section.className='action-plan';
      const note=document.createElement('p');note.textContent='第一階段：閱讀觀念分析，向助手提問，試著口說你的思路。滑到這裡後做 5 題新的觀念測驗；題目不會與原測驗相同。完成第二階段後，可在目前瀏覽器下載完整 PDF 報告。';
      const button=document.createElement('button');button.className='primary';button.textContent='我已閱讀說明，開始 5 題觀念測驗';button.onclick=startFollowup;section.append(note,button);$('#coach').append(section);
    if(window.MathLatestReport)Object.assign(window.MathLatestReport,{answeredQuestions:mainSnapshot.answered,wrongQuestions:mainSnapshot.wrong,finallyCorrect:mainSnapshot.finalCorrect,firstRate:rate});
    if(window.MathLatestReport)window.MathLatestReport.attempts.forEach((record,i)=>{record.explanation=session[i]?.e||'';record.guidance=window.MathConceptGuide(record).text;});
    $('#coach > h2').textContent='第一階段｜理解觀念與學習引導';
    document.dispatchEvent(new CustomEvent('learning-stage1'));
  };
  function followupCandidates(){
    const topics=Object.entries(misses).sort((a,b)=>b[1]-a[1]).map(([name])=>name),oldLevel=level;
    if(!topics.length)topics.push(...new Set(session.map(x=>x.u)));
    const stem=x=>String(x.t).replace(/\s/g,'');
    const blocked=new Set(session.map(stem)),seen=new Set(),out=[];
    try{
      for(let step=0;step<100 && out.length<5;step++){
        // This is a foundational concept check after explanation, not a new
        // exam-difficulty assessment. Keep each question independently readable.
        const topic=topics[step%topics.length];level='easy';
        const approved=window.approvedReviewedQuestionsFor?.(grade,topic,level)||[];
        const candidates=step<approved.length?[approved[step]]:generatedUnitSet(topic,2);
        for(const candidate of candidates){
            if(!validQuestionAnswers(candidate))continue;
          if(typeof hasRequiredQuestionMaterial==='function'&&!hasRequiredQuestionMaterial(candidate))continue;
          if(/甲.*乙|答案.*配對|分別完成/.test(candidate.t))continue;
          const key=stem(candidate);
          if(blocked.has(key)||seen.has(key))continue;
            seen.add(key);out.push(reshuffleAnswers({...candidate,o:[...candidate.o]}));if(out.length===5)break;
        }
      }
    }finally{level=oldLevel;}
    return out;
  }
  function startFollowup(){
    const questions=followupCandidates();
    if(questions.length!==5){alert('目前未取得 5 題不重複的補強題，請重新嘗試；不會用原題充數。');return;}
    followup={questions,index:0,first:new Map(),final:0,answers:[],records:questions.map((x,i)=>({index:i+1,question:x.t,unit:x.u,level:x.l,options:[...x.o],correctIndex:x.a,correctOption:x.o[x.a],explanation:x.e,guidance:window.MathConceptGuide(x).text,timeline:[],hint:false,explanationViewed:false}))};
    $('#coach').classList.add('hidden');$('#game').classList.remove('hidden');renderFollowup();
  }
  function renderFollowup(){
    const item=followup.questions[followup.index];correct=false;usedHint=false;lastSelected=null;questionStartedAt=Date.now();
    window.MathPlayModes?.present(item,2,followup.index+1);
    $('#progress').textContent=`補強測試 ${followup.index+1} / 5 題`;
    $('#score').textContent=`補強已作答 ${followup.first.size} 題｜最後答對 ${followup.final} 題`;
    $('#bar').style.width=`${followup.index/5*100}%`;
    $('#tag').textContent=`${grade}年級｜${item.u}｜觀念補強`;$('#question').textContent=item.t;
    $('#questionVisual').innerHTML=item.fig||'';$('#questionVisual').classList.toggle('hidden',!item.fig);
    $('#feedback').textContent='這是新的補強題；先獨立判斷，需要時仍可查看提示與為什麼。';
    $('#hintFeedback').textContent='需要時再打開提示。';$('#whyFeedback').textContent='答錯後可查看解題說明。';
    $('#why').disabled=true;$('#next').classList.add('hidden');$('#next').textContent=followup.index===4?'完成補強並建立 PDF 報告':'下一題';
    $('#answers').replaceChildren();item.o.forEach((option,i)=>{const button=document.createElement('button');button.textContent=`${String.fromCharCode(65+i)}. ${option}`;button.onclick=()=>answer(i,button);$('#answers').append(button);});
  }
  function answerFollowup(i,button){
    if(correct)return;
    const item=followup.questions[followup.index],ok=i===item.a,elapsedMs=Math.max(0,Date.now()-questionStartedAt);lastSelected=item.o[i];
    window.MathPlayModes?.answerResult(ok,elapsedMs);
    if(!followup.first.has(followup.index))followup.first.set(followup.index,ok);
    const attempt={index:followup.index+1,question:item.t,unit:item.u,selected:item.o[i],selectedOption:item.o[i],selectedIndex:i,correct:ok,elapsedMs};
    followup.answers.push(attempt);followup.records[followup.index].timeline.push(attempt);
    button.classList.add(ok?'good':'bad');
    $('#feedback').textContent=ok?'已答對，可以繼續。':'先看觀念與提示，再試一次；答對才能繼續。';
    if(ok){correct=true;followup.final++;$('#next').classList.remove('hidden');}else $('#why').disabled=false;
    $('#score').textContent=`補強已作答 ${followup.first.size} 題｜首次答對 ${[...followup.first.values()].filter(Boolean).length} 題｜最後答對 ${followup.final} 題`;
  }
  function guideAction(kind){const item=followup?followup.questions[followup.index]:session[idx];if(!item)return;const g=window.MathConceptGuide(item),text=kind==='hint'?g.prompt:window.MathChoiceGuide(item,lastSelected);$('#'+(kind==='hint'?'hintFeedback':'whyFeedback')).textContent=text;if(followup){const record=followup.records[followup.index];record[kind==='hint'?'hint':'explanationViewed']=true;}else{if(kind==='hint'&&!usedHint){usedHint=true;hintCount++;}document.dispatchEvent(new CustomEvent(kind==='hint'?'math-hint':'math-explanation',{detail:{text,elapsedMs:Math.max(0,Date.now()-questionStartedAt)}}));}}
  $('#hint').onclick=()=>guideAction('hint');
  $('#why').onclick=()=>guideAction('why');
  coachAnswer=function(text){const name=Object.entries(misses).sort((a,b)=>b[1]-a[1])[0]?.[0]||session[0]?.u;const g=window.MathConceptGuide({u:name});if(/例題/.test(text))return '你可以先試想一個同觀念但情境不同的小問題，指出已知與要求，寫第一步，再說明規則。接著用下面的 5 題新題目驗證。\n'+g.prompt;if(/複習|分鐘/.test(text))return `針對「${name}」：先用自己的話說明「${g.concept}」，再不看說明寫出解題順序，最後用新題目檢查。隔天再試一次；不要只記住剛才的選項。\n${g.check}`;return `針對「${name}」的觀念引導：\n${g.text}\n請寫下你目前的第一步，我們先確認規則與條件，不直接給答案。`};
  $('#next').onclick=()=>{
    if(!correct)return;
    correct=false; // Consume the navigation once; rapid clicks cannot skip questions or submit twice.
    if(followup){
      followup.index++;
      if(followup.index<5){renderFollowup();return;}
      $('#game').classList.add('hidden');$('#coach').classList.remove('hidden');
      let panel=$('#followupSummary');if(!panel){panel=document.createElement('section');panel.id='followupSummary';panel.className='action-plan';$('#diagnosis').append(panel);}
      const first=[...followup.first.values()].filter(Boolean).length;
      panel.replaceChildren();const title=document.createElement('h3');title.textContent='5 題補強結果';const p=document.createElement('p');p.textContent=`已作答 5 題；首次答對 ${first} 題，首次答錯 ${5-first} 題；最後答對 ${followup.final} 題；首次答對率 ${first*20}%。原測驗結果不變。`;
      const advice=document.createElement('p');advice.textContent=first===5?'本次補強均能首次答對，可繼續練習原單元不同題型。':'請再次比較補強錯題的已知條件、使用規則與第一個算式，再向老師確認卡住的步驟。';panel.append(title,p,advice);
      const missed=new Set(followup.answers.filter(x=>!x.correct).map(x=>x.index));
      for(const number of missed){const item=followup.questions[number-1],line=document.createElement('p');line.textContent=`補強第 ${number} 題：${item.h} 解題說明：${item.e}`;panel.append(line);}
      if(window.MathLatestReport)window.MathLatestReport.followup={firstCorrect:first,totalQuestions:5,finallyCorrect:followup.final,attempts:followup.records};
      document.dispatchEvent(new CustomEvent('learning-stage2',{detail:{records:followup.records}}));
      followup=null;panel.scrollIntoView({behavior:'smooth'});return;
    }
    idx++;if(idx===session.length){$('#game').classList.add('hidden');$('#coach').classList.remove('hidden');$('#bar').style.width='100%';diagnosis();}else show();
  };
  const restart=$('#restart').onclick;$('#restart').onclick=()=>{
    if(mainSnapshot&&!window.MathLatestReport?.stage2Completed){alert('請先完成 5 題觀念測驗，再重新選擇任務。');return;}
    resetMain();restart();
  };
  document.addEventListener('DOMContentLoaded',()=>{
    $('#setup ol').innerHTML='<li>第一次選錯即記為錯題，答對後才能進下一題。</li><li>提示與為什麼只引導觀念，不直接提供答案。</li><li>第一階段看分析、向助手提問，再做 5 題不同的新題。</li><li>第二階段統整兩次結果與複習建議，完成後可下載自己的 PDF 報告；內容不會上傳到原站後台。</li>';

  });
})();
