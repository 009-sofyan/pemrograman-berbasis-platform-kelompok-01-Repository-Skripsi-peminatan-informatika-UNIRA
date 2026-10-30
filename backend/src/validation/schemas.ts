import { z } from "zod";

export const PEMINATAN_VALUES = [
    "Business Intelligence",
    "Smart Agriculture",
] as const;

export const ROLE_VALUES = ["mahasiswa", "kaprodi", "tendik"] as const;

export const SKRIPSI_STATUS_VALUES = [
    "draft",
    "diajukan",
    "disetujui",
    "ditolak",
] as const;

export const PASSWORD_MAX_BYTES = 72;

const currentYear = new Date().getFullYear();

function requiredString(label: string, min: number, max: number) {
    return z
        .string({ error: `${label} wajib diisi` })
        .trim()
        .min(min, `${label} minimal ${min} karakter`)
        .max(max, `${label} maksimal ${max} karakter`);
}

function optionalQueryNumber(schema: z.ZodType<number, unknown>) {
    return z.preprocess(
        (value) =>
            value === "" || value === undefined ? undefined : value,
        schema.optional()
    );
}

export const emailSchema = z
    .string({ error: "Email wajib diisi" })
    .trim()
    .toLowerCase()
    .min(1, "Email wajib diisi")
    .max(100, "Email maksimal 100 karakter")
    .email("Format email tidak valid");

export const passwordRegistrationSchema = z
    .string({ error: "Password wajib diisi" })
    .min(8, "Password minimal 8 karakter")
    .refine(
        (value) => Buffer.byteLength(value, "utf8") <= PASSWORD_MAX_BYTES,
        `Password maksimal ${PASSWORD_MAX_BYTES} byte`
    )
    .refine(
        (value) => value.trim().length > 0,
        "Password tidak boleh hanya berisi spasi"
    );

// Login tidak menerapkan minimum 8 karakter agar akun lama dengan password
// pendek tetap dapat masuk. Batas bcrypt tetap wajib dipatuhi.
export const passwordLoginSchema = z
    .string({ error: "Password wajib diisi" })
    .min(1, "Password wajib diisi")
    .refine(
        (value) => Buffer.byteLength(value, "utf8") <= PASSWORD_MAX_BYTES,
        `Password maksimal ${PASSWORD_MAX_BYTES} byte`
    );

export const registerSchema = z
    .object({
        nama: requiredString("Nama", 2, 100),
        email: emailSchema,
        password: passwordRegistrationSchema,
    })
    .strict("Field tidak diizinkan pada request registrasi");

export const loginSchema = z
    .object({
        email: emailSchema,
        password: passwordLoginSchema,
    })
    .strict("Field tidak diizinkan pada request login");

export const idParamSchema = z.object({
    id: z
        .string({ error: "ID tidak valid" })
        .regex(/^\d+$/, "ID tidak valid")
        .refine((value) => {
            const parsed = Number(value);
            return (
                Number.isSafeInteger(parsed) &&
                parsed > 0 &&
                parsed <= 2_147_483_647
            );
        }, "ID tidak valid"),
});

export const createMahasiswaSchema = z
    .object({
        email: emailSchema,
        nim: z
            .string({ error: "NIM wajib diisi" })
            .trim()
            .regex(/^\d{5,20}$/, "NIM harus terdiri dari 5-20 digit angka"),
        programStudi: requiredString("Program studi", 2, 100),
    })
    .strict("Field tidak diizinkan pada data mahasiswa");

export const updateMahasiswaSchema = z
    .object({
        nama: requiredString("Nama", 2, 100),
        email: emailSchema,
        nim: z
            .string({ error: "NIM wajib diisi" })
            .trim()
            .regex(/^\d{5,20}$/, "NIM harus terdiri dari 5-20 digit angka"),
        programStudi: requiredString("Program studi", 2, 100),
        // Data lama dapat berisi nilai peminatan di luar dua pilihan resmi
        // (mis. "Smart Algiculture"). Nilai tersebut tetap harus berupa teks
        // dengan panjang wajar agar tendik tidak kehilangan kemampuan
        // memperbarui data lama. Pilihan mahasiswa tetap dibatasi enumerasi
        // pada pilihPeminatanSchema.
        peminatan: z
            .string({ error: "Peminatan harus berupa teks" })
            .trim()
            .max(100, "Peminatan maksimal 100 karakter")
            .nullable()
            .optional(),
    })
    .strict("Field tidak diizinkan pada data mahasiswa");

