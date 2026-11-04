const successSound = new URL('./assets/sounds/success.mp3', import.meta.url).href
const incorrectSound = new URL('./assets/sounds/incorrect.mp3', import.meta.url).href
let generation=0
let finishSpeech
let cancelEffect

export function stopAudio() {
  generation++
  try { window.speechSynthesis?.cancel() } catch { /* Audio is optional. */ }
  finishSpeech?.()
  finishSpeech=undefined
  cancelEffect?.()
}

// The ended event preserves sequencing for files with different durations.
function playEffect(correct,token) {
  return new Promise(resolve=>{
    if(token!==generation) {resolve();return}
    let audio
    const done=()=>{
      if(audio) {audio.onended=null;audio.onerror=null}
      if(cancelEffect===cancel) cancelEffect=undefined
      resolve()
    }
    const cancel=()=>{
      try {audio?.pause();if(audio)audio.currentTime=0} catch { /* Media may not have loaded. */ }
      done()
    }
    try {
      audio=new Audio(correct?successSound:incorrectSound)
      audio.volume=.8
      audio.onended=done
      audio.onerror=cancel
      cancelEffect=cancel
      // Playback rejection must not prevent the spoken feedback.
      const playback=audio.play()
      playback?.catch(cancel)
    } catch {cancel()}
  })
}

function speak(text,token) {
  return new Promise(resolve=>{
    if(token!==generation || !text) {resolve();return}
    try {
      if(!window.speechSynthesis) {resolve();return}
      const utterance=new SpeechSynthesisUtterance(text)
      utterance.lang='vi-VN';utterance.rate=.9;utterance.pitch=1.05
      const voice=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('vi'))
      if(voice) utterance.voice=voice
      const done=()=>{if(finishSpeech===done)finishSpeech=undefined;resolve()}
      finishSpeech=done
      utterance.onend=done;utterance.onerror=done
      window.speechSynthesis.speak(utterance)
    } catch {finishSpeech=undefined;resolve()}
  })
}

export function speakVietnamese(text) {
  stopAudio()
  return speak(text,generation)
}

export async function playAnswerFeedback(correct,sentence) {
  stopAudio()
  const token=generation
  await playEffect(correct,token)
  if(token!==generation) return
  await speak(correct?'Hoan hô! Con đã chọn đúng!':'Rất tiếc! Con chưa chọn đúng. Hãy nghe đáp án nhé!',token)
  if(token!==generation) return
  await speak(sentence,token)
}
