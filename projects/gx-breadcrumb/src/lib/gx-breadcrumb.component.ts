import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, computed, effect, EventEmitter, inject, Input, Output } from '@angular/core';
import { BreadcrumbItem, GxBreadcrumbService, SeparatorType } from '../public-api';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lib-gx-breadcrumb',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './gx-breadcrumb.component.html',
  styleUrls: ['./gx-breadcrumb.component.scss']
})
export class GxBreadcrumbComponent {
  /** Separator every item of breadcrumb */
  @Input() separator: SeparatorType = 'slash';
  @Output() navigate = new EventEmitter<BreadcrumbItem>();

  private _service = inject(GxBreadcrumbService);

  readonly breadCrumbs;
  readonly displayItems;
  readonly logWhenChange;

  constructor() {
    this.breadCrumbs = toSignal(this._service.breadcrumbs$, { initialValue: [] as BreadcrumbItem[] });
    this.displayItems = computed(() => this.breadCrumbs().filter(b => !!b?.label));
    this.logWhenChange = effect(() => {
      const items = this.displayItems();
      // 這裡做副作用，例如 debug log
      // console.log('breadcrumbs changed:', items);
    })
  }

  getSeparatorSymbol(): string {
    return { chevron: '›', slash: '/', dot: '·', arrow: '→' }[this.separator] ?? '›';
  }

  onItemClick(item: BreadcrumbItem): void {
    this.navigate.emit(item);
  }
}
