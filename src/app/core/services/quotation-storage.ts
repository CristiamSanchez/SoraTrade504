import { Injectable } from '@angular/core';
import { QuotationDocument } from '../models/quotation-document';

@Injectable({
  providedIn: 'root',
})
export class QuotationStorage {
  private readonly storageKey = 'soraTrade504.quotations';

  getAll(): QuotationDocument[] {
    const storedValue = localStorage.getItem(this.storageKey);

    if (!storedValue) {
      return [];
    }

    try {
      const quotations = JSON.parse(storedValue) as QuotationDocument[];

      return Array.isArray(quotations) ? quotations : [];
    } catch {
      return [];
    }
  }

  save(quotation: QuotationDocument): void {
    const quotations = [quotation, ...this.getAll()].slice(0, 100);

    localStorage.setItem(this.storageKey, JSON.stringify(quotations));
  }

  remove(id: string): void {
    const quotations = this.getAll().filter((quotation) => quotation.id !== id);

    localStorage.setItem(this.storageKey, JSON.stringify(quotations));
  }
}
