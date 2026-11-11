(() => {
  window.MathTwoStageLearning=true;
  const staticMode=window.MATH_STATIC_EDITION===true;
  let runId='',stage1Save=null,assistant=[],epoch=0,clientRunId=crypto.randomUUID();
  const $=s=>document.querySelector(s);
  const p=(parent,text,tag='p')=>{const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;};
  function reportGrade(report){const profile=Number(window.MathStudentAuth?.studentProfile?.grade),parsed=Number(String(report.attempts?.[0]?.grade||'').match(/[789]/)?.[0]);return [7,8,9].includes(profile)?profile:[7,8,9].includes(parsed)?parsed:9;}
  async function api(route,data,retry=true){
    if(!window.MathSecureApi)throw Error('登入連線尚未就緒，請保留此頁再重試。');
    const path=route==='stage1'?'/api/reports/stage1':'/api/reports/'+encodeURIComponent(data.id)+'/stage2';
    const payload=route==='stage1'?{...data,clientRunId,grade:reportGrade(data.report)}:data;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
    try{return await window.MathSecureApi.api(path,{method:'POST',body:JSON.stringify(payload),signal:controller.signal});}
    catch(error){
      if(error.status===403&&retry){await window.MathSecureApi.refreshCsrf();return api(route,data,false);}
      if(error.status===401)throw Error('登入已失效。請保留本頁，在另一分頁重新登入，再回來重試儲存。');
      if(error.name==='AbortError'||error instanceof TypeError)throw Error('網路中斷或儲存逾時；作答仍留在此頁，請重試儲存。');
      throw error;
    }finally{clearTimeout(timer);}
  }
  function notice(text,retry){let box=$('#stageSaveNotice');if(!box){box=document.createElement('section');box.id='stageSaveNotice';$('#diagnosis').after(box);}box.replaceChildren();p(box,text);if(retry){const b=p(box,'重試儲存','button');b.onclick=retry;}}
  function lock(){const button=$('#downloadReport');if(button){button.disabled=true;if(button.textContent!=='完成第二階段後可下載完整報告')button.textContent='完成第二階段後可下載完整報告';}}
  document.addEventListener('math-demo-reset',()=>{epoch++;clientRunId=crypto.randomUUID();runId='';stage1Save=null;assistant=[];window.MathLatestReport=null;$('#stageSaveNotice')?.remove();$('#pdfDirectLink')?.remove();$('#pdfPreviewLink')?.remove();if(window.MathReportPdfURL){URL.revokeObjectURL(window.MathReportPdfURL);window.MathReportPdfURL='';}lock();});
  const observer=new MutationObserver(()=>{if(!window.MathLatestReport?.stage2Completed){lock();const restart=$('#restart');if(restart)restart.hidden=true;}});
  document.addEventListener('DOMContentLoaded',()=>{
    observer.observe($('#coach'),{childList:true,subtree:true});
    const note=document.createElement('p');note.textContent='觀念助手依題目與作答提供規則式引導，不直接給答案。請寫出第一步或想法，再比對觀念引導。';$('.ai-heading').after(note);
    const ask=$('#ask').onclick;$('#ask').onclick=()=>{ask();assistant.push({question:$('#thinking').value.slice(0,3000),guidance:$('#coachReply').textContent,at:new Date().toISOString()});};

  });
  function saveFirst(){const report=window.MathLatestReport,started=epoch;if(!report)return Promise.reject(Error('原測驗報告尚未建立'));report.stage2Completed=false;report.backendSaved=false;notice(staticMode?'第一階段已完成，正在目前瀏覽器整理學習結果。':'第一階段已完成，正在儲存到正式後台。');stage1Save=api('stage1',{report:structuredClone(report)}).then(result=>{if(started!==epoch)return result;runId=result.id;notice(staticMode?'第一階段結果已保留在目前頁面。先閱讀觀念分析，再完成 5 題補強；完成後可下載兩階段 PDF 報告。':'第一階段已儲存。先理解觀念與向助手提問，再到最底下完成 5 題新題。完成後會將兩階段結果合併至同一份報告。');return result;}).catch(error=>{if(started===epoch){stage1Save=null;notice(error.message+'；不要關閉頁面，請重試。',saveFirst);}throw error;});stage1Save.catch(()=>{});return stage1Save;}
  document.addEventListener('learning-stage1',()=>{
    lock();$('#restart').hidden=true;
    const report=window.MathLatestReport,box=$('#diagnosis');
    if(report){const list=document.createElement('ul');list.className='overall-advice';p(list,'本次首次答錯 '+report.wrongQuestions+' / '+report.totalQuestions+' 題；重做答對不會洗掉錯題。','li');
      const wrong=(report.attempts||[]).filter(item=>!item.timeline[0]?.correct),groups=new Map();
      for(const item of wrong)groups.set(item.unit,(groups.get(item.unit)||0)+1);
      for(const [unit,count] of [...groups].sort((a,b)=>b[1]-a[1]).slice(0,3)){const g=window.MathConceptGuide(wrong.find(item=>item.unit===unit));p(list,'優先複習 '+unit+'（首次錯 '+count+' 題）：'+g.concept+'。'+g.prompt,'li');}
      p(list,wrong.length?'先說明錯題使用的規則，再完成下方 5 題新題，檢查是否能自行運用。':'本次原題首次均答對；仍須完成 5 題新题，檢查能否換情境運用。','li');
      const h=document.createElement('h3');h.textContent='整體分析與練習重點';box.insertBefore(h,box.firstChild);h.after(list);
    }
    saveFirst().catch(()=>{});
  });
  function planFor(report,records){
    const units=[...new Set([...report.attempts,...records].map(r=>r.unit))];
    return units.map(unit=>{
      const main=report.attempts.filter(r=>r.unit===unit),check=records.filter(r=>r.unit===unit);
      const wrong=list=>list.filter(r=>!r.timeline[0]?.correct).length;
      const mainWrong=wrong(main),followupWrong=wrong(check);
      const focus=check.find(r=>!r.timeline[0]?.correct)||main.find(r=>!r.timeline[0]?.correct)||main[0]||check[0];
      const g=window.MathConceptGuide(focus||{unit});
      const analysis=check.length===0?'補強未抽到此單元，尚不能判定是否改善。':followupWrong>0?'補強仍有首次答錯，優先練習此觀念。':mainWrong>0?'本次補強首次均答對；隔天換題再確認。':'本次首次均答對，可換題型檢查理解。';
      return {unit,mainWrong,mainTotal:main.length,followupWrong,followupTotal:check.length,concept:g.concept,analysis,practice:g.prompt+'不看提示做 2 題不同情境，隔天再做 1 題。',check:g.check};
    }).sort((a,b)=>b.followupWrong-a.followupWrong||b.mainWrong-a.mainWrong);
  }
  function renderDetails(parent,title,records){const section=document.createElement('section');section.className='stage-review';p(section,title,'h3');for(const item of records){const d=document.createElement('details');p(d,`第 ${item.index} 題｜${item.unit}｜${item.timeline[0]?.correct?'首次答對':'首次答錯，後續修正'}`,'summary');p(d,item.question);p(d,'選項：'+item.options.map((o,i)=>`${String.fromCharCode(65+i)} ${o}`).join('；'));for(const t of item.timeline)p(d,`第 ${t.order||item.timeline.indexOf(t)+1} 次：${t.selectedOption}｜${t.correct?'答對':'答錯'}｜經過 ${(t.elapsedMs/1000).toFixed(1)} 秒`).className='trace';p(d,window.MathChoiceGuide(item,item.timeline.find(t=>!t.correct)?.selectedOption));p(d,'提示使用：'+(item.hint?'有':'沒有')+'；觀念引導查看：'+(item.explanationViewed?'有':'沒有'));p(d,'回顧說明：'+(item.explanation||item.explanationText||'請自行重列算式，對照條件與規則；向老師說明每一步的理由。'));section.append(d);}parent.append(section);}
  async function finish(records){const report=window.MathLatestReport,started=epoch;report.stage2Completed=false;report.backendSaved=false;report.integratedPlan=planFor(report,records);report.assistant=assistant;report.reflection=$('#thinking').value.slice(0,3000);lock();
    $('#coach > h2').textContent='第二階段｜整合回顧與下一步';$('#fiveQuestionReview')?.remove();const panel=$('#followupSummary');panel.replaceChildren();p(panel,'第二階段：把兩次測驗連起來看','h3');p(panel,`原測驗 ${report.totalQuestions} 題，首次答對 ${report.correctAnswers} 題；新觀念測驗 5 題，首次答對 ${report.followup.firstCorrect} 題。兩次首次表現分開呈現，重做不會洗掉錯題。`);
    // Replace the stage-one list rather than repeat it above the final report.
    const diagnosis=$('#diagnosis');
    const metrics=diagnosis.querySelector('.diagnosis-summary');
    diagnosis.replaceChildren();if(metrics)diagnosis.append(metrics);diagnosis.append(panel);
    const list=document.createElement('ul');list.className='overall-advice';
    const needs=report.integratedPlan.filter(plan=>plan.mainWrong||plan.followupWrong);
    p(list,'原測驗首次答錯 '+report.wrongQuestions+' 題；補強首次答錯 '+(5-report.followup.firstCorrect)+' 題。兩次結果分開計算。','li');
    for(const plan of needs.slice(0,3))p(list,'優先加強 '+plan.unit+'：'+plan.concept+'。'+plan.analysis+' 練習：'+plan.practice,'li');
    if(!needs.length)p(list,'本次兩階段首次均答對；下次換題型並說明解法，不只記選項。','li');
    const heading=document.createElement('h3');heading.textContent='整體分析與下一步';panel.insertBefore(heading,panel.firstChild);heading.after(list);
    renderDetails(panel,'原測驗：逐題作答與觀念回顧',report.attempts);
    renderDetails(panel,'5 題觀念測驗：逐題作答與觀念回顧',records);

    notice(staticMode?'正在目前瀏覽器整合兩階段作答、助手提問與複習建議…':'正在將兩階段作答、助手提問與整合分析儲存到正式後台…');
    try{
      if(!runId)await(stage1Save||saveFirst());if(started!==epoch)return;
      const payload=()=>({id:runId,records,plan:report.integratedPlan,assistant,reflection:report.reflection});
      let result;
      try{result=await api('stage2',payload());}catch(error){
        if(error.status!==404)throw error;
        // Re-save this page's own original record after a local session restart.
        // Never bypass ownership checks or adopt another session's stored report.
        runId='';stage1Save=null;await saveFirst();if(started!==epoch)return;
        result=await api('stage2',payload());
      }
      if(started!==epoch)return;report.stage2Completed=result.completed;report.backendSaved=true;if(result.play)report.playSummary=result.play;if(result.rewards){report.playRewards=result.rewards;window.MathPlayModes?.setRewards(result.rewards);}$('#restart').hidden=false;window.MathPlayModes?.reportSummary();
      notice(staticMode?'兩階段結果已整理完成。現在可下載自己的完整 PDF 學習報告；作答內容不會上傳到原站後台。':'兩階段已儲存到正式後台。現在可以下載完整 PDF；教師與開發者可依權限查看完整紀錄。');
      const button=$('#downloadReport');if(button){button.disabled=false;button.textContent='下載兩階段完整 PDF 報告';}
    }catch(error){if(started!==epoch)return;notice('尚未完整儲存：'+error.message+'。下載仍停用，請重試；測驗紀錄留在此頁。',()=>finish(records));}panel.scrollIntoView({behavior:'smooth'});
  }
  document.addEventListener('learning-stage2',event=>finish(event.detail.records));
})();
