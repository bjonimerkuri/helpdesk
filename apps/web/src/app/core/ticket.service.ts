import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from './config';
import { Agent, Priority, Status, TicketComment, TicketDetail, TicketPage, TicketQuery } from './models';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);

  list(query: TicketQuery) {
    let params = new HttpParams().set('page', query.page).set('pageSize', 10);
    if (query.status) params = params.set('status', query.status);
    if (query.q) params = params.set('q', query.q);
    return this.http.get<TicketPage>(`${API_URL}/tickets`, { params });
  }

  get(id: number) {
    return this.http.get<TicketDetail>(`${API_URL}/tickets/${id}`);
  }

  create(body: { title: string; description: string; priority: Priority }) {
    return this.http.post<TicketDetail>(`${API_URL}/tickets`, body);
  }

  update(id: number, changes: { status?: Status; priority?: Priority; assigneeId?: number | null }) {
    return this.http.patch<TicketDetail>(`${API_URL}/tickets/${id}`, changes);
  }

  addComment(id: number, body: string) {
    return this.http.post<TicketComment>(`${API_URL}/tickets/${id}/comments`, { body });
  }

  agents() {
    return this.http.get<Agent[]>(`${API_URL}/agents`);
  }
}
