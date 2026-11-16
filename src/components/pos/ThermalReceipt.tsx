"use client";

import React, { useRef } from "react";
import { Printer } from "lucide-react";
import {
  type ReceiptLanguage,
  getReceiptTranslation,
  formatReceiptAmount,
  formatReceiptIsoDateTime,
  toWesternNumerals,
  translatePaymentMethod,
} from "@/lib/printing/receipt-translations";
import { printThermalReceipt } from "@/client/printing";
import { generateCode128Svg, generateQrCodeSvg } from "@/lib/printing/client-codes";

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  lineTotal: number;
  unit?: string;
  modifiers?: string[];
}

export interface ReceiptData {
  shopName: string;
  legalName?: string;
  logoUrl?: string;
  ice?: string;
  taxId?: string;
  rcNumber?: string;
  address?: string;
  city?: string;
  phone?: string; // Suppressed from customer paper receipts
  receiptNumber: string;
  date: string;
  cashierName?: string;
  customerName?: string;
  customerIce?: string;
  items: ReceiptItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal?: number;
  grandTotal: number;
  paidTotal: number;
  changeDue: number;
  paymentMethod: string;
  currency?: string;
  tpeFeeCustomer?: number;
  tpeFeeMerchant?: number;
  tpeBreakdown?: string;
  receiptLanguage?: ReceiptLanguage;
  receiptHeader?: string;
  receiptFooter?: string;
  showStoreLogo?: boolean;
  sectorBadge?: string;
  sectorMetadata?: string[];
  isGiftVoucher?: boolean;
  isDeliveryNote?: boolean;
  orderNumber?: string | number;
  serviceMode?: "dine_in" | "takeaway" | "delivery";
  taxDisplayMode?: "INCLUSIVE_CLEAN" | "TAX_BREAKDOWN";
  showLegalIceOnReceipt?: boolean;
  receiptFooterCodeType?: "NONE" | "TICKET_BARCODE_1D" | "STORE_QR_CODE";
  receiptQrTargetUrl?: string;
}

interface ThermalReceiptProps {
  data: ReceiptData;
  width?: "58mm" | "80mm";
  language?: ReceiptLanguage;
  onPrint?: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  data,
  width = "80mm",
  language,
  onPrint,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const lang: ReceiptLanguage = language || data.receiptLanguage || "ar";
  const dict = getReceiptTranslation(lang);
  const isRtl = dict.dir === "rtl";
  const currency = toWesternNumerals(data.currency || "MAD");
  const is58mm = width === "58mm";

  // Clean deduplicated store header
  const rawStoreName = (data.shopName || "ASIMA").trim();
  const cleanStoreName =
    rawStoreName.toUpperCase() === "KASPI POS" ||
    rawStoreName === "كسب POS" ||
    rawStoreName === "Magasin Principal"
      ? "ASIMA"
      : rawStoreName;

  // Deduplicate Address and City (City rendered ONCE only)
  const cleanCity = (data.city || "").trim();
  let cleanAddress = (data.address || "").trim();
  if (cleanCity && cleanAddress.toLowerCase().includes(cleanCity.toLowerCase())) {
    cleanAddress = cleanAddress.replace(new RegExp(`,?\\s*${cleanCity}`, "i"), "").trim();
  }
  const addressLine = [cleanAddress, cleanCity].filter(Boolean).join(" - ");

  // Legal IDs: Render ONLY real non-demo ICE if enabled or provided
  const isDemoIce = (v?: string | null) =>
    !v || v === "002345678000045" || v === "001987654000089" || v.startsWith("0000");
  const hasRealIce = Boolean(data.ice && !isDemoIce(data.ice));
  const showIce = hasRealIce && data.showLegalIceOnReceipt !== false;

  // Mode detection: Cafe/Restaurant vs Supermarket/Retail
  const isCafeRestaurant =
    data.sectorBadge === "restaurant" ||
    data.sectorBadge === "cafe" ||
    data.sectorBadge === "cafe_restaurant" ||
    Boolean(data.orderNumber) ||
    Boolean(data.serviceMode);

  // Hero order number for Cafe/Restaurant tickets
  const heroOrderNo =
    data.orderNumber ||
    (data.receiptNumber ? data.receiptNumber.replace(/^[A-Za-z-]+/, "").slice(-3) : "1");

