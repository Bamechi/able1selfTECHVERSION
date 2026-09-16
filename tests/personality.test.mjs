import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import assert from 'node:assert/strict';
import test from 'node:test';
const source = await readFile(new URL('../lib/personality.ts', import.meta.url), 'utf8');
const { personalityItems, personalityResult, encodePersonality, isAnswered, parsePersonality } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`);
const filled = (reverse = false) => Object.fromEntries([...personalityItems.map(item => [item.key, (item.direction === 1) !== reverse ? 5 : 1]), ...[0,1,2,3].map(axis => [`tie${axis}`, 1])]);
test('scores opposite preferences and keeps dimension percentages complementary', () => {
  assert.equal(personalityResult(encodePersonality(filled())).type, 'ESTJ');
  assert.equal(personalityResult(encodePersonality(filled(true))).type, 'INFP');
  for (const axis of personalityResult(encodePersonality(filled())).axes) assert.equal(axis.first + axis.second, 100);
});
test('incomplete or malformed assessments never yield a type or satisfy completion', () => {
  assert.equal(personalityResult('INTJ'), null);
  assert.equal(isAnswered('a1_assessment', encodePersonality({p0_0: 5})), false);
  const invalid = filled(); invalid.p0_0 = 99;
  assert.equal(personalityResult(encodePersonality(invalid)), null);
  assert.deepEqual(parsePersonality('{'), {});
});
test('ties use stated preferences without disguising a balanced split', () => {
  const answers = Object.fromEntries(personalityItems.map(item => [item.key, 3]));
  Object.assign(answers, {tie0:2,tie1:2,tie2:1,tie3:2});
  const result = personalityResult(encodePersonality(answers));
  assert.equal(result.type, 'INTP');
  assert.ok(result.axes.every(axis => axis.balanced && axis.first === 50));
});
test('saved partial assessments survive encode and decode', () => {
  const answers = {p0_0:1,p0_1:4,p0_2:3,p0_3:5};
  assert.deepEqual(parsePersonality(encodePersonality(answers)), answers);
});
