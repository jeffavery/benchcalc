/* Circuit-design tools share one form/result renderer and pure calculation module. */
(() => {
  'use strict';
  const C=BenchCalcCircuits, memo=new Map();
  const names=[['converter','Unit converter'],['led','LED resistor'],['timer','555 timer'],['wire','Wire gauge & current'],['ohm',"Ohm’s law"],['voltage','Voltage divider'],['current','Current divider'],['resistor-network','Series / parallel resistors'],['capacitor-network','Series / parallel capacitors']];
  const tools=names.map(([id,name])=>({id,name,family:'Circuit tools',kind:'design'}));
  const num=(id,label,value,scale=1,optional=false)=>({id,label,value,scale,optional});
  const select=(id,label,value,options)=>({id,label,value,options});
  const text=(id,label,value)=>({id,label,value,textarea:true});
  const fmt=(n,unit)=>{
    if(n===0)return `0 ${unit}`;
    if(unit==='Hz' && Math.abs(n)<1)return `${Number(n.toPrecision(4))} Hz`;
    const p=[[1e9,'G'],[1e6,'M'],[1e3,'k'],[1,''],[1e-3,'m'],[1e-6,'µ'],[1e-9,'n'],[1e-12,'p']].find(([v])=>Math.abs(n)>=v)||[1,''];
    return `${Number((n/p[0]).toPrecision(4))} ${p[1]}${unit}`;
  };
  const nfmt=n=>String(Number(n.toPrecision(4)));
  const row=(label,value,unit)=>[label,unit?fmt(value,unit):String(value)];
  const link=(label,url)=>({label,url});
  const pairs={vi:[['Voltage (V)',12],['Current (A)',0.02]],vr:[['Voltage (V)',12],['Resistance (Ω)',1000]],ir:[['Current (A)',0.02],['Resistance (Ω)',1000]],vp:[['Voltage (V)',12],['Power (W)',0.24]],ip:[['Current (A)',0.02],['Power (W)',0.24]],rp:[['Resistance (Ω)',1000],['Power (W)',0.25]]};
  function spec(id,v){
    if(id==='converter'){
      const category=v.category||'capacitance',units=Object.keys(C.conversionUnits[category]);
      return {intro:'Enter a value in any listed unit to see all equivalent values.',fields:[select('category','Conversion type','capacitance',[['capacitance','Capacitance'],['resistance','Resistance'],['timing','Frequency / period']]),num('value','Value',category==='timing'?1:100),select('unit','Input unit',category==='capacitance'?'nF':category==='resistance'?'Ω':'kHz',units.map(u=>[u,u]))],calculate:C.convert,
        rows:r=>Object.entries(r).map(([unit,value])=>[unit,String(Number(value.toPrecision(10)))+' '+unit]),
        formula:category==='timing'?'Frequency (Hz) = 1 / period (s).':category==='capacitance'?'1 µF = 1,000 nF = 1,000,000 pF.':'1 MΩ = 1,000 kΩ = 1,000,000 Ω.',
        note:category==='timing'?'Frequency and period must be greater than zero. Period is the duration of one complete cycle. Results show up to 10 significant digits.':'Zero is allowed. Results show up to 10 significant digits.',sources:[]};
    }

    if(id==='led')return {
      intro:'Size one resistor for one LED or a string of LEDs in series.',
      fields:[num('supply','Supply voltage (V)',5),num('forward','Forward voltage per LED (V)',2),num('current','Target LED current (mA)',10,0.001),num('count','LEDs in series',1)],
      calculate:C.led,
      rows:r=>[row('Suggested E24 resistor',r.resistor,'Ω'),row('Calculated resistance',r.ideal,'Ω'),row('Nominal current with E24',r.actual,'A'),row('Resistor dissipation',r.power,'W'),row('Power rating, with 2× margin',`${nfmt(r.rating)} W`),row('Voltage across resistor',r.drop,'V')],
      formula:'R = (Vs − N × Vf) / I; resistor power = I²R. E24 selection rounds resistance upward.',
      note:'Use the LED datasheet for forward voltage and operating current. Results use nominal values: supply, LED, and resistor tolerances can change the actual current. Give each parallel LED string its own resistor. Check resistor derating at the operating temperature.',
      sources:[]
    };
    if(id==='timer'){
      const mono=v.mode==='mono',design=v.direction==='design';
      return {intro:'Estimate timing for the standard 555 arrangements.',fields:[select('direction','Calculate','timing',[['timing','Timing from components'],['design','Resistors from target timing']]),select('mode','Operating mode','astable',[['astable','Astable · repeating pulses'],['mono','Monostable · one-shot pulse']]),...(design?(mono?[num('pulse','Target pulse duration (s)',1)]:[num('frequency','Target frequency (Hz)',1),num('duty','Target duty cycle (%)',60)]):[num('ra',mono?'Timing resistor R (kΩ)':'RA (kΩ)',10,1000),...(!mono?[num('rb','RB (kΩ)',100,1000)]:[])]),num('c','Timing capacitor (µF)',10,1e-6)],calculate:design?C.timerDesign:C.timer,
        rows:r=>[...(design?[row(mono?'Calculated R':'Calculated RA',r.ra,'Ω'),...(!mono?[row('Calculated RB',r.rb,'Ω')]:[])]:[]),...(mono?[row('Pulse duration',r.pulse,'s')]:[row('Frequency',r.frequency,'Hz'),row('Duty cycle',nfmt(r.duty)+'%'),row('High time',r.high,'s'),row('Low time',r.low,'s'),row('Period',r.period,'s')])],
        formula:mono?'t ≈ 1.1RC':'tHIGH = ln(2)(RA + RB)C; tLOW = ln(2)RB C; f = 1 / (tHIGH + tLOW).',
        note:mono?'A low trigger starts one timed pulse in the standard monostable circuit. Release the trigger before the pulse ends. Timing is approximate and depends on the specific 555, capacitor leakage, and component tolerances.':'The standard two-resistor astable circuit has duty cycle greater than 50%. Timing is approximate; capacitor leakage and component tolerances matter. Check the datasheet for practical resistor/capacitor limits and supply bypassing.',
        sources:[link('TI 555 datasheet and wiring diagrams','https://www.ti.com/lit/ds/symlink/ne555.pdf')]};
    }
    if(id==='wire')return {intro:'Copper wire references and DC voltage drop for a two-wire circuit.',fields:[select('awg','Wire gauge (AWG)','22',C.wireRows.map(r=>[String(r.awg),`${r.awg} AWG`])),num('length','One-way wire length (m)',1),num('current','Load current (A)',0.5),num('supply','Supply voltage (V)',12)],calculate:x=>C.wire({...x,awg:Number(x.awg)}),
      rows:r=>[row('Round-trip voltage drop',r.drop,'V'),row('Voltage at load',r.loadVoltage,'V'),row('Drop percentage',nfmt(r.percent)+'%'),row('Wire loss, both conductors',r.loss,'W'),row('Copper diameter',nfmt(r.diameter)+' mm'),row('Copper area',nfmt(r.area)+' mm²'),row('Chassis guideline',r.chassis,'A'),row('Transmission guideline',r.transmission,'A')],
      formula:'Loop resistance = 2 × one-way length × resistance per metre; ΔV = I × Rloop.',
      note:'Copper at approximately 20 °C; conductor diameter excludes insulation. Current figures are rough guidelines: chassis means wire in air, not bundled; transmission uses a conservative sizing rule. They are not installation-code ampacities. Insulation, bundling, temperature, connectors, and fusing still govern the actual circuit.',
      sources:[link('PowerStream copper wire reference and assumptions','https://www.powerstream.com/Wire_Size.htm')]};
    if(id==='ohm'){
      const pair=v.pair||'vi',p=pairs[pair]||pairs.vi;
      return {intro:'Choose any two known positive DC quantities and solve the other two.',fields:[select('pair','Known quantities','vi',[['vi','Voltage + current'],['vr','Voltage + resistance'],['ir','Current + resistance'],['vp','Voltage + power'],['ip','Current + power'],['rp','Resistance + power']]),num('a',p[0][0],p[0][1]),num('b',p[1][0],p[1][1])],calculate:C.ohm,rows:r=>[row('Voltage',r.voltage,'V'),row('Current',r.current,'A'),row('Resistance',r.resistance,'Ω'),row('Power',r.power,'W')],formula:'V = IR; P = VI = I²R = V²/R.',note:'For an ideal resistive DC load. Inputs must be greater than zero so that each selected pair gives one definite solution. AC circuits with phase shift need impedance and power factor.',sources:[]};
    }
    if(id==='voltage')return {intro:'Find the output voltage, including the effect of an optional load.',fields:[num('supply','Input voltage (V)',12),num('r1','Top resistor R1 (kΩ)',10,1000),num('r2','Bottom resistor R2 (kΩ)',10,1000),num('load','Load resistance RL (kΩ) · optional','',1000,true)],calculate:C.voltage,
      rows:r=>[row('Output voltage',r.output,'V'),row('Unloaded output',r.unloaded,'V'),row('Supply current',r.current,'A'),row('Load current',r.loadCurrent,'A'),row('R1 dissipation',r.p1,'W'),row('R2 dissipation',r.p2,'W')],formula:'Vout = Vin × Rbottom / (R1 + Rbottom); with a load, Rbottom = R2 ∥ RL.',note:'Output is measured across R2. Leave RL blank for an unloaded divider. A finite load lowers the output; this circuit is not a regulated power supply. Values and dissipations are nominal.',sources:[]};
    if(id==='current')return {intro:'Split a known total current between two parallel resistors.',fields:[num('current','Total current (mA)',10,0.001),num('r1','Branch R1 (kΩ)',1,1000),num('r2','Branch R2 (kΩ)',2,1000)],calculate:C.currentDivider,
      rows:r=>[row('Current through R1',r.i1,'A'),row('Current through R2',r.i2,'A'),row('Voltage across both branches',r.voltage,'V'),row('Equivalent resistance',r.equivalent,'Ω'),row('R1 dissipation',r.p1,'W'),row('R2 dissipation',r.p2,'W')],formula:'I1 = Itotal × R2 / (R1 + R2); I2 = Itotal × R1 / (R1 + R2).',note:'The smaller resistance carries more current. Both resistors see the same voltage. Results assume two ideal resistive branches and the stated total current.',sources:[]};
    const capacitor=id==='capacitor-network',kind=capacitor?'capacitor':'resistor';
    return {intro:`Combine 2–20 ${capacitor?'capacitors':'resistors'} in one series or parallel network.`,fields:[select('mode','Connection','series',[['series','Series'],['parallel','Parallel']]),select('unit','Unit for every value',capacitor?'0.000001':'1',capacitor?[['0.000000000001','pF'],['0.000000001','nF'],['0.000001','µF'],['1','F']]:[['1','Ω'],['1000','kΩ'],['1000000','MΩ']]),text('values','Component values · commas or one per line',capacitor?'10, 10':'100, 220, 330')],calculate:x=>C.network({...x,kind,values:x.values.map(n=>n*Number(x.unit))}),
      rows:r=>[row(`Equivalent ${capacitor?'capacitance':'resistance'}`,r.equivalent,capacitor?'F':'Ω'),row('Components',r.count)],
      formula:capacitor?'Parallel: Ceq = C1 + C2 + …; series: 1/Ceq = 1/C1 + 1/C2 + …':'Series: Req = R1 + R2 + …; parallel: 1/Req = 1/R1 + 1/R2 + …',
      note:capacitor?'Use positive capacitances in one common unit. This is an ideal equivalent-capacitance calculation; it does not calculate voltage ratings. Series capacitors may need balancing, and polarized capacitors still require correct polarity.':'Use positive resistances in one common unit. This calculates an ideal equivalent resistance, not the combined power rating or the effects of tolerance.',sources:[]};
  }
  const svg=body=>`<svg viewBox="0 0 640 180" role="img" aria-label="Circuit concept diagram" class="circuit-diagram"><g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  const label=(x,y,text)=>`<text x="${x}" y="${y}" fill="currentColor" stroke="none" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14">${text}</text>`;
  function diagram(id,v,r){
    if(id==='converter')return svg('<path d="M220 72H420l-12-9m12 9-12 9M420 112H220l12-9m-12 9 12 9" stroke="var(--accent)"/>'+label(140,98,v.category==='timing'?'Frequency':v.category==='resistance'?'Ω':'pF')+label(500,98,v.category==='timing'?'Period':v.category==='resistance'?'kΩ · MΩ':'nF · µF'));

    if(id==='led')return svg(`<path d="M70 100H155M245 100H350M390 100H570"/><rect x="155" y="83" width="90" height="34" rx="3"/><path d="M350 78L390 100 350 122ZM390 77V123M400 77l23-22m-12 0h12v12M420 88l23-22m-12 0h12v12"/>${label(85,65,'+Vs')}${label(200,65,'R')}${label(370,153,'LED string')}${label(555,65,'0 V')}`);
    if(id==='timer'){
      const mono=v.mode==='mono',duty=r?.duty?r.duty/100:0.6,high=110*duty;
      const wave=mono?'M380 120h35V65h100v55h65':`M375 120v-55h${high}v55h${110-high}v-55h${high}v55h${110-high}`;
      return svg(`<rect x="235" y="35" width="120" height="105" rx="9"/><path d="M125 87H235M355 87H370"/><path d="${wave}" stroke="var(--accent)"/>${label(295,93,'555')}${label(145,64,mono?'R × C':'RA, RB, C')}${label(470,156,mono?'One timed pulse':'Repeating output')}`);
    }
    if(id==='wire')return svg(`<rect x="60" y="48" width="95" height="95" rx="6"/><rect x="485" y="48" width="95" height="95" rx="6"/><path d="M155 67H485M485 124H155" stroke="var(--accent)" stroke-width="5"/>${label(108,102,'Supply')}${label(532,102,'Load')}${label(320,47,'One-way length →')}${label(320,156,'← Return conductor')}`);
    if(id==='voltage')return svg(`<path d="M260 15V30M260 65V100M260 135V162M260 82H485M440 82V100M440 135V162H260"/><rect x="245" y="30" width="30" height="35"/><rect x="245" y="100" width="30" height="35"/><rect x="425" y="100" width="30" height="35" stroke-dasharray="4 4"/><circle cx="260" cy="82" r="3" fill="currentColor"/>${label(205,25,'Vin')}${label(212,55,'R1')}${label(212,127,'R2')}${label(503,83,'Vout')}${label(515,129,'RL optional')}`);
    if(id==='ohm')return svg(`<path d="M140 100H265M365 100H500"/><rect x="265" y="78" width="100" height="44" rx="3"/><path d="M165 55H225l-9-7m9 7-9 7"/>${label(195,40,'I')}${label(315,65,'R')}${label(315,153,'V across the resistor · P = V × I')}`);
    const parallel=id==='current'||v.mode==='parallel',capacitor=id==='capacitor-network';
    const element=(x,y)=>capacitor?`<path d="M${x} ${y}h34m0-19v38m12-38v38m0-19h34"/>`:`<path d="M${x} ${y}h15m50 0h15"/><rect x="${x+15}" y="${y-15}" width="50" height="30"/>`;
    if(parallel)return svg(`<path d="M90 90H205V45H280M205 90V135H280M360 45H440V135H360M440 90H555"/>${element(280,45)}${element(280,135)}${label(320,19,capacitor?'C1':'R1')}${label(320,172,id==='current'?'R2':capacitor?'C2 … Cn':'R2 … Rn')}${label(113,68,id==='current'?'Itotal →':'Parallel')}`);
    return svg(`<path d="M70 90H140M220 90H280M360 90H420M500 90H570"/>${element(140,90)}${element(280,90)}${element(420,90)}${label(180,55,capacitor?'C1':'R1')}${label(320,55,capacitor?'C2':'R2')}${label(460,55,capacitor?'… Cn':'… Rn')}${label(320,146,'All components in a single path')}`);
  }
  function mount(id,host){
    const saved=memo.get(id)||{};memo.set(id,saved);
    const s=spec(id,saved);
    host.innerHTML='<div class="design-intro"></div><div class="design-graphic"></div><form class="design-form" novalidate><div class="design-fields"></div><div class="design-actions"><button type="submit">Calculate →</button><button type="button" class="text-button design-reset">Reset example</button></div><p class="error design-error" role="alert" hidden></p></form><section class="design-results" aria-live="polite" aria-atomic="true"><p class="eyebrow result-heading">RESULTS</p><div class="design-result-grid"></div><p class="design-message"></p></section><div class="design-notes"><p class="formula"></p><p class="design-note"></p><div class="sources"></div></div><div class="wire-reference"></div>';
    host.querySelector('.design-intro').textContent=s.intro;
    host.querySelector('.formula').textContent=s.formula;
    host.querySelector('.design-note').textContent=s.note;
    const form=host.querySelector('form'),fields=host.querySelector('.design-fields'),results=host.querySelector('.design-results'),error=host.querySelector('.design-error');
    for(const f of s.fields){
      const wrap=document.createElement('div');if(f.textarea)wrap.className='wide-field';
      const l=document.createElement('label');l.htmlFor=`design-${f.id}`;l.textContent=f.label;
      let input=document.createElement(f.options?'select':f.textarea?'textarea':'input');input.id=l.htmlFor;input.name=f.id;input.setAttribute('aria-describedby','design-assumptions');
      if(f.options)f.options.forEach(([value,label])=>input.add(new Option(label,value)));
      else if(f.textarea){input.rows=3;input.spellcheck=false;}
      else{input.type='text';input.inputMode='decimal';input.autocomplete='off';}
      input.value=saved[f.id]??f.value;wrap.append(l,input);fields.append(wrap);
    }
    host.querySelector('.design-note').id='design-assumptions';
    for(const source of s.sources){const a=document.createElement('a');a.textContent=source.label;a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';host.querySelector('.sources').append(a);}
    function remember(){for(const f of s.fields)saved[f.id]=form.elements.namedItem(f.id).value;}
    function parse(){
      const x={};
      for(const f of s.fields){
        const input=form.elements.namedItem(f.id),raw=input.value.trim();input.removeAttribute('aria-invalid');
        if(f.options)x[f.id]=raw;
        else if(f.optional&&raw==='')x[f.id]=null;
        else {
          const parts=f.textarea?raw.split(/[,;\n]+/).map(p=>p.trim()):[raw];
          if(parts.some(p=>! /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(p))){input.setAttribute('aria-invalid','true');throw new Error(`${f.label}: enter ${f.textarea?'positive numbers separated by commas or newlines':'a number such as 4.7'}.`);}
          x[f.id]=f.textarea?parts.map(Number):Number(raw)*(f.scale||1);
        }
      }
      return x;
    }
    function calculate(){
      remember();
      try{
        const x=parse(),r=s.calculate(x);
        if(Object.values(r).some(n=>typeof n==='number'&&!Number.isFinite(n)))throw new Error('These values are outside the calculator’s numerical range.');
        error.hidden=true;results.hidden=false;
        host.querySelector('.result-heading').textContent='RESULTS';
        const grid=host.querySelector('.design-result-grid');grid.replaceChildren();
        s.rows(r).forEach(([label,value])=>{const cell=document.createElement('div');const small=document.createElement('span');small.textContent=label;const strong=document.createElement('strong');strong.textContent=value;cell.append(small,strong);grid.append(cell);});
        host.querySelector('.design-graphic').innerHTML=diagram(id,x,r);
        host.querySelector('.design-message').textContent=id==='wire'?(x.current>r.chassis?'Load exceeds the listed chassis and transmission guidelines.':x.current>r.transmission?'Load exceeds the transmission guideline; the chassis figure applies only under different cooling conditions.':'Compare these guidelines with the actual wire and installation specifications.') : id==='timer'?(x.direction==='design'?'Resistors are ideal calculated values. Check rounded stock values using Timing from components. ':'')+'Timing model shown; use the datasheet for the complete circuit wiring.':'';
      }catch(e){error.textContent=e.message;error.hidden=false;results.hidden=true;host.querySelector('.design-graphic').innerHTML=diagram(id,saved);}
    }
    form.addEventListener('submit',event=>{event.preventDefault();calculate();});
    form.addEventListener('input',()=>{remember();host.querySelector('.result-heading').textContent='PREVIOUS RESULT · PRESS CALCULATE TO UPDATE';});
    form.addEventListener('change',event=>{
      remember();
      if(event.target.name==='mode'||event.target.name==='pair'||event.target.name==='direction'||event.target.name==='category'){
        if(event.target.name==='pair'){delete saved.a;delete saved.b;}
        if(event.target.name==='category'){delete saved.unit;delete saved.value;}
        mount(id,host);
      }
    });
    host.querySelector('.design-reset').addEventListener('click',()=>{memo.delete(id);mount(id,host);});
    if(id==='wire'){
      const area=host.querySelector('.wire-reference');area.className='wire-reference table-scroll';
      area.innerHTML='<table><caption>Copper current guidelines (A) · see assumptions above</caption><thead><tr><th scope="col">AWG</th><th scope="col">Chassis</th><th scope="col">Transmission</th></tr></thead><tbody>'+C.wireRows.map(r=>`<tr><th scope="row">${r.awg}</th><td>${r.chassis}</td><td>${r.transmission}</td></tr>`).join('')+'</tbody></table>';
    }
    calculate();
  }
  window.BenchCalcDesign={tools,mount};
})();
