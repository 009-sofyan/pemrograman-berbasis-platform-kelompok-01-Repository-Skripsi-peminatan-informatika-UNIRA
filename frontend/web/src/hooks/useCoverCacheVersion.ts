import { useEffect, useState } from "react";
import {
  COVER_CACHE_EVENT,
  COVER_CACHE_UPDATED_EVENT,
} from "../lib/coverCache";

/**
 * Versi cache cover sementara. Berubah ketika helper cache menulis/menghapus
 * entri, sehingga katalog dan kartu skripsi ikut render ulang tanpa reload.
 */
export function useCoverCacheVersion(): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((value) => value + 1);

    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith("cover-temp:")) bump();
    };

    window.addEventListener(COVER_CACHE_EVENT, bump);
    window.addEventListener(COVER_CACHE_UPDATED_EVENT, bump);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(COVER_CACHE_EVENT, bump);
      window.removeEventListener(COVER_CACHE_UPDATED_EVENT, bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return version;
}
