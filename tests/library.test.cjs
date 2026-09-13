const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../public/calculators/resistor.js');
const C=require('../public/calculators/codes.js');
const I=require('../public/calculators/inductor.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(a,b)*1e-12,`${a} != ${b}`);

test('3-band tolerance, 5-band precision and 6-band temperature coefficient',()=>{
  assert.deepEqual(R.decode(['yellow','violet','red']),{value:4700,tolerance:20,min:3760,max:5640});
  assert.equal(R.decode(['brown','black','black','red','brown']).value,10000);
  assert.deepEqual(R.encode(12300,'red',6,'blue'),['brown','red','orange','red','red','blue']);
  const six=R.decode(['brown','red','orange','red','red','blue']);
  assert.equal(six.tempco,10);assert.equal(six.tolerance,2);assert.equal(six.value,12300);
  assert.throws(()=>R.encode(1234,'brown',5));
  assert.throws(()=>R.encode(0.99,'brown',6));
  assert.throws(()=>R.decode(['brown','black','black','red','brown','white']));
  assert.throws(()=>R.decode(['brown','black']));
});
test('all three- and five-band magnitudes round-trip, with all temperature colors',()=>{
  for(const count of [3,5]){
    const min=count===3?10:100,max=count===3?99:999;
    for(let digits=min;digits<=max;digits++)for(let exp=-2;exp<=9;exp++){
      const value=digits*10**exp;close(R.decode(R.encode(value,'brown',count)).value,value);
    }
  }
  for(const [color,tempco]of Object.entries(R.tempcos))assert.equal(R.decode(R.encode(1000,'green',6,color)).tempco,tempco);
});
test('SMD manufacturer examples, decimal and zero-ohm markings',()=>{
  for(const [code,length,value]of [['472',3,4700],['470',3,47],['1001',4,1000],['8252',4,82500],['4R7',3,4.7],['24R3',4,24.3],['R010',4,0.01],['R47',3,0.47],['0',3,0],['0000',4,0]])close(C.decodeSmd(code,length).value,value);
  assert.equal(C.encodeSmd(4700,3),'472');assert.equal(C.encodeSmd(4700,4),'4701');
  assert.equal(C.encodeSmd(4.7,3),'4R7');assert.equal(C.encodeSmd(0.01,4),'R010');
  assert.equal(C.encodeSmd(0,3),'000');assert.equal(C.encodeSmd(0,4),'0000');
});
test('all normalized SMD numeric values and supported decimal values round-trip',()=>{
  for(const length of [3,4]){
    for(let digits=10**(length-2);digits<10**(length-1);digits++)for(let exp=0;exp<=9;exp++){
      const value=digits*10**exp;close(C.decodeSmd(C.encodeSmd(value,length),length).value,value);
    }
    for(const value of [0.01,0.1,0.47,1,1.2,4.7,9.9])close(C.decodeSmd(C.encodeSmd(value,length),length).value,value);
  }
});
test('SMD rejects unsupported letters, length errors and nonrepresentable values',()=>{
  for(const code of ['01C','4K7','1RR','4.7','','001','-12','ABC'])assert.throws(()=>C.decodeSmd(code,3),code);
  for(const value of [-1,NaN,Infinity,123,0.001,100e9])assert.throws(()=>C.encodeSmd(value,3),String(value));
  assert.throws(()=>C.encodeSmd(1,5));
});
test('capacitor examples, fractional multipliers and unit boundaries',()=>{
  for(const [code,pf]of [['104',100000],['473',47000],['105',1000000],['479',4.7],['478',0.47],['100',10],['108',0.1],['997',990000000]]){
    close(C.decodeCap(code).value,pf);assert.equal(C.encodeCap(pf),code);
  }
  for(let digits=10;digits<=99;digits++)for(let exp=-2;exp<=7;exp++){
    const value=digits*10**exp;close(C.decodeCap(C.encodeCap(value)).value,value);
  }
  for(const code of ['104K','4R7','000','01','01C','-10'])assert.throws(()=>C.decodeCap(code));
  for(const value of [0,-1,0.09,123,1e9,NaN])assert.throws(()=>C.encodeCap(value));
});
test('Bourns EIA inductor examples and complete supported round-trip',()=>{
  close(I.decode(['blue','gray','gold','silver']).value,6.8);
  assert.equal(I.decode(['red','violet','brown','gold']).value,270);
  assert.equal(I.decode(['yellow','violet','red','black']).tolerance,20);
  for(let digits=10;digits<=99;digits++)for(let exp=-2;exp<=4;exp++)for(const t of ['gold','silver','black']){
    const value=digits*10**exp;close(I.decode(I.encode(value,t)).value,value);
  }
  assert.throws(()=>I.encode(1000000));assert.throws(()=>I.encode(10,'brown'));
  assert.throws(()=>I.decode(['gold','blue','gray','silver']));
});
