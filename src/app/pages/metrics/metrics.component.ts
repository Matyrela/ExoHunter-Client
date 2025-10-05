import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatDividerModule, RouterModule],
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss'],
})
export class MetricsComponent {
  charts = [
    {
      title: 'Confusion Matrix – Validation',
      description: 'Model performance on the validation dataset.',
      img: '/assets/metrics/confusion_matrix_val.png',
    },
    {
      title: 'Confusion Matrix – Test',
      description: 'Final evaluation metrics for unseen data.',
      img: '/assets/metrics/confusion_matrix_test.png',
    },
    {
      title: 'Feature Importance',
      description: 'Top contributing features influencing predictions.',
      img: '/assets/metrics/feature_importance.png',
    },
  ];
}