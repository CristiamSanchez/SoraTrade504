import { Client } from './client';
import { DocumentItem } from './document-item';
import { DocumentTotals } from './document-totals';

export interface QuotationDocument {
  id: string;
  quotationNumber: string;
  issueDate: string;
  expirationDate: string;
  client: Client;
  items: DocumentItem[];
  taxRate: number;
  notes: string;
  totals: DocumentTotals;
  createdAt: string;
}