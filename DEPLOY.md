<div align="center">
  <h1>📖 Panduan Deployment Djs-Series-AFK-VC</h1>
</div>

Proyek ini membutuhkan environment yang dapat menjalankan proses Node.js di latar belakang (background) terus-menerus karena Discord Bot menggunakan koneksi WebSocket yang harus tetap menyala.

Pilih salah satu metode deployment di bawah ini yang paling sesuai dengan kebutuhan Anda.

---

<details open>
<summary><h2>💻 1. Deployment Secara Lokal (PC/Laptop Sendiri)</h2></summary>

Ini adalah cara termudah dan gratis, sangat direkomendasikan jika Anda ingin membiarkan PC Anda menyala.

**Persyaratan:**
- [Node.js](https://nodejs.org/en/) (Versi 16 atau lebih baru direkomendasikan)
- Git (opsional, untuk *clone* repositori)

**Langkah-langkah:**
1. **Clone Repositori:**
   ```bash
   git clone https://github.com/namakuhans/Djs-Series-AFK-VC.git
   cd Djs-Series-AFK-VC
   ```
2. **Install Dependensi:**
   ```bash
   npm install
   ```
3. **Jalankan Aplikasi:**
   ```bash
   npm start
   ```
   *(Secara otomatis akan mengeksekusi `node src/index.js`)*
4. **Buka Dashboard:**
   Buka browser web Anda dan navigasi ke:
   👉 `http://localhost:3000`
5. **Atur Bot:**
   Masukkan Token Anda, cari Server dan Voice Channel langsung dari fitur Search Bar, lalu klik tombol "Start" dari Dashboard.

</details>

---

<details>
<summary><h2>☁️ 2. Deployment Server / VPS (Linux)</h2></summary>

Jika Anda memiliki VPS (Virtual Private Server), Anda dapat membiarkan bot ini menyala 24/7 di latar belakang. Sangat disarankan menggunakan *Process Manager* seperti `PM2`.

**Langkah-langkah:**
1. **Persiapan VPS:** Pastikan `node`, `npm`, dan `git` telah terinstal di server Linux Anda.
2. **Clone & Install:**
   ```bash
   git clone https://github.com/namakuhans/Djs-Series-AFK-VC.git
   cd Djs-Series-AFK-VC
   npm install
   ```
3. **Install PM2:**
   ```bash
   sudo npm install -g pm2
   ```
4. **Jalankan Aplikasi dengan PM2:**
   ```bash
   pm2 start src/index.js --name "afk-bot-dashboard"
   ```
5. **Simpan Startup PM2 (Opsional):**
   Agar bot menyala otomatis saat server direstart:
   ```bash
   pm2 startup
   pm2 save
   ```
6. **Akses Dashboard:**
   Buka browser dan arahkan ke `http://[IP_VPS_ANDA]:3000`. Pastikan port 3000 telah diizinkan (allow) di firewall VPS Anda.

</details>

---

<details>
<summary><h2>🌩️ 3. Deployment Cloud Hosting (PaaS)</h2></summary>

> [!WARNING]
> **PENTING: Jangan Gunakan Platform Serverless!**
>
> Proyek ini **TIDAK COCOK** untuk layanan *Serverless Functions* murni (seperti Vercel, Netlify, atau AWS Lambda) karena bot Discord memerlukan koneksi stateful (WebSocket) yang harus jalan 24/7. Platform Serverless akan mematikan proses (timeout) secara paksa setelah beberapa saat.

**Alternatif Platform Cloud (PaaS) yang Direkomendasikan:**
Platform yang menyediakan layanan *Background Worker* atau *Always-On Web Service* sangat dianjurkan. Contoh:
- **Render.com** *(Gunakan tipe Web Service, matikan opsi Sleep/Spin down atau gunakan tipe Background Worker)*
- **Railway.app**
- **Heroku** *(menggunakan worker dyno atau web dyno standar)*

**Panduan Umum untuk Render / Railway:**
1. Hubungkan akun GitHub Anda ke platform (Render/Railway).
2. Buat proyek baru (*New Web Service* / *New Project*).
3. Pilih repositori `Djs-Series-AFK-VC` ini.
4. Atur **Build Command**:
   ```bash
   npm install
   ```
5. Atur **Start Command**:
   ```bash
   npm start
   ```
6. Deploy! Platform tersebut biasanya akan memberikan Anda URL unik (misal: `https://afk-bot.onrender.com`).
7. Buka URL tersebut untuk mengakses Web Dashboard interaktif dan mulai hubungkan akun Anda.

</details>