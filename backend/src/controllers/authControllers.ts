import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';

import { db } from '../db/index.js';
import { users } from '../db/users.js';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET belum diatur di file .env");
  }
  return secret;
}

export async function register(
  req: Request,
  res: Response
) {
  try {
    const { nama, email, password } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({
        message: 'Nama, email, dan password wajib diisi',
      });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      return res.status(409).json({
        message: 'Email sudah terdaftar',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      nama,
      email,
      password: hashedPassword,
      role: 'mahasiswa',
    });

    return res.status(201).json({
      message: 'Registrasi berhasil',
    });
  } catch (error) {
    console.error('Register error:', error);

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server',
    });
  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email dan password wajib diisi',
      });
    }

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (result.length === 0) {
      return res.status(401).json({
        message: 'Email atau password salah',
      });
    }

    const dataUser = result[0]!;

    const isMatch = await bcrypt.compare(
      password,
      dataUser.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: 'Email atau password salah',
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
        expiresIn: '1d',
      }
    );

    return res.status(200).json({
      message: 'Login berhasil',
      token,
      user: {
        id: dataUser.id,
        nama: dataUser.nama,
        email: dataUser.email,
        role: dataUser.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server',
    });
  }
}
