import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, EMPTY, map, of, switchMap } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/errors';
import { Agent, Status, TicketDetail } from '../core/models';
import { TicketService } from '../core/ticket.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule, RouterLink],
  template: `
    <a routerLink="/">Back to tickets</a>
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (ticket$ | async; as t) {
      <h2>#{{ t.id }} {{ t.title }}</h2>
      <p class="meta">
        <span [class]="'badge ' + t.status">{{ t.status }}</span>
        <span [class]="'badge ' + t.priority">{{ t.priority }}</span>
        opened by {{ t.creatorEmail }} on {{ t.createdAt | date: 'medium' }}
      </p>
      <p>{{ t.description }}</p>

      @if (auth.isStaff()) {
        <div class="row">
          <label>
            Status
            <select (change)="setStatus(t, $any($event.target).value)">
              <option [value]="t.status" selected>{{ t.status }}</option>
              @for (s of t.allowedStatuses; track s) {
                <option [value]="s">{{ s }}</option>
              }
            </select>
          </label>
          <label>
            Assignee
            <select (change)="assign(t, $any($event.target).value)">
              <option value="">Unassigned</option>
              @for (a of agents$ | async; track a.id) {
                <option [value]="a.id" [selected]="a.id === t.assigneeId">{{ a.email }}</option>
              }
            </select>
          </label>
        </div>
      }

      <h3>Comments</h3>
      @for (c of t.comments; track c.id) {
        <div class="comment">
          <b>{{ c.authorEmail }}</b> <time>{{ c.createdAt | date: 'short' }}</time>
          <p>{{ c.body }}</p>
        </div>
      } @empty {
        <p class="meta">No comments yet.</p>
      }

      <form class="stack" [formGroup]="commentForm" (ngSubmit)="addComment(t.id)">
        <textarea placeholder="Write a comment" formControlName="body"></textarea>
        <button type="submit" [disabled]="commentForm.invalid">Add comment</button>
      </form>
    }
  `,
})
export class TicketDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly tickets = inject(TicketService);
  readonly auth = inject(AuthService);

  readonly error = signal('');
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  readonly commentForm = new FormGroup({
    body: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly ticket$ = combineLatest([
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    this.reload$,
  ]).pipe(
    switchMap(([id]) =>
      this.tickets.get(id).pipe(
        catchError((e) => {
          this.error.set(errorMessage(e));
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
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
}
