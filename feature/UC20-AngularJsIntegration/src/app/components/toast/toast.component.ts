import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, ToastMessage } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit, OnDestroy {
  message: ToastMessage | null = null;
  visible = false;

  private sub!: Subscription;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.sub = this.toastService.toast$.subscribe(msg => {
      this.message = msg;
      this.visible = true;
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => (this.visible = false), 2200);
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.timer) clearTimeout(this.timer);
  }
}
