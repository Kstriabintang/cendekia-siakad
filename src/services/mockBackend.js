// In-memory SIAKAD backend seeded from seed.js, persisted to localStorage.
// Exposes the same method surface a real Supabase backend would implement, so
// views never import Supabase directly — they call `api`.

import * as seed from './seed.js'

const KEY = 'siakad-db-v2'

function freshDB() {
  // Flatten nilai (keyed by mahasiswaId in seed) into records.
  const nilaiRecords = []
  for (const [mid, arr] of Object.entries(seed.nilai)) {
    arr.forEach((n, i) => nilaiRecords.push({ id: `n-${mid}-${i}`, mahasiswaId: mid, ...n }))
  }
  return {
    tahunAjaran: seed.tahunAjaran, fakultas: seed.fakultas, prodi: seed.prodi,
    users: seed.users, mataKuliah: seed.mataKuliah, kelas: seed.kelas,
    krs: seed.krs, nilai: nilaiRecords, tagihan: seed.tagihan, kalender: seed.kalender,
    pengumuman: seed.pengumuman, pertemuan: seed.pertemuan, presensi: seed.presensi,
    takaHist: { ...seed.takaHist },
  }
}

function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) } catch (e) {}
  const fresh = freshDB(); persist(fresh); return fresh
}
function persist(db) { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch (e) {} }

