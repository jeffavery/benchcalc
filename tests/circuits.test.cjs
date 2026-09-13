const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../public/calculators/circuits.js');
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<=Math.max(1,Math.abs(expected))*1e-10,`${actual} != ${expected}`);
test('LED nominal resistance, upward E24 choice and power margin',()=>{
  const r=C.led({supply:12,forward:3.2,current:0.02,count:2});
  close(r.ideal,280);assert.equal(r.resistor,300);close(r.actual,5.6/300);close(r.power,5.6**2/300);assert.equal(r.rating,0.25);
  assert.ok(r.actual<=0.02);assert.ok(r.rating>=2*r.power);
  assert.equal(C.preferred(470),470);assert.equal(C.preferred(471),510);assert.equal(C.preferred(99),100);
  assert.throws(()=>C.led({supply:3,forward:3,current:0.02,count:1}));
  assert.throws(()=>C.led({supply:5,forward:2,current:0.02,count:1.5}));
});
test('555 astable timing and monostable pulse',()=>{
  const r=C.timer({mode:'astable',ra:10000,rb:100000,c:10e-6});
  close(r.high,Math.LN2*1.1);close(r.low,Math.LN2);close(r.frequency,1/(2.1*Math.LN2));close(r.duty,110/210*100);
  close(C.timer({mode:'mono',ra:10000,c:10e-6}).pulse,0.11);
  assert.throws(()=>C.timer({mode:'astable',ra:1000,rb:0,c:1e-6}));
});
test('wire uses both conductors and zero current gives zero drop',()=>{
  const r=C.wire({awg:22,length:2,current:0.5,supply:12});
  close(r.resistance,4*52.9392/1000);close(r.drop,0.1058784);close(r.loadVoltage,11.8941216);close(r.loss,0.0529392);
  close(C.wire({awg:30,length:1,current:0,supply:5}).drop,0);
  assert.ok(r.diameter>0.64&&r.diameter<0.65);assert.equal(r.chassis,7);assert.equal(r.transmission,0.92);
  assert.throws(()=>C.wire({awg:30,length:100,current:10,supply:5}));
});
test('all six Ohm law pairs reconstruct the same circuit',()=>{
  for(const [pair,a,b]of [['vi',12,0.02],['vr',12,600],['ir',0.02,600],['vp',12,0.24],['ip',0.02,0.24],['rp',600,0.24]]){
    const r=C.ohm({pair,a,b});close(r.voltage,12);close(r.current,0.02);close(r.resistance,600);close(r.power,0.24);
  }
  assert.throws(()=>C.ohm({pair:'vr',a:12,b:0}));
});
test('voltage divider includes loading and conserves current',()=>{
  close(C.voltage({supply:12,r1:10000,r2:10000,load:null}).output,6);
  const r=C.voltage({supply:12,r1:10000,r2:10000,load:10000});
  close(r.output,4);close(r.current,0.0008);close(r.loadCurrent,0.0004);close(r.p1,0.0064);close(r.p2,0.0016);
  close(r.current,r.output/10000+r.loadCurrent);
});
test('current divider conserves total current and power',()=>{
  const r=C.currentDivider({current:0.01,r1:1000,r2:2000});
  close(r.i1,0.006666666666666667);close(r.i2,0.0033333333333333335);close(r.i1+r.i2,0.01);close(r.p1+r.p2,0.01*r.voltage);
});
test('series/parallel resistors and capacitors use opposite combination rules',()=>{
  close(C.network({kind:'resistor',mode:'series',values:[100,220,330]}).equivalent,650);
  close(C.network({kind:'resistor',mode:'parallel',values:[100,100]}).equivalent,50);
  close(C.network({kind:'capacitor',mode:'parallel',values:[10e-6,20e-6]}).equivalent,30e-6);
  close(C.network({kind:'capacitor',mode:'series',values:[10e-6,10e-6]}).equivalent,5e-6);
  assert.throws(()=>C.network({kind:'resistor',mode:'series',values:[100]}));
  assert.throws(()=>C.network({kind:'capacitor',mode:'parallel',values:[0,1]}));
});
test('non-finite and extreme inputs fail instead of displaying Infinity',()=>{
  assert.throws(()=>C.ohm({pair:'vi',a:Infinity,b:1}));
  assert.throws(()=>C.ohm({pair:'ir',a:1e308,b:1e308}));
  assert.throws(()=>C.network({kind:'resistor',mode:'series',values:[1e308,1e308]}));
  assert.throws(()=>C.voltage({supply:12,r1:-1,r2:100,load:null}));
});
test('555 target timing reverses to the requested frequency and pulse',()=>{
  for(const duty of [50.1,60,90,99.9]){
    const r=C.timerDesign({mode:'astable',frequency:1000,duty,c:1e-8});
    const timing=C.timer({mode:'astable',ra:r.ra,rb:r.rb,c:1e-8});
    close(timing.frequency,1000);close(timing.duty,duty);
  }
  const r=C.timerDesign({mode:'mono',pulse:2,c:1e-6});
  close(C.timer({mode:'mono',ra:r.ra,c:1e-6}).pulse,2);
  for(const duty of [0,50,100,NaN])assert.throws(()=>C.timerDesign({mode:'astable',frequency:1,duty,c:1e-6}));
  assert.throws(()=>C.timerDesign({mode:'mono',pulse:0,c:1e-6}));
});
test('unit conversions preserve values and invert frequency and period',()=>{
  close(C.convert({category:'capacitance',unit:'nF',value:100})['µF'],0.1);
  close(C.convert({category:'resistance',unit:'MΩ',value:4.7})['Ω'],4700000);
  close(C.convert({category:'timing',unit:'kHz',value:1}).ms,1);
  close(C.convert({category:'timing',unit:'ms',value:2}).Hz,500);
  for(const [category,units] of Object.entries(C.conversionUnits))for(const unit of Object.keys(units)){
    const result=C.convert({category,unit,value:4.7});
    close(result[unit],4.7);
    for(const [other,value] of Object.entries(result))close(C.convert({category,unit:other,value})[unit],4.7);
  }
  assert.equal(C.convert({category:'resistance',unit:'Ω',value:0})['MΩ'],0);
  for(const value of [0,-1,Infinity])assert.throws(()=>C.convert({category:'timing',unit:'Hz',value}));
  assert.throws(()=>C.convert({category:'resistance',unit:'pF',value:1}));
});
