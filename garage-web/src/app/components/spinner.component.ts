import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Spinner de chargement unique, utilisé partout :
 * - en bloc (variante par défaut, avec un texte facultatif) ;
 * - en ligne dans un bouton (variante « inline »).
 */
@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.block]': '!inline()',
    '[class.inline]': 'inline()',
    role: 'status',
    'aria-live': 'polite',
  },
  template: `
    <span class="ring" [style.width.px]="size()" [style.height.px]="size()"></span>
    @if (label()) {
      <span class="label">{{ label() }}</span>
    } @else {
      <span class="sr-only">Chargement</span>
    }
  `,
})
export class SpinnerComponent {
  readonly size = input(32);
  readonly label = input<string>('');
  readonly inline = input(false);
}
