export interface BreadcrumbItem {
  label: string
  url: string;
  params?: any;
  // Not shown temporarily
  icon?: string;
}

// Separator types for breadcrumb
export type SeparatorType = 'chevron'|'slash'|'dot'|'arrow';
