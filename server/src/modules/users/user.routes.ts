import { Router } from 'express';

import { validate } from '../../common/middleware/zodValidator';
import { requireAuth } from '../auth/auth.middleware';

import { UserController } from './user.controller';
import { createUserBodySchema, getUserParamsSchema, updateUserBodySchema } from './user.validators';

const router = Router();

router.get('/', requireAuth, UserController.getAll);
router.get('/:id', requireAuth, validate({ params: getUserParamsSchema }), UserController.getById);
router.post('/', validate({ body: createUserBodySchema }), UserController.create);
router.put(
  '/:id',
  requireAuth,
  validate({ params: getUserParamsSchema, body: updateUserBodySchema }),
  UserController.update,
);
router.delete(
  '/:id',
  requireAuth,
  validate({ params: getUserParamsSchema }),
  UserController.delete,
);

export default router;
