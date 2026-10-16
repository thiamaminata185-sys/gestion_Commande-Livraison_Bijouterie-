import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationItem, Paginated } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  readonly liste = signal<NotificationItem[]>([]);
  readonly nonLues = computed(() => this.liste().filter((n) => !n.lu).length);

  /** Charge la première page (sert aussi au badge de la cloche). */
  charger() {
    this.http.get<Paginated<NotificationItem>>(`${this.api}/notifications`).subscribe({
      next: (r) => this.liste.set(r.data),
      error: () => undefined,
    });
  }

  page(numero: number) {
    return this.http
      .get<Paginated<NotificationItem>>(`${this.api}/notifications`, { params: { page: numero } })
      .pipe(tap((r) => { if (numero === 1) this.liste.set(r.data); }));
  }

  marquerLue(id: number) {
    return this.http.patch(`${this.api}/notifications/${id}/lu`, {}).pipe(
      tap(() => this.liste.update((l) => l.map((n) => (n.idNotification === id ? { ...n, lu: true } : n)))),
    );
  }

  toutMarquerLu() {
    return this.http.patch(`${this.api}/notifications/tout-lu`, {}).pipe(
      tap(() => this.liste.update((l) => l.map((n) => ({ ...n, lu: true })))),
    );
  }

  vider() {
    this.liste.set([]);
  }
}
