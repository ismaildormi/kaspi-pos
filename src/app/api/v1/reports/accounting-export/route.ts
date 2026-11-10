import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSafeServerContext } from "@/server/auth/context";

/**
 * Moroccan Accounting Journal Export (Article 145 CGI / CGNC / Sage)
 * Exports sales ledger formatted for Moroccan accountants and tax authorities:
 * Date;Numero_Piece;ICE_Client;Nom_Client;Montant_HT;Taux_TVA;Montant_TVA;Montant_TTC;Mode_Reglement
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getSafeServerContext();
    const tenantId = ctx.tenantId;

    const sales = await prisma.sale.findMany({
      where: {
        tenantId,
        status: "completed",
      },
      include: {
        customer: true,
        payments: true,
        items: true,
      },
      orderBy: { completedAt: "desc" },
      take: 500,
    });

    // CSV Header with UTF-8 BOM (\uFEFF)
    let csv = "\uFEFFDate;Numero_Piece;ICE_Client;Nom_Client;Montant_HT_MAD;Taux_TVA;Montant_TVA_MAD;Montant_TTC_MAD;Mode_Reglement\n";

    for (const sale of sales) {
      const dateStr = sale.completedAt
        ? new Date(sale.completedAt).toISOString().split("T")[0]
        : new Date(sale.createdAt).toISOString().split("T")[0];
      const pieceNum = sale.receiptNumber || `FAC-${sale.id.slice(0, 8).toUpperCase()}`;
      const ice = sale.customer?.ice || "PARTICULIER";
      const clientName = (sale.customer?.name || "Client Comptant").replace(/;/g, " ");
      const ttc = Number(sale.grandTotal);
      const ht = Number(sale.subtotal) || Number((ttc / 1.2).toFixed(2));
      const tva = Number(sale.taxTotal) || Number((ttc - ht).toFixed(2));
      const tvaRate = "20%";
      const paymentMethod = sale.payments.map((p) => p.method.toUpperCase()).join("+") || "ESPECES";

      csv += `${dateStr};${pieceNum};${ice};${clientName};${ht.toFixed(2)};${tvaRate};${tva.toFixed(2)};${ttc.toFixed(2)};${paymentMethod}\n`;
    }

    const filename = `journal-ventes-kaspi-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur d'export" }, { status: 500 });
  }
}
