/* Original BenchCalc SVG artwork. No external images or fonts. */
(() => {
  const body='M194 40 Q173 40 173 62 L173 118 Q173 140 194 140 L221 140 Q239 130 257 130 H421 Q440 130 458 140 H486 Q507 140 507 118 V62 Q507 40 486 40 H458 Q440 50 421 50 H257 Q239 50 221 40 Z';
  const svg=inner=>`<svg id="component" viewBox="0 0 680 190" role="img" aria-labelledby="component-title component-desc"><title id="component-title">Component illustration</title><desc id="component-desc"></desc>${inner}</svg>`;
  function axial(count,inductor=false){
    const positions={3:[213,274,335],4:[213,274,335,448],5:[207,254,301,348,451],6:[201,244,287,330,410,461]}[count];
    const digits=count>=5?3:2;
    return svg(`<defs><linearGradient id="body" x2="0" y2="1"><stop stop-color="${inductor?'#b5d7b7':'#f1dbb0'}"/><stop offset="1" stop-color="${inductor?'#6f9b77':'#bfa26c'}"/></linearGradient><linearGradient id="wire" gradientUnits="userSpaceOnUse" x1="0" y1="84" x2="0" y2="96"><stop stop-color="#aab3bd"/><stop offset=".45" stop-color="#e4e8ed"/><stop offset="1" stop-color="#7b8691"/></linearGradient><clipPath id="body-clip"><path d="${body}"/></clipPath></defs><path d="M30 90 H178 M503 90 H650" stroke="url(#wire)" stroke-width="11" stroke-linecap="round"/><path d="${body}" fill="url(#body)" stroke="${inductor?'#54745a':'#a88d60'}" stroke-width="2"/><g clip-path="url(#body-clip)">${positions.map((x,i)=>`<rect id="band-${i}" x="${x}" y="38" width="23" height="105"/>`).join('')}</g><g class="svg-label" text-anchor="middle">${positions.map((x,i)=>`<text x="${x+11.5}" y="166">${i<digits?i+1:i===digits?'×':i===digits+1?'±':'T'}</text>`).join('')}</g>`);
  }
  function smd(){
    return svg(`<defs><linearGradient id="metal" x2="0" y2="1"><stop stop-color="#f0f3f5"/><stop offset=".5" stop-color="#c2cbd0"/><stop offset="1" stop-color="#8e9aa1"/></linearGradient></defs><rect x="218" y="42" width="244" height="105" rx="9" fill="#1d2225" stroke="#6a757c" stroke-width="2"/><path d="M227 43H257V146H227Q218 146 218 137V52Q218 43 227 43M453 43H423V146H453Q462 146 462 137V52Q462 43 453 43" fill="url(#metal)"/><path d="M263 48H417" stroke="#566166" stroke-width="3"/><text id="printed-code" x="340" y="108" text-anchor="middle" fill="#faf7ea" font-family="ui-monospace,monospace" font-size="37" letter-spacing="4">472</text>`);
  }
  function capacitor(kind){
    const wires='<path d="M304 113V178M377 113V178" stroke="#a6b2bc" stroke-width="6" stroke-linecap="round"/>';
    let shape;
    if(kind==='film') shape='<rect x="249" y="30" width="183" height="108" rx="9" fill="#b75042" stroke="#8e4036" stroke-width="2"/><path d="M259 36H422" stroke="#d78d76" stroke-width="4"/><text id="printed-code" x="340" y="94" text-anchor="middle" fill="#fff0d3" font-family="ui-monospace,monospace" font-size="29">104</text>';
    else if(kind==='tantalum') shape='<path d="M284 119Q265 69 300 30Q334 -2 369 27Q411 58 398 113Q394 143 371 141H311Q290 141 284 119" fill="#e1b74e" stroke="#b08a32" stroke-width="2"/><path d="M304 55V105M293 67H315" stroke="#5d4824" stroke-width="3"/><text id="printed-code" x="350" y="99" text-anchor="middle" fill="#4f4025" font-family="ui-monospace,monospace" font-size="25">105</text>';
    else shape='<ellipse cx="340" cy="83" rx="77" ry="68" fill="#c98948" stroke="#a56937" stroke-width="2"/><path d="M292 45Q332 14 377 43" fill="none" stroke="#e0ac72" stroke-width="5" stroke-linecap="round"/><text id="printed-code" x="340" y="98" text-anchor="middle" fill="#3f2e20" font-family="ui-monospace,monospace" font-size="31">104</text>';
    return svg(wires+shape);
  }
  window.BenchCalcGraphics={axial,smd,capacitor};
})();
