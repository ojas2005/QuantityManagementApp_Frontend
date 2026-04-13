import { Component, OnInit, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeasurementService } from '../../services/measurement.service';
import { AuthService } from '../../services/auth.service';
import { MeasurementRecord } from '../../models/measurement.model';

type FilterKey = 'all' | 'convert' | 'add' | 'subtract' | 'multiply' | 'divide' | 'compare';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  @Output() openAuth = new EventEmitter<'login' | 'register'>();

  historyData: MeasurementRecord[] = [];
  activeFilter = signal<FilterKey>('all');
  isLoading    = signal(false);
  error        = signal('');

  filteredHistory = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.historyData;
    return this.historyData.filter(h => h.operationType?.toLowerCase() === f);
  });

  readonly filters: { key: FilterKey; label: string }[] = [
    { key: 'all',      label: 'All'      },
    { key: 'convert',  label: 'Convert'  },
    { key: 'add',      label: 'Add'      },
    { key: 'subtract', label: 'Subtract' },
    { key: 'multiply', label: 'Multiply' },
    { key: 'divide',   label: 'Divide'   },
    { key: 'compare',  label: 'Compare'  }
  ];

  currentUser = this.authService.currentUser;

  constructor(
    private measurementService: MeasurementService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.currentUser()) this.fetchHistory();
  }

  fetchHistory(): void {
    this.isLoading.set(true);
    this.error.set('');
    this.measurementService.fetchHistory().subscribe({
      next:  (data) => { this.historyData = data; this.isLoading.set(false); },
      error: (e)    => { this.error.set(e.message || 'Failed to load history'); this.isLoading.set(false); }
    });
  }

  setFilter(key: FilterKey): void { this.activeFilter.set(key); }

  formatDate(ts?: string): string { return ts ? new Date(ts).toLocaleString() : ''; }

  badgeClass(opType: string): string {
    const map: Record<string, string> = {
      convert: 'badge-blue', add: 'badge-green', subtract: 'badge-orange',
      multiply: 'badge-purple', divide: 'badge-red', compare: 'badge-teal'
    };
    return map[opType?.toLowerCase()] ?? 'badge-blue';
  }
}
