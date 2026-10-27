import type { Response } from "express";
import { count, eq, desc, and, like} from "drizzle-orm";
import { db } from "../db/index.js";
import { skripsi } from "../db/skripsi.js";
import { mahasiswa } from "../db/mahasiswa.js";
import type { AuthRequest } from "../middlewares/authMiddleware";

export async function createSkripsi(
    req: AuthRequest,
    res: Response 
) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Autentikasi diperlukan",
            });
        }
        if (req.user.role !== "mahasiswa") {
            return res.status(403).json({
                message: "Hanya mahasiswa yang dapat menambahkan skripsi",
            });
        }
        const { judul, abstrak, tahun} = req.body;
        if(
            typeof judul !== "string" ||
            !judul.trim() ||
            !Number.isInteger(Number(tahun)) ||
            Number (tahun) < 1900 ||
            Number (tahun) > new Date().getFullYear()
        ) {
            return res.status(400).json({
                message: "Judul dan tahun skripsi tidak valid",
            });
        }
        const [dataMahasiswa] = await db
            .select({ id: mahasiswa.id })
            .from(mahasiswa)
            .where(eq(mahasiswa.userId, req.user.id))
            .limit(1);

        if (!dataMahasiswa) {
            return res.status(404).json({
                message: "Data mahasiswa belum terdaftar",
            });
        }
        const [result] = await db
            .insert(skripsi)
            .values({
                mahasiswaId: dataMahasiswa.id,
                judul: judul.trim(),
                abstrak: typeof abstrak === "string" ? abstrak.trim() : null,
                tahun: Number(tahun),
            });
        return res.status(201).json({
            message: "Skripsi berhasil ditambahkan",
            id: result.insertId,
        });
    } catch (error) {
        console.log("Gagal menambahkan skripsi:", error);
        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
        });
    }
}


export async function getSkripsi(
  req: AuthRequest,
  res: Response
) {
  try {
    const { search, tahun, programStudi, peminatan } = req.query;

    const conditions = [];

    if (typeof search === "string" && search.trim()) {
      conditions.push(like(skripsi.judul, `%${search.trim()}%`));
    }

    if (typeof tahun === "string" && tahun.trim()) {
      const tahunNumber = Number(tahun);

      if (!Number.isInteger(tahunNumber) || tahunNumber < 1900) {
        return res.status(400).json({
          message: "Filter tahun tidak valid",
        });
      }

      conditions.push(eq(skripsi.tahun, tahunNumber));
    }

    if (typeof programStudi === "string" && programStudi.trim()) {
      conditions.push(
        like(mahasiswa.programStudi, `%${programStudi.trim()}%`)
      );
    }

    if (typeof peminatan === "string" && peminatan.trim()) {
      conditions.push(
        like(mahasiswa.peminatan, `%${peminatan.trim()}%`)
      );
    }

    const query = db
      .select({
        id: skripsi.id,
        judul: skripsi.judul,
        abstrak: skripsi.abstrak,
        tahun: skripsi.tahun,
        fileUrl: skripsi.fileUrl,
        status: skripsi.status,
        createdAt: skripsi.createdAt,
        mahasiswaId: mahasiswa.id,
        nim: mahasiswa.nim,
        programStudi: mahasiswa.programStudi,
        peminatan: mahasiswa.peminatan,
      })
      .from(skripsi)
      .innerJoin(
        mahasiswa,
        eq(skripsi.mahasiswaId, mahasiswa.id)
      );

    const data = await (
      conditions.length > 0
        ? query.where(and(...conditions))
        : query
    ).orderBy(desc(skripsi.createdAt));

    return res.status(200).json({
      message: "Daftar skripsi berhasil diambil",
      total: data.length,
      data,
    });
  } catch (error) {
    console.error("Gagal mengambil daftar skripsi:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
}

export async function getSkripsiById(
    req: AuthRequest,
    res: Response
) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID skripsi tidak valid",
            });
        }

        const [data] = await db
            .select({
                id: skripsi.id,
                judul: skripsi.judul,
                abstrak: skripsi.abstrak,
                tahun: skripsi.tahun,
                fileUrl: skripsi.fileUrl,
                status: skripsi.status,
                createdAt: skripsi.createdAt,
                mahasiswaId: mahasiswa.id,
                nim: mahasiswa.nim,
                programStudi: mahasiswa.programStudi,
                peminatan: mahasiswa.peminatan,
            })
            .from(skripsi)
            .innerJoin(
                mahasiswa,
                eq(skripsi.mahasiswaId, mahasiswa.id)
            )
            .where(eq(skripsi.id, id))
            .limit(1);

        if (!data) {
            return res.status(404).json({
                message: "Skripsi tidak ditemukan",
            });
        }

        return res.status(200).json({
            message: "Detail skripsi berhasil diambil",
            data,
        });
    } catch (error) {
        console.error("Gagal mengambil detail skripsi:", error);

        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
        });
    }
}


