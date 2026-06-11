import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { formatMXN, formatDateMX, BRAND } from '@bismark/shared';

export interface DigitalTicketPdfData {
  raffleTitle: string;
  riferoPublicName: string;
  eventLabel: string;
  ticketNumbers: string[];
  buyerName: string;
  statusLabel: string;
  totalAmount: number;
  orderCode: string;
  verifyUrl: string;
  createdAt: Date;
  primaryColor?: string;
}

function streamToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

export async function renderDigitalTicketPdf(data: DigitalTicketPdfData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A6', margin: 24, layout: 'portrait' });
  const done = streamToBuffer(doc);
  const accent = data.primaryColor && /^#([0-9a-f]{6})$/i.test(data.primaryColor) ? data.primaryColor : '#1d4ed8';

  // Encabezado
  doc.rect(0, 0, doc.page.width, 70).fill(accent);
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(data.riferoPublicName, 24, 20, { width: doc.page.width - 48 });
  doc.fontSize(9).font('Helvetica').text(`${data.eventLabel} · Boleto digital`, 24, 44);

  doc.fillColor('#0f172a');
  let y = 86;
  doc.fontSize(12).font('Helvetica-Bold').text(data.raffleTitle, 24, y, { width: doc.page.width - 48 });
  y = doc.y + 8;

  const line = (label: string, value: string) => {
    doc.fontSize(8).fillColor('#64748b').font('Helvetica').text(label, 24, y);
    doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(value, 24, doc.y, { width: doc.page.width - 48 });
    y = doc.y + 6;
  };

  line('Comprador', data.buyerName);
  line('Boletos', data.ticketNumbers.join(', '));
  line('Total', formatMXN(data.totalAmount));
  line('Estado', data.statusLabel);
  line('Folio', data.orderCode);
  line('Fecha', formatDateMX(data.createdAt));

  // QR de verificación
  try {
    const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, { margin: 0, width: 120 });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const qrSize = 90;
    doc.image(qrBuffer, doc.page.width - 24 - qrSize, doc.page.height - 130, { width: qrSize, height: qrSize });
    doc.fontSize(7).fillColor('#64748b').text('Verificar', doc.page.width - 24 - qrSize, doc.page.height - 36, { width: qrSize, align: 'center' });
  } catch {
    /* si falla el QR, continuar sin él */
  }

  // Pie discreto
  doc.fontSize(7).fillColor('#94a3b8').font('Helvetica').text(BRAND.generatedBy, 24, doc.page.height - 30);

  doc.end();
  return done;
}
