import React, { useState } from 'react'
import { assets } from './images'
const KEY='math-lesson'
export function loadLesson(){
  try { const value=JSON.parse(localStorage.getItem(KEY));return {range:[10,20,100].includes(value?.range)?value.range:20,operation:['mixed','add','sub'].includes(value?.operation)?value.operation:'mixed'} } catch {return {range:20,operation:'mixed'}}
}
export function LessonsPage(){
  const [lesson,setLesson]=useState(loadLesson)
  const [saved,setSaved]=useState(false)
  const [error,setError]=useState('')
  const update=(key,value)=>{setLesson(l=>({...l,[key]:value}));setSaved(false)}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(lesson));setSaved(true);setError('');return true}catch{setError('Không lưu được cài đặt. Hãy cho phép lưu dữ liệu trong trình duyệt.');return false}}
  return <div className="page-shell lessons-shell"><header className="topbar"><a className="brand" href="/"><img src={assets.robot} alt=""/><span>Bé Học Toán Cùng <em>AI</em></span></a><a className="profile-pill" href="/">← Về trò chơi</a></header><main className="lesson-page"><div className="lesson-intro"><span>GÓC PHỤ HUYNH & GIÁO VIÊN</span><h1>Chuẩn bị bài học</h1><p>Chọn nội dung phù hợp, rồi cùng bé học toán bằng vận động.</p></div><section className="lesson-card"><h2>Phạm vi phép tính</h2><div className="lesson-choices">{[10,20,100].map(n=><button key={n} aria-pressed={lesson.range===n} onClick={()=>update('range',n)}><strong>Trong {n}</strong><small>Kết quả từ 0 đến {n}</small></button>)}</div><h2>Loại phép toán</h2><div className="lesson-choices">{[['mixed','Cộng & trừ','+ −'],['add','Phép cộng','+'],['sub','Phép trừ','−']].map(([value,label,symbol])=><button key={value} aria-pressed={lesson.operation===value} onClick={()=>update('operation',value)}><strong>{symbol} {label}</strong></button>)}</div><div className="lesson-summary"><h2>Mỗi lượt · 10 câu hỏi</h2><p>Ba tư thế khác nhau được chọn ngẫu nhiên ở mỗi câu. Giữ tư thế 1,25 giây để trả lời, sau đó bấm “Câu tiếp theo”. Mỗi câu đúng được 10 điểm.</p></div><div className="lesson-actions"><button className="secondary-btn" onClick={save}>Lưu cài đặt</button><button className="primary-btn" onClick={()=>{if(save())window.location.assign('/')}}>Bắt đầu chơi →</button></div><p role="status">{error|| (saved?'✓ Đã lưu cài đặt trên thiết bị này.':'Cài đặt được lưu trên trình duyệt của thiết bị này.')}</p></section></main><footer className="copyright">© {new Date().getFullYear()} Bông Trần. All rights reserved.</footer></div>
}
