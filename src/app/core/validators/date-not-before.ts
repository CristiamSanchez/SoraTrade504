import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dateNotBefore(
  startControlName: string,
  endControlName: string,
  errorName: string,
): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const startDate = form.get(startControlName)?.value;
    const endDate = form.get(endControlName)?.value;

    if (!startDate || !endDate) {
      return null;
    }

    return endDate < startDate ? { [errorName]: true } : null;
  };
}
