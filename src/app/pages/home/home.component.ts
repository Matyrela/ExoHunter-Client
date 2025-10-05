import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { SpaceBackgroundComponent } from "../../components/space-background/space-background.component";

@Component({
  selector: 'app-home',
  imports: [
    RouterModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    SpaceBackgroundComponent
],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  scrollToLearn(): void {
  const learnSection = document.querySelector('.learn');
  if (learnSection) {
    learnSection.scrollIntoView({ behavior: 'smooth' });
  }
}

}
