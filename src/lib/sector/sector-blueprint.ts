/**
 * KASPI POS — 10-PAGE CHAMELEON SECTOR BLUEPRINT & NEUROMARKETING COLOR ENGINE
 * Provides strongly-typed psychological color palettes, operational capabilities,
 * KPI labels, table columns, filter tabs, and hardware configs across all 10 pages.
 */

import { StoreBusinessType } from "@/client/store/usePosStore";
import { usePosStore } from "@/client/store/usePosStore";
import { useParams } from "next/navigation";

export interface SectorPalette {
  name: string;
  canvas: string;
  surface: string;
  border: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  textAccent: string;
  softAccent: string;
  badgeClass: string;
  buttonClass: string;
  glowClass: string;
}

export interface SectorBlueprint {
  id: StoreBusinessType;
  iconName: string;
  labels: { ar: string; fr: string; en: string };
  subtitles: { ar: string; fr: string; en: string };
  palette: SectorPalette;
  features: {
    hasPluProduce: boolean;
    hasPackCartonPrice: boolean;
    hasDlcExpiry: boolean;
    hasAisles: boolean;
    hasConsigneGasCrates: boolean;
    hasScaleBarcode: boolean;
    hasKdsKitchen: boolean;
    hasTablesDineIn: boolean;
    hasVariantsSizesColors: boolean;
    hasImeiSerial: boolean;
    hasWholesaleTiers: boolean;
  };
  pos: {
    quickUtilityBar: boolean;
    showPackToggle: boolean;
    showConsigneBar: boolean;
    scannerEnterMode: boolean;
  };
  dashboard: {
    kpis: Array<{
      id: string;
      title: { ar: string; fr: string; en: string };
      sub: { ar: string; fr: string; en: string };
      icon: string;
    }>;
  };
  inventoryTabs: Array<{
    id: string;
    label: { ar: string; fr: string; en: string };
    icon: string;
  }>;
}

