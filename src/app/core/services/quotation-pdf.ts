import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { QuotationDocument } from '../models/quotation-document';

type PdfWithTable = jsPDF & {
  lastAutoTable: {
    finalY: number;
  };
};

@Injectable({
  providedIn: 'root',
})
export class QuotationPdf {
  async generate(quotation: QuotationDocument): Promise<void> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    await this.addHeader(pdf, quotation);
    this.addClient(pdf, quotation);
    this.addItems(pdf, quotation);
    this.addSummary(pdf, quotation);
    this.addFooter(pdf);

    pdf.save(
      `cotizacion-${this.sanitize(
        quotation.quotationNumber,
      )}.pdf`,
    );
  }

  private async addHeader(
    pdf: jsPDF,
    quotation: QuotationDocument,
  ): Promise<void> {
    const logo = await this.loadLogo();

    if (logo) {
      pdf.addImage(logo, 'JPEG', 15, 10, 38, 30);
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(23, 58, 54);
    pdf.text('SORA TRADE 504', 60, 19);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(90, 110, 106);
    pdf.text('Honduras', 60, 26);
    pdf.text('Francisco Morazán', 60, 32);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(19);
    pdf.setTextColor(22, 100, 91);
    pdf.text('COTIZACIÓN', 195, 19, {
      align: 'right',
    });

    pdf.setFontSize(9);
    pdf.setTextColor(70, 90, 86);

    pdf.text(
      `N.º ${quotation.quotationNumber}`,
      195,
      27,
      { align: 'right' },
    );

    pdf.text(
      `Emisión: ${this.formatDate(quotation.issueDate)}`,
      195,
      33,
      { align: 'right' },
    );

    pdf.text(
      `Vence: ${this.formatDate(quotation.expirationDate)}`,
      195,
      39,
      { align: 'right' },
    );

    pdf.setDrawColor(37, 133, 109);
    pdf.setLineWidth(0.7);
    pdf.line(15, 47, 195, 47);
  }

  private addClient(
    pdf: jsPDF,
    quotation: QuotationDocument,
  ): void {
    const client = quotation.client;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(23, 58, 54);
    pdf.text('INFORMACIÓN DEL CLIENTE', 15, 56);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(55, 75, 71);

    pdf.text(`Cliente: ${client.name}`, 15, 63);

    pdf.text(
      `Identidad/RTN: ${
        client.identityOrRtn || 'No indicado'
      }`,
      15,
      69,
    );

    pdf.text(
      `Teléfono: ${client.phone || 'No indicado'}`,
      110,
      63,
    );

    pdf.text(
      `Correo: ${client.email || 'No indicado'}`,
      110,
      69,
    );

    const address = pdf.splitTextToSize(
      `Dirección: ${client.address || 'No indicada'}`,
      180,
    );

    pdf.text(address, 15, 75);
  }

  private addItems(
    pdf: jsPDF,
    quotation: QuotationDocument,
  ): void {
    autoTable(pdf, {
      startY: 84,
      head: [
        [
          'Código',
          'Descripción',
          'Cantidad',
          'Precio',
          'Gravado',
          'Subtotal',
        ],
      ],
      body: quotation.items.map((item) => [
        item.code || '—',
        item.description,
        this.formatQuantity(item.quantity),
        this.formatMoney(item.unitPrice),
        item.taxable ? 'Sí' : 'No',
        this.formatMoney(item.quantity * item.unitPrice),
      ]),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [42, 62, 58],
        lineColor: [220, 229, 227],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [22, 100, 91],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [243, 248, 247],
      },
      columnStyles: {
        0: { cellWidth: 23 },
        1: { cellWidth: 62 },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 27, halign: 'right' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 28, halign: 'right' },
      },
      margin: {
        left: 15,
        right: 15,
        bottom: 20,
      },
    });
  }

  private addSummary(
    pdf: jsPDF,
    quotation: QuotationDocument,
  ): void {
    let y = (pdf as PdfWithTable).lastAutoTable.finalY + 9;

    if (y > 230) {
      pdf.addPage();
      y = 20;
    }

    if (quotation.notes) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(23, 58, 54);
      pdf.text('Observaciones', 15, y);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(70, 90, 86);

      const notes = pdf.splitTextToSize(
        quotation.notes,
        100,
      );

      pdf.text(notes, 15, y + 5);
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(70, 90, 86);

    pdf.text('Subtotal:', 155, y, {
      align: 'right',
    });

    pdf.text(
      this.formatMoney(quotation.totals.subtotal),
      195,
      y,
      { align: 'right' },
    );

    y += 7;

    pdf.text(
      `Impuesto (${quotation.taxRate}%):`,
      155,
      y,
      { align: 'right' },
    );

    pdf.text(
      this.formatMoney(quotation.totals.tax),
      195,
      y,
      { align: 'right' },
    );

    y += 8;

    pdf.setDrawColor(37, 133, 109);
    pdf.line(145, y - 5, 195, y - 5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(23, 58, 54);

    pdf.text('TOTAL:', 155, y, {
      align: 'right',
    });

    pdf.text(
      this.formatMoney(quotation.totals.total),
      195,
      y,
      { align: 'right' },
    );
  }

  private addFooter(pdf: jsPDF): void {
    const pages = pdf.getNumberOfPages();

    for (let page = 1; page <= pages; page += 1) {
      pdf.setPage(page);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(110, 125, 122);

      pdf.text(
        'Gracias por considerar a Sora Trade 504.',
        15,
        287,
      );

      pdf.text(`Página ${page} de ${pages}`, 195, 287, {
        align: 'right',
      });
    }
  }

  private async loadLogo(): Promise<string | null> {
    try {
      const url = new URL(
        'images/sora-trade-logo.jpeg',
        document.baseURI,
      );

      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();

      return await this.toDataUrl(blob);
    } catch {
      return null;
    }
  }

  private toDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  private formatMoney(value: number): string {
    const amount = new Intl.NumberFormat('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

    return `L ${amount}`;
  }

  private formatQuantity(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      maximumFractionDigits: 2,
    }).format(value);
  }

  private formatDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString(
      'es-HN',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    );
  }

  private sanitize(value: string): string {
    return value.replace(/[^a-zA-Z0-9-_]/g, '-');
  }
}