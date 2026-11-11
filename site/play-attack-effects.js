/* Original, deterministic visual moves only. Never changes answers, HP or rewards. */
(()=>{
 'use strict';
 const moves=Object.freeze({
  dash:{name:'狐影突進',color:'#de9759',kind:'contact'},
  leaf:{name:'雙葉迴旋',color:'#65a458',kind:'ranged'},
  flame:{name:'暖焰連珠',color:'#e78a46',kind:'ranged'},
  bubble:{name:'泡泡浪潮',color:'#61b9d3',kind:'ranged'},
  crystal:{name:'稜晶飛矢',color:'#a491ce',kind:'ranged'},
  wind:{name:'螺旋風圈',color:'#7bbab0',kind:'ranged'},
  roll:{name:'果殼滾擊',color:'#b58b58',kind:'contact'},
  echo:{name:'月弧聲波',color:'#ad8fc9',kind:'ranged'},
  petal:{name:'花瓣躍擊',color:'#d795b3',kind:'contact'},
  beam:{name:'星光吐息',color:'#cfab57',kind:'ranged'},
  thunder:{name:'雲間電弧',color:'#c5a13e',kind:'ranged'},
  ice:{name:'雪晶散射',color:'#73b9ce',kind:'ranged'}
 });
 const families=[['leaf','wind','petal'],['flame','dash','beam'],['bubble','wind','ice'],['crystal','roll','beam'],['wind','thunder','echo'],['roll','leaf','crystal'],['echo','wind','ice'],['dash','flame','ice'],['petal','dash','leaf'],['beam','flame','thunder']];
 function choose(creature,turn=0){const list=families[creature?.family]||families[7];return list[(Math.max(0,Math.floor(turn))+Number(creature?.variant||0))%list.length];}
 const shapes={
  dash:'<path d="M70 110L140 88L128 110L180 104L118 139L127 119Z"/>',
  leaf:'<path d="M120 120Q65 40 175 68Q166 117 120 120ZM120 120Q173 189 67 167Q76 125 120 120Z"/><path d="M83 85L157 155" fill="none" stroke="#fff5d9"/>',
  flame:'<path d="M98 146Q62 118 104 83L110 55L139 88L156 70Q185 130 144 150Z"/><path d="M115 140Q98 120 133 96Q148 119 137 140Z" fill="#ffe3a3"/>',
  bubble:'<circle cx="122" cy="120" r="32"/><circle cx="73" cy="100" r="17"/><circle cx="87" cy="152" r="13"/><path d="M104 104Q111 94 126 96" fill="none" stroke="white" stroke-width="5"/>',
  crystal:'<path d="M83 120L128 79L171 120L128 160ZM60 89L77 67L96 89L77 110ZM68 159L89 140L108 159L89 180Z"/><path d="M128 79V160L83 120H171" fill="none" stroke="#efe5ff"/>',
  wind:'<path d="M53 103Q181 38 178 117Q175 172 81 151Q50 143 70 119Q85 103 140 114M60 172Q173 196 199 135M50 76Q102 41 152 55" fill="none" stroke-width="9"/>',
  roll:'<circle cx="120" cy="120" r="41"/><path d="M120 79L140 108L161 120L140 140L120 161L100 140L79 120L100 100Z" fill="none" stroke="#f4dfb7"/>',
  echo:'<path d="M80 94Q105 120 80 146M110 73Q157 120 110 167M143 54Q208 120 143 186" fill="none" stroke-width="8"/>',
  petal:'<path d="M120 120Q66 63 118 65Q167 64 120 120ZM120 120Q185 65 184 116Q183 168 120 120ZM120 120Q175 187 124 181Q74 181 120 120ZM120 120Q58 178 57 126Q55 73 120 120Z"/><circle cx="120" cy="120" r="10" fill="#fff0b2"/>',
  beam:'<path d="M180 113L820 100L852 120L820 140L180 127Z"/><path d="M190 120H825" stroke="#fff7d0" stroke-width="6"/><circle cx="180" cy="120" r="24" fill="#ffe5a5"/>',
  thunder:'<path d="M190 120L300 84L340 135L455 92L491 147L609 97L645 137L824 120" fill="none" stroke-width="14"/><path d="M190 120L300 84L340 135L455 92L491 147L609 97L645 137L824 120" fill="none" stroke="#fff8d8" stroke-width="5"/>',
  ice:'<path d="M120 77V163M82 98L158 142M82 142L158 98M110 85L120 96L130 85M145 101L139 115L155 115M130 155L120 144L110 155M85 125L101 125L95 139" fill="none" stroke-width="7"/>'
 };
 function markup(style){style=moves[style]?style:'dash';return `<svg viewBox="0 0 1000 240" preserveAspectRatio="none" aria-hidden="true"><g class="fx-shot fx-${style}" fill="${moves[style].color}" stroke="${moves[style].color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${shapes[style]}</g><g class="fx-contact" transform="translate(830 120)" fill="none" stroke="${moves[style].color}" stroke-width="5"><circle r="32"/><path d="M-60 0H-40M40 0H60M0-55V-38M0 38V55M-42-42L-28-28M28 28L42 42M-42 42L-28 28M28-28L42-42"/></g></svg>`;}
 function mount(panel,effect){if(!panel||!effect)return;const arena=panel.querySelector?.('.play-arena');if(!arena)return;const style=moves[effect.style]?effect.style:'dash';panel.dataset.attackStyle=style;panel.dataset.attackKind=moves[style].kind;panel.dataset.attackSide=effect.side==='foe'?'foe':'ally';arena.querySelector('.combat-fx')?.remove();const layer=document.createElement('div');layer.className='combat-fx';layer.setAttribute('aria-hidden','true');layer.innerHTML=markup(style);arena.append(layer);}
 window.MathCombatEffects=Object.freeze({moves,choose,markup,mount});
})();
