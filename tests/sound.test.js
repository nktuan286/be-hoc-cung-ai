import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import {playAnswerFeedback,stopAudio,speakVietnamese} from '../src/sound.js'

const played=[],spoken=[]
let rejectPlayback=false
class Audio {
  constructor(src){this.src=src;this.currentTime=0;this.paused=false;played.push(this)}
  play(){return rejectPlayback?Promise.reject(new Error('Playback unavailable')):Promise.resolve()}
  pause(){this.paused=true}
}
globalThis.Audio=Audio
// Speech is completed explicitly so tests can prove the ordering.
globalThis.window={speechSynthesis:{cancel(){},getVoices:()=>[],speak(u){spoken.push(u)}}}
globalThis.SpeechSynthesisUtterance=class {constructor(text){this.text=text}}
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve()}
function reset(){stopAudio();played.length=0;spoken.length=0;rejectPlayback=false}

for(const correct of [true,false]) test(`File, ${correct?'success':'failure'} message, then sentence in order`,async()=>{
  reset()
  const pending=playAnswerFeedback(correct,'Em chăm học.')
  assert.equal(played.length,1)
  assert.match(played[0].src,correct?/success\.mp3$/:/incorrect\.mp3$/)
  assert.ok(existsSync(new URL(played[0].src)), 'Sound file must exist')
  await flush()
  assert.equal(spoken.length,0,'Wait for file completion, not play() resolution')
  played[0].onended();await flush()
  assert.equal(spoken.length,1)
  assert.ok(spoken[0].text.startsWith(correct?'Hoan hô!':'Rất tiếc!'))
  spoken[0].onend();await flush()
  assert.equal(spoken[1].text,'Em chăm học.')
  spoken[1].onend();await pending
  stopAudio()
})
test('Changing question or muting during the file stops playback and all speech',async()=>{
  reset()
  const pending=playAnswerFeedback(true,'Old sentence')
  stopAudio();await pending
  assert.equal(played[0].paused,true)
  assert.equal(played[0].currentTime,0)
  assert.equal(played[0].onended,null)
  assert.equal(spoken.length,0)
})
test('Muting during feedback prevents reading the sentence',async()=>{
  reset()
  const pending=playAnswerFeedback(true,'Old sentence')
  played[0].onended();await flush()
  assert.equal(spoken.length,1)
  stopAudio();await pending
  assert.equal(spoken.length,1)
})
test('Read-answer button interrupts the sound file',async()=>{
  reset()
  const pending=playAnswerFeedback(false,'Old sentence')
  const reading=speakVietnamese('New answer')
  assert.equal(played[0].paused,true)
  assert.equal(spoken[0].text,'New answer')
  spoken[0].onend();await reading;await pending
  assert.equal(spoken.length,1)
  stopAudio()
})
for(const failure of ['error','rejection']) test(`File ${failure} still allows feedback speech`,async()=>{
  reset();rejectPlayback=failure==='rejection'
  const pending=playAnswerFeedback(false,'Em chăm học.')
  if(failure==='error') played[0].onerror()
  await flush()
  assert.ok(spoken[0].text.startsWith('Rất tiếc!'))
  spoken[0].onend();await flush()
  assert.equal(spoken[1].text,'Em chăm học.')
  spoken[1].onend();await pending
  stopAudio();rejectPlayback=false
})
