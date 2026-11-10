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
    applyCoupon: string;
    couponPlaceholder: string;
    couponApplied: string;
    invalidCoupon: string;
    sendDigitalReceipt: string;
    receiptSentWhatsapp: string;
    whatsappReceiptPreview: string;
    digitalReceiptTitle: string;
  };
  products: {
    title: string;
    subtitle: string;
    addProduct: string;
    importExport: string;
    aiStudio: string;
    searchPlaceholder: string;
    allCategories: string;
    category: string;
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
    productsCount: string;
    loadingCatalog: string;
    noProductsFound: string;
    noProductsSub: string;
    noPhoto: string;
    updating: string;
    generateAiImage: string;
    changeImage: string;
    editPrice: string;
    printBarcodeLabel: string;
    priceTtc: string;
    costPrice: string;
    salePrice: string;
    initialStock: string;
    createSuccess: string;
    createModalTitle: string;
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
    aiAnticipationTitle: string;
    velocityModel: string;
    velocitySubtitle: string;
    optimalStockBanner: string;
    realtimeLevels: string;
    trackedItemsCount: string;
    today: string;
    inDays: string;
    reorderAdvice: string;
    units: string;
    interStoreTransfer: string;
    transferHistory: string;
    noTransfers: string;
    stockoutVelocityTitle: string;
    daysRemaining: string;
    orderViaWhatsapp: string;
    whatsappOrderGreeting: string;
    suggestedReorderBadge: string;
    nightlyReportNotice: string;
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
    totalCustomers: string;
    totalActiveCredits: string;
    loyaltyPointsAccumulated: string;
    customerName: string;
    ice: string;
    currentCredit: string;
    karneActions: string;
    unlimited: string;
    loadingCustomers: string;
    noCustomersRegistered: string;
    karneCollect: string;
    karneRecord: string;
    modalTitle: string;
    fullNameLabel: string;
    phoneLabel: string;
    iceLabel: string;
    creditLimitLabel: string;
    submitting: string;
    submitCustomer: string;
    ledgerTitle: string;
    currentBalance: string;
    operationType: string;
    paymentCollect: string;
    newCharge: string;
    amountMad: string;
    notes: string;
    recordOperation: string;
    historyTitle: string;
    noHistory: string;
    backPos: string;
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
    totalDebtOwed: string;
    upcomingMaturities: string;
    recordDebtInvoice: string;
    scanInvoiceOcr: string;
    paymentMethodCheck: string;
    paymentMethodEffet: string;
    paymentMethodCash: string;
    paymentMethodVirement: string;
    settleDebt: string;
    dueDate: string;
    checkNumber: string;
    ocrModalTitle: string;
    ocrModalSubtitle: string;
    ocrDropzoneText: string;
    ocrProcessing: string;
    ocrCommitSuccess: string;
    ocrCommitBtn: string;
    extractedItemsCount: string;
    ledgerTitle: string;
    activeInvoicesCount: string;
    invoiceNumber: string;
    paymentModeCheck: string;
    balanceRemaining: string;
    settled: string;
    rescan: string;
    item: string;
    quantity: string;
    costPrice: string;
    salePrice: string;
    registeredPartners: string;
    totalDebtDesc: string;
    maturitiesDesc: string;
    invoiceNumberLabel: string;
    amountTtcLabel: string;
    paymentMethodLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    selectSupplierOption: string;
    ocrCompressionNote: string;
    ocrWholesaleExamples: string;
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
    exportAccountingSage: string;
    exportAccountingNotice: string;
    sendCustomerReceipt: string;
    ownerNightlyReportTitle: string;
    ownerNightlyReportSubtitle: string;
    sendNightlyReportNow: string;
    scheduledAt: string;
    previewTitle: string;
    nightlyDeliveryNotice: string;
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
    bankRibLabel: string;
    bankNameLabel: string;
    bankRibNumberLabel: string;
    saveBtn: string;
    saving: string;
    tpeSettings: string;
    ecommerceSyncTitle: string;
    ecommerceSyncSubtitle: string;
    youcanStoreKey: string;
    shopifyStoreUrl: string;
    shopifyWebhookSecret: string;
    syncStockOnline: string;
    webhookEndpointLabel: string;
    ownerWhatsappNumber: string;
    nightlyReportHour: string;
    nightlyHour21: string;
    nightlyHour22: string;
    timezoneLabel: string;
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
      emptyCart: "السلة فارغة — ابحث عن منتج أو امسح الباركود",
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
      applyCoupon: "تطبيق الكوبون",
      couponPlaceholder: "رمز القسيمة أو التخفيض (مثلاً PROMO10)",
      couponApplied: "تم تطبيق التخفيض بنجاح",
      invalidCoupon: "رمز القسيمة غير صالح أو منتهي",
      sendDigitalReceipt: "إرسال وصل إلكتروني عبر WhatsApp",
      receiptSentWhatsapp: "تم إرسال الوصل للزبون عبر WhatsApp",
      whatsappReceiptPreview: "معاينة رسالة WhatsApp",
      digitalReceiptTitle: "الوصل الرقمي الفوري",
    },
    products: {
      title: "كتالوج المنتجات",
      subtitle: "إدارة تشكيلة المنتجات، الباركود، والأسعار الشاملة للضريبة",
      addProduct: "إضافة منتج",
      importExport: "استيراد / تصدير",
      aiStudio: "استوديو الذكاء الاصطناعي",
      searchPlaceholder: "ابحث بالاسم، SKU أو الباركود...",
      allCategories: "جميع الأصناف",
      category: "التصنيف",
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
      productsCount: "منتجات",
      loadingCatalog: "جاري تحميل كتالوج المنتجات...",
      noProductsFound: "لم يتم العثور على أي منتج",
      noProductsSub: "استورد ملف CSV أو أضف أول منتج إلى متجرك للبدء",
      noPhoto: "بدون صورة",
      updating: "جاري التحديث...",
      generateAiImage: "توليد صورة بالذكاء الاصطناعي",
      changeImage: "تغيير الصورة",
      editPrice: "تعديل الثمن",
      printBarcodeLabel: "طباعة لاصق الباركود (40x30mm)",
      priceTtc: "السعر شامل الضريبة",
      costPrice: "سعر التكلفة",
      salePrice: "سعر البيع",
      initialStock: "المخزون الأولي",
      createSuccess: "تمت إضافة المنتج بنجاح!",
      createModalTitle: "إضافة منتج جديد إلى الكتالوج",
    },
    inventory: {
      title: "المخزون والجرد",
      subtitle: "متابعة مستويات المخزون في الوقت الفعلي والتنبؤ بالخصاص",
      stockValue: "قيمة المخزون الإجمالية",
      criticalAlerts: "تنبيهات المخزون الحرج",
      lowStock: "مخزون منخفض",
      outOfStock: "نفاد المخزون",
      healthyStock: "مخزون متوفر",
      adjustStock: "تسوية وجرد المخزون",
      auditLog: "سجل العمليات",
      productName: "اسم المنتج",
      currentQty: "الكمية الحالية",
      reorderLevel: "حد إعادة الطلب",
      status: "حالة المخزون",
      aiAnticipationTitle: "التنبؤ الذكي بالخصاص ونفاذ المخزون",
      velocityModel: "نموذج استهلاك 14 يوماً",
      velocitySubtitle: "توقعات محسوبة تلقائياً بناءً على وتيرة المبيعات الحقيقية بالصندوق",
      optimalStockBanner: "جميع مستويات المخزون مثالية — لا توجد أي مخاطر نفاذ خلال 10 أيام",
      realtimeLevels: "مستويات المخزون في الوقت الفعلي",
      trackedItemsCount: "منتج قيد التتبع",
      today: "اليوم",
      inDays: "خلال {days} أيام",
      reorderAdvice: "اقتراح إعادة الطلب :",
      units: "وحدات",
      interStoreTransfer: "تحويل المخزون بين الفروع",
      transferHistory: "سجل التحويلات بين الفروع والمستودعات",
      noTransfers: "لم يتم تسجيل أي تحويل بين الفروع حتى الآن",
      stockoutVelocityTitle: "سرعة استهلاك المخزون والتنبؤ بالخصاص",
      daysRemaining: "متبقي {days} أيام قبل النفاد",
      orderViaWhatsapp: "طلب التزويد عبر WhatsApp",
      whatsappOrderGreeting: "السلام عليكم، نود تزويد متجرنا بالمنتجات التالية وفق النواقص المسجلة:",
      suggestedReorderBadge: "كمية الطلب المقترحة: +{qty} {unit}",
      nightlyReportNotice: "مدرج تلقائياً في التقرير التنفيذي لمالك المتجر (21:00 / 22:00)",
    },
    customers: {
      title: "الزبائن والكريدي",
      subtitle: "إدارة حسابات الزبائن وسجل الديون والولاء",
      addCustomer: "إضافة زبون جديد",
      searchPlaceholder: "البحث بالاسم، رقم الهاتف أو المعرف الضريبي (ICE)...",
      name: "اسم الزبون",
      phone: "رقم الهاتف",
      creditBalance: "رصيد الكريدي الحالي",
      creditLimit: "سقف الكريدي المسموح",
      loyaltyPoints: "نقاط الولاء",
      settleCredit: "تسديد دفعة",
      noCustomers: "لا يوجد زبائن مسجلون",
      totalCustomers: "إجمالي عدد العملاء",
      totalActiveCredits: "إجمالي ديون الكريديات الجارية",
      loyaltyPointsAccumulated: "مجموع نقاط الوفاء المكتسبة",
      customerName: "اسم العميل",
      ice: "ICE",
      currentCredit: "الرصيد المدين (MAD)",
      karneActions: "إجراءات الكريديات",
      unlimited: "غير محدود",
      loadingCustomers: "جاري تحميل العملاء...",
      noCustomersRegistered: "لا يوجد أي عميل مسجل حالياً",
      karneCollect: "تحصيل / الدفتر",
      karneRecord: "دفتر الكريديات",
      modalTitle: "إضافة عميل جديد",
      fullNameLabel: "الاسم الكامل / الصفة القانونية *",
      phoneLabel: "رقم الهاتف (GSM)",
      iceLabel: "رقم المعرف الموحد للمقاولة (ICE)",
      creditLimitLabel: "سقف الائتمان المسموح به (درهم)",
      submitting: "جاري الحفظ...",
      submitCustomer: "إضافة العميل",
      ledgerTitle: "دفتر الكريديات (كارني)",
      currentBalance: "الرصيد الحالي",
      operationType: "نوع العملية",
      paymentCollect: "تسديد دفعة (تقليص الدين)",
      newCharge: "إضافة دين جديد (كريديات)",
      amountMad: "المبلغ (MAD)",
      notes: "ملاحظات أو رقم الوصل",
      recordOperation: "تسجيل العملية في الدفتر",
      historyTitle: "سجل المعاملات السابقة",
      noHistory: "لا توجد معاملات مسجلة في الدفتر بعد.",
      backPos: "رجوع (نقطة البيع)",
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
      totalDebtOwed: "إجمالي ديون الموردين الجارية",
      upcomingMaturities: "استحقاقات الشيكات والكمبيالات القادمة",
      recordDebtInvoice: "تسجيل فاتورة / مديونية مورد",
      scanInvoiceOcr: "مسح فاتورة الشراء بالذكاء الاصطناعي (OCR)",
      paymentMethodCheck: "شيك بنكي",
      paymentMethodEffet: "كمبيالة (Effet)",
      paymentMethodCash: "نقداً (Espèces)",
      paymentMethodVirement: "تحويل بنكي (Virement)",
      settleDebt: "تسديد دفعة للمورد",
      dueDate: "تاريخ الاستحقاق",
      checkNumber: "رقم الشيك / الكمبيالة",
      ocrModalTitle: "المسح الذكي لفاتورة المورد الورقية",
      ocrModalSubtitle: "استخراج تلقائي لبنود الفاتورة والكميات وأسعار التكلفة وتحديث المخزون بنقرة واحدة",
      ocrDropzoneText: "اسحب صورة الفاتورة إلى هنا أو اضغط لرفع ملف (JPEG, PNG, WebP)",
      ocrProcessing: "جاري تحليل بنود الفاتورة واستخراج البيانات...",
      ocrCommitSuccess: "تم تحديث المخزون وأسعار الشراء بنجاح!",
      ocrCommitBtn: "اعتماد وتحديث المخزون دفعة واحدة",
      extractedItemsCount: "بند مستخرج",
      ledgerTitle: "سجل استحقاقات وديون الموردين (الشيكات والكمبيالات)",
      activeInvoicesCount: "{count} فواتير جارية",
      invoiceNumber: "رقم الفاتورة",
      paymentModeCheck: "طريقة الأداء / رقم الورقة",
      balanceRemaining: "المبلغ المتبقي",
      settled: "تمت التسوية",
      rescan: "إعادة المسح",
      item: "المنتج",
      quantity: "الكمية",
      costPrice: "سعر الشراء",
      salePrice: "سعر البيع",
      registeredPartners: "الشركاء والموزعون المسجلون",
      totalDebtDesc: "إجمالي المستحقات الواجب تسديدها للموردين",
      maturitiesDesc: "شيكات وكمبيالات مستحقة خلال 48-72 ساعة",
      invoiceNumberLabel: "رقم الفاتورة *",
      amountTtcLabel: "المبلغ الإجمالي شامل الضريبة (MAD) *",
      paymentMethodLabel: "طريقة التسوية",
      notesLabel: "ملاحظات أو بيان السلع",
      notesPlaceholder: "تم استلام البضائع بحالة جيدة",
      selectSupplierOption: "اختر المورد...",
      ocrCompressionNote: "ضغط WebP على المتصفح واستخراج البنود آلياً...",
      ocrWholesaleExamples: "فواتير الموزعين والشركات الكبرى (سنترال دانون، لوسيور، كوكاكولا، إلخ)",
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
      exportAccountingSage: "تصدير المحاسبة (Sage / DGI Maroc)",
      exportAccountingNotice: "ملف CSV بترميز UTF-8 متوافق مع معايير المادة 145 من المدونة العامة للضرائب (CGI)",
      sendCustomerReceipt: "إرسال الوصل للزبون عبر WhatsApp",
      ownerNightlyReportTitle: "التقرير التنفيذي اليومي لمالك المتجر (21:00 / 22:00)",
      ownerNightlyReportSubtitle: "ملخص مالي وتشغيلي لآخر 24 ساعة: رقم المعاملات، تفاصيل السلع المباعة، وتوجيهات المخزون وشيكات الموردين.",
      sendNightlyReportNow: "إرسال التقرير التنفيذي لمالك المتجر الآن عبر WhatsApp",
      scheduledAt: "الموعد المحدد للإرسال:",
      previewTitle: "معاينة رسالة WhatsApp الرسمية الخاصة بمالك المتجر",
      nightlyDeliveryNotice: "يتم إرسال هذا التقرير تلقائياً كل ليلة لمالك المتجر وفق التوقيت المحدد.",
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
      bankRibLabel: "الحساب البنكي للتسوية واستقبال الأموال (RIB المغرب)",
      bankNameLabel: "اسم البنك",
      bankRibNumberLabel: "رقم الحساب البنكي (24 رقماً)",
      saveBtn: "حفظ التغييرات",
      saving: "جاري الحفظ...",
      tpeSettings: "إعدادات جهاز الدفع الإلكتروني (TPE CMI)",
      ecommerceSyncTitle: "المزامنة اللحظية مع المتاجر الإلكترونية (YouCan & Shopify)",
      ecommerceSyncSubtitle: "ربط المخزون تلقائياً بين الصندوق المحلي ومتجرك الإلكتروني لتفادي البيع بدون رصيد",
      youcanStoreKey: "مفتاح الربط YouCan API Key",
      shopifyStoreUrl: "رابط متجر Shopify (myshopify.com)",
      shopifyWebhookSecret: "المفتاح السري لـ Webhook",
      syncStockOnline: "تفعيل المزامنة التلقائية للمخزون",
      webhookEndpointLabel: "رابط استقبال الإشعارات (Webhook URL):",
      ownerWhatsappNumber: "رقم WhatsApp الخاص بمالك المتجر (المدير)",
      nightlyReportHour: "توقيت إرسال التقرير التنفيذي اليومي عبر WhatsApp",
      nightlyHour21: "21:00 (نهاية الدوام المعتاد)",
      nightlyHour22: "22:00 (للمتاجر المتأخرة والمطاعم)",
      timezoneLabel: "المنطقة الزمنية للمتجر",
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
      applyCoupon: "Appliquer",
      couponPlaceholder: "Code promo ou bon d'achat (ex: PROMO10)",
      couponApplied: "Code promo appliqué avec succès",
      invalidCoupon: "Code promo invalide ou expiré",
      sendDigitalReceipt: "Envoyer ticket digital via WhatsApp",
      receiptSentWhatsapp: "Ticket envoyé au client par WhatsApp",
      whatsappReceiptPreview: "Aperçu du message WhatsApp",
      digitalReceiptTitle: "Ticket de Caisse Numérique",
    },
    products: {
      title: "Catalogue Produits",
      subtitle: "Gérez votre assortiment, codes-barres et tarification TTC",
      addProduct: "Nouveau Produit",
      importExport: "Importer / Exporter",
      aiStudio: "Studio IA",
      searchPlaceholder: "Rechercher par nom, SKU ou code-barres...",
      allCategories: "Toutes les catégories",
      category: "Catégorie",
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
      productsCount: "Produits",
      loadingCatalog: "Chargement du catalogue produits...",
      noProductsFound: "Aucun produit trouvé",
      noProductsSub: "Importez un fichier CSV ou ajoutez votre premier produit pour démarrer.",
      noPhoto: "Aucune photo",
      updating: "Mise à jour...",
      generateAiImage: "Générer image IA",
      changeImage: "Changer la photo",
      editPrice: "Modifier le prix",
      printBarcodeLabel: "Imprimer étiquette code-barres (40x30mm)",
      priceTtc: "Prix TTC",
      costPrice: "Prix d'achat",
      salePrice: "Prix de vente",
      initialStock: "Stock initial",
      createSuccess: "Produit ajouté au catalogue avec succès !",
      createModalTitle: "Ajouter un produit au catalogue",
    },
    inventory: {
      title: "Gestion des Stocks & Audit",
      subtitle: "Suivez les niveaux de stock, mouvements et alertes de réapprovisionnement",
      stockValue: "Valeur Totale du Stock",
      criticalAlerts: "Alertes Stocks Critiques",
      lowStock: "Stock Faible",
      outOfStock: "Rupture de Stock",
      healthyStock: "Stock Disponible",
      adjustStock: "Ajuster le Stock",
      auditLog: "Journal d'Audit",
      productName: "Produit",
      currentQty: "Quantité en Stock",
      reorderLevel: "Seuil de Réappro",
      status: "Statut",
      aiAnticipationTitle: "Anticipation Prédictive IA des Ruptures de Stock",
      velocityModel: "Modèle Vélocité 14j",
      velocitySubtitle: "Prévisions calculées en continu d'après le rythme réel en caisse",
      optimalStockBanner: "Tous vos stocks sont à des niveaux optimaux — Aucune rupture imminente sous 10 jours.",
      realtimeLevels: "Niveaux de Stock en Temps Réel",
      trackedItemsCount: "Articles Suivis",
      today: "Aujourd'hui",
      inDays: "Dans {days}j",
      reorderAdvice: "Conseil Réappro :",
      units: "unités",
      interStoreTransfer: "Transfert Inter-Dépôts",
      transferHistory: "Historique des Transferts Inter-Dépôts",
      noTransfers: "Aucun transfert de stock enregistré pour l'instant.",
      stockoutVelocityTitle: "Vélocité d'écoulement & Risques de Rupture",
      daysRemaining: "{days} jours avant rupture",
      orderViaWhatsapp: "Commander au fournisseur via WhatsApp",
      whatsappOrderGreeting: "Bonjour, nous souhaitons passer commande pour le réassort des articles suivants :",
      suggestedReorderBadge: "Quantité suggérée : +{qty} {unit}",
      nightlyReportNotice: "Inclus automatiquement dans le rapport exécutif propriétaire (21h/22h)",
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
      totalCustomers: "Nombre total de clients",
      totalActiveCredits: "Total Crédits en Cours (Krediat)",
      loyaltyPointsAccumulated: "Points de Fidélité Cumulés",
      customerName: "Nom du Client",
      ice: "ICE",
      currentCredit: "Crédit Actuel (MAD)",
      karneActions: "Actions Karné",
      unlimited: "Illimité",
      loadingCustomers: "Chargement des clients...",
      noCustomersRegistered: "Aucun client enregistré pour l'instant",
      karneCollect: "Encaisser / Karné",
      karneRecord: "Carnet",
      modalTitle: "Ajouter un Client",
      fullNameLabel: "Nom complet / Raison Sociale *",
      phoneLabel: "Téléphone (GSM)",
      iceLabel: "Numéro ICE (Si société)",
      creditLimitLabel: "Plafond Crédit Autorisé (DH)",
      submitting: "Enregistrement...",
      submitCustomer: "Ajouter le client",
      ledgerTitle: "Carnet de Crédit (Karné)",
      currentBalance: "Solde Actuel",
      operationType: "Type d'opération",
      paymentCollect: "Règlement / Remboursement",
      newCharge: "Nouveau crédit (Charge)",
      amountMad: "Montant (MAD)",
      notes: "Notes ou Référence",
      recordOperation: "Enregistrer l'opération",
      historyTitle: "Historique des mouvements",
      noHistory: "Aucun mouvement enregistré pour l'instant.",
      backPos: "Retour (POS)",
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
      totalDebtOwed: "Total Dettes Fournisseurs en Cours",
      upcomingMaturities: "Échéances Chèques & Effets à Venir",
      recordDebtInvoice: "Enregistrer Facture / Dette Fournisseur",
      scanInvoiceOcr: "Scanner Facture d'Achat (OCR IA)",
      paymentMethodCheck: "Chèque Bancaire",
      paymentMethodEffet: "Effet de Commerce (Kembyala)",
      paymentMethodCash: "Espèces",
      paymentMethodVirement: "Virement Bancaire",
      settleDebt: "Régler une Dette Fournisseur",
      dueDate: "Date d'Échéance",
      checkNumber: "Numéro de Chèque / Effet",
      ocrModalTitle: "Scanner Intelligent de Facture Fournisseur",
      ocrModalSubtitle: "Extraction automatique des lignes, quantités et prix d'achat avec mise à jour du stock en 1 clic",
      ocrDropzoneText: "Glissez la facture ou cliquez pour importer une photo (JPEG, PNG, WebP)",
      ocrProcessing: "Extraction et analyse des lignes de facture en cours...",
      ocrCommitSuccess: "Stock et prix de revient mis à jour avec succès !",
      ocrCommitBtn: "Valider & Mettre à jour le Stock",
      extractedItemsCount: "lignes extraites",
      ledgerTitle: "Échéancier & Dettes Fournisseurs (Chèques / Effets)",
      activeInvoicesCount: "{count} factures actives",
      invoiceNumber: "Facture N°",
      paymentModeCheck: "Mode / N° Pièce",
      balanceRemaining: "Reste Dû",
      settled: "Réglé",
      rescan: "Rescanner",
      item: "Article",
      quantity: "Qté",
      costPrice: "Coût Achat",
      salePrice: "Prix Vente",
      registeredPartners: "Partenaires & grossistes enregistrés",
      totalDebtDesc: "Encours global à régler aux fournisseurs",
      maturitiesDesc: "Chèques & Effets dus sous 48-72 heures",
      invoiceNumberLabel: "Numéro de Facture *",
      amountTtcLabel: "Montant TTC (MAD) *",
      paymentMethodLabel: "Mode de Règlement",
      notesLabel: "Notes ou Description",
      notesPlaceholder: "Marchandises reçues en bon état",
      selectSupplierOption: "Sélectionnez un fournisseur...",
      ocrCompressionNote: "Compression WebP client & extraction des lignes...",
      ocrWholesaleExamples: "Factures grossistes Centrale Danone, Lesieur, Coca-Cola, etc.",
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
      exportAccountingSage: "Export Comptable (Sage / DGI Maroc)",
      exportAccountingNotice: "Fichier CSV UTF-8 conforme aux exigences de l'Article 145 du CGI Maroc",
      sendCustomerReceipt: "Envoyer le ticket au client par WhatsApp",
      ownerNightlyReportTitle: "Rapport Exécutif Journalier du Propriétaire (21h / 22h)",
      ownerNightlyReportSubtitle: "Synthèse financière et opérationnelle 24h : chiffre d'affaires, détail des articles vendus, alertes réapprovisionnement et échéances chèques.",
      sendNightlyReportNow: "Envoyer le Rapport Exécutif au Propriétaire via WhatsApp",
      scheduledAt: "Programmé à :",
      previewTitle: "Aperçu du message WhatsApp officiel du Propriétaire",
      nightlyDeliveryNotice: "Ce rapport est envoyé automatiquement chaque soir au propriétaire selon l'horaire sélectionné.",
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
      bankRibLabel: "Coordonnées Bancaires & RIB de Règlement (Maroc)",
      bankNameLabel: "Banque du Propriétaire",
      bankRibNumberLabel: "RIB Bancaire (24 Chiffres)",
      saveBtn: "Enregistrer les modifications",
      saving: "Enregistrement...",
      tpeSettings: "Paramètres TPE CMI",
      ecommerceSyncTitle: "Synchronisation E-Commerce en Direct (YouCan & Shopify)",
      ecommerceSyncSubtitle: "Mise à jour bidirectionnelle automatique des stocks entre le POS et vos boutiques en ligne",
      youcanStoreKey: "Clé API Boutique YouCan",
      shopifyStoreUrl: "URL Boutique Shopify (myshopify.com)",
      shopifyWebhookSecret: "Secret Signature Webhook",
      syncStockOnline: "Activer la synchronisation automatique des stocks",
      webhookEndpointLabel: "URL de Réception Webhook :",
      ownerWhatsappNumber: "Numéro WhatsApp du Propriétaire (Directeur)",
      nightlyReportHour: "Heure d'Envoi du Rapport Journalier WhatsApp",
      nightlyHour21: "21:00 (Fin de service normale)",
      nightlyHour22: "22:00 (Commerce tardif / Restauration)",
      timezoneLabel: "Fuseau Horaire Commercial",
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
      applyCoupon: "Apply Coupon",
      couponPlaceholder: "Promo or discount coupon (e.g. PROMO10)",
      couponApplied: "Discount coupon applied successfully",
      invalidCoupon: "Invalid or expired coupon code",
      sendDigitalReceipt: "Send Digital Receipt via WhatsApp",
      receiptSentWhatsapp: "Receipt sent to customer via WhatsApp",
      whatsappReceiptPreview: "WhatsApp Message Preview",
      digitalReceiptTitle: "Instant Digital Receipt",
    },
    products: {
      title: "Product Catalog",
      subtitle: "Manage catalog, prices, categories, and inventory stock",
      addProduct: "Add Product",
      importExport: "Import / Export",
      aiStudio: "AI Studio",
      searchPlaceholder: "Search by product name, SKU or barcode...",
      allCategories: "All Categories",
      category: "Category",
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
      productsCount: "Products",
      loadingCatalog: "Loading product catalog...",
      noProductsFound: "No products found",
      noProductsSub: "Import a CSV file or add your first product to get started.",
      noPhoto: "No photo",
      updating: "Updating...",
      generateAiImage: "Generate AI Image",
      changeImage: "Change Photo",
      editPrice: "Edit Price",
      printBarcodeLabel: "Print Barcode Label (40x30mm)",
      priceTtc: "Price (incl. VAT)",
      costPrice: "Cost Price",
      salePrice: "Sale Price",
      initialStock: "Initial Stock",
      createSuccess: "Product added to catalog successfully!",
      createModalTitle: "Add Product to Catalog",
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
      productName: "Product",
      currentQty: "Current Stock",
      reorderLevel: "Reorder Alert Level",
      status: "Status",
      aiAnticipationTitle: "AI Predictive Stockout Anticipation",
      velocityModel: "14-Day Velocity Model",
      velocitySubtitle: "Continuous forecasts based on real checkout sales velocity",
      optimalStockBanner: "All stock levels are optimal — No imminent stockouts detected within 10 days.",
      realtimeLevels: "Real-Time Stock Levels",
      trackedItemsCount: "Tracked Items",
      today: "Today",
      inDays: "In {days}d",
      reorderAdvice: "Reorder Advice:",
      units: "units",
      interStoreTransfer: "Inter-Store Stock Transfer",
      transferHistory: "Inter-Store Stock Transfers History",
      noTransfers: "No stock transfers recorded yet.",
      stockoutVelocityTitle: "Stockout Velocity & Burn-Rate Forecast",
      daysRemaining: "{days} days before stockout",
      orderViaWhatsapp: "Reorder from Supplier via WhatsApp",
      whatsappOrderGreeting: "Hello, we would like to place an order to restock the following items:",
      suggestedReorderBadge: "Suggested reorder: +{qty} {unit}",
      nightlyReportNotice: "Automatically included in nightly Owner Report (21:00 / 22:00)",
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
      totalCustomers: "Total Customers",
      totalActiveCredits: "Active Credit Total (Krediat)",
      loyaltyPointsAccumulated: "Accumulated Loyalty Points",
      customerName: "Customer Name",
      ice: "ICE",
      currentCredit: "Current Credit (MAD)",
      karneActions: "Credit Ledger Actions",
      unlimited: "Unlimited",
      loadingCustomers: "Loading customers...",
      noCustomersRegistered: "No registered customers yet",
      karneCollect: "Collect / Ledger",
      karneRecord: "Ledger",
      modalTitle: "Add Customer",
      fullNameLabel: "Full Name / Legal Entity *",
      phoneLabel: "Phone Number (GSM)",
      iceLabel: "ICE Number (Company)",
      creditLimitLabel: "Credit Limit (MAD)",
      submitting: "Saving...",
      submitCustomer: "Add Customer",
      ledgerTitle: "Credit Ledger (Karné)",
      currentBalance: "Current Balance",
      operationType: "Operation Type",
      paymentCollect: "Repayment (Reduce Debt)",
      newCharge: "New Charge (Increase Debt)",
      amountMad: "Amount (MAD)",
      notes: "Notes or Reference",
      recordOperation: "Record Transaction",
      historyTitle: "Transaction History",
      noHistory: "No transactions recorded yet.",
      backPos: "Back to POS",
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
      totalDebtOwed: "Total Supplier Debt Outstanding",
      upcomingMaturities: "Upcoming Check & Bill Maturities",
      recordDebtInvoice: "Record Supplier Debt / Invoice",
      scanInvoiceOcr: "Scan Purchase Invoice (AI OCR)",
      paymentMethodCheck: "Bank Check",
      paymentMethodEffet: "Commercial Bill (Effet)",
      paymentMethodCash: "Cash",
      paymentMethodVirement: "Bank Wire Transfer",
      settleDebt: "Settle Supplier Debt",
      dueDate: "Due Date",
      checkNumber: "Check / Bill Number",
      ocrModalTitle: "AI Supplier Invoice Paperless Scanner",
      ocrModalSubtitle: "Automatic extraction of line items, quantities, and cost prices with 1-click inventory update",
      ocrDropzoneText: "Drop invoice image here or click to browse (JPEG, PNG, WebP)",
      ocrProcessing: "Analyzing and extracting invoice line items...",
      ocrCommitSuccess: "Stock and cost prices updated successfully!",
      ocrCommitBtn: "Commit & Update Stock in 1-Click",
      extractedItemsCount: "extracted items",
      ledgerTitle: "Supplier Checks & Debt Ledger",
      activeInvoicesCount: "{count} active invoices",
      invoiceNumber: "Invoice #",
      paymentModeCheck: "Method / Check #",
      balanceRemaining: "Balance Due",
      settled: "Settled",
      rescan: "Rescan",
      item: "Item",
      quantity: "Qty",
      costPrice: "Cost Price",
      salePrice: "Sale Price",
      registeredPartners: "Registered wholesale partners",
      totalDebtDesc: "Total outstanding supplier liabilities",
      maturitiesDesc: "Checks & bills due within 48-72 hours",
      invoiceNumberLabel: "Invoice Number *",
      amountTtcLabel: "Total Amount (MAD) *",
      paymentMethodLabel: "Payment Method",
      notesLabel: "Notes or Description",
      notesPlaceholder: "Goods received in good condition",
      selectSupplierOption: "Select a supplier...",
      ocrCompressionNote: "Client-side WebP compression & line extraction...",
      ocrWholesaleExamples: "Wholesale invoices (Centrale Danone, Lesieur, Coca-Cola, etc.)",
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
      exportAccountingSage: "Export for Accountant (Sage / Moroccan DGI)",
      exportAccountingNotice: "UTF-8 CSV compliant with Moroccan Tax Code (Article 145 CGI / CGNC)",
      sendCustomerReceipt: "Send Digital Receipt to Customer via WhatsApp",
      ownerNightlyReportTitle: "Store Owner 24-Hour Executive Report (21:00 / 22:00)",
      ownerNightlyReportSubtitle: "24h financial & operational digest: revenue breakdown, itemized sold items, reorder directives, and maturing supplier checks.",
      sendNightlyReportNow: "Send Executive Report to Store Owner via WhatsApp",
      scheduledAt: "Scheduled at:",
      previewTitle: "Store Owner Official WhatsApp Digest Preview",
      nightlyDeliveryNotice: "This report is dispatched automatically every evening to the store owner based on selected schedule.",
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
      bankRibLabel: "Settlement Bank Account & RIB (Morocco)",
      bankNameLabel: "Owner Bank Name",
      bankRibNumberLabel: "Bank RIB (24 Digits)",
      saveBtn: "Save Changes",
      saving: "Saving...",
      tpeSettings: "CMI POS Terminal Settings",
      ecommerceSyncTitle: "Real-Time E-Commerce Inventory Sync (YouCan & Shopify)",
      ecommerceSyncSubtitle: "Bidirectional stock synchronization between local POS and online storefronts",
      youcanStoreKey: "YouCan API Key",
      shopifyStoreUrl: "Shopify Store URL (myshopify.com)",
      shopifyWebhookSecret: "Webhook Signature Secret",
      syncStockOnline: "Enable Automatic Stock Sync",
      webhookEndpointLabel: "Webhook Endpoint URL:",
      ownerWhatsappNumber: "Store Owner WhatsApp Number (Executive)",
      nightlyReportHour: "Nightly WhatsApp Report Delivery Hour",
      nightlyHour21: "21:00 (Standard evening closure)",
      nightlyHour22: "22:00 (Late-night stores & dining)",
      timezoneLabel: "Store Timezone",
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
