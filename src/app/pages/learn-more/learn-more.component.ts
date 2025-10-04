import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-learn-more',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, CommonModule],
  templateUrl: './learn-more.component.html',
  styleUrls: ['./learn-more.component.scss']
})
export class LearnMoreComponent {}
