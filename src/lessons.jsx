import React, { useState } from 'react'
import { assets } from './images'
import Footer from './Footer'
import { SENTENCES, GRADE_DESCRIPTIONS } from './vietnamese'
const KEY='math-lesson'
export function loadLesson(){
  let value
  try { value=JSON.parse(localStorage.getItem(KEY)) } catch { /* Use defaults. */ }
  return {
    subject:value?.subject==='vietnamese'?'vietnamese':'math',
    grade:[1,2,3].includes(value?.grade)?value.grade:1,
    range:[10,20,100].includes(value?.range)?value.range:20,
    operation:['mixed','add','sub'].includes(value?.operation)?value.operation:'mixed',
  }
}
function Choices({items,value,onChange}) {
  return <div className={`lesson-choices ${items.length===2?'subject-choices':''}`}>{items.map(([id,label])=><button key={id} aria-pressed={value===id} onClick={()=>onChange(id)}><strong>{label}</strong></button>)}</div>
}
export function LessonsPage(){
  const [lesson,setLesson]=useState(loadLesson)
  const [saved,setSaved]=useState(false)
  const [error,setError]=useState('')
  const update=(key,value)=>{setLesson(l=>({...l,[key]:value}));setSaved(false)}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(lesson));setSaved(true);setError('');return true}catch{setError('Không lưu được cài đặt. Hãy cho phép lưu dữ liệu trong trình duyệt.');return false}}
  return <div className="page-shell lessons-shell">
    <header className="topbar"><a className="brand" href="/"><img src={assets.robot} alt=""/><span>Bé Học Cùng <em>AI</em></span></a><a className="profile-pill" href="/">← Về trò chơi</a></header>
    <main className="lesson-page">
      <div className="lesson-intro"><span>GÓC PHỤ HUYNH & GIÁO VIÊN</span><h1>Chuẩn bị bài học</h1><p>Chọn nội dung phù hợp, rồi cùng bé học bằng vận động.</p></div>
      <section className="lesson-card">
        <h2>Môn học</h2>
        <Choices items={ [['math','🧮 Toán'],['vietnamese','📖 Tiếng Việt']] } value={lesson.subject} onChange={v=>update('subject',v)}/>
        {lesson.subject==='math'?<>
          <h2>Phạm vi phép tính</h2>
          <Choices items={[10,20,100].map(n=>[n,`Trong ${n}`])} value={lesson.range} onChange={v=>update('range',v)}/>
          <h2>Loại phép toán</h2>
          <Choices items={ [['mixed','+ − Cộng & trừ'],['add','+ Phép cộng'],['sub','− Phép trừ']] } value={lesson.operation} onChange={v=>update('operation',v)}/>
        </>:<>
          <h2>Lớp học</h2>
          <Choices items={[1,2,3].map(n=>[n,`Lớp ${n}`])} value={lesson.grade} onChange={v=>update('grade',v)}/>
          <p className="lesson-help">{GRADE_DESCRIPTIONS[lesson.grade]} Ngân hàng {SENTENCES[lesson.grade].length} câu, mỗi câu khuyết đúng 1 từ.</p>
        </>}
        <div className="lesson-summary"><h2>Mỗi lượt · 10 câu hỏi</h2><p>Ba tư thế khác nhau được chọn ngẫu nhiên cho mỗi lần chọn. Giữ tư thế 1,25 giây để trả lời, sau đó bấm “Câu tiếp theo”. {lesson.subject==='vietnamese'?'Chọn đúng từ được 10 điểm. Mỗi lượt chọn 10 câu khác nhau. Sau khi trả lời, nghe hiệu ứng, lời nhận xét và câu đầy đủ.':'Mỗi câu đúng được 10 điểm.'}</p></div>
        <div className="lesson-actions"><button className="secondary-btn" onClick={save}>Lưu cài đặt</button><button className="primary-btn" onClick={()=>{if(save())window.location.assign('/')}}>Bắt đầu chơi →</button></div>
        <p role="status">{error||(saved?'✓ Đã lưu cài đặt trên thiết bị này.':'Cài đặt được lưu trên trình duyệt của thiết bị này.')}</p>
      </section>
    </main>
    <Footer/>
  </div>
}
