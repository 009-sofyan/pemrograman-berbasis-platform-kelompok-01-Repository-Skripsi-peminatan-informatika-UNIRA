
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, pool } from "../index.js";
import { users } from "../users.js";
import { mahasiswa } from "../mahasiswa.js";

async function seedMahasiswa() {
  try {
    const data = [
      {
        nama: "Dina Putri",
        email: "dina@unira.ac.id",
        password: "dina123",
        nim: "24520017",
        programStudi: "Informatika",
        peminatan: "Artificial Intelligence",
      },
      {
        nama: "Rizky Pratama",
        email: "rizky@unira.ac.id",
        password: "rizky123",
        nim: "24520018",
        programStudi: "Informatika",
        peminatan: "Business Intelligence",
      },
      {
        nama: "Siti Rahma",
        email: "siti@unira.ac.id",
        password: "siti123",
        nim: "24520019",
        programStudi: "Informatika",
        peminatan: "Software Engineering",
      },
    ];

    for (const item of data) {
      const passwordHash = await bcrypt.hash(item.password, 10);

      await db
        .insert(users)
        .values({
          nama: item.nama,
          email: item.email,
          password: passwordHash,
          role: "mahasiswa",
        })
        .onDuplicateKeyUpdate({
          set: {
            nama: item.nama,
            password: passwordHash,
            role: "mahasiswa",
          },
        });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, item.email))
        .limit(1);

      if (!user) {
        throw new Error(`User ${item.email} tidak ditemukan`);
      }

      await db
        .insert(mahasiswa)
        .values({
          userId: user.id,
          nim: item.nim,
          programStudi: item.programStudi,
          peminatan: item.peminatan,
        })
        .onDuplicateKeyUpdate({
          set: {
            programStudi: item.programStudi,
            peminatan: item.peminatan,
          },
        });

      console.log(`Mahasiswa ${item.nama} berhasil disiapkan`);
    }
  } catch (error) {
    console.error("Seed mahasiswa gagal:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedMahasiswa();
