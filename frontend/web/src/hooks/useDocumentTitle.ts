import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title
      ? `${title} — Repository Skripsi UNIRA`
      : "Repository Skripsi — Peminatan Informatika UNIRA";
    return () => {
      document.title = previous;
    };
  }, [title]);
}
