"use client";

import React from "react";
import { playTapSound } from "@/lib/audio";

export type AuthLocale = "ar" | "fr" | "en";

interface AuthGlassShellProps {
  locale: AuthLocale;
  onLocaleChange: (nextLocale: AuthLocale) => void;
  title: string;
  children: React.ReactNode;
}

/**
 * High-density Monochrome 3D Line-Art SVG Pattern tile (800x800 seamless vector matrix)
 * featuring retail & POS ecosystem items: shopping carts, t-shirts, sneakers, barcode scanners,
 * barcodes, laptops, cash registers, TPE terminals, coffee cups, bottles, boxes, headphones,
 * plates, shopping bags, and PRICE tags.
 */
function RetailLineArtTile({ idPrefix }: { idPrefix: string }) {
  return (
    <svg
      viewBox="0 0 1200 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full select-none pointer-events-none"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <style>{`
          .la-stroke {
            stroke: rgba(255, 255, 255, 0.72);
            stroke-width: 1.75;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: #070708;
          }
          .la-line {
            stroke: rgba(255, 255, 255, 0.68);
            stroke-width: 1.5;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
          }
          .la-thin {
            stroke: rgba(255, 255, 255, 0.45);
            stroke-width: 1.1;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
          }
          .la-text {
            fill: rgba(255, 255, 255, 0.72);
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-weight: 700;
            letter-spacing: 0.08em;
          }
        `}</style>
      </defs>

      {/* ==================== TOP LEFT: SHOPPING CART & PLATES ==================== */}
      <g id={`${idPrefix}-cart-tl`} transform="translate(18, 18) rotate(-4)">
        <path className="la-line" d="M5 10 H22 L34 78 H108 L122 26 H26" />
        <path className="la-thin" d="M29 40 H118 M31 53 H114 M33 66 H110" />
        <path className="la-thin" d="M46 26 L48 78 M64 26 L64 78 M82 26 L80 78 M100 26 L96 78" />
        <path className="la-line" d="M34 78 L28 92 H104" />
        <circle className="la-stroke" cx="38" cy="100" r="8" />
        <circle className="la-thin" cx="38" cy="100" r="3" />
        <circle className="la-stroke" cx="94" cy="100" r="8" />
        <circle className="la-thin" cx="94" cy="100" r="3" />
      </g>

      {/* Checkmark coin */}
      <g transform="translate(88, 6)">
        <circle className="la-stroke" cx="16" cy="16" r="13" />
        <path className="la-line" d="M11 16 L15 20 L22 12" />
      </g>

      {/* ==================== TOP LEFT-CENTER: T-SHIRTS ==================== */}
      <g transform="translate(135, 8) rotate(6)">
        <path
          className="la-stroke"
          d="M35 12 C45 20 65 20 75 12 L106 30 L92 56 L78 48 L78 128 H32 L32 48 L18 56 L4 30 Z"
        />
        <path className="la-thin" d="M35 12 C45 26 65 26 75 12" />
        <path className="la-thin" d="M32 120 H78" />
      </g>

      <g transform="translate(235, 10) rotate(-7)">
        <path
          className="la-stroke"
          d="M32 10 C42 18 58 18 68 10 L96 26 L84 50 L70 42 L70 116 H30 L30 42 L16 50 L4 26 Z"
        />
        <path className="la-thin" d="M30 109 H70" />
      </g>

      {/* ==================== TOP CENTER-LEFT: SNEAKERS ==================== */}
      <g transform="translate(338, 12) rotate(14)">
        <path
          className="la-stroke"
          d="M12 52 C12 36 22 18 34 14 L52 28 C66 34 86 42 104 44 C114 45 120 52 118 60 L10 60 Z"
        />
        <path className="la-stroke" d="M8 60 H118 C120 66 116 70 108 70 H14 C8 70 6 65 8 60 Z" />
        <path className="la-thin" d="M46 24 L56 20 M54 30 L64 25 M62 35 L72 30 M70 39 L80 34" />
        <path className="la-thin" d="M22 44 C38 46 58 52 86 58" />
      </g>

      <g transform="translate(310, 74) rotate(8)">
        <path
          className="la-stroke"
          d="M12 52 C12 36 22 18 34 14 L52 28 C66 34 86 42 104 44 C114 45 120 52 118 60 L10 60 Z"
        />
        <path className="la-stroke" d="M8 60 H118 C120 66 116 70 108 70 H14 C8 70 6 65 8 60 Z" />
        <path className="la-thin" d="M46 24 L56 20 M54 30 L64 25 M62 35 L72 30" />
      </g>

      {/* ==================== TOP CENTER: BARCODE SCANNERS & TRIPOD ==================== */}
      <g transform="translate(454, 10) rotate(-6)">
        <path
          className="la-stroke"
          d="M12 22 C12 12 28 8 52 10 C64 11 70 18 68 28 L48 34 L44 74 C42 82 30 82 28 74 L30 34 L14 32 Z"
        />
        <rect className="la-thin" x="14" y="16" width="16" height="12" rx="2" />
        <path className="la-thin" d="M30 42 L22 48 L28 52" />
      </g>

      <g transform="translate(520, 8) rotate(5)">
        <path
          className="la-stroke"
          d="M12 22 C12 12 28 8 52 10 C64 11 70 18 68 28 L48 34 L44 74 C42 82 30 82 28 74 L30 34 L14 32 Z"
        />
        <rect className="la-thin" x="14" y="16" width="16" height="12" rx="2" />
      </g>

      {/* Packaging Box Top Center */}
      <g transform="translate(692, 6)">
        <polygon className="la-stroke" points="42,8 82,24 42,42 4,24" />
        <polygon className="la-stroke" points="4,24 42,42 42,68 4,50" />
        <polygon className="la-stroke" points="82,24 42,42 42,68 82,50" />
        <path className="la-thin" d="M14 24 L42 12 L70 24" />
      </g>

      {/* ==================== TOP RIGHT: LAPTOP WITH SHOPPING CART, BOXES, PRICE TAGS, HEADPHONES ==================== */}
      <g transform="translate(778, 8) rotate(9)">
        <rect className="la-stroke" x="16" y="6" width="96" height="62" rx="5" />
        <rect className="la-thin" x="22" y="12" width="84" height="50" rx="2" />
        {/* Cart inside laptop screen */}
        <path className="la-line" d="M48 26 H54 L58 42 H76 L80 30 H56" />
        <circle className="la-line" cx="60" cy="46" r="2" />
        <circle className="la-line" cx="74" cy="46" r="2" />
        {/* Laptop keyboard base */}
        <polygon className="la-stroke" points="16,68 112,68 126,96 2,96" />
        <path className="la-thin" d="M18 74 H110 M14 80 H114 M10 86 H118" />
        <rect className="la-thin" x="52" y="88" width="24" height="6" rx="1" />
      </g>

      {/* Isometric Storage Box */}
      <g transform="translate(894, 4)">
        <polygon className="la-stroke" points="44,8 88,24 44,42 4,24" />
        <polygon className="la-stroke" points="4,24 44,42 44,92 4,72" />
        <polygon className="la-stroke" points="88,24 44,42 44,92 88,72" />
        <path className="la-line" d="M4 38 L44 56 L88 38" />
      </g>

      {/* PRICE Tags Top Right */}
      <g transform="translate(978, 12) rotate(-55)">
        <path className="la-stroke" d="M8 18 L24 4 L40 18 V62 H8 Z" />
        <circle className="la-line" cx="24" cy="14" r="3" />
        <text x="12" y="46" className="la-text" fontSize="9" transform="rotate(90 24 40)">
          PRICE
        </text>
      </g>

      <g transform="translate(1042, 4) rotate(-18)">
        <path className="la-stroke" d="M6 16 L60 4 L72 22 L18 44 Z" />
        <circle className="la-line" cx="62" cy="14" r="3" />
        <text x="16" y="30" className="la-text" fontSize="11" transform="rotate(-18 30 26)">
          PRICE
        </text>
      </g>

      {/* Grocery Bag with Baguettes / Produce */}
      <g transform="translate(1022, 58)">
        <path className="la-stroke" d="M12 36 H74 L68 110 H18 Z" />
        <path className="la-line" d="M22 36 C20 18 32 14 36 36" />
        <path className="la-line" d="M42 36 C44 12 58 14 56 36" />
        <path className="la-thin" d="M28 36 C30 22 42 22 44 36" />
      </g>

      {/* Headphones Top Right Corner */}
      <g transform="translate(1112, 6) rotate(12)">
        <path className="la-line" d="M16 56 C12 20 32 6 52 6 C72 6 92 20 88 56" strokeWidth="3" />
        <ellipse className="la-stroke" cx="20" cy="60" rx="10" ry="16" />
        <ellipse className="la-stroke" cx="84" cy="60" rx="10" ry="16" />
        <ellipse className="la-thin" cx="22" cy="60" rx="5" ry="10" />
        <ellipse className="la-thin" cx="82" cy="60" rx="5" ry="10" />
      </g>

      {/* ==================== LEFT COLUMN MIDDLE: PLATES, COFFEE CUPS, CART, BARCODE ==================== */}
      {/* Concentric Plate */}
      <g transform="translate(36, 148)">
        <circle className="la-stroke" cx="56" cy="56" r="52" />
        <circle className="la-line" cx="56" cy="56" r="36" />
      </g>

      {/* Takeaway Coffee Cup */}
      <g transform="translate(138, 174)">
        <ellipse className="la-stroke" cx="26" cy="10" rx="22" ry="5" />
        <path className="la-stroke" d="M6 14 H46 L40 76 H12 Z" />
        <path className="la-line" d="M8 30 H44 L42 52 H10 Z" />
      </g>

      {/* Steaming Café Cup on Saucer */}
      <g transform="translate(194, 152)">
        <path className="la-thin" d="M28 6 C26 14 32 16 30 24 M38 4 C36 12 42 14 40 22 M48 8 C46 14 50 16 48 24" />
        <ellipse className="la-stroke" cx="46" cy="70" rx="42" ry="12" />
        <path className="la-stroke" d="M18 34 H66 C66 58 56 68 42 68 C28 68 18 58 18 34 Z" />
        <ellipse className="la-stroke" cx="42" cy="34" rx="24" ry="6" />
        <path className="la-line" d="M66 40 C78 40 78 56 62 58" />
      </g>

      {/* Cake Slice on Plate */}
      <g transform="translate(290, 158)">
        <ellipse className="la-stroke" cx="54" cy="52" rx="48" ry="16" />
        <path className="la-stroke" d="M22 46 L52 16 L84 32 V50 L22 46 Z" />
        <path className="la-thin" d="M22 38 L84 42" />
      </g>

      {/* Second Shopping Cart Left-Middle */}
      <g transform="translate(52, 260) rotate(5)">
        <path className="la-line" d="M4 8 H20 L32 82 H112 L126 28 H24" />
        <path className="la-thin" d="M27 42 H122 M29 56 H118 M31 70 H114" />
        <path className="la-thin" d="M44 28 L46 82 M64 28 L64 82 M84 28 L82 82 M104 28 L100 82" />
        <path className="la-line" d="M32 82 L26 96 H108" />
        <circle className="la-stroke" cx="38" cy="106" r="9" />
        <circle className="la-stroke" cx="98" cy="106" r="9" />
      </g>

      {/* Small Plate & Fork */}
      <g transform="translate(174, 248)">
        <path className="la-line" d="M8 20 V48 M4 20 V34 C4 40 12 40 12 34 V20 M8 48 V98" />
        <circle className="la-stroke" cx="56" cy="58" r="36" />
        <circle className="la-line" cx="56" cy="58" r="24" />
        <path className="la-line" d="M104 20 V98 M104 20 C110 28 110 52 104 58" />
      </g>

      {/* Prominent Retail Barcode with Digits */}
      <g transform="translate(292, 248)">
        <rect className="la-thin" x="0" y="0" width="96" height="68" rx="4" strokeOpacity="0.2" />
        <path
          stroke="rgba(255,255,255,0.85)"
          strokeLinecap="butt"
          d="M6 6 V52 M10 6 V52 M15 6 V52 M22 6 V52 M26 6 V52 M33 6 V52 M37 6 V52 M44 6 V52 M48 6 V52 M52 6 V52 M59 6 V52 M65 6 V52 M69 6 V52 M76 6 V52 M82 6 V52 M86 6 V52 M90 6 V52"
          strokeWidth="2.2"
        />
        <path
          stroke="rgba(255,255,255,0.9)"
          strokeLinecap="butt"
          d="M12 6 V52 M29 6 V52 M41 6 V52 M55 6 V52 M72 6 V52 M84 6 V52"
          strokeWidth="3.8"
        />
        <text x="6" y="64" className="la-text" fontSize="9.5">
          545445 623384
        </text>
      </g>

      {/* Laptop Left-Center Middle */}
      <g transform="translate(242, 344)">
        <rect className="la-stroke" x="20" y="6" width="110" height="72" rx="5" />
        <rect className="la-thin" x="26" y="12" width="98" height="60" rx="2" />
        <polygon className="la-stroke" points="20,78 130,78 148,112 2,112" />
        <path className="la-thin" d="M22 86 H128 M16 94 H134 M12 102 H138" />
        <rect className="la-thin" x="62" y="103" width="26" height="6" rx="1" />
      </g>

      {/* ==================== RIGHT COLUMN MIDDLE: CASH REGISTER, LAPTOP, BOTTLES ==================== */}
      {/* Classic POS Cash Register with Receipt Roll */}
      <g transform="translate(862, 168)">
        {/* Customer Display Flag */}
        <rect className="la-stroke" x="64" y="4" width="32" height="18" rx="3" />
        <line className="la-line" x1="80" y1="22" x2="80" y2="38" />
        {/* Receipt Paper Roll */}
        <path className="la-stroke" d="M28 24 C28 16 48 16 48 24 V42 H28 Z" />
        <path className="la-thin" d="M33 26 H43 M33 32 H43" />
        {/* Register Body */}
        <path className="la-stroke" d="M16 38 H96 L108 78 H8 Z" />
        {/* Keypad Keys */}
        <rect className="la-thin" x="52" y="46" width="40" height="24" rx="2" />
        <path className="la-thin" d="M52 54 H92 M52 62 H92 M65 46 V70 M78 46 V70" />
        {/* Cash Drawer Base */}
        <rect className="la-stroke" x="4" y="78" width="108" height="26" rx="4" />
        <rect className="la-thin" x="12" y="84" width="92" height="14" rx="2" />
        <circle className="la-line" cx="58" cy="91" r="3" />
      </g>

      {/* Right Middle Open Laptop */}
      <g transform="translate(998, 178)">
        <rect className="la-stroke" x="18" y="6" width="112" height="72" rx="5" />
        <rect className="la-thin" x="24" y="12" width="100" height="60" rx="2" />
        <polygon className="la-stroke" points="18,78 130,78 146,110 2,110" />
        <path className="la-thin" d="M20 85 H128 M15 92 H133 M10 99 H138" />
        <rect className="la-thin" x="62" y="101" width="24" height="6" rx="1" />
      </g>

      {/* Cold Drink Cup & Two Bottles Right Middle */}
      <g transform="translate(912, 314)">
        <path className="la-stroke" d="M12 36 H58 L48 108 H22 Z" />
        <path className="la-line" d="M8 36 H62" />
        <path className="la-line" d="M35 36 L44 8" />
        <circle className="la-thin" cx="26" cy="28" r="4" />
        <circle className="la-thin" cx="38" cy="26" r="5" />
        <circle className="la-thin" cx="48" cy="30" r="4" />
      </g>

      {/* Bottles */}
      <g transform="translate(982, 304)">
        <path className="la-stroke" d="M12 4 H22 V24 L30 40 V106 H4 V40 L12 24 Z" />
        <rect className="la-thin" x="6" y="54" width="22" height="28" />
        <path className="la-stroke" d="M46 8 H56 V28 L64 44 V106 H38 V44 L46 28 Z" />
        <rect className="la-thin" x="40" y="56" width="22" height="26" />
      </g>

      {/* Shopping Bag Right Middle */}
      <g transform="translate(1062, 318)">
        <polygon className="la-stroke" points="8,28 68,28 74,104 4,104" />
        <polygon className="la-stroke" points="68,28 82,20 88,94 74,104" />
        <path className="la-line" d="M24 28 C24 8 52 8 52 28" />
      </g>

      {/* ==================== BOTTOM LEFT: MILK JUG, GROCERY BAG, T-SHIRT, SNEAKER, BOX ==================== */}
      {/* Milk / Liquid Jug */}
      <g transform="translate(68, 392)">
        <rect className="la-stroke" x="22" y="4" width="18" height="10" rx="2" />
        <path
          className="la-stroke"
          d="M16 14 H46 L58 42 V108 C58 114 52 118 46 118 H14 C8 118 4 114 4 108 V42 Z"
        />
        <path className="la-thin" d="M38 36 H50 V66 H38 Z" />
        <path className="la-thin" d="M12 64 H32 V96 H12 Z" />
      </g>

      {/* Grocery Bag with Bread & Produce */}
      <g transform="translate(138, 412)">
        <rect className="la-stroke" x="8" y="34" width="66" height="78" rx="3" />
        <path className="la-line" d="M16 34 C14 14 28 14 30 34" />
        <path className="la-line" d="M34 34 C36 10 52 12 50 34" />
        <path className="la-line" d="M50 34 C54 18 68 20 64 34" />
      </g>

      {/* Open Cardboard Delivery Box */}
      <g transform="translate(262, 468)">
        <polygon className="la-stroke" points="28,28 78,18 104,42 54,54" />
        <polygon className="la-stroke" points="28,28 54,54 54,104 28,78" />
        <polygon className="la-stroke" points="54,54 104,42 104,92 54,104" />
        {/* Open Flaps */}
        <polygon className="la-stroke" points="28,28 54,54 36,72 10,44" />
        <polygon className="la-stroke" points="54,54 104,42 118,58 68,70" />
        <polygon className="la-stroke" points="28,28 78,18 66,4 16,14" />
      </g>

      {/* Bottom Left T-Shirt */}
      <g transform="translate(36, 524)">
        <path
          className="la-stroke"
          d="M36 12 C48 20 68 20 80 12 L114 30 L98 58 L82 48 V134 H34 V48 L18 58 L2 30 Z"
        />
        <path className="la-thin" d="M36 12 C48 26 68 26 80 12" />
        <path className="la-thin" d="M34 126 H82" />
      </g>

      {/* Large Detailed Sneaker Bottom Left */}
      <g transform="translate(88, 636) rotate(-8)">
        <path
          className="la-stroke"
          d="M12 56 C10 34 24 14 40 10 L64 28 C84 36 112 42 136 46 C148 48 154 56 150 66 L10 66 Z"
        />
        <path
          className="la-stroke"
          d="M6 66 H152 C154 74 148 80 138 80 H16 C8 80 4 74 6 66 Z"
        />
        <path className="la-thin" d="M56 22 L68 16 M66 28 L78 22 M76 34 L88 28 M86 38 L98 32" />
        <path className="la-thin" d="M24 46 C48 48 76 56 112 64" />
      </g>

      {/* Bottle with CAFFEN label */}
      <g transform="translate(354, 572)">
        <path className="la-stroke" d="M16 4 H28 V32 L38 54 V142 C38 148 32 152 22 152 C12 152 6 148 6 142 V54 L16 32 Z" />
        <rect className="la-thin" x="8" y="76" width="28" height="44" rx="2" />
        <text x="10" y="102" className="la-text" fontSize="7">
          CAFFEN
        </text>
      </g>

      {/* Bottom Barcode & Cart */}
      <g transform="translate(794, 646)">
        <path
          stroke="rgba(255,255,255,0.82)"
          strokeLinecap="butt"
          d="M4 4 V48 M9 4 V48 M16 4 V48 M22 4 V48 M27 4 V48 M35 4 V48 M42 4 V48 M48 4 V48 M54 4 V48 M62 4 V48 M68 4 V48"
          strokeWidth="2.4"
        />
        <text x="4" y="60" className="la-text" fontSize="9">
          89 233855
        </text>
      </g>

      {/* ==================== BOTTOM RIGHT: POS REGISTER, PLATES, HEADPHONES, SHOPPING CART ==================== */}
      {/* Plate & Sneaker Right Lower */}
      <g transform="translate(800, 404) rotate(8)">
        <path
          className="la-stroke"
          d="M8 38 C8 24 18 12 28 10 L44 22 C58 28 76 32 90 34 C98 35 102 40 100 46 L6 46 Z"
        />
        <path className="la-stroke" d="M4 46 H102 C104 52 100 56 92 56 H10 C4 56 2 52 4 46 Z" />
      </g>

      <g transform="translate(828, 476)">
        <circle className="la-stroke" cx="46" cy="46" r="42" />
        <circle className="la-line" cx="46" cy="46" r="28" />
      </g>

      {/* POS Cash Register Bottom Right */}
      <g transform="translate(878, 560)">
        <rect className="la-stroke" x="62" y="4" width="32" height="16" rx="2" />
        <line className="la-line" x1="78" y1="20" x2="78" y2="34" />
        <path className="la-stroke" d="M26 20 C26 12 46 12 46 20 V36 H26 Z" />
        <path className="la-stroke" d="M14 34 H96 L108 74 H6 Z" />
        <rect className="la-thin" x="48" y="42" width="44" height="24" rx="2" />
        <path className="la-thin" d="M48 50 H92 M48 58 H92 M62 42 V66 M76 42 V66" />
        <rect className="la-stroke" x="4" y="74" width="108" height="24" rx="3" />
        <circle className="la-line" cx="58" cy="86" r="3" />
      </g>

      {/* Smartphone & Headphones Bottom Right */}
      <g transform="translate(1002, 594)">
        <rect className="la-stroke" x="4" y="6" width="42" height="78" rx="6" />
        <rect className="la-thin" x="8" y="14" width="34" height="58" rx="2" />
        <circle className="la-thin" cx="25" cy="78" r="2.5" />
      </g>

      <g transform="translate(1058, 578) rotate(-8)">
        <path className="la-line" d="M14 52 C10 18 28 6 46 6 C64 6 82 18 78 52" strokeWidth="2.8" />
        <ellipse className="la-stroke" cx="18" cy="56" rx="9" ry="15" />
        <ellipse className="la-stroke" cx="74" cy="56" rx="9" ry="15" />
      </g>

      {/* Another POS Register Far Right Middle-Low */}
      <g transform="translate(1092, 412)">
        <rect className="la-stroke" x="48" y="4" width="28" height="14" rx="2" />
        <line className="la-line" x1="62" y1="18" x2="62" y2="30" />
        <path className="la-stroke" d="M12 30 H84 L96 66 H4 Z" />
        <rect className="la-thin" x="40" y="36" width="38" height="22" rx="2" />
        <path className="la-thin" d="M40 44 H78 M40 52 H78 M52 36 V58 M65 36 V58" />
        <rect className="la-stroke" x="2" y="66" width="96" height="22" rx="3" />
      </g>

      {/* Bottom Shopping Cart & Plate */}
      <g transform="translate(814, 704)">
        <path className="la-line" d="M4 6 H16 L26 62 H86 L96 20 H20" />
        <path className="la-thin" d="M22 34 H92 M24 48 H89" />
        <path className="la-thin" d="M38 20 V62 M54 20 V62 M70 20 V62" />
        <circle className="la-stroke" cx="32" cy="74" r="6" />
        <circle className="la-stroke" cx="78" cy="74" r="6" />
      </g>

      <g transform="translate(932, 712)">
        <circle className="la-stroke" cx="42" cy="42" r="36" />
        <circle className="la-line" cx="42" cy="42" r="24" />
      </g>

      <g transform="translate(1114, 690)">
        <polygon className="la-stroke" points="8,24 64,24 70,92 4,92" />
        <path className="la-line" d="M22 24 C22 6 48 6 48 24" />
      </g>
    </svg>
  );
}

