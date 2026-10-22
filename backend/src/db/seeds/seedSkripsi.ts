
import { eq } from "drizzle-orm";
import { db, pool } from "../index.js";
import { mahasiswa } from "../mahasiswa.js";
import { skripsi } from "../skripsi.js";

async function seedSkripsi() {
  try {
    const data = [
      {
        nim: "24520017",
        judul: "Penerapan Machine Learning untuk Prediksi Kelulusan",
        abstrak: "Penelitian tentang prediksi kelulusan mahasiswa menggunakan machine learning.",
        tahun: 2026,
        status: "diajukan" as const,
      },
      {
        nim: "24520018",
        judul: "Analisis Data Akademik Menggunakan Metode Apriori",
        abstrak: "Penelitian pola data akademik menggunakan algoritma Apriori.",
        tahun: 2026,
        status: "draft" as const,
      },
      {
        nim: "24520019",
        judul: "Pengembangan Sistem Informasi Repository Skripsi",
        abstrak: "Penelitian tentang pengembangan sistem repository skripsi berbasis web.",
        tahun: 2026,
        status: "diajukan" as const,
      },
    ];

    for (const item of data) {
      const [dataMahasiswa] = await db
        .select()
        .from(mahasiswa)
        .where(eq(mahasiswa.nim, item.nim))
        .limit(1);

      if (!dataMahasiswa) {
        throw new Error(
          `Mahasiswa dengan NIM ${item.nim} belum tersedia. Jalankan seedMahasiswa.ts terlebih dahulu.`
        );
      }

      await db.insert(skripsi).values({
        mahasiswaId: dataMahasiswa.id,
        judul: item.judul,
        abstrak: item.abstrak,
        tahun: item.tahun,
        status: item.status,
      });

      console.log(`Skripsi untuk NIM ${item.nim} berhasil ditambahkan`);
    }
  } catch (error) {
    console.error("Seed skripsi gagal:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedSkripsi();
