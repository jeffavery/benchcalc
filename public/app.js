/* Shared shell; calculator logic stays in calculators/ for reuse by future tools. */
(() => {
  'use strict';
  const R=BenchCalcResistor, $=id=>document.getElementById(id);
  let bands=['yellow','violet','red','gold'];
  const labels=['First digit','Second digit','Multiplier','Tolerance'];
  const capitalize=s=>s[0].toUpperCase()+s.slice(1);
  labels.forEach((label,i)=>{
    const field=document.createElement('label');
    field.innerHTML=`<span class="band-label"><i id="swatch-${i}"></i>${i+1}. ${label}</span>`;
    const select=document.createElement('select');select.id=`select-${i}`;
    R.colors.filter(c=>i===0?c.digit>0&&c.digit<10:i===1?c.digit<10:i===3?c.name in R.tolerances:true).forEach(c=>{
      const value=i<2?c.digit:i===2?`× ${10**R.exponent(c.name)}`:`±${R.tolerances[c.name]}%`;
      select.add(new Option(`${capitalize(c.name)} · ${value}`,c.name));
    });
    select.value=bands[i];select.addEventListener('change',()=>{bands[i]=select.value;render();});
    field.append(select);$('band-controls').append(field);
  });
  function render(){
    const result=R.decode(bands);
    bands.forEach((name,i)=>{
      const color=R.colors.find(c=>c.name===name);
      $(`band-${i}`).setAttribute('fill',color.hex);$(`swatch-${i}`).style.backgroundColor=color.hex;$(`select-${i}`).value=name;
    });
    $('value').textContent=R.format(result.value);$('tolerance').textContent=`±${result.tolerance}%`;
    $('range').textContent=`${R.format(result.min)} – ${R.format(result.max)}`;
    $('resistor-desc').textContent=`${bands.map(capitalize).join(', ')}: ${R.format(result.value)}, plus or minus ${result.tolerance} percent.`;
    $('formula').textContent=`${R.colors.findIndex(c=>c.name===bands[0])}${R.colors.findIndex(c=>c.name===bands[1])} × ${10**R.exponent(bands[2])} Ω = ${R.format(result.value)}`;
    const scale=[1e9,1e6,1e3,1].find(v=>result.value>=v)||1;
    $('unit').value=String(scale);$('resistance').value=String(Number((result.value/scale).toPrecision(10)));
    $('error').hidden=true;$('resistance').removeAttribute('aria-invalid');
  }
  $('value-form').addEventListener('submit',event=>{
    event.preventDefault();
    try{
      const raw=$('resistance').value.trim();
      if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) throw new Error('Enter a number such as 4.7, then choose its unit.');
      bands=R.encode(Number(raw)*Number($('unit').value),bands[3]);render();
    }catch(error){$('error').textContent=error.message;$('error').hidden=false;$('resistance').setAttribute('aria-invalid','true');}
  });
  $('theme').value=document.documentElement.dataset.theme;
  $('theme').addEventListener('change',()=>{document.documentElement.dataset.theme=$('theme').value;try{localStorage.setItem('benchcalc.theme',$('theme').value);}catch(_) {}});
  render();
})();
