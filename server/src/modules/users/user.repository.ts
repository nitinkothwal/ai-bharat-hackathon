import { db } from '../../config/database';

import { User, PublicUser, CreateUserDTO, UpdateUserDTO } from './user.types';

const TABLE = 'users';

const PUBLIC_COLUMNS: readonly (keyof PublicUser)[] = [
  'id',
  'username',
  'email',
  'first_name',
  'last_name',
  'is_active',
  'created_at',
  'updated_at',
];

export async function findUserById(id: number): Promise<PublicUser | null> {
  const user = await db(TABLE).select(PUBLIC_COLUMNS).where({ id }).first();

  return user ?? null;
}

export async function findAllUsers(): Promise<PublicUser[]> {
  return db<User>(TABLE).select(PUBLIC_COLUMNS);
}

/**
 * Used by auth ONLY (returns password)
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const user = await db<User>(TABLE).where({ email }).first();
  return user ?? null;
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const user = await db<User>(TABLE).where({ username }).first();
  return user ?? null;
}

export async function createUser(data: CreateUserDTO & { password: string }): Promise<PublicUser> {
  const [user] = await db<User>(TABLE).insert(data).returning(PUBLIC_COLUMNS);

  return user;
}

export async function updateUser(id: number, data: UpdateUserDTO): Promise<PublicUser | null> {
  const [user] = await db<User>(TABLE).where({ id }).update(data).returning(PUBLIC_COLUMNS);

  return user ?? null;
}

export async function deleteUser(id: number): Promise<void> {
  await db<User>(TABLE).where({ id }).delete();
}
