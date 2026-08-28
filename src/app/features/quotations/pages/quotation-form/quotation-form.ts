import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DocumentItem } from '../../../../core/models/document-item';
import { DocumentCalculator } from '../../../../core/services/document-calculator';
import { QuotationDocument } from '../../../../core/models/quotation-document';
import { QuotationPdf } from '../../../../core/services/quotation-pdf';



@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-quotation-form',
  styleUrl: './quotation-form.scss',
  templateUrl: './quotation-form.html',
})
export class QuotationForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly calculator = inject(DocumentCalculator);
  private readonly quotationPdf = inject(QuotationPdf);

  readonly form = this.formBuilder.nonNullable.group({
    quotationNumber: [
      this.generateQuotationNumber(),
      Validators.required,
    ],
    issueDate: [this.formatDate(new Date()), Validators.required],
    expirationDate: [
      this.formatDate(this.addDays(new Date(), 15)),
      Validators.required,
    ],
    client: this.formBuilder.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      identityOrRtn: ['', Validators.maxLength(50)],
      phone: ['', Validators.maxLength(30)],
      email: ['', [Validators.email, Validators.maxLength(254)]],
      address: ['', Validators.maxLength(500)],
    }),
    taxRate: [
      15,
      [Validators.required, Validators.min(0), Validators.max(100)],
    ],
    notes: ['', Validators.maxLength(1000)],
    items: this.formBuilder.array([this.createItemGroup()]),
  });

  get items(): FormArray {
    return this.form.controls.items;
  }

  get totals() {
    return this.calculator.calculate(
      this.getDocumentItems(),
      this.form.controls.taxRate.value / 100,
    );
  }

  calculateLineSubtotal(index: number): number {
    const item = this.items.at(index).getRawValue() as DocumentItem;

    return this.calculator.calculateLineSubtotal(item);
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.items.length === 1) {
      return;
    }

    this.items.removeAt(index);
  }

async submit(): Promise<void> {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const value = this.form.getRawValue();

  const quotation: QuotationDocument = {
    id: crypto.randomUUID(),
    quotationNumber: value.quotationNumber,
    issueDate: value.issueDate,
    expirationDate: value.expirationDate,
    client: value.client,
    items: value.items,
    taxRate: value.taxRate,
    notes: value.notes,
    totals: this.totals,
    createdAt: new Date().toISOString(),
  };

  await this.quotationPdf.generate(quotation);
}

  private createItemGroup() {
    return this.formBuilder.nonNullable.group({
      id: [crypto.randomUUID()],
      code: ['', Validators.maxLength(50)],
      description: [
        '',
        [Validators.required, Validators.maxLength(300)],
      ],
      quantity: [
        1,
        [Validators.required, Validators.min(0.01)],
      ],
      unitPrice: [
        0,
        [Validators.required, Validators.min(0)],
      ],
      taxable: [true],
    });
  }

  private getDocumentItems(): DocumentItem[] {
    return this.items.getRawValue() as DocumentItem[];
  }

  private generateQuotationNumber(): string {
    const now = new Date();

    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');

    const time = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
    ].join('');

    return `COT-${date}-${time}`;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);

    return result;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}