import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      }
    });

    return res.status(201).json({
      message: 'User created successfully.',
      id: newUser.id,
      email: newUser.email
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const login = async (req: Request, res: Response) => {
  // Type guard for user object
  const user = req.user as { id: number; email: string; twoFactorEnabled?: boolean } | undefined;

  if (user?.twoFactorEnabled) {
    return res.json({ require2fa: true });
  }

  // Only return non-sensitive user info
  if (user) {
    return res.status(200).json({
      message: 'User logged in successfully.',
      user: {
        id: user.id,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled ?? false
      }
    });
  }

  // If user is not authenticated
  return res.status(401).json({ message: 'Authentication failed.' });
};

export const logout = async (req: Request, res: Response) => {
  req.logout(() => {
    res.status(200).json({ message: 'User logged out successfully.' });
  });
};
