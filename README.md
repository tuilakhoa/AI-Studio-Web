# ⚡ AI Studio Deployment Guide (VPS + aaPanel + Nginx + PM2)

Triển khai **AI Studio** chính thức lên **VPS (aaPanel)** với **Node.js 22.21.1 (hoặc bất kỳ phiên bản khác)**, **PM2**, và **Nginx**.  
Chạy online 24/7 — nhanh, ổn định, sẵn sàng cho môi trường sản phẩm thực tế.

---

## 🌍 Giới thiệu

**AI Studio** là ứng dụng web AI tương tác sử dụng **Google Gemini API**.  
Tài liệu này hướng dẫn bạn **triển khai trực tiếp trên VPS**, không cần chạy thử local (`npm run dev`).

---

## ⚙️ Yêu cầu hệ thống

- VPS đã cài **aaPanel**
- **Node.js 22.21.1** (qua module PM 2 Manager)
- **PM 2** để ứng dụng chạy nền và cài Node.js
- **Nginx** làm web server
- Có **tên miền hoạt động** (ví dụ: `your-domain`)
- Có **GEMINI_API_KEY** (API key hợp lệ của Google Gemini)

---

## 🚀 Cài đặt và cấu hình

### 1️⃣ Clone source về thư mục web

Trong aaPanel, thư mục chứa website nằm tại:  
`/www/wwwroot/your-domain`

Chạy các lệnh sau để tải mã nguồn:

```bash
cd /www/wwwroot
sudo git clone https://github.com/tuilakhoa/AI-Studio-Web.git your-domain
cd /www/wwwroot/your-domain
````

🧠 **Giải thích:**

  * `/www/wwwroot/` là nơi aaPanel lưu toàn bộ website.
  * `your-domain` là thư mục tương ứng với tên miền thật của bạn (vd: truyen360.io.vn).
  * Sau khi chạy xong, toàn bộ mã nguồn sẽ nằm trong `/www/wwwroot/your-domain`.

### 2️⃣ Cài đặt dependencies

Sau khi đã ở trong thư mục project (`/www/wwwroot/your-domain`), chạy lệnh:

```bash
npm install
```

Lệnh này sẽ tải toàn bộ package cần thiết từ `package.json`.

⚠️ *Quá trình này có thể mất vài phút tùy cấu hình VPS.*

### 3️⃣ Cấu hình biến môi trường .env

Tạo file `.env` trong thư mục `/www/wwwroot/your-domain`, rồi thêm:

```ini
GEMINI_API_KEY=your_api_key_here
```

🔑 Thay `your_api_key_here` bằng key Gemini thật của bạn.


### 4️⃣ Build project

Đây là bước tạo bản chạy thật (`dist`) cho website.
Nếu bạn đang dùng `nvm`, mỗi lần build cần nạp lại môi trường và chọn đúng phiên bản Node.js trước:

```bash
source ~/.bashrc
nvm use 22.21.1
cd /www/wwwroot/your-domain
npm run build
```

✅ **Giải thích:**

  * `source ~/.bashrc` → nạp lại cấu hình nvm.
  * `nvm use 22.21.1` → chọn Node.js 22.21.1.
  * `npm run build` → tạo thư mục `dist/` chứa bản production sẵn sàng deploy.

⚠️ *Nếu sửa code mà web chưa cập nhật, chỉ cần chạy lại 3 lệnh này.*

### 5️⃣ Chạy ứng dụng bằng PM2

Sau khi build xong, chạy:

```bash
pm2 start npm --name "ai-studio" -- run dev
pm2 save
pm2 startup
```

✅ PM2 sẽ:

  * Giữ ứng dụng chạy nền (ngay cả khi bạn đóng SSH).
  * Tự khởi động lại khi VPS reboot.

### 6️⃣ Cấu hình Nginx trong aaPanel

Mở **aaPanel → Website → your-domain → Config**,

rồi thay nội dung block `server` bằng:

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name your-domain;

    # --- Cấu hình đường dẫn ---
    index index.html index.htm;
    root /www/wwwroot/your-domain/dist;

    include /www/server/panel/vhost/nginx/extension/your-domain/*.conf;

    # --- SSL ---
    ssl_certificate    /www/server/panel/vhost/cert/your-domain/fullchain.pem;
    ssl_certificate_key    /www/server/panel/vhost/cert/your-domain/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2;
    ssl_ciphers EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:!MD5;
    ssl_prefer_server_ciphers on;
    add_header Strict-Transport-Security "max-age=31536000";
    error_page 497 https://$host$request_uri;

    # --- SPA rewrite ---
    location / {
        try_files $uri $uri/ /index.html;
    }

    # --- Cache ---
    location ~ .*\.(gif|jpg|jpeg|png|bmp|swf)$ {
        expires 30d;
        error_log off;
        access_log off;
    }

    location ~ .*\.(js|css)?$ {
        expires 12h;
        error_log off;
        access_log off;
    }

    # --- Bảo mật ---
    location ~ ^/(\.env|\.git|\.htaccess|README|LICENSE) {
        return 404;
    }

    location ~ \.well-known {
        allow all;
    }

    access_log /www/wwwlogs/your-domain.log;
    error_log /www/wwwlogs/your-domain.error.log;
}
```

⚠️ *Thay tất cả `your-domain` bằng tên miền thật (vd: truyen360.io.vn).*

### 7️⃣ Kiểm tra và reload Nginx

```bash
nginx -t
nginx -s reload
```

### 8️⃣ Cập nhật code khi có thay đổi

Khi bạn chỉnh sửa code hoặc cập nhật repo:

```bash
source ~/.bashrc
nvm use 22.21.1
cd /www/wwwroot/your-domain
git pull
npm run build
pm2 restart ai-studio
```

### 9️⃣ Kiểm tra trạng thái PM2

```bash
pm2 list
pm2 logs ai-studio
```

-----

### ✅ Hoàn tất

Bây giờ mở trình duyệt và truy cập:

`https://your-domain`

Nếu thấy giao diện AI Studio xuất hiện, nghĩa là triển khai thành công 🎉

-----

© 2025 — AI Studio VPS Deployment Guide

```
```
