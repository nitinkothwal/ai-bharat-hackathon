import { PublicUser } from '../users/user.types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResult {
  user: PublicUser;
}
