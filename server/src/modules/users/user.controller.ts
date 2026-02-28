import { Request, Response } from 'express';

import { sendSuccess, sendError } from '../../common/utils/api-response';

import { UserService } from './user.service';
import { CreateUserDTO, UpdateUserDTO } from './user.types';

export const UserController = {
  async getAll(_req: Request, res: Response) {
    try {
      const users = await UserService.getAll();
      sendSuccess(res, { users });
    } catch (err: unknown) {
      sendError(res, (err as Error).message);
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const user = await UserService.getById(Number(req.params.id));
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }
      sendSuccess(res, { user });
    } catch (err: unknown) {
      sendError(res, (err as Error).message);
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data: CreateUserDTO = req.body;
      const user = await UserService.create(data);
      sendSuccess(res, { id: user.id }, 201, 'User created successfully');
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 400);
    }
  },

  async update(req: Request, res: Response) {
    try {
      const data: UpdateUserDTO = req.body;
      const user = await UserService.update(Number(req.params.id), data);
      sendSuccess(res, { user }, 200, 'User updated successfully');
    } catch (err: unknown) {
      const message = (err as Error).message;
      sendError(res, message, message === 'User not found' ? 404 : 400);
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await UserService.delete(Number(req.params.id));
      sendSuccess(res, {}, 202, 'User deleted successfully');
    } catch (err: unknown) {
      const message = (err as Error).message;
      sendError(res, message, message === 'User not found' ? 404 : 400);
    }
  },
};
