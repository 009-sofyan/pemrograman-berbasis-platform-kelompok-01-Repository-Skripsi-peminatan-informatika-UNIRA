# Repository Skripsi — Frontend Web

Frontend web untuk **Repository Skripsi & Pemetaan Peminatan Informatika UNIRA**. Dibangun ulang dengan **React 19 + Vite + TypeScript + Tailwind CSS + Lucide + Axios + Recharts**.

## Fitur

### Mahasiswa
- Dashboard ringkasan repository, status skripsi, dan pemetaan peminatan.
- Repository skripsi dengan pencarian judul, filter tahun/peminatan/status, detail, dan unduh PDF.
- Pengajuan skripsi: simpan draft, unggah PDF (maks. 10 MB), edit, ajukan, dan hapus.
- Pelacakan pengajuan yang dibuat/dilacak di perangkat ini.
- Profil akun dan pemilihan peminatan **Business Intelligence** atau **Smart Agriculture** (final).

### Kaprodi
- Verifikasi pengajuan: setujui/tolak dengan konfirmasi.
- Riwayat keputusan dengan pencarian dan filter status.
- Pemetaan peminatan: statistik, donut chart, distribusi, dan ekspor CSV.

### Tendik
- Data mahasiswa: tambah, edit, hapus, cari, filter peminatan/angkatan, dan pagination.
- Penghapusan data mahasiswa menghapus akun dan seluruh skripsi terkait (cascade).

### Umum
- Autentikasi JWT Bearer, auto-logout saat 401.
- Routing berbasis peran dengan halaman 403 dan 404.
- Desain responsif: sidebar/topbar glassmorphism, kartu rounded, tabel desktop + kartu mobile.
- Toast, skeleton loading, empty state, dan dialog konfirmasi.

## Prasyarat

- Node.js 20+ dan npm.
- Backend Express berjalan di `http://localhost:3000`.
- MySQL dengan database `repository_skripsi_ftUnira` sesuai konfigurasi backend.
- Internet untuk memuat font Plus Jakarta Sans dari Google Fonts (fallback tetap tersedia).

## Menjalankan

### 1. Backend

```bash
cd backend
npm install
npm run db:migrate   # sesuaikan dengan kondisi database
npm run dev
```

Backend berjalan di `http://localhost:3000`. Pastikan database sudah dibuat dan migration/seed dijalankan sesuai kebutuhan. Backend membaca variabel `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, dan `JWT_SECRET` (default mengikuti `backend/src/db/index.ts`).

### 2. Frontend web

```bash
cd frontend/web
npm install
copy .env.example .env    # Windows
# cp .env.example .env    # macOS/Linux
npm run dev
```

Buka **http://localhost:5173**.

Vite mem-proxy `/api` dan `/uploads` ke `http://localhost:3000`, sehingga tidak memerlukan konfigurasi CORS tambahan saat development.

### Build produksi

```bash
npm run typecheck
npm run build
npm run preview
```

Hasil build ada di `frontend/web/dist`.

## Environment

File `.env.example`:

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:3000
# VITE_API_ORIGIN=http://localhost:3000
```

- `VITE_API_BASE_URL`: base URL API yang dipakai Axios. Default `/api` (proxy development).
- `VITE_API_PROXY_TARGET`: target proxy Vite untuk `/api` dan `/uploads`.
- `VITE_API_ORIGIN`: opsional, origin backend untuk membentuk URL file PDF. Kosongkan jika memakai proxy/relative URL.

Untuk produksi tanpa proxy, isi misalnya:

```env
VITE_API_BASE_URL=https://api.contoh.ac.id/api
VITE_API_ORIGIN=https://api.contoh.ac.id
```

## Akun Demo

Mengikuti `backend/src/db/seeds/seedRoleUsers.ts`:

| Peran | Email | Password |
| --- | --- | --- |
| Tendik | `tendik@unira.com` | `tendik123` |
| Kaprodi | `kaprodi@unira.com` | `kaprodi123` |
| Mahasiswa | `mahasiswa@unira.ac.id` | `121212` |

Catatan: akun mahasiswa demo belum memiliki data akademik. Tambahkan NIM dan program studi melalui akun Tendik sebelum mencoba pengajuan skripsi.

## Struktur Singkat

```text
src/
├── components/
│   ├── charts/        # Donut dan bar chart Recharts
│   ├── layout/        # Sidebar, topbar, logo, AppLayout
│   ├── mahasiswa/     # Form modal data mahasiswa
│   └── ui/            # Button, Input, Card, Modal, Toast, dll.
├── contexts/          # AuthContext dan ToastContext
├── hooks/
├── lib/               # Axios client, storage, format, error, file URL
├── pages/             # Login, Dashboard, Repository, Pengajuan, dll.
├── routes/            # ProtectedRoute dan PublicOnlyRoute
├── services/          # Wrapper endpoint backend
└── types/
```

## Pemetaan Endpoint Backend

| Fitur | Endpoint |
| --- | --- |
| Login / register / profil | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` |
| Skripsi | `GET/POST /api/skripsi`, `GET/PUT/DELETE /api/skripsi/:id`, `POST /api/skripsi/:id/upload`, `PATCH /api/skripsi/:id/submit` |
| Data mahasiswa (Tendik) | `GET/POST /api/mahasiswa`, `GET/PUT/DELETE /api/mahasiswa/:id` |
| Verifikasi (Kaprodi) | `GET /api/persetujuan`, `PATCH /api/persetujuan/:id/approve`, `PATCH /api/persetujuan/:id/reject` |
| Pemilihan peminatan | `PATCH /api/peminatan/peminatan` |
| Dashboard | `GET /api/dashboard` |
| Pemetaan (Kaprodi) | `GET /api/pemetaan` |

## Batasan yang Diketahui

1. **Tidak ada endpoint mahasiswa untuk membaca data akademiknya sendiri.** Backend tidak menyediakan `GET` data mahasiswa untuk peran mahasiswa, sehingga halaman Profil tidak dapat menampilkan NIM/prodi secara langsung. Pilihan peminatan disimpan sebagai cache lokal setelah berhasil dikirim, dan status "sudah memilih" tetap divalidasi oleh backend.
2. **Daftar pengajuan mahasiswa disimpan di browser.** Backend tidak menyediakan endpoint daftar skripsi milik pengguna. ID pengajuan yang dibuat atau dilacak disimpan di `localStorage`; akses detail tetap diverifikasi backend.
3. **Peminatan final.** Backend menolak perubahan peminatan yang sudah pernah dipilih. Perbaikan hanya dapat dilakukan melalui Tendik di halaman Data Mahasiswa.
4. **Path file statis backend.** `backend/src/index.ts` sebelumnya menyajikan folder `upload`, sedangkan multer menulis ke `uploads/skripsi`. Path sudah diperbaiki menjadi `uploads` agar tautan PDF berfungsi.
5. **Data lama.** Seed lama dapat memuat peminatan `Artificial Intelligence` atau `Software Engineering`; UI menampilkannya sebagai "Lainnya" dan tetap dihitung pada pemetaan.

## Verifikasi

Terakhir diverifikasi:

```bash
npm run typecheck   # lolos
npm run build       # lolos
```

Build menghasilkan `dist/` dengan ukuran chunk utama sekitar 936 kB (269 kB gzip). Peringatan ukuran chunk dari Vite dapat diabaikan untuk aplikasi internal; pemecahan chunk dapat ditambahkan bila diperlukan.
