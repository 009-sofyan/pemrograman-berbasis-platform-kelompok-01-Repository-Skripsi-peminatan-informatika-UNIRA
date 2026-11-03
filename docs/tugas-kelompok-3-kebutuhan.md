# Tugas Kelompok 3 — Dokumentasi Kebutuhan

## 1. Ide Project

### Judul Project

**Repository Skripsi Peminatan Informatika UNIRA**

### Cerita yang Dipilih

**Repository / Eprint**

### Deskripsi Singkat

Project ini merupakan sistem repository skripsi dan pemetaan peminatan mahasiswa Informatika UNIRA. Sistem dirancang untuk menyediakan tempat penyimpanan dan pencarian skripsi secara terpusat serta menampilkan informasi pemetaan jumlah mahasiswa berdasarkan bidang peminatan **Business Intelligence (BI)** dan **Software Architecture (SA)**.
Sistem memiliki tiga peran pengguna, yaitu **Mahasiswa, Kaprodi, dan Tendik**. Mahasiswa dapat mencari dan mengunggah skripsi, Kaprodi dapat melihat informasi skripsi dan pemetaan peminatan, sedangkan Tendik dapat mengelola data mahasiswa, skripsi, dan peminatan serta melakukan verifikasi berkas skripsi.
## 2. Masalah

Pengarsipan skripsi di Informatika UNIRA masih belum terpusat sehingga mahasiswa kesulitan mencari referensi skripsi yang sesuai dengan bidang peminatan riset mereka. Selain itu, informasi mengenai jumlah mahasiswa pada setiap peminatan belum dapat dipantau secara terpusat.
Permasalahan tersebut menyebabkan data skripsi dan informasi peminatan belum dapat dimanfaatkan secara optimal sebagai sumber referensi bagi mahasiswa maupun sebagai informasi pemetaan bagi Kaprodi.

### Pengguna yang Mengalami Masalah

1. **Mahasiswa** — kesulitan mencari referensi skripsi yang sesuai dengan bidang peminatan.
2. **Kaprodi** — membutuhkan informasi pemetaan jumlah mahasiswa berdasarkan peminatan BI dan SA.
3. **Tendik** — membutuhkan sistem terpusat untuk mengelola data mahasiswa, skripsi, dan peminatan.

## 3. Solusi Digital

Sistem yang diusulkan adalah aplikasi repository skripsi yang terpusat dan dilengkapi dengan fitur pemetaan peminatan mahasiswa. Sistem menyediakan tempat bagi mahasiswa untuk mencari dan mengunggah skripsi berdasarkan kategori peminatan, serta menyediakan informasi pemetaan jumlah mahasiswa berdasarkan peminatan **Business Intelligence (BI)** dan **Software Architecture (SA)**.

### Solusi Berdasarkan Pengguna

1. **Mahasiswa**
   - Mencari skripsi berdasarkan kategori atau peminatan.
   - Melihat informasi skripsi yang tersedia.
   - Mengunggah berkas skripsi.
   - Memiliki data peminatan BI atau SA.

2. **Kaprodi**
   - Melihat data skripsi.
   - Melihat jumlah mahasiswa berdasarkan peminatan BI dan SA.
   - Melihat rekapitulasi pemetaan peminatan mahasiswa.

3. **Tendik**
   - Mengelola data mahasiswa.
   - Mengelola data skripsi.
   - Mengelola data peminatan.
   - Memverifikasi dan mengelola berkas skripsi yang masuk ke repository.

### Fitur MVP

Fitur utama yang dikembangkan pada tahap awal meliputi:

1. Pencarian skripsi.
2. Pengunggahan skripsi.
3. Kategori skripsi berdasarkan peminatan.
4. Dashboard rekapitulasi pemetaan jumlah mahasiswa berdasarkan peminatan BI dan SA.

### Arsitektur Sistem

Arsitektur sistem yang digunakan adalah:

