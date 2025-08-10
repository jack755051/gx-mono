import { Injectable, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { filter, map, distinctUntilChanged, shareReplay, takeUntil, catchError } from 'rxjs/operators';
import { BreadcrumbItem, IconType } from './gx-breadcrumb.type';

export interface BreadcrumbConfig {
  /** 是否啟用路由自動追蹤 */
  autoTrack?: boolean;
  /** 是否啟用調試模式 */
  debug?: boolean;
  /** 預設圖標 */
  defaultIcon?: IconType | null;
  /** URL 正規化選項 */
  urlNormalization?: {
    removeTrailingSlash?: boolean;
    lowercase?: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GxBreadcrumbService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly breadcrumbsSubject = new BehaviorSubject<BreadcrumbItem[]>([]);
  private readonly config: Required<BreadcrumbConfig>;

  // 緩存機制
  private routeCache = new Map<string, BreadcrumbItem[]>();
  private readonly maxCacheSize = 50;

  public readonly breadcrumbs$: Observable<BreadcrumbItem[]> = this.breadcrumbsSubject.asObservable().pipe(
    distinctUntilChanged((prev, curr) => this.compareArrays(prev, curr)),
    shareReplay(1),
    takeUntil(this.destroy$)
  );

  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) {
    // 預設配置
    this.config = {
      autoTrack: true,
      debug: false,
      defaultIcon: null,
      urlNormalization: {
        removeTrailingSlash: true,
        lowercase: false
      }
    };

    this.initRouteBreadcrumbs();
  }

  // ===== 公開方法 =====

  /**
   * 設定服務配置
   */
  configure(config: Partial<BreadcrumbConfig>): void {
    Object.assign(this.config, config);

    if (this.config.debug) {
      console.log('GxBreadcrumbService configured:', this.config);
    }
  }

  /**
   * 取得當前麵包屑
   */
  getCurrentBreadcrumbs(): BreadcrumbItem[] {
    return this.breadcrumbsSubject.value;
  }

  /**
   * 手動設定麵包屑
   */
  setBreadcrumbs(breadcrumbs: BreadcrumbItem[]): void {
    try {
      const validatedBreadcrumbs = this.validateBreadcrumbs(breadcrumbs);
      this.breadcrumbsSubject.next(validatedBreadcrumbs);

      if (this.config.debug) {
        console.log('Breadcrumbs set manually:', validatedBreadcrumbs);
      }
    } catch (error) {
      console.error('Error setting breadcrumbs:', error);
    }
  }

  /**
   * 新增麵包屑項目
   */
  addBreadcrumb(item: BreadcrumbItem): void {
    try {
      const validatedItem = this.validateBreadcrumbItem(item);
      const currentBreadcrumbs = this.getCurrentBreadcrumbs();
      const newBreadcrumbs = [...currentBreadcrumbs, validatedItem];

      this.breadcrumbsSubject.next(newBreadcrumbs);

      if (this.config.debug) {
        console.log('Breadcrumb added:', validatedItem);
      }
    } catch (error) {
      console.error('Error adding breadcrumb:', error);
    }
  }

  /**
   * 插入麵包屑項目到指定位置
   */
  insertBreadcrumb(item: BreadcrumbItem, index: number): void {
    try {
      const validatedItem = this.validateBreadcrumbItem(item);
      const currentBreadcrumbs = this.getCurrentBreadcrumbs();
      const newBreadcrumbs = [...currentBreadcrumbs];

      newBreadcrumbs.splice(Math.max(0, Math.min(index, newBreadcrumbs.length)), 0, validatedItem);
      this.breadcrumbsSubject.next(newBreadcrumbs);

      if (this.config.debug) {
        console.log(`Breadcrumb inserted at index ${index}:`, validatedItem);
      }
    } catch (error) {
      console.error('Error inserting breadcrumb:', error);
    }
  }

  /**
   * 移除指定索引的麵包屑
   */
  removeBreadcrumb(index: number): void {
    try {
      const currentBreadcrumbs = this.getCurrentBreadcrumbs();

      if (index >= 0 && index < currentBreadcrumbs.length) {
        const newBreadcrumbs = currentBreadcrumbs.filter((_, i) => i !== index);
        this.breadcrumbsSubject.next(newBreadcrumbs);

        if (this.config.debug) {
          console.log(`Breadcrumb removed at index ${index}`);
        }
      }
    } catch (error) {
      console.error('Error removing breadcrumb:', error);
    }
  }

  /**
   * 更新特定麵包屑項目
   */
  updateBreadcrumb(index: number, item: Partial<BreadcrumbItem>): void {
    try {
      const currentBreadcrumbs = this.getCurrentBreadcrumbs();

      if (index >= 0 && index < currentBreadcrumbs.length) {
        const newBreadcrumbs = [...currentBreadcrumbs];
        const updatedItem = { ...currentBreadcrumbs[index], ...item };
        const validatedItem = this.validateBreadcrumbItem(updatedItem);

        newBreadcrumbs[index] = validatedItem;
        this.breadcrumbsSubject.next(newBreadcrumbs);

        if (this.config.debug) {
          console.log(`Breadcrumb updated at index ${index}:`, validatedItem);
        }
      }
    } catch (error) {
      console.error('Error updating breadcrumb:', error);
    }
  }

  /**
   * 清除所有麵包屑
   */
  clearBreadcrumbs(): void {
    this.breadcrumbsSubject.next([]);
    this.clearCache();

    if (this.config.debug) {
      console.log('All breadcrumbs cleared');
    }
  }

  /**
   * 重新載入當前路由的麵包屑
   */
  reload(): void {
    const currentUrl = this.router.url;
    this.routeCache.delete(currentUrl);

    const breadcrumbs = this.buildBreadcrumbs();
    this.breadcrumbsSubject.next(breadcrumbs);

    if (this.config.debug) {
      console.log('Breadcrumbs reloaded for:', currentUrl);
    }
  }

  /**
   * 清除緩存
   */
  clearCache(): void {
    this.routeCache.clear();

    if (this.config.debug) {
      console.log('Route cache cleared');
    }
  }

  /**
   * 取得緩存統計
   */
  getCacheStats(): { size: number; maxSize: number; urls: string[] } {
    return {
      size: this.routeCache.size,
      maxSize: this.maxCacheSize,
      urls: Array.from(this.routeCache.keys())
    };
  }

  // ===== 生命週期 =====
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.breadcrumbsSubject.complete();
    this.clearCache();
  }

  // ===== 私有方法 =====

  /**
   * 初始化路由麵包屑追蹤
   */
  private initRouteBreadcrumbs(): void {
    if (!this.config.autoTrack) {
      return;
    }

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => {
          const currentUrl = this.router.url;

          // 檢查緩存
          if (this.routeCache.has(currentUrl)) {
            const cached = this.routeCache.get(currentUrl)!;
            if (this.config.debug) {
              console.log('Using cached breadcrumbs for:', currentUrl);
            }
            return cached;
          }

          // 建立新的麵包屑
          const breadcrumbs = this.buildBreadcrumbs();

          // 更新緩存
          this.updateCache(currentUrl, breadcrumbs);

          return breadcrumbs;
        }),
        distinctUntilChanged((prev, curr) => this.compareArrays(prev, curr)),
        catchError((error) => {
          console.error('Error in breadcrumb navigation tracking:', error);
          return []; // 返回空陣列作為容錯
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(breadcrumbs => {
        this.breadcrumbsSubject.next(breadcrumbs);
      });
  }

  /**
   * 建立麵包屑導航陣列
   */
  private buildBreadcrumbs(): BreadcrumbItem[] {
    try {
      const breadcrumbs: BreadcrumbItem[] = [];
      let route: ActivatedRoute | null = this.activatedRoute.root;
      let url = '';

      while (route) {
        const routeSnapshot = route.snapshot;

        if (this.hasBreadcrumbData(routeSnapshot)) {
          // 建構 URL
          const segments = routeSnapshot.url.map(segment => segment.path);
          if (segments.length > 0) {
            url += '/' + segments.join('/');
          }

          // 正規化 URL
          url = this.normalizeUrl(url);

          // 建立麵包屑項目
          const breadcrumbItem: BreadcrumbItem = {
            label: this.extractLabel(routeSnapshot),
            url: url || '/',
            params: { ...routeSnapshot.params },
            queryParams: { ...routeSnapshot.queryParams },
            icon: this.extractIcon(routeSnapshot),
            disabled: this.extractBoolean(routeSnapshot, 'breadcrumbDisabled', false),
            clickAble: this.extractBoolean(routeSnapshot, 'breadcrumbClickable', true),
            active: this.extractBoolean(routeSnapshot, 'breadcrumbActive', false)
          };

          breadcrumbs.push(breadcrumbItem);
        }

        route = route.firstChild;
      }

      if (this.config.debug) {
        console.log('Built breadcrumbs:', breadcrumbs);
      }

      return breadcrumbs;
    } catch (error) {
      console.error('Error building breadcrumbs:', error);
      return [];
    }
  }

  /**
   * 檢查路由是否有麵包屑資料
   */
  private hasBreadcrumbData(route: ActivatedRouteSnapshot): boolean {
    return !!(route.data && route.data['breadcrumb']);
  }

  /**
   * 提取標籤
   */
  private extractLabel(route: ActivatedRouteSnapshot): string {
    const label = route.data['breadcrumb'];

    if (typeof label === 'function') {
      try {
        return label(route) || '未知頁面';
      } catch (error) {
        console.warn('Error executing breadcrumb label function:', error);
        return '未知頁面';
      }
    }

    return typeof label === 'string' ? label : '未知頁面';
  }

  /**
   * 提取圖標
   */
  private extractIcon(route: ActivatedRouteSnapshot): IconType | undefined {
    return route.data['breadcrumbIcon'] || this.config.defaultIcon;
  }

  /**
   * 提取布林值
   */
  private extractBoolean(route: ActivatedRouteSnapshot, key: string, defaultValue: boolean): boolean {
    const value = route.data[key];
    return typeof value === 'boolean' ? value : defaultValue;
  }

  /**
   * 正規化 URL
   */
  private normalizeUrl(url: string): string {
    if (!url) return '/';

    let normalized = url;

    // 移除重複的斜線
    normalized = normalized.replace(/\/+/g, '/');

    // 確保開頭有斜線
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }

    // 根據配置移除結尾斜線
    if (this.config.urlNormalization.removeTrailingSlash && normalized.length > 1) {
      normalized = normalized.replace(/\/+$/, '');
    }

    // 根據配置轉換為小寫
    if (this.config.urlNormalization.lowercase) {
      normalized = normalized.toLowerCase();
    }

    return normalized;
  }

  /**
   * 驗證麵包屑陣列
   */
  private validateBreadcrumbs(breadcrumbs: BreadcrumbItem[]): BreadcrumbItem[] {
    if (!Array.isArray(breadcrumbs)) {
      throw new Error('Breadcrumbs must be an array');
    }

    return breadcrumbs
      .map(item => this.validateBreadcrumbItem(item))
      .filter(item => item !== null) as BreadcrumbItem[];
  }

  /**
   * 驗證單個麵包屑項目
   */
  private validateBreadcrumbItem(item: BreadcrumbItem): BreadcrumbItem {
    if (!item || typeof item !== 'object') {
      throw new Error('Breadcrumb item must be an object');
    }

    if (!item.label || typeof item.label !== 'string') {
      throw new Error('Breadcrumb item must have a valid label');
    }

    return {
      label: item.label.trim(),
      url: item.url || '',
      params: item.params || {},
      queryParams: item.queryParams || {},
      icon: item.icon,
      disabled: Boolean(item.disabled),
      clickAble: item.clickAble !== false,
      active: Boolean(item.active)
    };
  }

  /**
   * 更新緩存
   */
  private updateCache(url: string, breadcrumbs: BreadcrumbItem[]): void {
    // 如果緩存已滿，移除最舊的項目
    if (this.routeCache.size >= this.maxCacheSize) {
      const firstKey = this.routeCache.keys().next().value;
      if (firstKey) {
        this.routeCache.delete(firstKey);
      }
    }

    this.routeCache.set(url, [...breadcrumbs]);
  }

  /**
   * 比較陣列是否相等
   */
  private compareArrays(a: BreadcrumbItem[], b: BreadcrumbItem[]): boolean {
    if (a.length !== b.length) return false;

    return a.every((item, index) => {
      const other = b[index];
      return item.label === other.label &&
             item.url === other.url &&
             item.disabled === other.disabled &&
             item.clickAble === other.clickAble &&
             item.active === other.active &&
             item.icon === other.icon;
    });
  }
}
