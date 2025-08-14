import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use env variable in production

// Register with JWT sign
export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      }
    });

    // Create JWT token
    const token = jwt.sign({ id: newUser.id, email: newUser.email, twoFactorEnabled: newUser.twoFactorEnabled }, JWT_SECRET, {
      expiresIn: '1d'
    });

    return res.status(201).json({
      message: 'User created successfully.',
      user: {
        id: newUser.id,
        email: newUser.email,
        twoFactorEnabled: newUser.twoFactorEnabled
      },
      token
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// Login with JWT sign
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1 Factor Authentication
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // If 2FA is enabled, require 2FA verification before issuing JWT
    if (user.twoFactorEnabled) {
      // You may want to set a flag in session or return a partial token
      return res.status(200).json({ require2fa: true, userId: user.id });
    }

    // Create JWT token
    const token = jwt.sign({ id: user.id, email: user.email, twoFactorEnabled: user.twoFactorEnabled }, JWT_SECRET, { expiresIn: '1d' });

    return res.status(200).json({
      message: 'User logged in successfully.',
      user: {
        id: user.id,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled
      },
      token
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const logout = async (req: Request, res: Response) => {
  // For JWT, logout is handled on the client by deleting the token.
  // Optionally, you can implement token blacklisting here.
  res.status(200).json({ message: 'User logged out successfully.' });
};

