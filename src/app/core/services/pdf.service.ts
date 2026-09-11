import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { Invoice, Prescription } from '../models';

const BRAND: [number, number, number] = [50, 147, 111]; // #32936f
const INK: [number, number, number] = [31, 45, 43];

@Injectable({ providedIn: 'root' })
export class PdfService {
  prescription(p: Prescription): void {
    const doc = new jsPDF();
    let y = this.header(doc, p.clinicName, p.clinicAddress, p.clinicPhone, 'PRESCRIPTION');

    y = this.kvBlock(doc, y, [
      ['Patient', p.patientName + (p.patientAge != null ? `  (${p.patientAge} yrs)` : '')],
      ['Gender', p.patientGender ?? '—'],
      ['Date', new Date(p.appointmentDate).toLocaleDateString()],
      ['Doctor', `${p.doctorName} — ${p.doctorSpecialization}`],
    ]);

    if (p.diagnosis) {
      y += 4;
      doc.setFont('helvetica', 'bold').setFontSize(11).text('Diagnosis', 14, y);
      doc.setFont('helvetica', 'normal').setFontSize(10);
      y += 6;
      y = this.wrapped(doc, p.diagnosis, y);
    }

    y += 6;
    doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...BRAND).text('Rx', 14, y);
    doc.setTextColor(...INK);
    y += 4;

    doc.setDrawColor(220);
    p.items.forEach((item, i) => {
      y += 8;
      doc.setFont('helvetica', 'bold').setFontSize(10).text(`${i + 1}. ${item.medicineName}`, 16, y);
      const detail = [
        item.dosage && `Dosage: ${item.dosage}`,
        item.frequency && `Frequency: ${item.frequency}`,
        item.durationDays && `Duration: ${item.durationDays} days`,
      ]
        .filter(Boolean)
        .join('   |   ');
      if (detail) {
        y += 5;
        doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(90).text(detail, 20, y);
        doc.setTextColor(...INK);
      }
      if (item.instructions) {
        y += 5;
        doc.setFont('helvetica', 'italic').setFontSize(9).text(`Note: ${item.instructions}`, 20, y);
      }
      y += 2;
      doc.line(16, y, 196, y);
    });

    if (p.notes) {
      y += 10;
      doc.setFont('helvetica', 'bold').setFontSize(10).text('Advice', 14, y);
      y += 6;
      y = this.wrapped(doc, p.notes, y);
    }
    if (p.followUpDate) {
      y += 8;
      doc.setFont('helvetica', 'bold').setFontSize(10)
        .text(`Follow-up: ${new Date(p.followUpDate).toLocaleDateString()}`, 14, y);
    }

    this.signature(doc, p.doctorName);
    doc.save(`prescription-${p.appointmentId}.pdf`);
  }

  invoice(inv: Invoice): void {
    const doc = new jsPDF();
    let y = this.header(doc, inv.clinicName, inv.clinicAddress, inv.clinicPhone, `INVOICE ${inv.number}`);

    y = this.kvBlock(doc, y, [
      ['Bill to', inv.patientName],
      ['Issued', new Date(inv.issuedAt).toLocaleString()],
      ['Status', inv.status + (inv.paymentMethod ? ` (${inv.paymentMethod})` : '')],
    ]);

    y += 8;
    doc.setFillColor(...BRAND).setTextColor(255).setFont('helvetica', 'bold').setFontSize(10);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.text('Description', 16, y);
    doc.text('Qty', 130, y);
    doc.text('Unit', 148, y);
    doc.text('Amount', 178, y);
    doc.setTextColor(...INK).setFont('helvetica', 'normal');

    inv.items.forEach((it) => {
      y += 8;
      doc.text(String(it.description).slice(0, 60), 16, y);
      doc.text(String(it.quantity), 130, y);
      doc.text(this.money(it.unitPrice), 148, y);
      doc.text(this.money(it.amount), 178, y);
    });

    y += 10;
    const totals: [string, number][] = [
      ['Subtotal', inv.subtotal],
      ['Discount', -inv.discount],
      [`Tax (${inv.taxRate}%)`, inv.taxAmount],
      ['Total', inv.total],
    ];
    totals.forEach(([label, val], i) => {
      const bold = i === totals.length - 1;
      doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(bold ? 12 : 10);
      doc.text(label, 140, y);
      doc.text(this.money(val), 178, y);
      y += bold ? 9 : 6;
    });

    if (inv.payments?.length) {
      y += 8;
      doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK).text('Payments', 14, y);
      doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(90);
      for (const p of inv.payments) {
        y += 5;
        const detail = [
          p.cardLast4 && `card ****${p.cardLast4}`,
          p.bankName && `${p.bankName}`,
          p.mobileNumber && `${p.mobileNumber}`,
          p.reference && `ref ${p.reference}`,
        ]
          .filter(Boolean)
          .join(', ');
        doc.text(
          `${new Date(p.paidAt).toLocaleDateString()} — ${p.method}${detail ? ' (' + detail + ')' : ''}: ${this.money(p.amount)}`,
          14,
          y,
        );
      }
      doc.setTextColor(...INK);
    }

    if (inv.notes) {
      y += 8;
      doc.setFont('helvetica', 'italic').setFontSize(9).text(`Notes: ${inv.notes}`, 14, y);
    }

    doc.setFontSize(8).setTextColor(130)
      .text('Thank you for choosing ' + inv.clinicName, 14, 285);
    doc.save(`${inv.number}.pdf`);
  }

  // ---- shared helpers ----
  private header(
    doc: jsPDF,
    name: string,
    address: string | null | undefined,
    phone: string | null | undefined,
    title: string,
  ): number {
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, 210, 4, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(...BRAND).text(name, 14, 20);
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(90);
    let y = 26;
    if (address) doc.text(address, 14, (y += 0));
    if (phone) doc.text(`Tel: ${phone}`, 14, (y += address ? 5 : 0));
    doc.setTextColor(...INK).setFont('helvetica', 'bold').setFontSize(13);
    y += 12;
    doc.text(title, 14, y);
    doc.setDrawColor(...BRAND).setLineWidth(0.5).line(14, y + 2, 196, y + 2);
    return y + 12;
  }

  private kvBlock(doc: jsPDF, y: number, rows: [string, string][]): number {
    doc.setFontSize(10);
    rows.forEach(([k, v]) => {
      doc.setFont('helvetica', 'bold').setTextColor(90).text(`${k}:`, 14, y);
      doc.setFont('helvetica', 'normal').setTextColor(...INK).text(v, 45, y);
      y += 6;
    });
    return y;
  }

  private wrapped(doc: jsPDF, text: string, y: number): number {
    const lines = doc.splitTextToSize(text, 180) as string[];
    doc.setFont('helvetica', 'normal').setFontSize(10).text(lines, 14, y);
    return y + lines.length * 5;
  }

  private signature(doc: jsPDF, name: string): void {
    doc.setDrawColor(150).line(140, 265, 196, 265);
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(90).text(name, 140, 270);
    doc.text('Signature', 140, 275);
  }

  private money(n: number): string {
    return 'Rs ' + n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}
