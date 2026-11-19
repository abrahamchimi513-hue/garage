import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-notification',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notices" aria-live="polite">
      @for (n of svc.notices(); track n.id) {
        <div class="notice" [class.is-error]="n.type === 'error'" [attr.role]="n.type === 'error' ? 'alert' : 'status'">
          <app-icon [name]="n.type === 'error' ? 'circleX' : 'circleCheck'" [size]="20" />
          <span class="notice-text">{{ n.text }}</span>
          <button type="button" class="notice-close" aria-label="Fermer" (click)="svc.dismiss(n.id)">
            <app-icon name="x" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
})
export class NotificationComponent {
  protected readonly svc = inject(NotificationService);
}
