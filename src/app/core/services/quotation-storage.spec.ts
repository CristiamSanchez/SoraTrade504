import { TestBed } from '@angular/core/testing';
import { QuotationDocument } from '../models/quotation-document';
import { QuotationStorage } from './quotation-storage';

describe('QuotationStorage', () => {
  let service: QuotationStorage;

  const quotation: QuotationDocument = {
    id: 'quotation-1',
    quotationNumber: 'COT-001',
    issueDate: '2026-08-28',
    expirationDate: '2026-09-12',
    client: {
      name: 'Test client',
      identityOrRtn: '',
      phone: '',
      email: '',
      address: '',
    },
    items: [
      {
        id: 'item-1',
        code: 'P001',
        description: 'Test product',
        quantity: 2,
        unitPrice: 100,
        taxable: true,
      },
    ],
    taxRate: 15,
    notes: '',
    totals: {
      subtotal: 200,
      taxableSubtotal: 200,
      tax: 30,
      total: 230,
    },
    createdAt: '2026-08-28T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuotationStorage);
    localStorage.clear();
  });

  it('should save and retrieve a quotation', () => {
    service.save(quotation);

    expect(service.getAll()).toEqual([quotation]);
  });

  it('should remove a quotation', () => {
    service.save(quotation);

    service.remove(quotation.id);

    expect(service.getAll()).toEqual([]);
  });

  it('should recover from invalid stored data', () => {
    localStorage.setItem('soraTrade504.quotations', 'invalid-json');

    expect(service.getAll()).toEqual([]);
  });
});
