import bcrypt from 'bcrypt';

import { findUserByEmail, findUserById } from '../users/user.repository';
import { AppError } from '../../common/errors/AppError';
import { PublicUser, User } from '../users/user.types';

import { LoginDto, AuthResult } from './auth.types';

function toPublicUser(user: User): PublicUser {
  // Explicit mapping (safe & typed)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user;
  return rest;
}

export async function login(dto: LoginDto): Promise<AuthResult> {
  const user = await findUserByEmail(dto.email);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const valid = await bcrypt.compare(dto.password, user.password);

  if (!valid) {
    throw new AppError('Invalid credentials', 401);
  }

  return { user: toPublicUser(user) };
}

export async function getUserById(id: number): Promise<PublicUser | null> {
  const user = await findUserById(id);
  return user;
}
