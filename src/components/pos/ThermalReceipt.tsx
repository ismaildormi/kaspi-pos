"use client";

import React, { useRef } from "react";
import { Printer } from "lucide-react";
import {
  type ReceiptLanguage,
  getReceiptTranslation,
  formatReceiptAmount,
  toWesternNumerals,
  translatePaymentMethod,
} from "@/lib/printing/receipt-translations";

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

export interface ReceiptData {
  shopName: string;
  legalName?: string;
  ice?: string;
  taxId?: string;
  rcNumber?: string;
  address?: string;
  city?: string;
  phone?: string;
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
  const lang: ReceiptLanguage = language || data.receiptLanguage || "fr";
  const dict = getReceiptTranslation(lang);
  const isRtl = dict.dir === "rtl";
  const currency = toWesternNumerals(data.currency || "MAD");

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const is58mm = width === "58mm";
  const showLogo = data.showStoreLogo ?? true;

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

      {/* Thermal Receipt Paper Container */}
      <div
        ref={receiptRef}
        dir={dict.dir}
        style={{ width: is58mm ? "58mm" : "80mm" }}
        className="bg-white text-black p-3 font-mono text-[11px] leading-tight border border-slate-300 shadow-lg text-start mx-auto"
      >
        {/* Header: Optional Logo, Shop Name & Tax Identifiers */}
        <div className="text-center pb-2 border-b border-dashed border-black">
          {showLogo && (
            <img
              src="/logo.png"
              alt="Logo"
              className="w-8 h-8 object-contain mx-auto mb-1 grayscale contrast-200"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <h2 className="text-sm font-black uppercase tracking-tight">{data.shopName}</h2>
          {data.legalName && <p className="text-[10px]">{data.legalName}</p>}
          <p className="text-[10px] mt-0.5">
            {data.address || ""} {data.city || ""}
          </p>
          {data.phone && (
            <p className="text-[9px] font-mono" dir="ltr">
              Tel: {toWesternNumerals(data.phone)}
            </p>
          )}
          <div className="text-[9px] mt-1 space-y-0.5 font-bold" dir="ltr">
            {data.ice && <p>ICE: {toWesternNumerals(data.ice)}</p>}
            <p>
              {data.taxId ? `IF: ${toWesternNumerals(data.taxId)}` : ""}{" "}
              {data.rcNumber ? `| RC: ${toWesternNumerals(data.rcNumber)}` : ""}
            </p>
          </div>
          {data.receiptHeader && (
            <p className="text-[10px] italic pt-1">{data.receiptHeader}</p>
          )}
        </div>

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
            <span dir="ltr">{toWesternNumerals(data.date)}</span>
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
        </div>

        {/* Items Table */}
        <div className="py-2 border-b border-dashed border-black">
          <div className="flex justify-between font-bold text-[9px] pb-1 border-b border-dotted border-gray-400">
            <span className="w-1/2">{dict.item}</span>
            <span className="w-1/6 text-center">{dict.qty}</span>
            <span className={`w-1/3 ${isRtl ? "text-left" : "text-right"}`}>{dict.lineTotal}</span>
          </div>

          <div className="divide-y divide-dotted divide-gray-300 pt-1">
            {data.items.map((item, idx) => (
              <div key={idx} className="py-1">
                <div className="font-bold text-[10px] truncate">{item.name}</div>
                <div className="flex justify-between text-[9px] text-gray-700" dir="ltr">
                  <span>
                    {toWesternNumerals(item.quantity)} x {formatReceiptAmount(item.unitPrice)}
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
          <div className="flex justify-between">
            <span>{dict.subtotal}:</span>
            <span dir="ltr">
              {formatReceiptAmount(data.subtotal)} {currency}
            </span>
          </div>
          {data.discountTotal !== undefined && data.discountTotal > 0 && (
            <div className="flex justify-between">
              <span>{dict.discount}:</span>
              <span dir="ltr">
                -{formatReceiptAmount(data.discountTotal)} {currency}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>{dict.tax}:</span>
            <span dir="ltr">
              {formatReceiptAmount(data.taxTotal)} {currency}
            </span>
          </div>
          <div className="flex justify-between font-black text-xs pt-1 border-t border-black">
            <span>{dict.grandTotal}:</span>
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
              {data.tpeFeeMerchant !== undefined && (
                <div className="flex justify-between text-gray-500 text-[8px]">
                  <span>{dict.tpeFeeMerchant}:</span>
                  <span dir="ltr">
                    {formatReceiptAmount(data.tpeFeeMerchant)} {currency}
                  </span>
                </div>
              )}
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

        {/* Footer: Thank You & QR Placeholder */}
        <div className="text-center pt-3 pb-1 space-y-1">
          <p className="font-bold text-[10px]">{data.receiptFooter || dict.thankYou}</p>
          <div
            className="w-16 h-16 border border-black mx-auto mt-2 flex items-center justify-center text-[7px] text-gray-500"
            dir="ltr"
          >
            [ QR CODE ]
          </div>
          <p className="text-[8px] text-gray-600 mt-1" dir="ltr">
            KASPI POS Global • www.kaspi.ma
          </p>
        </div>
      </div>
    </div>
  );
};
