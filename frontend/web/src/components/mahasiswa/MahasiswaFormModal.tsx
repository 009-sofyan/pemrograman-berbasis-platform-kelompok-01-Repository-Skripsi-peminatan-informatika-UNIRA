import { useEffect, useState } from "react";
import { GraduationCap, Info, Pencil, UserPlus } from "lucide-react";
import type { Mahasiswa } from "../../types";
import { BI, PROGRAM_STUDI_DEFAULT, SA } from "../../constants";
import { getApiErrorMessage } from "../../lib/errors";
import { mahasiswaService } from "../../services/mahasiswaService";
import { useToast } from "../../contexts/ToastContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Input";

interface FormState {
  nama: string;
  email: string;
  nim: string;
  programStudi: string;
  peminatan: string;
}

const EMPTY: FormState = {
  nama: "",
  email: "",
  nim: "",
  programStudi: PROGRAM_STUDI_DEFAULT,
  peminatan: "",
};

export function MahasiswaFormModal({
  open,
  mode,
  target,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: "create" | "edit";
  target: Mahasiswa | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && target) {
      setForm({
        nama: target.nama,
        email: target.email,
        nim: target.nim,
        programStudi: target.programStudi,
        peminatan: target.peminatan ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
    setError(null);
  }, [open, mode, target]);

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setError(null);
  };

  const legacyPeminatan =
    form.peminatan && form.peminatan !== BI && form.peminatan !== SA
      ? form.peminatan
      : null;

  const save = async () => {
    const nextErrors: Record<string, string | undefined> = {};
    if (mode === "edit" && !form.nama.trim()) nextErrors.nama = "Nama wajib diisi.";
    if (!form.email.trim()) {
      nextErrors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Format email tidak valid.";
    }
    if (!form.nim.trim()) nextErrors.nim = "NIM wajib diisi.";
    if (!form.programStudi.trim()) {
      nextErrors.programStudi = "Program studi wajib diisi.";
    }
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    setError(null);
    try {
      if (mode === "create") {
        await mahasiswaService.create({
          email: form.email.trim().toLowerCase(),
          nim: form.nim.trim(),
          programStudi: form.programStudi.trim(),
        });
        toast.success(
          "Data mahasiswa ditambahkan",
          "Mahasiswa kini dapat mengajukan skripsi dan memilih peminatan.",
        );
      } else if (target) {
        await mahasiswaService.update(target.id, {
          nama: form.nama.trim(),
          email: form.email.trim().toLowerCase(),
          nim: form.nim.trim(),
          programStudi: form.programStudi.trim(),
          peminatan: form.peminatan ? form.peminatan : null,
        });
        toast.success("Data mahasiswa diperbarui", "Perubahan berhasil disimpan.");
      }
      onSaved();
      onClose();
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      toast.error("Gagal menyimpan", message);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = mode === "edit";

  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={isEdit ? "Edit data mahasiswa" : "Tambah data mahasiswa"}
      description={
        isEdit
          ? "Perbarui data akademik dan peminatan mahasiswa."
          : "Hubungkan akun mahasiswa yang sudah terdaftar dengan data NIM dan program studi."
      }
      icon={isEdit ? <Pencil className="size-5" /> : <UserPlus className="size-5" />}
      size="md"
      closeOnBackdrop={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={() => void save()} loading={saving}>
            {isEdit ? "Simpan perubahan" : "Tambah mahasiswa"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-xs text-coral-700">
            {error}
          </div>
        ) : null}

        {!isEdit ? (
          <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50/70 px-3.5 py-3 text-[11px] leading-relaxed text-sky-800">
            <Info className="mt-0.5 size-4 shrink-0 text-sky-600" />
            Akun harus terdaftar lebih dulu melalui halaman Registrasi. Backend akan
            mencocokkan email dengan akun mahasiswa yang ada.
          </div>
        ) : null}

        {isEdit ? (
          <Input
            label="Nama lengkap"
            value={form.nama}
            onChange={(event) => update("nama", event.target.value)}
            error={errors.nama}
            icon={GraduationCap}
            required
          />
        ) : null}

        <Input
          label="Email akun mahasiswa"
          type="email"
          placeholder="nama@unira.ac.id"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          error={errors.email}
          hint={
            isEdit
              ? "Email juga digunakan untuk login mahasiswa."
              : "Gunakan email yang sama dengan saat registrasi akun."
          }
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="NIM"
            placeholder="24520017"
            value={form.nim}
            onChange={(event) => update("nim", event.target.value)}
            error={errors.nim}
            maxLength={20}
            required
          />
          <Input
            label="Program studi"
            placeholder="Informatika"
            value={form.programStudi}
            onChange={(event) => update("programStudi", event.target.value)}
            error={errors.programStudi}
            maxLength={100}
            required
          />
        </div>

        {isEdit ? (
          <Select
            label="Peminatan"
            value={form.peminatan}
            onChange={(event) => update("peminatan", event.target.value)}
            hint="Peminatan hanya dipakai untuk pemetaan program studi."
          >
            <option value="">Belum memilih</option>
            <option value={BI}>Business Intelligence</option>
            <option value={SA}>Smart Agriculture</option>
            {legacyPeminatan ? (
              <option value={legacyPeminatan}>{legacyPeminatan} (data lama)</option>
            ) : null}
          </Select>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Peminatan awal
            </p>
            <p className="mt-1 text-xs font-semibold text-ink">Belum memilih</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-ink-soft">
              Mahasiswa akan memilih Business Intelligence atau Smart Agriculture
              sendiri melalui halaman Profil.
            </p>
          </div>
        )}

        {isEdit ? (
          <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-[10px] leading-relaxed text-slate-500">
            <Info className="mt-0.5 size-3.5 shrink-0 text-primary-500" />
            Mengubah peminatan di sini akan memengaruhi data pemetaan prodi. Gunakan
            dengan hati-hati.
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
