import { Injectable } from '@angular/core';
import { InvoiceDocument } from '../models/invoice-document';

@Injectable({
  providedIn: 'root',
})
export class InvoiceStorage {
  private readonly storageKey = 'soraTrade504.invoices';

  getAll(): InvoiceDocument[] {
    const storedValue = localStorage.getItem(this.storageKey);

    if (!storedValue) {
      return [];
    }

    try {
      const invoices =
        JSON.parse(storedValue) as InvoiceDocument[];

      return Array.isArray(invoices) ? invoices : [];
    } catch {
      return [];
    }
  }

  save(invoice: InvoiceDocument): void {
    const invoices = [invoice, ...this.getAll()].slice(
      0,
      100,
    );

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(invoices),
    );
  }

  remove(id: string): void {
    const invoices = this.getAll().filter(
      (invoice) => invoice.id !== id,
    );

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(invoices),
    );
  }
}