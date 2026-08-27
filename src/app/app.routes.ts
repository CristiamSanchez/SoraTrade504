import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'cotizaciones',
  },
  {
    path: 'cotizaciones',
    loadComponent: () =>
      import(
        './features/quotations/pages/quotation-form/quotation-form'
      ).then((component) => component.QuotationForm),
    title: 'Cotización | Sora Trade 504',
  },
  {
    path: 'facturas',
    loadComponent: () =>
      import(
        './features/invoices/pages/invoice-form/invoice-form'
      ).then((component) => component.InvoiceForm),
    title: 'Factura | Sora Trade 504',
  },
  {
    path: '**',
    redirectTo: 'cotizaciones',
  },
];