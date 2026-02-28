import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-side-nav',
  imports: [MatListModule, MatIconModule, RouterModule],
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.scss',
})
export class SideNav {

  sideNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/admin/patients', label: 'Patients', icon: 'person' },
    { path: '/admin/referrals', label: 'Referrals', icon: 'assignment' },
  ];
}
