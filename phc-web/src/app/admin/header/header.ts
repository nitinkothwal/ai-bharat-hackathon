import { Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthStore } from '../../core/auth/auth.store';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private authStore = inject(AuthStore);
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authStore.user;
  menuToggle = output<void>();

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/welcome/login']);
    });
  }
}
