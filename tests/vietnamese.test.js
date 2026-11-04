import test from 'node:test'
import assert from 'node:assert/strict'
import {SENTENCES,createVietnameseQuestion,createVietnameseRound} from '../src/vietnamese.js'
import {createQuestion} from '../src/math.js'

function checkChoices(q){
  assert.equal(q.choices.length,3)
  assert.equal(new Set(q.choices.map(c=>c.id)).size,3)
  assert.equal(new Set(q.choices.map(c=>c.answer)).size,3)
  assert.equal(q.choices.filter(c=>c.answer===q.correct).length,1)
}
for(const grade of [1,2,3]) {
  test(`Grade ${grade}: 40 unique sentences with exactly one missing word`,()=>{
    assert.ok(SENTENCES[grade].length>=40)
    const sentences=new Set()
    for(const text of SENTENCES[grade]) {
      const q=createVietnameseQuestion(text)
      assert.equal(q.blanks.length,1)
      assert.equal(q.tokens.filter(t=>t.options).length,1)
      assert.equal(q.correct,q.tokens[q.blanks[0]].word)
      assert.ok(!/\s/.test(q.correct),'Answer must be one word')
      assert.ok(!/[{}|]/.test(q.tokens.map(t=>t.word).join('')))
      checkChoices(q)
      sentences.add(q.tokens.map(t=>t.word).join(''))
    }
    assert.equal(sentences.size,SENTENCES[grade].length)
  })
  test(`Grade ${grade}: 10 distinct questions per round, ignoring legacy blank count`,()=>{
    for(const legacy of [undefined,2,3]) {
      const round=createVietnameseRound(grade,legacy)
      assert.equal(round.length,10)
      round.forEach(q=>{assert.equal(q.blanks.length,1);checkChoices(q)})
      assert.equal(new Set(round.map(q=>q.tokens.map(t=>t.word).join(''))).size,10)
    }
  })
}
test('Existing math generation still returns valid unique choices',()=>{
  for(const range of [10,20,100]) for(const operation of ['mixed','add','sub']) for(let i=0;i<100;i++){
    const q=createQuestion(range,operation)
    checkChoices(q)
    assert.ok(q.correct>=0&&q.correct<=range)
  }
})
