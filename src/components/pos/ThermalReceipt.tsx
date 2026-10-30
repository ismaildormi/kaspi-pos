"use client";

import React, { useRef } from "react";
import { Printer } from "lucide-react";

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
  receiptNumber: string;
  date: string;
  cashierName?: string;
  customerName?: string;
  customerIce?: string;
  items: ReceiptItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  paidTotal: number;
  changeDue: number;
  paymentMethod: string;
  currency?: string;
}

interface ThermalReceiptProps {
  data: ReceiptData;
  width?: "58mm" | "80mm";
  onPrint?: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  data,
  width = "80mm",
  onPrint,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const currency = data.currency || "MAD";

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const is58mm = width === "58mm";

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs border border-zinc-700 shadow-md transition cursor-pointer"
      >
        <Printer className="w-4 h-4" />
        <span>Imprimer Ticket ({width}) • طباعة</span>
      </button>

      {/* Thermal Receipt Paper Container */}
      <div
        ref={receiptRef}
        style={{ width: is58mm ? "58mm" : "80mm" }}
        className="bg-white text-black p-3 font-mono text-[11px] leading-tight border border-slate-300 shadow-lg text-start mx-auto"
      >
        {/* Header: Shop Name & Tax Identifiers */}
        <div className="text-center pb-2 border-b border-dashed border-black">
          <h2 className="text-sm font-black uppercase tracking-tight">{data.shopName}</h2>
          {data.legalName && <p className="text-[10px]">{data.legalName}</p>}
          <p className="text-[10px] mt-0.5">{data.address || ""} {data.city || ""}</p>
          <div className="text-[9px] mt-1 space-y-0.5 font-bold">
            {data.ice && <p>ICE: {data.ice}</p>}
            <p>
              {data.taxId ? `IF: ${data.taxId}` : ""} {data.rcNumber ? `| RC: ${data.rcNumber}` : ""}
            </p>
          </div>
        </div>

        {/* Receipt Meta */}
        <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span>Ticket N°:</span>
            <span className="font-bold">{data.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{data.date}</span>
          </div>
          <div className="flex justify-between">
            <span>Caissier:</span>
            <span>{data.cashierName || "Caisse 1"}</span>
          </div>
          {data.customerName && (
            <div className="flex justify-between border-t border-dotted border-gray-400 pt-0.5 mt-0.5">
              <span>Client:</span>
              <span className="font-bold">{data.customerName}</span>
            </div>
          )}
          {data.customerIce && (
            <div className="flex justify-between">
              <span>ICE Client:</span>
              <span className="font-mono">{data.customerIce}</span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="py-2 border-b border-dashed border-black">
          <div className="flex justify-between font-bold text-[9px] pb-1 border-b border-dotted border-gray-400">
            <span className="w-1/2">Désignation</span>
            <span className="w-1/6 text-center">Qté</span>
            <span className="w-1/3 text-right">Total</span>
          </div>

          <div className="divide-y divide-dotted divide-gray-300 pt-1">
            {data.items.map((item, idx) => (
              <div key={idx} className="py-1">
                <div className="font-bold text-[10px] truncate">{item.name}</div>
                <div className="flex justify-between text-[9px] text-gray-700">
                  <span>
                    {item.quantity} x {item.unitPrice.toFixed(2)}
                  </span>
                  <span className="font-bold text-black">
                    {item.lineTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Section */}
        <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>Total HT:</span>
            <span>{data.subtotal.toFixed(2)} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span>Total TVA:</span>
            <span>{data.taxTotal.toFixed(2)} {currency}</span>
          </div>
          <div className="flex justify-between font-black text-xs pt-1 border-t border-black">
            <span>TOTAL TTC:</span>
            <span>{data.grandTotal.toFixed(2)} {currency}</span>
          </div>
        </div>

        {/* Payment & Change Section */}
        <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>Mode Règlement:</span>
            <span className="font-bold uppercase">{data.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span>Reçu:</span>
            <span>{data.paidTotal.toFixed(2)} {currency}</span>
          </div>
          {data.changeDue > 0 && (
            <div className="flex justify-between font-bold text-[11px] pt-0.5">
              <span>Rendu (الباقي):</span>
              <span>{data.changeDue.toFixed(2)} {currency}</span>
            </div>
          )}
        </div>

        {/* Footer: Bilingual Thank You & QR Placeholder */}
        <div className="text-center pt-3 pb-1 space-y-1">
          <p className="font-bold text-[10px]">Merci de votre visite</p>
          <p className="font-bold text-[10px]">شكراً على زيارتكم</p>
          <div className="w-16 h-16 border border-black mx-auto mt-2 flex items-center justify-center text-[7px] text-gray-500">
            [ QR CODE ]
          </div>
          <p className="text-[8px] text-gray-600 mt-1">Kasbi POS Cloud • www.kasbi.ma</p>
        </div>
      </div>
    </div>
  );
};
