export interface BreadcrumbItem {
  /** 顯示標籤 */
  label: string;
  /** 路由 URL */
  url?: string;
  /** 路由參數 */
  params?: Record<string, any>;
  /** 查詢參數 */
  queryParams?: Record<string, any>;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可點擊 */
  clickAble?: boolean;
  /** 是否為活動狀態 */
  active?: boolean;
  /** 圖標名稱 */
  icon?: IconType;
  /** 子項目（用於複雜導航結構） */
  children?: BreadcrumbItem[];
  /** 額外的 CSS 類名 */
  cssClass?: string;
}

export type IconType =
  | 'home'
  | 'folder'
  | 'file'
  | 'settings'
  | 'user'
  | 'package'
  | 'database'
  | 'globe'
  | 'lock'
  | 'chevron-right'
  | 'arrow-right';

export type SeparatorType =
  | 'chevron'      // ›
  | 'slash'        // /
  | 'dot'          // ·
  | 'arrow'        // →
  | 'pipe'         // |
  | 'doubleChevron'; // »

export type BreadcrumbTheme =
  | 'modern'
  | 'glass'
  | 'minimal'
  | 'colorful'
  | 'default'
  | 'glassmorphism'
  | 'neumorphism'
  | 'gradient';

export type BreadcrumbSize = 'sm' | 'md' | 'lg';

export interface BreadcrumbConfig {
  /** 主題風格 */
  theme?: BreadcrumbTheme;
  /** 尺寸 */
  size?: BreadcrumbSize;
  /** 分隔符類型 */
  separator?: SeparatorType;
  /** 是否顯示首頁圖標 */
  showHomeIcon?: boolean;
  /** 首頁標籤 */
  homeLabel?: string;
  /** 首頁路由 */
  homeRoute?: string;
  /** 最大顯示項目數量 */
  maxItems?: number;
}