export const pilihPeminatanSchema = z
    .object({
        peminatan: z.enum(PEMINATAN_VALUES, {
            error: "Peminatan harus Business Intelligence atau Smart Agriculture",
        }),
    })
    .strict("Field tidak diizinkan pada data peminatan");

const tahunSkripsiSchema = z.coerce
    .number({ error: "Tahun skripsi wajib diisi" })
    .int("Tahun skripsi harus bilangan bulat")
    .min(1900, "Tahun skripsi minimal 1900")
    .max(currentYear, `Tahun skripsi maksimal ${currentYear}`);

export const createSkripsiSchema = z
    .object({
        judul: requiredString("Judul skripsi", 5, 255),
        abstrak: z
            .string({ error: "Abstrak harus berupa teks" })
            .trim()
            .max(3000, "Abstrak maksimal 3000 karakter")
            .nullable()
            .optional(),
        tahun: tahunSkripsiSchema,
    })
    .strict("Field tidak diizinkan pada data skripsi");

export const updateSkripsiSchema = z
    .object({
        judul: requiredString("Judul skripsi", 5, 255).optional(),
        abstrak: z
            .string({ error: "Abstrak harus berupa teks" })
            .trim()
            .max(3000, "Abstrak maksimal 3000 karakter")
            .nullable()
            .optional(),
        tahun: tahunSkripsiSchema.optional(),
    })
    .strict("Field tidak diizinkan pada data skripsi")
    .refine(
        (value) => Object.keys(value).length > 0,
        "Tidak ada data skripsi yang diubah"
    );

const searchQuerySchema = z
    .string({ error: "Kata kunci pencarian harus berupa teks" })
    .trim()
    .max(100, "Kata kunci pencarian maksimal 100 karakter")
    .optional();

const tahunQuerySchema = optionalQueryNumber(
    z.coerce
        .number({ error: "Filter tahun harus berupa angka" })
        .int("Filter tahun harus bilangan bulat")
        .min(1900, "Filter tahun minimal 1900")
        .max(currentYear, `Filter tahun maksimal ${currentYear}`)
);

const pageQuerySchema = optionalQueryNumber(
    z.coerce
        .number({ error: "Halaman harus berupa angka" })
        .int("Halaman harus bilangan bulat")
        .min(1, "Halaman minimal 1")
        .max(100_000, "Halaman terlalu besar")
);

const limitQuerySchema = optionalQueryNumber(
    z.coerce
        .number({ error: "Limit harus berupa angka" })
        .int("Limit harus bilangan bulat")
        .min(1, "Limit minimal 1")
        .max(100, "Limit maksimal 100")
);

export const skripsiListQuerySchema = z
    .object({
        search: searchQuerySchema,
        tahun: tahunQuerySchema,
        programStudi: z
            .string({ error: "Program studi harus berupa teks" })
            .trim()
            .max(100, "Filter program studi maksimal 100 karakter")
            .optional(),
        peminatan: z
            .string({ error: "Peminatan harus berupa teks" })
            .trim()
            .max(100, "Filter peminatan maksimal 100 karakter")
            .optional(),
        page: pageQuerySchema,
        limit: limitQuerySchema,
    })
    .strict("Parameter query tidak dikenal");

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMahasiswaInput = z.infer<typeof createMahasiswaSchema>;
export type UpdateMahasiswaInput = z.infer<typeof updateMahasiswaSchema>;
export type PilihPeminatanInput = z.infer<typeof pilihPeminatanSchema>;
export type CreateSkripsiInput = z.infer<typeof createSkripsiSchema>;
export type UpdateSkripsiInput = z.infer<typeof updateSkripsiSchema>;
export type SkripsiListQuery = z.infer<typeof skripsiListQuerySchema>;
