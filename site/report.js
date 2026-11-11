(() => {
  const $ = (s) => document.querySelector(s);
  let rows = [],
    current = null,
    finalized = false;
  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c],
    );
  function reset() {
    rows = [];
    current = null;
    finalized = false;
  }
  function ensureCurrent() {
    const tag = $('#tag')?.textContent.split('｜') || [];
    if (!current || current.question !== $('#question')?.textContent)
      current = {
        question: $('#question')?.textContent || '',
        grade: tag[0] || '',
        unit: tag[1] || '',
        level: tag[2] || '',
        wrong: 0,
        hint: false,
      };
    return current;
  }
  document.addEventListener('math-question-shown', (event) => {
    const detail = event.detail || {};
    current = {
      index: Number(detail.index || 0),
      question: String(detail.question || ''),
      grade: String(detail.grade || ''),
      unit: String(detail.unit || ''),
      level: String(detail.level || ''),
      options: Array.isArray(detail.options) ? detail.options.map(String) : [],
      startedAt: String(detail.startedAt || new Date().toISOString()),
      wrong: 0,
      hint: false,
      explanationViewed: false,
      timeline: [],
    };
  });
  document.addEventListener('math-answer', (event) => {
    const detail = event.detail || {},
      question = ensureCurrent();
    question.timeline = Array.isArray(question.timeline)
      ? question.timeline
      : [];
    question.timeline.push({
      order: question.timeline.length + 1,
      selectedIndex: Number(detail.selectedIndex),
      selectedOption: String(detail.selectedOption || ''),
      correct: Boolean(detail.correct),
      elapsedMs: Math.max(0, Number(detail.elapsedMs || 0)),
    });
    question.correctOption = String(detail.correctOption || '');
    question.durationMs = Math.max(
      question.durationMs || 0,
      Number(detail.elapsedMs || 0),
    );
    if (detail.correct) {
      if (!rows.includes(question)) rows.push(structuredClone(question));
    } else question.wrong++;
  });
  document.addEventListener('math-hint', (event) => {
    const detail = event.detail || {},
      question = ensureCurrent();
    if (!question.hint) {
      question.hint = true;
      question.hintAtMs = Math.max(0, Number(detail.elapsedMs || 0));
      question.hintText = String(detail.text || '');
    }
  });
  document.addEventListener('math-explanation', (event) => {
    const detail = event.detail || {},
      question = ensureCurrent();
    if (!question.explanationViewed) {
      question.explanationViewed = true;
      question.explanationAtMs = Math.max(0, Number(detail.elapsedMs || 0));
      question.explanationText = String(detail.text || '');
    }
  });
  function saveStatus(message, tone = 'calm', retryReport = null) {
    let box = $('#reportSaveStatus');
    if (!box) {
      box = document.createElement('div');
      box.id = 'reportSaveStatus';
      box.className = 'diagnosis';
      const anchor = $('#extendedReport') || $('#diagnosis');
      anchor?.insertAdjacentElement('afterend', box);
    }
    if (!box) return;
    box.dataset.tone = tone;
    box.innerHTML = `<strong>${esc(message)}</strong>${retryReport ? '<br><button id="retryReportSave" type="button">重新儲存報告</button>' : ''}`;
    if (retryReport) $('#retryReportSave').onclick = () => store(retryReport);
  }
  async function store(report) {
    window.MathLatestReport = report;
    if (window.MathTwoStageLearning) {
      // Stage events save both phases through authenticated production APIs.
      return;
    }
    const role = window.MathStudentAuth?.role;
    if (
      !window.MathSecureApi ||
      !['student', 'teacher', 'developer', 'approved_user'].includes(role)
    ) {
      saveStatus(
        role === 'guest'
          ? '本次結果尚未上傳：登入狀態已失效，請重新登入後再測一次。'
          : '本次結果只保留在目前頁面；登入有效帳號後才能儲存至後台。',
        'error',
      );
      return;
    }
    const profileGrade = Number(window.MathStudentAuth?.studentProfile?.grade),
      label = String(report.attempts?.[0]?.grade || ''),
      parsed = Number((label.match(/[789]/) || [])[0]),
      grade = [7, 8, 9].includes(profileGrade)
        ? profileGrade
        : [7, 8, 9].includes(parsed)
          ? parsed
          : 9;
    const payload = {
      grade,
      totalQuestions: report.totalQuestions,
      firstCorrect: report.correctAnswers,
      hintsUsed: report.attempts.filter((x) => x.hint).length,
      unitSummary: report.units,
      attempts: report.attempts.map((x) => ({
        index: Number(x.index || 0),
        grade: String(x.grade || '').slice(0, 30),
        unit: String(x.unit || '').slice(0, 120),
        level: String(x.level || '').slice(0, 30),
        question: String(x.question || '').slice(0, 1000),
        options: (x.options || [])
          .slice(0, 8)
          .map((value) => String(value).slice(0, 500)),
        correctOption: String(x.correctOption || '').slice(0, 500),
        wrong: Number(x.wrong || 0),
        hint: Boolean(x.hint),
        hintAtMs: Number(x.hintAtMs || 0),
        hintText: String(x.hintText || '').slice(0, 1000),
        explanationViewed: Boolean(x.explanationViewed),
        explanationAtMs: Number(x.explanationAtMs || 0),
        durationMs: Number(x.durationMs || 0),
        timeline: (x.timeline || [])
          .slice(0, 20)
          .map((step) => ({
            order: Number(step.order || 0),
            selectedIndex: Number(step.selectedIndex),
            selectedOption: String(step.selectedOption || '').slice(0, 500),
            correct: Boolean(step.correct),
            elapsedMs: Number(step.elapsedMs || 0),
          })),
      })),
    };
    saveStatus('正在安全儲存這次測驗結果…', 'working');
    try {
      await window.MathSecureApi.api('/api/reports', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      saveStatus('測驗結果已安全儲存，開發者可於後台查看。', 'success');
    } catch (error) {
      saveStatus(
        `結果尚未儲存：${error?.message || '連線失敗，請稍後重試。'}`,
        'error',
        report,
      );
    }
  }
  function summarize() {
    if (finalized || !rows.length) return;
    finalized = true;
    const first = rows.filter((x) => x.wrong === 0).length,
      mastered = rows.filter((x) => x.wrong === 0 && !x.hint).length,
      firstRate = Math.round((first / rows.length) * 100),
      mastery = Math.round((mastered / rows.length) * 100),
      band =
        mastery >= 80
          ? '觀念穩定'
          : mastery >= 50
            ? '逐步建立中'
            : '需要優先複習',
      units = {};
    rows.forEach((x) => {
      const s =
        units[x.unit] ||
        (units[x.unit] = { count: 0, mastered: 0, wrong: 0, hints: 0 });
      s.count++;
      s.mastered += x.wrong === 0 && !x.hint ? 1 : 0;
      s.wrong += x.wrong;
      s.hints += x.hint ? 1 : 0;
    });
    const unitHtml = Object.entries(units)
        .map(
          ([n, s]) =>
            `${esc(n)}：${Math.round((s.mastered / s.count) * 100)}%（錯誤嘗試 ${s.wrong} 次、提示 ${s.hints} 次）`,
        )
        .join('<br>'),
      report = {
        id: Date.now(),
        student: window.MathStudentAuth?.currentKey || 'unverified',
        createdAt: new Date().toISOString(),
        totalQuestions: rows.length,
        correctAnswers: first,
        firstRate,
        mastery,
        referenceBand: band,
        units,
        attempts: rows,
      };
    store(report);
    let box = $('#extendedReport');
    if (!box) {
      box = document.createElement('div');
      box.id = 'extendedReport';
      box.className = 'diagnosis';
      $('#diagnosis').insertAdjacentElement('afterend', box);
    }
    const focusHtml = rows
      .filter((item) => item.wrong > 0 || item.hint)
      .slice(0, 3)
      .map((item) => {
        const analysis = window.MathRemediation?.analyze?.(item);
        return analysis
          ? `<li><strong>${esc(item.unit)}</strong>：${esc(analysis.misconception)}<br>先確認「${esc(analysis.prerequisites)}」，再練習「${analysis.suggestedQuestions.map(esc).join('、')}」。</li>`
          : '';
      })
      .join('');
    box.innerHTML = `<strong>進階學習診斷</strong><br>總題數：${rows.length} 題<br>首次作答正確：${first} 題<br>無提示內容掌握度：${mastery}%<br>學習狀態：${band}<br><strong>各單元：</strong><br>${unitHtml}${focusHtml ? `<br><strong>本次優先回顧：</strong><ol>${focusHtml}</ol><small>以上為依本次作答歷程產生的可能性判讀，仍需由後續題目或教師觀察確認。</small><br>` : '<br>'}<strong>整體建議：</strong>${mastery < 50 ? '回到基礎例題，先口說已知條件與第一步。' : mastery < 80 ? '重做有提示或答錯的題目，再練習中等題。' : '可進入跨單元及會考素養題，並說明每一步理由。'}`;
  }
  document.addEventListener('math-test-finished', () => {
    summarize();
    buttons();
  });
  document.addEventListener('math-demo-reset', reset);
  const bytes = (value) => new TextEncoder().encode(value),
    joinBytes = (parts) => {
      const size = parts.reduce((sum, part) => sum + part.length, 0),
        out = new Uint8Array(size);
      let offset = 0;
      parts.forEach((part) => {
        out.set(part, offset);
        offset += part.length;
      });
      return out;
    };
  function canvasesFor(report) {
    const pages = [];
    let canvas, ctx, y;
    const width = 1240,
      height = 1754,
      margin = 92,
      maxWidth = width - margin * 2;
    function page() {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fffdf7';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#36504a';
      ctx.fillRect(0, 0, width, 26);
      y = 90;
      pages.push(canvas);
    }
    function need(space) {
      if (y + space > height - 90) page();
    }
    function lines(text, size = 30, bold = false, color = '#25352f', gap = 14) {
      ctx.font = `${bold ? '700' : '400'} ${size}px "Microsoft JhengHei","Noto Sans TC",sans-serif`;
      const words = Array.from(String(text)),
        rows = [];
      let row = '';
      for (const word of words) {
        if (ctx.measureText(row + word).width > maxWidth && row) {
          rows.push(row);
          row = word;
        } else row += word;
      }
      if (row) rows.push(row);
      need(rows.length * (size + gap) + 12);
      // Restore the font after creating a fresh page context.
      ctx.font = (bold ? '700' : '400')+' '+size+'px "Microsoft JhengHei","Noto Sans TC",sans-serif';
      ctx.fillStyle = color;
      for (const item of rows) {
        ctx.fillText(item, margin, y);
        y += size + gap;
      }
      y += 8;
    }
    function rule() {
      need(28);
      ctx.strokeStyle = '#bfd7ca';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(width - margin, y);
      ctx.stroke();
      y += 28;
    }
    page();
    lines('數學學習分析報告', 54, true, '#245c4c');
    lines(
      `產生時間：${new Date(report.createdAt).toLocaleString('zh-TW')}`,
      24,
      false,
      '#587069',
    );
    lines(
      `使用者：${window.MathStudentAuth?.currentEmail || '本人測驗紀錄'}`,
      24,
      false,
      '#587069',
    );
    rule();
    if(report.stage2Completed){
      const play=report.playSummary;
      if(play&&play.mode!=='traditional')lines('學習模式：'+(play.mode==='battle'?'怪物對戰｜累積傷害 '+play.totalDamage+'；驅散迷霧怪 '+(play.defeated||0)+' 位':'收集精靈｜'+(Array.isArray(play.companions)?play.companions.join('、'):'旅伴探索完成'))+'。遊戲獎勵與學習答對率分開呈現。',25);
      lines('整體分析與練習重點',38,true);
      lines('原測驗 '+report.totalQuestions+' 題：首次答對 '+report.correctAnswers+' 題，首次答錯 '+report.wrongQuestions+' 題，最後答對 '+report.finallyCorrect+' 題；首次答對率 '+report.firstRate+'%。',27);
      lines('補強 5 題：首次答對 '+report.followup.firstCorrect+' 題，首次答錯 '+(5-report.followup.firstCorrect)+' 題，最後答對 '+report.followup.finallyCorrect+' 題。',27);
      const needs=(report.integratedPlan||[]).filter(p=>p.mainWrong||p.followupWrong);
      for(const p of needs.slice(0,3))lines('• '+p.unit+'｜'+p.concept+'：'+p.analysis+' 練習：'+p.practice,25);
      if(!needs.length)lines('• 本次首次均答對；換題型並說明每一步的理由，再確認理解。',25);
      for(const [title,records] of [['原測驗逐題回顧',report.attempts],['5 題觀念測驗逐題回顧',report.followup.attempts]]){
        need(380);rule();lines(title,38,true);
        for(const item of records){
          need(420);
          lines('第 '+item.index+' 題｜'+item.unit+'｜'+(item.timeline[0]?.correct?'首次答對':'首次答錯，後續修正'),27,true);
          lines(item.question,24);lines(item.options.map((o,i)=>String.fromCharCode(65+i)+'. '+o).join('；'),23);
          for(const t of item.timeline)lines('第 '+(t.order||item.timeline.indexOf(t)+1)+' 次選 '+t.selectedOption+'｜'+(t.correct?'答對':'答錯'),23);
          lines(window.MathChoiceGuide(item,item.timeline.find(t=>!t.correct)?.selectedOption),23);
          lines('完成後回顧：'+(item.explanation||item.explanationText||'重新列式，說明使用的規則。'),23);rule();
        }
      }
      need(220);rule();lines('AI 助手提問與引導紀錄',38,true);
      if(report.assistant?.length){for(const entry of report.assistant){lines('提問：'+entry.question,24,true);lines(entry.guidance,23);rule();}}
      else lines('本次未留下助手提問。下次可說明卡住的步驟，再請助手協助檢查觀念。',24);
      pages.forEach((sheet,i)=>{const footer=sheet.getContext('2d');footer.font='24px "Microsoft JhengHei",sans-serif';footer.fillStyle='#587069';footer.fillText('第 '+(i+1)+' / '+pages.length+' 頁',width-margin-180,height-40);});
      return pages;
    }
    lines('整體學習結果', 38, true, '#a05d35');
    lines(
      `總題數 ${report.totalQuestions} 題　｜　首次答對 ${report.correctAnswers} 題`,
      32,
      true,
    );
    lines(`首次答錯 ${report.wrongQuestions ?? report.totalQuestions-report.correctAnswers} 題｜最後答對 ${report.finallyCorrect ?? report.totalQuestions} 題（含重做）｜首次答對率 ${report.firstRate}%`,27);
    if(report.followup)lines(`另列補強結果：5 題中首次答對 ${report.followup.firstCorrect} 題，最後答對 ${report.followup.finallyCorrect} 題。原測驗结果不變。`,27);
    lines(
      `無提示內容掌握度 ${report.mastery}%　｜　學習狀態：${report.referenceBand}`,
      30,
    );
    lines(
      '本報告用於安排複習方向，不排名，也不換算成考試分數。',
      25,
      false,
      '#66736e',
    );
    rule();
    lines('各單元掌握度', 38, true, '#a05d35');
    Object.entries(report.units).forEach(([name, data]) => {
      const mastery = Math.round((data.mastered / data.count) * 100);
      lines(`${name}`, 31, true);
      lines(
        `掌握度 ${mastery}%　｜　錯誤嘗試 ${data.wrong} 次　｜　使用提示 ${data.hints} 次`,
        26,
        false,
        mastery < 50 ? '#a34135' : '#36504a',
      );
    });
    rule();
    lines('需要回顧的題目', 38, true, '#a05d35');
    const review = report.attempts.filter(
      (item) => item.wrong > 0 || item.hint,
    );
    if (!review.length)
      lines('本次沒有需要特別回顧的題目，請保持說明解題理由的習慣。', 27);
    review.forEach((item, index) => {
      const analysis = window.MathRemediation?.analyze?.(item),
        wrongChoices = analysis?.wrongChoices || [];
      lines(`${index + 1}. ${item.unit}｜${item.level}`, 27, true);
      lines(item.question, 25);
      lines(
        `紀錄：錯誤嘗試 ${item.wrong} 次${item.hint ? '，曾使用提示' : '，未使用提示'}`,
        23,
        false,
        '#6d655d',
      );
      if (wrongChoices.length)
        lines(`曾選錯：${wrongChoices.join('、')}`, 23, false, '#9a493c');
      if (item.correctOption)
        lines(`正確答案：${item.correctOption}`, 23, true, '#356b59');
      if (analysis) {
        lines(`可能的學習卡點：${analysis.misconception}`, 23);
        lines(`建議先確認：${analysis.prerequisites}`, 23);
        lines(`建議練習：${analysis.suggestedUnit}｜${analysis.suggestedQuestions.join('、')}`, 23);
        lines(analysis.caution, 20, false, '#6d655d');
      }
      rule();
    });
    rule();
    lines('下一步建議', 38, true, '#a05d35');
    lines(
      report.mastery < 50
        ? '先回到基礎例題：每題圈出已知條件，口頭說出要找什麼，再只寫第一個步驟。完成後重做本報告列出的題目。'
        : report.mastery < 80
          ? '優先重做曾答錯或使用提示的題目，寫下錯誤原因，再選同單元中等題練習並說明每一步。'
          : '可挑戰跨單元與會考素養題；完成後用自己的話說明選擇方法及排除其他選項的理由。',
      28,
    );
    if (report.stage2Completed) {
      page();lines('兩階段整合：優先複習觀念與具體安排',38,true);
      for (const plan of report.integratedPlan || []) {lines(plan.unit+'｜'+plan.concept,29,true);lines(`原測驗首次答錯 ${plan.mainWrong}/${plan.mainTotal}；觀念測驗首次答錯 ${plan.followupWrong}/${plan.followupTotal}`,24);lines(plan.analysis,24);lines('練習安排：'+plan.practice,24);lines('檢查方式：'+plan.check,24);rule();}
      for(const [title, records] of [['第一階段原測驗完整紀錄',report.attempts],['第二階段觀念測驗完整紀錄',report.followup?.attempts || []]]) {
        page();lines(title,38,true);
        for(const item of records){lines(`第 ${item.index} 題｜${item.unit}`,27,true);lines(item.question,24);lines('選項：'+item.options.map((o,i)=>`${String.fromCharCode(65+i)}. ${o}`).join('；'),23);for(const t of item.timeline)lines(`第 ${t.order||item.timeline.indexOf(t)+1} 次：${t.selectedOption}｜${t.correct?'答對':'答錯'}｜${(t.elapsedMs/1000).toFixed(1)} 秒`,22);lines(window.MathConceptGuide(item).text,23);lines('回顧說明：'+(item.explanation||item.explanationText||'重新列式並說明每一步使用的規則。'),23);rule();}
      }
      if(report.assistant?.length){page();lines('觀念助手提問與引導紀錄',38,true);for(const interaction of report.assistant){lines('提問：'+interaction.question,24,true);lines(interaction.guidance,23);rule();}}
    }
    return pages;
  }
  function pdfFromCanvases(canvases) {
    const images = canvases.map((canvas) => {
        const raw = atob(canvas.toDataURL('image/jpeg', 0.9).split(',')[1]),
          data = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) data[i] = raw.charCodeAt(i);
        return { data, width: canvas.width, height: canvas.height };
      }),
      objects = [];
    objects[1] = bytes('<< /Type /Catalog /Pages 2 0 R >>');
    const kids = [];
    images.forEach((image, index) => {
      const pageId = 3 + index * 3,
        imageId = pageId + 1,
        contentId = pageId + 2;
      kids.push(`${pageId} 0 R`);
      objects[pageId] = bytes(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
      );
      objects[imageId] = joinBytes([
        bytes(
          `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.data.length} >>\nstream\n`,
        ),
        image.data,
        bytes('\nendstream'),
      ]);
      const content = bytes('q 595 0 0 842 0 0 cm /Im0 Do Q');
      objects[contentId] = joinBytes([
        bytes(`<< /Length ${content.length} >>\nstream\n`),
        content,
        bytes('\nendstream'),
      ]);
    });
    objects[2] = bytes(
      `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${images.length} >>`,
    );
    const parts = [bytes('%PDF-1.4\n%PDF\n')],
      offsets = [0];
    for (let id = 1; id < objects.length; id++) {
      offsets[id] = parts.reduce((sum, part) => sum + part.length, 0);
      parts.push(bytes(`${id} 0 obj\n`), objects[id], bytes('\nendobj\n'));
    }
    const xref = parts.reduce((sum, part) => sum + part.length, 0);
    let table = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let id = 1; id < objects.length; id++)
      table += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
    parts.push(
      bytes(
        table +
          `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`,
      ),
    );
    return new Blob(parts, { type: 'application/pdf' });
  }
  async function downloadPdf() {
    const report = window.MathLatestReport;
    if(window.MathTwoStageLearning && (!report?.stage2Completed || !report?.backendSaved)){alert('請先完成 5 題新觀念測驗及第二階段整合儲存，再下載完整報告。');return;}
    if (!report) {
      alert('請先完成測驗，才能建立分析報告。');
      return;
    }
    const button = $('#downloadReport'),
      original = button?.textContent;
    try {
      if (button) {
        button.disabled = true;
        button.textContent = '正在建立 PDF…';
      }
      await document.fonts?.ready;
      const blob = pdfFromCanvases(canvasesFor(report)),
        url = URL.createObjectURL(blob),
        link = document.createElement('a');
      link.href = url;
      link.download = `數學學習分析報告_${new Date(report.createdAt).toISOString().slice(0, 10)}.pdf`;
      if(window.MathTwoStageLearning){let direct=$('#pdfDirectLink');if(!direct){direct=document.createElement('a');direct.id='pdfDirectLink';button.insertAdjacentElement('afterend',direct);}direct.href=url;direct.download=link.download;direct.textContent='PDF 已建立；若未開始下載，請點這裡';let preview=$('#pdfPreviewLink');if(!preview){preview=document.createElement('a');preview.id='pdfPreviewLink';direct.insertAdjacentElement('afterend',preview);}preview.href=url;preview.target='_blank';preview.rel='noopener';preview.textContent='開啟 PDF 預覽／另存';}
      document.body.appendChild(link);
      link.click();
      link.remove();
      if(window.MathReportPdfURL)URL.revokeObjectURL(window.MathReportPdfURL);window.MathReportPdfURL=url;
    } catch (error) {
      console.error(error);
      alert('PDF 尚未完成：'+(error.message||'請稍後再試')+'。請保留此頁，再按下載或重試儲存，不必重做測驗。');
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = original;
      }
    }
  }
  function buttons() {
    if ($('#downloadReport')) return;
    const download = document.createElement('button');
    download.id = 'downloadReport';
    download.className = 'primary';
    download.textContent = '下載自己的 PDF 分析報告';
    download.onclick = downloadPdf;
    $('#restart').insertAdjacentElement('beforebegin', download);
    const role = window.MathStudentAuth?.role;
    if (role === 'developer' || role === 'teacher') {
      const dashboard = document.createElement('button');
      dashboard.id = 'teacherDashboard';
      dashboard.textContent =
        role === 'developer' ? '開啟開發者全校後台' : '開啟教師班級後台';
      dashboard.onclick = () =>
        window.open(
          window.MATH_AUTH_CONFIG?.reporting?.teacherDashboard ||
            'teacher-dashboard.html',
          '_blank',
        );
      $('#restart').insertAdjacentElement('beforebegin', dashboard);
    }
  }
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.id === 'next')
      setTimeout(() => {
        if (!$('#coach').classList.contains('hidden')) {
          summarize();
          buttons();
        }
      }, 0);
  });
})();
