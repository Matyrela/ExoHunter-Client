import { Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [MatDividerModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './credits.html',
  styleUrls: ['./credits.scss']
})
export class CreditsComponent {}
