import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-pagination',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pagination">
      <span class="muted">{{ total() }} élément{{ total() > 1 ? 's' : '' }}</span>
      @if (totalPages() > 1) {
        <div class="pager">
          <button
            type="button"
            class="btn icon-only"
            aria-label="Page précédente"
            [disabled]="page() <= 0"
            (click)="pageChange.emit(page() - 1)"
          >
            <app-icon name="chevronLeft" />
          </button>
          <span class="pager-info">Page {{ page() + 1 }} sur {{ totalPages() }}</span>
          <button
            type="button"
            class="btn icon-only"
            aria-label="Page suivante"
            [disabled]="page() >= totalPages() - 1"
            (click)="pageChange.emit(page() + 1)"
          >
            <app-icon name="chevronRight" />
          </button>
        </div>
      }
    </div>
  `,
})
export class PaginationComponent {
  /** Numéro de page, à partir de 0. */
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly total = input.required<number>();
  readonly pageChange = output<number>();
}
