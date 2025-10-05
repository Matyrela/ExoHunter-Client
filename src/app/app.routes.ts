import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about-us/about-us.component';
import { ExplorerComponent } from './pages/explorer/explorer.component';
import { LearnMoreComponent } from './pages/learn-more/learn-more.component';
import { CreditsComponent } from './pages/credits/credits';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },

    { path: 'home', component: HomeComponent },
    { path: 'about', component: AboutComponent },
    { path: 'explorer', component: ExplorerComponent },
    { path: 'learn-more', component: LearnMoreComponent },
    { path: 'credits', component: CreditsComponent },

    { path: '**', redirectTo: 'home' },
];