export async function updateSkripsi(
    req: AuthRequest,
    res: Response
) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Autentikasi diperlukan",
            });
        }

        if (req.user.role !== "mahasiswa") {
            return res.status(403).json({
                message: "Hanya mahasiswa yang dapat mengedit skripsi",
            });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID skripsi tidak valid",
            });
        }

        const { judul, abstrak, tahun } = req.body;

        if (
            (judul !== undefined &&
                (typeof judul !== "string" || !judul.trim())) ||
            (abstrak !== undefined &&
                abstrak !== null &&
                typeof abstrak !== "string") ||
            (tahun !== undefined &&
                (!Number.isInteger(Number(tahun)) ||
                    Number(tahun) < 1900 ||
                    Number(tahun) > new Date().getFullYear()))
        ) {
            return res.status(400).json({
                message: "Data skripsi tidak valid",
            });
        }

        if (
            judul === undefined &&
            abstrak === undefined &&
            tahun === undefined
        ) {
            return res.status(400).json({
                message: "Tidak ada data yang diubah",
            });
        }

        const [dataMahasiswa] = await db
            .select({ id: mahasiswa.id })
            .from(mahasiswa)
            .where(eq(mahasiswa.userId, req.user.id))
            .limit(1);

        if (!dataMahasiswa) {
            return res.status(404).json({
                message: "Data mahasiswa tidak ditemukan",
            });
        }

        const [dataSkripsi] = await db
            .select({
                id: skripsi.id,
                status: skripsi.status,
            })
            .from(skripsi)
            .where(eq(skripsi.id, id))
            .limit(1);

        if (!dataSkripsi) {
            return res.status(404).json({
                message: "Skripsi tidak ditemukan",
            });
        }

        const [milikMahasiswa] = await db
            .select({ id: skripsi.id })
            .from(skripsi)
            .where(eq(skripsi.id, id))
            .limit(1);

        if (!milikMahasiswa) {
            return res.status(404).json({
                message: "Skripsi tidak ditemukan",
            });
        }

        const [pemilikSkripsi] = await db
            .select({ mahasiswaId: skripsi.mahasiswaId })
            .from(skripsi)
            .where(eq(skripsi.id, id))
            .limit(1);

        if (pemilikSkripsi?.mahasiswaId !== dataMahasiswa.id) {
            return res.status(403).json({
                message: "Kamu tidak dapat mengedit skripsi milik pengguna lain",
            });
        }

        if (dataSkripsi.status !== "draft" &&
            dataSkripsi.status !== "ditolak") {
            return res.status(400).json({
                message: "Skripsi hanya dapat diedit saat berstatus draft atau ditolak",
            });
        }

        const values: {
            judul?: string;
            abstrak?: string | null;
            tahun?: number;
        } = {};

        if (judul !== undefined) values.judul = judul.trim();
        if (abstrak !== undefined) {
            values.abstrak =
                abstrak === null ? null : abstrak.trim();
        }
        if (tahun !== undefined) values.tahun = Number(tahun);

        await db
            .update(skripsi)
            .set(values)
            .where(eq(skripsi.id, id));

        return res.status(200).json({
            message: "Skripsi berhasil diperbarui",
        });
    } catch (error) {
        console.error("Gagal memperbarui skripsi:", error);

        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
        });
    }
}


