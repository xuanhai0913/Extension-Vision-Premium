# Vision Key Premium - AI Screen Assistant (Chrome Extension)

<div align="center">

![Vision Key Premium](https://img.shields.io/badge/Vision_Key-PREMIUM-gold?style=for-the-badge&logo=google-chrome&logoColor=white)
![Auto-Click](https://img.shields.io/badge/Auto--Click-Enabled-success?style=for-the-badge)

<a href="https://www.hailamdev.space/">
  <img src="https://res.cloudinary.com/dqdcqtu8m/image/upload/v1765001214/Logo_st3nmr.png" width="90%" alt="Vision Key Logo" />
</a>

### 🌐 Các nền tảng hỗ trợ:

| Nền tảng | Trạng thái | Link tải / Repo |
|:--------:|:----------:|:----------------|
|  **macOS Native** |  **Stable** | [**Vision-Key** (Swift)](https://github.com/xuanhai0913/Vision-Key) <br> [![Stars](https://img.shields.io/github/stars/xuanhai0913/Vision-Key?style=social)](https://github.com/xuanhai0913/Vision-Key) |
|  **Extension** |  **Stable** | [**Chrome/Edge/Brave**](https://github.com/xuanhai0913/Extension-Vision-Premium) <br> *(Repo hiện tại)* <br> [![Stars](https://img.shields.io/github/stars/xuanhai0913/Extension-Vision-Premium?style=social)](https://github.com/xuanhai0913/Extension-Vision-Premium) |
|  **Windows Native** | 🚧 **Dev** | *Đang phát triển...* |

---

[![Chrome](https://img.shields.io/badge/Chrome-100+-4285F4?style=flat-square&logo=google-chrome)](https://www.google.com/chrome/)
[![Edge](https://img.shields.io/badge/Edge-Supported-0078D7?style=flat-square&logo=microsoft-edge)](https://www.microsoft.com/edge)
[![Javascript](https://img.shields.io/badge/Javascript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-API-8E75B2?style=flat-square&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**Phiên bản PREMIUM với tính năng Auto-Click - Tự động chọn đáp án trên Quizizz/Wayground**

[Tính năng](#-tính-năng) • [Auto-Click](#-auto-click) • [Cài đặt](#-cài-đặt) • [Sử dụng](#-sử-dụng)

</div>

---

## ✨ Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| 🧩 **Browser Extension** | Hoạt động trên Chrome, Edge, Brave, Cốc Cốc |
| 📸 **Capture Selection** | Kéo chọn vùng bất kỳ trên trang web để chụp |
| 🖼️ **Full Screen** | Chụp toàn bộ màn hình hiển thị |
| 🤖 **AI Gemini** | Tích hợp model Gemini 2.0 Flash / 2.5 Pro mới nhất |
| ⌨️ **Phím tắt nhanh** | `Ctrl + Shift + .` (Win) hoặc `Cmd + Shift + .` (Mac) |
| 🎯 **2 chế độ trả lời** | Trắc nghiệm (chỉ đáp án) & Tự luận (giải thích chi tiết) |
| 🇻🇳 **Tiếng Việt** | Giao diện và kết quả hỗ trợ tiếng Việt hoàn toàn |
| 💾 **Lưu lịch sử** | Tự động lưu kết quả phân tích gần nhất |

## 🚀 Auto-Click (Premium)

> **Tính năng độc quyền của phiên bản Premium!**

| Tính năng | Mô tả |
|-----------|-------|
| ✅ **Tự động click đáp án** | AI phân tích xong → Tự động click đáp án đúng trên Quizizz/Wayground |
| ⏱️ **Delay tùy chỉnh** | Cài đặt thời gian delay trước khi click (0s - 0.8s) |
| 🔔 **Thông báo khi click** | Hiển thị notification khi đã tự động chọn đáp án |
| 🎯 **Multi-select support** | Hỗ trợ câu hỏi chọn nhiều đáp án |
| ✍️ **Auto-fill text** | Tự động điền đáp án cho câu hỏi tự luận ngắn |

## 📋 Yêu cầu

- Trình duyệt nhân Chromium (Chrome, Edge, Brave...)

## 🚀 Cài đặt

### Cài đặt thủ công (Load Unpacked)

1. **Clone hoặc tải source code:**
   ```bash
   git clone https://github.com/xuanhai0913/Extension-Vision-Premium.git
   ```

2. **Mở quản lý tiện ích:**
   - Chrome: Nhập \`chrome://extensions/\` vào thanh địa chỉ.
   - Edge: Nhập \`edge://extensions/\`.

3. **Bật chế độ Developer:**
   - Gạt switch **"Developer mode"** (Chế độ dành cho nhà phát triển) ở góc trên bên phải.

4. **Tải tiện ích:**
   - Click nút **"Load unpacked"** (Tải tiện ích đã giải nén).
   - Chọn thư mục \`Extension-Vision-Premium\` vừa tải về.

## 📖 Sử dụng

### 1. Cài đặt API Key

1. Click icon Vision Key trên thanh công cụ trình duyệt.
2. Nhấn nút **Settings** (biểu tượng bánh răng ⚙️).
3. Dán Gemini API Key vào ô trống.
4. Nhấn **"Lưu thay đổi"**.

### 2. Chụp và Phân tích

**Cách 1: Phím tắt (Nhanh nhất)**
- Nhấn \`Ctrl + Shift + .\` (Windows) hoặc \`Cmd + Shift + .\` (Mac).
- Con trỏ chuột sẽ chuyển thành dấu cộng \`+\`.
- Kéo chọn vùng câu hỏi trên màn hình → Thả ra.
- AI sẽ tự động phân tích và hiện kết quả.

**Cách 2: Menu Popup**
- Click icon Extension.
- Chọn **"Selection"** (Chụp vùng) hoặc **"Full Screen"** (Chụp toàn trang).

### 3. Xem kết quả

- **Trắc nghiệm:** Chỉ hiện đáp án (A, B, C...) để tra nhanh. Nhấn "Xem chi tiết" để xem giải thích.
- **Tự luận:** Hiển thị lời giải chi tiết từng bước.
- Bạn có thể **Copy** kết quả hoặc **Retake** để chụp câu khác.

## 🛠️ Phát triển

### Cấu trúc Project

```
Extension-Vision-Premium/
├── manifest.json        # Cấu hình Extension (V3)
├── background/          # Service workers (xử lý ảnh nền)
├── content/             # Script chạy trên trang web (vùng chọn)
├── popup/               # Giao diện chính (HTML/CSS/JS)
├── settings/            # Trang cài đặt riêng biệt
├── scripts/             # API service & xử lý ảnh
└── assets/              # Icons & Images
```

### Công nghệ sử dụng

| Component | Technology |
|-----------|------------|
| Core | Javascript (ES6+), HTML5, CSS3 |
| Framework | Manifest V3 (Chrome Extension Standard) |
| API | Google Generative AI (Gemini) |
| Styling | Modern CSS (Variables, Flexbox, Grid, Animations) |
| Build Tool | Không cần (Vanilla JS) |

## ❓ Xử lý lỗi

| Lỗi | Giải pháp |
|-----|-----------|
| Không thể click nút chụp | Reload lại trang web hiện tại (F5) |
| Lỗi "Receiving end does not exist" | Reload extension và reload trang web |
| Phím tắt không chạy | Kiểm tra \`chrome://extensions/shortcuts\` |
| API Error | Kiểm tra lại API Key hoặc đổi mạng (VPN) |

## 📄 License

MIT License

---

<div align="center">

## 👨‍💻 Tác giả

<div align="center">
  <a href="https://www.hailamdev.space/">
    <img src="https://res.cloudinary.com/dqdcqtu8m/image/upload/v1765001229/Icon_y7wrcf.png" width="40%" alt="Vision Key Demo" />
  </a>
</div>

**Nguyễn Xuân Hải**

[![GitHub](https://img.shields.io/badge/GitHub-xuanhai0913-181717?style=for-the-badge&logo=github)](https://github.com/xuanhai0913)

---

**© 2025 Nguyễn Xuân Hải (xuanhai0913). All rights reserved.**

Made with ❤️ in Vietnam 🇻🇳

⭐ Nếu thấy hữu ích, hãy star repo này nhé!

</div>
