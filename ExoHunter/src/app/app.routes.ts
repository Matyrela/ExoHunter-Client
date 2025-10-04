import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'home' },
            {
                path: '',
                loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
                title: 'ExoHunter | Home'
            },
            { path: 'about', loadComponent: () => import('./pages/about-us/about-us.component').then(m => m.AboutComponent), title: 'About' }
        ]
    },
    { path: '**', redirectTo: '' }
];
