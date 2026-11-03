const STORAGE_PREFIX = "cover-temp:";
const INDEX_KEY = `${STORAGE_PREFIX}__index`;
const MAX_COVERS = 10;

/**
 * Event lokal (same-tab) agar komponen katalog ikut render ulang ketika cache
 * cover sementara berubah. Event `storage` bawaan browser tidak dipancarkan
 * pada tab yang melakukan perubahan.
 */
export const COVER_CACHE_EVENT = "cover-cache:changed";
export const COVER_CACHE_UPDATED_EVENT = "cover-cache-updated";
const COVER_CACHE_EVENTS = [COVER_CACHE_EVENT, COVER_CACHE_UPDATED_EVENT];

type CoverIndex = Record<string, number>;

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function toCacheKey(id: number | string): string | null {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return null;
  return `${STORAGE_PREFIX}${numericId}`;
}

function isImageDataUrl(value: string): boolean {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);
}

function readIndex(storage: Storage): CoverIndex {
  try {
    const raw = storage.getItem(INDEX_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const index: CoverIndex = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        index[key] = value;
      }
    }
    return index;
  } catch {
    return {};
  }
}

function writeIndex(storage: Storage, index: CoverIndex) {
  try {
    storage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    /* index hanya metadata; kegagalan menulisnya tidak boleh menggagalkan cache */
  }
}

function listCoverKeys(storage: Storage): string[] {
  const keys: string[] = [];
  try {
    for (let position = 0; position < storage.length; position += 1) {
      const key = storage.key(position);
      if (key && /^cover-temp:\d+$/.test(key)) keys.push(key);
    }
  } catch {
    return [];
  }
  return keys;
}

function removeKey(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Menjaga total cache tetap maksimal 10 cover. Entri terlama (berdasarkan
 * metadata waktu simpan) dihapus lebih dahulu.
 */
function prune(storage: Storage, force = false): number {
  const keys = listCoverKeys(storage);
  if (keys.length === 0) return 0;

  const overflow = force ? 1 : keys.length - MAX_COVERS;
  if (overflow <= 0) return 0;

  const index = readIndex(storage);
  const ordered = keys
    .map((key) => ({
      key,
      savedAt: index[key.replace(STORAGE_PREFIX, "")] ?? 0,
    }))
    .sort((a, b) => a.savedAt - b.savedAt);

  let removed = 0;
  for (const entry of ordered) {
    if (removed >= overflow) break;
    removeKey(storage, entry.key);
    delete index[entry.key.replace(STORAGE_PREFIX, "")];
    removed += 1;
  }

  writeIndex(storage, index);
  return removed;
}

function notifyCacheChanged(id?: number | string) {
  if (typeof window === "undefined") return;

  try {
    for (const eventName of COVER_CACHE_EVENTS) {
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: { id: id === undefined ? null : Number(id) },
        }),
      );
    }
  } catch {
    /* CustomEvent dapat tidak tersedia pada lingkungan non-browser */
  }
}

/**
 * Mengambil cover sementara untuk satu skripsi. Nilai yang bukan data URL
 * gambar (mis. blob: yang sudah mati) diabaikan.
 */
export function getCoverTemp(id: number | string): string | null {
  const storage = getStorage();
  const key = toCacheKey(id);
  if (!storage || !key) return null;

  try {
    const value = storage.getItem(key);
    if (!value) return null;
    if (!isImageDataUrl(value)) {
      removeKey(storage, key);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

/**
 * Menyimpan data URL hasil kompresi. Kegagalan (kuota penuh, mode privat,
 * atau storage diblokir) selalu dikembalikan sebagai `false`, bukan throw.
 */
export function setCoverTemp(id: number | string, dataUrl: string): boolean {
  const storage = getStorage();
  const key = toCacheKey(id);
  if (!storage || !key || !isImageDataUrl(dataUrl)) return false;

  const numericId = Number(id);

  const persist = () => {
    storage.setItem(key, dataUrl);
    const index = readIndex(storage);
    index[String(numericId)] = Date.now();
    writeIndex(storage, index);
    prune(storage);
  };

  try {
    persist();
  } catch {
    try {
      prune(storage, true);
      persist();
    } catch {
      return false;
    }
  }

  notifyCacheChanged(numericId);
  return true;
}

/**
 * Menghapus cover sementara. Dipakai setelah upload permanen ke backend
 * berhasil atau ketika pengguna menghapus sampul.
 */
export function removeCoverTemp(id: number | string): void {
  const storage = getStorage();
  const key = toCacheKey(id);
  if (!storage || !key) return;

  let existed = false;
  try {
    existed = storage.getItem(key) !== null;
    storage.removeItem(key);
    const index = readIndex(storage);
    if (Object.prototype.hasOwnProperty.call(index, String(Number(id)))) {
      delete index[String(Number(id))];
      writeIndex(storage, index);
    }
  } catch {
    /* ignore */
  }

  if (existed) notifyCacheChanged(id);
}
