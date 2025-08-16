import { Request, Response } from 'express';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Helper to get user id from request.
 */
const getUserId = (req: Request): any | null => {
  // Adjust this if you have a better user typing
  return req.user && (req.user as any).id ? (req.user as any).id : null;
};

/**
 * Setup 2FA for the authenticated user.
 * Generates a secret, saves it, and returns a QR code and secret.
 */
export const setup2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const secret = speakeasy.generateSecret({
      name: `YourAppName (${userId})`, // Customize app name
      length: 32
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false // Reset 2FA enabled on new setup
      }
    });

    const otpauthUrl = secret.otpauth_url || '';
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

    res.status(200).json({
      qrCodeUrl,
      secret: secret.base32,
      otpauthUrl
    });
  } catch (error) {
    console.error('Error in setup2FA:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Verify 2FA token and enable 2FA for the user if valid.
 */
export const verify2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorSecret) {
      res.status(400).json({ error: '2FA not setup' });
      return;
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 step before/after for clock drift
    });

    if (verified) {
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true }
      });
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error in verify2FA:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Validate a 2FA token for the authenticated user.
 */
export const validate2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorSecret) {
      res.status(400).json({ error: '2FA not setup' });
      return;
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (verified) {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error in validate2FA:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

