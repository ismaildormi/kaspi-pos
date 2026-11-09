import { useLocale } from "next-intl";

export type Locale = "ar" | "fr" | "en";

export interface TranslationSchema {
  common: {
    appName: string;
    tagline: string;
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    search: string;
    currency: string;
    currencySubtitle: string;
    close: string;
    confirm: string;
    success: string;
    error: string;
    actions: string;
    status: string;
    date: string;
    back: string;
  };
  nav: {
    posRegister: string;
    dashboard: string;
    products: string;
    inventory: string;
    customers: string;
    suppliers: string;
    reports: string;
    billing: string;
    settings: string;
    support: string;
    ownerStudio: string;
    liveBadge: string;
  };
  topbar: {
    grocery: string;
    restaurant: string;
    fashion: string;
    tech: string;
    posRegister: string;
    desktopApp: string;
    settings: string;
    activeAccount: string;
    tools: string;
    openRegister: string;
    registerClosed: string;
  };
  dashboard: {
    title: string;
    currencyNote: string;
    importExcel: string;
    openPos: string;
    businessSector: string;
    kpiRevenue: string;
    kpiRevenueSub: string;
    kpiTransactions: string;
    kpiTransactionsSub: string;
    kpiProducts: string;
    kpiProductsSub: string;
    kpiCustomers: string;
    kpiCustomersSub: string;
    offlineModeActive: string;
    fastPosTitle: string;
    fastPosDesc: string;
    launchPosBtn: string;
    automationBadge: string;
    zReportTitle: string;
    zReportDesc: string;
    viewReportsBtn: string;
  };
  onboarding: {
    businessSectorBtn: string;
    modalTitle: string;
    modalSubtitle: string;
    storeNameLabel: string;
    currencyLabel: string;
    ticketLanguageLabel: string;
    activateBtn: string;
    activatingBtn: string;
    groceryTitle: string;
    groceryDesc: string;
    restaurantTitle: string;
    restaurantDesc: string;
    fashionTitle: string;
    fashionDesc: string;
    techTitle: string;
    techDesc: string;
    features: {
      grocery: string[];
      restaurant: string[];
      fashion: string[];
      tech: string[];
    };
  };
  industryTools: {
    modalTitle: string;
    selectedCartItem: string;
    noItemInCart: string;
    tablesTitle: string;
    tableFree: string;
    tableOccupied: string;
    tableBilled: string;
    modifiersTitle: string;
    kdsTitle: string;
    sizeSelectorTitle: string;
    colorTitle: string;
    imeiTitle: string;
    warrantyTitle: string;
    printBarcodeBtn: string;
    modifiers: string[];
    colors: { name: string; hex: string }[];
  };
  pos: {
    title: string;
    cart: string;
    total: string;
    subtotal: string;
    tax: string;
    checkout: string;
    payCash: string;
    changeDue: string;
    emptyCart: string;
    allCategories: string;
    searchPlaceholder: string;
    holdCart: string;
    resumeCart: string;
    heldOrders: string;
    customer: string;
    addCustomer: string;
    clearCart: string;
    offlineMode: string;
    onlineMode: string;
    syncPending: string;
    quantity: string;
    unitPrice: string;
    discount: string;
    pay: string;
    paymentMethods: string;
    cash: string;
    card: string;
    credit: string;
    tendered: string;
    quickCash: string;
    exactAmount: string;
    saleSuccess: string;
    newSale: string;
    printReceipt: string;
    inStock: string;
    outOfStock: string;
    itemsCount: string;
    loadingCatalog: string;
  };
  products: {
    title: string;
    subtitle: string;
    addProduct: string;
    importExport: string;
    aiStudio: string;
    searchPlaceholder: string;
    allCategories: string;
    sku: string;
    barcode: string;
    price: string;
    cost: string;
    stock: string;
    unitPrice: string;
    taxRate: string;
    noProducts: string;
    newProductTitle: string;
    editProductTitle: string;
  };
  inventory: {
    title: string;
    subtitle: string;
    stockValue: string;
    criticalAlerts: string;
    lowStock: string;
    outOfStock: string;
    healthyStock: string;
    adjustStock: string;
    auditLog: string;
    productName: string;
    currentQty: string;
    reorderLevel: string;
    status: string;
  };
  customers: {
    title: string;
    subtitle: string;
    addCustomer: string;
    searchPlaceholder: string;
    name: string;
    phone: string;
    creditBalance: string;
    creditLimit: string;
    loyaltyPoints: string;
    settleCredit: string;
    noCustomers: string;
  };
  suppliers: {
    title: string;
    subtitle: string;
    addSupplier: string;
    searchPlaceholder: string;
    name: string;
    contact: string;
    phone: string;
    email: string;
    ice: string;
    address: string;
    noSuppliers: string;
  };
  reports: {
    title: string;
    subtitle: string;
    dailySales: string;
    todayCash: string;
    todayCard: string;
    todayCredit: string;
    sendWhatsapp: string;
    whatsappSent: string;
    zReportTitle: string;
    transactionsCount: string;
  };
  billing: {
    title: string;
    subtitle: string;
    currentPlan: string;
    activeDevices: string;
    addDevice: string;
    monthlyPrice: string;
    upgradePlan: string;
    invoices: string;
  };
  settings: {
    title: string;
    subtitle: string;
    general: string;
    shopName: string;
    legalName: string;
    ice: string;
    taxId: string;
    city: string;
    phone: string;
    receiptHeader: string;
    receiptFooter: string;
    hardware: string;
    printer: string;
    scanner: string;
    security: string;
    saveSuccess: string;
  };
  support: {
    title: string;
    subtitle: string;
    newTicket: string;
    subject: string;
    message: string;
    sendTicket: string;
    ticketSent: string;
    myTickets: string;
    noTickets: string;
    statusOpen: string;
    statusResolved: string;
  };
}

