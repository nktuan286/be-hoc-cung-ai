let context
export function playTone(correct) {
  try {
    context ??= new (window.AudioContext || window.webkitAudioContext)()
    if (context.state === 'suspended') context.resume()
    const notes = correct ? [523,659,784] : [350,290]
    notes.forEach((frequency, i) => {
      const osc=context.createOscillator(), gain=context.createGain()
      const start=context.currentTime+i*.12
      osc.type='sine'; osc.frequency.value=frequency
      gain.gain.setValueAtTime(.0001,start)
      gain.gain.exponentialRampToValueAtTime(.15,start+.016)
      gain.gain.exponentialRampToValueAtTime(.0001,start+.2)
      osc.connect(gain).connect(context.destination)
      osc.start(start); osc.stop(start+.22)
    })
  } catch { /* Audio is optional. */ }
}
export function speakVietnamese(text) {
  try {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang='vi-VN'; utterance.rate=.95; utterance.pitch=1.1
    const voice=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('vi'))
    if(voice) utterance.voice=voice
    window.speechSynthesis.speak(utterance)
  } catch { /* Ignore unsupported speech engines. */ }
}
