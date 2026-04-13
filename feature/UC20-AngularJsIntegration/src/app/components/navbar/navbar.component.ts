import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

export type Page = 'calc' | 'history';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  /** Currently active page – passed from parent via @Input */
  @Input() currentPage: Page = 'calc';

  /** Emits the page the user clicked */
  @Output() pageChange = new EventEmitter<Page>();

  /** Emits which auth tab to open ('login' | 'register') */
  @Output() openAuth = new EventEmitter<'login' | 'register'>();

  /** Expose user signal directly to template */
  currentUser = this.authService.currentUser;

  constructor(private authService: AuthService) {}

  navigate(page: Page): void {
    this.pageChange.emit(page);
  }

  logout(): void {
    this.authService.logout();
  }
}
