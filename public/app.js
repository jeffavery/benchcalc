/* Shared application shell. Conversion rules remain in calculators/. */
(() => {
  'use strict';
  const R=BenchCalcResistor,C=BenchCalcCodes,I=BenchCalcInductor,G=BenchCalcGraphics,$=id=>document.getElementById(id);
  const tools=[
    ...[3,4,5,6].map(n=>({id:`resistor-${n}`,name:`${n}-band resistor`,family:'Resistors',kind:'resistor',count:n})),
    ...[3,4].map(n=>({id:`smd-${n}`,name:`${n}-digit SMD`,family:'Resistors',kind:'smd',count:n})),
    {id:'capacitor',name:'3-digit capacitor',family:'Capacitors',kind:'capacitor'},
    {id:'inductor',name:'4-band inductor',family:'Inductors',kind:'inductor',count:4},
    ...BenchCalcDesign.tools
  ];
  const states=new Map();
  let tool;
  const cap=s=>s[0].toUpperCase()+s.slice(1);
  const nice=n=>String(Number(n.toPrecision(10)));
  const units=kind=>kind==='capacitor'?[[1,'pF'],[1e3,'nF'],[1e6,'µF']]:kind==='inductor'?[[1,'µH'],[1e3,'mH'],[1e6,'H']]:[[1,'Ω'],[1e3,'kΩ'],[1e6,'MΩ'],[1e9,'GΩ']];
  const format=(value,kind)=>{const [scale,label]=[...units(kind)].reverse().find(([scale])=>value>=scale)||units(kind)[0];return `${nice(value/scale)} ${label}`;};
  const isBand=()=>tool.kind==='resistor'||tool.kind==='inductor';
  const state=()=>states.get(tool.id);
  const digitCount=()=>tool.kind==='resistor'&&tool.count>=5?3:2;
  const initial=t=>t.kind==='resistor'?{bands:R.encode(4700,t.count>=5?'brown':'gold',t.count),value:4700}:t.kind==='inductor'?{bands:['blue','gray','gold','silver'],value:6.8}:t.kind==='smd'?{code:t.count===3?'472':'4701',value:4700}:{code:'104',value:100000,shape:'ceramic'};
  const roles=()=>{
    const list=['First digit','Second digit'];
    if(digitCount()===3) list.push('Third digit');
    list.push('Multiplier');
    if(tool.count>3) list.push('Tolerance');
    if(tool.count===6) list.push('Temperature coefficient');
    return list;
  };
  const toleranceMap=()=>tool.kind==='inductor'?I.tolerances:R.tolerances;
  function choices(index){
    const digits=digitCount();
    return R.colors.filter(c=>index<digits?c.digit<10&&(index>0||c.digit>0):index===digits?(tool.kind!=='inductor'||I.multipliers.includes(c.name)):index===digits+1?Object.hasOwn(toleranceMap(),c.name):Object.hasOwn(R.tempcos,c.name));
  }
  function choiceText(c,index){
    const digits=digitCount();
    const meaning=index<digits?c.digit:index===digits?`× ${nice(10**R.exponent(c.name))}`:index===digits+1?`±${toleranceMap()[c.name]}%`:`${R.tempcos[c.name]} ppm/°C`;
    return `${cap(c.name)} · ${meaning}`;
  }
  for(const family of ['Circuit tools','Resistors','Capacitors','Inductors']){
    const group=document.createElement('div');group.className='nav-group';
    const heading=document.createElement('h2');heading.textContent=family;group.append(heading);
    const optgroup=document.createElement('optgroup');optgroup.label=family;
    for(const t of tools.filter(t=>t.family===family)){
      const link=document.createElement('a');link.href=`#${t.id}`;link.dataset.tool=t.id;link.textContent=t.name;group.append(link);
      optgroup.append(new Option(t.name,t.id));
    }
    $('library').append(group);$('mobile-tool').append(optgroup);
  }
  $('mobile-tool').addEventListener('change',()=>{location.hash=$('mobile-tool').value;});
  function selectTool(){
    const id=location.hash.slice(1);
    if(id==='calculator-title' && tool) return;
    tool=tools.find(t=>t.id===id)||tools[1];
    if(tool.kind!=='design' && !states.has(tool.id)) states.set(tool.id,initial(tool));
    document.title=`BenchCalc · ${tool.name}`;
    $('mobile-tool').value=tool.id;
    document.querySelectorAll('[data-tool]').forEach(link=>{const active=link.dataset.tool===tool.id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    mount();
  }
  function mount(){
    const design=tool.kind==='design';
    $('component-tools').hidden=design; $('design-tools').hidden=!design;
    if(design){
      $('calculator-title').textContent=tool.name;
      $('calculator-kicker').textContent='CIRCUIT TOOLS / DESIGN & REFERENCE';
      $('calculator-tag').textContent='Calculate. Check. Build.';
      BenchCalcDesign.mount(tool.id,$('design-tools'));
      return;
    }
    const band=isBand(),digits=digitCount();
    $('calculator-title').textContent=tool.name;
    $('calculator-kicker').textContent=`${tool.family.toUpperCase()} / ${band?'COLOR CODE':'PRINTED CODE'}`;
    $('calculator-tag').textContent=band?`${digits} digits + multiplier${tool.count>3?' + tolerance':''}`:'Read the marking, find the value';
    $('graphic').innerHTML=band?G.axial(tool.count,tool.kind==='inductor'):tool.kind==='smd'?G.smd():G.capacitor(state().shape);
    $('shape-picker').hidden=tool.kind!=='capacitor';
    $('shape-picker').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.shape===state().shape)));
    $('band-area').hidden=!band;$('code-form').hidden=band;
    $('band-controls').replaceChildren();
    if(band){
      $('band-controls').dataset.count=tool.count;
      roles().forEach((label,index)=>{
        const field=document.createElement('div');field.className='band-field';
        const title=document.createElement('label');title.htmlFor=`select-${index}`;title.className='band-label';title.innerHTML=`<i id="swatch-${index}"></i>${index+1}. ${label}`;
        const select=document.createElement('select');select.id=`select-${index}`;
        choices(index).forEach(c=>select.add(new Option(choiceText(c,index),c.name)));
        select.value=state().bands[index];select.addEventListener('change',()=>{state().bands[index]=select.value;render();});
        select.addEventListener('focus',()=>highlight(index));select.addEventListener('blur',()=>highlight(-1));
        field.append(title,select);$('band-controls').append(field);
      });
    }else{
      $('code').maxLength=tool.kind==='smd'?4:3;
      $('code').placeholder=tool.kind==='smd'?(tool.count===3?'472 or 4R7':'4701 or 4R70'):'104';
      $('code-help').textContent=tool.kind==='capacitor'?'Enter the three capacitance digits only. Tolerance and voltage markings are separate.':`Enter a ${tool.count}-digit code, an R decimal code, or a zero-ohm marking. EIA-96 is not included.`;
    }
    $('quantity-label').textContent=tool.kind==='capacitor'?'Capacitance':tool.kind==='inductor'?'Inductance':'Resistance';
    $('unit').replaceChildren(...units(tool.kind).map(([scale,label])=>new Option(label,String(scale))));
    $('reverse-heading').textContent=band?'Value to colors':'Value to code';
    $('reverse-description').textContent=`Enter ${tool.kind==='capacitor'?'a capacitance':tool.kind==='inductor'?'an inductance':'a resistance'} to find its ${band?'bands':'marking'}.`;
    $('reverse-button').textContent=band?'Find colors →':'Find code →';
    $('value-help').textContent=band?`${digits} significant digits; no automatic rounding. ${tool.count===3?'No tolerance band means ±20%.':'Keeps the selected tolerance'+(tool.count===6?' and temperature coefficient':'')+'.'}`:tool.kind==='capacitor'?'Two significant digits. Values are encoded in picofarads; no automatic rounding.':'Creates an exact numeric or R decimal marking. Zero creates a jumper code.';
    help();render();
  }
  function highlight(index){
    state().bands.forEach((_,i)=>{const el=$(`band-${i}`);el.setAttribute('stroke',i===index?'var(--accent)':'none');el.setAttribute('stroke-width','3');});
  }
  function clearError(prefix,input){$(prefix).hidden=true;$(input).removeAttribute('aria-invalid');}
  function error(prefix,input,message){$(prefix).textContent=message;$(prefix).hidden=false;$(input).setAttribute('aria-invalid','true');}
  function render(){
    const s=state(),band=isBand();
    let result;
    if(band){
      result=tool.kind==='inductor'?I.decode(s.bands):R.decode(s.bands);
      s.bands.forEach((name,i)=>{$(`band-${i}`).setAttribute('fill',R.colors.find(c=>c.name===name).hex);$(`select-${i}`).value=name;$(`swatch-${i}`).style.background=R.colors.find(c=>c.name===name).hex;});
      const digits=s.bands.slice(0,digitCount()).map(name=>R.colors.find(c=>c.name===name).digit).join('');
      $('formula').textContent=`${digits} × ${nice(10**R.exponent(s.bands[digitCount()]))} ${tool.kind==='inductor'?'µH':'Ω'} = ${format(result.value,tool.kind)}`;
      $('range').textContent=`${format(result.min,tool.kind)} – ${format(result.max,tool.kind)}`;
    }else{
      result=tool.kind==='smd'?C.decodeSmd(s.code,tool.count):C.decodeCap(s.code);
      $('code').value=s.code;$('printed-code').textContent=s.code;
      $('formula').textContent=`${result.formula}${result.value===0?'':` = ${format(result.value,tool.kind)}`}`;
      $('range').textContent=tool.kind==='capacitor'?units('capacitor').map(([scale,u])=>`${nice(result.value/scale)} ${u}`).join(' = '):result.value===0?'Zero-ohm jumper':`${nice(result.value)} Ω · tolerance is not encoded here`;
    }
    s.value=result.value;
    $('value').textContent=format(result.value,tool.kind);
    $('tolerance').hidden=!band;$('tolerance').textContent=band?`±${result.tolerance}%`:'';
    $('tempco').hidden=result.tempco===undefined;$('tempco').textContent=result.tempco===undefined?'':`${result.tempco} ppm/°C · temperature coefficient`;
    $('component-title').textContent=tool.name;
    $('component-desc').textContent=`${band?s.bands.map(cap).join(', '):s.code}: ${format(result.value,tool.kind)}${band?`, plus or minus ${result.tolerance} percent`:''}${result.tempco!==undefined?`, ${result.tempco} ppm per degree Celsius`:''}.`;
    const [scale]=[...units(tool.kind)].reverse().find(([v])=>result.value>=v)||units(tool.kind)[0];
    $('unit').value=String(scale);$('resistance').value=nice(result.value/scale);
    clearError('error','resistance');clearError('code-error','code');
  }
  function help(){
    const band=isBand();
    $('help-title').textContent=`How to read ${tool.kind==='capacitor'?'a capacitor code':tool.kind==='smd'?'an SMD resistor':`a ${tool.name}`}`;
    $('reading-help').textContent=tool.kind==='resistor'?`${tool.count>=5?'The first three bands':'The first two bands'} give the digits. The next band multiplies them. ${tool.count===3?'Three-band resistors have no tolerance band: tolerance is ±20%.':'The following band gives tolerance. Read from the end opposite the separated tolerance'+(tool.count===6?' and temperature bands. The last band is the temperature coefficient, in parts per million per degree Celsius.':' band.')}`:tool.kind==='inductor'?'The first two bands give the digits, the third is a multiplier in microhenries (µH), and the fourth is tolerance. This calculator covers common EIA four-band markings: silver through yellow multipliers and gold, silver, or black tolerance. Military five-band markings use a different system.':tool.kind==='smd'?`For a numeric code, the first ${tool.count-1} digits are the significant figures and the last digit is the number of zeros. An R replaces the decimal point in ohms. A marking of 0, 000, or 0000 indicates a zero-ohm jumper.`:'The first two digits are significant figures; the third is a multiplier in picofarads. Digits 0–7 mean powers of ten. The small-value exceptions are 8 (×0.01) and 9 (×0.1). For example, 479 means 4.7 pF.';
    $('limits-help').textContent=band?'The range is nominal value ± tolerance. These bands do not identify power or current rating. Check the component’s datasheet for its other specifications.':tool.kind==='capacitor'?'Ceramic, film, and tantalum parts can use the same capacitance code. The drawing style does not change the calculation. Voltage, tolerance, and polarity require separate markings or the datasheet; tantalum capacitors are polarized.':'The printed value alone does not confirm tolerance, power rating, or package size. This calculator reads standard numeric and R decimal markings.';
    $('reference-area').hidden=!band;
    if(band){
      $('reference-head').innerHTML='<tr><th scope="col">Color</th><th scope="col">Digit</th><th scope="col">Multiplier</th><th scope="col">Tolerance</th>'+(tool.count===6?'<th scope="col">ppm/°C</th>':'')+'</tr>';
      $('reference-body').innerHTML=R.colors.map(c=>`<tr><th scope="row"><span class="reference-swatch" style="background:${c.hex}"></span>${cap(c.name)}</th><td>${c.digit<10?c.digit:'—'}</td><td>${tool.kind==='inductor'&&!I.multipliers.includes(c.name)?'—':`×${nice(10**R.exponent(c.name))}`}</td><td>${tool.count===3?'—':Object.hasOwn(toleranceMap(),c.name)?`±${toleranceMap()[c.name]}%`:'—'}</td>${tool.count===6?`<td>${R.tempcos[c.name]??'—'}</td>`:''}</tr>`).join('');
    }
    const links=tool.kind==='resistor'?[['TI resistor marking table','https://www.ti.com/seclit/eb/slyw038c/slyw038c.pdf']]:tool.kind==='inductor'?[['Bourns EIA inductor markings','https://bourns.com/docs/technical-documents/technical-library/inductive-components/publications/ColorCodeMarkings.pdf'],['RS Intek color table','https://www.rsintek.com/web/userfiles/download/ALSeries.pdf']]:tool.kind==='smd'?[['Bourns resistor markings','https://www.bourns.com/docs/product-datasheets/cr.pdf']]:[['Capacitor marking guide','https://specap.com/resources/blog/how-to-read-capacitor-markings-codes']];
    $('sources').replaceChildren();
    for(const [label,url] of links){const a=document.createElement('a');a.href=url;a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';$('sources').append(a);}
  }
  $('value-form').addEventListener('submit',event=>{
    event.preventDefault();
    try{
      const raw=$('resistance').value.trim();
      if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) throw new Error('Enter a number such as 4.7, then choose its unit.');
      const value=Number(raw)*Number($('unit').value),s=state();
      if(tool.kind==='resistor') s.bands=R.encode(value,s.bands[digitCount()+1]||'gold',tool.count,s.bands[5]||'brown');
      else if(tool.kind==='inductor') s.bands=I.encode(value,s.bands[3]);
      else s.code=tool.kind==='smd'?C.encodeSmd(value,tool.count):C.encodeCap(value);
      render();
    }catch(e){error('error','resistance',e.message);}
  });
  $('code-form').addEventListener('submit',event=>{
    event.preventDefault();
    try{const result=tool.kind==='smd'?C.decodeSmd($('code').value,tool.count):C.decodeCap($('code').value);state().code=result.code;render();}
    catch(e){error('code-error','code',e.message);}
  });
  $('shape-picker').addEventListener('click',event=>{
    const button=event.target.closest('button[data-shape]');if(!button)return;
    state().shape=button.dataset.shape;
    $('graphic').innerHTML=G.capacitor(state().shape);
    $('shape-picker').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();
  });
  $('reset').addEventListener('click',()=>{states.set(tool.id,initial(tool));mount();});
  $('theme').value=document.documentElement.dataset.theme;
  $('theme').addEventListener('change',()=>{document.documentElement.dataset.theme=$('theme').value;try{localStorage.setItem('benchcalc.theme',$('theme').value);}catch(_) {}});
  window.addEventListener('hashchange',selectTool);selectTool();
})();
