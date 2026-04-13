import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  text: string;
  type: 'info' | 'error' | 'success';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new Subject<ToastMessage>();

  /** Observable that components subscribe to for incoming toasts */
  toast$ = this.toastSubject.asObservable();

  show(text: string, type: 'info' | 'error' | 'success' = 'info'): void {
    this.toastSubject.next({ text, type });
  }
}
