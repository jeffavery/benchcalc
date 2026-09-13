(function(root){
  'use strict';
  const R=typeof module!=='undefined'&&module.exports?require('./resistor.js'):root.BenchCalcResistor;
  // EIA markings: Bourns ColorCodeMarkings p2 and RS Intek AL Series p6.
  const multipliers=['silver','gold','black','brown','red','orange','yellow'];
  const tolerances={black:20,gold:5,silver:10};
  function decode(bands){
    if(!Array.isArray(bands)||bands.length!==4||!multipliers.includes(bands[2])||!Object.hasOwn(tolerances,bands[3])) throw new Error('Choose a supported four-band EIA inductor marking.');
    const value=R.decode([...bands.slice(0,3),'gold']).value;
    const tolerance=tolerances[bands[3]];
    return {value,tolerance,min:value*(1-tolerance/100),max:value*(1+tolerance/100)};
  }
  function encode(value,tolerance='gold'){
    if(!Number.isFinite(value)||value<0.1||value>990000||!Object.hasOwn(tolerances,tolerance)) throw new Error('Use two significant digits, from 0.10 µH to 990 mH, with 5%, 10%, or 20% tolerance.');
    let bands;
    try{bands=R.encode(value,'gold');}catch(_){throw new Error('This inductance cannot be represented exactly. Use two significant digits, such as 4.7 µH or 220 µH.');}
    bands[3]=tolerance;
    return bands;
  }
  const api={multipliers,tolerances,decode,encode};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;else root.BenchCalcInductor=api;
})(globalThis);
