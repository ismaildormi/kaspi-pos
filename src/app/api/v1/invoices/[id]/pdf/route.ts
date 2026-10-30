import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { handleApiError, AppError } from "@/server/http/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: {
        tenantId_id: {
          tenantId: ctx.tenantId,
          id,
        },
      },
      include: {
        customer: true,
        store: true,
      },
    });

    if (!invoice) {
      throw new AppError("INVOICE_NOT_FOUND", "Invoice not found", 404);
    }

    const seller = invoice.sellerSnapshot as Record<string, any>;
    const buyer = invoice.buyerSnapshot as Record<string, any> | null;
    const lines = (invoice.linesSnapshot as any[]) || [];
    const taxBreakdown = (invoice.taxBreakdown as Record<string, { base: string; tax: string }>) || {};

    const title =
      invoice.kind === "quote"
        ? "DEVIS (عرض أسعار)"
        : invoice.kind === "credit_note"
        ? "AVOIR (فاتورة استرجاع)"
        : "FACTURE (فاتورة)";

    const formattedDate = invoice.issuedAt
      ? new Date(invoice.issuedAt).toLocaleDateString("fr-MA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

    const html = `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${invoice.invoiceNumber} - ${title}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.5; font-size: 13px; margin: 0; padding: 20px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 25px; }
    .company h1 { font-size: 22px; color: #0f172a; margin: 0 0 5px 0; }
    .company p { margin: 2px 0; color: #64748b; font-size: 12px; }
    .doc-meta { text-align: right; }
    .doc-meta h2 { font-size: 20px; color: #0284c7; margin: 0 0 5px 0; }
    .doc-meta p { margin: 2px 0; font-size: 12px; }
    .client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-bottom: 25px; width: 45%; margin-left: auto; }
    .client-box h3 { margin: 0 0 8px 0; font-size: 13px; color: #475569; text-transform: uppercase; }
    .table-container { margin-bottom: 25px; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #0f172a; color: white; padding: 10px 12px; font-size: 12px; font-weight: 600; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .summary-section { display: flex; justify-content: space-between; margin-top: 15px; }
    .tax-box { width: 48%; }
    .tax-table { width: 100%; font-size: 11px; }
    .tax-table th { background: #e2e8f0; color: #334155; }
    .total-box { width: 45%; margin-left: auto; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
    .grand-total { font-size: 16px; font-weight: bold; color: #0f172a; border-top: 2px solid #0f172a; border-bottom: none; padding-top: 10px; margin-top: 5px; }
    .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; display: flex; gap: 10px;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
      Imprimer / Télécharger PDF
    </button>
  </div>

  <div class="header">
    <div class="company">
      <h1>${seller.displayName || seller.legalName}</h1>
      <p><strong>Raison Sociale:</strong> ${seller.legalName}</p>
      <p><strong>ICE:</strong> ${seller.ice || "Non renseigné"} | <strong>IF:</strong> ${seller.taxId || "Non renseigné"} | <strong>RC:</strong> ${seller.rcNumber || "Non renseigné"}</p>
      <p>${seller.address || ""} ${seller.city || ""}</p>
    </div>
    <div class="doc-meta">
      <h2>${title}</h2>
      <p><strong>N°:</strong> ${invoice.invoiceNumber}</p>
      <p><strong>Date d'émission:</strong> ${formattedDate}</p>
      <p><strong>Devise:</strong> ${invoice.currency}</p>
      <p><strong>Règlement:</strong> ${invoice.paymentMethod}</p>
    </div>
  </div>

  <div class="client-box">
    <h3>Client</h3>
    <p><strong>Nom / Raison Sociale:</strong> ${buyer?.name || "Client Comptoir (Passager)"}</p>
    ${buyer?.ice ? `<p><strong>ICE:</strong> ${buyer.ice}</p>` : ""}
    ${buyer?.taxIdentifier ? `<p><strong>Identifiant Fiscal:</strong> ${buyer.taxIdentifier}</p>` : ""}
    ${buyer?.phone ? `<p><strong>Tél:</strong> ${buyer.phone}</p>` : ""}
    ${buyer?.address ? `<p><strong>Adresse:</strong> ${buyer.address}</p>` : ""}
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Désignation</th>
          <th class="text-center">Qté</th>
          <th class="text-right">Prix Unit. HT</th>
          <th class="text-center">Taux TVA</th>
          <th class="text-right">Montant HT</th>
          <th class="text-right">Total TTC</th>
        </tr>
      </thead>
      <tbody>
        ${lines
          .map(
            (line) => `<tr>
          <td><strong>${line.name}</strong></td>
          <td class="text-center">${parseFloat(line.quantity).toFixed(2)}</td>
          <td class="text-right">${parseFloat(line.unitPrice).toFixed(2)}</td>
          <td class="text-center">${parseFloat(line.taxRate).toFixed(0)}%</td>
          <td class="text-right">${parseFloat(line.netAmount).toFixed(2)}</td>
          <td class="text-right font-bold">${parseFloat(line.lineTotal).toFixed(2)}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="summary-section">
    <div class="tax-box">
      <h4 style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #475569;">Récapitulatif TVA (DGI Maroc)</h4>
      <table class="tax-table">
        <thead>
          <tr>
            <th>Taux</th>
            <th class="text-right">Base Imposable (HT)</th>
            <th class="text-right">Montant Taxe</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(taxBreakdown)
            .map(
              ([rate, item]) => `<tr>
            <td>TVA ${rate}</td>
            <td class="text-right">${item.base}</td>
            <td class="text-right">${item.tax}</td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="total-box">
      <div class="total-row">
        <span>Total Hors Taxe (HT):</span>
        <strong>${Number(invoice.subtotal).toFixed(2)} ${invoice.currency}</strong>
      </div>
      <div class="total-row">
        <span>Total TVA:</span>
        <strong>${Number(invoice.taxTotal).toFixed(2)} ${invoice.currency}</strong>
      </div>
      <div class="total-row grand-total">
        <span>Net à Payer (TTC):</span>
        <span>${Number(invoice.grandTotal).toFixed(2)} ${invoice.currency}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>${seller.legalName} • ICE: ${seller.ice || "N/A"} • Conforme à la législation fiscale marocaine</p>
    <p>Généré automatiquement par Kasbi POS (كسب POS) SaaS</p>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
