import { Router } from 'express';
import { validate } from '../../common/middleware/zodValidator';
import { ReferralController } from './referral.controller';
import { createReferralBodySchema, getReferralParamsSchema, updateReferralStatusBodySchema } from './referral.validators';

const router = Router();

router.get('/', ReferralController.getAll);
router.get('/:id', validate({ params: getReferralParamsSchema }), ReferralController.getById);
router.post('/', validate({ body: createReferralBodySchema }), ReferralController.create);
router.put('/:id/status', validate({ params: getReferralParamsSchema, body: updateReferralStatusBodySchema }), ReferralController.updateStatus);
router.delete('/:id', validate({ params: getReferralParamsSchema }), ReferralController.delete);

export default router;
