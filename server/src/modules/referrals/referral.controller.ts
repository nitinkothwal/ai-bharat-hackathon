import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../common/utils/api-response';
import { ReferralService } from './referral.service';
import { CreateReferralDTO, UpdateReferralStatusDTO } from './referral.types';

export const ReferralController = {
    async getAll(_req: Request, res: Response) {
        try {
            const referrals = await ReferralService.getAll();
            sendSuccess(res, { referrals });
        } catch (err: unknown) {
            sendError(res, (err as Error).message);
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const referral = await ReferralService.getById(req.params.id);
            if (!referral) {
                sendError(res, 'Referral not found', 404);
                return;
            }
            sendSuccess(res, { referral });
        } catch (err: unknown) {
            sendError(res, (err as Error).message);
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data: CreateReferralDTO = req.body;
            const referral = await ReferralService.create(data);
            sendSuccess(res, { referral }, 201, 'Referral created successfully');
        } catch (err: unknown) {
            sendError(res, (err as Error).message, 400);
        }
    },

    async updateStatus(req: Request, res: Response) {
        try {
            const data: UpdateReferralStatusDTO = req.body;
            // In a real app we'd get the exact user from JWT. Using 'system_user' as placeholder
            const userId = 'system_user';
            const referral = await ReferralService.updateStatus(req.params.id, data, userId);
            sendSuccess(res, { referral }, 200, 'Referral status updated successfully');
        } catch (err: unknown) {
            const message = (err as Error).message;
            sendError(res, message, message === 'Referral not found' ? 404 : 400);
        }
    },

    async delete(req: Request, res: Response) {
        try {
            await ReferralService.delete(req.params.id);
            sendSuccess(res, {}, 202, 'Referral deleted successfully');
        } catch (err: unknown) {
            const message = (err as Error).message;
            sendError(res, message, message === 'Referral not found' ? 404 : 400);
        }
    }
};
