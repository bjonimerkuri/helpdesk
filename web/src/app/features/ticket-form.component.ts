import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../core/errors';
import { Priority } from '../core/models';
import { TicketService } from '../core/ticket.service';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <a routerLink="/">Back to tickets</a>
    <h2>New ticket</h2>
    <form class="stack" [formGroup]="form" (ngSubmit)="submit()">
      <input placeholder="Title" formControlName="title" />
      <textarea placeholder="Describe the problem (at least 10 characters)" formControlName="description"></textarea>
      <select formControlName="priority">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      <button type="submit" [disabled]="form.invalid || saving()">Create ticket</button>
    </form>
  `,
})
export class TicketFormComponent {
  private readonly tickets = inject(TicketService);
  private readonly router = inject(Router);

  readonly error = signal('');
  readonly saving = signal(false);

  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] }),
    priority: new FormControl<Priority>('medium', { nonNullable: true }),
  });

  submit() {
    this.saving.set(true);
    this.error.set('');
    this.tickets.create(this.form.getRawValue()).subscribe({
      next: (ticket) => this.router.navigate(['/tickets', ticket.id]),
      error: (e) => {
        this.error.set(errorMessage(e));
        this.saving.set(false);
      },
    });
  }
}
