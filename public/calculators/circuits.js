(function(root){
  'use strict';
  const positive=(value,name)=>{if(!Number.isFinite(value)||value<=0)throw new Error(`${name} must be a finite number greater than zero.`);return value;};
  const nonnegative=(value,name)=>{if(!Number.isFinite(value)||value<0)throw new Error(`${name} must be zero or greater.`);return value;};
  const E24=[10,11,12,13,15,16,18,20,22,24,27,30,33,36,39,43,47,51,56,62,68,75,82,91];
  function preferred(value){
    positive(value,'Resistance');
    const decade=10**(Math.floor(Math.log10(value))-1);
    return (E24.find(n=>n*decade>=value*(1-1e-12))||100)*decade;
  }
  function led({supply,forward,current,count}){
    positive(supply,'Supply voltage');positive(forward,'LED forward voltage');positive(current,'LED current');
    if(!Number.isInteger(count)||count<1||count>100)throw new Error('Use a whole number of series LEDs from 1 to 100.');
    const drop=supply-count*forward;
    if(drop<=0)throw new Error('Supply voltage must exceed the total LED forward voltage. Reduce the series LED count or increase the supply.');
    const ideal=drop/current,resistor=preferred(ideal),actual=drop/resistor,power=drop*actual;
    const rating=[0.125,0.25,0.5,1,2,3,5,10,20,25,50,100].find(w=>w>=2*power)||2*power;
    return {ideal,resistor,actual,power,rating,drop};
  }
  function timer({mode,ra,rb,c}){
    positive(ra,'Timing resistance');positive(c,'Capacitance');
    if(mode==='mono')return {pulse:1.1*ra*c};
    if(mode!=='astable')throw new Error('Select a timer mode.');
    positive(rb,'RB');
    const high=Math.LN2*(ra+rb)*c,low=Math.LN2*rb*c,period=high+low;
    return {high,low,period,frequency:1/period,duty:100*high/period};
  }
  function timerDesign({mode,c,frequency,duty,pulse}){
    positive(c,'Capacitance');
    let ra,rb;
    if(mode==='mono'){
      positive(pulse,'Target pulse duration');ra=pulse/(1.1*c);
    }else if(mode==='astable'){
      positive(frequency,'Target frequency');
      if(!Number.isFinite(duty)||duty<=50||duty>=100)throw new Error('The standard astable circuit needs a duty cycle greater than 50% and less than 100%.');
      const total=1/(frequency*Math.LN2*c);
      ra=(2*duty/100-1)*total;rb=(1-duty/100)*total;
    }else throw new Error('Select a timer mode.');
    positive(ra,'Calculated timing resistance');
    const result={ra,...timer({mode,ra,rb,c})};
    if(rb!==undefined)result.rb=rb;
    return result;
  }
  // Copper current guidelines and resistance at 20 °C from PowerStream's AWG table.
  const wireRows=[
    [10,3.276392,55,15],[12,5.20864,41,9.3],[14,8.282,32,5.9],
    [16,13.17248,22,3.7],[18,20.9428,16,2.3],[20,33.292,11,1.5],
    [22,52.9392,7,0.92],[24,84.1976,3.5,0.577],[26,133.8568,2.2,0.361],
    [28,212.872,1.4,0.226],[30,338.496,0.86,0.142]
  ].map(([awg,ohmsKm,chassis,transmission])=>{
    const diameter=0.127*92**((36-awg)/39);
    return {awg,ohmsKm,chassis,transmission,diameter,area:Math.PI*diameter**2/4};
  });
  function wire({awg,length,current,supply}){
    const row=wireRows.find(r=>r.awg===awg);if(!row)throw new Error('Select a listed wire gauge.');
    positive(length,'One-way length');nonnegative(current,'Load current');positive(supply,'Supply voltage');
    const resistance=2*length*row.ohmsKm/1000,drop=current*resistance;
    if(drop>=supply)throw new Error('The requested current causes a voltage drop at least as large as the supply. Use thicker/shorter wire or reduce the current.');
    return {...row,resistance,drop,percent:100*drop/supply,loadVoltage:supply-drop,loss:current**2*resistance};
  }
  function ohm({pair,a,b}){
    positive(a,'First known value');positive(b,'Second known value');
    let voltage,current,resistance,power;
    switch(pair){
      case 'vi':voltage=a;current=b;break;
      case 'vr':voltage=a;current=a/b;break;
      case 'ir':current=a;voltage=a*b;break;
      case 'vp':voltage=a;current=b/a;break;
      case 'ip':current=a;voltage=b/a;break;
      case 'rp':voltage=Math.sqrt(a*b);current=Math.sqrt(b/a);break;
      default:throw new Error('Choose two known quantities.');
    }
    resistance=voltage/current;power=voltage*current;
    return {voltage,current,resistance,power};
  }
  function voltage({supply,r1,r2,load}){
    positive(supply,'Input voltage');positive(r1,'R1');positive(r2,'R2');
    if(load!==null)positive(load,'Load resistance');
    const lower=load===null?r2:1/(1/r2+1/load),output=supply*lower/(r1+lower),current=supply/(r1+lower);
    return {output,unloaded:supply*r2/(r1+r2),current,loadCurrent:load===null?0:output/load,p1:current**2*r1,p2:output**2/r2};
  }
  function currentDivider({current,r1,r2}){
    positive(current,'Total current');positive(r1,'R1');positive(r2,'R2');
    const equivalent=1/(1/r1+1/r2),voltage=current*equivalent,i1=voltage/r1,i2=voltage/r2;
    return {i1,i2,equivalent,voltage,p1:i1**2*r1,p2:i2**2*r2};
  }
  function network({values,mode,kind}){
    if(!Array.isArray(values)||values.length<2||values.length>20)throw new Error('Enter between 2 and 20 component values.');
    values.forEach((v,i)=>positive(v,`Component ${i+1}`));
    if(!['series','parallel'].includes(mode)||!['resistor','capacitor'].includes(kind))throw new Error('Select the component and connection type.');
    const sum=values.reduce((a,b)=>a+b,0),reciprocal=1/values.reduce((a,b)=>a+1/b,0);
    return {equivalent:(kind==='resistor')===(mode==='series')?sum:reciprocal,count:values.length};
  }
  const conversionUnits={capacitance:{pF:1e-12,nF:1e-9,'µF':1e-6,F:1},resistance:{'Ω':1,'kΩ':1e3,'MΩ':1e6},timing:{Hz:1,kHz:1e3,MHz:1e6,s:1,ms:1e-3,'µs':1e-6}};
  function convert({category,unit,value}){
    const units=conversionUnits[category];
    if(!units||!Object.hasOwn(units,unit))throw new Error('Choose a valid conversion unit.');
    nonnegative(value,'Value');
    if(category==='timing')positive(value,'Frequency or period');
    const base=value*units[unit],periodUnits=['s','ms','µs'];
    if(value>0&&base===0)throw new Error('This value is too small to convert.');
    const frequency=periodUnits.includes(unit)?1/base:base;
    return Object.fromEntries(Object.entries(units).map(([name,scale])=>[name,category==='timing'?(periodUnits.includes(name)?1/frequency:frequency)/scale:base/scale]));
  }
  const api={convert,conversionUnits,led,timer,timerDesign,wire,wireRows,ohm,voltage,currentDivider,network,preferred};
  for(const [key,fn] of Object.entries(api))if(typeof fn==='function')api[key]=(...args)=>{
    const result=fn(...args),values=typeof result==='number'?[result]:Object.values(result);
    if(values.some(v=>typeof v==='number'&&!Number.isFinite(v)))throw new Error('These values exceed the supported numerical range.');
    return result;
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BenchCalcCircuits=api;
})(globalThis);
