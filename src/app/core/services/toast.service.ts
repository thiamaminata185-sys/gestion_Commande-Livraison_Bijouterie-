import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; type: 'success' | 'error' | 'info'; text: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  success(text: string) { this.push('success', text); }
  error(text: string) { this.push('error', text); }
  info(text: string) { this.push('info', text); }

  dismiss(id: number) {
    this.toasts.update((l) => l.filter((t) => t.id !== id));
  }

  private push(type: Toast['type'], text: string) {
    const id = ++this.seq;
    this.toasts.update((l) => [...l, { id, type, text }]);
    setTimeout(() => this.dismiss(id), 4500);
  }
}
