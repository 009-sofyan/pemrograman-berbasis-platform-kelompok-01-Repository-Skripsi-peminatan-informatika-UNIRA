import type { Response } from "express";
import { eq, desc, and, like, or, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { skripsi } from "../db/skripsi.js";
import { mahasiswa } from "../db/mahasiswa.js";
import { users } from "../db/users.js";
import type { AuthRequest } from "../middlewares/authMiddleware";
import type { SkripsiUploadContext } from "../middlewares/precheckSkripsiUpload.js";
import fs from "node:fs";
import {
    deleteStoredCoverFile,
    deleteStoredSkripsiFile,
    deleteUploadedTempFile,
    resolveStoredSkripsiPath,
    storedSkripsiFileExists,
    toPublicCoverUrl,
    toSkripsiDownloadUrl,
    toStoredSkripsiFileUrl,
} from "../utils/uploads.js";

type UserRole = NonNullable<AuthRequest["user"]>["role"];
type SkripsiStatus = "draft" | "diajukan" | "disetujui" | "ditolak";

const PDF_SIGNATURE = Buffer.from("%PDF-", "ascii");

async function hasPdfMagicBytes(filePath: string): Promise<boolean> {
    const handle = await fs.promises.open(filePath, "r");

    try {
        const buffer = Buffer.alloc(PDF_SIGNATURE.length);
        const { bytesRead } = await handle.read(
            buffer,
            0,
            PDF_SIGNATURE.length,
            0
        );

        return (
            bytesRead === PDF_SIGNATURE.length &&
            buffer.equals(PDF_SIGNATURE)
        );
    } finally {
        await handle.close();
    }
}

/**
 * Nama unduhan dibuat dari judul, lalu dibatasi ke huruf/angka/dash. Dengan
 * begitu tidak ada karakter kontrol, kutip, slash, atau newline yang bisa
 * menyusup ke header Content-Disposition.
 */
function slugifySkripsiTitle(value: string): string {
    const slug = value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)
        .replace(/-+$/g, "");

    return slug || "skripsi";
}

function pdfDownloadFileName(id: number, judul: string): string {
    return `${slugifySkripsiTitle(judul)}-${id}.pdf`;
}

function contentDisposition(
    mode: "inline" | "attachment",
    fileName: string
): string {
    const ascii = fileName
        .replace(/[^\x20-\x7E]/g, "_")
        .replace(/["\\]/g, "_");

    return `${mode}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(
        fileName
    )}`;
}

interface ResolvedSkripsiPdf {
    filePath: string;
    fileName: string;
}

/**
 * Path file selalu berasal dari kolom database, bukan dari parameter request.
 * File juga harus benar-benar PDF (magic bytes), bukan sekadar berekstensi
 * .pdf.
 */
async function resolveSkripsiPdfFile(data: {
    id: number;
    judul: string;
    fileUrl: string | null;
}): Promise<ResolvedSkripsiPdf | null> {
    if (!data.fileUrl) return null;

    const filePath = resolveStoredSkripsiPath(data.fileUrl);

    if (!filePath) return null;

    let fileStat: fs.Stats;

    try {
        fileStat = await fs.promises.stat(filePath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return null;
        }

        throw error;
    }

    if (!fileStat.isFile()) return null;

    if (!(await hasPdfMagicBytes(filePath))) {
        return null;
    }

    return {
        filePath,
        fileName: pdfDownloadFileName(data.id, data.judul),
    };
}

function sendSkripsiPdf(
    res: Response,
    resolved: ResolvedSkripsiPdf,
    options: { inline: boolean; cacheControl: string }
) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        contentDisposition(
            options.inline ? "inline" : "attachment",
            resolved.fileName
        )
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", options.cacheControl);

    return res.sendFile(
        resolved.filePath,
        { dotfiles: "deny" },
        (error) => {
            if (!error) return;

            console.error("Gagal mengirim file skripsi:", error);

            if (res.headersSent) return;

            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                res.status(404).json({
                    message: "File PDF skripsi tidak ditemukan",
                });
                return;
            }

            res.status(500).json({
                message: "Gagal mengunduh file skripsi",
            });
        }
    );
}

function wantsInlinePdf(req: AuthRequest): boolean {
    return req.query.inline === "1";
}

