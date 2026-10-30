import type { User } from "../types";

const PROFILE_PREFIX = "repository-skripsi.profile";
const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;
const AVATAR_MAX_DIMENSION = 320;

export interface ProfilePatch {
  nama?: string;
  telepon?: string;
  bio?: string;
  avatarUrl?: string | null;
}

function storageKey(userId: number): string {
  return `${PROFILE_PREFIX}.${userId}`;
}

function sanitizeProfile(value: unknown): ProfilePatch | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const profile: ProfilePatch = {};

  if (typeof record.nama === "string") profile.nama = record.nama;
  if (typeof record.telepon === "string") profile.telepon = record.telepon;
  if (typeof record.bio === "string") profile.bio = record.bio;
  if (typeof record.avatarUrl === "string" || record.avatarUrl === null) {
    profile.avatarUrl = record.avatarUrl;
  }

  return Object.keys(profile).length > 0 ? profile : null;
}

export function getLocalProfile(userId: number): ProfilePatch | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    return sanitizeProfile(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveLocalProfile(userId: number, patch: ProfilePatch): ProfilePatch {
  const current = getLocalProfile(userId) ?? {};
  const next: ProfilePatch = { ...current };

  if (typeof patch.nama === "string") next.nama = patch.nama;
  if (typeof patch.telepon === "string") next.telepon = patch.telepon;
  if (typeof patch.bio === "string") next.bio = patch.bio;
  if (typeof patch.avatarUrl === "string" || patch.avatarUrl === null) {
    next.avatarUrl = patch.avatarUrl;
  }

  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    /* storage may be full or unavailable; keep the in-memory update */
  }

  return next;
}

export function applyLocalProfile(user: User): User {
  const profile = getLocalProfile(user.id);
  if (!profile) return user;
  return { ...user, ...profile };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Gagal membaca file foto."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("File gambar tidak dapat dibaca."));
    image.src = src;
  });
}

export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    throw new Error("Pilih file gambar JPG, PNG, atau WebP.");
  }
  if (file.size > MAX_AVATAR_FILE_SIZE) {
    throw new Error("Ukuran foto maksimal 5 MB.");
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);

  const scale = Math.min(1, AVATAR_MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return dataUrl;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.82);
}
