import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-explorer',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatDividerModule, CommonModule],
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.scss']
})
export class ExplorerComponent {
  selectedFile: File | null = null;
  fileName = '';
  filePreview: { headers: string[], rows: string[][] } | null = null;
  predictionResult: string | null = null;

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      this.fileName = this.selectedFile.name;
      this.previewFile(this.selectedFile);
    }
  }

  async previewFile(file: File) {
    const text = await file.text();
    const lines = text.split('\n').slice(0, 6);
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(line => line.split(','));
    this.filePreview = { headers, rows };
  }

  predict() {
    this.predictionResult = 'Detected 4 possible exoplanet candidates 🚀';
  }
}