async function getMahasiswaIdByUserId(
    userId: number
): Promise<number | null> {
    const [data] = await db
        .select({ id: mahasiswa.id })
        .from(mahasiswa)
        .where(eq(mahasiswa.userId, userId))
        .limit(1);

    return data?.id ?? null;
}

/**
 * Aturan akses baca skripsi:
 * - Kaprodi dan Tendik boleh melihat semua status.
 * - Mahasiswa boleh melihat skripsi miliknya sendiri (semua status)
 *   dan skripsi milik mahasiswa lain yang sudah disetujui.
 */
export function canAccessSkripsi(
    role: UserRole,
    viewerMahasiswaId: number | null,
    skripsiMahasiswaId: number,
    status: SkripsiStatus
): boolean {
    if (role === "kaprodi" || role === "tendik") {
        return true;
    }

    if (role !== "mahasiswa") {
        return false;
    }

    if (status === "disetujui") {
        return true;
    }

    return (
        viewerMahasiswaId !== null &&
        viewerMahasiswaId === skripsiMahasiswaId
    );
}

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
            coverUrl: null,
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
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Autentikasi diperlukan",
      });
    }

    const { search, tahun, programStudi, peminatan } = req.query;

    const conditions = [];
    let viewerMahasiswaId: number | null = null;

    if (user.role === "mahasiswa") {
      viewerMahasiswaId = await getMahasiswaIdByUserId(user.id);

      if (viewerMahasiswaId === null) {
        // Akun mahasiswa yang belum memiliki data akademik tetap boleh
        // menelusuri katalog skripsi yang sudah disetujui.
        conditions.push(eq(skripsi.status, "disetujui"));
      } else {
        const accessCondition = or(
          eq(skripsi.mahasiswaId, viewerMahasiswaId),
          eq(skripsi.status, "disetujui")
        );

        if (accessCondition) {
          conditions.push(accessCondition);
        }
      }
    } else if (user.role !== "kaprodi" && user.role !== "tendik") {
      return res.status(403).json({
        message: "Kamu tidak memiliki izin untuk mengakses fitur ini",
      });
    }

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
        coverUrl: skripsi.coverUrl,
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

    const rows = await (
      conditions.length > 0
        ? query.where(and(...conditions))
        : query
    ).orderBy(desc(skripsi.createdAt));

    const data = rows.map((item) => ({
      ...item,
      fileUrl:
        canAccessSkripsi(
          user.role,
          viewerMahasiswaId,
          item.mahasiswaId,
          item.status
        ) && item.fileUrl
          ? toSkripsiDownloadUrl(item.id)
          : null,
      coverUrl: toPublicCoverUrl(item.coverUrl),
    }));

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

