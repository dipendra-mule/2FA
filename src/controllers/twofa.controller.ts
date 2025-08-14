import { Request, Response } from 'express';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const setup2FA = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).send('Unauthorized');

  const secret = speakeasy.generateSecret();
  await prisma.user.update({
    where: { id: (req.user as any).id },
    data: {
      twoFactorSecret: secret.base32
    }
  });

  qrcode.toDataURL(secret.otpauth_url || '', (err, data_url) => {
    if (err) return res.status(500).json({ error: 'Error generating QR code' });
    res.json({ qrCodeUrl: data_url, secret: secret.base32 });
  });
};

export const verify2FA = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).send('Unauthorized');

  const { token } = req.body;
  const user = await prisma.user.findUnique({
    where: { id: (req.user as any).id }
  });

  if (!user || !user.twoFactorSecret) {
    return res.status(400).json({ error: '2FA not setup' });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token
  });

  if (verified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true }
    });
    return res.json({ success: true });
  }

  res.status(401).json({ success: false, message: 'Invalid token' });
};

export const validate2FA = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).send('Unauthorized');

  const { token } = req.body;
  const user = await prisma.user.findUnique({
    where: { id: (req.user as any).id }
  });

  if (!user || !user.twoFactorSecret) {
    return res.status(400).json({ error: '2FA not setup' });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token
  });

  if (verified) {
    return res.json({ success: true });
  }

  res.status(401).json({ success: false, message: 'Invalid token' });
};
