import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MeasurementRecord } from '../models/measurement.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MeasurementService {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...this.authService.getAuthHeaders()
    });
  }

  saveOperation(payload: MeasurementRecord): Observable<any> {
    return this.http.post(
      `${environment.apiBase}/api/Measurement`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  fetchHistory(): Observable<MeasurementRecord[]> {
    return this.http.get<any>(
      `${environment.apiBase}/api/Measurement/history`,
      { headers: this.getHeaders() }
    ).pipe(
      map(data => data.$values ?? data ?? [])
    );
  }

  /** Ping the backend health endpoint */
  checkHealth(): Promise<boolean> {
    return fetch(`${environment.apiBase}/health`, {
      signal: AbortSignal.timeout(2000)
    })
      .then(r => r.ok)
      .catch(() => false);
  }
}
