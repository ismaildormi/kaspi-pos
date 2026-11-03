"use client";

import React, { useState } from "react";
import {
  Barcode,
  ShoppingBag,
  CreditCard,
  Banknote,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Zap,
  Plus,
  Utensils,
  Shirt,
  ShoppingCart,
  Store,
  MapPin,
  QrCode,
  Printer,
  Copy,
  Check,
} from "lucide-react";

export type VerticalType = "supermarket" | "restaurant" | "clothing" | "grocery";

interface TableInfo {
  id: string;
  name: string;
  status: "occupied" | "free";
  zone: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  barcode: string;
  price: number;
  category: string;
  image: string;
}

const RESTAURANT_TABLES: TableInfo[] = [
  { id: "t1", name: "Table 1", status: "occupied", zone: "Salle Principale" },
  { id: "t2", name: "Table 2", status: "free", zone: "Salle Principale" },
  { id: "t3", name: "Table 3", status: "occupied", zone: "Fenêtre VIP" },
  { id: "t4", name: "Terrasse 4", status: "free", zone: "Extérieur" },
  { id: "t5", name: "À Emporter", status: "free", zone: "Comptoir Express" },
];

const VERTICAL_CATALOGS: Record<
  VerticalType,
  {
    label: string;
    icon: any;
    sizes?: string[];
    products: Product[];
  }