let db = load()
const wait = (ms = 110) => new Promise((r) => setTimeout(r, ms))
const clone = (v) => JSON.parse(JSON.stringify(v))
const uid = (p) => p + '-' + Math.random().toString(36).slice(2, 9)
const nowStr = () => {
  const d = new Date(); const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
const rupiah = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID')

// ── Academic helpers ───────────────────────────────────────────────────────
const BOBOT = { kehadiran: 0.10, tugas: 0.20, uts: 0.30, uas: 0.40 }

function hurufMutu(angka) {
  if (angka == null) return { huruf: '–', mutu: null }
  if (angka >= 85) return { huruf: 'A', mutu: 4.0 }
  if (angka >= 80) return { huruf: 'A-', mutu: 3.7 }
  if (angka >= 75) return { huruf: 'B+', mutu: 3.3 }
  if (angka >= 70) return { huruf: 'B', mutu: 3.0 }
  if (angka >= 65) return { huruf: 'B-', mutu: 2.7 }
  if (angka >= 60) return { huruf: 'C+', mutu: 2.3 }
  if (angka >= 55) return { huruf: 'C', mutu: 2.0 }
  if (angka >= 45) return { huruf: 'D', mutu: 1.0 }
  return { huruf: 'E', mutu: 0.0 }
}

// Weighted score from components; if some (e.g. uas) missing, renormalize weights.
function angkaFromKomponen(k) {
  if (!k) return null
  let sum = 0, w = 0
  for (const key of Object.keys(BOBOT)) {
    if (k[key] != null) { sum += k[key] * BOBOT[key]; w += BOBOT[key] }
  }
  if (!w) return null
  return Math.round(sum / w)
}

const mkByKode = (kode) => db.mataKuliah.find((m) => m.kode === kode)
const kelasById = (id) => db.kelas.find((k) => k.id === id)
const userById = (id) => db.users.find((u) => u.id === id)
const takaById = (id) => db.tahunAjaran.find((t) => t.id === id)
const takaLabel = (id) => takaById(id)?.label || db.takaHist[id] || id
const activeTaka = () => db.tahunAjaran.find((t) => t.aktif) || db.tahunAjaran[0]

function decorateKelas(k) {
  const mk = mkByKode(k.mkKode)
  const dosen = userById(k.dosenId)
  return {
    ...clone(k), mk: clone(mk),
    dosen: dosen ? { id: dosen.id, name: dosen.name, nidn: dosen.nidn } : null,
    jam: `${k.jamMulai}–${k.jamSelesai}`,
    sks: mk?.sks ?? 0,
    label: `${mk?.nama} (${mk?.kode})`,
  }
}

// Which kelas a mahasiswa is enrolled in this active term (approved KRS).
function enrolledKelasIds(mahasiswaId, takaId = activeTaka().id) {
  const k = db.krs.find((x) => x.mahasiswaId === mahasiswaId && x.takaId === takaId && x.status === 'Disetujui')
  return k ? k.kelasIds : []
}

// ── Backend surface ─────────────────────────────────────────────────────────
export const mockBackend = {
  resetDemo() { localStorage.removeItem(KEY); db = load() },

  async login(email) {
    await wait()
    const u = db.users.find((x) => x.email.toLowerCase() === String(email).toLowerCase())
    if (!u) throw new Error('Email tidak terdaftar')
    return clone(u)
  },

  async listUsers(role) {
    await wait(70)
    let list = role ? db.users.filter((u) => u.role === role) : db.users
    return list.map((u) => ({ ...clone(u), prodiNama: u.prodiId ? mkProdi(u.prodiId)?.nama : null }))
  },

  async getUser(id) {
    await wait(60)
    const u = userById(id); if (!u) throw new Error('Pengguna tidak ditemukan')
    const out = { ...clone(u) }
    if (u.role === 'mahasiswa') {
      out.prodi = clone(mkProdi(u.prodiId))
      out.dosenWali = u.dosenWaliId ? clone(userById(u.dosenWaliId)) : null
      out.fakultas = clone(db.fakultas.find((f) => f.id === out.prodi?.fakultasId))
    }
    if (u.role === 'dosen') out.prodi = clone(mkProdi(u.prodiId))
    return out
  },

  async listProdi() { await wait(50); return clone(db.prodi) },
  async listTahunAjaran() { await wait(40); return clone(db.tahunAjaran) },
  async activeTaka() { await wait(30); return clone(activeTaka()) },

  // ── Kurikulum / Mata Kuliah ───────────────────────────────────────────
  async listMataKuliah({ prodiId, mahasiswaId } = {}) {
    await wait(80)
    let list = prodiId ? db.mataKuliah.filter((m) => m.prodiId === prodiId) : db.mataKuliah
    // annotate lulus status for a student
    const passed = mahasiswaId ? new Set(
      db.nilai.filter((n) => n.mahasiswaId === mahasiswaId && n.status === 'final').map((n) => n.mkKode)
    ) : null
    return list.map((m) => ({
      ...clone(m),
      prasyaratNama: m.prasyarat.map((p) => mkByKode(p)?.nama).filter(Boolean),
      lulus: passed ? passed.has(m.kode) : null,
    }))
  },

  // ── KRS ────────────────────────────────────────────────────────────────
  async getKrs(mahasiswaId, takaId = activeTaka().id) {
    await wait(100)
    let k = db.krs.find((x) => x.mahasiswaId === mahasiswaId && x.takaId === takaId)
    if (!k) {
      // create an empty draft
      const mhs = userById(mahasiswaId)
      k = { id: uid('krs'), mahasiswaId, takaId, semester: mhs?.semester ?? null, status: 'Draft',
        dosenWaliId: mhs?.dosenWaliId ?? null, diajukanAt: null, disetujuiAt: null,
        ipsSebelumnya: null, batasSks: 24, catatan: '', kelasIds: [] }
      db.krs.push(k); persist(db)
    }
    return decorateKrs(k)
  },

  async listAvailableKelas(takaId = activeTaka().id, mahasiswaId = null) {
    await wait(90)
    let list = db.kelas.filter((k) => k.takaId === takaId)
    return list.map(decorateKelas)
  },

  async addKelasKrs(krsId, kelasId) {
    await wait(90)
    const k = db.krs.find((x) => x.id === krsId)
    if (!k) throw new Error('KRS tidak ditemukan')
    if (k.status === 'Disetujui') throw new Error('KRS sudah disetujui, tidak dapat diubah')
    const cand = kelasById(kelasId)
    // prevent duplicate mata kuliah
    const existingKodes = k.kelasIds.map((id) => kelasById(id)?.mkKode)
    if (existingKodes.includes(cand.mkKode)) throw new Error('Mata kuliah ini sudah ada di KRS')
    // prerequisite check
    const mk = mkByKode(cand.mkKode)
    const passed = new Set(db.nilai.filter((n) => n.mahasiswaId === k.mahasiswaId && n.status === 'final').map((n) => n.mkKode))
    const unmet = (mk.prasyarat || []).filter((p) => !passed.has(p))
    if (unmet.length) throw new Error(`Prasyarat belum terpenuhi: ${unmet.map((p) => mkByKode(p)?.nama).join(', ')}`)
    // SKS cap
    const curSks = k.kelasIds.reduce((s, id) => s + (mkByKode(kelasById(id).mkKode)?.sks || 0), 0)
    if (curSks + mk.sks > k.batasSks) throw new Error(`Melebihi batas ${k.batasSks} SKS`)
    k.kelasIds.push(kelasId)
    if (k.status === 'Ditolak') k.status = 'Draft'
    persist(db)
    return decorateKrs(k)
  },

  async removeKelasKrs(krsId, kelasId) {
    await wait(70)
    const k = db.krs.find((x) => x.id === krsId)
    if (!k) throw new Error('KRS tidak ditemukan')
    if (k.status === 'Disetujui') throw new Error('KRS sudah disetujui, tidak dapat diubah')
    k.kelasIds = k.kelasIds.filter((id) => id !== kelasId)
    persist(db)
    return decorateKrs(k)
  },

  async submitKrs(krsId) {
    await wait(150)
    const k = db.krs.find((x) => x.id === krsId)
    if (!k) throw new Error('KRS tidak ditemukan')
    if (!k.kelasIds.length) throw new Error('KRS masih kosong')
    k.status = 'Diajukan'; k.diajukanAt = nowStr(); persist(db)
    return decorateKrs(k)
  },

  // Dosen wali: daftar KRS menunggu persetujuan
  async listPendingKrs(waliId) {
    await wait(90)
    return db.krs.filter((k) => k.dosenWaliId === waliId && k.status === 'Diajukan').map(decorateKrs)
  },
  async listWaliKrs(waliId) {
    await wait(90)
    return db.krs.filter((k) => k.dosenWaliId === waliId).map(decorateKrs)
      .sort((a, b) => (b.diajukanAt || '').localeCompare(a.diajukanAt || ''))
  },

  async approveKrs(krsId, catatan = '') {
    await wait(140)
    const k = db.krs.find((x) => x.id === krsId)
    if (!k) throw new Error('KRS tidak ditemukan')
    k.status = 'Disetujui'; k.disetujuiAt = nowStr(); if (catatan) k.catatan = catatan
    persist(db); return decorateKrs(k)
  },
  async rejectKrs(krsId, catatan = '') {
    await wait(140)
    const k = db.krs.find((x) => x.id === krsId)
    if (!k) throw new Error('KRS tidak ditemukan')
    k.status = 'Ditolak'; k.catatan = catatan || 'Perlu perbaikan komposisi mata kuliah.'
    persist(db); return decorateKrs(k)
  },

  // ── Jadwal Kuliah ────────────────────────────────────────────────────────
  async getSchedule({ userId, role }) {
    await wait(100)
    let kelasList = []
    if (role === 'mahasiswa') {
      const ids = enrolledKelasIds(userId)
      kelasList = ids.map(kelasById).filter(Boolean)
    } else if (role === 'dosen') {
      kelasList = db.kelas.filter((k) => k.dosenId === userId && k.takaId === activeTaka().id)
    } else {
      kelasList = db.kelas.filter((k) => k.takaId === activeTaka().id)
    }
    return kelasList.map(decorateKelas).sort((a, b) => a.jamMulai.localeCompare(b.jamMulai))
  },

  // ── Nilai / KHS / Transkrip ───────────────────────────────────────────────
  async getKhs(mahasiswaId) {
    await wait(120)
    const recs = db.nilai.filter((n) => n.mahasiswaId === mahasiswaId)
    // group by semester
    const bySem = {}
    for (const r of recs) {
      const mk = mkByKode(r.mkKode); if (!mk) continue
      const angka = r.status === 'final' ? r.angka : angkaFromKomponen(r.komponen)
      const { huruf, mutu } = hurufMutu(angka)
      const item = {
        kode: mk.kode, nama: mk.nama, sks: mk.sks, semester: r.semester, takaId: r.takaId,
        takaLabel: takaLabel(r.takaId), angka, huruf, mutu, status: r.status,
        komponen: r.komponen || null,
      }
      ;(bySem[r.semester] ||= []).push(item)
    }
    const semesters = Object.keys(bySem).map(Number).sort((a, b) => a - b).map((sem) => {
      const items = bySem[sem].sort((a, b) => a.kode.localeCompare(b.kode))
      const finalItems = items.filter((i) => i.status === 'final')
      const sksSem = finalItems.reduce((s, i) => s + i.sks, 0)
      const mutuSem = finalItems.reduce((s, i) => s + (i.mutu ?? 0) * i.sks, 0)
      const ips = sksSem ? +(mutuSem / sksSem).toFixed(2) : null
      return { semester: sem, takaLabel: items[0]?.takaLabel, items, sksSem, ips, berjalan: finalItems.length === 0 }
    })
    // cumulative IPK from finals
    const allFinal = recs.filter((r) => r.status === 'final')
    let sksK = 0, mutuK = 0
    for (const r of allFinal) { const mk = mkByKode(r.mkKode); const { mutu } = hurufMutu(r.angka); sksK += mk.sks; mutuK += (mutu ?? 0) * mk.sks }
    const ipk = sksK ? +(mutuK / sksK).toFixed(2) : null
    return { semesters, ipk, sksLulus: sksK }
  },

  async getTranscript(mahasiswaId) {
    await wait(120)
    const khs = await this.getKhs(mahasiswaId)
    const mhs = userById(mahasiswaId)
    const rows = khs.semesters.flatMap((s) => s.items.filter((i) => i.status === 'final'))
    return { mahasiswa: clone(mhs), prodi: clone(mkProdi(mhs.prodiId)), semesters: khs.semesters, rows, ipk: khs.ipk, sksLulus: khs.sksLulus }
  },

  // Dosen: kelas yang diampu + roster untuk input nilai
  async listKelasDosen(dosenId) {
    await wait(90)
    return db.kelas.filter((k) => k.dosenId === dosenId && k.takaId === activeTaka().id).map((k) => {
      const roster = rosterOf(k.id)
      return { ...decorateKelas(k), rosterCount: roster.length }
    })
  },

  async getKelasRoster(kelasId) {
    await wait(100)
    const k = kelasById(kelasId)
    const roster = rosterOf(kelasId).map((mid) => {
      const u = userById(mid)
      const rec = db.nilai.find((n) => n.mahasiswaId === mid && n.mkKode === k.mkKode && n.takaId === k.takaId)
      const komponen = rec?.komponen || (rec?.status === 'final' ? null : { kehadiran: null, tugas: null, uts: null, uas: null })
      const angka = rec?.status === 'final' ? rec.angka : angkaFromKomponen(komponen)
      return { id: u.id, name: u.name, nim: u.nim, komponen: komponen || {}, angka, ...hurufMutu(angka) }
    })
    return { kelas: decorateKelas(k), roster }
  },

  async saveKomponen(kelasId, mahasiswaId, komponen) {
    await wait(120)
    const k = kelasById(kelasId)
    let rec = db.nilai.find((n) => n.mahasiswaId === mahasiswaId && n.mkKode === k.mkKode && n.takaId === k.takaId)
    if (!rec) { rec = { id: uid('n'), mahasiswaId, mkKode: k.mkKode, takaId: k.takaId, semester: mkByKode(k.mkKode).semester, status: 'berjalan', komponen: {} }; db.nilai.push(rec) }
    rec.komponen = { ...rec.komponen, ...komponen }
    persist(db)
    const angka = angkaFromKomponen(rec.komponen)
    return { angka, ...hurufMutu(angka) }
  },

  // ── Presensi ───────────────────────────────────────────────────────────
  async getPresensiRekap(mahasiswaId) {
    await wait(100)
    const ids = enrolledKelasIds(mahasiswaId)
    return ids.map((kId) => {
      const k = kelasById(kId)
      const recs = db.presensi.filter((p) => p.kelasId === kId && p.mahasiswaId === mahasiswaId)
      const total = db.pertemuan.filter((p) => p.kelasId === kId && p.terlaksana).length
      const count = (st) => recs.filter((r) => r.status === st).length
      const hadir = count('hadir'), izin = count('izin'), sakit = count('sakit'), alpa = count('alpa')
      const persen = total ? Math.round((hadir / total) * 100) : 0
      return { ...decorateKelas(k), total, hadir, izin, sakit, alpa, persen, records: clone(recs) }
    })
  },

  async getKelasPresensi(kelasId) {
    await wait(100)
    const k = kelasById(kelasId)
    const pertemuan = db.pertemuan.filter((p) => p.kelasId === kelasId).sort((a, b) => a.pertemuanKe - b.pertemuanKe)
    const roster = rosterOf(kelasId).map((mid) => {
      const u = userById(mid)
      const recs = db.presensi.filter((p) => p.kelasId === kelasId && p.mahasiswaId === mid)
      const total = pertemuan.filter((p) => p.terlaksana).length
      const hadir = recs.filter((r) => r.status === 'hadir').length
      return { id: u.id, name: u.name, nim: u.nim, hadir, total, persen: total ? Math.round((hadir / total) * 100) : 0, records: clone(recs) }
    })
    return { kelas: decorateKelas(k), pertemuan: clone(pertemuan), roster }
  },

  // ── Keuangan ──────────────────────────────────────────────────────────
  async listTagihan(mahasiswaId) {
    await wait(90)
    return db.tagihan.filter((t) => t.mahasiswaId === mahasiswaId)
      .map((t) => ({ ...clone(t), takaLabel: takaLabel(t.takaId), nominalStr: rupiah(t.nominal) }))
      .sort((a, b) => b.semester - a.semester)
  },

  async payTagihan(tagihanId, metode = 'Virtual Account BNI') {
    await wait(200)
    const t = db.tagihan.find((x) => x.id === tagihanId)
    if (!t) throw new Error('Tagihan tidak ditemukan')
    if (t.status === 'Lunas') throw new Error('Tagihan sudah lunas')
    t.status = 'Lunas'; t.metode = metode; t.tglBayar = nowStr()
    persist(db)
    return { ...clone(t), takaLabel: takaLabel(t.takaId), nominalStr: rupiah(t.nominal) }
  },

  // ── Kalender & Pengumuman ─────────────────────────────────────────────
  async listKalender() {
    await wait(60)
    return clone(db.kalender).sort((a, b) => a.mulai.localeCompare(b.mulai))
  },

  async listPengumuman() {
    await wait(70)
    return db.pengumuman.map((p) => ({ ...clone(p), author: clone(userById(p.authorId)) }))
      .sort((a, b) => (b.pin - a.pin) || b.tanggal.localeCompare(a.tanggal))
  },

  // ── Dashboard stats ────────────────────────────────────────────────────
  async stats({ userId, role }) {
    await wait(90)
    if (role === 'mahasiswa') {
      const mhs = userById(userId)
      const krsRec = db.krs.find((k) => k.mahasiswaId === userId && k.takaId === activeTaka().id)
      const sksSem = krsRec ? krsRec.kelasIds.reduce((s, id) => s + (mkByKode(kelasById(id)?.mkKode)?.sks || 0), 0) : 0
      const tagihanBelum = db.tagihan.filter((t) => t.mahasiswaId === userId && t.status === 'Belum')
      const rekap = await this.getPresensiRekap(userId)
      const presensiAvg = rekap.length ? Math.round(rekap.reduce((s, r) => s + r.persen, 0) / rekap.length) : 0
      return {
        ipk: mhs.ipk, semester: mhs.semester, sksTempuh: mhs.sksTempuh, sksSem,
        krsStatus: krsRec?.status || 'Draft', tagihanBelum: tagihanBelum.length,
        tagihanNominal: tagihanBelum.reduce((s, t) => s + t.nominal, 0), presensiAvg,
        statusAkademik: mhs.statusAkademik,
      }
    }
    if (role === 'dosen') {
      const dosen = userById(userId)
      const kelasDiampu = db.kelas.filter((k) => k.dosenId === userId && k.takaId === activeTaka().id)
      const mahasiswaBimbingan = db.users.filter((u) => u.role === 'mahasiswa' && u.dosenWaliId === userId)
      const pendingKrs = db.krs.filter((k) => k.dosenWaliId === userId && k.status === 'Diajukan').length
      const totalMhs = new Set(kelasDiampu.flatMap((k) => rosterOf(k.id))).size
      return { kelas: kelasDiampu.length, mahasiswa: totalMhs, bimbingan: mahasiswaBimbingan.length, pendingKrs, isWali: dosen.isWali }
    }
    // admin
    return {
      mahasiswa: db.users.filter((u) => u.role === 'mahasiswa').length,
      dosen: db.users.filter((u) => u.role === 'dosen').length,
      prodi: db.prodi.length,
      mataKuliah: db.mataKuliah.length,
      pendingKrs: db.krs.filter((k) => k.status === 'Diajukan').length,
      tagihanBelum: db.tagihan.filter((t) => t.status === 'Belum').length,
    }
  },
}

// helpers that need db closure
function mkProdi(id) { return db.prodi.find((p) => p.id === id) }
function rosterOf(kelasId) {
  return db.krs.filter((k) => k.status === 'Disetujui' && k.kelasIds.includes(kelasId)).map((k) => k.mahasiswaId)
}
function decorateKrs(k) {
  const items = k.kelasIds.map((id) => decorateKelas(kelasById(id))).filter((x) => x.mk)
  const totalSks = items.reduce((s, it) => s + (it.sks || 0), 0)
  return {
    ...clone(k), takaLabel: takaLabel(k.takaId), items, totalSks,
    mahasiswa: clone(userById(k.mahasiswaId)),
    dosenWali: k.dosenWaliId ? clone(userById(k.dosenWaliId)) : null,
  }
}
