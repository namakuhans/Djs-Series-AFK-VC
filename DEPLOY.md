# 📖 Panduan Deployment Djs-Series-AFK-VC

Proyek ini membutuhkan environment yang dapat menjalankan proses Node.js di latar belakang (background) terus-menerus karena Discord Bot menggunakan koneksi WebSocket yang harus tetap menyala.

Berikut adalah beberapa cara mendeploy aplikasi ini.

---

## 💻 1. Deployment Secara Lokal (PC/Laptop Sendiri)

Ini adalah cara termudah dan gratis, cocok jika Anda ingin membiarkan PC Anda menyala.

### Persyaratan:
- [Node.js](https://nodejs.org/en/) (Versi 16 atau lebih baru direkomendasikan)
- Git (opsional, untuk *clone* repositori)

### Langkah-langkah:
1. **Clone Repositori:**
   `git clone https://github.com/namakuhans/Djs-Series-AFK-VC.git`
   `cd Djs-Series-AFK-VC`
2. **Install Dependensi:**
   `npm install`
3. **Jalankan Aplikasi:**
   `node src/index.js`
4. **Buka Dashboard:**
   Buka browser web Anda dan navigasi ke:
   👉 `http://localhost:3000`
5. **Atur Bot:**
   Masukkan Token Anda, pilih Server dan Voice Channel langsung dari menu dropdown, lalu nyalakan bot dari Dashboard.

---

## ☁️ 2. Deployment Server / VPS (Linux)

Jika Anda memiliki VPS (Virtual Private Server), Anda dapat membiarkan bot ini menyala 24/7. Sangat disarankan menggunakan *Process Manager* seperti `PM2`.

1. **Persiapan VPS:** Pastikan `node`, `npm`, dan `git` telah terinstal di server Linux Anda.
2. **Clone & Install:**
   `git clone https://github.com/namakuhans/Djs-Series-AFK-VC.git`
   `cd Djs-Series-AFK-VC`
   `npm install`
3. **Install PM2:**
   `sudo npm install -g pm2`
4. **Jalankan Aplikasi dengan PM2:**
   `pm2 start src/index.js --name "afk-bot-dashboard"`
5. **Simpan Startup PM2 (Opsional):**
   Agar bot menyala otomatis saat server direstart.
   `pm2 startup`
   `pm2 save`
6. **Akses Dashboard:**
   Akses `http://[IP_VPS_ANDA]:3000` dari browser Anda.

---

## 🌩️ 3. Deployment "Serverless" atau Cloud Hosting (Perhatian)

**PENTING:** Proyek ini **TIDAK COCOK** untuk layanan *Serverless Functions* murni (seperti Vercel, Netlify, atau AWS Lambda) karena bot Discord memerlukan koneksi stateful (WebSocket) yang harus jalan 24/7. Platform Serverless akan mematikan proses (timeout) setelah beberapa detik/menit.

**Alternatif Platform Cloud (PaaS) yang Didukung:**
Platform yang menyediakan layanan *Background Worker* atau *Always-On Web Service* bisa digunakan. Contoh:
- **Render.com** (Gunakan tipe *Web Service*, matikan opsi *Sleep/Spin down* atau gunakan *Background Worker*)
- **Railway.app**
- **Heroku** (menggunakan *worker dyno* atau web dyno standar)

### Panduan Umum untuk PaaS (Render / Railway):
1. Hubungkan akun GitHub Anda ke platform (Render/Railway).
2. Buat proyek baru (*New Web Service* / *New Project*).
3. Pilih repositori `Djs-Series-AFK-VC`.
4. Atur **Build Command**:
   `npm install`
5. Atur **Start Command**:
   `node src/index.js`
6. Deploy! Platform tersebut biasanya akan memberikan Anda URL unik (misal: `https://afk-bot.onrender.com`).
7. Buka URL tersebut untuk mengakses Web Dashboard dan jalankan bot Anda.
