import { db } from '../../config/database';
import { Referral, CreateReferralDTO } from './referral.types';

const TABLE = 'referrals';

export async function findReferralById(id: string): Promise<Referral | null> {
    const referral = await db<Referral>(TABLE).where({ referral_id: id }).first();
    return referral ?? null;
}

export async function findAllReferrals(): Promise<Referral[]> {
    return db<Referral>(TABLE).select('*');
}

export async function createReferral(referral_id: string, data: CreateReferralDTO): Promise<Referral> {
    await db<Referral>(TABLE).insert({
        ...data,
        referral_id,
        status: 'submitted',
        status_history: JSON.stringify([{
            status: 'submitted',
            timestamp: Date.now(),
            updated_by: data.asha_id
        }])
    });
    return findReferralById(referral_id) as Promise<Referral>;
}

export async function updateReferralStatus(id: string, updateData: Partial<Referral>): Promise<Referral | null> {
    await db<Referral>(TABLE).where({ referral_id: id }).update({ ...updateData, updated_at: new Date() });
    return findReferralById(id);
}

export async function deleteReferral(id: string): Promise<void> {
    await db<Referral>(TABLE).where({ referral_id: id }).delete();
}
