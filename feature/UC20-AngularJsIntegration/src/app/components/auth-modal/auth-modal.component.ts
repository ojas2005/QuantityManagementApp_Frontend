import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss']
})
export class AuthModalComponent implements OnInit {
  /** Whether the modal backdrop is visible */
  @Input() isOpen = false;

  /** Which tab to show initially – parent controls via @Input */
  @Input() activeTab: 'login' | 'register' = 'login';

  /** Emits when the modal should close */
  @Output() closed = new EventEmitter<void>();

  loginForm!: FormGroup;
  registerForm!: FormGroup;
  loginError = '';
  registerError = '';
  isLoadingLogin = false;
  isLoadingRegister = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      emailOrUsername: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  close(): void {
    this.loginError = '';
    this.registerError = '';
    this.closed.emit();
  }

  switchTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.loginError = '';
    this.registerError = '';
  }

  googleLogin(): void {
    this.authService.redirectGoogleLogin();
  }

  doLogin(): void {
    if (this.loginForm.invalid) {
      this.loginError = 'Please fill in all fields.';
      return;
    }
    this.isLoadingLogin = true;
    this.loginError = '';
    const { emailOrUsername, password } = this.loginForm.value;
    this.authService.login(emailOrUsername, password).subscribe({
      next: (data) => {
        this.isLoadingLogin = false;
        if (data.success && data.user && data.token) {
          this.authService.setUser({
            username: data.user.username,
            email: data.user.email,
            token: data.token
          });
          this.toastService.show(`Welcome ${data.user.username || data.user.email}! 👋`);
          this.close();
        } else {
          this.loginError = data.message || 'Login failed';
        }
      },
      error: (e) => {
        this.isLoadingLogin = false;
        this.loginError = e.error?.message || e.message || 'Login failed';
      }
    });
  }

  doRegister(): void {
    if (this.registerForm.invalid) {
      this.registerError = 'Please fill in all fields correctly (password min 6 chars).';
      return;
    }
    this.isLoadingRegister = true;
    this.registerError = '';
    const { username, email, password } = this.registerForm.value;
    this.authService.register(username, email, password).subscribe({
      next: (data) => {
        this.isLoadingRegister = false;
        if (data.success && data.user && data.token) {
          this.authService.setUser({
            username: data.user.username,
            email,
            token: data.token
          });
          this.toastService.show('Account created! 🎉');
          this.close();
        } else {
          this.registerError = data.message || 'Registration failed';
        }
      },
      error: (e) => {
        this.isLoadingRegister = false;
        this.registerError = e.error?.message || e.message || 'Registration failed';
      }
    });
  }
}
