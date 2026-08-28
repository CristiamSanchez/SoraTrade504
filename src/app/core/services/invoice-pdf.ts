import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { InvoiceDocument } from '../models/invoice-document';

type PdfWithTable = jsPDF & {
  lastAutoTable: {
    finalY: number;
  };
};

@Injectable({
  providedIn: 'root',
})
export class InvoicePdf {
  async generate(invoice: InvoiceDocument): Promise<void> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    await this.addHeader(pdf, invoice);
    this.addFiscalInformation(pdf, invoice);
    this.addClient(pdf, invoice);
    this.addItems(pdf, invoice);
    this.addSummary(pdf, invoice);
    this.addFooter(pdf);

    pdf.save(`factura-${this.sanitize(invoice.invoiceNumber)}.pdf`);
  }

  private async addHeader(pdf: jsPDF, invoice: InvoiceDocument): Promise<void> {
    const logo = await this.loadLogo();

    if (logo) {
      pdf.addImage(logo, 'JPEG', 15, 10, 34, 27);
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(23, 58, 54);
    pdf.text('SORA TRADE 504', 56, 18);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(90, 110, 106);
    pdf.text('Honduras', 56, 25);
    pdf.text('Francisco Morazan', 56, 31);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(22, 100, 91);
    pdf.text('FACTURA', 195, 18, {
      align: 'right',
    });

    pdf.setFontSize(9);
    pdf.setTextColor(70, 90, 86);

    pdf.text(`N.º ${invoice.invoiceNumber}`, 195, 27, { align: 'right' });

    pdf.text(`Emisión: ${this.formatDate(invoice.issueDate)}`, 195, 34, { align: 'right' });

    pdf.setDrawColor(37, 133, 109);
    pdf.setLineWidth(0.7);
    pdf.line(15, 43, 195, 43);
  }

  private addFiscalInformation(pdf: jsPDF, invoice: InvoiceDocument): void {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(23, 58, 54);
    pdf.text('INFORMACIÓN FISCAL', 15, 51);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(55, 75, 71);

    pdf.text(`CAI: ${invoice.cai}`, 15, 58, {
      maxWidth: 180,
    });

    pdf.text(
      `Rango autorizado: ${invoice.authorizedRangeStart} al ${invoice.authorizedRangeEnd}`,
      15,
      65,
      {
        maxWidth: 180,
      },
    );

    pdf.text(`Fecha límite de emisión: ${this.formatDate(invoice.emissionDeadline)}`, 15, 72);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(150, 92, 0);
    //pdf.text('DOCUMENTO DEMOSTRATIVO - SIN VALIDEZ FISCAL', 195, 72, { align: 'right' });
  }

  private addClient(pdf: jsPDF, invoice: InvoiceDocument): void {
    const client = invoice.client;

    pdf.setDrawColor(220, 229, 227);
    pdf.line(15, 79, 195, 79);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(23, 58, 54);
    pdf.text('INFORMACIÓN DEL CLIENTE', 15, 87);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(55, 75, 71);

    pdf.text(`Cliente: ${client.name}`, 15, 94);

    pdf.text(`Identidad/RTN: ${client.identityOrRtn || 'No indicado'}`, 15, 100);

    pdf.text(`Teléfono: ${client.phone || 'No indicado'}`, 110, 94);

    pdf.text(`Correo: ${client.email || 'No indicado'}`, 110, 100);

    const address = pdf.splitTextToSize(`Dirección: ${client.address || 'No indicada'}`, 180);

    pdf.text(address, 15, 106);
  }

  private addItems(pdf: jsPDF, invoice: InvoiceDocument): void {
    autoTable(pdf, {
      startY: 115,
      head: [['Código', 'Descripción', 'Cantidad', 'Precio', 'Gravado', 'Subtotal']],
      body: invoice.items.map((item) => [
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

  private addSummary(pdf: jsPDF, invoice: InvoiceDocument): void {
    let y = (pdf as PdfWithTable).lastAutoTable.finalY + 9;

    if (y > 230) {
      pdf.addPage();
      y = 20;
    }

    if (invoice.notes) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(23, 58, 54);
      pdf.text('Observaciones', 15, y);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(70, 90, 86);

      const notes = pdf.splitTextToSize(invoice.notes, 100);

      pdf.text(notes, 15, y + 5);
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(70, 90, 86);

    pdf.text('Subtotal:', 155, y, {
      align: 'right',
    });

    pdf.text(this.formatMoney(invoice.totals.subtotal), 195, y, { align: 'right' });

    y += 7;

    pdf.text(`Impuesto (${invoice.taxRate}%):`, 155, y, { align: 'right' });

    pdf.text(this.formatMoney(invoice.totals.tax), 195, y, { align: 'right' });

    y += 8;

    pdf.setDrawColor(37, 133, 109);
    pdf.line(145, y - 5, 195, y - 5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(23, 58, 54);

    pdf.text('TOTAL:', 155, y, {
      align: 'right',
    });

    pdf.text(this.formatMoney(invoice.totals.total), 195, y, { align: 'right' });
  }

  private addFooter(pdf: jsPDF): void {
    const pages = pdf.getNumberOfPages();

    for (let page = 1; page <= pages; page += 1) {
      pdf.setPage(page);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(110, 125, 122);

      pdf.text('Factura demostrativa de Sora Trade 504.', 15, 287);

      pdf.text(`Página ${page} de ${pages}`, 195, 287, {
        align: 'right',
      });
    }
  }

  private async loadLogo(): Promise<string | null> {
    try {
      const url = new URL('images/sora-trade-logo.jpeg', document.baseURI);

      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      return await this.toDataUrl(await response.blob());
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
    return new Date(`${value}T00:00:00`).toLocaleDateString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private sanitize(value: string): string {
    return value.replace(/[^a-zA-Z0-9-_]/g, '-');
  }
}