export const SECTOR_PALETTES: Record<StoreBusinessType, SectorPalette> = {
  grocery: {
    name: "Nordic Glacier Slate & Cool Mineral Teal",
    canvas: "#070B0E",
    surface: "#0D1419",
    border: "#1A2830",
    primary: "#14B8A6", // teal-500
    primaryHover: "#2DD4BF", // teal-400
    secondary: "#38BDF8", // sky-400
    textAccent: "#2DD4BF",
    softAccent: "rgba(20, 184, 166, 0.12)",
    badgeClass: "bg-teal-500/10 text-teal-400 border border-teal-500/30",
    buttonClass: "bg-teal-400 hover:bg-teal-300 text-zinc-950 font-black",
    glowClass: "shadow-[0_0_24px_rgba(45,212,191,0.22)]",
  },
  restaurant: {
    name: "Midnight Fjord & Arctic Ice Blue",
    canvas: "#080C14",
    surface: "#0F1622",
    border: "#1E293B",
    primary: "#0EA5E9", // sky-500
    primaryHover: "#38BDF8", // sky-400
    secondary: "#38BDF8",
    textAccent: "#38BDF8",
    softAccent: "rgba(14, 165, 233, 0.12)",
    badgeClass: "bg-sky-500/10 text-sky-400 border border-sky-500/30",
    buttonClass: "bg-sky-400 hover:bg-sky-300 text-zinc-950 font-black",
    glowClass: "shadow-[0_0_24px_rgba(56,189,248,0.22)]",
  },
  bakery: {
    name: "Midnight Fjord & Warm Amber Crust",
    canvas: "#080C14",
    surface: "#0F1622",
    border: "#1E293B",
    primary: "#0EA5E9",
    primaryHover: "#38BDF8",
    secondary: "#F59E0B",
    textAccent: "#38BDF8",
    softAccent: "rgba(14, 165, 233, 0.12)",
    badgeClass: "bg-sky-500/10 text-sky-400 border border-sky-500/30",
    buttonClass: "bg-sky-400 hover:bg-sky-300 text-zinc-950 font-black",
    glowClass: "shadow-[0_0_24px_rgba(56,189,248,0.22)]",
  },
  fashion: {
    name: "Obsidian Velvet & Arctic Periwinkle Indigo",
    canvas: "#090A12",
    surface: "#11131F",
    border: "#23273E",
    primary: "#6366F1", // indigo-500
    primaryHover: "#818CF8", // indigo-400
    secondary: "#818CF8",
    textAccent: "#818CF8",
    softAccent: "rgba(99, 102, 241, 0.12)",
    badgeClass: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30",
    buttonClass: "bg-indigo-400 hover:bg-indigo-300 text-zinc-950 font-black",
    glowClass: "shadow-[0_0_24px_rgba(129,140,248,0.22)]",
  },
  butchery: {
    name: "Titanium Slate & Frosted Emerald LCD",
    canvas: "#080D0B",
    surface: "#0E1612",
    border: "#1A2C22",
    primary: "#10B981", // emerald-500
    primaryHover: "#34D399", // emerald-400
    secondary: "#34D399",
    textAccent: "#34D399",
    softAccent: "rgba(16, 185, 129, 0.12)",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    buttonClass: "bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black",
    glowClass: "shadow-[0_0_24px_rgba(52,211,153,0.22)]",
  },
  tech: {
    name: "Deep Cyber Slate & Electric Ice Cyan",
    canvas: "#070C12",
    surface: "#0D1520",
    border: "#18273A",
    primary: "#06B6D4", // cyan-500
    primaryHover: "#22D3EE", // cyan-400
    secondary: "#22D3EE",
    textAccent: "#22D3EE",
    softAccent: "rgba(6, 182, 212, 0.12)",
    badgeClass: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
    buttonClass: "bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-black",
    glowClass: "shadow-[0_0_24px_rgba(34,211,238,0.22)]",
  },
  electronics: {
    name: "Deep Cyber Slate & Electric Ice Cyan",
    canvas: "#070C12",
    surface: "#0D1520",
    border: "#18273A",
    primary: "#06B6D4",
    primaryHover: "#22D3EE",
    secondary: "#22D3EE",
    textAccent: "#22D3EE",
    softAccent: "rgba(6, 182, 212, 0.12)",
    badgeClass: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
    buttonClass: "bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-black",
    glowClass: "shadow-[0_0_24px_rgba(34,211,238,0.22)]",
  },
  wholesale: {
    name: "Deep Steel Slate & Cool Baltic Azure",
    canvas: "#080B12",
    surface: "#0F1420",
    border: "#1C253B",
    primary: "#3B82F6", // blue-500
    primaryHover: "#60A5FA", // blue-400
    secondary: "#60A5FA",
    textAccent: "#60A5FA",
    softAccent: "rgba(59, 130, 246, 0.12)",
    badgeClass: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
    buttonClass: "bg-blue-400 hover:bg-blue-300 text-zinc-950 font-black",
    glowClass: "shadow-[0_0_24px_rgba(96,165,250,0.22)]",
  },
};

