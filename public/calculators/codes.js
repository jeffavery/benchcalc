(function(root){
  'use strict';
  const close=(a,b)=>Math.abs(a-b)<=Math.max(Math.abs(a),Math.abs(b))*Number.EPSILON*8;
  function numeric(value,allowZero=false){
    if(!Number.isFinite(value)||value<0||(!allowZero&&value===0)) throw new Error(`Enter a ${allowZero?'non-negative':'positive'} value.`);
  }
  function decodeSmd(raw,length=3){
    if(![3,4].includes(length)) throw new Error('Choose a 3- or 4-character marking.');
    const code=String(raw).trim().toUpperCase();
    if(/^0+$/.test(code)&&[1,3,4].includes(code.length)) return {value:0,code,formula:'Zero-ohm jumper marking'};
    if(code.length!==length) throw new Error(`Enter ${length} characters, such as ${length===3?'472 or 4R7':'4701 or 4R70'}.`);
    if(/^\d*R\d*$/.test(code)){
      const value=Number(code.replace('R','.'));
      return {value,code,formula:`R marks the decimal point: ${value} Ω`};
    }
    if(!/^\d+$/.test(code)) throw new Error('Use digits or one R for a decimal point. EIA-96 letter codes are not included.');
    const digits=Number(code.slice(0,-1)),exp=Number(code.slice(-1));
    if(digits===0) throw new Error('Use 0, 000, or 0000 for a zero-ohm jumper.');
    return {value:digits*10**exp,code,formula:`${digits} × ${10**exp} Ω`};
  }
  function encodeSmd(value,length=3){
    numeric(value,true);
    if(![3,4].includes(length)) throw new Error('Choose a 3- or 4-character marking.');
    if(value===0) return '0'.repeat(length);
    const count=length-1;
    for(let exp=0;exp<=9;exp++){
      const digits=value/10**exp,rounded=Math.round(digits);
      if(rounded>=10**(count-1)&&rounded<10**count&&close(digits,rounded)) return String(rounded)+exp;
    }
    // Below the numeric-code range, use an R in place of the decimal point.
    if(value<10**(count-1)) for(let decimals=0;decimals<=length-1;decimals++){
      const printed=value.toFixed(decimals);
      if(!close(Number(printed),value)) continue;
      let code=printed.includes('.')?printed.replace('.','R'):printed+'R';
      if(code.startsWith('0R')) code=code.slice(1);
      if(code.length<=length) return code.padEnd(length,'0');
    }
    throw new Error(`This value cannot be represented exactly in a ${length}-character SMD marking. Use ${count} significant digits or a shorter decimal value.`);
  }
  // Capacitance is kept in pF internally to avoid tiny SI floating-point values.
  function decodeCap(raw){
    const code=String(raw).trim();
    if(!/^[1-9]\d{2}$/.test(code)) throw new Error('Enter a 3-digit capacitance code, such as 104. Leave any tolerance or voltage letters out.');
    const digits=Number(code.slice(0,2)),last=Number(code[2]),exp=last===8?-2:last===9?-1:last;
    return {value:digits*10**exp,code,formula:`${digits} × ${10**exp} pF`};
  }
  function encodeCap(value){
    numeric(value);
    for(let exp=-2;exp<=7;exp++){
      const digits=value/10**exp,rounded=Math.round(digits);
      if(rounded>=10&&rounded<=99&&close(digits,rounded)) return String(rounded)+(exp===-2?'8':exp===-1?'9':String(exp));
    }
    throw new Error('Use two significant digits, from 0.10 pF to 990 µF. This value cannot be represented exactly by a 3-digit capacitor code.');
  }
  const api={decodeSmd,encodeSmd,decodeCap,encodeCap};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;else root.BenchCalcCodes=api;
})(globalThis);