> = {
  supermarket: {
    label: "Supermarché",
    icon: ShoppingCart,
    products: [
      {
        id: "sm-1",
        name: "Coca-Cola Original 330ml Can",
        brand: "The Coca-Cola Company",
        barcode: "5449000000996",
        price: 6.5,
        category: "Soda & Boissons",
        image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "sm-2",
        name: "Lay's Classic Salted Potato Chips 175g",
        brand: "Frito-Lay",
        barcode: "8710398602148",
        price: 16.0,
        category: "Snacks & Apéro",
        image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "sm-3",
        name: "Nutella Hazelnut & Cocoa Spread 400g",
        brand: "Ferrero",
        barcode: "8000500179864",
        price: 39.0,
        category: "Tartinables & Petit Déj",
        image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "sm-4",
        name: "Huile de Table Lesieur Pur Tournesol 1L",
        brand: "Lesieur Cristal",
        barcode: "6111003450110",
        price: 19.5,
        category: "Épicerie & Huiles",
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "sm-5",
        name: "Eau Minérale Naturelle Sidi Ali 1.5L",
        brand: "Oulmès",
        barcode: "6111035000121",
        price: 6.0,
        category: "Eaux Minérales",
        image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "sm-6",
        name: "Oreo Original Vanilla Cream Sandwich 154g",
        brand: "Mondelez",
        barcode: "7622210286392",
        price: 12.0,
        category: "Biscuits & Gâteaux",
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "sm-7",
        name: "Red Bull Energy Drink Canette 250ml",
        brand: "Red Bull",
        barcode: "9002490100070",
        price: 22.0,
        category: "Boissons Énergisantes",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "sm-8",
        name: "Nescafé Gold Blend Soluble Coffee 200g",
        brand: "Nestlé",
        barcode: "7613035848520",
        price: 78.0,
        category: "Café & Boissons Chaudes",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "sm-9",
        name: "Pringles Original Potato Crisps 165g",
        brand: "Kellogg's",
        barcode: "5053990101573",
        price: 24.0,
        category: "Snacks Salés",
        image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "sm-10",
        name: "Lait Centrale UHT Demi-Écrémé 1L",
        brand: "Danone Centrale",
        barcode: "6111002000888",
        price: 7.0,
        category: "Produits Laitiers",
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "sm-11",
        name: "Lessive Liquide Ariel Actilift 2L",
        brand: "Procter & Gamble",
        barcode: "5410076402319",
        price: 68.0,
        category: "Entretien Maison",
        image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "sm-12",
        name: "Heineken 0.0 Pure Malt Sans Alcool 33cl",
        brand: "Heineken",
        barcode: "8712000049218",
        price: 18.0,
        category: "Bières 0.0%",
        image: "https://images.unsplash.com/photo-1608270199144-80252b467610?auto=format&fit=crop&q=80&w=400",
      },
    ],
  },
  clothing: {
    label: "Prêt-à-Porter & Chaussures",
    icon: Shirt,
    sizes: ["Taille S", "Taille M", "Taille L", "Taille XL"],
    products: [
      {
        id: "cl-1",
        name: "Nike Air Force 1 '07 Triple White",
        brand: "Nike",
        barcode: "0193145974351",
        price: 1290.0,
        category: "Sneakers",
        image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "cl-2",
        name: "Adidas Originals Trefoil Classic Hoodie",
        brand: "Adidas",
        barcode: "4064044321980",
        price: 750.0,
        category: "Sweats & Hoodies",
        image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "cl-3",
        name: "Zara Slim Fit Poplin Shirt White",
        brand: "Zara Man",
        barcode: "0754532180002",
        price: 390.0,
        category: "Chemises",
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "cl-4",
        name: "Levi's 501 Original Fit Denim Jeans",
        brand: "Levi Strauss",
        barcode: "5400816342890",
        price: 890.0,
        category: "Pantalons Denim",
        image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "cl-5",
        name: "New Balance 550 Vintage White / Green",
        brand: "New Balance",
        barcode: "1959074812301",
        price: 1450.0,
        category: "Sneakers Retro",
        image: "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "cl-6",
        name: "The North Face 1996 Retro Nuptse Puffer",
        brand: "The North Face",
        barcode: "0195438291045",
        price: 2800.0,
        category: "Vestes & Doudounes",
        image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "cl-7",
        name: "Tommy Hilfiger Classic Piqué Cotton Polo",
        brand: "Tommy Hilfiger",
        barcode: "8719853920194",
        price: 690.0,
        category: "Polos & Hauts",
        image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "cl-8",
        name: "Ray-Ban Original Wayfarer Classic Black",
        brand: "Luxottica",
        barcode: "8052891265770",
        price: 1600.0,
        category: "Lunettes & Solaires",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "cl-9",
        name: "Puma Suede Classic XXI Black / White",
        brand: "Puma",
        barcode: "4063697854120",
        price: 790.0,
        category: "Sneakers",
        image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "cl-10",
        name: "Calvin Klein Monogram Minimalist T-Shirt",
        brand: "Calvin Klein",
        barcode: "7613345892014",
        price: 350.0,
        category: "T-Shirts Coton",
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "cl-11",
        name: "Casio G-Shock Rugged Solar Watch",
        brand: "Casio",
        barcode: "4549526219801",
        price: 1100.0,
        category: "Montres & Horlogerie",
        image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "cl-12",
        name: "New Era 9FORTY Yankees Vintage Baseball Cap",
        brand: "New Era",
        barcode: "0194723019842",
        price: 290.0,
        category: "Casquettes & Accessoires",
        image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=400",
      },
    ],
  },
  restaurant: {
    label: "Restaurant & Fast-Food",
    icon: Utensils,
    products: [
      {
        id: "res-1",
        name: "Double Smash Cheeseburger (Style Big Mac)",
        brand: "Gourmet Kitchen",
        barcode: "RES-BUR-01",
        price: 55.0,
        category: "Burgers Gourmet",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "res-2",
        name: "Pizza Margherita Napolitana Cuite au Feu",
        brand: "Forno a Legna",
        barcode: "RES-PIZ-02",
        price: 65.0,
        category: "Pizzas Artisanales",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "res-3",
        name: "French Tacos Mixte Gratiné Sauce Fromagère",
        brand: "Tacos Craft",
        barcode: "RES-TAC-03",
        price: 45.0,
        category: "Tacos & Wraps",
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "res-4",
        name: "Crispy Fried Chicken Wings & Spicy Mayo",
        brand: "Crispy House",
        barcode: "RES-CHI-04",
        price: 48.0,
        category: "Poulet Croustillant",
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "res-5",
        name: "Frites Maison Belges à l'Huile de Truffe",
        brand: "Friterie Royale",
        barcode: "RES-FRI-05",
        price: 25.0,
        category: "Sides & Entrées",
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "res-6",
        name: "Combo Saumon Nigiri & California Maki (16 pcs)",
        brand: "Kyoto Sushi",
        barcode: "RES-SUS-06",
        price: 110.0,
        category: "Sushi & Asiatique",
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "res-7",
        name: "Tagliatelle Carbonara Guanciale & Pecorino",
        brand: "Trattoria",
        barcode: "RES-PAS-07",
        price: 75.0,
        category: "Pâtes Fraîches",
        image: "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "res-8",
        name: "Salade Caesar Poulet Grillé & Copeaux Parmesan",
        brand: "Healthy Fresh",
        barcode: "RES-SAL-08",
        price: 52.0,
        category: "Salades",
        image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "res-9",
        name: "Fondant Chocolat Noir Coulant Cœur Caramel",
        brand: "Pâtisserie Chef",
        barcode: "RES-DES-09",
        price: 32.0,
        category: "Desserts Maison",
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "res-10",
        name: "Double Espresso Pur Arabica Terroir",
        brand: "Roastery Specialty",
        barcode: "RES-CAF-10",
        price: 18.0,
        category: "Caféterie",
        image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "res-11",
        name: "Jus d'Orange Valencia Pressé Minute 400ml",
        brand: "Bio Juice",
        barcode: "RES-JUS-11",
        price: 22.0,
        category: "Jus Naturels",
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "res-12",
        name: "Milkshake Fraise Crème Chantilly Onctueuse",
        brand: "Diner Shake",
        barcode: "RES-MIL-12",
        price: 35.0,
        category: "Boissons Gourmandes",
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=400",
      },
    ],
  },
  grocery: {
    label: "Épicerie de Quartier (Hanout)",
    icon: Store,
    products: [
      {
        id: "gr-1",
        name: "Huile de Table Lesieur 1L",
        brand: "Lesieur Cristal",
        barcode: "6111003450110",
        price: 18.5,
        category: "Huiles & Cuisson",
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "gr-2",
        name: "Eau Minérale Naturelle Sidi Ali 1.5L",
        brand: "Oulmès",
        barcode: "6111035000121",
        price: 6.0,
        category: "Eaux & Boissons",
        image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "gr-3",
        name: "Biscuits Bimo Tagger Chocolat x1",
        brand: "Bimo Kraft",
        barcode: "6111245000456",
        price: 3.0,
        category: "Goûter & Confiserie",
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "gr-4",
        name: "Pain Rond Frais Traditionnel du Jour",
        brand: "Boulangerie Locale",
        barcode: "6111880000100",
        price: 1.5,
        category: "Boulangerie",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "gr-5",
        name: "Thé Vert Sultan Lion Grains Ronds 200g",
        brand: "Sultan",
        barcode: "6111048000192",
        price: 15.0,
        category: "Thé & Infusions",
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "gr-6",
        name: "Sucre Morceaux Traditionnel 1kg",
        brand: "Cosumar",
        barcode: "6111029000154",
        price: 6.0,
        category: "Sucre & Épicerie",
        image: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "gr-7",
        name: "Fromage Fondu La Vache Qui Rit 16 Portions",
        brand: "Bel Maroc",
        barcode: "3073780860124",
        price: 18.0,
        category: "Crèmerie",
        image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "gr-8",
        name: "Café Moulu Samar Torréfaction Italienne 250g",
        brand: "Samar",
        barcode: "6111019000142",
        price: 19.0,
        category: "Café & Petit Déj",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "gr-9",
        name: "Sardines à l'Huile d'Olive Titus 125g",
        brand: "Titus",
        barcode: "6111054000118",
        price: 9.5,
        category: "Conserves de Poisson",
        image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "gr-10",
        name: "Lait Centrale Frais Pasteurisé 500ml",
        brand: "Danone Centrale",
        barcode: "6111002000109",
        price: 3.5,
        category: "Lait & Frais",
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "gr-11",
        name: "Pâtes Spaghetti Tria 500g",
        brand: "Tria",
        barcode: "6111025000120",
        price: 8.5,
        category: "Pâtes & Céréales",
        image: "https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "gr-12",
        name: "Double Concentré de Tomates Aïcha 370g",
        brand: "Aïcha",
        barcode: "6111014000115",
        price: 12.0,
        category: "Conserves & Sauces",
        image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400",
      },
    ],
  },
};