export const SECTOR_BLUEPRINTS: Record<StoreBusinessType, SectorBlueprint> = {
  grocery: {
    id: "grocery",
    iconName: "ShoppingBasket",
    labels: {
      ar: "سوبرماركت وميني ماركت وبقالة",
      fr: "Supermarché & Épicerie",
      en: "Supermarket & Grocery OS",
    },
    subtitles: {
      ar: "نظام كاشير فائق السرعة، أوزان PLU، مراقبة انتهاء الصلاحية DLC ورهن القنينات",
      fr: "Caisse haute vélocité, codes PLU, suivi des DLC et consignes bouteilles",
      en: "High-velocity retail, PLU scale produce, DLC expiry radar & returnable deposits",
    },
    palette: SECTOR_PALETTES.grocery,
    features: {
      hasPluProduce: true,
      hasPackCartonPrice: true,
      hasDlcExpiry: true,
      hasAisles: true,
      hasConsigneGasCrates: true,
      hasScaleBarcode: true,
      hasKdsKitchen: false,
      hasTablesDineIn: false,
      hasVariantsSizesColors: false,
      hasImeiSerial: false,
      hasWholesaleTiers: true,
    },
    pos: {
      quickUtilityBar: true,
      showPackToggle: true,
      showConsigneBar: true,
      scannerEnterMode: true,
    },
    dashboard: {
      kpis: [
        {
          id: "daily_sales",
          title: {
            ar: "مبيعات الصندوق اليومية",
            fr: "Chiffre d'Affaires Caisse",
            en: "Daily Register Sales",
          },
          sub: {
            ar: "متوسط سلة المشتريات",
            fr: "Panier Moyen",
            en: "Average Basket",
          },
          icon: "DollarSign",
        },
        {
          id: "fmcg_velocity",
          title: {
            ar: "حركة السلع الممسوحة",
            fr: "Articles Scannés & Rotation",
            en: "Scanned Items & Velocity",
          },
          sub: {
            ar: "السلع الأكثر استهلاكاً اليوم",
            fr: "Produits à forte rotation",
            en: "High-rotation FMCG",
          },
          icon: "Barcode",
        },
        {
          id: "dlc_alerts",
          title: {
            ar: "تنبيهات الصلاحية DLC ونفاد الرفوف",
            fr: "Alertes Péremption (DLC) & Rupture",
            en: "DLC Expiry & Shelf Alerts",
          },
          sub: {
            ar: "مواد قريبة الانتهاء / نفدت",
            fr: "Articles à brader ou réapprovisionner",
            en: "Items near expiry / low stock",
          },
          icon: "AlertTriangle",
        },
        {
          id: "household_credit",
          title: {
            ar: "ديون كناش العائلات ونقاط الولاء",
            fr: "Encours Carnet Ménages & Fidélité",
            en: "Household Credit & Loyalty",
          },
          sub: {
            ar: "مستحقات الزبائن الجارية",
            fr: "Solde crédits à recouvrer",
            en: "Pending household balance",
          },
          icon: "Users",
        },
      ],
    },
    inventoryTabs: [
      {
        id: "shelf_stock",
        label: {
          ar: "مخزون الرفوف والمستودع",
          fr: "Stock Rayons & Réserve",
          en: "Shelf & Warehouse Stock",
        },
        icon: "Layers",
      },
      {
        id: "dlc_radar",
        label: {
          ar: "مراقبة تواريخ الصلاحية DLC والتصفية",
          fr: "Suivi Péremptions (DLC) & Déstockage",
          en: "DLC Expiration & Markdown Radar",
        },
        icon: "Clock",
      },
      {
        id: "shrinkage_consigne",
        label: {
          ar: "سجل التالف ورصيد القنينات والصناديق",
          fr: "Casse, Démarque & Consignes",
          en: "Shrinkage & Consigne Audit",
        },
        icon: "Trash2",
      },
    ],
  },
  restaurant: {
    id: "restaurant",
    iconName: "UtensilsCrossed",
    labels: {
      ar: "مطعم ومقهى ووجبات سريعة",
      fr: "Restaurant & Café",
      en: "Restaurant & Hospitality OS",
    },
    subtitles: {
      ar: "شاشات المطبخ KDS، إدارة الطاولات، وتقسيم الحساب الفوري",
      fr: "Écrans cuisine KDS, plan de salle et division de notes",
      en: "Kitchen Display System, table layouts, and instant bill splitting",
    },
    palette: SECTOR_PALETTES.restaurant,
    features: {
      hasPluProduce: false,
      hasPackCartonPrice: false,
      hasDlcExpiry: false,
      hasAisles: false,
      hasConsigneGasCrates: false,
      hasScaleBarcode: false,
      hasKdsKitchen: true,
      hasTablesDineIn: true,
      hasVariantsSizesColors: false,
      hasImeiSerial: false,
      hasWholesaleTiers: false,
    },
    pos: {
      quickUtilityBar: false,
      showPackToggle: false,
      showConsigneBar: false,
      scannerEnterMode: false,
    },
    dashboard: {
      kpis: [
        {
          id: "daily_sales",
          title: { ar: "مبيعات الصالة والطلبات", fr: "CA Service & Emporté", en: "Dining & Takeout Sales" },
          sub: { ar: "إجمالي اليوم", fr: "Total journalier", en: "Today's revenue" },
          icon: "DollarSign",
        },
        {
          id: "table_turnover",
          title: { ar: "إشغال الطاولات وسرعة الخدمة", fr: "Occupation Tables & Rotation", en: "Table Turnover & Pace" },
          sub: { ar: "متوسط وقت الطلب", fr: "Temps moyen commande", en: "Avg preparation time" },
          icon: "Clock",
        },
        {
          id: "open_orders",
          title: { ar: "الطلبات النشطة في المطبخ", fr: "Commandes Actives Cuisine", en: "Active Kitchen Tickets" },
          sub: { ar: "تنتظر التحضير والتسليم", fr: "En cours de préparation", en: "Being prepared" },
          icon: "Layers",
        },
        {
          id: "waiter_tips",
          title: { ar: "مردودية النوادل والإكراميات", fr: "Performance Serveurs & Pourboires", en: "Staff Performance & Tips" },
          sub: { ar: "توزيع الخدمة", fr: "Répartition service", en: "Shift distribution" },
          icon: "Users",
        },
      ],
    },
    inventoryTabs: [
      { id: "shelf_stock", label: { ar: "مخزون المكونات والتموين", fr: "Ingrédients & Approvisionnement", en: "Raw Ingredients" }, icon: "Layers" },
    ],
  },
  bakery: {
    id: "bakery",
    iconName: "Croissant",
    labels: { ar: "مخبزة وحلويات عصرية", fr: "Boulangerie & Pâtisserie", en: "Bakery & Pastry OS" },
    subtitles: { ar: "ورديات الخبز الساخن، وصفات المكونات وطلبات المناسبات", fr: "Fournées, recettes matières premières et commandes spéciales", en: "Baking batches, recipes & custom cake preorders" },
    palette: SECTOR_PALETTES.bakery,
    features: {
      hasPluProduce: false,
      hasPackCartonPrice: true,
      hasDlcExpiry: true,
      hasAisles: false,
      hasConsigneGasCrates: false,
      hasScaleBarcode: false,
      hasKdsKitchen: true,
      hasTablesDineIn: false,
      hasVariantsSizesColors: false,
      hasImeiSerial: false,
      hasWholesaleTiers: true,
    },
    pos: { quickUtilityBar: false, showPackToggle: false, showConsigneBar: false, scannerEnterMode: false },
    dashboard: {
      kpis: [
        { id: "daily_sales", title: { ar: "مبيعات المخبزة اليومية", fr: "Ventes Boulangerie", en: "Daily Bakery Sales" }, sub: { ar: "إجمالي المبيعات", fr: "Total journalier", en: "Total sales" }, icon: "DollarSign" },
      ],
    },
    inventoryTabs: [
      { id: "shelf_stock", label: { ar: "مخزون المواد الأولية", fr: "Matières Premières", en: "Raw Materials" }, icon: "Layers" },
    ],
  },
  fashion: {
    id: "fashion",
    iconName: "Shirt",
    labels: { ar: "أزياء وملابس وأحذية", fr: "Boutique Mode & Prêt-à-Porter", en: "Fashion & Footwear OS" },
    subtitles: { ar: "مصفوفة القياس واللون (Size/Color)، باركود القطع وإدارة التخفيضات", fr: "Grille tailles/couleurs, code-barres articles et soldes", en: "Matrix variants, garment tag barcodes & seasonal markdowns" },
    palette: SECTOR_PALETTES.fashion,
    features: {
      hasPluProduce: false,
      hasPackCartonPrice: false,
      hasDlcExpiry: false,
      hasAisles: true,
      hasConsigneGasCrates: false,
      hasScaleBarcode: false,
      hasKdsKitchen: false,
      hasTablesDineIn: false,
      hasVariantsSizesColors: true,
      hasImeiSerial: false,
      hasWholesaleTiers: false,
    },
    pos: { quickUtilityBar: false, showPackToggle: false, showConsigneBar: false, scannerEnterMode: true },
    dashboard: {
      kpis: [
        { id: "daily_sales", title: { ar: "مبيعات المتجر اليومية", fr: "Chiffre d'Affaires Boutique", en: "Boutique Daily Sales" }, sub: { ar: "قطع مباعة", fr: "Pièces vendues", en: "Units sold" }, icon: "DollarSign" },
      ],
    },
    inventoryTabs: [
      { id: "shelf_stock", label: { ar: "مخزون المقاسات والألوان", fr: "Stock Tailles & Couleurs", en: "Size & Color Matrix" }, icon: "Layers" },
    ],
  },
  butchery: {
    id: "butchery",
    iconName: "Beef",
    labels: { ar: "مجزرة ومحلات اللحوم", fr: "Boucherie & Viandes", en: "Butchery & Fresh Meats" },
    subtitles: { ar: "ربط الميزان الإلكتروني، قراءة باركود الوزن والسعر وإدارة الدواجن واللحوم", fr: "Balance connectée, lecture codes-barres poids/prix et découpe", en: "Scale integration, weight/price embedded barcodes & cuts" },
    palette: SECTOR_PALETTES.butchery,
    features: {
      hasPluProduce: true,
      hasPackCartonPrice: false,
      hasDlcExpiry: true,
      hasAisles: false,
      hasConsigneGasCrates: false,
      hasScaleBarcode: true,
      hasKdsKitchen: false,
      hasTablesDineIn: false,
      hasVariantsSizesColors: false,
      hasImeiSerial: false,
      hasWholesaleTiers: true,
    },
    pos: { quickUtilityBar: true, showPackToggle: false, showConsigneBar: false, scannerEnterMode: true },
    dashboard: {
      kpis: [
        { id: "daily_sales", title: { ar: "مبيعات المجزرة اليومية", fr: "Ventes Boucherie", en: "Daily Butchery Sales" }, sub: { ar: "الكيلوغرامات المباعة", fr: "Poids total vendu (kg)", en: "Total kg sold" }, icon: "DollarSign" },
      ],
    },
    inventoryTabs: [
      { id: "shelf_stock", label: { ar: "مخزون الذبائح واللحوم", fr: "Stock Carcasses & Découpes", en: "Meat Stock & Carcasses" }, icon: "Layers" },
    ],
  },
  tech: {
    id: "tech",
    iconName: "Smartphone",
    labels: { ar: "إلكترونيات وهواتف ذكية", fr: "High-Tech & Smartphones", en: "Tech & Mobile OS" },
    subtitles: { ar: "تتبع أرقام IMEI والسيريال، بطاقات الضمان وخدمات الإصلاح والصيانة", fr: "Traçabilité IMEI & numéros de série, garanties et SAV", en: "IMEI / Serial tracking, warranty cards & repairs" },
    palette: SECTOR_PALETTES.tech,
    features: {
      hasPluProduce: false,
      hasPackCartonPrice: false,
      hasDlcExpiry: false,
      hasAisles: true,
      hasConsigneGasCrates: false,
      hasScaleBarcode: false,
      hasKdsKitchen: false,
      hasTablesDineIn: false,
      hasVariantsSizesColors: false,
      hasImeiSerial: true,
      hasWholesaleTiers: true,
    },
    pos: { quickUtilityBar: false, showPackToggle: false, showConsigneBar: false, scannerEnterMode: true },
    dashboard: {
      kpis: [
        { id: "daily_sales", title: { ar: "مبيعات الأجهزة والملحقات", fr: "Ventes Appareils & Accessoires", en: "Devices & Accessories Sales" }, sub: { ar: "إجمالي اليوم", fr: "Total du jour", en: "Today's revenue" }, icon: "DollarSign" },
      ],
    },
    inventoryTabs: [
      { id: "shelf_stock", label: { ar: "مخزون السيريال و IMEI", fr: "Stock Sérialisé & IMEI", en: "Serialized Stock" }, icon: "Layers" },
    ],
  },
  electronics: {
    id: "electronics",
    iconName: "Smartphone",
    labels: { ar: "إلكترونيات وهواتف ذكية", fr: "High-Tech & Smartphones", en: "Tech & Mobile OS" },
    subtitles: { ar: "تتبع أرقام IMEI والسيريال، بطاقات الضمان وخدمات الإصلاح والصيانة", fr: "Traçabilité IMEI & numéros de série, garanties et SAV", en: "IMEI / Serial tracking, warranty cards & repairs" },
    palette: SECTOR_PALETTES.electronics,
    features: {
      hasPluProduce: false,
      hasPackCartonPrice: false,
      hasDlcExpiry: false,
      hasAisles: true,
      hasConsigneGasCrates: false,
      hasScaleBarcode: false,
      hasKdsKitchen: false,
      hasTablesDineIn: false,
      hasVariantsSizesColors: false,
      hasImeiSerial: true,
      hasWholesaleTiers: true,
    },
    pos: { quickUtilityBar: false, showPackToggle: false, showConsigneBar: false, scannerEnterMode: true },
    dashboard: {
      kpis: [
        { id: "daily_sales", title: { ar: "مبيعات الأجهزة والملحقات", fr: "Ventes Appareils & Accessoires", en: "Devices & Accessories Sales" }, sub: { ar: "إجمالي اليوم", fr: "Total du jour", en: "Today's revenue" }, icon: "DollarSign" },
      ],
    },
    inventoryTabs: [
      { id: "shelf_stock", label: { ar: "مخزون السيريال و IMEI", fr: "Stock Sérialisé & IMEI", en: "Serialized Stock" }, icon: "Layers" },
    ],
  },
  wholesale: {
    id: "wholesale",
    iconName: "Boxes",
    labels: { ar: "تجارة الجملة والتوزيع", fr: "Commerce de Gros & Distribution", en: "Wholesale & Distribution B2B" },
    subtitles: { ar: "أسعار الجملة ونصف الجملة، شيكات وكمبيالات، فواتير وتوصيل", fr: "Prix de gros/demi-gros, effets bancaires, facturation et livraison", en: "Multi-tier pricing, post-dated cheques, invoicing & delivery" },
    palette: SECTOR_PALETTES.wholesale,
    features: {
      hasPluProduce: false,
      hasPackCartonPrice: true,
      hasDlcExpiry: true,
      hasAisles: true,
      hasConsigneGasCrates: false,
      hasScaleBarcode: false,
      hasKdsKitchen: false,
      hasTablesDineIn: false,
      hasVariantsSizesColors: false,
      hasImeiSerial: false,
      hasWholesaleTiers: true,
    },
    pos: { quickUtilityBar: false, showPackToggle: true, showConsigneBar: false, scannerEnterMode: true },
    dashboard: {
      kpis: [
        { id: "daily_sales", title: { ar: "مبيعات الجملة والطلبيات", fr: "Chiffre d'Affaires Gros", en: "Wholesale Revenue" }, sub: { ar: "طلبيات الموزعين", fr: "Commandes clients B2B", en: "B2B client orders" }, icon: "DollarSign" },
      ],
    },
    inventoryTabs: [
      { id: "shelf_stock", label: { ar: "مخزون المستودعات والكراتين", fr: "Stock Entrepôt & Cartons", en: "Bulk & Pallet Stock" }, icon: "Layers" },
    ],
  },
};

