import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class ApiClient {
    private http = inject(HttpClient);

    get<T>(url: string, options?: any): Observable<T> {
        return this.http.get<T>(`${API_BASE_URL}${url}`, {
            ...options,
            withCredentials: true
        }) as Observable<T>;
    }

    post<T>(url: string, body?: unknown) {
        return this.http.post<T>(`${API_BASE_URL}${url}`, body, {
            withCredentials: true
        });
    }

    put<T>(url: string, body?: unknown) {
        return this.http.put<T>(`${API_BASE_URL}${url}`, body, {
            withCredentials: true
        });
    }

    delete<T>(url: string) {
        return this.http.delete<T>(`${API_BASE_URL}${url}`, {
            withCredentials: true
        });
    }
}
