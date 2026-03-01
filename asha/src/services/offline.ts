import AsyncStorage from '@react-native-async-storage/async-storage';
import { referralService } from './api';

const OFFLINE_REFERRALS_KEY = 'offline_referrals';

export const offlineService = {
    saveReferral: async (referralData: any) => {
        try {
            const existing = await AsyncStorage.getItem(OFFLINE_REFERRALS_KEY);
            const referrals = existing ? JSON.parse(existing) : [];
            referrals.push({
                ...referralData,
                id: `offline_${Date.now()}`,
                isOffline: true,
            });
            await AsyncStorage.setItem(OFFLINE_REFERRALS_KEY, JSON.stringify(referrals));
            return true;
        } catch (e) {
            console.error('Error saving offline referral', e);
            return false;
        }
    },

    getOfflineReferrals: async () => {
        const data = await AsyncStorage.getItem(OFFLINE_REFERRALS_KEY);
        return data ? JSON.parse(data) : [];
    },

    syncOfflineReferrals: async () => {
        const referrals = await offlineService.getOfflineReferrals();
        if (referrals.length === 0) return;

        const successfulSyncIds: string[] = [];
        for (const referral of referrals) {
            try {
                await referralService.create(referral);
                successfulSyncIds.push(referral.id);
            } catch (e) {
                console.error(`Failed to sync referral ${referral.id}`, e);
            }
        }

        const remaining = referrals.filter((r: any) => !successfulSyncIds.includes(r.id));
        await AsyncStorage.setItem(OFFLINE_REFERRALS_KEY, JSON.stringify(remaining));
        return successfulSyncIds.length;
    }
};

