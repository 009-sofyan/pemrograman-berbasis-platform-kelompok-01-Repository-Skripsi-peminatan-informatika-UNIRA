# Tugas Kelompok 2 — Judul / Ide Project Akhir

## 1. Judul Final dan Cerita Terpilih

- **Judul Final**: Repository Skripsi Peminatan Informatika UNIRA
- **Cerita yang Dipilih**: Repository / Eprint

---

## 2. Paragraf Pilihan Cerita dan Alasan Pemilihan

Kelompok memilih cerita **Repository / Eprint** sebagai acuan utama ide project akhir karena project yang dikembangkan berkaitan dengan pengelolaan repository skripsi sekaligus pemetaan peminatan mahasiswa di Informatika UNIRA. Sistem ini tidak hanya digunakan sebagai tempat untuk menyimpan dan mencari data skripsi, tetapi juga memanfaatkan data mahasiswa dan peminatan untuk menghasilkan informasi mengenai jumlah mahasiswa yang mengambil bidang peminatan tertentu.

Project ini memiliki keterkaitan dengan kebutuhan mahasiswa, Kaprodi, dan Tendik sebagai calon pengguna sistem. Mahasiswa dapat memanfaatkan repository untuk mencari referensi skripsi dan mengunggah berkas skripsinya. Kaprodi dapat menggunakan informasi yang tersedia untuk memantau jumlah mahasiswa berdasarkan peminatan serta melihat pemetaan topik penelitian mahasiswa. Sementara itu, Tendik berperan dalam mengelola data mahasiswa, data skripsi, data peminatan, serta administrasi repository.

Pemilihan cerita Repository / Eprint juga didukung oleh ketersediaan data contoh berupa berkas skripsi, abstrak, data mahasiswa, serta kategori bidang peminatan di lingkungan Fakultas Teknik UNIRA. Data tersebut dapat digunakan sebagai bahan uji coba awal dalam pengembangan aplikasi. Dengan adanya data tersebut, sistem dapat menghubungkan data skripsi dengan data peminatan mahasiswa sehingga dapat menampilkan informasi jumlah mahasiswa yang mengambil peminatan **BI (Business Intelligence)** dan **SA (Smart Agriculture)**.

---

## 3. Tiga Kalimat Masalah – Pengguna – Fitur MVP

1. **Masalah**: Pengarsipan skripsi di Informatika UNIRA masih belum terpusat sehingga mahasiswa kesulitan mencari referensi skripsi yang sesuai dengan bidang peminatan riset mereka. Selain itu, informasi mengenai jumlah mahasiswa yang mengambil peminatan **BI (Business Intelligence)** dan **SA (Smart Agriculture)** belum dapat dipantau secara terpusat.

2. **Pengguna**: Aplikasi ini dirancang untuk **Mahasiswa, Kaprodi, dan Tendik** di lingkungan Informatika UNIRA. Ketiga pengguna tersebut memiliki kebutuhan yang berbeda, mulai dari mencari dan mengunggah skripsi, memantau pemetaan peminatan, hingga mengelola data repository dan administrasi skripsi.

3. **Fitur MVP**: Sistem menyediakan fitur **pencarian dan pengunggahan skripsi berbasis kategori peminatan serta dasbor rekapitulasi pemetaan jumlah mahasiswa berdasarkan peminatan BI dan SA**. Dasbor tersebut digunakan untuk menampilkan jumlah mahasiswa yang mengambil peminatan **Business Intelligence (BI)** dan **Smart Agriculture (SA)** sehingga informasi peminatan dapat dipantau dengan lebih mudah.

---

## 4. Tiga Peran Pengguna

### 1. Mahasiswa

Mahasiswa merupakan pengguna yang menggunakan repository sebagai sumber referensi skripsi serta sebagai pengguna yang dapat mengunggah berkas skripsi. Mahasiswa dapat:

- Mengunggah berkas skripsi mandiri.
- Mencari referensi skripsi berdasarkan judul atau kategori peminatan.
- Melihat informasi skripsi yang tersedia di dalam repository.
- Melihat informasi yang berkaitan dengan kategori peminatan.
- Mengetahui referensi skripsi yang sesuai dengan bidang yang diminati.

Data peminatan mahasiswa juga menjadi bagian penting dalam sistem karena digunakan sebagai bagian dari pemetaan jumlah mahasiswa berdasarkan bidang peminatan **BI (Business Intelligence)** dan **SA (Smart Agriculture)**.

### 2. Kaprodi

Kaprodi merupakan pengguna yang berperan dalam memantau informasi repository skripsi dan pemetaan peminatan mahasiswa pada program studi. Kaprodi dapat:

- Melihat data skripsi mahasiswa.
- Melihat jumlah mahasiswa berdasarkan peminatan.
- Memantau jumlah mahasiswa yang mengambil peminatan **BI (Business Intelligence)**.
- Memantau jumlah mahasiswa yang mengambil peminatan **SA (Smart Agriculture)**.
- Melihat rekapitulasi pemetaan peminatan mahasiswa.
- Melihat informasi mengenai sebaran topik riset berdasarkan peminatan.

Informasi tersebut dapat membantu Kaprodi memperoleh gambaran mengenai jumlah mahasiswa pada masing-masing peminatan serta perkembangan topik penelitian mahasiswa di lingkungan Fakultas Teknik UNIRA.

### 3. Tendik

Tendik merupakan pengguna yang berperan dalam mengelola data dan administrasi yang terdapat di dalam sistem repository. Tendik dapat:

- Mengelola data mahasiswa.
- Mengelola data skripsi.
- Mengelola data peminatan.
- Memverifikasi berkas skripsi yang diunggah mahasiswa.
- Mengelola data repository skripsi.
- Mengelola informasi yang diperlukan untuk pemetaan peminatan.
- Melihat atau mengunduh laporan rekapitulasi pemetaan riset fakultas.

Data yang dikelola oleh Tendik menjadi dasar bagi sistem untuk menyediakan repository skripsi serta menghasilkan informasi mengenai jumlah mahasiswa berdasarkan peminatan **BI dan SA**.

---

## 5. Arsitektur Sistem

Arsitektur sistem yang digunakan dalam pengembangan aplikasi ini terdiri dari aplikasi web dan aplikasi mobile yang menggunakan **backend dan database yang sama**.

### A. Arsitektur Web

Aplikasi web menggunakan **Svelte** sebagai frontend. Komunikasi antara frontend dan backend dilakukan melalui **REST API**. Backend menggunakan **Express**, sedangkan **Prisma** digunakan sebagai ORM untuk menghubungkan backend dengan database.

```text
Svelte → REST → Express → Prisma → Database