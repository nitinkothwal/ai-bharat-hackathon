import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

export interface DashboardStats {
    totalPatients: number;
    totalReferrals: number;
    highRiskReferrals: number;
    completionRate: number;
    trends: {
        patients: number; // percentage change
        referrals: number;
        highRisk: number;
        completion: number;
    };
}

export interface ChartWidgetConfig {
    type: ChartType;
    data: ChartData;
    options: ChartConfiguration['options'];
}

export interface VillageStat {
    name: string;
    count: number;
    avgRisk: 'low' | 'medium' | 'high';
}

export interface AshaPerformance {
    name: string;
    total: number;
    highRisk: number;
    avgScore: number;
}
