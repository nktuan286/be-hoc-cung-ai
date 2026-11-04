export const POSES = [
  { id: 'up', name: 'Giơ hai tay', short: 'Giơ hai tay', hint: 'Đưa cả hai tay lên cao' },
  { id: 'open', name: 'Tay bên mặt', short: 'Tay bên mặt', hint: 'Giơ hai tay cạnh mặt, khuỷu tay thấp hơn vai' },
  { id: 'wave', name: 'Giơ một tay', short: 'Giơ một tay', hint: 'Giơ một tay cao qua đầu, tay còn lại hạ xuống' },
  { id: 'cross', name: 'Khoanh tay', short: 'Khoanh tay', hint: 'Bắt chéo hai tay trước ngực' },
  { id: 'salute', name: 'Chào cờ', short: 'Chào cờ', hint: 'Đặt một tay gần thái dương' },
]
const rand = n => Math.floor(Math.random() * n)
export const shuffle = values => {
  const result = [...values]
  for(let i=result.length-1;i>0;i--){const j=rand(i+1);[result[i],result[j]]=[result[j],result[i]]}
  return result
}
export function createQuestion(range = 20, operation = 'mixed') {
  const symbol = operation === 'mixed' ? (Math.random() < 0.5 ? '+' : '−') : operation === 'add' ? '+' : '−'
  let a = rand(range + 1), b = rand(range + 1)
  if (symbol === '+') b = rand(range - a + 1)
  else if (b > a) [a, b] = [b, a]
  const correct = symbol === '+' ? a + b : a - b
  const distractors = new Set()
  const near = shuffle([-10,-5,-3,-2,-1,1,2,3,5,10])
  for (const delta of near) {
    const candidate = correct + delta
    if (candidate >= 0 && candidate <= range && candidate !== correct) distractors.add(candidate)
    if (distractors.size === 2) break
  }
  while (distractors.size < 2) { const n = rand(range+1); if(n!==correct) distractors.add(n) }
  const answers = shuffle([correct, ...distractors])
  return { a, b, symbol, correct, choices: shuffle(POSES).slice(0,3).map((pose, i) => ({ ...pose, answer: answers[i] })) }
}
