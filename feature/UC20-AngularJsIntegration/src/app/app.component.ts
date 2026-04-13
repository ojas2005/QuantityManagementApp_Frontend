import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent, Page } from './components/navbar/navbar.component';
import { CalculatorComponent } from './components/calculator/calculator.component';
import { HistoryComponent } from './components/history/history.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import { ToastComponent } from './components/toast/toast.component';
import { AuthService } from './services/auth.service';
import { MeasurementService } from './services/measurement.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    CalculatorComponent,
    HistoryComponent,
    AuthModalComponent,
    ToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  // ─── Page state (signal) ────────────────────────────────────────────────────
  currentPage = signal<Page>('calc');

  // ─── Auth modal state ───────────────────────────────────────────────────────
  authModalOpen    = signal(false);
  authModalTab     = signal<'login' | 'register'>('login');

  // ─── API status ─────────────────────────────────────────────────────────────
  apiStatus = signal('API: checking…');

  constructor(
    private authService: AuthService,
    private measurementService: MeasurementService
  ) {}

  ngOnInit(): void {
    // Handle Google OAuth callback params in URL
    this.authService.handleOAuthCallback();
    // Ping backend
    this.measurementService.checkHealth().then(ok =>
      this.apiStatus.set(ok ? '✅ API: online' : '⚠️ API offline — check environment.ts')
    );
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────
  navigateTo(page: Page): void {
    this.currentPage.set(page);
  }

  // ─── Auth modal helpers ─────────────────────────────────────────────────────
  openAuthModal(tab: 'login' | 'register'): void {
    this.authModalTab.set(tab);
    this.authModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.authModalOpen.set(false);
  }
}
