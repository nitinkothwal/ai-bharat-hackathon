import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { DashboardStats, VillageStat, AshaPerformance } from './dashboard.model';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  stats = signal<DashboardStats>({
    totalPatients: 1240,
    totalReferrals: 856,
    highRiskReferrals: 142,
    completionRate: 78,
    trends: {
      patients: 12,
      referrals: 8,
      highRisk: -5,
      completion: 4
    }
  });

  villageStats = signal<VillageStat[]>([
    { name: 'Sitapur', count: 45, avgRisk: 'high' },
    { name: 'Lakhimpur', count: 38, avgRisk: 'medium' },
    { name: 'Hardoi', count: 32, avgRisk: 'low' },
    { name: 'Unnao', count: 28, avgRisk: 'low' },
    { name: 'Rae Bareli', count: 25, avgRisk: 'medium' }
  ]);

  ashaPerformance = signal<AshaPerformance[]>([
    { name: 'Sunita Devi', total: 52, highRisk: 12, avgScore: 0.45 },
    { name: 'Rajni Singh', total: 48, highRisk: 8, avgScore: 0.38 },
    { name: 'Priyanka Pal', total: 45, highRisk: 15, avgScore: 0.52 },
    { name: 'Maya Verma', total: 42, highRisk: 5, avgScore: 0.32 }
  ]);

  // Referral Types Pie Chart
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'bottom' },
    }
  };
  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: ['Pregnancy', 'Malnutrition', 'TB Suspect', 'Chronic'],
    datasets: [{
      data: [350, 220, 180, 106],
      backgroundColor: ['#673ab7', '#ff4081', '#ff9800', '#4caf50']
    }]
  };
  public pieChartType: ChartType = 'pie';

  // Weekly Trends Line Chart
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [65, 59, 80, 81, 56, 55, 40],
        label: 'Total Referrals',
        borderColor: '#673ab7',
        backgroundColor: 'rgba(103, 58, 183, 0.2)',
        fill: 'origin',
      },
      {
        data: [12, 18, 25, 20, 15, 12, 10],
        label: 'High Risk',
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        fill: 'origin',
      }
    ],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  };
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: { beginAtZero: true }
    }
  };

  // Status Stacked Bar Chart
  public barChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [
      { data: [65, 59, 80], label: 'Completed', backgroundColor: '#4caf50' },
      { data: [28, 48, 40], label: 'Pending', backgroundColor: '#ff9800' },
      { data: [10, 15, 12], label: 'Escalated', backgroundColor: '#f44336' }
    ]
  };
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: { stacked: true },
      y: { stacked: true }
    }
  };
}
