import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UploadService } from '../../services/upload.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-explorer',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatDividerModule, MatProgressSpinnerModule, ScrollingModule, CommonModule, RouterModule],
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.scss']
})
export class ExplorerComponent {
  selectedFile: File | null = null;
  fileName = '';
  filePreview: { headers: string[], rows: string[][] } | null = null;
  predictionResult: string | null = null;
  backendData: any[] = [];
  originalData: any[] = [];
  dataColumns: string[] = [];
  fullDataLength = 0;

  loading = false;
  uploadSuccess = false;
  showData = false;

  // Sorting properties
  sortColumn = 'probability';
  sortDirection: 'asc' | 'desc' = 'desc';

  uploadService = inject(UploadService);

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      this.fileName = this.selectedFile.name;
      this.previewFile(this.selectedFile);
    }
  }

  async previewFile(file: File) {
    const text = await file.text();
    const lines = text.split('\n').slice(0, 10);
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(line => line.split(','));
    this.filePreview = { headers, rows };
  }

  async predict() {
    try {
      this.loading = true;
      this.uploadSuccess = false;
      this.predictionResult = null;
      this.showData = false;

      const response = await lastValueFrom(this.uploadService.uploadCsv(this.selectedFile!));

      this.loading = false;
      this.uploadSuccess = true;
      this.predictionResult = response.prediction;

      console.log('Full response:', response);
      const fullData = this.extractDataFromResponse(response);
      this.fullDataLength = fullData.length;

      // Procesar y filtrar datos
      this.originalData = this.processData(fullData);
      this.backendData = [...this.originalData];

      // Pre-calcular las columnas para evitar recálculos
      if (this.backendData.length > 0) {
        this.dataColumns = this.getObjectKeys(this.backendData[0]);
      }

      // Aplicar ordenamiento inicial por probabilidad descendente
      this.applySorting();

      console.log('Processed backend data:', this.fullDataLength, 'total rows');
      console.log('Columns:', this.dataColumns);

      // NO mostrar automáticamente para evitar lag - dejar que el usuario decida
      // if (this.backendData.length > 0) {
      //   this.showData = true;
      // }
    } catch (error) {
      this.handlePredictionError(error);
    }
  }

  private extractDataFromResponse(response: any): any[] {
    // Caso 1: Los datos están en response.data
    if (response.data) {
      return Array.isArray(response.data) ? response.data : Object.values(response.data);
    }

    // Caso 2: Los datos están directamente en response (índices numéricos)
    if (response && typeof response === 'object') {
      const numericKeys = Object.keys(response).filter(key => !isNaN(Number(key)));
      if (numericKeys.length > 0) {
        return numericKeys.map(key => response[key]);
      }
    }

    // Caso 3: Buscar arrays o objetos indexados en cualquier propiedad
    return this.findDataInObject(response);
  }

  private findDataInObject(obj: any): any[] {
    if (!obj || typeof obj !== 'object') return [];

    for (const value of Object.values(obj)) {
      if (Array.isArray(value) && value.length > 0 && this.isValidDataObject(value[0])) {
        return value;
      }
      if (typeof value === 'object' && value && !Array.isArray(value)) {
        const possibleArray = Object.values(value);
        if (possibleArray.length > 0 && this.isValidDataObject(possibleArray[0])) {
          return possibleArray;
        }
      }
    }
    return [];
  }

  private isValidDataObject(item: any): boolean {
    return item && typeof item === 'object' && 'id' in item;
  }

  private processData(data: any[]): any[] {
    return data.map(item => {
      const { column_id, ...processedItem } = item;

      if (processedItem.probability !== undefined) {
        const probabilityValue = parseFloat(processedItem.probability);
        processedItem.probability = isNaN(probabilityValue) ? '0.00000%' : (probabilityValue * 100).toFixed(5) + '%';
      }

      return processedItem;
    });
  }

  private handlePredictionError(error: any): void {
    this.loading = false;
    this.uploadSuccess = false;
    this.predictionResult = null;
    this.showData = false;
    console.error('Error during prediction:', error);
    this.predictionResult = 'Prediction failed. Please try again.';
  }

  toggleDataView() {
    this.showData = !this.showData;
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByKey(index: number, key: string): string {
    return key;
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getDataColumns(): string[] {
    return this.dataColumns;
  }

  getNumericValue(value: string): number {
    if (typeof value === 'string' && value.includes('%')) {
      return parseFloat(value.replace('%', ''));
    }
    return parseFloat(value) || 0;
  }

  // Sorting methods
  toggleSort(): void {
    if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
    } else {
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  applySorting(): void {
    this.backendData = [...this.originalData].sort((a, b) => {
      let valueA = a[this.sortColumn];
      let valueB = b[this.sortColumn];

      // Handle probability values (convert percentage to number)
      if (this.sortColumn === 'probability') {
        valueA = this.getNumericValue(valueA);
        valueB = this.getNumericValue(valueB);
      }

      // Handle prediction values (convert to number)
      if (this.sortColumn === 'prediction') {
        valueA = Number(valueA);
        valueB = Number(valueB);
      }

      // Handle string values
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
      }
      if (typeof valueB === 'string') {
        valueB = valueB.toLowerCase();
      }

      let comparison = 0;
      if (valueA > valueB) {
        comparison = 1;
      } else if (valueA < valueB) {
        comparison = -1;
      }

      return this.sortDirection === 'desc' ? -comparison : comparison;
    });
  }

  getSortIcon(): string {
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  getSortTitle(): string {
    const direction = this.sortDirection === 'asc' ? 'Ascending' : 'Descending';
    const column = this.sortColumn.charAt(0).toUpperCase() + this.sortColumn.slice(1);
    return `Currently sorted by ${column} (${direction}). Click to toggle.`;
  }

  getSortDescription(): string {
    const direction = this.sortDirection === 'asc' ? 'ascending' : 'descending';
    const column = this.formatColumnName(this.sortColumn);
    return `(sorted by ${column}, ${direction})`;
  }

  sortByColumn(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc'; // Default to descending for new column
    }
    this.applySorting();
  }

  formatColumnName(key: string): string {
    const formatted = key.replace('_', ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
}
