# Bé Học Toán Cùng AI

Website học toán cho học sinh tiểu học: React + Vite + Tailwind CSS 4 + MediaPipe Pose Landmarker. Tất cả thao tác nhận diện khung hình chạy tại thiết bị người dùng, không gửi/lưu video lên máy chủ ứng dụng.

## Chạy dự án

Yêu cầu: Node.js 20.19+ hoặc 22.12+ và npm.

```bash
npm install
npm run dev
```

Mở URL mà Vite in ra (thường là http://localhost:5173). Build bản phát hành:

```bash
npm run build
npm run preview
```

Deploy thư mục `dist/` lên dịch vụ hosting static có HTTPS (Cloudflare Pages, Vercel, Netlify...). Camera yêu cầu `https://` trên thiết bị khác, hoặc `localhost` khi chạy trên máy phát triển.

## Cách dùng

1. Chọn phạm vi 10/20/100 và cộng/trừ ở trang **Bài học** (`/lessons`).
2. Bấm **Bật camera**, chấp thuận quyền camera; lần đầu mở cần tải model MediaPipe và WASM qua mạng Internet.
3. Mỗi câu chọn ngẫu nhiên ba tư thế khác nhau từ năm tư thế: giơ hai tay, tay bên mặt, khoanh tay, giơ một tay, chào cờ. Đứng đủ xa để thấy mặt, vai và cả hai cánh tay. Giữ tư thế khoảng **1,25 giây** để chọn đáp án.
   - **Giơ hai tay:** hai cổ tay cao hơn vai.
   - **Khoanh tay:** hai bàn tay hướng về vai đối diện, trước ngực.
   - **Chào cờ:** một tay sát thái dương, tay còn lại hạ xuống.
4. Thả tay về trạng thái bình thường giữa hai câu để nhận diện câu kế tiếp.
5. Nếu AI không hoạt động hoặc học sinh cần hỗ trợ, tích **Cho phép bấm chọn đáp án (dự phòng)** và nhấn trực tiếp vào một trong 3 thẻ.
6. Mỗi lượt 10 câu, đúng +10 điểm; bấm **Câu tiếp theo** sau khi trả lời.

## Hạn chế kỹ thuật

- Nhận diện tư thế là các quy tắc hình học dựa trên 33 mốc cơ thể của MediaPipe, không phải bộ phân loại các động tác đã được huấn luyện riêng. Cần thử nghiệm/thay đổi ngưỡng trên thiết bị thật trước khi đưa vào lớp học.
- Trình duyệt phải hỗ trợ WebAssembly, camera và HTTPS. WASM được đóng gói từ dependency MediaPipe cùng phiên bản. Model lấy từ Google, nên cần Internet khi tải ban đầu.
- Không thu âm, không lưu khung hình, không cần key OpenAI, không có tài khoản hay backend.
- Giọng nói tiếng Việt bằng SpeechSynthesis tùy trình duyệt/hệ điều hành. Âm thanh beep đúng/sai được tạo trực tiếp bằng Web Audio.
- Đây là MVP; trên máy cấu hình thấp, suy luận đồng bộ có thể giảm FPS. Có thể chuyển inference sang Web Worker khi tối ưu sản phẩm thực tế.

## Cấu trúc

- `src/main.jsx`: UI, game 10 câu, camera, MediaPipe, fullscreen.
- `src/math.js`: sinh phép tính và 3 đáp án trong phạm vi.
- `src/pose.js`: ba quy tắc nhận diện cử chỉ.
- `src/sound.js`: nhạc đúng/sai và tiếng nói.
- `src/PoseArt.jsx`: hình minh họa tư thế dạng SVG.
- `src/style.css`: Tailwind 4 và CSS giao diện responsive.

## Trang và bố cục

- `/`: màn hình chơi, camera, 3 tư thế ngẫu nhiên duy nhất mỗi câu và nút chuyển câu.
- `/lessons`: chọn phạm vi/phép toán, lưu trên localStorage và bắt đầu lượt chơi.
- Hosting cần cấu hình SPA fallback về `index.html` cho URL `/lessons`.
- Bố cục ngang cho laptop và iPad landscape; xếp camera trên đáp án trên iPad portrait và điện thoại.
- Ảnh gốc giữ trong `src/assets/images/`; bản giảm kích thước nằm trong `optimized/`.
