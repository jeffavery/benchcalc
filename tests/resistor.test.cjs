const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../public/calculators/resistor.js');
test('known color codes and tolerance ranges',()=>{
  assert.deepEqual(R.decode(['yellow','violet','red','gold']),{value:4700,tolerance:5,min:4465,max:4935});
  assert.equal(R.decode(['brown','black','silver','silver']).value,0.1);
  assert.equal(R.decode(['white','white','white','brown']).value,99e9);
  assert.deepEqual(R.encode(2200,'red'),['red','red','red','red']);
  assert.deepEqual(R.encode(0.47),['yellow','violet','silver','gold']);
});
test('every supported four-band value and tolerance round-trips',()=>{
  for(let digits=10;digits<=99;digits++) for(let exp=-2;exp<=9;exp++) for(const tolerance of Object.keys(R.tolerances)){
    const value=digits*10**exp;
    const result=R.decode(R.encode(value,tolerance));
    assert.ok(Math.abs(result.value-value)<=value*1e-12);
    assert.equal(result.tolerance,R.tolerances[tolerance]);
  }
});
test('unrepresentable and invalid values are rejected, never rounded',()=>{
  for(const value of [0,-1,NaN,Infinity,0.09,100e9,123,4701]) assert.throws(()=>R.encode(value));
  assert.throws(()=>R.decode(['black','black','red','gold']));
  assert.throws(()=>R.encode(100,'black'));
});
test('engineering formatting',()=>{
  assert.equal(R.format(4700),'4.7 kΩ');assert.equal(R.format(0.1),'0.1 Ω');assert.equal(R.format(99e9),'99 GΩ');
});