/**
 * Returns CSS variables map for the root layout to dynamically skin the UI
 */
export function getSectorCssVariables(storeType: StoreBusinessType = "grocery"): React.CSSProperties {
  const palette = SECTOR_PALETTES[storeType] || SECTOR_PALETTES.grocery;
  return {
    ["--sector-bg-canvas" as any]: palette.canvas,
    ["--sector-bg-surface" as any]: palette.surface,
    ["--sector-border" as any]: palette.border,
    ["--sector-accent" as any]: palette.primary,
    ["--sector-accent-hover" as any]: palette.primaryHover,
    ["--sector-accent-secondary" as any]: palette.secondary,
    ["--sector-accent-text" as any]: palette.textAccent,
    ["--sector-accent-soft" as any]: palette.softAccent,
  };
}

/**
 * React hook to access active sector blueprint and localized metadata
 */
export function useSectorBlueprint(overrideType?: StoreBusinessType) {
  const store = usePosStore();
  const params = useParams();
  const locale = ((params?.locale as string) || "ar") as "ar" | "fr" | "en";
  const activeType: StoreBusinessType = overrideType || store.storeType || "grocery";
  const blueprint = SECTOR_BLUEPRINTS[activeType] || SECTOR_BLUEPRINTS.grocery;

  return {
    blueprint,
    palette: blueprint.palette,
    features: blueprint.features,
    label: blueprint.labels[locale] || blueprint.labels.ar,
    subtitle: blueprint.subtitles[locale] || blueprint.subtitles.ar,
    locale,
    cssVariables: getSectorCssVariables(activeType),
    isGrocery: activeType === "grocery",
    isRestaurant: activeType === "restaurant",
    isFashion: activeType === "fashion",
    isButchery: activeType === "butchery",
    isTech: activeType === "tech" || activeType === "electronics",
    isWholesale: activeType === "wholesale",
  };
}
