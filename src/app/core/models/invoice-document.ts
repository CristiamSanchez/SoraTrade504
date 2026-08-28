import { Client } from './client';
import { DocumentItem } from './document-item';
import { DocumentTotals } from './document-totals';

export interface InvoiceDocument {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  cai: string;
  authorizedRangeStart: string;
  authorizedRangeEnd: string;
  emissionDeadline: string;
  client: Client;
  items: DocumentItem[];
  taxRate: number;
  notes: string;
  totals: DocumentTotals;
  createdAt: string;
}
