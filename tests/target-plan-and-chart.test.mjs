import assert from 'node:assert/strict';
import test from 'node:test';
import { targetPlan } from '../lib/target-plan.ts';
import { calculateAstrology } from '../lib/astrology-engine.ts';

test('target plan honors every horizon and month-end boundaries', () => {
  for (const [horizon, end] of [['90 days','2026-05-01'],['6 months','2026-07-31'],['9 months','2026-10-31'],['12 months','2027-01-31']]) {
    const items = targetPlan({e1_horizon:horizon,e2_m1:'Build',e2_m2:'Test',e2_m3:'Launch',e1_goal:'Release the service',e3_checkin:'Every two weeks'},new Date('2026-01-31T00:00:00Z'));
    assert.equal(items.length,3);
    assert.equal(items[2].dueDate,end);
    assert.equal(items[0].cadence,'biweekly');
    assert.equal(items[0].why,'Release the service');
    assert(items[0].dueDate < items[1].dueDate && items[1].dueDate < items[2].dueDate);
  }
  assert.equal(targetPlan({e1_horizon:'6 months',e2_m3:'Launch'},new Date('2026-08-31T00:00:00Z'))[0].dueDate,'2027-02-28');
  assert.deepEqual(targetPlan({},new Date()),[]);
});

const birth = {date:'1990-06-15',time:'12:00',timezone:'America/Los_Angeles',latitude:34.0522,longitude:-118.2437};
test('birth chart matches an independent Swiss Ephemeris reference case', () => {
  const chart=calculateAstrology(birth);
  assert.equal(chart.utc,'1990-06-15T19:00:00.000Z');
  assert.equal(chart.rising.sign,'Virgo');
  assert(Math.abs(chart.rising.longitude-163.63982159290762)<0.02);
  assert(Math.abs(chart.sun.longitude-84.40813433890457)<0.02);
  assert(Math.abs(chart.moon.longitude-349.2704549251303)<0.05);
});
test('invalid birth inputs and skipped daylight-saving times do not generate charts', () => {
  for(const value of [{date:'2026-02-30'},{time:'25:00'},{timezone:'Invalid/Zone'},{latitude:''},{latitude:91},{longitude:181},{date:'2026-03-08',time:'02:30'}]) {
    assert.equal(calculateAstrology({...birth,...value}),null,JSON.stringify(value));
  }
});
