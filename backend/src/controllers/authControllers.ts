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
    const { nama, email, password } = req.body as RegisterInput;

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

    // Role tidak pernah diambil dari body. Registrasi publik hanya boleh
    // membuat akun mahasiswa.
    await db.insert(users).values({
      nama,
      email,
      password: hashedPassword,
      role: "mahasiswa",
    });

    return res.status(201).json({
      message: "Registrasi berhasil",
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
    const { email, password } = req.body as LoginInput;

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

    const token = jwt.sign(
      {
        id: dataUser.id,
        email: dataUser.email,
        role: dataUser.role,
      },
      getJwtSecret(),
      {
        algorithm: "HS256",
        expiresIn: getJwtExpiresIn() as SignOptions["expiresIn"],
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
