import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, EMPTY, switchMap, tap } from 'rxjs';
import { errorMessage } from '../core/errors';
import { STATUS_LABEL } from '../core/labels';
import { Status, TicketPage, TicketQuery } from '../core/models';
import { TicketService } from '../core/ticket.service';
import { AuthService } from '../core/auth.service';
import { BadgeComponent } from '../shared/status-badge.component';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AsyncPipe, DatePipe, BadgeComponent],
  template: `
    <div class="page-head">
      <h1>{{ auth.isStaff() ? 'All tickets' : 'Your tickets' }}</h1>
      <a routerLink="/tickets/new" class="btn">New ticket</a>
    </div>

    <div class="filters">
      <label>
        Search
        <input type="search" placeholder="Title or description" [formControl]="search" />
      </label>
      <label>
        Status
        <select [formControl]="status">
          <option value="">All statuses</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ statusLabel[s] }}</option>
          }
        </select>
      </label>
    </div>

    <div aria-live="polite">
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
    </div>

    @if (data$ | async; as data) {
      <div class="panel" [attr.aria-busy]="loading()">
        @if (data.items.length) {
          <div class="table-wrap">
            <table>
              <caption class="visually-hidden">
                Tickets, newest first
              </caption>
              <thead>
                <tr>
                  <th scope="col">No.</th>
                  <th scope="col">Title</th>
                  <th scope="col">Status</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Assignee</th>
                  <th scope="col">Created</th>
                </tr>
              </thead>
              <tbody>
                @for (t of data.items; track t.id) {
                  <tr [attr.data-priority]="t.priority">
                    <td class="rail num">{{ t.id }}</td>
                    <td>
                      <a class="ticket-title" [routerLink]="['/tickets', t.id]">{{ t.title }}</a>
                    </td>
                    <td><app-badge [value]="t.status" /></td>
                    <td><app-badge [value]="t.priority" /></td>
                    <td>{{ t.assigneeEmail ?? 'Unassigned' }}</td>
                    <td>{{ t.createdAt | date: 'mediumDate' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="pager">
            <span>Page {{ data.page }} of {{ pages(data) }} · {{ data.total }} tickets</span>
            <span class="buttons">
              <button type="button" class="quiet" (click)="go(data.page - 1)" [disabled]="data.page <= 1">
                Previous
              </button>
              <button type="button" class="quiet" (click)="go(data.page + 1)" [disabled]="data.page >= pages(data)">
                Next
              </button>
            </span>
          </div>
        } @else {
          <div class="empty">
            <h2>{{ filtered() ? 'No tickets match these filters' : 'No tickets yet' }}</h2>
            <p>
              {{
                filtered()
                  ? 'Clear the search or choose a different status.'
                  : 'When something goes wrong, open a ticket and an agent will pick it up.'
              }}
            </p>
            @if (!filtered()) {
              <a routerLink="/tickets/new" class="btn">Open the first ticket</a>
            }
          </div>
        }
      </div>
    } @else if (loading() && !error()) {
      <p class="muted" role="status">Loading tickets…</p>
    }
  `,
})
export class TicketListComponent {
  private readonly tickets = inject(TicketService);
  readonly auth = inject(AuthService);

  readonly statuses: Status[] = ['open', 'in_progress', 'resolved', 'closed'];
  readonly statusLabel = STATUS_LABEL;
  readonly search = new FormControl('', { nonNullable: true });
  readonly status = new FormControl('', { nonNullable: true });
  readonly error = signal('');
  readonly loading = signal(true);
  readonly filtered = signal(false);

  private readonly query$ = new BehaviorSubject<TicketQuery>({ status: '', q: '', page: 1 });

  readonly data$ = this.query$.pipe(
    tap((query) => {
      this.loading.set(true);
      this.filtered.set(Boolean(query.q || query.status));
    }),
    switchMap((query) =>
      this.tickets.list(query).pipe(
        tap(() => this.loading.set(false)),
        catchError((e) => {
          this.error.set(errorMessage(e));
          this.loading.set(false);
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
