import * as ReferralRepo from './referral.repository';
import { CreateReferralDTO, UpdateReferralStatusDTO } from './referral.types';

export const ReferralService = {
  async getAll() {
    return ReferralRepo.findAllReferrals();
  },

  async getById(id: string) {
    return ReferralRepo.findReferralById(id);
  },

  async create(data: CreateReferralDTO) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSeq = String(Math.floor(100000 + Math.random() * 900000));
    const referralId = `REF-UP-12-${dateStr}-${randomSeq}`;

    // Note: AI inference integration logic goes here (SageMaker/Bedrock).
    return ReferralRepo.createReferral(referralId, data);
  },

  async updateStatus(id: string, data: UpdateReferralStatusDTO, userId: number | string = 'system') {
    const referral = await ReferralRepo.findReferralById(id);
    if (!referral) {
      throw new Error('Referral not found');
    }

    let statusHistory: any[] = [];
    if (typeof referral.status_history === 'string') {
      try { statusHistory = JSON.parse(referral.status_history); } catch (e) { }
    } else if (Array.isArray(referral.status_history)) {
      statusHistory = referral.status_history;
    }

    statusHistory.push({
      status: data.status,
      timestamp: Date.now(),
      updated_by: String(userId)
    });

    const updatePayload: any = {
      status: data.status,
      status_history: JSON.stringify(statusHistory)
    };

    if (data.status === 'completed') {
      updatePayload.completed_at = new Date();
    }

    if (data.completion_data) {
      updatePayload.completion_data = JSON.stringify(data.completion_data);
    }

    const updated = await ReferralRepo.updateReferralStatus(id, updatePayload);
    return updated;
  },

  async delete(id: string) {
    const referral = await ReferralRepo.findReferralById(id);
    if (!referral) {
      throw new Error('Referral not found');
    }
    await ReferralRepo.deleteReferral(id);
  }
};
