import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface BarItem {
  label: string;
  /** Texte affiché à droite (valeur déjà formatée). */
  text: string;
  /** Largeur de la barre, de 0 à 100 (fournie par le composant parent). */
  percent: number;
}

@Component({
  selector: 'app-bar-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length === 0) {
      <p class="muted small">Aucune donnée.</p>
    } @else {
      <ul class="bars">
        @for (it of items(); track it.label) {
          <li>
            <div class="bar-head">
              <span class="bar-label">{{ it.label }}</span>
              <span class="bar-text">{{ it.text }}</span>
            </div>
            <div class="bar-track" role="presentation">
              <div class="bar-fill" [style.width.%]="it.percent"></div>
            </div>
          </li>
        }
      </ul>
    }
  `,
})
export class BarListComponent {
  readonly items = input.required<BarItem[]>();
}