export async function deleteSkripsi(
    req: AuthRequest,
    res: Response
) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Autentikasi diperlukan",
            });
        }

        if (req.user.role !== "mahasiswa") {
            return res.status(403).json({
                message: "Hanya mahasiswa yang dapat menghapus skripsi",
            });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID skripsi tidak valid",
            });
        }

        const [dataMahasiswa] = await db
            .select({ id: mahasiswa.id })
            .from(mahasiswa)
            .where(eq(mahasiswa.userId, req.user.id))
            .limit(1);

        if (!dataMahasiswa) {
            return res.status(404).json({
                message: "Data mahasiswa tidak ditemukan",
            });
        }

        const [dataSkripsi] = await db
            .select({
                id: skripsi.id,
                mahasiswaId: skripsi.mahasiswaId,
                status: skripsi.status,
            })
            .from(skripsi)
            .where(eq(skripsi.id, id))
            .limit(1);

        if (!dataSkripsi) {
            return res.status(404).json({
                message: "Skripsi tidak ditemukan",
            });
        }

        if (dataSkripsi.mahasiswaId !== dataMahasiswa.id) {
            return res.status(403).json({
                message: "Kamu tidak dapat menghapus skripsi milik pengguna lain",
            });
        }

        if (dataSkripsi.status !== "draft" &&
            dataSkripsi.status !== "ditolak") {
            return res.status(400).json({
                message: "Skripsi hanya dapat dihapus saat berstatus draft atau ditolak",
            });
        }

        await db
            .delete(skripsi)
            .where(eq(skripsi.id, id));

        return res.status(200).json({
            message: "Skripsi berhasil dihapus",
        });
    } catch (error) {
        console.error("Gagal menghapus skripsi:", error);

        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
        });
    }
}


export async function submitSkripsi(
    req: AuthRequest,
    res: Response
) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Autentikasi diperlukan",
            });
        }

        if (req.user.role !== "mahasiswa") {
            return res.status(403).json({
                message: "Hanya mahasiswa yang dapat mengajukan skripsi",
            });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID skripsi tidak valid",
            });
        }

        const [dataMahasiswa] = await db
            .select({ id: mahasiswa.id })
            .from(mahasiswa)
            .where(eq(mahasiswa.userId, req.user.id))
            .limit(1);

        if (!dataMahasiswa) {
            return res.status(404).json({
                message: "Data mahasiswa tidak ditemukan",
            });
        }

        const [dataSkripsi] = await db
            .select({
                id: skripsi.id,
                mahasiswaId: skripsi.mahasiswaId,
                status: skripsi.status,
            })
            .from(skripsi)
            .where(eq(skripsi.id, id))
            .limit(1);

        if (!dataSkripsi) {
            return res.status(404).json({
                message: "Skripsi tidak ditemukan",
            });
        }

        if (dataSkripsi.mahasiswaId !== dataMahasiswa.id) {
            return res.status(403).json({
                message: "Kamu tidak dapat mengajukan skripsi milik pengguna lain",
            });
        }

        if (
            dataSkripsi.status !== "draft" &&
            dataSkripsi.status !== "ditolak"
        ) {
            return res.status(400).json({
                message: "Skripsi tidak dapat diajukan pada status saat ini",
            });
        }

        await db
            .update(skripsi)
            .set({ status: "diajukan" })
            .where(eq(skripsi.id, id));

        return res.status(200).json({
            message: "Skripsi berhasil diajukan untuk verifikasi",
            status: "diajukan",
        });
    } catch (error) {
        console.error("Gagal mengajukan skripsi:", error);

        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
        });
    }
}






