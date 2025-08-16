export interface IUser {
  id: number;
  email: string;
  password: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string | null;
}
