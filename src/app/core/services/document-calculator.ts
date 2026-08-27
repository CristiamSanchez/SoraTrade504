import { Injectable } from '@angular/core';
import { DocumentItem } from '../models/document-item';
import { DocumentTotals } from '../models/document-totals';

@Injectable({
  providedIn: 'root',
})
export class DocumentCalculator {
  calculate(
    items: DocumentItem[],
    taxRate = 0.15,
  ): DocumentTotals {
    const subtotal = items.reduce(
      (total, item) =>
        total + item.quantity * item.unitPrice,
      0,
    );

    const taxableSubtotal = items
      .filter((item) => item.taxable)
      .reduce(
        (total, item) =>
          total + item.quantity * item.unitPrice,
        0,
      );

    const tax = taxableSubtotal * taxRate;

    return {
      subtotal: this.roundCurrency(subtotal),
      taxableSubtotal:
        this.roundCurrency(taxableSubtotal),
      tax: this.roundCurrency(tax),
      total: this.roundCurrency(subtotal + tax),
    };
  }

  calculateLineSubtotal(item: DocumentItem): number {
    return this.roundCurrency(
      item.quantity * item.unitPrice,
    );
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}