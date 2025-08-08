import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GxBreadcrumbComponent } from '../../../gx-breadcrumb/src/public-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GxBreadcrumbComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'demo';
  items = [
    { label: 'Home', url: '/' },
    { label: 'Products', url: '/products' },
    { label: 'Detail', url: '/products/42' }
  ];
  onNavigate(e: any) { console.log('click:', e); }
}
