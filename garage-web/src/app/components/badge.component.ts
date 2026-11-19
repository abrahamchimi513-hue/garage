import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LibellePipe } from '../utils/format';

/** Pastille colorée pour un statut, un carburant ou une catégorie. */
@Component({
  selector: 'app-badge',
  imports: [LibellePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [attr.data-v]="value()">{{ value() | libelle }}</span>`,
})
export class BadgeComponent {
  readonly value = input.required<string>();
}
