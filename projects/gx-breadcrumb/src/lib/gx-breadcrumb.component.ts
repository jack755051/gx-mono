import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, computed, effect, EventEmitter, inject, Input, Output, signal, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { BreadcrumbItem, GxBreadcrumbService, SeparatorType, BreadcrumbTheme, BreadcrumbSize, IconType } from '../public-api';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Home, Folder, File, Settings, User, Package, Database, Globe, Lock, ChevronRight, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'lib-gx-breadcrumb',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: './gx-breadcrumb.component.html',
  styleUrls: ['./gx-breadcrumb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // 性能優化
})
export class GxBreadcrumbComponent implements OnDestroy {
  // ===== 圖示引用 =====
  readonly HomeIcon = Home;
  readonly FolderIcon = Folder;
  readonly FileIcon = File;
  readonly SettingsIcon = Settings;
  readonly UserIcon = User;
  readonly PackageIcon = Package;
  readonly DatabaseIcon = Database;
  readonly GlobeIcon = Globe;
  readonly LockIcon = Lock;
  readonly ChevronRightIcon = ChevronRight;
  readonly ArrowRightIcon = ArrowRight;

  // ===== 輸入屬性 =====
  /** 分隔符類型 */
  @Input() separator: SeparatorType = 'chevron';

  /** 主題風格 */
  @Input() theme: BreadcrumbTheme = 'modern';

  /** 尺寸大小 */
  @Input() size: BreadcrumbSize = 'md';

  /** 是否顯示首頁圖標 */
  @Input() showHomeIcon: boolean = true;

  /** 首頁標籤文字 */
  @Input() homeLabel: string = '首頁';

  /** 首頁路由路徑 */
  @Input() homeRoute: string = '/';

  /** 是否自動添加首頁 */
  @Input() autoHome: boolean = true;

  /** 最大顯示項目數量（超過則用省略號） */
  @Input() maxItems: number = 0;

  /** 是否啟用動畫效果 */
  @Input() enableAnimation: boolean = true;

  /** 是否啟用 hover 效果 */
  @Input() enableHover: boolean = true;

  // ===== 輸出事件 =====
  /** 導航事件 */
  @Output() navigate = new EventEmitter<BreadcrumbItem>();

  /** Hover 事件 */
  @Output() itemHover = new EventEmitter<{item: BreadcrumbItem, isHovered: boolean}>();

  /** 麵包屑變更事件 */
  @Output() breadcrumbsChange = new EventEmitter<BreadcrumbItem[]>();

  // ===== 私有屬性 =====
  private readonly _service = inject(GxBreadcrumbService);
  private readonly _router = inject(Router);
  private readonly hoveredItem = signal<BreadcrumbItem | null>(null);

  // ===== 響應式資料 =====
  readonly breadCrumbs = toSignal(this._service.breadcrumbs$, {
    initialValue: [] as BreadcrumbItem[]
  });

  readonly displayItems = computed(() => {
    const items = this.breadCrumbs();
    return items?.filter(item => item && typeof item.label === 'string' && item.label.trim()) || [];
  });

  readonly finalDisplayItems = computed(() => {
    const items = this.displayItems();

    try {
      // 如果禁用自動首頁，直接返回處理後的項目
      if (!this.autoHome) {
        return this.applyMaxItems(items);
      }

      // 如果沒有任何項目，返回首頁
      if (items.length === 0) {
        return [this.createHomeItem()];
      }

      // 智能檢測是否已存在首頁
      const hasHome = items.some(item => this.isHomeItem(item));
      let allItems = items;

      // 如果沒有首頁且有其他項目，添加首頁
      if (!hasHome && items.length > 0) {
        allItems = [this.createHomeItem(), ...items];
      }

      return this.applyMaxItems(allItems);
    } catch (error) {
      console.warn('Error processing breadcrumb items:', error);
      return [this.createHomeItem()]; // 容錯處理
    }
  });

