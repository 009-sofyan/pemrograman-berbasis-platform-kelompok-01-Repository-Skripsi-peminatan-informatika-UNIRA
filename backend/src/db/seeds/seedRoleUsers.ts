import bcrypt from "bcrypt";
import { db, pool } from "../index.js";
import { users } from "../users.js";

async function seedRoleUsers() {
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
    } catch (error) {
        console.error("Gagal membuat akun pengujian:", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}
seedRoleUsers();