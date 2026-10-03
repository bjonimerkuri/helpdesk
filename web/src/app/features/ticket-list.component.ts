import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, EMPTY, switchMap } from 'rxjs';
import { errorMessage } from '../core/errors';
import { Status, TicketPage, TicketQuery } from '../core/models';
import { TicketService } from '../core/ticket.service';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AsyncPipe, DatePipe],
  template: `
    <div class="toolbar">
      <input placeholder="Search tickets" [formControl]="search" />
      <select [formControl]="status">
        <option value="">All statuses</option>
        @for (s of statuses; track s) {
          <option [value]="s">{{ s }}</option>
        }
      </select>
      <a routerLink="/tickets/new" class="button">New ticket</a>
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (data$ | async; as data) {
      <table>
        <thead>
          <tr><th>#</th><th>Title</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Created</th></tr>
        </thead>
        <tbody>
          @for (t of data.items; track t.id) {
            <tr>
              <td>{{ t.id }}</td>
              <td><a [routerLink]="['/tickets', t.id]">{{ t.title }}</a></td>
              <td><span [class]="'badge ' + t.status">{{ t.status }}</span></td>
              <td><span [class]="'badge ' + t.priority">{{ t.priority }}</span></td>
              <td>{{ t.assigneeEmail ?? 'Unassigned' }}</td>
              <td>{{ t.createdAt | date: 'mediumDate' }}</td>
            </tr>
          } @empty {
            <tr><td colspan="6">No tickets found.</td></tr>
          }
        </tbody>
      </table>
      <div class="pager">
        <button (click)="go(data.page - 1)" [disabled]="data.page <= 1">Prev</button>
        <span>Page {{ data.page }} of {{ pages(data) }} ({{ data.total }} tickets)</span>
        <button (click)="go(data.page + 1)" [disabled]="data.page >= pages(data)">Next</button>
      </div>
    }
  `,
})
export class TicketListComponent {
  private readonly tickets = inject(TicketService);

  readonly statuses: Status[] = ['open', 'in_progress', 'resolved', 'closed'];
  readonly search = new FormControl('', { nonNullable: true });
  readonly status = new FormControl('', { nonNullable: true });
  readonly error = signal('');

  private readonly query$ = new BehaviorSubject<TicketQuery>({ status: '', q: '', page: 1 });

  readonly data$ = this.query$.pipe(
    switchMap((query) =>
      this.tickets.list(query).pipe(
        catchError((e) => {
          this.error.set(errorMessage(e));
          return EMPTY;
        }),
      ),
    ),
  );

  constructor() {
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.patch({ q, page: 1 }));
    this.status.valueChanges.pipe(takeUntilDestroyed()).subscribe((status) => this.patch({ status, page: 1 }));
  }

  go(page: number) {
    this.patch({ page });
  }

  pages(data: TicketPage) {
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }

  private patch(change: Partial<TicketQuery>) {
    this.error.set('');
    this.query$.next({ ...this.query$.value, ...change });
  }
}
