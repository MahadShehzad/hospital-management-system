import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'danger' | 'info' | 'warning';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  success(text: string) {
    this.push('success', text);
  }
  error(text: string) {
    this.push('danger', text);
  }
  info(text: string) {
    this.push('info', text);
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, text: string) {
    const toast: Toast = { id: this.nextId++, kind, text };
    this.toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), 5000);
  }
}