export const AuthGlassShell: React.FC<AuthGlassShellProps> = ({
  locale,
  onLocaleChange,
  title,
  children,
}) => {
  const isRtl = locale === "ar";

  return (
    <div
      dir="ltr"
      className="min-h-screen w-full flex items-center justify-center bg-[#040405] p-3 sm:p-5 font-sans relative overflow-hidden select-none"
    >
      {/* Keyframes for Continuous Slow Spatial Parallax Drift */}
      <style>{`
        @keyframes kaspiDriftPrimary {
          0% {
            transform: translate3d(0px, 0px, 0) scale(1.03);
          }
          50% {
            transform: translate3d(-18px, -14px, 0) scale(1.05);
          }
          100% {
            transform: translate3d(0px, 0px, 0) scale(1.03);
          }
        }
        @keyframes kaspiDriftSecondary {
          0% {
            transform: translate3d(0px, 0px, 0);
          }
          50% {
            transform: translate3d(14px, -10px, 0);
          }
          100% {
            transform: translate3d(0px, 0px, 0);
          }
        }
        .kaspi-bg-drift {
          animation: kaspiDriftPrimary 26s ease-in-out infinite;
          will-change: transform;
        }
        .kaspi-card-float {
          animation: kaspiDriftSecondary 18s ease-in-out infinite;
        }
      `}</style>

      {/* Animated Monochrome 3D Line-Art Vector Background Layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-85">
        <div className="kaspi-bg-drift w-full h-full">
          <RetailLineArtTile idPrefix="kaspi-auth" />
        </div>
      </div>

      {/* Subtle Radial Vignette Framing the Central Glass Card */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(5,5,7,0.55) 0%, rgba(4,4,5,0.22) 48%, rgba(3,3,4,0.62) 100%)",
        }}
      />

      {/* Ambient White Backlight Behind the Frosted Glass Card */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-white/[0.045] blur-[90px]" />

      {/* Central Apple / Linear-Grade Glassmorphic Authentication Card */}
      <div className="relative z-10 w-full max-w-[430px] mx-auto backdrop-blur-2xl bg-zinc-950/80 border border-white/15 rounded-[32px] px-6 py-6 sm:px-8 sm:py-7 shadow-[0_28px_90px_rgba(0,0,0,0.95),0_0_45px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all">
        {/* Top Ambient Edge Highlight */}
        <div className="pointer-events-none absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Independent Pill-Shaped Language Switcher (AR | FR | EN) at Top Right */}
        <div
          dir="ltr"
          className="absolute top-5 right-5 sm:top-6 sm:right-6 z-20 inline-flex items-center bg-white/[0.06] border border-white/15 rounded-full px-2.5 py-1 text-[11px] font-mono tracking-wider text-zinc-400 backdrop-blur-md shadow-inner"
        >
          {(["ar", "fr", "en"] as AuthLocale[]).map((lang, idx) => {
            const active = locale === lang;
            return (
              <React.Fragment key={lang}>
                {idx > 0 && <span className="mx-1.5 text-white/20 select-none">|</span>}
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onLocaleChange(lang);
                  }}
                  className={`uppercase transition-all cursor-pointer ${
                    active
                      ? "text-white font-extrabold drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                      : "text-zinc-400 hover:text-zinc-200 font-medium"
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Brand Identity Header: Frameless Standalone KASPI POS Logo */}
        <div className="text-center mb-4">
          <div className="relative mx-auto mb-2.5 flex items-center justify-center p-0 bg-transparent border-0 shadow-none">
            <img
              src="/logo.png"
              alt="KASPI POS"
              className="w-16 h-16 object-contain drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)] select-none"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <div
            dir="ltr"
            className="text-[11px] tracking-[0.18em] uppercase text-zinc-300 font-semibold"
          >
            <span className="font-extrabold text-white">KASPI</span>{" "}
            <span className="text-zinc-400 font-medium">POS</span>
          </div>
          <h1 className="text-2xl sm:text-[26px] font-extrabold text-white tracking-tight mt-2">
            {title}
          </h1>
        </div>

        {children}
      </div>
    </div>
  );
};

export default AuthGlassShell;
