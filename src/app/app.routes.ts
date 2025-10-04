import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },

    {
        path: 'home',
        loadComponent: () =>
            import('./pages/home/home.component').then((m) => m.HomeComponent),
    },
    {
        path: 'about',
        loadComponent: () =>
            import('./pages/about-us/about-us.component').then((m) => m.AboutComponent),
    },
    {
        path: 'explorer',
        loadComponent: () =>
            import('./pages/explorer/explorer.component').then((m) => m.ExplorerComponent),
    },
    {
        path: 'learn-more',
        loadComponent: () =>
            import('./pages/learn-more/learn-more.component').then((m) => m.LearnMoreComponent),
    },
];