export function InteractivePosSimulator() {
  const [activeVertical, setActiveVertical] = useState<VerticalType>("supermarket");
  const [selectedTable, setSelectedTable] = useState<TableInfo>(RESTAURANT_TABLES[0]);
  const [selectedSize, setSelectedSize] = useState<string>("Taille M");

  const currentConfig = VERTICAL_CATALOGS[activeVertical];

  const [cart, setCart] = useState<{ product: Product; quantity: number; meta?: string }[]>([
    { product: VERTICAL_CATALOGS.supermarket.products[0], quantity: 2 },
    { product: VERTICAL_CATALOGS.supermarket.products[1], quantity: 1 },
    { product: VERTICAL_CATALOGS.supermarket.products[4], quantity: 1 },
  ]);

  const [tenderAmount, setTenderAmount] = useState<number>(100.0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [paidSuccess, setPaidSuccess] = useState<boolean>(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.2; // 20% TVA DGI
  const total = subtotal;
  const changeDue = Math.max(0, tenderAmount - total);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "/logo.png";
    e.currentTarget.className = "w-16 h-16 object-contain m-auto opacity-70 p-2";
  };

  const handleCopySequence = () => {
    navigator.clipboard?.writeText("FAC-2026-000842");
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  const handleVerticalSwitch = (vertical: VerticalType) => {
    setActiveVertical(vertical);
    const newProducts = VERTICAL_CATALOGS[vertical].products;
    setCart([
      { product: newProducts[0], quantity: 1 },
      { product: newProducts[1], quantity: 1 },
    ]);
    setTenderAmount(vertical === "clothing" ? 2500 : vertical === "restaurant" ? 150 : 100);
    setPaidSuccess(false);
  };

  const handleScanProduct = (product: Product) => {
    setIsScanning(true);
    setLastScannedBarcode(product.barcode);

    setTimeout(() => {
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        const meta =
          activeVertical === "restaurant"
            ? selectedTable.name
            : activeVertical === "clothing"
            ? selectedSize
            : undefined;
        return [...prev, { product, quantity: 1, meta }];
      });
      setIsScanning(false);
      setPaidSuccess(false);
    }, 240);
  };

  const handleClear = () => {
    setCart([]);
    setPaidSuccess(false);
  };

  const handleQuickPay = () => {
    setPaidSuccess(true);
    setTimeout(() => {
      setPaidSuccess(false);
    }, 3500);
  };

  return (
    <div className="relative z-10 w-full rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5 sm:p-7 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Laser Scanning Line Animation */}
      {isScanning && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.9)] z-30 pointer-events-none" />
      )}

      {/* TOP MULTI-STORE VERTICAL SELECTOR TABS */}
      <div className="mb-6 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
              Sélectionnez Votre Secteur d&apos;Activité :
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline-block">
            Moteur Caisse Hybride Modulaire • 12+ Marques Réelles
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(
            [
              { key: "supermarket", icon: ShoppingCart, label: "🛒 Supermarché" },
              { key: "restaurant", icon: Utensils, label: "🍔 Restaurant / Fast-Food" },
              { key: "clothing", icon: Shirt, label: "👕 Prêt-à-Porter" },
              { key: "grocery", icon: Store, label: "🏪 Épicerie (Hanout)" },
            ] as const
          ).map((tab) => {
            const isActive = activeVertical === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleVerticalSwitch(tab.key)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? "bg-white text-black border-white shadow-lg scale-[1.02]"
                    : "bg-zinc-900/70 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* RESTAURANT FLOOR PLAN WITH TABLES & STATUSES (Occupied vs Free) */}
        {activeVertical === "restaurant" && (
          <div className="mt-4 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-zinc-300 font-bold flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                Plan de Salle Interactif &amp; Tables :
              </span>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Libre
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Occupée
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {RESTAURANT_TABLES.map((t) => {
                const isSelected = selectedTable.id === t.id;
                const isOccupied = t.status === "occupied";
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTable(t)}
                    className={`p-2 rounded-xl text-left border transition relative flex flex-col justify-between ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/50"
                        : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{t.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                          isOccupied
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {isOccupied ? "Occupée" : "Libre"}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 font-mono">{t.zone}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CLOTHING SIZE SELECTOR */}
        {activeVertical === "clothing" && currentConfig.sizes && (
          <div className="mt-3 flex items-center gap-2 flex-wrap bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/60 text-xs">
            <span className="text-zinc-400 font-mono text-[11px]">Déclinaison Taille Active :</span>
            {currentConfig.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedSize === size
                    ? "bg-sky-500 text-black shadow-xs font-bold"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* POS Terminal Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 pb-3 mb-5 gap-3">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">KASPI POS Terminal #01</span>
              <span className="rounded-full bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[9px] font-mono text-emerald-400">
                Mode {currentConfig.label} ({currentConfig.products.length} références)
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              Caissier: Karim • {activeVertical === "restaurant" ? `Sélection: ${selectedTable.name}` : "Session active #2026-04"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScanProduct(currentConfig.products[0])}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition"
          >
            <Barcode className="h-3.5 w-3.5 text-red-400" />
            <span>Simuler Scan Douchette</span>
          </button>
          <button
            onClick={handleClear}
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-zinc-500 hover:text-zinc-300 transition"
            title="Vider le panier"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Grid: Shelf on Left (Scrollable), Real-time Paper Thermal Receipt on Right (Scrollable) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Scrollable Product Catalog Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1 mb-1 gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono truncate">
              Catalogue Rayon • Faites défiler ({currentConfig.products.length} articles)
            </span>
            {lastScannedBarcode && (
              <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                Code: <span className="text-zinc-300">{lastScannedBarcode}</span>
              </span>
            )}
          </div>

          {/* SCROLLABLE PRODUCT GRID: max-h-[500px] with smooth custom scrollbar */}
          <div className="max-h-[500px] overflow-y-auto pr-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentConfig.products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleScanProduct(p)}
                  className="group cursor-pointer flex flex-col rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-md overflow-hidden text-left transition-all duration-300 hover:border-white/25 hover:shadow-[0_0_25px_rgba(255,255,255,0.06)] p-3"
                >
                  {/* 1. Image on top: Fixed h-40, brightness filter, brand aesthetic */}
                  <div className="relative w-full h-40 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/80 mb-3 flex items-center justify-center">
                    <img
                      src={p.image}
                      alt={p.name}
                      onError={handleImageError}
                      className="w-full h-full object-cover brightness-90 group-hover:brightness-110 transition-all duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                    
                    {/* Brand Pill */}
                    <span className="absolute top-2 left-2 rounded-full bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 text-[9px] font-mono text-zinc-300 pointer-events-none">
                      {p.brand}
                    </span>

                    {/* Category Chip */}
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 text-[9px] font-mono text-zinc-300 pointer-events-none">
                      {p.category}
                    </span>
                  </div>

                  {/* 2. Product Title (line-clamp-1, sans-serif font) */}
                  <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-zinc-100 transition line-clamp-1 mb-1 font-sans">
                    {p.name}
                  </h4>

                  {/* 3. Price & Add (+) button with hover:scale-110 active:scale-95 */}
                  <div className="mt-auto flex items-center justify-between pt-2.5 border-t border-zinc-800/80 gap-2">
                    <span className="font-mono font-black text-sm sm:text-base text-white shrink-0">
                      {p.price.toFixed(2)} <span className="text-xs font-normal text-zinc-400">DH</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScanProduct(p);
                      }}
                      className="h-7 w-7 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 hover:bg-white hover:text-black hover:border-white transition-transform duration-200 hover:scale-110 active:scale-95 shrink-0 shadow-sm"
                      title="Ajouter au ticket"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time scanner indicator */}
          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950 p-3 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span>Matériel supporté : Tiroir RJ11, Douchette laser, Balance poids/prix</span>
            </div>
            <span className="text-zinc-600">&lt;12ms latence</span>
          </div>
        </div>

        {/* Right: The Realistic Physical Paper Thermal Receipt (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-start">
          <div className="w-full flex items-center justify-between pb-2 mb-2 font-mono text-xs text-zinc-400 px-1">
            <span className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider text-[11px]">
              <Printer className="h-3.5 w-3.5 text-emerald-400" />
              Ticket de Caisse Réel
            </span>
            <span>{cart.reduce((a, b) => a + b.quantity, 0)} articles</span>
          </div>

          {/* PHYSICAL PAPER RECEIPT WITH SERRATED / SAWTOOTH TEAR EDGES */}
          <div
            className="w-full bg-[#fbfbfa] text-zinc-950 font-mono text-xs p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_1px_rgba(0,0,0,0.3)] transition-all select-none relative"
            style={{
              clipPath:
                "polygon(0% 4px, 2.5% 0px, 5% 4px, 7.5% 0px, 10% 4px, 12.5% 0px, 15% 4px, 17.5% 0px, 20% 4px, 22.5% 0px, 25% 4px, 27.5% 0px, 30% 4px, 32.5% 0px, 35% 4px, 37.5% 0px, 40% 4px, 42.5% 0px, 45% 4px, 47.5% 0px, 50% 4px, 52.5% 0px, 55% 4px, 57.5% 0px, 60% 4px, 62.5% 0px, 65% 4px, 67.5% 0px, 70% 4px, 72.5% 0px, 75% 4px, 77.5% 0px, 80% 4px, 82.5% 0px, 85% 4px, 87.5% 0px, 90% 4px, 92.5% 0px, 95% 4px, 97.5% 0px, 100% 4px, 100% calc(100% - 4px), 97.5% 100%, 95% calc(100% - 4px), 92.5% 100%, 90% calc(100% - 4px), 87.5% 100%, 85% calc(100% - 4px), 82.5% 100%, 80% calc(100% - 4px), 77.5% 100%, 75% calc(100% - 4px), 72.5% 100%, 70% calc(100% - 4px), 67.5% 100%, 65% calc(100% - 4px), 62.5% 100%, 60% calc(100% - 4px), 57.5% 100%, 55% calc(100% - 4px), 52.5% 100%, 50% calc(100% - 4px), 47.5% 100%, 45% calc(100% - 4px), 42.5% 100%, 40% calc(100% - 4px), 37.5% 100%, 35% calc(100% - 4px), 32.5% 100%, 30% calc(100% - 4px), 27.5% 100%, 25% calc(100% - 4px), 22.5% 100%, 20% calc(100% - 4px), 17.5% 100%, 15% calc(100% - 4px), 12.5% 100%, 10% calc(100% - 4px), 7.5% 100%, 5% calc(100% - 4px), 2.5% 100%, 0% calc(100% - 4px))",
            }}
          >
            {/* Store Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-zinc-400">
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-950 font-sans" dir="rtl">
                بقالة الأمانة • KASPI STORE
              </h3>
              <p className="text-[10px] text-zinc-600 font-sans">
                245 Boulevard Zerktouni, Casablanca
              </p>
              <div className="text-[9px] text-zinc-500 pt-0.5 space-y-0.5 font-mono">
                <p>ICE : 002345678000045 • IF : 45892147</p>
                <p>RC : 38291 • Patente : 341209</p>
              </div>
            </div>

            {/* Receipt Metadata */}
            <div className="py-2 border-b border-dashed border-zinc-400 text-[10px] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-zinc-600">Ticket N°:</span>
                <button
                  onClick={handleCopySequence}
                  className="font-bold text-zinc-950 flex items-center gap-1 hover:underline cursor-pointer"
                  title="Copier le numéro séquentiel"
                >
                  <span>FAC-2026-000842</span>
                  {copiedInvoice ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-zinc-500" />}
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Date :</span>
                <span className="text-zinc-800">Aujourd&apos;hui • 14:32</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Caissier :</span>
                <span className="text-zinc-800">Karim (Caisse #01)</span>
              </div>
            </div>

            {/* SCROLLABLE CART ITEMS LIST: max-h-[190px] overflow-y-auto */}
            <div className="py-2.5 border-b border-dashed border-zinc-400 max-h-[190px] overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {cart.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500">
                  Scannez ou cliquez sur un article pour démarrer
                </div>
              ) : (
                <div className="space-y-1.5">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] leading-tight">
                      <div className="flex-1 pr-2">
                        <div className="font-semibold text-zinc-950 line-clamp-1">{item.product.name}</div>
                        <div className="text-[10px] text-zinc-600">
                          {item.quantity} x {item.product.price.toFixed(2)} DH {item.meta ? `(${item.meta})` : ""}
                        </div>
                      </div>
                      <div className="font-bold text-zinc-950 text-right whitespace-nowrap">
                        {(item.product.price * item.quantity).toFixed(2)} DH
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals & Calculations */}
            <div className="py-2 space-y-1 border-b border-dashed border-zinc-400 text-[11px]">
              <div className="flex justify-between text-zinc-700">
                <span>Total HT :</span>
                <span>{(subtotal - tax).toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between text-zinc-700">
                <span>TVA (20% DGI) :</span>
                <span>{tax.toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-zinc-400 font-bold text-sm text-zinc-950">
                <span>TOTAL TTC :</span>
                <span className="text-base font-extrabold">{total.toFixed(2)} DH</span>
              </div>
            </div>

            {/* Change Due (الصرف) */}
            <div className="py-2 border-b border-dashed border-zinc-400 text-[11px] space-y-1 bg-zinc-200/60 p-2 rounded">
              <div className="flex justify-between text-zinc-800">
                <span>Espèces reçues :</span>
                <span className="font-bold">{tenderAmount.toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-extrabold text-xs">
                <span>الصرف / À Rendre :</span>
                <span>{changeDue.toFixed(2)} DH</span>
              </div>
            </div>

            {/* QR Code & Footer */}
            <div className="pt-3 pb-1 text-center space-y-1.5">
              <div className="flex justify-center">
                <div className="p-1.5 bg-white border border-zinc-300 rounded shadow-xs">
                  <QrCode className="w-16 h-16 text-zinc-950" />
                </div>
              </div>
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider font-semibold">
                Merci de votre visite • شكراً لزيارتكم
              </p>
              <p className="text-[8px] text-zinc-500">
                Signature Électronique Certifiée • Conforme DGI Art. 145 &amp; NF525
              </p>
            </div>
          </div>

          {/* Pay & Print Trigger Button */}
          <div className="mt-4 w-full">
            <button
              onClick={handleQuickPay}
              disabled={cart.length === 0}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-xl ${
                paidSuccess
                  ? "bg-emerald-500 text-black shadow-emerald-500/25"
                  : "bg-white text-black hover:bg-zinc-200 cursor-pointer hover:scale-[1.01] active:scale-95"
              }`}
            >
              {paidSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Ticket Encaissé &amp; Imprimé (Tiroir RJ11 Ouvert)</span>
                </>
              ) : (
                <>
                  <Banknote className="h-4 w-4" />
                  <span>Encaisser {total.toFixed(2)} DH (Espèces)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
