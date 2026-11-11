/* Safe arithmetic parser: no eval or executable question content. */
(()=>{
 function evaluate(input,x){
  const powers={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+'};
  const text=String(input).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g,s=>'^('+[...s].map(c=>powers[c]).join('')+')').normalize('NFKC').replace(/[−－]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/\s/g,'');
  if(!text||!/^[\d.x+*/^()√-]+$/.test(text))throw Error('not-arithmetic');
  const tokens=text.match(/\d+(?:\.\d+)?|\.\d+|[x+*/^()√-]/g);if(!tokens||tokens.join('')!==text)throw Error('invalid-token');let i=0;
  function atom(){const t=tokens[i++];if(t==='('){const v=sum();if(tokens[i++]!==')')throw Error('parenthesis');return v;}if(t==='√')return Math.sqrt(power());if(t==='x'&&Number.isFinite(x))return x;if(t&&/^\d|^\.\d/.test(t))return Number(t);throw Error('atom');}
  function power(){let v=atom();if(tokens[i]==='^'){i++;v=v**signed();}return v;}
  function signed(){if(tokens[i]==='+'){i++;return signed();}if(tokens[i]==='-'){i++;return -signed();}return power();}
  function product(){let v=signed();while(i<tokens.length){const t=tokens[i];if(t==='*'||t==='/'){i++;const n=signed();v=t==='*'?v*n:v/n;}else if(t==='('||t==='√'||t==='x'){v*=signed();}else break;}return v;}
  function sum(){let v=product();while(tokens[i]==='+'||tokens[i]==='-'){const t=tokens[i++],n=product();v=t==='+'?v+n:v-n;}return v;}
  const result=sum();if(i!==tokens.length||!Number.isFinite(result))throw Error('invalid-result');return result;
 }
 function identity(value){
  const raw=String(value??'').trim(),unit=raw.match(/(平方公尺|平方公分|公尺|公分|元|人|個|本|倍|度|°|cm²|cm|m²|m)$/)?.[0]||'',expr=unit?raw.slice(0,-unit.length):raw;
  try{return 'number:'+Number(evaluate(expr).toPrecision(12))+':'+unit;}catch{}
  if(/x/.test(expr)&&!/[√/]/.test(expr)&&!/\^[5-9]/.test(expr))try{return 'polynomial:'+[-2,-1,0,1,2,3].map(x=>Number(evaluate(expr,x).toPrecision(12))).join(',')+':'+unit;}catch{}
  return raw.normalize('NFKC').replace(/[−－]/g,'-').replace(/\s/g,'');
 }
 window.MathAnswerQuality={evaluate,identity};
})();