export async function getPublicSkripsi(
  req: AuthRequest,
  res: Response
) {
  try {
    const { search, tahun, peminatan } = req.query;
    const conditions = [eq(skripsi.status, "disetujui")];

    if (typeof search === "string" && search.trim()) {
      const keyword = `%${search.trim()}%`;
      const searchCondition = or(
        like(skripsi.judul, keyword),
        like(users.nama, keyword)
      );

      if (searchCondition) conditions.push(searchCondition);
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

    if (typeof peminatan === "string" && peminatan.trim()) {
      conditions.push(like(mahasiswa.peminatan, `%${peminatan.trim()}%`));
    }

    const rows = await db
      .select({
        id: skripsi.id,
        judul: skripsi.judul,
        abstrak: skripsi.abstrak,
        tahun: skripsi.tahun,
        fileUrl: skripsi.fileUrl,
        coverUrl: skripsi.coverUrl,
        status: skripsi.status,
        createdAt: skripsi.createdAt,
        nim: mahasiswa.nim,
        programStudi: mahasiswa.programStudi,
        peminatan: mahasiswa.peminatan,
        namaMahasiswa: users.nama,
      })
      .from(skripsi)
      .innerJoin(mahasiswa, eq(skripsi.mahasiswaId, mahasiswa.id))
      .innerJoin(users, eq(mahasiswa.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(skripsi.tahun), desc(skripsi.createdAt));

    const data = rows.map((item) => ({
      ...item,
      fileUrl: item.fileUrl
        ? toSkripsiDownloadUrl(item.id)
        : null,
      coverUrl: toPublicCoverUrl(item.coverUrl),
    }));

    return res.status(200).json({
      message: "Katalog skripsi publik berhasil diambil",
      total: data.length,
      data,
    });
  } catch (error) {
    console.error("Gagal mengambil katalog skripsi publik:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
}

export async function getPublicSkripsiById(
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
        coverUrl: skripsi.coverUrl,
        status: skripsi.status,
        createdAt: skripsi.createdAt,
        nim: mahasiswa.nim,
        programStudi: mahasiswa.programStudi,
        peminatan: mahasiswa.peminatan,
        namaMahasiswa: users.nama,
      })
      .from(skripsi)
      .innerJoin(mahasiswa, eq(skripsi.mahasiswaId, mahasiswa.id))
      .innerJoin(users, eq(mahasiswa.userId, users.id))
      .where(and(eq(skripsi.id, id), eq(skripsi.status, "disetujui")))
      .limit(1);

    if (!data) {
      return res.status(404).json({
        message: "Skripsi tidak ditemukan atau belum disetujui",
      });
    }

    return res.status(200).json({
      message: "Detail skripsi publik berhasil diambil",
      data: {
        ...data,
        fileUrl: data.fileUrl
          ? toSkripsiDownloadUrl(data.id)
          : null,
        coverUrl: toPublicCoverUrl(data.coverUrl),
      },
    });
  } catch (error) {
    console.error("Gagal mengambil detail skripsi publik:", error);

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
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                message: "Autentikasi diperlukan",
            });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID skripsi tidak valid",
            });
        }

        const viewerMahasiswaId =
            user.role === "mahasiswa"
                ? await getMahasiswaIdByUserId(user.id)
                : null;

        const [data] = await db
            .select({
                id: skripsi.id,
                judul: skripsi.judul,
                abstrak: skripsi.abstrak,
                tahun: skripsi.tahun,
                fileUrl: skripsi.fileUrl,
                coverUrl: skripsi.coverUrl,
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

        // Gunakan 404 untuk skripsi yang tidak boleh diakses agar keberadaan
        // draft/ditolak milik mahasiswa lain tidak mudah ditebak.
        if (
            !canAccessSkripsi(
                user.role,
                viewerMahasiswaId,
                data.mahasiswaId,
                data.status
            )
        ) {
            return res.status(404).json({
                message: "Skripsi tidak ditemukan",
            });
        }

        return res.status(200).json({
            message: "Detail skripsi berhasil diambil",
            data: {
                ...data,
                fileUrl:
                    canAccessSkripsi(
                        user.role,
                        viewerMahasiswaId,
                        data.mahasiswaId,
                        data.status
                    ) && data.fileUrl
                        ? toSkripsiDownloadUrl(data.id)
                        : null,
                coverUrl: toPublicCoverUrl(data.coverUrl),
            },
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
                coverUrl: skripsi.coverUrl,
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
            coverUrl: toPublicCoverUrl(dataSkripsi.coverUrl),
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
                fileUrl: skripsi.fileUrl,
                coverUrl: skripsi.coverUrl,
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

        // File fisik dihapus setelah data database berhasil dihapus. Jika
        // penghapusan file gagal, data utama tetap konsisten dan hanya
        // menyisakan file yatim yang dapat dibersihkan terpisah.
        await deleteStoredSkripsiFile(dataSkripsi.fileUrl);
        await deleteStoredCoverFile(dataSkripsi.coverUrl);

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
                fileUrl: skripsi.fileUrl,
                coverUrl: skripsi.coverUrl,
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

        if (!dataSkripsi.fileUrl) {
            return res.status(400).json({
                message:
                    "Unggah file PDF terlebih dahulu sebelum mengajukan skripsi",
            });
        }

        if (!(await storedSkripsiFileExists(dataSkripsi.fileUrl))) {
            return res.status(400).json({
                message:
                    "File PDF skripsi tidak ditemukan. Unggah ulang file sebelum mengajukan",
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

export async function uploadFileSkripsi(
    req: AuthRequest,
    res: Response
) {
    let databaseUpdated = false;

    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Autentikasi diperlukan",
            });
        }

        const uploadContext = res.locals
            .skripsiUpload as SkripsiUploadContext | undefined;

        if (!uploadContext) {
            return res.status(500).json({
                message: "Konteks upload skripsi tidak tersedia",
            });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID skripsi tidak valid",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "File PDF wajib diunggah",
            });
        }

        if (!(await hasPdfMagicBytes(req.file.path))) {
            await deleteUploadedTempFile(req.file.path);

            return res.status(400).json({
                message:
                    "File bukan PDF valid. Signature file harus diawali %PDF-",
            });
        }

        const storedFileUrl = toStoredSkripsiFileUrl(
            req.file.filename
        );

        const [result] = await db
            .update(skripsi)
            .set({ fileUrl: storedFileUrl })
            .where(
                and(
                    eq(skripsi.id, id),
                    inArray(skripsi.status, ["draft", "ditolak"])
                )
            );

        if (result.affectedRows === 0) {
            await deleteUploadedTempFile(req.file.path);

            return res.status(409).json({
                message:
                    "File skripsi hanya dapat diunggah saat berstatus draft atau ditolak",
            });
        }

        databaseUpdated = true;

        // File lama baru dihapus setelah database berhasil menunjuk ke file
        // baru. Jika proses sebelumnya gagal, file lama tetap dipertahankan.
        await deleteStoredSkripsiFile(uploadContext.fileUrl);

        return res.status(200).json({
            message: "File skripsi berhasil diunggah",
            fileUrl: toSkripsiDownloadUrl(id),
        });
    } catch (error) {
        if (!databaseUpdated && req.file) {
            await deleteUploadedTempFile(req.file.path);
        }

        console.error("Gagal mengunggah file skripsi:", error);

        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
        });
    }
}