```text
Svelte → REST → Express → Prisma → Database

## 4. Kebutuhan Sistem

### 4.1 Kebutuhan Fungsional dan Non-Fungsional

| ID | Kebutuhan | Jenis (F/NF) | Prioritas (MoSCoW) | User Story / UC Terkait |
| :--- | :--- | :--- | :--- | :--- |
| K-01 | Sistem dapat menyediakan fitur login bagi pengguna sesuai perannya. | F | Must | US-01 |
| K-02 | Mahasiswa dapat mencari skripsi berdasarkan kategori atau peminatan. | F | Must | US-02 |
| K-03 | Mahasiswa dapat melihat informasi skripsi yang tersedia di repository. | F | Must | US-03 |
| K-04 | Mahasiswa dapat mengunggah berkas skripsi ke repository. | F | Must | US-04 |
| K-05 | Mahasiswa dapat memiliki data peminatan BI atau SA. | F | Must | US-05 |
| K-06 | Tendik dapat mengelola data mahasiswa, data skripsi, dan data peminatan. | F | Must | US-06 |
| K-07 | Tendik dapat memverifikasi dan mengelola berkas skripsi yang masuk ke repository. | F | Must | US-07 |
| K-08 | Kaprodi dapat melihat rekapitulasi jumlah mahasiswa berdasarkan peminatan BI dan SA. | F | Must | US-08 |
| K-09 | Sistem menerapkan autentikasi dan hak akses berdasarkan peran pengguna. | NF | Must | US-01 |
| K-10 | Sistem dapat memberikan respons layanan dengan waktu yang wajar saat pengguna melakukan pencarian atau mengakses data. | NF | Should | US-02, US-03 |
| K-11 | Antarmuka sistem dapat digunakan pada perangkat dengan ukuran layar minimal 360px dan laptop. | NF | Should | US-02, US-03, US-04 |
| K-12 | Sistem membatasi akses pengelolaan data sesuai dengan hak akses Mahasiswa, Kaprodi, dan Tendik. | NF | Must | US-01, US-06, US-08 |

## 5. User Story

| ID | User Story | Prioritas (MoSCoW) |
| :--- | :--- | :--- |
| US-01 | Sebagai pengguna, saya ingin login sesuai peran saya agar dapat mengakses fitur yang sesuai dengan hak akses saya. | Must |
| US-02 | Sebagai mahasiswa, saya ingin mencari skripsi berdasarkan kategori atau peminatan agar saya dapat menemukan referensi yang sesuai dengan kebutuhan riset saya. | Must |
| US-03 | Sebagai mahasiswa, saya ingin melihat informasi skripsi yang tersedia agar saya dapat mengetahui referensi skripsi yang dapat digunakan. | Must |
| US-04 | Sebagai mahasiswa, saya ingin mengunggah berkas skripsi agar skripsi saya dapat disimpan di repository. | Must |
| US-05 | Sebagai mahasiswa, saya ingin memiliki data peminatan BI atau SA agar data saya dapat digunakan dalam pemetaan peminatan mahasiswa. | Must |
| US-06 | Sebagai Tendik, saya ingin mengelola data mahasiswa, skripsi, dan peminatan agar data repository tetap terorganisir. | Must |
| US-07 | Sebagai Tendik, saya ingin memverifikasi berkas skripsi yang masuk agar hanya berkas yang sesuai yang dikelola dalam repository. | Must |
| US-08 | Sebagai Kaprodi, saya ingin melihat rekap jumlah mahasiswa berdasarkan peminatan BI dan SA agar saya dapat memantau pemetaan peminatan mahasiswa. | Must |

## 6. Use Case

### 6.1 Aktor

| Aktor | Deskripsi |
| :--- | :--- |
| Mahasiswa | Pengguna yang mencari referensi skripsi, melihat informasi skripsi, mengunggah skripsi, dan memiliki data peminatan. |
| Kaprodi | Pengguna yang memantau data skripsi dan melihat pemetaan jumlah mahasiswa berdasarkan peminatan BI dan SA. |
| Tendik | Pengguna yang mengelola data mahasiswa, skripsi, peminatan, serta melakukan verifikasi berkas skripsi. |

### 6.2 Daftar Use Case

| ID | Use Case | Aktor | Deskripsi |
| :--- | :--- | :--- | :--- |
| UC-01 | Login | Mahasiswa, Kaprodi, Tendik | Pengguna melakukan login untuk mengakses sistem sesuai hak aksesnya. |
| UC-02 | Mencari dan Melihat Skripsi | Mahasiswa | Mahasiswa mencari skripsi berdasarkan kategori atau peminatan dan melihat informasi skripsi. |
| UC-03 | Mengunggah Skripsi | Mahasiswa | Mahasiswa mengunggah berkas skripsi ke repository. |
| UC-04 | Mengelola dan Memverifikasi Skripsi | Tendik | Tendik mengelola data skripsi dan memverifikasi berkas skripsi yang masuk. |
| UC-05 | Melihat Pemetaan Peminatan | Kaprodi | Kaprodi melihat rekap jumlah mahasiswa berdasarkan peminatan BI dan SA. |

### 6.3 Skenario Detail Alur Utama — Mengunggah Skripsi

**Use Case:** UC-03 — Mengunggah Skripsi  
**Aktor:** Mahasiswa

#### Kondisi Awal

- Mahasiswa sudah memiliki akun.
- Mahasiswa sudah login ke dalam sistem.
- Mahasiswa memiliki berkas skripsi yang akan diunggah.

#### Alur Utama

1. Mahasiswa membuka menu unggah skripsi.
2. Sistem menampilkan formulir pengunggahan skripsi.
3. Mahasiswa mengisi informasi skripsi.
4. Mahasiswa memilih kategori peminatan BI atau SA.
5. Mahasiswa memilih berkas skripsi yang akan diunggah.
6. Mahasiswa mengirim formulir.
7. Sistem memvalidasi data dan berkas yang dikirim.
8. Sistem menyimpan data skripsi dan berkas ke repository.
9. Sistem menampilkan informasi bahwa pengunggahan berhasil.
10. Berkas skripsi dapat diproses untuk verifikasi oleh Tendik.

#### Kondisi Akhir

Data skripsi dan berkas yang diunggah mahasiswa tersimpan di repository dan siap diproses untuk verifikasi.

## 7. Activity Diagram

### 7.1 Alur Mengunggah Skripsi

```mermaid
flowchart TD
    A([Mulai]) --> B[Buka menu unggah skripsi]
    B --> C[Sistem menampilkan formulir]
    C --> D[Mahasiswa mengisi informasi skripsi]
    D --> E[Mahasiswa memilih peminatan BI atau SA]
    E --> F[Mahasiswa memilih berkas skripsi]
    F --> G[Mahasiswa mengirim formulir]
    G --> H[Sistem memvalidasi data dan berkas]
    H --> I{Data dan berkas valid?}
    I -- Tidak --> J[Sistem menampilkan pesan kesalahan]
    J --> C
    I -- Ya --> K[Sistem menyimpan data dan berkas]
    K --> L[Sistem menampilkan notifikasi berhasil]
    L --> M([Selesai])
