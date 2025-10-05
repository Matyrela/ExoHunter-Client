import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private uploadUrl = 'https://api.exohunter.earth/api/upload_csv';

  constructor(
    private readonly http: HttpClient
  ) {}

  uploadCsv(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post(this.uploadUrl, formData, {
      headers: new HttpHeaders({
        // 'Content-Type': 'multipart/form-data' // Do NOT set this header; browser will set it automatically
      })
    });
  }
}
