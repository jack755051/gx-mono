import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { filter, map, distinctUntilChanged } from 'rxjs/operators';
import { BreadcrumbItem } from './gx-breadcrumb.type';

@Injectable({
  providedIn: 'root'
})
export class GxBreadcrumbService {
  private breadcrumbsSubject = new BehaviorSubject<BreadcrumbItem[]>([]);
  public breadcrumbs$ = this.breadcrumbsSubject.asObservable();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.initRouteBreadcrumbs();
  }

  /**
   * 初始化響應式路由追蹤
   */
  private initRouteBreadcrumbs(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.buildBreadcrumbs()),
        distinctUntilChanged()
      )
      .subscribe(breadcrumbs => {
        this.breadcrumbsSubject.next(breadcrumbs);
      });
  }

  /**
   * 建立麵包屑導航陣列
   */
  private buildBreadcrumbs(): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];
    let route: ActivatedRoute | null = this.activatedRoute.root;
    let url = '';

    while (route) {
      if (route.snapshot.data['breadcrumb']) {
        url += route.snapshot.url.map(segment => segment.path).join('/');
        if (url) {
          url = '/' + url;
        }

        breadcrumbs.push({
          label: route.snapshot.data['breadcrumb'],
          url: url,
          params: route.snapshot.params
        });
      }
      route = route.firstChild;
    }

    return breadcrumbs;
  }  /**
   * 取得當前麵包屑
   */
  getCurrentBreadcrumbs(): BreadcrumbItem[] {
    return this.breadcrumbsSubject.value;
  }

  /**
   * 手動設定麵包屑
   */
  setBreadcrumbs(breadcrumbs: BreadcrumbItem[]): void {
    this.breadcrumbsSubject.next(breadcrumbs);
  }

  /**
   * 新增麵包屑項目
   */
  addBreadcrumb(item: BreadcrumbItem): void {
    const currentBreadcrumbs = this.getCurrentBreadcrumbs();
    this.breadcrumbsSubject.next([...currentBreadcrumbs, item]);
  }

  /**
   * 清除所有麵包屑
   */
  clearBreadcrumbs(): void {
    this.breadcrumbsSubject.next([]);
  }
}
