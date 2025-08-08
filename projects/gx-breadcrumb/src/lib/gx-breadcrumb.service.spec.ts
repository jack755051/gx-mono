import { TestBed } from '@angular/core/testing';

import { GxBreadcrumbService } from './gx-breadcrumb.service';

describe('GxBreadcrumbService', () => {
  let service: GxBreadcrumbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GxBreadcrumbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
