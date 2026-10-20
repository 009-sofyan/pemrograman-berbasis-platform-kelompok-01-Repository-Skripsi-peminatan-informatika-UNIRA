import { db } from "../index.js";
import { users } from "../users.js";

async function seedUsers() {
  await db.insert(users).values([
    {
      nama: "Admin Tendik",
      email: "tendik@unira.ac.id",
      password: "121212",
      role: "tendik",
    },
    {
      nama: "Ketua Program Studi",
      email: "kaprodi@unira.ac.id",
      password: "121212",
      role: "kaprodi",
    },
    {
      nama: "Mahasiswa UNIRA",
      email: "mahasiswa@unira.ac.id",
      password: "121212",
      role: "mahasiswa",
    },
  ]);

  console.log("Seed users Repository Skripsi FT UNIRA berhasil");
}

seedUsers()
  .catch((error) => {
    console.error("Seed users gagal:", error);
    process.exitCode = 1;
  });
