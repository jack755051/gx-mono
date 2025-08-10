import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, computed, effect, EventEmitter, inject, Input, Output } from '@angular/core';
import { BreadcrumbItem, BreadcrumbSize, BreadcrumbTheme, GxBreadcrumbService, SeparatorType } from '../public-api';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lib-gx-breadcrumb',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './gx-breadcrumb.component.html',
  styleUrls: ['./gx-breadcrumb.component.scss']
})
export class GxBreadcrumbComponent {
  /** 分隔符類型 */
  @Input() separator: SeparatorType = 'chevron';
  /** 主題風格 */
  @Input() theme: BreadcrumbTheme = 'default';
  /** 尺寸大小 */
  @Input() size: BreadcrumbSize = 'md';
  /** 是否顯示首頁圖標 */
  @Input() showHomeIcon: boolean = true;
  /** 首頁標籤文字 */
  @Input() homeLabel: string = '首頁';
  /** 首頁路由路徑 */
  @Input() homeRoute: string = '/';
  /** 最大顯示項目數量（超過則用省略號） */
  @Input() maxItems: number = 0;
  /** 導航事件 */
  @Output() navigate = new EventEmitter<BreadcrumbItem>();

  private _service = inject(GxBreadcrumbService);
  private _router = inject(Router);

  readonly breadCrumbs = toSignal(this._service.breadcrumbs$, {
    initialValue: [] as BreadcrumbItem[]
  });

  readonly displayItems = computed(() =>
    this.breadCrumbs().filter(b => !!b?.label)
  );

  readonly finalDisplayItems = computed(() => {
    const items = this.displayItems();
    const homeItem: BreadcrumbItem = {
      label: this.homeLabel,
      url: this.homeRoute,
      params: {}
    };

    // 確保首頁始終存在
    const hasHome = items.some(item => item.url === this.homeRoute);
    const allItems = hasHome ? items : [homeItem, ...items];

    // 處理最大顯示數量
    if (this.maxItems > 0 && allItems.length > this.maxItems) {
      const firstItems = allItems.slice(0, 1); // 首頁
      const lastItems = allItems.slice(-(this.maxItems - 2)); // 最後幾項
      const ellipsisItem: BreadcrumbItem = {
        label: '...',
        url: '',
        params: {}
      };
      return [...firstItems, ellipsisItem, ...lastItems];
    }

    return allItems;
  });

  readonly logWhenChange = effect(() => {
    const items = this.finalDisplayItems();
    // 這裡做副作用，例如 debug log
    // console.log('breadcrumbs changed:', items);
  });

  constructor() {}

  getSeparatorSymbol(): string {
    const symbols = {
      chevron: '›',
      slash: '/',
      dot: '·',
      arrow: '→',
      pipe: '|',
      doubleChevron: '»'
    };
    return symbols[this.separator] ?? '›';
  }

  onItemClick(item: BreadcrumbItem): void {
    if (item.url && item.label !== '...') {
      // 發出導航事件
      this.navigate.emit(item);

      // 執行路由跳轉
      this._router.navigate([item.url], {
        queryParams: item.params
      });
    }
  }
}
