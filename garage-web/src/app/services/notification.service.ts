import { Injectable, signal } from '@angular/core';

export interface Notice {
  id: number;
  type: 'success' | 'error';
  text: string;
}

/** Messages de succès ou d'erreur visibles sur toutes les pages. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notices = signal<Notice[]>([]);
  private nextId = 1;

  success(text: string): void {
    this.push('success', text, 4000);
  }

  error(text: string): void {
    this.push('error', text, 8000);
  }

  dismiss(id: number): void {
    this.notices.update((list) => list.filter((n) => n.id !== id));
  }

  private push(type: Notice['type'], text: string, durationMs: number): void {
    const id = this.nextId++;
    this.notices.update((list) => [...list, { id, type, text }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }
}
