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
  const tempcos={black:250,brown:100,red:50,orange:15,yellow:25,green:20,blue:10,violet:5,gray:1};
  function decode(bands) {
    if(!Array.isArray(bands)||![3,4,5,6].includes(bands.length)) throw new Error('Choose 3, 4, 5, or 6 bands.');
    const count=bands.length>=5?3:2;
    const digits=bands.slice(0,count).map(name=>colors.findIndex(c=>c.name===name));
    const m=bands[count], t=bands[count+1];
    if(digits[0]<1||digits.some(d=>d<0||d>9)||!colors.some(c=>c.name===m)||(bands.length>3&&!Object.hasOwn(tolerances,t))) throw new Error('Invalid resistor band combination.');
    const value=Number(digits.join(''))*10**exponent(m), tolerance=bands.length===3?20:tolerances[t];
    const result={value,tolerance,min:value*(1-tolerance/100),max:value*(1+tolerance/100)};
    if(bands.length===6){
      if(!Object.hasOwn(tempcos,bands[5])) throw new Error('Invalid temperature coefficient band.');
      result.tempco=tempcos[bands[5]];
    }
    return result;
  }
  function encode(value,tolerance='gold',bandCount=4,tempco='brown') {
    if(!Number.isFinite(value) || value<=0) throw new Error('Enter a positive resistance.');
    if(![3,4,5,6].includes(bandCount)) throw new Error('Choose 3, 4, 5, or 6 bands.');
    if(bandCount>3&&!Object.hasOwn(tolerances,tolerance)) throw new Error('Select a valid tolerance.');
    if(bandCount===6&&!Object.hasOwn(tempcos,tempco)) throw new Error('Select a valid temperature coefficient.');
    const count=bandCount>=5?3:2;
    for(let exp=-2;exp<=9;exp++) {
      const digits=value/10**exp, rounded=Math.round(digits);
      if(rounded>=10**(count-1) && rounded<10**count && Math.abs(digits-rounded)<=Math.max(1,digits)*Number.EPSILON*8) {
        const bands=String(rounded).split('').map(d=>colors[Number(d)].name);
        bands.push(exp===-2?'silver':exp===-1?'gold':colors[exp].name);
        if(bandCount>3) bands.push(tolerance);
        if(bandCount===6) bands.push(tempco);
        return bands;
      }
    }
    throw new Error(`Use ${count} significant digits, from ${count===2?'0.10 Ω to 99 GΩ':'1 Ω to 999 GΩ'}. This value cannot be represented exactly by ${bandCount} bands.`);
  }
  function format(value) {
    const unit=[[1e9,'GΩ'],[1e6,'MΩ'],[1e3,'kΩ'],[1,'Ω']].find(([scale])=>value>=scale)||[1,'Ω'];
    return `${Number((value/unit[0]).toPrecision(10))} ${unit[1]}`;
  }
  const api={colors,tolerances,tempcos,exponent,decode,encode,format};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.BenchCalcResistor=api;
})(typeof globalThis!=='undefined'?globalThis:this);
