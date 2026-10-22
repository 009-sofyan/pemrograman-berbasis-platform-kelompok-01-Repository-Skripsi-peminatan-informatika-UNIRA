
import bcrypt from "bcrypt";
import { db, pool } from "../index.js";
import { users } from "../users.js";

async function seedUsers() {
  try {
    const akun = [
      {
        nama: "Admin Tendik",
        email: "tendik@unira.com",
        password: "tendik123",
        role: "tendik" as const,
      },
      {
        nama: "Ketua Program Studi",
        email: "kaprodi@unira.com",
        password: "kaprodi123",
        role: "kaprodi" as const,
      },
      {
        nama: "Mahasiswa UNIRA",
        email: "mahasiswa@unira.ac.id",
        password: "121212",
        role: "mahasiswa" as const,
      },
    ];

    for (const akunBaru of akun) {
      const passwordHash = await bcrypt.hash(
        akunBaru.password,
        10
      );

      await db
        .insert(users)
        .values({
          nama: akunBaru.nama,
          email: akunBaru.email,
          password: passwordHash,
          role: akunBaru.role,
        })
        .onDuplicateKeyUpdate({
          set: {
            nama: akunBaru.nama,
            password: passwordHash,
            role: akunBaru.role,
          },
        });

      console.log(`Akun ${akunBaru.role} berhasil disiapkan`);
    }

    console.log("Seed users berhasil dijalankan");
  } catch (error) {
    console.error("Seed users gagal:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedUsers();
