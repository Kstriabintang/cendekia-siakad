// Seed data for Cendekia SIAKAD (Sistem Informasi Akademik) — Universitas Cendekia.
// Domain modeled on real PT SIAKAD: Fakultas→Prodi→Kurikulum→Mata Kuliah,
// Tahun Akademik aktif, KRS (Draft→Diajukan→Disetujui/Ditolak) dengan batas SKS
// berbasis IPS, Nilai berkomponen (kehadiran/tugas/uts/uas) → KHS (IPS/IPK),
// tagihan UKT, kalender akademik, presensi per-pertemuan.

// ── Tahun Akademik ─────────────────────────────────────────────────────────
export const tahunAjaran = [
  { id: 'ta-20251', kode: '2025/2026-1', label: '2025/2026 Ganjil', tipe: 'Ganjil', mulai: '2025-09-01', selesai: '2026-01-31', aktif: true, krsBuka: true },
  { id: 'ta-20242', kode: '2024/2025-2', label: '2024/2025 Genap', tipe: 'Genap', mulai: '2025-02-01', selesai: '2025-07-31', aktif: false, krsBuka: false },
]

// ── Fakultas & Program Studi ───────────────────────────────────────────────
export const fakultas = [
  { id: 'ftik', nama: 'Fakultas Teknologi Informasi & Komputer', kode: 'FTIK', dekan: 'Prof. Dr. Ir. Hendra Wijaya, M.Sc.', akreditasi: 'Unggul' },
]

export const prodi = [
  { id: 'ti', nama: 'Teknik Informatika', kode: 'TI', jenjang: 'S1', gelar: 'S.Kom.', fakultasId: 'ftik', kaprodi: 'Dr. Bagus Prakoso, M.T.', akreditasi: 'Unggul', totalSksLulus: 144 },
  { id: 'si', nama: 'Sistem Informasi', kode: 'SI', jenjang: 'S1', gelar: 'S.Kom.', fakultasId: 'ftik', kaprodi: 'Dr. Larasati Putri, M.Kom.', akreditasi: 'A', totalSksLulus: 144 },
]

