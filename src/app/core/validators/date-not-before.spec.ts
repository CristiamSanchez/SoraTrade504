import { FormControl, FormGroup } from '@angular/forms';
import { dateNotBefore } from './date-not-before';

describe('dateNotBefore', () => {
  function createForm(startDate: string, endDate: string): FormGroup {
    return new FormGroup(
      {
        startDate: new FormControl(startDate),
        endDate: new FormControl(endDate),
      },
      {
        validators: dateNotBefore('startDate', 'endDate', 'invalidDateRange'),
      },
    );
  }

  it('should accept an end date after the start date', () => {
    const form = createForm('2026-08-28', '2026-09-30');

    expect(form.hasError('invalidDateRange')).toBe(false);
  });

  it('should accept equal dates', () => {
    const form = createForm('2026-08-28', '2026-08-28');

    expect(form.hasError('invalidDateRange')).toBe(false);
  });

  it('should reject an end date before the start date', () => {
    const form = createForm('2026-08-28', '2026-08-27');

    expect(form.hasError('invalidDateRange')).toBe(true);
  });
});