/**
 * Unduhan publik: hanya skripsi berstatus disetujui. Status lain sengaja
 * dijawab 404 agar keberadaan draft/dokumen yang belum terverifikasi tidak
 * bisa ditebak dari perbedaan kode respons.
 */
export async function downloadSkripsi(
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
                status: skripsi.status,
                fileUrl: skripsi.fileUrl,
            })
            .from(skripsi)
            .where(
                and(
                    eq(skripsi.id, id),
                    eq(skripsi.status, "disetujui")
                )
            )
            .limit(1);

        if (!data) {
            return res.status(404).json({
                message: "Dokumen tidak tersedia",
            });
        }

        const resolved = await resolveSkripsiPdfFile(data);

        if (!resolved) {
            return res.status(404).json({
                message: "File PDF skripsi tidak ditemukan",
            });
        }

        // Tidak ada kolom jumlah unduhan pada skema saat ini, sehingga
        // penghitungan unduhan tidak dilakukan. Bila kolom ditambahkan,
        // increment dapat dilakukan di sini setelah file valid.

        return sendSkripsiPdf(res, resolved, {
            inline: wantsInlinePdf(req),
            cacheControl: "public, max-age=300",
        });
    } catch (error) {
        console.error("Gagal mengunduh file skripsi:", error);

        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
        });
    }
}

/**
 * Unduhan internal untuk pemilik draft/pengajuan dan staf. Aturan aksesnya
 * sama dengan endpoint detail yang sudah ada; route ini tetap memakai token.
 */
export async function downloadSkripsiFile(
    req: AuthRequest,
    res: Response
) {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                message: "Autentikasi diperlukan",
            });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID skripsi tidak valid",
            });
        }

        const viewerMahasiswaId =
            user.role === "mahasiswa"
                ? await getMahasiswaIdByUserId(user.id)
                : null;

        const [data] = await db
            .select({
                id: skripsi.id,
                judul: skripsi.judul,
                mahasiswaId: skripsi.mahasiswaId,
                status: skripsi.status,
                fileUrl: skripsi.fileUrl,
            })
            .from(skripsi)
            .where(eq(skripsi.id, id))
            .limit(1);

        if (!data) {
            return res.status(404).json({
                message: "Skripsi tidak ditemukan",
            });
        }

        if (
            !canAccessSkripsi(
                user.role,
                viewerMahasiswaId,
                data.mahasiswaId,
                data.status
            )
        ) {
            return res.status(404).json({
                message: "Skripsi tidak ditemukan",
            });
        }

        const resolved = await resolveSkripsiPdfFile(data);

        if (!resolved) {
            return res.status(404).json({
                message: "File PDF skripsi tidak ditemukan",
            });
        }

        return sendSkripsiPdf(res, resolved, {
            inline: wantsInlinePdf(req),
            cacheControl: "private, no-store",
        });
    } catch (error) {
        console.error("Gagal mengunduh file skripsi:", error);

        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
        });
    }
}





