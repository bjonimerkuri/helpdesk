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
    <a class="back" routerLink="/">Back to tickets</a>
    <div class="page-head"><h1>New ticket</h1></div>
    <form class="stack form-narrow" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <label>
        Title
        <input formControlName="title" [attr.aria-invalid]="invalid('title')" />
        @if (invalid('title')) {
          <span class="field-error">Enter a title of at least 3 characters.</span>
        }
      </label>
      <label>
        What is going wrong?
        <textarea formControlName="description" [attr.aria-invalid]="invalid('description')"></textarea>
        <span class="field-hint">Include what you expected and what happened instead. At least 10 characters.</span>
        @if (invalid('description')) {
          <span class="field-error">Describe the problem in at least 10 characters.</span>
        }
      </label>
      <label>
        Priority
        <select formControlName="priority">
          <option value="low">Low: can wait</option>
          <option value="medium">Medium: affects my work</option>
          <option value="high">High: blocks my work</option>
        </select>
      </label>
      <div aria-live="polite">
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </div>
      <div class="form-actions">
        <button type="submit" [disabled]="saving()">Create ticket</button>
        <a class="btn btn-quiet" routerLink="/">Cancel</a>
      </div>
    </form>
  `,
})
export class TicketFormComponent {
  private readonly tickets = inject(TicketService);
  private readonly router = inject(Router);

  readonly error = signal('');
  readonly saving = signal(false);
  private readonly submitted = signal(false);

  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] }),
    priority: new FormControl<Priority>('medium', { nonNullable: true }),
  });

  /** Show a field's error after the first submit attempt or once the user has left the field. */
  invalid(name: 'title' | 'description'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  submit() {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    this.tickets.create(this.form.getRawValue()).subscribe({
      next: (ticket) => void this.router.navigate(['/tickets', ticket.id]),
      error: (e) => {
        this.error.set(errorMessage(e));
        this.saving.set(false);
      },
    });
  }
}
