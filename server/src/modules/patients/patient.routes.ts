import { Router } from 'express';
import { validate } from '../../common/middleware/zodValidator';
import { PatientController } from './patient.controller';
import { createPatientBodySchema, getPatientParamsSchema, updatePatientBodySchema } from './patient.validators';

const router = Router();

router.get('/', PatientController.getAll);
router.get('/:id', validate({ params: getPatientParamsSchema }), PatientController.getById);
router.post('/', validate({ body: createPatientBodySchema }), PatientController.create);
router.put('/:id', validate({ params: getPatientParamsSchema, body: updatePatientBodySchema }), PatientController.update);
router.delete('/:id', validate({ params: getPatientParamsSchema }), PatientController.delete);

export default router;
