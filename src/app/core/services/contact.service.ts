import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private http = inject(HttpClient);

  /** Envoie un message à la bijouterie (il arrive en notification chez le gestionnaire et l'admin). */
  envoyer(sujet: string, message: string) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/contact`, { sujet, message });
  }
}
