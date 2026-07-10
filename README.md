<div align="center">

<img src="screenshots/01-login.png" alt="Cendekia SIAKAD" width="100%" />

# 🎓 Cendekia SIAKAD

### Sistem Informasi Akademik Perguruan Tinggi — Modern, Responsif, Installable

[![Live Demo](https://img.shields.io/badge/live%20demo-siakad.learningsystem.my.id-0b8378?style=for-the-badge&logo=cloudflare&logoColor=white)](https://siakad.learningsystem.my.id)

![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)
![Version](https://img.shields.io/badge/version-1.0.0-0b8378?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Vue](https://img.shields.io/badge/Vue-3.5-42b883?style=flat-square&logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

</div>

---

## 📖 Tentang

**Cendekia SIAKAD** adalah Sistem Informasi Akademik (SIAKAD) untuk perguruan tinggi yang menyatukan seluruh perjalanan akademik mahasiswa — **KRS, jadwal, nilai, transkrip, presensi, hingga keuangan UKT** — dalam satu portal yang cepat, modern, dan bisa dipasang sebagai aplikasi (PWA) di HP maupun laptop.

Dibangun dengan tiga peran pengguna (**Mahasiswa**, **Dosen/Dosen Wali**, **Admin/BAAK**), setiap alur mengikuti praktik SIAKAD nyata: pengisian KRS dengan validasi batas SKS berbasis IPS & cek prasyarat, persetujuan KRS oleh dosen wali, input komponen nilai dengan huruf mutu otomatis, hingga rekap kehadiran dan tagihan UKT.

> 🌐 **Live:** [siakad.learningsystem.my.id](https://siakad.learningsystem.my.id)

---

## ✨ Fitur Utama

- 🔐 **Multi-peran** — Mahasiswa, Dosen (termasuk Dosen Wali), dan Admin/BAAK dengan menu & dashboard berbeda.
- 📝 **KRS (Kartu Rencana Studi)** — ambil/hapus kelas, validasi batas SKS berbasis IPS, cek mata kuliah prasyarat, deteksi bentrok jadwal, alur *Draft → Diajukan → Disetujui/Ditolak*.
- 🧑‍🏫 **Perwalian Digital** — dosen wali memvalidasi KRS bimbingan (setujui/kembalikan + catatan); mahasiswa memantau pembimbing & status.
- 🗓️ **Jadwal Kuliah** — tabel mingguan (timetable) & tampilan daftar.
- 📚 **Kurikulum & Mata Kuliah** — katalog per semester, prasyarat, status kelulusan MK.
- 💯 **Nilai & KHS** — dosen input komponen (kehadiran/tugas/UTS/UAS → huruf mutu otomatis); mahasiswa melihat KHS + IPS per semester.
- 📜 **Transkrip Akademik** — transkrip resmi + IPK + predikat kelulusan, siap cetak/PDF.
- ✅ **Presensi** — rekap kehadiran mahasiswa & per-kelas untuk dosen.
- 💳 **Keuangan (UKT)** — tagihan, Virtual Account, riwayat & simulasi pembayaran.
- 📅 **Kalender Akademik** — grid bulanan + agenda berwarna per kategori.
- 🗂️ **Manajemen Data (Admin)** — konsol data mahasiswa, dosen, prodi, mata kuliah.
- ⌘ **Pencarian Global (⌘K / Ctrl+K)** — lompat cepat ke halaman, mata kuliah, atau mahasiswa.
- 🔔 **Notifikasi Kontekstual** — tagihan, status KRS, dan kehadiran otomatis dari data.
- 📱 **Progressive Web App** — installable di **iOS, Android, & Desktop**, mode standalone, dukungan offline.
- 🌗 **Mode Gelap & Terang** — desain teal institusional yang konsisten di kedua tema.

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| Framework | **Vue 3** (Composition API, `<script setup>`) |
| Build Tool | **Vite 7** |
| Styling | **Tailwind CSS v4** (design tokens via `@theme`) |
| State | **Pinia** |
| Routing | **Vue Router 4** |
| Ikon | **lucide-vue-next** |
| Font | Plus Jakarta Sans · Fraunces · JetBrains Mono (bundled lokal) |
| PWA | Web App Manifest + Service Worker (offline app-shell) |
| Deploy | **Cloudflare Pages** |

---

## 🚀 Instalasi & Menjalankan

```bash
# 1. Clone repositori
git clone https://github.com/Kstriabintang/cendekia-siakad.git
cd cendekia-siakad

# 2. Install dependency
npm install

# 3. Jalankan mode development
npm run dev          # buka http://localhost:5173

# 4. Build untuk produksi
npm run build        # hasil di folder dist/
npm run preview      # pratinjau hasil build (PWA aktif penuh)
```

> **Catatan data:** aplikasi berjalan penuh dengan *mock backend* (in-memory + `localStorage`) tanpa konfigurasi. Untuk menyambungkan **Supabase**, isi `.env` (lihat `.env.example`) dan buat `src/services/supabaseBackend.js` dengan nama method yang sama — tanpa mengubah komponen.

---

## 👤 Akun Demo

Mode demo — **sandi apa pun diterima**, dan tersedia tombol **masuk cepat** di halaman login.

| Role | Username | Password |
|------|----------|----------|
| Admin / BAAK | `admin@cendekia.ac.id` | `demo1234` |
| Dosen (Wali) | `bagus@cendekia.ac.id` | `demo1234` |
| Mahasiswa | `rangga@student.cendekia.ac.id` | `demo1234` |

---

## 📸 Tampilan

### Halaman Masuk
![Login](screenshots/01-login.png)

### Dashboard Mahasiswa
![Dashboard](screenshots/02-dashboard.png)

### Kartu Rencana Studi (KRS)
![KRS](screenshots/03-krs.png)

### Nilai & Kartu Hasil Studi (KHS)
![Nilai & KHS](screenshots/04-nilai-khs.png)

### Perwalian & Validasi KRS (Dosen)
![Perwalian](screenshots/05-perwalian-dosen.png)

### Manajemen Data (Admin)
![Manajemen](screenshots/06-manajemen-admin.png)

---

## 📲 Pasang sebagai Aplikasi (PWA)

- **Android / Desktop (Chrome/Edge):** klik banner **"Instal"** atau menu ⋮ → *Install app*.
- **iOS (Safari):** tombol **Bagikan** → **Tambah ke Layar Utama**.

Setelah dipasang, aplikasi berjalan **standalone** (tanpa address bar), memiliki ikon sendiri, dan mendukung penggunaan **offline** untuk kerangka aplikasi.

---

## 📄 Lisensi

Dirilis di bawah lisensi **MIT** — lihat berkas [LICENSE](LICENSE).

<div align="center">

Dikembangkan oleh **Ksatria Bintang Samudra** · © 2026

</div>