  // Tax display mode: Default to INCLUSIVE_CLEAN for zero VAT surprises
  const isTaxBreakdown = data.taxDisplayMode === "TAX_BREAKDOWN";

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      printThermalReceipt({
        ...data,
        storeName: cleanStoreName,
        createdAt: data.date,
        paperWidthMm: is58mm ? 58 : 80,
        receiptLanguage: lang,
        orderNumber: heroOrderNo,
        serviceMode: data.serviceMode,
        taxDisplayMode: data.taxDisplayMode,
        receiptFooterCodeType: data.receiptFooterCodeType,
        receiptQrTargetUrl: data.receiptQrTargetUrl,
      }).catch(() => {});
    }
  };

  // Client-side SVG generation for footer code
  const codeType = data.receiptFooterCodeType || "NONE";
  const barcodeSvg =
    codeType === "TICKET_BARCODE_1D"
      ? generateCode128Svg(data.receiptNumber || "REC-000000", {
          height: 38,
          barWidth: is58mm ? 1.3 : 1.7,
          showText: true,
        })
      : null;

  const qrSvg =
    codeType === "STORE_QR_CODE"
      ? generateQrCodeSvg(data.receiptQrTargetUrl || "https://kaspi.ma", {
          size: is58mm ? 76 : 94,
        })
      : null;

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs border border-zinc-700 shadow-md transition cursor-pointer"
      >
        <Printer className="w-4 h-4" />
        <span>
          {dict.printButton} ({toWesternNumerals(width)})
        </span>
      </button>

      {/* Thermal Receipt Paper Container (100% Merchant Store Branding, ZERO Kaspi Logo) */}
      <div
        ref={receiptRef}
        dir={dict.dir}
        style={{ width: is58mm ? "58mm" : "80mm", backgroundColor: "#ffffff", color: "#000000" }}
        className="kaspi-thermal-receipt-sheet !bg-white !text-black [&_*]:!text-black p-3 font-mono text-[11px] leading-tight border border-slate-300 shadow-lg text-start mx-auto"
      >
        {/* Header: Store Name ONCE + Deduplicated Address + Real ICE Only (Zero Phone Number) */}
        <div className="text-center pb-2 border-b border-dashed border-black">
          <h2 className="text-base font-black uppercase tracking-tight">{cleanStoreName}</h2>
          {addressLine && <p className="text-[10px] mt-0.5">{addressLine}</p>}
          {showIce && (
            <p className="text-[9px] mt-0.5 font-bold" dir="ltr">
              ICE: {toWesternNumerals(data.ice)}
            </p>
          )}
          {data.receiptHeader && (
            <p className="text-[10px] italic pt-1">{data.receiptHeader}</p>
          )}

          {data.isDeliveryNote && (
            <div className="mt-1.5 py-1 px-2 border-y border-black font-black text-xs uppercase bg-black text-white">
              *** BON DE LIVRAISON (BL) ***
            </div>
          )}

          {data.isGiftVoucher && (
            <div className="mt-1.5 py-1 px-2 border-y border-black font-black text-[10px] uppercase bg-black text-white">
              *** TICKET CADEAU / ÉCHANGE ***
            </div>
          )}
        </div>

        {/* HERO ORDER NUMBER CALLOUT BOX for Cafe / Restaurant / Snack */}
        {isCafeRestaurant && (
          <div className="my-2 p-2 border-2 border-black rounded-lg text-center bg-gray-50">
            <div className="text-[10px] font-bold uppercase tracking-wider">{dict.orderNumber}</div>
            <div className="text-2xl font-black tracking-tight" dir="ltr">
              #{toWesternNumerals(heroOrderNo)}
            </div>
            {data.serviceMode && (
              <div className="text-[9px] font-bold mt-0.5 inline-block px-2 py-0.5 border border-black rounded uppercase">
                {data.serviceMode === "dine_in"
                  ? dict.dineIn
                  : data.serviceMode === "takeaway"
                  ? dict.takeaway
                  : dict.delivery}
              </div>
            )}
          </div>
        )}

        {/* Receipt Meta */}
        <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span>{dict.invoiceNo}:</span>
            <span className="font-bold" dir="ltr">
              {toWesternNumerals(data.receiptNumber)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{dict.date}:</span>
            <span
              dir="ltr"
              className="tabular-nums font-bold"
              style={{ direction: "ltr", unicodeBidi: "isolate" }}
            >
              {formatReceiptIsoDateTime(data.date)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{dict.cashier}:</span>
            <span>{data.cashierName || "Caisse 1"}</span>
          </div>
          {data.customerName && (
            <div className="flex justify-between border-t border-dotted border-gray-400 pt-0.5 mt-0.5">
              <span>{dict.customer}:</span>
              <span className="font-bold">{data.customerName}</span>
            </div>
          )}
          {data.customerIce && (
            <div className="flex justify-between">
              <span>{dict.customerTaxId}:</span>
              <span className="font-mono" dir="ltr">
                {toWesternNumerals(data.customerIce)}
              </span>
            </div>
          )}

          {/* Sector-Specific Details */}
          {data.sectorMetadata && data.sectorMetadata.length > 0 && (
            <div className="border-t border-dotted border-gray-400 pt-1 mt-1 space-y-0.5 text-[9px]">
              {data.sectorMetadata.map((meta, i) => (
                <div key={i} className="flex justify-between font-bold">
                  <span>{meta.split(":")[0]}:</span>
                  <span className="font-mono">{meta.split(":")[1] || ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="py-2 border-b border-dashed border-black">
          <div className="flex justify-between font-bold text-[9px] pb-1 border-b border-dotted border-gray-400">
            <span className="w-1/2">{dict.item}</span>
            <span className="w-1/4 text-center">{dict.qty}</span>
            <span className={`w-1/4 ${isRtl ? "text-left" : "text-right"}`}>{dict.lineTotal}</span>
          </div>

          <div className="divide-y divide-dotted divide-gray-300 pt-1">
            {data.items.map((item, idx) => (
              <div key={idx} className="py-1">
                <div className="font-bold text-[10px] truncate">{item.name}</div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="text-[8.5px] text-gray-700 italic">
                    + {item.modifiers.join(", ")}
                  </div>
                )}
                <div className="flex justify-between text-[9px] text-gray-700" dir="ltr">
                  <span>
                    {toWesternNumerals(item.quantity)}
                    {item.unit ? ` ${item.unit}` : ""} x {formatReceiptAmount(item.unitPrice)}
                  </span>
                  <span className="font-bold text-black">
                    {formatReceiptAmount(item.lineTotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Section */}
        <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
          {/* Optional Tax Breakdown for TVA-registered supermarkets */}
          {isTaxBreakdown && (
            <>
              <div className="flex justify-between">
                <span>{dict.subtotal}:</span>
                <span dir="ltr">
                  {formatReceiptAmount(data.subtotal)} {currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{dict.tax}:</span>
                <span dir="ltr">
                  {formatReceiptAmount(data.taxTotal)} {currency}
                </span>
              </div>
            </>
          )}

          {data.discountTotal !== undefined && data.discountTotal > 0 && (
            <div className="flex justify-between">
              <span>{dict.discount}:</span>
              <span dir="ltr">
                -{formatReceiptAmount(data.discountTotal)} {currency}
              </span>
            </div>
          )}

          {/* Clean Consumer Final Total (No surprise surcharge) */}
          <div className="flex justify-between font-black text-sm pt-1 border-t-2 border-black">
            <span>{dict.totalClean}:</span>
            <span dir="ltr">
              {formatReceiptAmount(data.grandTotal)} {currency}
            </span>
          </div>

          {data.tpeFeeCustomer !== undefined && data.tpeFeeCustomer > 0 && (
            <div className="pt-1 mt-1 border-t border-dotted border-gray-400 text-[9px] space-y-0.5">
              <div className="flex justify-between text-gray-800">
                <span>{dict.tpeFeeCustomer}:</span>
                <span dir="ltr">
                  +{formatReceiptAmount(data.tpeFeeCustomer)} {currency}
                </span>
              </div>
              <div className="flex justify-between font-black text-[11px] pt-0.5 border-t border-black">
                <span>{dict.totalPaidTpe}:</span>
                <span dir="ltr">
                  {formatReceiptAmount(data.grandTotal + data.tpeFeeCustomer)} {currency}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Payment & Change Section */}
        <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>{dict.paymentMethod}:</span>
            <span className="font-bold uppercase">
              {translatePaymentMethod(data.paymentMethod, lang)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{dict.paid}:</span>
            <span dir="ltr">
              {formatReceiptAmount(data.paidTotal)} {currency}
            </span>
          </div>
          {data.changeDue > 0 && (
            <div className="flex justify-between font-bold text-[11px] pt-0.5">
              <span>{dict.change}:</span>
              <span dir="ltr">
                {formatReceiptAmount(data.changeDue)} {currency}
              </span>
            </div>
          )}
        </div>

        {/* Footer: Thank You in single clean language + Pure Client SVG Barcode or QR Code */}
        <div className="text-center pt-3 pb-1 space-y-2">
          <p className="font-bold text-[10px]">{data.receiptFooter || dict.thankYou}</p>

          {/* 1D Ticket Barcode */}
          {barcodeSvg && (
            <div
              className="my-1.5 flex justify-center"
              dangerouslySetInnerHTML={{ __html: barcodeSvg }}
            />
          )}

          {/* 2D Store Website / Menu QR Code */}
          {qrSvg && (
            <div className="my-1.5 flex flex-col items-center">
              <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
              {data.receiptQrTargetUrl && (
                <span className="text-[8px] font-mono mt-0.5 text-gray-600 truncate max-w-[90%]">
                  {data.receiptQrTargetUrl.replace(/^https?:\/\//, "")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
