import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, EMPTY, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/errors';
import { STATUS_LABEL } from '../core/labels';
import { Agent, Status, TicketDetail } from '../core/models';
import { TicketService } from '../core/ticket.service';
import { BadgeComponent } from '../shared/status-badge.component';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule, RouterLink, BadgeComponent],
  template: `
    <a class="back" routerLink="/">Back to tickets</a>

    <div aria-live="polite">
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
    </div>

    @if (ticket$ | async; as t) {
      <div class="page-head">
        <h1>
          <span class="num">#{{ t.id }}</span> {{ t.title }}
        </h1>
      </div>

      <div class="detail">
        <div class="detail-main">
          <section aria-labelledby="desc-h">
            <h2 id="desc-h" class="visually-hidden">Description</h2>
            <p class="panel description">{{ t.description }}</p>
          </section>

          <section aria-labelledby="thread-h" class="stack">
            <h2 id="thread-h">Conversation</h2>
            <ul class="thread">
              @for (c of t.comments; track c.id) {
                <li class="panel comment">
                  <header>
                    <strong>{{ c.authorEmail }}</strong>
                    <time class="muted small" [attr.datetime]="c.createdAt">{{ c.createdAt | date: 'medium' }}</time>
                  </header>
                  <p>{{ c.body }}</p>
                </li>
              } @empty {
                <li class="muted">No replies yet.</li>
              }
            </ul>

            <form class="stack" [formGroup]="commentForm" (ngSubmit)="addComment(t.id)">
              <label>
                Add a reply
                <textarea formControlName="body"></textarea>
              </label>
              <div class="form-actions">
                <button type="submit" [disabled]="commentForm.invalid">Send reply</button>
              </div>
            </form>
          </section>
        </div>

        <aside class="panel aside" aria-label="Ticket details">
          <dl class="facts">
            <div>
              <dt>Status</dt>
              <dd><app-badge [value]="t.status" /></dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd><app-badge [value]="t.priority" /></dd>
            </div>
            <div>
              <dt>Opened by</dt>
              <dd>{{ t.creatorEmail }}</dd>
            </div>
            <div>
              <dt>Opened</dt>
              <dd>{{ t.createdAt | date: 'medium' }}</dd>
            </div>
            @if (!auth.isStaff()) {
              <div>
                <dt>Assignee</dt>
                <dd>{{ t.assigneeEmail ?? 'Not assigned yet' }}</dd>
              </div>
            }
          </dl>

          @if (auth.isStaff()) {
            <label for="status-select">
              Change status
              <select id="status-select" #statusSelect (change)="setStatus(t, statusSelect.value)">
                <option [value]="t.status" selected>{{ statusLabel[t.status] }}</option>
                @for (s of t.allowedStatuses; track s) {
                  <option [value]="s">{{ statusLabel[s] }}</option>
                }
              </select>
            </label>
            <label for="assignee-select">
              Assignee
              <select id="assignee-select" #assigneeSelect (change)="assign(t, assigneeSelect.value)">
                <option value="">Unassigned</option>
                @for (a of agents$ | async; track a.id) {
                  <option [value]="a.id" [selected]="a.id === t.assigneeId">{{ a.email }}</option>
                }
              </select>
            </label>
          }
        </aside>
      </div>
    } @else if (loading() && !error()) {
      <p class="muted" role="status">Loading ticket…</p>
    }
  `,
})
export class TicketDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly tickets = inject(TicketService);
  readonly auth = inject(AuthService);

  readonly statusLabel = STATUS_LABEL;
  readonly error = signal('');
  readonly loading = signal(true);
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  readonly commentForm = new FormGroup({
    body: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly ticket$ = combineLatest([this.route.paramMap.pipe(map((params) => Number(params.get('id')))), this.reload$]).pipe(
    switchMap(([id]) =>
      this.tickets.get(id).pipe(
        tap(() => this.loading.set(false)),
        catchError((e) => {
          this.error.set(errorMessage(e));
          this.loading.set(false);
          return EMPTY;
        }),
      ),
    ),
  );

  readonly agents$ = this.auth.isStaff() ? this.tickets.agents() : of([] as Agent[]);

  setStatus(ticket: TicketDetail, value: string) {
    if (value === ticket.status) return;
    this.apply(ticket.id, { status: value as Status });
  }

  assign(ticket: TicketDetail, value: string) {
    this.apply(ticket.id, { assigneeId: value ? Number(value) : null });
  }

  addComment(id: number) {
    this.tickets.addComment(id, this.commentForm.getRawValue().body).subscribe({
      next: () => {
        this.commentForm.reset();
        this.reload$.next();
      },
      error: (e) => this.error.set(errorMessage(e)),
    });
  }

  private apply(id: number, changes: { status?: Status; assigneeId?: number | null }) {
    this.error.set('');
    this.tickets.update(id, changes).subscribe({
      next: () => this.reload$.next(),
      error: (e) => {
        this.error.set(errorMessage(e));
        this.reload$.next(); // reset the selects to the server's truth
      },
    });
  }
}
