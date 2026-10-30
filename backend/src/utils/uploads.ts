import fs from "node:fs";
import path from "node:path";

const backendRoot = path.resolve(__dirname, "../..");

function resolveUploadRoot(): string {
    const configured = process.env.UPLOAD_DIR?.trim();

    if (!configured) {
        return path.join(backendRoot, "uploads");
    }

    // Path relatif pada UPLOAD_DIR dihitung dari root backend, bukan dari
    // current working directory proses Node.js.
    return path.isAbsolute(configured)
        ? path.resolve(configured)
        : path.resolve(backendRoot, configured);
}

export const UPLOAD_ROOT = resolveUploadRoot();
export const SKRIPSI_UPLOAD_DIR = path.join(UPLOAD_ROOT, "skripsi");

fs.mkdirSync(SKRIPSI_UPLOAD_DIR, { recursive: true });

const SAFE_PDF_FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$/i;

function getSafePdfFileName(fileUrl: string | null | undefined): string | null {
    if (!fileUrl) return null;

    const normalized = fileUrl.replace(/\\/g, "/");
    const fileName = normalized.slice(normalized.lastIndexOf("/") + 1);

    if (!fileName || !SAFE_PDF_FILE_NAME.test(fileName)) {
        return null;
    }

    if (fileName.includes("..")) {
        return null;
    }

    return fileName;
}

/**
 * Path fisik hanya diambil dari nama file yang tersimpan di database.
 * Parameter request tidak pernah dipakai langsung sebagai path filesystem.
 */
export function resolveStoredSkripsiPath(
    fileUrl: string | null | undefined
): string | null {
    const fileName = getSafePdfFileName(fileUrl);

    if (!fileName) return null;

    const filePath = path.join(SKRIPSI_UPLOAD_DIR, fileName);
    const relative = path.relative(SKRIPSI_UPLOAD_DIR, filePath);

    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
        return null;
    }

    return filePath;
}

export function toStoredSkripsiFileUrl(fileName: string): string {
    if (!SAFE_PDF_FILE_NAME.test(fileName) || fileName.includes("..")) {
        throw new Error("Nama file skripsi tidak valid");
    }

    return `/uploads/skripsi/${fileName}`;
}

export function toSkripsiDownloadUrl(id: number): string {
    return `/api/skripsi/${id}/download`;
}

export async function storedSkripsiFileExists(
    fileUrl: string | null | undefined
): Promise<boolean> {
    const filePath = resolveStoredSkripsiPath(fileUrl);

    if (!filePath) return false;

    try {
        const stat = await fs.promises.stat(filePath);
        return stat.isFile();
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return false;
        }

        throw error;
    }
}

export async function deleteStoredSkripsiFile(
    fileUrl: string | null | undefined
): Promise<void> {
    const filePath = resolveStoredSkripsiPath(fileUrl);

    if (!filePath) {
        if (fileUrl) {
            console.warn(
                "File skripsi tidak dihapus karena path tidak valid:",
                fileUrl
            );
        }
        return;
    }

    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            console.error("Gagal menghapus file skripsi:", error);
        }
    }
}

export async function deleteUploadedTempFile(
    filePath: string | undefined
): Promise<void> {
    if (!filePath) return;

    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            console.error("Gagal membersihkan file upload sementara:", error);
        }
    }
}
