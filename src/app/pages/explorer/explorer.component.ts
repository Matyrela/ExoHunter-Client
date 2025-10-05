import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UploadService } from '../../services/upload.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-explorer',
  standalone: true,
    imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
    ScrollingModule,
    RouterModule,
    FormsModule
  ],
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
  serverError = false;

  // Search and filter properties
  searchTerm = '';
  filteredData: any[] = [];
  predictionThreshold = 50;
  displayData: any[] = [];

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
      this.serverError = false;

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
    const processed = data.map(item => {
      const { column_id, ...processedItem } = item;

      if (processedItem.probability !== undefined) {
        const probabilityValue = parseFloat(processedItem.probability);
        processedItem.probability = isNaN(probabilityValue) ? '0.00000%' : (probabilityValue * 100).toFixed(5) + '%';
        // Ignorar prediction del backend y calcular basado en threshold
        processedItem.prediction = probabilityValue * 100 > this.predictionThreshold ? 1 : 0;
      }

      return processedItem;
    });

    // Inicializar datos filtrados
    this.filteredData = [...processed];
    this.displayData = [...processed];

    return processed;
  }

  private handlePredictionError(error: any): void {
    this.loading = false;
    this.uploadSuccess = false;
    this.predictionResult = null;
    this.showData = false;

    console.error('Error during prediction:', error);

    // Check if it's a 500 server error
    if (error.status === 500) {
      this.serverError = true;
      this.predictionResult = 'Server error occurred while processing your request.';
    } else {
      this.serverError = false;
      this.predictionResult = 'Prediction failed. Please try again.';
    }
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
    // Actualizar filteredData (datos base sin filtro de búsqueda)
    this.filteredData = [...this.originalData].sort((a, b) => {
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

    // Mantener backendData para compatibilidad
    this.backendData = [...this.filteredData];

    // Actualizar displayData si hay búsqueda activa
    if (this.searchTerm.trim()) {
      this.onSearch();
    } else {
      this.displayData = [...this.filteredData];
    }
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

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.displayData = [...this.filteredData];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    this.displayData = this.filteredData.filter(item => {
      return Object.values(item).some(value => {
        if (value === null || value === undefined || typeof value === 'object') {
          return false;
        }
        // Solo procesar tipos primitivos
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return value.toString().toLowerCase().includes(searchLower);
        }
        return false;
      });
    });
  }

  onThresholdChange(value: number): void {
    this.predictionThreshold = value;
    this.updatePredictions();
  }

  private updatePredictions(): void {
    // Actualizar predictions basado en el nuevo threshold
    this.originalData.forEach(item => {
      if (item.probability !== undefined) {
        const probabilityValue = parseFloat(item.probability.replace('%', ''));
        item.prediction = probabilityValue > this.predictionThreshold ? 1 : 0;
      }
    });

    this.filteredData = [...this.originalData];
    this.applySorting();
    this.onSearch(); // Aplicar filtro de búsqueda si existe
  }

  getPredictionIcon(prediction: number): string {
    return prediction === 1 ? '✓' : '✗';
  }

  formatSliderLabel(value: number): string {
    return `${value}%`;
  }

  getProbabilityClass(probabilityValue: string): string {
    const numValue = this.getNumericValue(probabilityValue);
    const threshold = this.predictionThreshold;

    if (numValue >= threshold) {
      return 'high-probability';
    } else if (numValue >= threshold - 10) {
      return 'medium-probability';
    } else {
      return 'low-probability';
    }
  }

  downloadExample(filename: string): void {
    // Crear enlace temporal para descarga
    const link = document.createElement('a');
    link.href = `/${filename}`;
    link.download = filename;
    link.target = '_blank';

    // Agregar al DOM, hacer clic y remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
