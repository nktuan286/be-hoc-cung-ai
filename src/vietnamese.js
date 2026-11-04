import { POSES, shuffle } from './math.js'
import { SENTENCES } from './vietnamese-bank.js'
export { SENTENCES, GRADE_DESCRIPTIONS } from './vietnamese-bank.js'

export function createVietnameseQuestion(template) {
  const tokens=[]
  const candidates=[]
  const pattern=/\{([^}]+)\}|([^{}]+)/g
  for (const match of template.matchAll(pattern)) {
    if(match[1]) {candidates.push(tokens.length);tokens.push({word:match[1].split('|')[0],options:match[1].split('|')})}
    else tokens.push({word:match[2]})
  }
  const blanks=shuffle(candidates).slice(0,1).sort((a,b)=>a-b)
  return withChoices({subject:'vietnamese',tokens,blanks,step:0,allCorrect:true})
}
function withChoices(question) {
  const token=question.tokens[question.blanks[question.step]]
  const options=shuffle(token.options)
  return {...question,correct:token.word,choices:shuffle(POSES).slice(0,3).map((pose,i)=>({...pose,answer:options[i]}))}
}
export function createVietnameseRound(grade) {
  return shuffle(SENTENCES[grade]).slice(0,10).map(text=>createVietnameseQuestion(text))
}
