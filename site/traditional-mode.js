// Traditional assessments intentionally have no monster roster, renderer or combat state.
(()=>{
 function reportSummary(){if(window.MathLatestReport)window.MathLatestReport.playMode='traditional';}
 document.addEventListener('learning-stage1',reportSummary);
})();
