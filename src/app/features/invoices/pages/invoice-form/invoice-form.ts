import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DocumentItem } from '../../../../core/models/document-item';
import { InvoiceDocument } from '../../../../core/models/invoice-document';
import { DocumentCalculator } from '../../../../core/services/document-calculator';
import { InvoicePdf } from '../../../../core/services/invoice-pdf';
import { dateNotBefore } from '../../../../core/validators/date-not-before';
import { Component, inject, signal } from '@angular/core';
import { InvoiceStorage } from '../../../../core/services/invoice-storage';
import { GoogleSheetsSync } from '../../../../core/services/google-sheets-sync';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-invoice-form',
  styleUrl: './invoice-form.scss',
  templateUrl: './invoice-form.html',
})
export class InvoiceForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly calculator = inject(DocumentCalculator);
  private readonly invoicePdf = inject(InvoicePdf);

  private readonly invoiceStorage = inject(InvoiceStorage);

  private readonly googleSheetsSync = inject(GoogleSheetsSync);

  readonly invoices = signal<InvoiceDocument[]>(this.invoiceStorage.getAll());

  readonly form = this.formBuilder.nonNullable.group(
    {
      invoiceNumber: ['', [Validators.required, Validators.maxLength(50)]],
      issueDate: [this.formatDate(new Date()), Validators.required],
      cai: ['', [Validators.required, Validators.maxLength(100)]],
      authorizedRangeStart: ['', [Validators.required, Validators.maxLength(50)]],
      authorizedRangeEnd: ['', [Validators.required, Validators.maxLength(50)]],
      emissionDeadline: ['', Validators.required],
      client: this.formBuilder.nonNullable.group({
        name: ['', [Validators.required, Validators.maxLength(150)]],
        identityOrRtn: ['', Validators.maxLength(50)],
        phone: ['', Validators.maxLength(30)],
        email: ['', [Validators.email, Validators.maxLength(254)]],
        address: ['', Validators.maxLength(500)],
      }),
      taxRate: [15, [Validators.required, Validators.min(0), Validators.max(100)]],
      notes: ['', Validators.maxLength(1000)],
      items: this.formBuilder.array([this.createItemGroup()]),
    },
    {
      validators: dateNotBefore('issueDate', 'emissionDeadline', 'emissionDeadlineBeforeIssueDate'),
    },
  );

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

  async downloadInvoice(invoice: InvoiceDocument): Promise<void> {
    await this.invoicePdf.generate(invoice);
  }

  removeInvoice(id: string): void {
    const confirmed = window.confirm('¿Deseas eliminar esta factura del historial local?');

    if (!confirmed) {
      return;
    }

    this.invoiceStorage.remove(id);
    this.refreshHistory();
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    const invoice: InvoiceDocument = {
      id: crypto.randomUUID(),
      invoiceNumber: value.invoiceNumber,
      issueDate: value.issueDate,
      cai: value.cai,
      authorizedRangeStart: value.authorizedRangeStart,
      authorizedRangeEnd: value.authorizedRangeEnd,
      emissionDeadline: value.emissionDeadline,
      client: value.client,
      items: value.items,
      taxRate: value.taxRate,
      notes: value.notes,
      totals: this.totals,
      createdAt: new Date().toISOString(),
    };

    this.invoiceStorage.save(invoice);
    this.refreshHistory();

    await this.invoicePdf.generate(invoice);
    await this.googleSheetsSync.saveInvoice(invoice);
  }

  private createItemGroup() {
    return this.formBuilder.nonNullable.group({
      id: [crypto.randomUUID()],
      code: ['', Validators.maxLength(50)],
      description: ['', [Validators.required, Validators.maxLength(300)]],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      taxable: [true],
    });
  }

  private getDocumentItems(): DocumentItem[] {
    return this.items.getRawValue() as DocumentItem[];
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
  private refreshHistory(): void {
    this.invoices.set(this.invoiceStorage.getAll());
  }
}
