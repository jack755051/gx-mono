import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GxBreadcrumbComponent } from './gx-breadcrumb.component';

describe('GxBreadcrumbComponent', () => {
  let component: GxBreadcrumbComponent;
  let fixture: ComponentFixture<GxBreadcrumbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GxBreadcrumbComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GxBreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
