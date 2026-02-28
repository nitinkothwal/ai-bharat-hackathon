import bcrypt from 'bcrypt';

import * as UserRepo from './user.repository';
import { CreateUserDTO, UpdateUserDTO } from './user.types';

export const UserService = {
  async getAll() {
    return UserRepo.findAllUsers();
  },

  async getById(id: number) {
    return UserRepo.findUserById(id);
  },

  async create(data: CreateUserDTO) {
    const emailExists = await UserRepo.findUserByEmail(data.email);
    if (emailExists) {
      throw new Error('Email already exists');
    }

    const usernameExists = await UserRepo.findUserByUsername(data.username);
    if (usernameExists) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return UserRepo.createUser({
      ...data,
      password: hashedPassword,
    });
  },

  async update(id: number, data: UpdateUserDTO) {
    if (data.email) {
      const emailExists = await UserRepo.findUserByEmail(data.email);
      if (emailExists && emailExists.id !== id) {
        throw new Error('Email already exists');
      }
    }

    if (data.username) {
      const usernameExists = await UserRepo.findUserByUsername(data.username);
      if (usernameExists && usernameExists.id !== id) {
        throw new Error('Username already exists');
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const updated = await UserRepo.updateUser(id, data);
    if (!updated) {
      throw new Error('User not found');
    }

    return updated;
  },

  async delete(id: number) {
    const user = await UserRepo.findUserById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await UserRepo.deleteUser(id);
  },
};
