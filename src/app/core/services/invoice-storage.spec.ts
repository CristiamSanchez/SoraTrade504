import { TestBed } from '@angular/core/testing';
import { InvoiceDocument } from '../models/invoice-document';
import { InvoiceStorage } from './invoice-storage';

describe('InvoiceStorage', () => {
  let service: InvoiceStorage;

  const invoice: InvoiceDocument = {
    id: 'invoice-1',
    invoiceNumber: '000-001-01-00000001',
    issueDate: '2026-08-28',
    cai: 'TEST-CAI',
    authorizedRangeStart: '000-001-01-00000001',
    authorizedRangeEnd: '000-001-01-00000100',
    emissionDeadline: '2026-12-31',
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
    service = TestBed.inject(InvoiceStorage);
    localStorage.clear();
  });

  it('should save and retrieve an invoice', () => {
    service.save(invoice);

    expect(service.getAll()).toEqual([invoice]);
  });

  it('should remove an invoice', () => {
    service.save(invoice);

    service.remove(invoice.id);

    expect(service.getAll()).toEqual([]);
  });

  it('should recover from invalid stored data', () => {
    localStorage.setItem(
      'soraTrade504.invoices',
      'invalid-json',
    );

    expect(service.getAll()).toEqual([]);
  });
});