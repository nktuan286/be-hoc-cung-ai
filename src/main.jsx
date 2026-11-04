import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PoseLandmarker } from '@mediapipe/tasks-vision'
import { resolveVisionRuntime } from './vision-runtime'
import { Camera, CameraOff, ChevronRight, Maximize2, Minimize2, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { createQuestion } from './math'
import { createVietnameseRound } from './vietnamese'
import { identifyPose, SKELETON } from './pose'
import { playAnswerFeedback, speakVietnamese, stopAudio } from './sound'
import { assets, poseImages } from './images'
import { loadLesson, LessonsPage } from './lessons'
import Footer from './Footer'
import './style.css'

const TOTAL = 10
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
function App() {
  const [lesson] = useState(loadLesson)
  const isVietnamese = lesson.subject==='vietnamese'
  const [round,setRound] = useState(()=>isVietnamese?createVietnameseRound(lesson.grade):[])
  const [question,setQuestion] = useState(()=>isVietnamese?round[0]:createQuestion(lesson.range,lesson.operation))
  const [index,setIndex] = useState(0)
  const [score,setScore] = useState(0)
  const [result,setResult] = useState(null)
  const [isFinished,setFinished] = useState(false)
  const [enabled,setEnabled] = useState(false)
  const [cameraStatus,setCameraStatus] = useState('off')
  const [cameraError,setCameraError] = useState('')
  const [detected,setDetected] = useState(null)
  const [hold,setHold] = useState(0)
  const [muted,setMuted] = useState(false)
  const [fullscreen,setFullscreen] = useState(false)
  const videoRef=useRef(null), canvasRef=useRef(null), streamRef=useRef(null), landmarkerRef=useRef(null), frameRef=useRef(0)
  const gameRef=useRef({}), poseRef=useRef({id:null,since:0,armed:true}), lastFrameRef=useRef(0), lastVideoRef=useRef(-1), startTokenRef=useRef(0)
  gameRef.current={question,index,result,isFinished,muted,score}

  const answer=useCallback((choice)=>{
    const state=gameRef.current
    if(state.result || state.isFinished) return
    const correct = choice.answer===state.question.correct
    const message = correct ? 'Hoan hô! Con đã chọn đúng!' : 'Rất tiếc! Con chưa chọn đúng.'
    gameRef.current={...state,result:{answer:choice.answer,correct,message}}
    setResult({answer:choice.answer,correct,message})
    if(correct) setScore(s=>s+1)
    if(!state.muted) {
      const sentence=state.question.subject==='vietnamese'
        ? state.question.tokens.map(token=>token.word).join('')
        : `${state.question.a} ${state.question.symbol==='+'?'cộng':'trừ'} ${state.question.b} bằng ${state.question.correct}`
      void playAnswerFeedback(correct,sentence)
    }
    poseRef.current={id:null,since:0,armed:false}

  },[])
  const answerRef=useRef(answer)
  answerRef.current=answer

  const reset=useCallback(()=>{
    stopAudio()
    poseRef.current={id:null,since:0,armed:true}
    if(isVietnamese){const next=createVietnameseRound(lesson.grade);setRound(next);setQuestion(next[0])}
    else setQuestion(createQuestion(lesson.range,lesson.operation))
    setIndex(0);setScore(0);setResult(null);setFinished(false);setDetected(null);setHold(0)
  },[lesson,isVietnamese])

  const stopCamera=useCallback(()=>{
    startTokenRef.current++
    cancelAnimationFrame(frameRef.current)
    if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop())
    streamRef.current=null
    landmarkerRef.current?.close();landmarkerRef.current=null
    if(videoRef.current) videoRef.current.srcObject=null
    setEnabled(false);setCameraStatus('off');setDetected(null);setHold(0)
    poseRef.current={id:null,since:0,armed:true}
  },[])

  const processFrame=useCallback((now)=>{
    const video=videoRef.current, canvas=canvasRef.current, model=landmarkerRef.current
    if(!video || !model || !streamRef.current) return
    frameRef.current=requestAnimationFrame(processFrame)
    if(now-lastFrameRef.current<90 || video.readyState<2 || lastVideoRef.current===video.currentTime) return
    lastFrameRef.current=now;lastVideoRef.current=video.currentTime
    try {
      const result=model.detectForVideo(video,now)
      const points=result.landmarks?.[0]
      if(canvas){
        const ctx=canvas.getContext('2d'),width=canvas.width=video.videoWidth||640,height=canvas.height=video.videoHeight||480
        ctx.clearRect(0,0,width,height)
        if(points){
          ctx.lineWidth=5;ctx.lineCap='round';ctx.strokeStyle='#83ecbb';ctx.fillStyle='#ffffff'
          SKELETON.forEach(([a,b])=>{const p=points[a],q=points[b];if(!p||!q)return;ctx.beginPath();ctx.moveTo(p.x*width,p.y*height);ctx.lineTo(q.x*width,q.y*height);ctx.stroke()})
          ;[11,12,13,14,15,16].forEach(i=>{const p=points[i];if(!p)return;ctx.beginPath();ctx.arc(p.x*width,p.y*height,6,0,Math.PI*2);ctx.fill()})
        }
      }
      const pose=identifyPose(points)
      setDetected(prev=>prev===pose?prev:pose)
      const state=poseRef.current
      if(gameRef.current.result || gameRef.current.isFinished){setHold(0);return}
      // Re-arm only after pose is released, to avoid reselecting on next question.
      if(!pose){if(state.id || !state.armed)poseRef.current={id:null,since:0,armed:true};setHold(0);return}
      if(!state.armed){setHold(0);return}
      if(state.id!==pose){poseRef.current={id:pose,since:now,armed:true};setHold(0);return}
      const progress=Math.min(100,((now-state.since)/1250)*100)
      setHold(Math.round(progress))
      if(progress>=100){
        const choice=gameRef.current.question.choices.find(c=>c.id===pose)
        if(choice) answerRef.current(choice)
      }
    } catch(err){console.warn('MediaPipe frame error:',err)}
  },[])

  const startCamera=useCallback(async()=>{
    if(streamRef.current) return
    const token=++startTokenRef.current
    setCameraError('');setCameraStatus('loading');setEnabled(true)
    try {
      if(!navigator.mediaDevices?.getUserMedia) throw new Error('Trình duyệt không hỗ trợ camera hoặc website chưa chạy trên HTTPS.')
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:960},height:{ideal:720}},audio:false})
      if(token!==startTokenRef.current){stream.getTracks().forEach(t=>t.stop());return}
      streamRef.current=stream
      if(!videoRef.current) throw new Error('Không tìm thấy khung camera.')
      videoRef.current.srcObject=stream
      await videoRef.current.play()
      const fileset=await resolveVisionRuntime()
      if(token!==startTokenRef.current) return
      let model
      try{model=await PoseLandmarker.createFromOptions(fileset,{baseOptions:{modelAssetPath:MODEL,delegate:'GPU'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.55,minPosePresenceConfidence:.55,minTrackingConfidence:.55})}
      catch{model=await PoseLandmarker.createFromOptions(fileset,{baseOptions:{modelAssetPath:MODEL,delegate:'CPU'},runningMode:'VIDEO',numPoses:1})}
      if(token!==startTokenRef.current){model.close();return}
      landmarkerRef.current=model;setCameraStatus('ready');poseRef.current={id:null,since:0,armed:true}
      lastFrameRef.current=0;lastVideoRef.current=-1
      frameRef.current=requestAnimationFrame(processFrame)
    }catch(err){
      console.error(err)
      stopCamera()
      setCameraStatus('error')
      setCameraError(err.name==='NotAllowedError'?'Bạn chưa cấp quyền camera. Hãy cho phép truy cập camera trong trình duyệt rồi thử lại.':err.name==='NotFoundError'?'Không tìm thấy camera trên thiết bị.':`Không mở được camera/AI: ${err.message}`)
    }
  },[processFrame,stopCamera])

  useEffect(()=>()=>{stopAudio();cancelAnimationFrame(frameRef.current);streamRef.current?.getTracks().forEach(t=>t.stop());landmarkerRef.current?.close()},[])
  useEffect(()=>{const handler=()=>setFullscreen(!!document.fullscreenElement);document.addEventListener('fullscreenchange',handler);return()=>document.removeEventListener('fullscreenchange',handler)},[])
  const toggleFullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{alert('Trình duyệt này không hỗ trợ toàn màn hình.')}}
  const nextQuestion=()=>{
    if(!result) return
    stopAudio()
    if(index+1>=TOTAL) setFinished(true)
    else {setQuestion(isVietnamese?round[index+1]:createQuestion(lesson.range,lesson.operation));setIndex(i=>i+1)}
    setResult(null);setDetected(null);setHold(0)
  }
  const answerAudioButton = !isFinished && <button className="read-answer-btn" aria-label="Đọc đáp án" title="Đọc đáp án" onClick={()=>speakVietnamese(isVietnamese ? question.tokens.map(token=>token.word).join('') : `${question.a} ${question.symbol==='+'?'cộng':'trừ'} ${question.b} bằng ${question.correct}`)}><Volume2 size={20}/></button>
  return <div className="page-shell">
    <header className="topbar">
      <a className="brand" href="/" aria-label="Bé Học Cùng AI"><img src={assets.robot} alt=""/><span>Bé Học Cùng <em>AI</em></span></a>
      <div className="top-actions"><div className="score-pill"><img src={assets.star} alt="Điểm"/>{score*10}</div><a className="profile-pill" href="/lessons"><img src={assets.avatar} alt=""/><span>Bài học</span><ChevronRight size={20}/></a><button className="icon-btn restart-btn" onClick={reset} aria-label="Chơi lại" title="Chơi lại"><RotateCcw size={20}/></button><button className="icon-btn" onClick={()=>{stopAudio();setMuted(m=>!m)}} aria-label={muted?'Bật âm thanh':'Tắt âm thanh'} title={muted?'Bật âm thanh':'Tắt âm thanh'} aria-pressed={!muted}>{muted?<VolumeX size={20}/>:<Volume2 size={20}/>}</button><button className="icon-btn fullscreen" onClick={toggleFullscreen} aria-label="Toàn màn hình">{fullscreen?<Minimize2/>:<Maximize2/>}</button></div>
    </header>
    <main>
      <section className={`question-stage ${isVietnamese&&!isFinished?'vietnamese-stage':''}`} aria-label={isVietnamese?'Câu hỏi Tiếng Việt':'Câu hỏi Toán'}>
        <img className="cheer cheer-boy" src={assets.boy} alt=""/>
        <img className="cheer cheer-girl" src={assets.girl} alt=""/>
        <div className="lesson-label">{isVietnamese?`📖 Tiếng Việt · Lớp ${lesson.grade}`:`🧮 Bài tập Toán · Phạm vi ${lesson.range}`}</div>
        <div className="question-progress"><span>Câu {isFinished?TOTAL:index+1} / {TOTAL}</span><progress value={isFinished?TOTAL:index} max={TOTAL} aria-label="Tiến độ bài học"/></div>
        {isVietnamese&&!isFinished?<div className="sentence-card"><p className="blank-instruction">Chọn từ còn thiếu trong câu</p><div className="sentence-text" aria-live="polite">{question.tokens.map((token,i)=>{
          const position=question.blanks.indexOf(i)
          const active=position===question.step
          const hidden=position>=question.step && position!==-1
          const revealed=active&&!!result
          return <span key={i} className={position===-1?'':`word-blank ${active?'active-blank':''} ${position<question.step?'filled-blank':''} ${revealed?(result.correct?'filled-blank':'corrected-blank'):''}`} aria-label={hidden&&!revealed?`Ô trống ${position+1}`:undefined}>{hidden&&!revealed?'…':token.word}</span>
        })}</div>{answerAudioButton}</div>:<div className="equation"><span>{isFinished?'🎉':question.a}</span>{!isFinished&&<><span>{question.symbol}</span><span>{question.b}</span><span>=</span><span className="answer-mark">?</span></>}{isFinished&&<span className="finish-title">Hoàn thành!</span>}{answerAudioButton}</div>}
      </section>
      <section className="play-panel">
        <div className="camera-section">
          <div className="camera-viewport">
            <video ref={videoRef} className="camera-video" playsInline muted autoPlay style={{display:enabled?'block':'none'}}/><canvas ref={canvasRef} className="camera-canvas" style={{display:cameraStatus==='ready'?'block':'none'}}/>
            <div className="camera-label"><Camera size={20}/> Camera của bé</div>
            {cameraStatus==='ready'&&<button className="camera-stop" onClick={stopCamera} aria-label="Tắt camera" title="Tắt camera"><CameraOff size={18}/></button>}
            {cameraStatus!=='ready'&&<div className="camera-placeholder"><img src={assets.robot} alt=""/><h2>{cameraStatus==='loading'?'Đang khởi động AI…':'Sẵn sàng vận động?'}</h2><p>{cameraStatus==='loading'?'Đang tải mô hình nhận diện tư thế':'Đứng đủ xa để thấy đầu, vai và hai tay nhé!'}</p>{cameraStatus!=='loading'&&<button className="primary-btn" onClick={startCamera}><Camera size={20}/> Bật camera</button>}</div>}
            {cameraStatus==='ready'&&<><div className="viewfinder"/><div className="pose-status">{detected?'Đã nhận diện · Giữ tư thế nhé!':'Làm theo một trong ba tư thế bên cạnh'}</div><div className="hold-track"><div style={{width:`${hold}%`}}/></div></>}
          </div>
          {cameraError&&<p className="error-box" role="alert">{cameraError}</p>}
        </div>
        <div className="answers-section">
          <h1 className="answers-heading">✨ Chọn tư thế có đáp án đúng:</h1>
          {isFinished?<div className="finished"><img src={assets.star} alt=""/><h2>Con làm tốt lắm!</h2><p>Đúng {score}/{TOTAL} câu · {score*10} điểm</p><button className="primary-btn" onClick={()=>reset()}><RotateCcw size={20}/> Chơi lại nào!</button><a href="/lessons">Chọn bài học khác</a></div>:<>
          <div className="pose-grid">{question.choices.map((choice,i)=><button key={`${index}-${choice.id}`} className={`pose-option pose-${i} ${result?.answer===choice.answer?(result.correct?'selected-right':'selected-wrong'):''} ${detected===choice.id&&!result?'pose-detected':''}`} disabled={!!result} onClick={()=>answer(choice)} aria-label={`${choice.name}: đáp án ${choice.answer}`}><span className="option-letter">{String.fromCharCode(65+i)}</span><img className="pose-art" src={poseImages[choice.id]} alt={choice.name}/><span className="pose-name">{choice.name}</span><span className={`pose-answer ${isVietnamese?'word-answer':''}`}>{choice.answer}</span>{result?.answer===choice.answer&&<span className="choice-check">{result.correct?'✓':'×'}</span>}</button>)}</div>
          <div className="answer-footer"><div className={`feedback ${result?(result.correct?'positive':'negative'):''}`} role="status">{result?<><span>{result.correct?'✓':'💪'}</span><b>{result.message} Đáp án đúng là {question.correct}.</b></>:<><span>💡</span><b>{cameraStatus==='ready'?'Giữ tư thế 1,25 giây để trả lời':'Bật camera hoặc chạm vào đáp án để chơi'}</b></>}</div><button className="primary-btn next-btn" disabled={!result} onClick={nextQuestion}>{index+1===TOTAL?'Xem kết quả':'Câu tiếp theo'} <ChevronRight size={22}/></button></div>
          </>}
        </div>
      </section>
    </main><Footer/>
  </div>
}
createRoot(document.getElementById('root')).render(window.location.pathname.replace(/\/$/,'')==='/lessons'?<LessonsPage/>:<App/>)