  // ===== 副作用處理 =====
  private readonly logWhenChange = effect(() => {
    const items = this.finalDisplayItems();
    this.breadcrumbsChange.emit(items);

    // 開發模式下的調試日誌
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      console.debug('Breadcrumbs changed:', items);
    }
  });

  // ===== 公開方法 =====

  /**
   * 取得分隔符號
   */
  getSeparatorSymbol(): string {
    const symbols: Record<SeparatorType, string> = {
      chevron: '›',
      slash: '/',
      dot: '·',
      arrow: '→',
      pipe: '|',
      doubleChevron: '»'
    };
    return symbols[this.separator] || '›';
  }

  /**
   * 根據主題取得分隔符內容
   */
  getSeparatorContent(): string {
    const themeSpecificSeparators: Record<string, string> = {
      glass: '/',
      minimal: '·',
      colorful: '›'
    };

    return themeSpecificSeparators[this.theme] || this.getSeparatorSymbol();
  }

  /**
   * 取得圖示實例
   */
  getIconInstance(iconName?: IconType) {
    if (!iconName) return null;

    const iconMap: Record<IconType, any> = {
      'home': this.HomeIcon,
      'folder': this.FolderIcon,
      'file': this.FileIcon,
      'settings': this.SettingsIcon,
      'user': this.UserIcon,
      'package': this.PackageIcon,
      'database': this.DatabaseIcon,
      'globe': this.GlobeIcon,
      'lock': this.LockIcon,
      'chevron-right': this.ChevronRightIcon,
      'arrow-right': this.ArrowRightIcon
    };

    return iconMap[iconName] || null;
  }

  /**
   * 處理項目點擊
   */
  onItemClick(item: BreadcrumbItem): void {
    // 防護檢查
    if (!item || item.disabled || item.clickAble === false) {
      return;
    }

    try {
      // 發出導航事件
      this.navigate.emit(item);

      // 執行路由跳轉
      if (item.url && item.url.trim()) {
        const navigationExtras = {
          queryParams: item.params || undefined,
          queryParamsHandling: 'merge' as const
        };

        this._router.navigate([item.url], navigationExtras);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  /**
   * 處理項目 hover
   */
  onItemHover(item: BreadcrumbItem, isHovered: boolean): void {
    if (!this.enableHover || !item) {
      return;
    }

    this.hoveredItem.set(isHovered ? item : null);
    this.itemHover.emit({ item, isHovered });
  }

  /**
   * 檢查項目是否處於 hover 狀態
   */
  isItemHovered(item: BreadcrumbItem): boolean {
    return this.enableHover && this.hoveredItem() === item;
  }

  /**
   * 手動重新載入麵包屑
   */
  reload(): void {
    this._service.reload();
  }

  /**
   * 清除所有麵包屑
   */
  clear(): void {
    this._service.clearBreadcrumbs();
  }

  // ===== 生命週期 =====
  ngOnDestroy(): void {
    // 清理資源
    this.navigate.complete();
    this.itemHover.complete();
    this.breadcrumbsChange.complete();
  }

  // ===== 私有方法 =====

  /**
   * 創建首頁項目
   */
  private createHomeItem(): BreadcrumbItem {
    return {
      label: this.homeLabel || '首頁',
      url: this.homeRoute || '/',
      params: {},
      icon: 'home' as IconType,
      clickAble: true,
      disabled: false,
      active: false
    };
  }

  /**
   * 檢查是否為首頁項目
   */
  private isHomeItem(item: BreadcrumbItem): boolean {
    if (!item?.url) return false;

    const normalizeUrl = (url: string): string => {
      if (!url) return '/';

      // 移除結尾斜線並確保開頭有斜線
      let normalized = url.replace(/\/+$/, '');
      if (!normalized.startsWith('/')) {
        normalized = '/' + normalized;
      }
      return normalized || '/';
    };

    const itemUrl = normalizeUrl(item.url);
    const homeUrl = normalizeUrl(this.homeRoute);

    return itemUrl === homeUrl;
  }

  /**
   * 應用最大項目數量限制
   */
  private applyMaxItems(items: BreadcrumbItem[]): BreadcrumbItem[] {
    if (!items || items.length === 0) {
      return [];
    }

    if (this.maxItems <= 0 || items.length <= this.maxItems) {
      return [...items]; // 返回副本
    }

    // 確保至少顯示首頁和當前頁面
    if (this.maxItems < 3) {
      return items.slice(0, this.maxItems);
    }

    const firstItems = items.slice(0, 1); // 首頁
    const lastItems = items.slice(-(this.maxItems - 2)); // 最後幾項
    const ellipsisItem: BreadcrumbItem = {
      label: '...',
      url: '',
      params: {},
      clickAble: false,
      disabled: true,
      active: false
    };

    return [...firstItems, ellipsisItem, ...lastItems];
  }
}