q
## 8. Product Backlog

| ID | Product Backlog | Priority | Estimasi |
|---|---|---|---:|
| PB-01 | Membuat fitur login berdasarkan role pengguna | Must | 3 SP |
| PB-02 | Membuat fitur pencarian skripsi berdasarkan kategori/peminatan | Must | 5 SP |
| PB-03 | Membuat halaman detail informasi skripsi | Must | 3 SP |
| PB-04 | Membuat fitur pengunggahan skripsi oleh mahasiswa | Must | 5 SP |
| PB-05 | Membuat pengelolaan data peminatan BI dan SA | Must | 3 SP |
| PB-06 | Membuat pengelolaan data mahasiswa dan skripsi oleh Tendik | Must | 5 SP |
| PB-07 | Membuat fitur verifikasi skripsi oleh Tendik | Must | 5 SP |
| PB-08 | Membuat dashboard pemetaan jumlah mahasiswa berdasarkan BI dan SA untuk Kaprodi | Must | 5 SP |
| PB-09 | Membatasi akses fitur berdasarkan role pengguna | Must | 3 SP |
| PB-10 | Membuat tampilan yang dapat digunakan pada perangkat mobile dan laptop | Should | 3 SP |

## 9. Sprint Backlog

| ID | Pekerjaan | Product Backlog | Estimasi |
|---|---|---|---:|
| SB-01 | Membuat halaman dan proses login | PB-01 | 3 SP |
| SB-02 | Membuat fitur pencarian skripsi | PB-02 | 5 SP |
| SB-03 | Membuat halaman detail skripsi | PB-03 | 3 SP |
| SB-04 | Membuat fitur upload skripsi | PB-04 | 5 SP |
| SB-05 | Membuat pengelolaan kategori BI dan SA | PB-05 | 3 SP |
| SB-06 | Membuat pengelolaan data mahasiswa dan skripsi | PB-06 | 5 SP |
| SB-07 | Membuat proses verifikasi skripsi | PB-07 | 5 SP |
| SB-08 | Membuat dashboard pemetaan BI dan SA | PB-08 | 5 SP |
| SB-09 | Menerapkan pembatasan akses berdasarkan role | PB-09 | 3 SP |
| SB-10 | Menyesuaikan tampilan untuk mobile dan laptop | PB-10 | 3 SP |

## 10. Issue Diskusi

Diskusi kebutuhan sistem dilakukan melalui GitHub Issue:

[Issue #1 — Diskusi Kebutuhan Sistem Tugas Kelompok 3](https://github.com/009-sofyan/pemrograman-berbasis-platform-kelompok-01-Repository-Skripsi-peminatan-informatika-UNIRA/issues/1)