// ── Pengguna ───────────────────────────────────────────────────────────────
export const users = [
  // Admin / BAAK
  {
    id: 'a1', role: 'admin', name: 'Rina Kusuma, S.Kom.', email: 'admin@cendekia.ac.id',
    jabatan: 'Staf Akademik (BAAK)', unit: 'Biro Administrasi Akademik & Kemahasiswaan',
    hp: '0812-1000-2001', gender: 'P',
  },
  // Dosen
  {
    id: 'd1', role: 'dosen', name: 'Dr. Bagus Prakoso, M.T.', gelarDepan: 'Dr.', gelarBelakang: 'M.T.',
    email: 'bagus@cendekia.ac.id', nidn: '0512078801', prodiId: 'ti', jabatanAkademik: 'Lektor Kepala',
    isWali: true, kaprodi: true, hp: '0812-2000-3001', gender: 'L', bidang: 'Rekayasa Perangkat Lunak',
  },
  {
    id: 'd2', role: 'dosen', name: 'Maya Anggraini, S.Kom., M.Cs.', gelarDepan: '', gelarBelakang: 'M.Cs.',
    email: 'maya@cendekia.ac.id', nidn: '0208129002', prodiId: 'ti', jabatanAkademik: 'Lektor',
    isWali: true, hp: '0812-2000-3002', gender: 'P', bidang: 'Data Mining & Kecerdasan Buatan',
  },
  {
    id: 'd3', role: 'dosen', name: 'Fajar Nugroho, M.Kom.', gelarDepan: '', gelarBelakang: 'M.Kom.',
    email: 'fajar@cendekia.ac.id', nidn: '0311018703', prodiId: 'ti', jabatanAkademik: 'Asisten Ahli',
    isWali: false, hp: '0812-2000-3003', gender: 'L', bidang: 'Jaringan & Keamanan',
  },
  {
    id: 'd4', role: 'dosen', name: 'Sinta Dewi, S.T., M.T.', gelarDepan: '', gelarBelakang: 'M.T.',
    email: 'sinta@cendekia.ac.id', nidn: '0725059104', prodiId: 'ti', jabatanAkademik: 'Lektor',
    isWali: false, hp: '0812-2000-3004', gender: 'P', bidang: 'Grafika & Multimedia',
  },
  // Mahasiswa (demo utama = Rangga)
  {
    id: 'm1', role: 'mahasiswa', name: 'Rangga Saputra', email: 'rangga@student.cendekia.ac.id',
    nim: '23.11.5021', prodiId: 'ti', angkatan: 2023, semester: 5, statusAkademik: 'Aktif',
    dosenWaliId: 'd1', ipk: 3.74, sksTempuh: 92, sksLulus: 72,
    ukt: { golongan: 'IV', nominal: 6500000 },
    tempatLahir: 'Yogyakarta', tglLahir: '2005-03-14', gender: 'L', agama: 'Islam',
    hp: '0857-4321-9987', alamat: 'Jl. Kaliurang KM 7 No. 21, Sleman, DIY',
    nik: '3404xxxxxxxx0001', ayah: 'Bambang Saputra', ibu: 'Sri Wahyuni', asalSekolah: 'SMAN 3 Yogyakarta',
  },
  {
    id: 'm2', role: 'mahasiswa', name: 'Dinda Permata', email: 'dinda@student.cendekia.ac.id',
    nim: '23.11.5044', prodiId: 'ti', angkatan: 2023, semester: 5, statusAkademik: 'Aktif',
    dosenWaliId: 'd1', ipk: 3.78, sksTempuh: 91, sksLulus: 91,
    ukt: { golongan: 'III', nominal: 5000000 },
    tempatLahir: 'Semarang', tglLahir: '2005-07-02', gender: 'P', agama: 'Islam',
    hp: '0857-4321-1122', alamat: 'Jl. Melati No. 8, Depok, Sleman', asalSekolah: 'SMAN 1 Semarang',
  },
  {
    id: 'm3', role: 'mahasiswa', name: 'Yoga Pratama', email: 'yoga@student.cendekia.ac.id',
    nim: '23.11.5008', prodiId: 'ti', angkatan: 2023, semester: 5, statusAkademik: 'Aktif',
    dosenWaliId: 'd2', ipk: 3.21, sksTempuh: 88, sksLulus: 85,
    ukt: { golongan: 'V', nominal: 8000000 },
    tempatLahir: 'Solo', tglLahir: '2004-11-19', gender: 'L', agama: 'Islam',
    hp: '0857-4321-3344', alamat: 'Jl. Kenanga No. 3, Klaten', asalSekolah: 'SMKN 2 Solo',
  },
  {
    id: 'm4', role: 'mahasiswa', name: 'Salsabila Nur', email: 'salsa@student.cendekia.ac.id',
    nim: '23.11.5031', prodiId: 'ti', angkatan: 2023, semester: 5, statusAkademik: 'Aktif',
    dosenWaliId: 'd2', ipk: 3.55, sksTempuh: 91, sksLulus: 91,
    ukt: { golongan: 'IV', nominal: 6500000 },
    tempatLahir: 'Bandung', tglLahir: '2005-01-25', gender: 'P', agama: 'Islam',
    hp: '0857-4321-5566', alamat: 'Jl. Anggrek No. 12, Sleman', asalSekolah: 'SMAN 5 Bandung',
  },
]

