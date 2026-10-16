import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { NotificationItem } from '../../core/models';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { PaginationComponent } from '../../shared/shared';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe, PaginationComponent],
  template: `
    <div class="page-head">
      <h1>Notifications</h1>
      <button class="btn btn-ghost" [disabled]="service.nonLues() === 0" (click)="toutLire()">Tout marquer comme lu</button>
    </div>

    @if (chargement()) {
      <p class="muted">Chargement…</p>
    } @else if (items().length === 0) {
      <div class="card empty">Aucune notification pour le moment.</div>
    } @else {
      <div class="card">
        @for (n of items(); track n.idNotification) {
          <div class="notif" [class.unread]="!n.lu" (click)="lire(n)">
            <div class="notif-dot"></div>
            <div class="grow">
              <strong>{{ n.titre }}</strong>
              <p>{{ n.message }}</p>
              <small class="muted">{{ n.created_at | date: 'dd/MM/yyyy HH:mm' }}</small>
            </div>
          </div>
        }
      </div>
      <app-pagination [page]="page()" [last]="last()" (changed)="charger($event)" />
    }
  `,
})
export class NotificationsComponent implements OnInit {
  service = inject(NotificationService);
  private toast = inject(ToastService);

  items = signal<NotificationItem[]>([]);
  page = signal(1);
  last = signal(1);
  chargement = signal(true);

  ngOnInit() {
    this.charger(1);
  }

  charger(p: number) {
    this.chargement.set(true);
    this.service.page(p).subscribe({
      next: (r) => {
        this.items.set(r.data);
        this.page.set(r.current_page);
        this.last.set(r.last_page);
        this.chargement.set(false);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.chargement.set(false);
      },
    });
  }

  lire(n: NotificationItem) {
    if (n.lu) return;
    this.service.marquerLue(n.idNotification).subscribe({
      next: () => this.items.update((l) => l.map((x) => (x.idNotification === n.idNotification ? { ...x, lu: true } : x))),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  toutLire() {
    this.service.toutMarquerLu().subscribe({
      next: () => this.items.update((l) => l.map((x) => ({ ...x, lu: true }))),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
