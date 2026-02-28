import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../common/utils/api-response';
import { PatientService } from './patient.service';
import { CreatePatientDTO, UpdatePatientDTO } from './patient.types';

export const PatientController = {
    async getAll(_req: Request, res: Response) {
        try {
            const patients = await PatientService.getAll();
            sendSuccess(res, { patients });
        } catch (err: unknown) {
            sendError(res, (err as Error).message);
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const patient = await PatientService.getById(req.params.id);
            if (!patient) {
                sendError(res, 'Patient not found', 404);
                return;
            }
            sendSuccess(res, { patient });
        } catch (err: unknown) {
            sendError(res, (err as Error).message);
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data: CreatePatientDTO = req.body;
            const patient = await PatientService.create(data);
            sendSuccess(res, { patient }, 201, 'Patient created successfully');
        } catch (err: unknown) {
            sendError(res, (err as Error).message, 400);
        }
    },

    async update(req: Request, res: Response) {
        try {
            const data: UpdatePatientDTO = req.body;
            const patient = await PatientService.update(req.params.id, data);
            sendSuccess(res, { patient }, 200, 'Patient updated successfully');
        } catch (err: unknown) {
            const message = (err as Error).message;
            sendError(res, message, message === 'Patient not found' ? 404 : 400);
        }
    },

    async delete(req: Request, res: Response) {
        try {
            await PatientService.delete(req.params.id);
            sendSuccess(res, {}, 202, 'Patient deleted successfully');
        } catch (err: unknown) {
            const message = (err as Error).message;
            sendError(res, message, message === 'Patient not found' ? 404 : 400);
        }
    }
};
