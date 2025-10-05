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

  searchTerm = '';
  filteredData: any[] = [];
  predictionThreshold = 50;
  displayData: any[] = [];

  sortColumn = 'probability';
  sortDirection: 'asc' | 'desc' = 'desc';

  uploadService = inject(UploadService);

  // Drag & Drop properties
  isDragOver = false;

  // CSV Info properties
  showCsvInfo = false;
  csvColumns = [
    {
      name: 'sy_snum',
      description: 'Number of stars in the system',
      category: 'System',
      icon: 'brightness_1',
      units: null
    },
    {
      name: 'sy_pnum',
      description: 'Number of planets detected in the system',
      category: 'System',
      icon: 'public',
      units: null
    },
    {
      name: 'pl_orbper',
      description: 'Orbital period',
      category: 'Planet',
      icon: 'sync',
      units: 'days'
    },
    {
      name: 'pl_orbsmax',
      description: 'Semi-major axis (average distance from the star)',
      category: 'Planet',
      icon: 'straighten',
      units: 'AU'
    },
    {
      name: 'pl_orbeccen',
      description: 'Orbital eccentricity (how elliptical the orbit is)',
      category: 'Planet',
      icon: 'radio_button_unchecked',
      units: null
    },
    {
      name: 'pl_rade',
      description: 'Planet radius',
      category: 'Planet',
      icon: 'circle',
      units: 'Earth radii'
    },
    {
      name: 'pl_bmasse',
      description: 'Planet mass',
      category: 'Planet',
      icon: 'fitness_center',
      units: 'Earth masses'
    },
    {
      name: 'pl_insol',
      description: 'Stellar irradiance received by the planet',
      category: 'Planet',
      icon: 'wb_sunny',
      units: 'Earth units'
    },
    {
      name: 'pl_eqt',
      description: 'Planet equilibrium temperature',
      category: 'Planet',
      icon: 'thermostat',
      units: 'Kelvin'
    },
    {
      name: 'ttv_flag',
      description: 'Transit Timing Variation flag (0 = not detected, 1 = detected)',
      category: 'Detection',
      icon: 'flag',
      units: null
    },
    {
      name: 'st_teff',
      description: 'Stellar effective temperature',
      category: 'Star',
      icon: 'local_fire_department',
      units: 'Kelvin'
    },
    {
      name: 'st_rad',
      description: 'Stellar radius',
      category: 'Star',
      icon: 'brightness_7',
      units: 'solar radii'
    },
    {
      name: 'st_mass',
      description: 'Stellar mass',
      category: 'Star',
      icon: 'scale',
      units: 'solar masses'
    },
    {
      name: 'st_met',
      description: 'Stellar metallicity (chemical composition relative to the Sun)',
      category: 'Star',
      icon: 'science',
      units: null
    },
    {
      name: 'st_logg',
      description: 'Stellar surface gravity',
      category: 'Star',
      icon: 'expand',
      units: null
    },
    {
      name: 'sy_dist',
      description: 'Distance from Earth',
      category: 'System',
      icon: 'explore',
      units: 'parsecs'
    },
    {
      name: 'sy_vmag',
      description: 'Visual magnitude (brightness in visible spectrum)',
      category: 'System',
      icon: 'visibility',
      units: null
    },
    {
      name: 'sy_kmag',
      description: 'Infrared magnitude (K band)',
      category: 'System',
      icon: 'waves',
      units: null
    },
    {
      name: 'sy_gaiamag',
      description: 'Magnitude measured by the Gaia mission',
      category: 'System',
      icon: 'satellite',
      units: null
    },
    {
      name: 'hostname',
      description: 'Name or identifier of the stellar system (e.g., Kepler-22, TOI-700)',
      category: 'System',
      icon: 'badge',
      units: null
    }
  ];

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      this.fileName = this.selectedFile.name;
      this.previewFile(this.selectedFile);
    }
  }

  // Drag & Drop methods
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        this.selectedFile = file;
        this.fileName = file.name;
        this.previewFile(file);
      } else {
        // Could add error handling here for invalid file types
        console.warn('Please select a CSV file');
      }
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
      this.searchTerm = '';

      const response = await lastValueFrom(this.uploadService.uploadCsv(this.selectedFile!));

      this.loading = false;
      this.uploadSuccess = true;
      this.predictionResult = response.prediction;

      const fullData = this.extractDataFromResponse(response);
      this.fullDataLength = fullData.length;

      this.originalData = this.processData(fullData);
      this.backendData = [...this.originalData];

      if (this.backendData.length > 0) {
        this.dataColumns = this.getObjectKeys(this.backendData[0]);
      }

      this.applySorting();
    } catch (error) {
      this.handlePredictionError(error);
    }
  }

  private extractDataFromResponse(response: any): any[] {
    if (response.data) {
      return Array.isArray(response.data) ? response.data : Object.values(response.data);
    }

    if (response && typeof response === 'object') {
      const numericKeys = Object.keys(response).filter(key => !isNaN(Number(key)));
      if (numericKeys.length > 0) {
        return numericKeys.map(key => response[key]);
      }
    }

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
        processedItem.prediction = probabilityValue * 100 > this.predictionThreshold ? 1 : 0;
      }

      return processedItem;
    });

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

  toggleSort(): void {
    if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
    } else {
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  applySorting(): void {
    this.filteredData = [...this.originalData].sort((a, b) => {
      let valueA = a[this.sortColumn];
      let valueB = b[this.sortColumn];

      if (this.sortColumn === 'probability') {
        valueA = this.getNumericValue(valueA);
        valueB = this.getNumericValue(valueB);
      }

      if (this.sortColumn === 'prediction') {
        valueA = Number(valueA);
        valueB = Number(valueB);
      }

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

    this.backendData = [...this.filteredData];

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
      this.sortDirection = 'desc';
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
    this.originalData.forEach(item => {
      if (item.probability !== undefined) {
        const probabilityValue = parseFloat(item.probability.replace('%', ''));
        item.prediction = probabilityValue > this.predictionThreshold ? 1 : 0;
      }
    });

    this.filteredData = [...this.originalData];
    this.applySorting();
    this.onSearch();
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
    const link = document.createElement('a');
    link.href = `/${filename}`;
    link.download = filename;
    link.target = '_blank';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadProcessedData(): void {
    if (!this.originalData || this.originalData.length === 0) {
      console.warn('No processed data available for download');
      return;
    }

    // Usar displayData para incluir filtros de búsqueda si los hay
    const dataToDownload = this.displayData.length > 0 ? this.displayData : this.originalData;

    // Obtener headers dinámicamente de las columnas disponibles
    const headers = this.dataColumns;

    // Convertir datos a CSV
    const csvContent = this.convertToCSV(dataToDownload, headers);

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      // Nombre del archivo con timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const searchSuffix = this.searchTerm.trim() ? '_filtered' : '';
      link.setAttribute('download', `exoplanet_predictions_${timestamp}${searchSuffix}.csv`);

      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  private convertToCSV(data: any[], headers: string[]): string {
    // Crear header row
    const headerRow = headers.join(',');

    // Crear data rows
    const dataRows = data.map(row => {
      return headers.map(header => {
        let value = row[header];

        // Manejar valores undefined/null
        value ??= '';

        // Escapar comillas y comas en CSV
        if (typeof value === 'string') {
          // Si contiene coma, comilla o salto de línea, envolver en comillas
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
        }

        return value;
      }).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
  }
}
