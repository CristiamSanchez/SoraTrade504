import { Injectable } from '@angular/core';
import { GOOGLE_SHEETS_CONFIG } from '../config/google-sheets.config';
import { InvoiceDocument } from '../models/invoice-document';
import { QuotationDocument } from '../models/quotation-document';

type DocumentType = 'quotation' | 'invoice';

@Injectable({
  providedIn: 'root',
})
export class GoogleSheetsSync {
  async saveQuotation(quotation: QuotationDocument): Promise<boolean> {
    return this.send('quotation', quotation);
  }

  async saveInvoice(invoice: InvoiceDocument): Promise<boolean> {
    return this.send('invoice', invoice);
  }

  private async send(
    type: DocumentType,
    document: QuotationDocument | InvoiceDocument,
  ): Promise<boolean> {
    const endpoint = GOOGLE_SHEETS_CONFIG.webAppUrl;

    if (!endpoint.endsWith('/exec')) {
      console.warn('Google Sheets endpoint is not configured.');

      return false;
    }

    try {
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          type,
          document,
        }),
      });

      return true;
    } catch (error) {
      console.error('Google Sheets synchronization failed.', error);

      return false;
    }
  }
}
