import { TestBed } from '@angular/core/testing';
import { DocumentItem } from '../models/document-item';
import { DocumentCalculator } from './document-calculator';

describe('DocumentCalculator', () => {
  let service: DocumentCalculator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentCalculator);
  });

  it('should calculate subtotal, tax and total', () => {
    const items: DocumentItem[] = [
      {
        id: '1',
        code: 'P001',
        description: 'Taxable product',
        quantity: 2,
        unitPrice: 100,
        taxable: true,
      },
      {
        id: '2',
        code: 'P002',
        description: 'Exempt product',
        quantity: 1,
        unitPrice: 50,
        taxable: false,
      },
    ];

    const totals = service.calculate(items);

    expect(totals.subtotal).toBe(250);
    expect(totals.taxableSubtotal).toBe(200);
    expect(totals.tax).toBe(30);
    expect(totals.total).toBe(280);
  });

  it('should return zero totals without items', () => {
    expect(service.calculate([])).toEqual({
      subtotal: 0,
      taxableSubtotal: 0,
      tax: 0,
      total: 0,
    });
  });

  it('should calculate and round a line subtotal', () => {
    const item: DocumentItem = {
      id: '1',
      code: 'P001',
      description: 'Product',
      quantity: 3,
      unitPrice: 10.335,
      taxable: true,
    };

    expect(service.calculateLineSubtotal(item)).toBe(31.01);
  });
});