export const DICTIONARY: Record<Locale, TranslationSchema> = {
  ar: {
    common: {
      appName: "كسب POS",
      tagline: "نظام نقاط البيع السحابي للمحلات التجارية بالمغرب",
      loading: "جاري التحميل...",
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      edit: "تعديل",
      search: "بحث...",
      currency: "MAD",
      currencySubtitle: "درهم مغربي (MAD)",
      close: "إغلاق",
      confirm: "تأكيد",
      success: "تم بنجاح",
      error: "حدث خطأ",
      actions: "إجراءات",
      status: "الحالة",
      date: "التاريخ",
      back: "رجوع",
    },
    nav: {
      posRegister: "نقطة البيع POS",
      dashboard: "لوحة التحكم",
      products: "كتالوج المنتجات",
      inventory: "المخزون والجرد",
      customers: "الزبائن والكريدي",
      suppliers: "الموردون",
      reports: "التقارير والإقفالات",
      billing: "الاشتراك والفوترة",
      settings: "الإعدادات والمفاتيح",
      support: "الدعم والمساعدة",
      ownerStudio: "استوديو المالك",
      liveBadge: "مباشر",
    },
    topbar: {
      grocery: "بقالة وسوبرماركت",
      restaurant: "مطعم ومقهى",
      fashion: "ملابس وأزياء",
      tech: "إلكترونيات وتقنية",
      posRegister: "نقطة البيع POS",
      desktopApp: "تطبيق الحاسوب",
      settings: "الإعدادات",
      activeAccount: "الحساب النشط",
      tools: "أدوات القطاع",
      openRegister: "فتح الصندوق",
      registerClosed: "الصندوق",
    },
    dashboard: {
      title: "لوحة التحكم",
      currencyNote: "العملة: درهم مغربي (MAD)",
      importExcel: "استيراد Excel/CSV",
      openPos: "فتح نقطة البيع POS",
      businessSector: "تخصيص نشاط المتجر",
      kpiRevenue: "رقم المعاملات الإجمالي",
      kpiRevenueSub: "إجمالي المبيعات المسجلة",
      kpiTransactions: "إجمالي المعاملات",
      kpiTransactionsSub: "وصولات البيع المؤكدة",
      kpiProducts: "المنتجات في الكتالوج",
      kpiProductsSub: "المنتجات والخدمات المعرفة",
      kpiCustomers: "الزبائن ودفتر الكريدي",
      kpiCustomersSub: "حسابات الزبائن المسجلة",
      offlineModeActive: "وضع العمل دون إنترنت مفعل",
      fastPosTitle: "نقطة البيع السريعة (POS)",
      fastPosDesc:
        "متوافق مع الشاشات اللمسية، قارئات الباركود USB/Bluetooth، وطابعات الإيصالات 80mm/58mm.",
      launchPosBtn: "بدء نقطة البيع",
      automationBadge: "الأتمتة الذكية",
      zReportTitle: "الإقفال اليومي وتقرير Z",
      zReportDesc:
        "راجع مبيعاتك اليومية مصنفة حسب طرق الدفع مع إرسال ملخص فوري عبر WhatsApp.",
      viewReportsBtn: "عرض التقارير",
    },
    onboarding: {
      businessSectorBtn: "تخصيص نشاط المتجر",
      modalTitle: "إعداد مساحة عمل المتجر",
      modalSubtitle:
        "اختر نوع نشاطك التجاري لضبط النظام وإعداد الميزات المتخصصة فوراً",
      storeNameLabel: "اسم المتجر",
      currencyLabel: "العملة المعتمدة",
      ticketLanguageLabel: "لغة إيصال الدفع",
      activateBtn: "تفعيل النظام المتخصص",
      activatingBtn: "جاري تهيئة المتجر...",
      groceryTitle: "بقالة وسوبرماركت",
      groceryDesc:
        "أولوية مسح الباركود، ميزان الوزن (كغ/غ)، الشبكة السريعة، وطباعة الملصقات الحرارية.",
      restaurantTitle: "مطعم ومقهى",
      restaurantDesc:
        "خريطة الطاولات، شاشة المطبخ (KDS)، إضافات الأطباق، والطلبات المحلية والسفرية.",
      fashionTitle: "ملابس وأزياء",
      fashionDesc:
        "إدارة المقاسات والألوان، لاصقات الملابس، وتتبع حركة المقاسات.",
      techTitle: "إلكترونيات وهواتف",
      techDesc:
        "تتبع الأرقام التسلسلية وIMEI، شهادات الضمان المطبوعة، وإكسسوارات الأجهزة.",
      features: {
        grocery: [
          "حاسبة الوزن والميزان (كغ / غ)",
          "أولوية مسح الباركود EAN-13",
          "استوديو ملصقات الباركود 40x30 مم",
          "متابعة الموردين وتواريخ الصلاحية",
        ],
        restaurant: [
          "خريطة الطاولات (الصالة والشرفة)",
          "شاشة المطبخ الفورية (KDS)",
          "معدلات وملاحظات تحضير الطلبات",
          "طباعة طلبات المطبخ والبار",
        ],
        fashion: [
          "مصفوفة المقاسات والألوان",
          "طباعة لاصقات الملابس والباركود",
          "تتبع الموديلات والمخزون",
          "سياسة التبديل والإرجاع",
        ],
        tech: [
          "تتبع الأرقام التسلسلية وIMEI",
          "شهادة الضمان المطبوعة في الإيصال",
          "إدارة قطع الغيار والملحقات",
          "سجل الصيانة ومتابعة الأجهزة",
        ],
      },
    },
    industryTools: {
      modalTitle: "أدوات القطاع المتخصصة",
      selectedCartItem: "المنتج المحدد في السلة:",
      noItemInCart: "لم يتم تحديد أي عنصر في السلة",
      tablesTitle: "خريطة الطاولات (الصالة والشرفة)",
      tableFree: "شاغرة",
      tableOccupied: "مشغولة",
      tableBilled: "بانتظار الحساب",
      modifiersTitle: "الإضافات والملاحظات السريعة",
      kdsTitle: "شاشة المطبخ الفورية (KDS)",
      sizeSelectorTitle: "اختيار المقاس / القياس",
      colorTitle: "اختيار اللون",
      imeiTitle: "الرقم التسلسلي / IMEI",
      warrantyTitle: "مدة الضمان المطبوعة على الإيصال",
      printBarcodeBtn: "طباعة لاصق الباركود",
      modifiers: [
        "بدون بصل",
        "جبن إضافي",
        "حار",
        "بدون سكر",
        "مطهو جيداً",
        "سفري",
      ],
      colors: [
        { name: "أسود", hex: "#18181b" },
        { name: "أبيض", hex: "#f4f4f5" },
        { name: "كحلي", hex: "#1e3a8a" },
        { name: "بيج", hex: "#d6d3d1" },
        { name: "أخضر", hex: "#047857" },
        { name: "أحمر", hex: "#991b1b" },
      ],
    },
    pos: {
      title: "نقطة البيع",
      cart: "سلة المشتريات",
      total: "المجموع الإجمالي",
      subtotal: "المجموع الصافي",
      tax: "الضريبة (TVA)",
      checkout: "إتمام البيع (F10)",
      payCash: "أداء نقدي",
      changeDue: "الباقي للزبون",
      emptyCart: "السلة فارغة. ابحث عن منتج أو امسح الباركود.",
      allCategories: "جميع الأصناف",
      searchPlaceholder: "امسح الباركود أو ابحث عن منتج... (F2)",
      holdCart: "تعليق السلة",
      resumeCart: "استرجاع",
      heldOrders: "الطلبات المعلقة",
      customer: "الزبون",
      addCustomer: "تحديد الزبون",
      clearCart: "إفراغ السلة",
      offlineMode: "وضع العمل دون إنترنت",
      onlineMode: "متصل بالإنترنت",
      syncPending: "تنتظر المزامنة",
      quantity: "الكمية",
      unitPrice: "سعر الوحدة",
      discount: "تخفيض",
      pay: "دفع",
      paymentMethods: "طريقة الأداء",
      cash: "نقداً",
      card: "بطاقة بنكية",
      credit: "على الحساب (كريدي)",
      tendered: "المبلغ المستلم",
      quickCash: "مبالغ سريعة",
      exactAmount: "المبلغ بالضبط",
      saleSuccess: "تم تسجيل البيع بنجاح!",
      newSale: "عملية بيع جديدة",
      printReceipt: "طباعة التوصيل",
      inStock: "في المخزون",
      outOfStock: "نفد من المخزون",
      itemsCount: "منتجات",
      loadingCatalog: "جاري تحميل الكتالوج...",
    },
    products: {
      title: "إدارة المنتجات",
      subtitle: "إدارة قائمة المنتجات والأسعار والمخزون",
      addProduct: "إضافة منتج",
      importExport: "استيراد / تصدير",
      aiStudio: "استوديو الذكاء الاصطناعي",
      searchPlaceholder: "ابحث بالاسم، SKU أو الباركود...",
      allCategories: "جميع الأصناف",
      sku: "رمز المنتج (SKU)",
      barcode: "الباركود",
      price: "سعر البيع",
      cost: "سعر التكلفة",
      stock: "المخزون الحالي",
      unitPrice: "سعر الوحدة",
      taxRate: "نسبة الضريبة",
      noProducts: "لا توجد منتجات مسجلة حالياً",
      newProductTitle: "إضافة منتج جديد",
      editProductTitle: "تعديل المنتج",
    },
    inventory: {
      title: "المخزون والجرد",
      subtitle: "متابعة مستويات المخزون وحركات الإدخال والإخراج",
      stockValue: "قيمة المخزون الإجمالية",
      criticalAlerts: "تنبيهات المخزون الحرج",
      lowStock: "مخزون منخفض",
      outOfStock: "نفاد المخزون",
      healthyStock: "مخزون متوفر",
      adjustStock: "تعديل المخزون",
      auditLog: "سجل العمليات",
      productName: "اسم المنتج",
      currentQty: "الكمية الحالية",
      reorderLevel: "حد إعادة الطلب",
      status: "حالة المخزون",
    },
    customers: {
      title: "الزبائن والكريدي",
      subtitle: "إدارة حسابات الزبائن وسجل الديون والولاء",
      addCustomer: "إضافة زبون جديد",
      searchPlaceholder: "ابحث باسم الزبون أو الهاتف أو ICE...",
      name: "اسم الزبون",
      phone: "رقم الهاتف",
      creditBalance: "رصيد الكريدي الحالي",
      creditLimit: "سقف الكريدي المسموح",
      loyaltyPoints: "نقاط الولاء",
      settleCredit: "تسديد دفعة",
      noCustomers: "لا يوجد زبائن مسجلون",
    },
    suppliers: {
      title: "الموردون",
      subtitle: "إدارة الموردين وفواتير الشراء وسندات الاستلام",
      addSupplier: "إضافة مورد جديد",
      searchPlaceholder: "ابحث باسم المورد أو رقم الهاتف...",
      name: "اسم المورد / الشركة",
      contact: "الشخص المسؤول",
      phone: "رقم الهاتف",
      email: "البريد الإلكتروني",
      ice: "رقم ICE",
      address: "العنوان",
      noSuppliers: "لا يوجد موردون مسجلون",
    },
    reports: {
      title: "التقارير والإقفالات",
      subtitle: "إحصائيات المبيعات اليومية والإقفال المالي Z-Report",
      dailySales: "مبيعات اليوم الإجمالية",
      todayCash: "المبيعات نقداً",
      todayCard: "المبيعات بالبطاقة البنكية",
      todayCredit: "المبيعات بالكريدي",
      sendWhatsapp: "إرسال تقرير عبر WhatsApp",
      whatsappSent: "تم إرسال التقرير بنجاح",
      zReportTitle: "تقرير الإقفال اليومي (Z-Report)",
      transactionsCount: "عدد العمليات",
    },
    billing: {
      title: "الاشتراك والفوترة",
      subtitle: "إدارة اشتراك مساحة العمل والأجهزة المتصلة",
      currentPlan: "الخطة الحالية",
      activeDevices: "الأجهزة النشطة",
      addDevice: "إضافة جهاز POS جديد",
      monthlyPrice: "السعر الشهري",
      upgradePlan: "ترقية الخطة",
      invoices: "سجل الفواتير",
    },
    settings: {
      title: "الإعدادات العامة",
      subtitle: "بيانات المتجر القانونية وإعدادات الطابعات والعتاد",
      general: "معلومات المتجر",
      shopName: "اسم المتجر التجاري",
      legalName: "الاسم القانوني للشركة",
      ice: "معرف الشركة الموحد (ICE)",
      taxId: "الرقم الضريبي (IF)",
      city: "المدينة",
      phone: "الهاتف",
      receiptHeader: "رأس الفاتورة المطبوعة",
      receiptFooter: "تذييل الفاتورة",
      hardware: "إعدادات الطابعة والعتاد",
      printer: "الطابعة الحرارية",
      scanner: "ماسح الباركود",
      security: "الأمان والمفاتيح",
      saveSuccess: "تم حفظ الإعدادات بنجاح",
    },
    support: {
      title: "الدعم والمساعدة",
      subtitle: "تواصل مع الفريق التقني والحصول على المساعدة المباشرة",
      newTicket: "فتح تذكرة دعم جديدة",
      subject: "موضوع الطلب",
      message: "تفاصيل المشكلة أو الاستفسار",
      sendTicket: "إرسال التذكرة",
      ticketSent: "تم إرسال تذكرتك بنجاح",
      myTickets: "تذاكري السابقة",
      noTickets: "لا توجد تذاكر دعم سابقة",
      statusOpen: "قيد المتابعة",
      statusResolved: "تم الحل",
    },
  },
  fr: {
    common: {
      appName: "Kasbi POS",
      tagline: "Système de Caisse Cloud pour Commerces au Maroc",
      loading: "Chargement...",
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      search: "Rechercher...",
      currency: "MAD",
      currencySubtitle: "Dirham Marocain (MAD)",
      close: "Fermer",
      confirm: "Confirmer",
      success: "Opération réussie",
      error: "Une erreur est survenue",
      actions: "Actions",
      status: "Statut",
      date: "Date",
      back: "Retour",
    },
    nav: {
      posRegister: "Caisse POS",
      dashboard: "Tableau de bord",
      products: "Catalogue Produits",
      inventory: "Stocks & Audit",
      customers: "Clients & Krediat",
      suppliers: "Fournisseurs",
      reports: "Rapports & Clôtures",
      billing: "Facturation",
      settings: "Paramètres & Clés API",
      support: "Support",
      ownerStudio: "Owner Studio",
      liveBadge: "En direct",
    },
    topbar: {
      grocery: "Épicerie",
      restaurant: "Restaurant",
      fashion: "Mode",
      tech: "Tech",
      posRegister: "Caisse POS",
      desktopApp: "Application Bureau",
      settings: "Paramètres",
      activeAccount: "Compte Actif",
      tools: "Outils Métier",
      openRegister: "Ouvrir la Caisse",
      registerClosed: "Caisse",
    },
    dashboard: {
      title: "Tableau de Bord",
      currencyNote: "Devise : MAD (Dirham Marocain)",
      importExcel: "Importer Excel/CSV",
      openPos: "Ouvrir la Caisse POS",
      businessSector: "Secteur d'activité",
      kpiRevenue: "Chiffre d'Affaires Global",
      kpiRevenueSub: "Total des ventes enregistrées",
      kpiTransactions: "Total des Transactions",
      kpiTransactionsSub: "Tickets de caisse validés",
      kpiProducts: "Articles en Catalogue",
      kpiProductsSub: "Produits référencés",
      kpiCustomers: "Clients & Carnet (Krediat)",
      kpiCustomersSub: "Comptes clients enregistrés",
      offlineModeActive: "Mode Hors-Ligne Actif",
      fastPosTitle: "Caisse Tactile Rapide (POS)",
      fastPosDesc:
        "Compatible écrans tactiles, douchettes de code-barres USB/Bluetooth, et imprimantes thermiques 80mm/58mm.",
      launchPosBtn: "Lancer le Point de Vente",
      automationBadge: "Automatisation",
      zReportTitle: "Clôtures & Z-Report Quotidien",
      zReportDesc:
        "Consultez vos ventes de la journée réparties par mode de règlement et recevez un résumé automatique par WhatsApp.",
      viewReportsBtn: "Consulter les Rapports",
    },
    onboarding: {
      businessSectorBtn: "Secteur d'activité",
      modalTitle: "Configuration de votre Espace Métier",
      modalSubtitle:
        "Choisissez votre secteur d'activité pour pré-configurer automatiquement votre point de vente",
      storeNameLabel: "Nom du Commerce",
      currencyLabel: "Devise",
      ticketLanguageLabel: "Langue du Ticket",
      activateBtn: "Activer mon Espace Métier",
      activatingBtn: "Configuration en cours...",
      groceryTitle: "Épicerie & Supermarché",
      groceryDesc:
        "Priorité lecteur code-barres, balance poids (Kg/g), grille rapide & étiquettes thermiques.",
      restaurantTitle: "Restaurant & Café",
      restaurantDesc:
        "Plan de table, écran cuisine KDS, modificateurs de plats, gestion sur place et à emporter.",
      fashionTitle: "Boutique Mode & Prêt-à-Porter",
      fashionDesc:
        "Grille des tailles et coloris, étiquettes vêtements 40x30mm et suivi fin des stocks.",
      techTitle: "High-Tech & Téléphonie",
      techDesc:
        "Numéros de série et traçabilité IMEI, reçus avec garantie imprimée et gestion des accessoires.",
      features: {
        grocery: [
          "Calculateur Poids & Balance (Kg / g)",
          "Priorité Scan Code-Barres EAN-13",
          "Studio d'Étiquettes Code-Barres 40x30mm",
          "Suivi Fournisseurs & Péremption",
        ],
        restaurant: [
          "Plan des Tables (Salle & Terrasse)",
          "Écran Cuisine Temps Réel (KDS)",
          "Modificateurs et Notes de Préparation",
          "Impression Reçus Cuisine & Bar",
        ],
        fashion: [
          "Matrice Tailles & Coloris",
          "Impression Étiquettes Code-Barres",
          "Suivi des Collections & Stocks",
          "Gestion des Échanges et Retours",
        ],
        tech: [
          "Traçabilité Numéros de Série & IMEI",
          "Certificat de Garantie sur le Ticket",
          "Gestion des Pièces & Accessoires",
          "Fiche Atelier et Suivi Réparations",
        ],
      },
    },
    industryTools: {
      modalTitle: "Outils Métier Spécialisés",
      selectedCartItem: "Article du panier sélectionné :",
      noItemInCart: "Aucun article sélectionné dans le panier",
      tablesTitle: "Plan des Tables (Salle & Terrasse)",
      tableFree: "Libre",
      tableOccupied: "Occupée",
      tableBilled: "Addition demandée",
      modifiersTitle: "Options & Modificateurs Rapides",
      kdsTitle: "Écran Cuisine Temps Réel (KDS)",
      sizeSelectorTitle: "Sélecteur de Taille / Pointure",
      colorTitle: "Couleur & Nuance",
      imeiTitle: "Numéro de Série / IMEI",
      warrantyTitle: "Durée de Garantie Officielle",
      printBarcodeBtn: "Imprimer Étiquette Code-Barres",
      modifiers: [
        "Sans Oignon",
        "Extra Fromage",
        "Piquant (Harissa)",
        "Sans Sucre",
        "Bien Cuit",
        "À Emporter",
      ],
      colors: [
        { name: "Noir", hex: "#18181b" },
        { name: "Blanc", hex: "#f4f4f5" },
        { name: "Bleu Marine", hex: "#1e3a8a" },
        { name: "Beige", hex: "#d6d3d1" },
        { name: "Émeraude", hex: "#047857" },
        { name: "Bordeaux", hex: "#991b1b" },
      ],
    },
    pos: {
      title: "Point de Vente",
      cart: "Panier",
      total: "Total TTC",
      subtotal: "Sous-total HT",
      tax: "TVA",
      checkout: "Encaisser (F10)",
      payCash: "Espèces",
      changeDue: "Monnaie à rendre",
      emptyCart: "Panier vide. Scannez un code-barres ou recherchez un article.",
      allCategories: "Toutes les catégories",
      searchPlaceholder: "Scanner code-barres ou rechercher article... (F2)",
      holdCart: "Mettre en attente",
      resumeCart: "Reprendre",
      heldOrders: "Commandes en attente",
      customer: "Client",
      addCustomer: "Sélectionner Client",
      clearCart: "Vider le panier",
      offlineMode: "Mode hors-ligne",
      onlineMode: "En ligne",
      syncPending: "en attente de synchronisation",
      quantity: "Quantité",
      unitPrice: "Prix unitaire",
      discount: "Remise",
      pay: "Payer",
      paymentMethods: "Mode de règlement",
      cash: "Espèces",
      card: "Carte bancaire",
      credit: "Crédit client",
      tendered: "Montant reçu",
      quickCash: "Montants rapides",
      exactAmount: "Montant exact",
      saleSuccess: "Vente enregistrée avec succès !",
      newSale: "Nouvelle vente",
      printReceipt: "Imprimer ticket",
      inStock: "En stock",
      outOfStock: "Rupture de stock",
      itemsCount: "articles",
      loadingCatalog: "Chargement du catalogue...",
    },
    products: {
      title: "Gestion des Produits",
      subtitle: "Gérez votre catalogue de vente, prix et niveaux de stock",
      addProduct: "Ajouter un produit",
      importExport: "Importer / Exporter",
      aiStudio: "Studio IA",
      searchPlaceholder: "Rechercher par nom, SKU ou code-barres...",
      allCategories: "Toutes les catégories",
      sku: "Référence (SKU)",
      barcode: "Code-barres",
      price: "Prix de vente",
      cost: "Prix de revient",
      stock: "Stock disponible",
      unitPrice: "Prix unitaire",
      taxRate: "Taux TVA",
      noProducts: "Aucun produit dans le catalogue",
      newProductTitle: "Nouveau produit",
      editProductTitle: "Modifier le produit",
    },
    inventory: {
      title: "Stocks & Audit",
      subtitle: "Suivez les niveaux de stock, mouvements et alertes de réapprovisionnement",
      stockValue: "Valeur Totale du Stock",
      criticalAlerts: "Alertes Stocks Critiques",
      lowStock: "Stock Faible",
      outOfStock: "Rupture de Stock",
      healthyStock: "Stock Disponible",
      adjustStock: "Ajuster le Stock",
      auditLog: "Journal d'Audit",
      productName: "Nom de l'article",
      currentQty: "Quantité Actuelle",
      reorderLevel: "Seuil d'Alerte",
      status: "Statut",
    },
    customers: {
      title: "Clients & Krediat",
      subtitle: "Gestion des comptes clients, solde des dettes (Krediat) et fidélité",
      addCustomer: "Nouveau Client",
      searchPlaceholder: "Rechercher par nom, téléphone ou ICE...",
      name: "Nom du Client",
      phone: "Téléphone",
      creditBalance: "Solde Crédit / Dette",
      creditLimit: "Plafond de Crédit",
      loyaltyPoints: "Points de Fidélité",
      settleCredit: "Régler une Dette",
      noCustomers: "Aucun client enregistré",
    },
    suppliers: {
      title: "Fournisseurs",
      subtitle: "Répertoire des fournisseurs et suivi des approvisionnements",
      addSupplier: "Nouveau Fournisseur",
      searchPlaceholder: "Rechercher un fournisseur...",
      name: "Raison Sociale",
      contact: "Contact Principal",
      phone: "Téléphone",
      email: "Email",
      ice: "Numéro ICE",
      address: "Adresse",
      noSuppliers: "Aucun fournisseur enregistré",
    },
    reports: {
      title: "Rapports & Clôtures",
      subtitle: "Statistiques des ventes quotidiennes et clôture de caisse Z-Report",
      dailySales: "Ventes du Jour",
      todayCash: "Encaissements Espèces",
      todayCard: "Encaissements Carte",
      todayCredit: "Ventes à Crédit",
      sendWhatsapp: "Envoyer le Rapport par WhatsApp",
      whatsappSent: "Rapport envoyé avec succès",
      zReportTitle: "Clôture Journalière (Z-Report)",
      transactionsCount: "Nombre de Ventes",
    },
    billing: {
      title: "Facturation & Licences",
      subtitle: "Gérez votre abonnement, terminaux connectés et factures",
      currentPlan: "Forfait Actuel",
      activeDevices: "Terminaux Actifs",
      addDevice: "Ajouter un Terminal POS",
      monthlyPrice: "Tarif Mensuel",
      upgradePlan: "Changer de Forfait",
      invoices: "Historique des Factures",
    },
    settings: {
      title: "Paramètres Généraux",
      subtitle: "Identité de votre commerce, mentions légales et matériel",
      general: "Informations Générales",
      shopName: "Nom Commercial",
      legalName: "Raison Sociale",
      ice: "Numéro ICE",
      taxId: "Identifiant Fiscal (IF)",
      city: "Ville",
      phone: "Téléphone",
      receiptHeader: "En-tête du Ticket",
      receiptFooter: "Pied de page du Ticket",
      hardware: "Périphériques & Matériel",
      printer: "Imprimante Thermique",
      scanner: "Lecteur Code-Barres",
      security: "Sécurité & Clés API",
      saveSuccess: "Paramètres enregistrés avec succès",
    },
    support: {
      title: "Support & Assistance",
      subtitle: "Contactez notre équipe d'experts pour toute assistance technique",
      newTicket: "Ouvrir un Ticket",
      subject: "Objet de la demande",
      message: "Description de votre question ou problème",
      sendTicket: "Envoyer le Ticket",
      ticketSent: "Ticket envoyé avec succès",
      myTickets: "Mes Demandes",
      noTickets: "Aucun ticket en cours",
      statusOpen: "En cours",
      statusResolved: "Résolu",
    },
  },
  en: {
    common: {
      appName: "Kasbi POS",
      tagline: "Cloud Multi-Tenant POS for Businesses in Morocco",
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      search: "Search...",
      currency: "MAD",
      currencySubtitle: "Moroccan Dirham (MAD)",
      close: "Close",
      confirm: "Confirm",
      success: "Operation successful",
      error: "An error occurred",
      actions: "Actions",
      status: "Status",
      date: "Date",
      back: "Back",
    },
    nav: {
      posRegister: "POS Register",
      dashboard: "Dashboard",
      products: "Product Catalog",
      inventory: "Stock & Audit",
      customers: "Customers & Credit",
      suppliers: "Suppliers",
      reports: "Reports & Closures",
      billing: "Billing & Plans",
      settings: "Settings & API Keys",
      support: "Support",
      ownerStudio: "Owner Studio",
      liveBadge: "Live",
    },
    topbar: {
      grocery: "Grocery",
      restaurant: "Restaurant",
      fashion: "Fashion",
      tech: "Tech",
      posRegister: "POS Register",
      desktopApp: "Desktop App",
      settings: "Settings",
      activeAccount: "Active Account",
      tools: "Industry Tools",
      openRegister: "Open Drawer",
      registerClosed: "Register",
    },
    dashboard: {
      title: "Dashboard",
      currencyNote: "Currency: Moroccan Dirham (MAD)",
      importExcel: "Import Excel/CSV",
      openPos: "Open POS Register",
      businessSector: "Business Sector",
      kpiRevenue: "Total Revenue",
      kpiRevenueSub: "Total recorded sales",
      kpiTransactions: "Total Transactions",
      kpiTransactionsSub: "Validated sales receipts",
      kpiProducts: "Catalog Products",
      kpiProductsSub: "Active registered products",
      kpiCustomers: "Customers & Credit Book",
      kpiCustomersSub: "Registered customer accounts",
      offlineModeActive: "Offline Mode Active",
      fastPosTitle: "Fast Touchscreen POS",
      fastPosDesc:
        "Compatible with touchscreens, USB/Bluetooth barcode scanners, and 80mm/58mm thermal printers.",
      launchPosBtn: "Launch Point of Sale",
      automationBadge: "Automation",
      zReportTitle: "Daily Closures & Z-Report",
      zReportDesc:
        "Review daily sales categorized by payment method with automatic WhatsApp summaries.",
      viewReportsBtn: "View Reports",
    },
    onboarding: {
      businessSectorBtn: "Business Sector",
      modalTitle: "Configure Your Industry Workspace",
      modalSubtitle:
        "Select your business type to automatically configure your specialized POS workspace",
      storeNameLabel: "Business Name",
      currencyLabel: "Default Currency",
      ticketLanguageLabel: "Receipt Language",
      activateBtn: "Activate Industry Workspace",
      activatingBtn: "Configuring Workspace...",
      groceryTitle: "Grocery & Supermarket",
      groceryDesc:
        "Optimized for high-speed barcode scanning, scale integration (Kg/g), quick grid, and shelf label printing.",
      restaurantTitle: "Restaurant & Cafe",
      restaurantDesc:
        "Floor table layout, real-time Kitchen Display System (KDS), dish modifiers, dine-in, and takeaway management.",
      fashionTitle: "Fashion & Clothing Boutique",
      fashionDesc:
        "Sizes and colors matrix, apparel tags, and granular inventory tracking.",
      techTitle: "Electronics & Repair Tech",
      techDesc:
        "IMEI & serial number tracking, printed warranty certificates, and accessories management.",
      features: {
        grocery: [
          "Weight & Scale Calculator (Kg / g)",
          "EAN-13 High-Speed Barcode Priority",
          "40x30mm Thermal Label Studio",
          "Supplier Tracking & Expiry Alerts",
        ],
        restaurant: [
          "Table Layout (Dining & Terrace)",
          "Real-time Kitchen Display (KDS)",
          "Order Modifiers & Custom Notes",
          "Bar & Kitchen Ticket Printing",
        ],
        fashion: [
          "Size & Color Matrix",
          "Barcode Apparel Tag Printing",
          "Collection & Stock Tracking",
          "Returns & Exchanges Management",
        ],
        tech: [
          "Serial Number & IMEI Tracking",
          "Printed Warranty on Receipts",
          "Accessories & Parts Management",
          "Repair Workshop Tracking",
        ],
      },
    },
    industryTools: {
      modalTitle: "Specialized Industry Tools",
      selectedCartItem: "Selected Cart Item:",
      noItemInCart: "No item selected in cart",
      tablesTitle: "Table Plan (Dine-in & Terrace)",
      tableFree: "Free",
      tableOccupied: "Occupied",
      tableBilled: "Bill Requested",
      modifiersTitle: "Quick Modifiers & Preparation Notes",
      kdsTitle: "Real-time Kitchen Display (KDS)",
      sizeSelectorTitle: "Size / Shoe Size Selector",
      colorTitle: "Color & Shade",
      imeiTitle: "Serial Number / IMEI",
      warrantyTitle: "Official Warranty Period",
      printBarcodeBtn: "Print Barcode Label",
      modifiers: [
        "No Onion",
        "Extra Cheese",
        "Spicy (Harissa)",
        "Sugar Free",
        "Well Done",
        "Takeaway",
      ],
      colors: [
        { name: "Black", hex: "#18181b" },
        { name: "White", hex: "#f4f4f5" },
        { name: "Navy Blue", hex: "#1e3a8a" },
        { name: "Beige", hex: "#d6d3d1" },
        { name: "Emerald", hex: "#047857" },
        { name: "Burgundy", hex: "#991b1b" },
      ],
    },
    pos: {
      title: "Point of Sale",
      cart: "Cart",
      total: "Grand Total",
      subtotal: "Subtotal",
      tax: "VAT",
      checkout: "Checkout (F10)",
      payCash: "Cash",
      changeDue: "Change Due",
      emptyCart: "Cart is empty. Scan a barcode or search for items.",
      allCategories: "All Categories",
      searchPlaceholder: "Scan barcode or search item... (F2)",
      holdCart: "Hold Cart",
      resumeCart: "Resume",
      heldOrders: "Held Orders",
      customer: "Customer",
      addCustomer: "Select Customer",
      clearCart: "Clear Cart",
      offlineMode: "Offline Mode",
      onlineMode: "Online",
      syncPending: "pending sync",
      quantity: "Quantity",
      unitPrice: "Unit Price",
      discount: "Discount",
      pay: "Pay",
      paymentMethods: "Payment Method",
      cash: "Cash",
      card: "Bank Card",
      credit: "Store Credit",
      tendered: "Tendered",
      quickCash: "Quick Cash",
      exactAmount: "Exact Amount",
      saleSuccess: "Sale recorded successfully!",
      newSale: "New Sale",
      printReceipt: "Print Receipt",
      inStock: "In Stock",
      outOfStock: "Out of Stock",
      itemsCount: "items",
      loadingCatalog: "Loading catalog...",
    },
    products: {
      title: "Product Management",
      subtitle: "Manage catalog, prices, categories, and inventory stock",
      addProduct: "Add Product",
      importExport: "Import / Export",
      aiStudio: "AI Studio",
      searchPlaceholder: "Search by product name, SKU or barcode...",
      allCategories: "All Categories",
      sku: "SKU Reference",
      barcode: "Barcode",
      price: "Sale Price",
      cost: "Cost Price",
      stock: "Stock Quantity",
      unitPrice: "Unit Price",
      taxRate: "VAT Rate",
      noProducts: "No products in catalog",
      newProductTitle: "New Product",
      editProductTitle: "Edit Product",
    },
    inventory: {
      title: "Stock & Audit",
      subtitle: "Track inventory levels, stock adjustments, and reorder alerts",
      stockValue: "Total Stock Value",
      criticalAlerts: "Critical Stock Alerts",
      lowStock: "Low Stock",
      outOfStock: "Out of Stock",
      healthyStock: "In Stock",
      adjustStock: "Adjust Stock",
      auditLog: "Audit Log",
      productName: "Item Name",
      currentQty: "Current Quantity",
      reorderLevel: "Reorder Alert Level",
      status: "Status",
    },
    customers: {
      title: "Customers & Credit",
      subtitle: "Manage customer profiles, credit debt ledger (Krediat), and loyalty",
      addCustomer: "New Customer",
      searchPlaceholder: "Search by customer name, phone, or ICE...",
      name: "Customer Name",
      phone: "Phone Number",
      creditBalance: "Credit Debt Balance",
      creditLimit: "Credit Limit",
      loyaltyPoints: "Loyalty Points",
      settleCredit: "Settle Debt",
      noCustomers: "No registered customers",
    },
    suppliers: {
      title: "Suppliers",
      subtitle: "Supplier directory and purchase supply records",
      addSupplier: "New Supplier",
      searchPlaceholder: "Search suppliers...",
      name: "Company Name",
      contact: "Primary Contact",
      phone: "Phone Number",
      email: "Email",
      ice: "ICE Number",
      address: "Address",
      noSuppliers: "No registered suppliers",
    },
    reports: {
      title: "Reports & Closures",
      subtitle: "Daily sales statistics and financial Z-Report daily closures",
      dailySales: "Today's Sales",
      todayCash: "Cash Collections",
      todayCard: "Card Collections",
      todayCredit: "Credit Sales",
      sendWhatsapp: "Send Report via WhatsApp",
      whatsappSent: "Report sent successfully",
      zReportTitle: "Daily Closure (Z-Report)",
      transactionsCount: "Sales Count",
    },
    billing: {
      title: "Billing & Subscriptions",
      subtitle: "Manage plan subscription, POS registers, and invoices",
      currentPlan: "Current Plan",
      activeDevices: "Active Terminals",
      addDevice: "Add POS Device",
      monthlyPrice: "Monthly Price",
      upgradePlan: "Upgrade Plan",
      invoices: "Invoice History",
    },
    settings: {
      title: "General Settings",
      subtitle: "Store identity, legal tax information, and hardware",
      general: "General Information",
      shopName: "Trading Name",
      legalName: "Legal Business Name",
      ice: "ICE Number",
      taxId: "Tax Identifier (IF)",
      city: "City",
      phone: "Phone",
      receiptHeader: "Receipt Header",
      receiptFooter: "Receipt Footer",
      hardware: "Hardware & Devices",
      printer: "Thermal Printer",
      scanner: "Barcode Scanner",
      security: "Security & API Keys",
      saveSuccess: "Settings saved successfully",
    },
    support: {
      title: "Support & Help",
      subtitle: "Contact our technical team for instant assistance",
      newTicket: "Open Support Ticket",
      subject: "Request Subject",
      message: "Describe your question or issue",
      sendTicket: "Submit Ticket",
      ticketSent: "Ticket submitted successfully",
      myTickets: "My Tickets",
      noTickets: "No previous support tickets",
      statusOpen: "In Progress",
      statusResolved: "Resolved",
    },
  },
};

/**
 * Helper to get strongly typed translation dictionary on the server or client.
 */
export function getDictionary(locale?: string): TranslationSchema {
  const cleanLocale = (locale === "ar" || locale === "en" ? locale : "fr") as Locale;
  return DICTIONARY[cleanLocale] || DICTIONARY.fr;
}

/**
 * Client hook for retrieving the strictly typed dictionary and active locale.
 */
export function useAppDictionary(): { t: TranslationSchema; locale: Locale } {
  let localeStr = "fr";
  try {
    localeStr = useLocale();
  } catch {
    // fallback if outside next-intl provider
  }
  const cleanLocale = (localeStr === "ar" || localeStr === "en" ? localeStr : "fr") as Locale;
  return {
    t: DICTIONARY[cleanLocale] || DICTIONARY.fr,
    locale: cleanLocale,
  };
}
