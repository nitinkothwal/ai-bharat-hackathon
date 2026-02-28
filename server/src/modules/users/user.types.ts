export type PublicUser = Omit<User, 'password'>;

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}