// ── Kurikulum: Mata Kuliah (prodi TI, kurikulum 2023) ─────────────────────
// jenis: Wajib | Pilihan. prasyarat = array kode MK.
export const mataKuliah = [
  // Semester 1
  { kode: 'TI1101', nama: 'Kalkulus I', sks: 3, semester: 1, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  { kode: 'TI1102', nama: 'Algoritma & Pemrograman', sks: 4, semester: 1, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  { kode: 'TI1103', nama: 'Pengantar Teknologi Informasi', sks: 2, semester: 1, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  { kode: 'TI1104', nama: 'Logika Informatika', sks: 3, semester: 1, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  { kode: 'UN1101', nama: 'Bahasa Inggris', sks: 2, semester: 1, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  { kode: 'UN1102', nama: 'Pendidikan Agama', sks: 2, semester: 1, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  // Semester 2
  { kode: 'TI1201', nama: 'Kalkulus II', sks: 3, semester: 2, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI1101'] },
  { kode: 'TI1202', nama: 'Struktur Data', sks: 4, semester: 2, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI1102'] },
  { kode: 'TI1203', nama: 'Sistem Digital', sks: 3, semester: 2, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  { kode: 'TI1204', nama: 'Statistika & Probabilitas', sks: 3, semester: 2, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  { kode: 'UN1201', nama: 'Pancasila', sks: 2, semester: 2, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  { kode: 'TI1205', nama: 'Fisika Dasar', sks: 3, semester: 2, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  // Semester 3
  { kode: 'TI2301', nama: 'Basis Data', sks: 4, semester: 3, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI1202'] },
  { kode: 'TI2302', nama: 'Pemrograman Berorientasi Objek', sks: 4, semester: 3, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI1202'] },
  { kode: 'TI2303', nama: 'Arsitektur & Organisasi Komputer', sks: 3, semester: 3, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI1203'] },
  { kode: 'TI2304', nama: 'Matematika Diskrit', sks: 3, semester: 3, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI1104'] },
  { kode: 'TI2305', nama: 'Jaringan Komputer', sks: 3, semester: 3, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  { kode: 'UN2301', nama: 'Kewarganegaraan', sks: 2, semester: 3, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  // Semester 4
  { kode: 'TI2401', nama: 'Sistem Operasi', sks: 3, semester: 4, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI2303'] },
  { kode: 'TI2402', nama: 'Pemrograman Web', sks: 4, semester: 4, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI2302'] },
  { kode: 'TI2403', nama: 'Analisis & Perancangan Sistem', sks: 3, semester: 4, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI2301'] },
  { kode: 'TI2404', nama: 'Interaksi Manusia & Komputer', sks: 3, semester: 4, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  { kode: 'TI2405', nama: 'Kecerdasan Buatan', sks: 3, semester: 4, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI2304'] },
  { kode: 'TI2406', nama: 'Metode Numerik', sks: 3, semester: 4, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI1201'] },
  // Semester 5 (berjalan)
  { kode: 'TI3501', nama: 'Rekayasa Perangkat Lunak', sks: 4, semester: 5, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI2403'] },
  { kode: 'TI3502', nama: 'Pemrograman Mobile', sks: 3, semester: 5, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI2402'] },
  { kode: 'TI3503', nama: 'Data Mining', sks: 3, semester: 5, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI2405'] },
  { kode: 'TI3504', nama: 'Keamanan Informasi', sks: 3, semester: 5, jenis: 'Wajib', prodiId: 'ti', prasyarat: ['TI2305'] },
  { kode: 'TI3505', nama: 'Grafika Komputer', sks: 3, semester: 5, jenis: 'Pilihan', prodiId: 'ti', prasyarat: ['TI2406'] },
  { kode: 'TI3506', nama: 'Manajemen Proyek TI', sks: 2, semester: 5, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  { kode: 'TI3507', nama: 'Metodologi Penelitian', sks: 2, semester: 5, jenis: 'Wajib', prodiId: 'ti', prasyarat: [] },
  { kode: 'TI3508', nama: 'Komputasi Awan', sks: 3, semester: 5, jenis: 'Pilihan', prodiId: 'ti', prasyarat: ['TI2305'] },
]

// ── Kelas yang ditawarkan (tahun aktif 2025/2026 Ganjil) ──────────────────
// Untuk MK semester 5. Tiap kelas: kelas paralel (A/B), dosen, jadwal, ruang.
export const kelas = [
  { id: 'k-rpl-a', mkKode: 'TI3501', kelas: 'A', dosenId: 'd1', hari: 'Senin', jamMulai: '07:30', jamSelesai: '10:00', ruang: 'GKB 3.1', kuota: 40, terisi: 38, takaId: 'ta-20251' },
  { id: 'k-mob-a', mkKode: 'TI3502', kelas: 'A', dosenId: 'd3', hari: 'Selasa', jamMulai: '10:15', jamSelesai: '12:30', ruang: 'Lab Mobile', kuota: 35, terisi: 33, takaId: 'ta-20251' },
  { id: 'k-dm-a', mkKode: 'TI3503', kelas: 'A', dosenId: 'd2', hari: 'Rabu', jamMulai: '13:00', jamSelesai: '15:30', ruang: 'GKB 3.4', kuota: 40, terisi: 36, takaId: 'ta-20251' },
  { id: 'k-sec-a', mkKode: 'TI3504', kelas: 'A', dosenId: 'd3', hari: 'Kamis', jamMulai: '07:30', jamSelesai: '10:00', ruang: 'GKB 2.2', kuota: 40, terisi: 39, takaId: 'ta-20251' },
  { id: 'k-graf-a', mkKode: 'TI3505', kelas: 'A', dosenId: 'd4', hari: 'Jumat', jamMulai: '13:00', jamSelesai: '15:30', ruang: 'Lab Grafika', kuota: 30, terisi: 22, takaId: 'ta-20251' },
  { id: 'k-mpti-a', mkKode: 'TI3506', kelas: 'A', dosenId: 'd4', hari: 'Selasa', jamMulai: '15:45', jamSelesai: '17:30', ruang: 'GKB 2.5', kuota: 45, terisi: 41, takaId: 'ta-20251' },
  { id: 'k-metpen-a', mkKode: 'TI3507', kelas: 'A', dosenId: 'd1', hari: 'Kamis', jamMulai: '15:45', jamSelesai: '17:30', ruang: 'GKB 3.3', kuota: 45, terisi: 40, takaId: 'ta-20251' },
  // kelas alternatif / pilihan yang belum diambil Rangga (untuk uji tambah KRS)
  { id: 'k-cloud-a', mkKode: 'TI3508', kelas: 'A', dosenId: 'd3', hari: 'Rabu', jamMulai: '07:30', jamSelesai: '10:00', ruang: 'Lab Jaringan', kuota: 30, terisi: 18, takaId: 'ta-20251' },
  { id: 'k-mob-b', mkKode: 'TI3502', kelas: 'B', dosenId: 'd3', hari: 'Jumat', jamMulai: '07:30', jamSelesai: '09:45', ruang: 'Lab Mobile', kuota: 35, terisi: 30, takaId: 'ta-20251' },
]

// ── KRS ───────────────────────────────────────────────────────────────────
// status: Draft | Diajukan | Disetujui | Ditolak. batasSks berbasis IPS lalu.
export const krs = [
  {
    id: 'krs-m1', mahasiswaId: 'm1', takaId: 'ta-20251', semester: 5,
    status: 'Disetujui', dosenWaliId: 'd1', diajukanAt: '2025-08-20 09:12', disetujuiAt: '2025-08-21 14:03',
    ipsSebelumnya: 3.71, batasSks: 24, catatan: 'Komposisi seimbang. Pertahankan IP, fokus proyek RPL.',
    kelasIds: ['k-rpl-a', 'k-mob-a', 'k-dm-a', 'k-sec-a', 'k-graf-a', 'k-mpti-a', 'k-metpen-a'],
  },
  {
    id: 'krs-m2', mahasiswaId: 'm2', takaId: 'ta-20251', semester: 5,
    status: 'Diajukan', dosenWaliId: 'd1', diajukanAt: '2025-08-22 20:41', disetujuiAt: null,
    ipsSebelumnya: 3.85, batasSks: 24, catatan: '',
    kelasIds: ['k-rpl-a', 'k-mob-b', 'k-dm-a', 'k-sec-a', 'k-graf-a', 'k-mpti-a', 'k-metpen-a', 'k-cloud-a'],
  },
  {
    id: 'krs-m3', mahasiswaId: 'm3', takaId: 'ta-20251', semester: 5,
    status: 'Disetujui', dosenWaliId: 'd2', diajukanAt: '2025-08-19 11:20', disetujuiAt: '2025-08-20 09:30',
    ipsSebelumnya: 3.10, batasSks: 22, catatan: 'Perhatikan MK dengan nilai C. Manfaatkan jam konsultasi.',
    kelasIds: ['k-rpl-a', 'k-mob-a', 'k-dm-a', 'k-sec-a', 'k-mpti-a', 'k-metpen-a'],
  },
  {
    id: 'krs-m4', mahasiswaId: 'm4', takaId: 'ta-20251', semester: 5,
    status: 'Disetujui', dosenWaliId: 'd2', diajukanAt: '2025-08-19 08:05', disetujuiAt: '2025-08-19 16:12',
    ipsSebelumnya: 3.60, batasSks: 24, catatan: 'Baik. Lanjutkan.',
    kelasIds: ['k-rpl-a', 'k-mob-a', 'k-dm-a', 'k-sec-a', 'k-graf-a', 'k-mpti-a', 'k-metpen-a'],
  },
]

// ── Nilai (riwayat + berjalan) ─────────────────────────────────────────────
// Komponen: kehadiran/tugas/uts/uas (bobot 10/20/30/40). angka final → huruf/mutu di backend.
// status: final | berjalan. Untuk final, `angka` sudah diisi.
const F = (kode, angka, taka, sem) => ({ mkKode: kode, angka, takaId: taka, semester: sem, status: 'final' })
export const nilai = {
  // Rangga (m1) — riwayat sem 1..4
  m1: [
    // Semester 1 (2023/2024 Ganjil)
    F('TI1101', 82, 'ta-20231', 1), F('TI1102', 90, 'ta-20231', 1), F('TI1103', 88, 'ta-20231', 1),
    F('TI1104', 78, 'ta-20231', 1), F('UN1101', 85, 'ta-20231', 1), F('UN1102', 86, 'ta-20231', 1),
    // Semester 2
    F('TI1201', 75, 'ta-20232', 2), F('TI1202', 88, 'ta-20232', 2), F('TI1203', 80, 'ta-20232', 2),
    F('TI1204', 79, 'ta-20232', 2), F('UN1201', 84, 'ta-20232', 2), F('TI1205', 72, 'ta-20232', 2),
    // Semester 3
    F('TI2301', 91, 'ta-20241', 3), F('TI2302', 89, 'ta-20241', 3), F('TI2303', 77, 'ta-20241', 3),
    F('TI2304', 81, 'ta-20241', 3), F('TI2305', 86, 'ta-20241', 3), F('UN2301', 88, 'ta-20241', 3),
    // Semester 4
    F('TI2401', 83, 'ta-20242', 4), F('TI2402', 92, 'ta-20242', 4), F('TI2403', 87, 'ta-20242', 4),
    F('TI2404', 90, 'ta-20242', 4), F('TI2405', 84, 'ta-20242', 4), F('TI2406', 76, 'ta-20242', 4),
    // Semester 5 (berjalan) — komponen sebagian; uas belum
    { mkKode: 'TI3501', takaId: 'ta-20251', semester: 5, status: 'berjalan', komponen: { kehadiran: 95, tugas: 88, uts: 85, uas: null } },
    { mkKode: 'TI3502', takaId: 'ta-20251', semester: 5, status: 'berjalan', komponen: { kehadiran: 90, tugas: 82, uts: 80, uas: null } },
    { mkKode: 'TI3503', takaId: 'ta-20251', semester: 5, status: 'berjalan', komponen: { kehadiran: 100, tugas: 90, uts: 78, uas: null } },
    { mkKode: 'TI3504', takaId: 'ta-20251', semester: 5, status: 'berjalan', komponen: { kehadiran: 88, tugas: 85, uts: 82, uas: null } },
    { mkKode: 'TI3505', takaId: 'ta-20251', semester: 5, status: 'berjalan', komponen: { kehadiran: 92, tugas: 91, uts: 88, uas: null } },
    { mkKode: 'TI3506', takaId: 'ta-20251', semester: 5, status: 'berjalan', komponen: { kehadiran: 96, tugas: 87, uts: 90, uas: null } },
    { mkKode: 'TI3507', takaId: 'ta-20251', semester: 5, status: 'berjalan', komponen: { kehadiran: 100, tugas: 84, uts: null, uas: null } },
  ],
}

// Tahun akademik historis (untuk label transkrip)
export const takaHist = {
  'ta-20231': '2023/2024 Ganjil', 'ta-20232': '2023/2024 Genap',
  'ta-20241': '2024/2025 Ganjil', 'ta-20242': '2024/2025 Genap', 'ta-20251': '2025/2026 Ganjil',
}

// ── Keuangan: Tagihan UKT per semester ────────────────────────────────────
export const tagihan = [
  { id: 't-m1-5', mahasiswaId: 'm1', takaId: 'ta-20251', semester: 5, jenis: 'UKT Semester 5', nominal: 6500000, status: 'Belum', jatuhTempo: '2025-08-31', va: '8801 2311 5021 05', metode: null, tglBayar: null },
  { id: 't-m1-4', mahasiswaId: 'm1', takaId: 'ta-20242', semester: 4, jenis: 'UKT Semester 4', nominal: 6500000, status: 'Lunas', jatuhTempo: '2025-01-31', va: '8801 2311 5021 04', metode: 'Virtual Account BNI', tglBayar: '2025-01-18 10:22' },
  { id: 't-m1-3', mahasiswaId: 'm1', takaId: 'ta-20241', semester: 3, jenis: 'UKT Semester 3', nominal: 6500000, status: 'Lunas', jatuhTempo: '2024-08-31', va: '8801 2311 5021 03', metode: 'Virtual Account BNI', tglBayar: '2024-08-25 08:40' },
  { id: 't-m1-2', mahasiswaId: 'm1', takaId: 'ta-20232', semester: 2, jenis: 'UKT Semester 2', nominal: 6500000, status: 'Lunas', jatuhTempo: '2024-01-31', va: '8801 2311 5021 02', metode: 'Teller Bank', tglBayar: '2024-01-20 14:05' },
  { id: 't-m1-1', mahasiswaId: 'm1', takaId: 'ta-20231', semester: 1, jenis: 'UKT Semester 1 + Registrasi', nominal: 8500000, status: 'Lunas', jatuhTempo: '2023-08-31', va: '8801 2311 5021 01', metode: 'Virtual Account BNI', tglBayar: '2023-08-15 09:15' },
]

// ── Kalender Akademik (2025/2026 Ganjil) ──────────────────────────────────
export const kalender = [
  { id: 'ka1', judul: 'Pengisian & Validasi KRS', mulai: '2025-08-18', selesai: '2025-08-25', kategori: 'Registrasi', warna: 'brand' },
  { id: 'ka2', judul: 'Awal Perkuliahan Semester Ganjil', mulai: '2025-09-01', selesai: '2025-09-01', kategori: 'Perkuliahan', warna: 'success' },
  { id: 'ka3', judul: 'Batas Akhir Pembayaran UKT', mulai: '2025-08-31', selesai: '2025-08-31', kategori: 'Keuangan', warna: 'danger' },
  { id: 'ka4', judul: 'Ujian Tengah Semester (UTS)', mulai: '2025-10-27', selesai: '2025-11-01', kategori: 'Ujian', warna: 'warning' },
  { id: 'ka5', judul: 'Batas Pengisian KRS Perbaikan', mulai: '2025-09-08', selesai: '2025-09-12', kategori: 'Registrasi', warna: 'brand' },
  { id: 'ka6', judul: 'Libur Maulid Nabi', mulai: '2025-09-15', selesai: '2025-09-15', kategori: 'Libur', warna: 'info' },
  { id: 'ka7', judul: 'Ujian Akhir Semester (UAS)', mulai: '2026-01-05', selesai: '2026-01-16', kategori: 'Ujian', warna: 'warning' },
  { id: 'ka8', judul: 'Yudisium & Rilis KHS', mulai: '2026-01-26', selesai: '2026-01-30', kategori: 'Akademik', warna: 'success' },
  { id: 'ka9', judul: 'Wisuda Periode II', mulai: '2026-02-14', selesai: '2026-02-14', kategori: 'Wisuda', warna: 'gold' },
]

// ── Pengumuman ─────────────────────────────────────────────────────────────
export const pengumuman = [
  { id: 'p1', judul: 'Pembukaan Pengisian KRS Semester Ganjil 2025/2026', isi: 'Pengisian KRS dibuka 18–25 Agustus 2025. Wajib mendapat persetujuan Dosen Wali sebelum batas waktu. KRS yang belum disetujui dianggap tidak aktif.', kategori: 'Akademik', tanggal: '2025-08-15', authorId: 'a1', pin: true },
  { id: 'p2', judul: 'Batas Akhir Pembayaran UKT 31 Agustus 2025', isi: 'Mahasiswa yang belum melunasi UKT hingga 31 Agustus 2025 tidak dapat mengikuti perkuliahan dan status KRS akan dinonaktifkan. Pembayaran via Virtual Account BNI.', kategori: 'Keuangan', tanggal: '2025-08-20', authorId: 'a1', pin: true },
  { id: 'p3', judul: 'Jadwal UTS Semester Ganjil', isi: 'UTS dilaksanakan 27 Oktober – 1 November 2025. Kartu ujian dapat dicetak dari menu setelah UKT lunas dan presensi ≥ 75%.', kategori: 'Ujian', tanggal: '2025-10-10', authorId: 'a1', pin: false },
  { id: 'p4', judul: 'Seminar Karier: Peluang di Industri AI', isi: 'Himpunan Mahasiswa TI mengadakan seminar karier bersama praktisi industri, 20 September 2025 di Auditorium FTIK. Terbuka untuk semua angkatan.', kategori: 'Kegiatan', tanggal: '2025-09-05', authorId: 'd2', pin: false },
]

// ── Presensi: pertemuan per kelas (kelas yang diambil Rangga) ─────────────
// Untuk demo, tiap kelas punya 14 pertemuan; sebagian sudah terlaksana.
function buildPertemuan() {
  const out = []
  const kelasAktif = ['k-rpl-a', 'k-mob-a', 'k-dm-a', 'k-sec-a', 'k-graf-a', 'k-mpti-a', 'k-metpen-a']
  const doneCount = { 'k-rpl-a': 9, 'k-mob-a': 8, 'k-dm-a': 9, 'k-sec-a': 8, 'k-graf-a': 7, 'k-mpti-a': 9, 'k-metpen-a': 6 }
  for (const kId of kelasAktif) {
    for (let i = 1; i <= 14; i++) {
      out.push({ id: `${kId}-p${i}`, kelasId: kId, pertemuanKe: i, materi: `Pertemuan ${i}`, terlaksana: i <= (doneCount[kId] || 0) })
    }
  }
  return out
}
export const pertemuan = buildPertemuan()

// Rekap presensi Rangga per kelas: sebagian besar hadir, sedikit izin/alpa.
export const presensi = (() => {
  const out = []
  const map = {
    'k-rpl-a': ['H','H','H','H','H','H','H','I','H'],
    'k-mob-a': ['H','H','H','A','H','H','H','H'],
    'k-dm-a': ['H','H','H','H','H','H','H','H','H'],
    'k-sec-a': ['H','H','I','H','H','H','H','H'],
    'k-graf-a': ['H','H','H','H','H','H','H'],
    'k-mpti-a': ['H','H','H','H','H','H','H','S','H'],
    'k-metpen-a': ['H','H','H','H','H','H'],
  }
  const statusMap = { H: 'hadir', I: 'izin', S: 'sakit', A: 'alpa' }
  for (const [kId, arr] of Object.entries(map)) {
    arr.forEach((s, i) => out.push({ id: `pr-${kId}-${i + 1}`, kelasId: kId, mahasiswaId: 'm1', pertemuanKe: i + 1, status: statusMap[s] }))
  }
  return out
})()
