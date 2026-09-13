(function (root) {
  'use strict';
  const colors = [
    ['black','#22252a'],['brown','#884c2c'],['red','#dc343e'],
    ['orange','#ee8427'],['yellow','#f0ce38'],['green','#299362'],
    ['blue','#3984d7'],['violet','#9254b9'],['gray','#8a9099'],['white','#f5f4ec'],
    ['gold','#c39a42'],['silver','#b8bec7']
  ].map(([name,hex],digit) => ({name,hex,digit}));
  const tolerances = {brown:1,red:2,green:0.5,blue:0.25,violet:0.1,gray:0.05,gold:5,silver:10};
  const exponent = name => name === 'gold' ? -1 : name === 'silver' ? -2 : colors.findIndex(c => c.name === name);
  function decode(bands) {
    const [a,b,m,t] = bands;
    const d1 = colors.findIndex(c => c.name === a), d2 = colors.findIndex(c => c.name === b);
    if(d1 < 1 || d1 > 9 || d2 < 0 || d2 > 9 || !colors.some(c=>c.name===m) || !(t in tolerances)) throw new Error('Invalid four-band combination.');
    const value = (10*d1+d2)*10**exponent(m), tolerance=tolerances[t];
    return {value,tolerance,min:value*(1-tolerance/100),max:value*(1+tolerance/100)};
  }
  function encode(value,tolerance='gold') {
    if(!Number.isFinite(value) || value<=0) throw new Error('Enter a positive resistance.');
    if(!(tolerance in tolerances)) throw new Error('Select a valid tolerance.');
    for(let exp=-2;exp<=9;exp++) {
      const digits=value/10**exp, rounded=Math.round(digits);
      if(rounded>=10 && rounded<=99 && Math.abs(digits-rounded)<1e-8) {
        return [colors[Math.floor(rounded/10)].name,colors[rounded%10].name,exp===-2?'silver':exp===-1?'gold':colors[exp].name,tolerance];
      }
    }
    throw new Error('Use two significant digits, from 0.10 Ω to 99 GΩ (for example, 4.7 kΩ). This value cannot be represented exactly by four bands.');
  }
  function format(value) {
    const unit=[[1e9,'GΩ'],[1e6,'MΩ'],[1e3,'kΩ'],[1,'Ω']].find(([scale])=>value>=scale)||[1,'Ω'];
    return `${Number((value/unit[0]).toPrecision(10))} ${unit[1]}`;
  }
  const api={colors,tolerances,exponent,decode,encode,format};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.BenchCalcResistor=api;
})(typeof globalThis!=='undefined'?globalThis:this);
