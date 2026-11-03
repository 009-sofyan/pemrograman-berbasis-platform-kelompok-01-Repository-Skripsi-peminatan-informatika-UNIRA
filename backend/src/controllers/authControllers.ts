import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { getJwtExpiresIn, getJwtSecret } from "../config/env.js";
import { db } from "../db/index.js";
import { users } from "../db/users.js";
import type {
  LoginInput,
  RegisterInput,
} from "../validation/schemas.js";

const BCRYPT_ROUNDS = 10;

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Body sudah dinormalisasi (trim/lowercase email) oleh registerSchema.
    // role/status dari body tidak pernah dibaca: registrasi publik selalu
    // menghasilkan akun mahasiswa yang menunggu verifikasi Tendik.
    const { nama, email, password, nim, programStudi } =
      req.body as RegisterInput;

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return res.status(409).json({
        message: "Email sudah terdaftar",
      });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await db.insert(users).values({
      nama,
      email,
      password: hashedPassword,
      role: "mahasiswa",
      status: "PENDING_VERIFICATION",
      claimNim: nim ?? null,
      claimProgramStudi: programStudi ?? null,
    });

    return res.status(201).json({
      message: "Pendaftaran diterima, menunggu verifikasi Tendik",
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password, role } = req.body as LoginInput;

    const [dataUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!dataUser) {
      return res.status(401).json({
        message: "Email atau password salah",
      });
    }

    const isMatch = await bcrypt.compare(password, dataUser.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Email atau password salah",
      });
    }

    // Akun hasil registrasi baru belum boleh masuk sebelum Tendik
    // memverifikasi. Akun lama yang belum memiliki nilai status (mis. saat
    // migrasi belum diterapkan) tetap dianggap ACTIVE.
    if (dataUser.status === "PENDING_VERIFICATION") {
      return res.status(403).json({
        message:
          "Akun kamu masih menunggu verifikasi Tendik. Silakan coba lagi setelah disetujui.",
      });
    }

    if (dataUser.status === "REJECTED") {
      const reason = dataUser.rejectReason?.trim();
      return res.status(403).json({
        message: reason
          ? `Pendaftaran akun kamu ditolak oleh Tendik. Alasan: ${reason}`
          : "Pendaftaran akun kamu ditolak oleh Tendik.",
      });
    }

    // Role dari request hanya untuk mencocokkan pilihan tab login. Pengecekan
    // dilakukan setelah password benar agar role akun tidak bisa ditebak tanpa
    // kredensial yang sah. Token tetap memakai role dari database.
    if (role && role !== dataUser.role) {
      return res.status(401).json({
        message: "Role tidak sesuai dengan akun yang terdaftar",
      });
    }

    const token = jwt.sign(
      {
        id: dataUser.id,
        email: dataUser.email,
        role: dataUser.role,
      },
      getJwtSecret(),
      {
        algorithm: "HS256",
        expiresIn: getJwtExpiresIn() as NonNullable<
          SignOptions["expiresIn"]
        >,
      }
    );

    return res.status(200).json({
      message: "Login berhasil",
      token,
      user: {
        id: dataUser.id,
        nama: dataUser.nama,
        email: dataUser.email,
        role: dataUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
}
