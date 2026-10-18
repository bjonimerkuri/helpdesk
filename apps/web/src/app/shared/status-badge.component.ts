import { Component, computed, input } from '@angular/core';
import { PRIORITY_LABEL, STATUS_LABEL } from '../core/labels';
import { Priority, Status } from '../core/models';

/** Status or priority as text plus colour, so meaning never depends on colour alone. */
@Component({
  selector: 'app-badge',
  standalone: true,
  template: `<span class="badge" [attr.data-tone]="value()">{{ label() }}</span>`,
})
export class BadgeComponent {
  readonly value = input.required<Status | Priority>();
  readonly label = computed(() => {
    const v = this.value();
    return v in STATUS_LABEL ? STATUS_LABEL[v as Status] : PRIORITY_LABEL[v as Priority];
  });
}
