"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDictionary } from "@/i18n/schema";
import {
  Settings,
  Store,
  MessageSquare,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Save,
  Send,
  Plus,
  Cpu,
  Printer,
  Check,
  Building2,
  CreditCard,
  Globe,
  Trash2,
  AlertTriangle,
  KeyRound,
  Activity,
  Users,
  ShieldCheck,
  RefreshCw,
  X,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  SUPPORTED_RECEIPT_LANGUAGES,
  getReceiptTranslation,
  formatReceiptAmount,
  formatReceiptDate,
  toWesternNumerals,
  type ReceiptLanguage,
  type PrinterConnectionMode,
} from "@/lib/printing/receipt-translations";
import {
  getPrinterSettings,
  savePrinterSettings,
  printTestReceipt,
} from "@/client/printing";
import { usePosStore, type StoreBusinessType } from "@/client/store/usePosStore";
import {
  isAudioEnabled,
  setAudioEnabled as persistAudioEnabled,
  playSuccessSound,
  playTapSound,
} from "@/lib/audio";

interface StoreItem {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  devicesCount: number;
  salesCount: number;
}

type SettingsTab = "general" | "hardware" | "users" | "ecommerce";

export default function SettingsPage() {
  const { t, locale } = useAppDictionary();
  const isRtl = locale === "ar";

  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // General & Legal State
  const [shopName, setShopName] = useState("");
  const [storeLogoUrl, setStoreLogoUrl] = useState("");
  const [address, setAddress] = useState("");
  const [ice, setIce] = useState("");
  const [taxId, setTaxId] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [receiptHeader, setReceiptHeader] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [whatsappReportNumber, setWhatsappReportNumber] = useState("");
  const [isWhatsappReportsActive, setIsWhatsappReportsActive] = useState(true);
  const [nightlyReportHour, setNightlyReportHour] = useState("21:00");
  const [storeTimezone, setStoreTimezone] = useState("Africa/Casablanca");

  // Bank & Payout Configuration (Owner Settlement)
  const [bankName, setBankName] = useState("");
  const [bankRib, setBankRib] = useState("");
  const [tpeTerminalId, setTpeTerminalId] = useState("");

  // Supermarket Hardware & Operational Preferences
  const [barcodeAutoEnter, setBarcodeAutoEnter] = useState(true);
  const [scaleEanPrefix, setScaleEanPrefix] = useState("20");
  const [defaultGasDeposit, setDefaultGasDeposit] = useState("100.00");
  const [defaultCrateDeposit, setDefaultCrateDeposit] = useState("15.00");

  // Thermal Printing State
  const { setPrinterSettings, setTenantInfo, storeType, setStoreProfile } = usePosStore();
  const [receiptLanguage, setReceiptLanguage] = useState<ReceiptLanguage>("fr");
  const [paperWidthMm, setPaperWidthMm] = useState<58 | 80>(80);
  const [printerConnectionMode, setPrinterConnectionMode] =
    useState<PrinterConnectionMode>("auto");
  const [printerTarget, setPrinterTarget] = useState("");
  const [printerIp, setPrinterIp] = useState("192.168.1.50");
  const [printerPort, setPrinterPort] = useState("9100");
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(true);
  const [showStoreLogo, setShowStoreLogo] = useState(true);
  const [isTestPrinting, setIsTestPrinting] = useState(false);
  const [testPrintStatus, setTestPrintStatus] = useState<string | null>(null);
  const [receiptPaperDark, setReceiptPaperDark] = useState(false);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);

  // Multi-Store State
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreCode, setNewStoreCode] = useState("");
  const [newStoreAddress, setNewStoreAddress] = useState("");
  const [newStoreSector, setNewStoreSector] = useState("grocery");
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [storeCreateError, setStoreCreateError] = useState<string | null>(null);

  // User & Roles State
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    email?: string;
    fullName?: string;
    role?: string;
    isSuperAdmin?: boolean;
    maxDevices?: number;
  } | null>(null);

  // Demo Data Reset State
  const [resetClearCatalog, setResetClearCatalog] = useState(false);
  const [isResettingDemo, setIsResettingDemo] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  // Payment Gateway State
  const [selectedGateway, setSelectedGateway] = useState<
    "cmi_tpe" | "youcanpay" | "stripe" | "cash_only"
  >("cmi_tpe");
  const [tpeTerminalIp, setTpeTerminalIp] = useState("192.168.1.150");

  // E-Commerce Sync State (YouCan & Shopify)
  const [youcanApiKey, setYoucanApiKey] = useState("");
  const [shopifyStoreUrl, setShopifyStoreUrl] = useState("");
  const [shopifySecret, setShopifySecret] = useState("");
  const [isSyncActive, setIsSyncActive] = useState(true);
  const [ecommerceSavedFeedback, setEcommerceSavedFeedback] = useState(false);

  useEffect(() => {
    const localPrinter = getPrinterSettings();
    if (localPrinter.receiptLanguage) setReceiptLanguage(localPrinter.receiptLanguage);
    if (localPrinter.paperWidthMm) setPaperWidthMm(localPrinter.paperWidthMm);
    if (localPrinter.printerConnectionMode)
      setPrinterConnectionMode(localPrinter.printerConnectionMode);
    if (localPrinter.printer) setPrinterTarget(localPrinter.printer);
    if (localPrinter.printerIp) setPrinterIp(localPrinter.printerIp);
    if (localPrinter.printerPort) setPrinterPort(localPrinter.printerPort);
    if (localPrinter.autoPrintReceipt !== undefined)
      setAutoPrintReceipt(localPrinter.autoPrintReceipt);
    if (localPrinter.openDrawer !== undefined) setOpenDrawer(localPrinter.openDrawer);
    if (localPrinter.showStoreLogo !== undefined)
      setShowStoreLogo(localPrinter.showStoreLogo);

    fetchSettings();
    fetchStores();
    fetchMeProfile();
    setAudioFeedbackEnabled(isAudioEnabled());
    const storedGw = localStorage.getItem("kaspi_payment_gateway") as any;
    if (storedGw) setSelectedGateway(storedGw);

    // Load E-Commerce config
    const savedYoucan = localStorage.getItem("kaspi_youcan_api_key") || "";
    const savedShopifyUrl = localStorage.getItem("kaspi_shopify_store_url") || "";
    const savedShopifySecret = localStorage.getItem("kaspi_shopify_webhook_secret") || "";
    const savedSyncActive = localStorage.getItem("kaspi_ecommerce_sync_active") !== "false";
    setYoucanApiKey(savedYoucan);
    setShopifyStoreUrl(savedShopifyUrl);
    setShopifySecret(savedShopifySecret);
    setIsSyncActive(savedSyncActive);

    const handleProfileUpdate = (e: any) => {
      if (e.detail?.shopName) setShopName(e.detail.shopName);
      if (e.detail?.logoUrl !== undefined) setStoreLogoUrl(e.detail.logoUrl);
    };
    window.addEventListener("kaspi_store_profile_updated", handleProfileUpdate);
    return () => window.removeEventListener("kaspi_store_profile_updated", handleProfileUpdate);
  }, []);

  const fetchMeProfile = async () => {
    try {
      const res = await fetch("/api/v1/me");
      if (res.ok) {
        const json = await res.json();
        const d = json.data;
        if (d?.user) {
          setCurrentUser({
            id: d.user.id,
            email: d.user.email,
            fullName: d.user.fullName,
            role: d.role || "owner",
            isSuperAdmin: d.user.isSuperAdmin,
            maxDevices: d.currentTenant?.maxDevices || 1,
          });
        }
      }
    } catch {}
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings");
      if (res.ok) {
        const data = await res.json();
        const s = data.settings;
        if (s) {
          setShopName(s.shopName || "");
          if (s.logoUrl) setStoreLogoUrl(s.logoUrl);
          setAddress(s.address || "");
          setIce(s.ice || "");
          setTaxId(s.taxId || "");
          setRcNumber(s.rcNumber || "");
          setPhone(s.phone || "");
          setReceiptHeader(s.receiptHeader || "");
          setReceiptFooter(s.receiptFooter || "");
          setWhatsappReportNumber(s.whatsappReportNumber || "");
          if (s.whatsappReportHour) setNightlyReportHour(s.whatsappReportHour);
          if (s.storeTimezone) setStoreTimezone(s.storeTimezone);
          setIsWhatsappReportsActive(s.isWhatsappReportsActive ?? true);

          if (s.bankName) setBankName(s.bankName);
          if (s.bankRib) setBankRib(s.bankRib);
          if (s.tpeTerminalId) setTpeTerminalId(s.tpeTerminalId);
          if (s.selectedGateway) setSelectedGateway(s.selectedGateway);

          if (s.receiptLanguage) setReceiptLanguage(s.receiptLanguage);
          if (s.paperWidthMm) setPaperWidthMm(s.paperWidthMm === 58 ? 58 : 80);
          if (s.printerConnectionMode) setPrinterConnectionMode(s.printerConnectionMode);
          if (s.printer !== undefined) setPrinterTarget(s.printer);
          if (s.printerIp) setPrinterIp(s.printerIp);
          if (s.printerPort) setPrinterPort(s.printerPort);
          if (s.autoPrintReceipt !== undefined)
            setAutoPrintReceipt(Boolean(s.autoPrintReceipt));
          if (s.openDrawer !== undefined) setOpenDrawer(Boolean(s.openDrawer));
          if (s.showStoreLogo !== undefined) setShowStoreLogo(Boolean(s.showStoreLogo));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/v1/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores || []);
      }
    } catch {}
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newStoreCode.trim()) return;

    setIsCreatingStore(true);
    setStoreCreateError(null);

    try {
      const res = await fetch("/api/v1/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStoreName.trim(),
          code: newStoreCode.trim().toUpperCase(),
          address: newStoreAddress.trim() || undefined,
          storeType: newStoreSector,
          recordPayment: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de créer la succursale");
      }

      setNewStoreName("");
      setNewStoreCode("");
      setNewStoreAddress("");
      setIsAddingStore(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchStores();
    } catch (err: any) {
      setStoreCreateError(err.message || "Erreur de création du magasin");
    } finally {
      setIsCreatingStore(false);
    }
  };

  const handleResetDemoData = async () => {
    setIsResettingDemo(true);
    setResetFeedback(null);
    try {
      const res = await fetch("/api/v1/settings/reset-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearCatalog: resetClearCatalog }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Erreur lors de la réinitialisation");
      }
      const s = json.data?.summary || {};
      setResetFeedback(
        locale === "ar"
          ? `تم تطهير البيانات (${s.deletedSales || 0} مبيعات، ${s.deletedShifts || 0} جلسات صندوق${resetClearCatalog ? `، ${s.deletedProducts || 0} منتجات ديمو` : ""}). جاهز للعمل الفعلي.`
          : locale === "fr"
          ? `Données purgées (${s.deletedSales || 0} ventes, ${s.deletedShifts || 0} sessions caisse${resetClearCatalog ? `, ${s.deletedProducts || 0} produits démo` : ""}). Prêt pour l'exploitation réelle.`
          : `Data purged (${s.deletedSales || 0} sales, ${s.deletedShifts || 0} cash shifts${resetClearCatalog ? `, ${s.deletedProducts || 0} demo products` : ""}). Ready for live production.`
      );
      setResetConfirmOpen(false);
    } catch (err: any) {
      setResetFeedback(err.message || (locale === "ar" ? "فشلت العملية" : locale === "fr" ? "Échec de l'opération" : "Operation failed"));
    } finally {
      setIsResettingDemo(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const newPrinterSettings = {
      receiptLanguage,
      paperWidthMm,
      printerConnectionMode,
      printer: printerTarget,
      printerIp,
      printerPort,
      autoPrintReceipt,
      openDrawer,
      showStoreLogo,
      receiptHeader,
      receiptFooter,
    };

    savePrinterSettings(newPrinterSettings);
    setPrinterSettings(newPrinterSettings);
    setTenantInfo({
      shopName,
      address,
      ice,
      taxId,
      rcNumber,
      phone,
      receiptHeader,
      receiptFooter,
    });

    try {
      const res = await fetch("/api/v1/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName,
          address,
          ice,
          taxId,
          rcNumber,
          phone,
          whatsappReportNumber,
          whatsappReportHour: nightlyReportHour,
          storeTimezone,
          isWhatsappReportsActive,
          bankName,
          bankRib,
          tpeTerminalId,
          selectedGateway,
          ...newPrinterSettings,
        }),
      });

      if (res.ok) {
        localStorage.setItem("kaspi_nightly_report_hour", nightlyReportHour);
        localStorage.setItem("kaspi_store_timezone", storeTimezone);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPrintReceipt = async () => {
    setIsTestPrinting(true);
    setTestPrintStatus(null);
    try {
      const currentSettings = {
        receiptLanguage,
        paperWidthMm,
        printerConnectionMode,
        printer: printerTarget,
        printerIp,
        printerPort,
        autoPrintReceipt,
        openDrawer,
        showStoreLogo,
        receiptHeader,
        receiptFooter,
        shopName: shopName || "KASPI POS GLOBAL",
        logoUrl: storeLogoUrl || undefined,
        address: address || "Casablanca, Maroc",
        ice: ice || "001234567000089",
        taxId: taxId || "12345678",
      };
      savePrinterSettings(currentSettings);
      setPrinterSettings(currentSettings);

      const res = await printTestReceipt(currentSettings);
      if (res.success) {
        setTestPrintStatus(
          res.transport === "tauri_escpos"
            ? (locale === "ar" ? "تم إرسال التذكرة إلى الطابعة الحرارية ESC/POS" : locale === "fr" ? "Ticket envoyé à l'imprimante thermique ESC/POS" : "Receipt sent to ESC/POS thermal printer")
            : (locale === "ar" ? "تم تشغيل معاينة الطباعة" : locale === "fr" ? "Aperçu d'impression lancé" : "Print preview launched")
        );
      } else {
        setTestPrintStatus(locale === "ar" ? "فشل اختبار الطباعة" : locale === "fr" ? "Échec du test d'impression" : "Print test failed");
      }
    } catch (err: any) {
      setTestPrintStatus(err?.message || (locale === "ar" ? "تعذر الطباعة" : locale === "fr" ? "Impossible d'imprimer" : "Unable to print"));
    } finally {
      setIsTestPrinting(false);
    }
  };

  const handleTestWhatsAppReport = async () => {
    setTestResult(locale === "ar" ? "جاري إرسال التقرير..." : locale === "fr" ? "Envoi du Z-Report en cours..." : "Sending Z-Report...");
    try {
      const res = await fetch(
        `/api/reports/daily-whatsapp?autoSend=true&locale=${locale}&deliveryTime=${nightlyReportHour}&phone=${encodeURIComponent(
          whatsappReportNumber
        )}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(locale === "ar" ? "تم إرسال تقرير واتساب بنجاح" : locale === "fr" ? "Rapport WhatsApp envoyé avec succès" : "WhatsApp report sent successfully");
      } else {
        setTestResult(data.error || (locale === "ar" ? "خطأ في إرسال واتساب" : locale === "fr" ? "Erreur d'envoi WhatsApp" : "WhatsApp send error"));
      }
    } catch {
      setTestResult(locale === "ar" ? "خطأ في الاتصال بواجهة واتساب" : locale === "fr" ? "Erreur de connexion avec l'API WhatsApp" : "Connection error with WhatsApp API");
    }
  };



  const st = {
    ar: {
      usersTab: "المستخدمون والصلاحيات",
      legalTitle: "الهوية القانونية، العملة (MAD) ومواصفات DGI",
      currencyBadge: "العملة : درهم مغربي (MAD)",
      shopName: "الاسم التجاري للمحل",
      ice: "الرقم الموحد (ICE 15 رقماً)",
      taxId: "التعريف الضريبي (IF)",
      rc: "السجل التجاري (RC)",
      address: "عنوان نقطة البيع",
      branchesTitle: "الفروع ونقاط البيع",
      newBranch: "إضافة فرع جديد",
      branchNamePlaceholder: "الاسم (مثال: فرع المعاريف)",
      branchCodePlaceholder: "الرمز (مثال: MAARIF-01)",
      branchAddressPlaceholder: "المدينة / العنوان",
      branchModalTitle: "إضافة فرع جديد ونقطة بيع متصلة",
      branchModalDesc: "توسيع شبكة متاجرك ومزامنة المخزون والمبيعات لحظياً عبر سحابة KASPI POS.",
      branchModalBadge: "+150 MAD / شهر (اشتراك الفرع الإضافي ومحطة الكاشير)",
      branchConfirmBtn: "تأكيد إضافة الفرع والاشتراك (+150 د.م/شهر)",
      branchSuccessMsg: "تم تفعيل الفرع الإضافي وتسجيل الفاتورة في سجل الاشتراكات بنجاح",
      cancel: "إلغاء",
      create: "إنشاء",
      creating: "جاري الإنشاء...",
      defaultStoreActive: "المتجر الرئيسي مفعّل كفرع افتراضي.",
      terminalCount: "أجهزة كاشير",
      salesCount: "مبيعات",
      paymentGateways: "بوابات الدفع الإلكتروني وأجهزة TPE",
      cmiTpe: "جهاز TPE البنكي الميداني",
      cmiTpeSub: "ربط شبكي مباشر (LAN)",
      youcanpay: "YouCan Pay المغرب",
      youcanpaySub: "بطاقات بنكية مغربية ودولية",
      stripe: "Stripe العالمية",
      stripeSub: "بطاقات دولية بالعملات الصعبة",
      cashOnly: "نقداً وكريدي فقط",
      cashOnlySub: "عمولة 0%",
      tpeIpLabel: "عنوان IP المحلي لجهاز TPE",
      whatsappReportTitle: "التقرير اليومي عبر واتساب (Z-Report)",
      whatsappManagerPhone: "رقم واتساب المدير المسؤول",
      whatsappAutoSend: "إرسال تقرير الإقفال تلقائياً كل مساء",
      testSend: "اختبار الإرسال",
      demoResetTitle: "إعادة تعيين بيانات التجارب (الانتقال للإنتاج الفعلي)",
      demoResetSubtitle: "حذف المبيعات التجريبية، جلسات الصندوق وتذاكر المطبخ قبل بدء العمل الحقيقي",
      purgeDemoBtn: "تطهير بيانات الديمو",
      purgeWarning: "سيتم حذف جميع المبيعات التجريبية، تذاكر KDS وجلسات X/Z نهائياً.",
      purgeCatalogCheckbox: "حذف المنتجات التجريبية والكتالوج أيضاً",
      confirmPurgeBtn: "تأكيد التطهير النهائي",
      purgingBtn: "جاري التطهير...",
      hardwareTitle: "استوديو الطباعة الحرارية ESC/POS (80mm / 58mm)",
      hardwareSubtitle: "دعم اللغات المتعددة، الأرقام القياسية ودرج الكاشير RJ11",
      testReceiptBtn: "طباعة تذكرة تجريبية",
      paperColor: "لون الورق",
      paperDark: "داكن",
      paperLight: "أبيض",
      receiptLang: "لغة التذكرة الحرارية",
      rollWidth: "عرض لفة الورق",
      connMode: "طريقة الربط بالطابعة",
      connAuto: "تلقائي (Tauri ESC/POS → Web)",
      connUsb: "USB / منفذ تسلسلي مباشر (Spooler)",
      connNetwork: "شبكة محلية LAN TCP/IP (:9100)",
      connBrowser: "مربع حوار المتصفح / PDF",
      printerNamePort: "اسم الطابعة أو المنفذ COM",
      lanIpAddress: "عنوان IP المحلي",
      port: "المنفذ",
      autoPrintCheck: "طباعة التذكرة تلقائياً بمجرد إتمام الدفع",
      drawerPulseCheck: "فتح درج الكاشير RJ11 تلقائياً مع كل عملية",
      logoCheck: "إظهار الشعار في أعلى التذكرة الحرارية",
      audioCheck: "المؤثرات الصوتية لنقطة البيع (صوت الباركود، النقرات وتأكيد الدفع)",
      receiptHeaderLabel: "ترويسة التذكرة الحرارية",
      receiptFooterLabel: "تذييل التذكرة الحرارية",
      vaultTitle: "خزنة المفاتيح السحابية وربط API (.env Runtime Vault)",
      vaultSubtitle: "تهيئة مفاتيح البريد الإلكتروني، Supabase، وقواعد البيانات مباشرة من المتصفح",
      testConnectionsBtn: "فحص الاتصال المباشر",
      saveKeysBtn: "حفظ المفاتيح",
      pasteEnvLabel: "لصق إعدادات ملف .env كاملاً (استخراج تلقائي للمفاتيح)",
      activeKey: "مفعّل",
      notSetKey: "غير محدد",
      newValPlaceholder: "قيمة جديدة لـ",
      gpuTitle: "التسريع المحلي للذكاء الاصطناعي (WebGPU / الجهاز المحلي)",
      gpuSubtitle: "تشغيل التنبؤات والتحليلات محلياً على المعالج الرسومي بدون تكلفة سحابية",
      gpuActive: "WebGPU مفعّل",
      cloudOnly: "سحابي فقط",
      rbacTitle: "الجلسة المصادق عليها وصلاحيات الوصول (RBAC)",
      refreshBtn: "تحديث",
      connectedUser: "المستخدم المتصل",
      rolePrivileges: "الدور والصلاحيات",
      fullAccess: "صلاحيات كاملة (نقطة البيع، المخزون، الإقفالات، المفاتيح)",
      authorizedDevices: "الأجهزة المرخصة",
      cloudOfflineSync: "مزامنة سحابية + محرك Dexie بدون إنترنت",
    },
    fr: {
      usersTab: "Utilisateurs & Accès",
      legalTitle: "Identité Légale, Devise (MAD) & Mentions DGI",
      currencyBadge: "Devise : MAD (Dirham)",
      shopName: "Enseigne Commerciale",
      ice: "ICE (15 chiffres)",
      taxId: "Identifiant Fiscal (IF)",
      rc: "Registre de Commerce (RC)",
      address: "Adresse du Point de Vente",
      branchesTitle: "Succursales & Points de Vente",
      newBranch: "Nouvelle Succursale",
      branchNamePlaceholder: "Nom (ex: Succursale Maarif)",
      branchCodePlaceholder: "Code (ex: MAARIF-01)",
      branchAddressPlaceholder: "Ville / Adresse",
      branchModalTitle: "Ajouter une Succursale & Caisse Connectée",
      branchModalDesc: "Étendez votre réseau de magasins et synchronisez vos stocks en temps réel via KASPI Cloud.",
      branchModalBadge: "+150 MAD / mois (Ajout Succursale & Caisse)",
      branchConfirmBtn: "Confirmer la succursale (+150 MAD/mois)",
      branchSuccessMsg: "Succursale activée et enregistrée dans votre historique de facturation",
      cancel: "Annuler",
      create: "Créer",
      creating: "Création...",
      defaultStoreActive: "Magasin Principal actif par défaut.",
      terminalCount: "terminaux",
      salesCount: "ventes",
      paymentGateways: "Passerelle de Paiement & TPE",
      cmiTpe: "CMI / TPE Physique",
      cmiTpeSub: "Terminal Bancaire LAN",
      youcanpay: "YouCanPay Maroc",
      youcanpaySub: "Cartes MAD & CMI",
      stripe: "Stripe Global",
      stripeSub: "Cartes Internationales",
      cashOnly: "Espèces & Krediat",
      cashOnlySub: "0% Commission",
      tpeIpLabel: "IP Locale du Terminal TPE CMI",
      whatsappReportTitle: "Z-Report Quotidien WhatsApp",
      whatsappManagerPhone: "Numéro WhatsApp du Gérant",
      whatsappAutoSend: "Envoyer automatiquement le rapport de clôture chaque soir",
      testSend: "Tester l'envoi",
      demoResetTitle: "Réinitialiser les données de test (Passage en Production)",
      demoResetSubtitle: "Purge les ventes démo, sessions de caisse et tickets KDS avant exploitation réelle",
      purgeDemoBtn: "Purger les données démo",
      purgeWarning: "Toutes les ventes de test, tickets KDS et sessions X/Z seront supprimés.",
      purgeCatalogCheckbox: "Supprimer aussi les produits de démonstration",
      confirmPurgeBtn: "Confirmer la purge",
      purgingBtn: "Purge...",
      hardwareTitle: "Studio d'Impression Thermique ESC/POS (80mm / 58mm)",
      hardwareSubtitle: "Multi-langues (AR, FR, EN) • Chiffres 0-9 • Tiroir-caisse RJ11",
      testReceiptBtn: "Imprimer Ticket Test",
      paperColor: "Papier",
      paperDark: "Sombre",
      paperLight: "Blanc",
      receiptLang: "Langue du Ticket",
      rollWidth: "Largeur du Rouleau",
      connMode: "Mode de Connexion Matérielle",
      connAuto: "Auto (Tauri ESC/POS → Web)",
      connUsb: "USB / Série Direct (Spooler)",
      connNetwork: "Réseau LAN TCP/IP (:9100)",
      connBrowser: "Dialogue Navigateur / PDF",
      printerNamePort: "Nom de l'imprimante ou Port COM",
      lanIpAddress: "Adresse IP LAN",
      port: "Port",
      autoPrintCheck: "Impression automatique dès validation de l'encaissement",
      drawerPulseCheck: "Impulsion automatique du Tiroir-Caisse RJ11",
      logoCheck: "Afficher le logo en haut du ticket thermique",
      audioCheck: "Sons & Retour Acoustique POS (Bip Scanner Laser, Clics & Validation)",
      receiptHeaderLabel: "En-tête du ticket",
      receiptFooterLabel: "Pied de page",
      vaultTitle: "Coffre-Fort Cloud & Clés API (.env Runtime Vault)",
      vaultSubtitle: "Configurez vos clés SMTP, Supabase, Neon PostgreSQL et moteurs IA directement depuis le navigateur",
      testConnectionsBtn: "Tester les Connexions Live",
      saveKeysBtn: "Sauvegarder les Clés",
      pasteEnvLabel: "Coller un bloc .env complet (détection automatique des clés)",
      activeKey: "Actif",
      notSetKey: "Non défini",
      newValPlaceholder: "Nouvelle valeur pour",
      gpuTitle: "Accélération IA Locale (WebGPU / Terminal Hardware)",
      gpuSubtitle: "Exécute les prédictions de stock en local à coût zéro lorsque aucune clé Cloud externe n'est requise",
      gpuActive: "WebGPU Actif",
      cloudOnly: "Cloud Uniquement",
      rbacTitle: "Session Authentifiée & Contrôle d'Accès (RBAC)",
      refreshBtn: "Actualiser",
      connectedUser: "Utilisateur Connecté",
      rolePrivileges: "Rôle & Privilèges",
      fullAccess: "Accès complet (Caisse, Stocks, Clôtures Z, Clés API)",
      authorizedDevices: "Terminaux Autorisés",
      cloudOfflineSync: "Synchronisation Cloud + Offline Dexie active",
    },
    en: {
      usersTab: "Users & Access",
      legalTitle: "Legal Identity, Currency (MAD) & DGI Tax Info",
      currencyBadge: "Currency: MAD (Dirham)",
      shopName: "Store / Brand Name",
      ice: "ICE (15 digits)",
      taxId: "Tax ID (IF)",
      rc: "Commercial Register (RC)",
      address: "Store Address",
      branchesTitle: "Branches & Locations",
      newBranch: "New Branch",
      branchNamePlaceholder: "Name (e.g., Maarif Branch)",
      branchCodePlaceholder: "Code (e.g., MAARIF-01)",
      branchAddressPlaceholder: "City / Address",
      branchModalTitle: "Add New Branch & Connected POS Terminal",
      branchModalDesc: "Expand your store network and sync inventory in real time via KASPI Cloud.",
      branchModalBadge: "+150 MAD / month (Additional Branch & Register)",
      branchConfirmBtn: "Confirm Branch & Subscribe (+150 MAD/mo)",
      branchSuccessMsg: "Branch activated and recorded in your billing payment history",
      cancel: "Cancel",
      create: "Create",
      creating: "Creating...",
      defaultStoreActive: "Main Store active by default.",
      terminalCount: "terminals",
      salesCount: "sales",
      paymentGateways: "Payment Gateways & Card Terminals",
      cmiTpe: "CMI / Physical TPE",
      cmiTpeSub: "Direct LAN Terminal",
      youcanpay: "YouCanPay Morocco",
      youcanpaySub: "MAD & CMI Cards",
      stripe: "Stripe Global",
      stripeSub: "International Cards",
      cashOnly: "Cash & Ledger Only",
      cashOnlySub: "0% Commission",
      tpeIpLabel: "Local IP of CMI Card Terminal",
      whatsappReportTitle: "Daily WhatsApp Z-Report",
      whatsappManagerPhone: "Manager WhatsApp Number",
      whatsappAutoSend: "Automatically send closing report every evening",
      testSend: "Test Send",
      demoResetTitle: "Reset Demo Data (Production Cutover)",
      demoResetSubtitle: "Purge demo sales, cash sessions, and kitchen tickets before live operation",
      purgeDemoBtn: "Purge Demo Data",
      purgeWarning: "All test sales, KDS tickets, and X/Z sessions will be permanently deleted.",
      purgeCatalogCheckbox: "Also delete demo catalog products",
      confirmPurgeBtn: "Confirm Purge",
      purgingBtn: "Purging...",
      hardwareTitle: "ESC/POS Thermal Printing Studio (80mm / 58mm)",
      hardwareSubtitle: "Multi-language support, standard digits, and RJ11 cash drawer kick",
      testReceiptBtn: "Print Test Receipt",
      paperColor: "Paper",
      paperDark: "Dark",
      paperLight: "White",
      receiptLang: "Receipt Language",
      rollWidth: "Paper Roll Width",
      connMode: "Hardware Connection Mode",
      connAuto: "Auto (Tauri ESC/POS → Web)",
      connUsb: "USB / Direct Serial (Spooler)",
      connNetwork: "Network LAN TCP/IP (:9100)",
      connBrowser: "Browser Print / PDF",
      printerNamePort: "Printer Name or COM Port",
      lanIpAddress: "LAN IP Address",
      port: "Port",
      autoPrintCheck: "Automatically print receipt on payment completion",
      drawerPulseCheck: "Automatic RJ11 Cash Drawer pulse on checkout",
      logoCheck: "Display store logo at the top of the receipt",
      audioCheck: "POS Acoustic Feedback (Laser scanner beep, clicks & validation)",
      receiptHeaderLabel: "Receipt Header",
      receiptFooterLabel: "Receipt Footer",
      vaultTitle: "Cloud Vault & API Keys (.env Runtime Vault)",
      vaultSubtitle: "Configure SMTP, Supabase, Neon PostgreSQL and AI engine keys directly from browser",
      testConnectionsBtn: "Test Live Connections",
      saveKeysBtn: "Save Keys",
      pasteEnvLabel: "Paste full .env block (automatic key extraction)",
      activeKey: "Active",
      notSetKey: "Not Set",
      newValPlaceholder: "New value for",
      gpuTitle: "Local AI Acceleration (WebGPU / Hardware)",
      gpuSubtitle: "Execute inventory predictions locally at zero cloud cost",
      gpuActive: "WebGPU Active",
      cloudOnly: "Cloud Only",
      rbacTitle: "Authenticated Session & Access Control (RBAC)",
      refreshBtn: "Refresh",
      connectedUser: "Logged-in User",
      rolePrivileges: "Role & Privileges",
      fullAccess: "Full Access (POS, Stock, Z-Closures, API Keys)",
      authorizedDevices: "Authorized Terminals",
      cloudOfflineSync: "Cloud + Offline Dexie sync active",
    },
  }[locale] || {
    usersTab: "Users & Access",
    legalTitle: "Legal Identity, Currency (MAD) & DGI Tax Info",
    currencyBadge: "Currency: MAD (Dirham)",
    shopName: "Store / Brand Name",
    ice: "ICE (15 digits)",
    taxId: "Tax ID (IF)",
    rc: "Commercial Register (RC)",
    address: "Store Address",
    branchesTitle: "Branches & Locations",
    newBranch: "New Branch",
    branchNamePlaceholder: "Name",
    branchCodePlaceholder: "Code",
    branchAddressPlaceholder: "City / Address",
    branchModalTitle: "Add New Branch & Connected POS Terminal",
    branchModalDesc: "Expand your store network and sync inventory in real time via KASPI Cloud.",
    branchModalBadge: "+150 MAD / month (Additional Branch & Register)",
    branchConfirmBtn: "Confirm Branch & Subscribe (+150 MAD/mo)",
    branchSuccessMsg: "Branch activated and recorded in your billing payment history",
    cancel: "Cancel",
    create: "Create",
    creating: "Creating...",
    defaultStoreActive: "Main Store active by default.",
    terminalCount: "terminals",
    salesCount: "sales",
    paymentGateways: "Payment Gateways & Card Terminals",
    cmiTpe: "CMI / Physical TPE",
    cmiTpeSub: "Direct LAN Terminal",
    youcanpay: "YouCanPay Morocco",
    youcanpaySub: "MAD & CMI Cards",
    stripe: "Stripe Global",
    stripeSub: "International Cards",
    cashOnly: "Cash & Ledger Only",
    cashOnlySub: "0% Commission",
    tpeIpLabel: "Local IP of CMI Card Terminal",
    whatsappReportTitle: "Daily WhatsApp Z-Report",
    whatsappManagerPhone: "Manager WhatsApp Number",
    whatsappAutoSend: "Automatically send closing report every evening",
    testSend: "Test Send",
    demoResetTitle: "Reset Demo Data (Production Cutover)",
    demoResetSubtitle: "Purge demo sales, cash sessions, and kitchen tickets before live operation",
    purgeDemoBtn: "Purge Demo Data",
    purgeWarning: "All test sales, KDS tickets, and X/Z sessions will be permanently deleted.",
    purgeCatalogCheckbox: "Also delete demo catalog products",
    confirmPurgeBtn: "Confirm Purge",
    purgingBtn: "Purging...",
    hardwareTitle: "ESC/POS Thermal Printing Studio (80mm / 58mm)",
    hardwareSubtitle: "Multi-language support, standard digits, and RJ11 cash drawer kick",
    testReceiptBtn: "Print Test Receipt",
    paperColor: "Paper",
    paperDark: "Dark",
    paperLight: "White",
    receiptLang: "Receipt Language",
    rollWidth: "Paper Roll Width",
    connMode: "Hardware Connection Mode",
    connAuto: "Auto (Tauri ESC/POS → Web)",
    connUsb: "USB / Direct Serial (Spooler)",
    connNetwork: "Network LAN TCP/IP (:9100)",
    connBrowser: "Browser Print / PDF",
    printerNamePort: "Printer Name or COM Port",
    lanIpAddress: "LAN IP Address",
    port: "Port",
    autoPrintCheck: "Automatically print receipt on payment completion",
    drawerPulseCheck: "Automatic RJ11 Cash Drawer pulse on checkout",
    logoCheck: "Display store logo at the top of the receipt",
    audioCheck: "POS Acoustic Feedback",
    receiptHeaderLabel: "Receipt Header",
    receiptFooterLabel: "Receipt Footer",
    vaultTitle: "Cloud Vault & API Keys (.env Runtime Vault)",
    vaultSubtitle: "Configure keys directly from browser",
    testConnectionsBtn: "Test Live Connections",
    saveKeysBtn: "Save Keys",
    pasteEnvLabel: "Paste full .env block",
    activeKey: "Active",
    notSetKey: "Not Set",
    newValPlaceholder: "New value for",
    gpuTitle: "Local AI Acceleration",
    gpuSubtitle: "Execute inventory predictions locally at zero cloud cost",
    gpuActive: "WebGPU Active",
    cloudOnly: "Cloud Only",
    rbacTitle: "Authenticated Session & Access Control (RBAC)",
    refreshBtn: "Refresh",
    connectedUser: "Logged-in User",
    rolePrivileges: "Role & Privileges",
    fullAccess: "Full Access",
    authorizedDevices: "Authorized Terminals",
    cloudOfflineSync: "Cloud + Offline Dexie sync active",
  };

  const TABS: Array<{
    id: SettingsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "general", label: t.settings.general, icon: Store },
    {
      id: "hardware",
      label: t.settings.hardware,
      icon: Printer,
    },
    { id: "ecommerce", label: locale === "ar" ? "المتاجر الإلكترونية" : locale === "en" ? "E-Commerce Sync" : "E-Commerce", icon: Globe },
    { id: "users", label: st.usersTab, icon: Users },
  ];

  return (
    <div dir="ltr" className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/${locale}/dashboard`}
              className="text-xs font-medium text-zinc-400 hover:text-white transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.nav.dashboard}</span>
            </Link>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="h-5 w-5 text-white" />
            <span>{t.settings.title}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.settings.saveSuccess}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="h-9 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{t.common.save}</span>
          </button>
        </div>
      </div>

      {/* Tabbed Navigation Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900/80 border border-white/10">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[160px] h-9 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                active
                  ? "bg-white text-zinc-950 shadow-xs"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* TAB 1: GENERAL & CURRENCY                                           */}
      {/* =================================================================== */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Legal & Tax Identifiers */}
          <div className="kaspi-frosted-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-white" />
                <h2 className="text-sm font-bold text-white">
                  {st.legalTitle}
                </h2>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-zinc-300 border border-white/10">
                {st.currencyBadge}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  {st.shopName}
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="KASPI Store"
                  className="w-full h-10 px-3 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  {st.ice}
                </label>
                <input
                  type="text"
                  value={ice}
                  onChange={(e) => setIce(e.target.value)}
                  placeholder="001234567000089"
                  className="w-full h-10 px-3 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  {st.taxId}
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="12345678"
                  className="w-full h-10 px-3 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  {st.rc}
                </label>
                <input
                  type="text"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value)}
                  placeholder="98765"
                  className="w-full h-10 px-3 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  {st.address}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Casablanca, Maroc"
                  className="w-full h-10 px-3 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white/40"
                />
              </div>
            </div>
          </div>

          {/* Multi-Store Branch Network */}
          <div className="kaspi-frosted-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">{st.branchesTitle}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingStore(!isAddingStore)}
                className="h-8 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{st.newBranch}</span>
              </button>
            </div>

            {isAddingStore && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
                        <Store className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{st.branchModalTitle}</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">{st.branchModalDesc}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddingStore(false)}
                      className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Add-on Pricing Badge */}
                  <div className="p-3.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-300">
                        {st.branchModalBadge}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                      +150 MAD
                    </span>
                  </div>

                  {storeCreateError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-mono">
                      {storeCreateError}
                    </div>
                  )}

                  <form onSubmit={handleCreateStore} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">{st.branchNamePlaceholder}</label>
                      <input
                        type="text"
                        required
                        placeholder={st.branchNamePlaceholder}
                        value={newStoreName}
                        onChange={(e) => setNewStoreName(e.target.value)}
                        className="w-full h-10 px-3.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">{st.branchCodePlaceholder}</label>
                        <input
                          type="text"
                          required
                          placeholder="MAARIF-01"
                          value={newStoreCode}
                          onChange={(e) => setNewStoreCode(e.target.value)}
                          className="w-full h-10 px-3.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white uppercase font-mono placeholder-zinc-500 focus:outline-none focus:border-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">{st.branchAddressPlaceholder}</label>
                        <input
                          type="text"
                          placeholder={st.branchAddressPlaceholder}
                          value={newStoreAddress}
                          onChange={(e) => setNewStoreAddress(e.target.value)}
                          className="w-full h-10 px-3.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        {locale === "ar" ? "قطاع ونشاط الفرع" : locale === "en" ? "Branch Sector / Activity" : "Secteur d'activité du magasin"}
                      </label>
                      <select
                        value={newStoreSector}
                        onChange={(e) => setNewStoreSector(e.target.value)}
                        className="w-full h-10 px-3.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer"
                      >
                        <option value="grocery">{locale === "ar" ? "بقالة وسوبرماركت" : locale === "en" ? "Supermarket & Grocery" : "Épicerie & Supermarché"}</option>
                        <option value="butchery">{locale === "ar" ? "مجزرة ولحوم" : locale === "en" ? "Butchery & Meats" : "Boucherie & Viandes"}</option>
                        <option value="restaurant">{locale === "ar" ? "مطعم ومقهى" : locale === "en" ? "Restaurant & Café" : "Restaurant & Café"}</option>
                        <option value="bakery">{locale === "ar" ? "مخبزة وحلويات" : locale === "en" ? "Bakery & Pastry" : "Boulangerie & Pâtisserie"}</option>
                        <option value="fashion">{locale === "ar" ? "ملابس وأزياء" : locale === "en" ? "Fashion & Apparel" : "Mode & Prêt-à-Porter"}</option>
                        <option value="tech">{locale === "ar" ? "إلكترونيات وهواتف" : locale === "en" ? "Electronics & Tech" : "Électronique & Tech"}</option>
                        <option value="wholesale">{locale === "ar" ? "تجارة الجملة والدروكري" : locale === "en" ? "Wholesale & Hardware" : "Grossiste & Droguerie"}</option>
                      </select>
                    </div>

                    <div className="pt-2 flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsAddingStore(false)}
                        className="px-4 py-2.5 text-xs text-zinc-400 hover:text-white rounded-xl border border-white/10 transition-colors cursor-pointer"
                      >
                        {st.cancel}
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingStore}
                        className="px-5 py-2.5 bg-white text-zinc-950 font-bold text-xs rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isCreatingStore ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{st.creating}</span>
                          </>
                        ) : (
                          <span>{st.branchConfirmBtn}</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stores.length === 0 ? (
                <div className="sm:col-span-3 p-4 rounded-xl bg-zinc-950/60 border border-white/5 text-center text-xs text-zinc-400 font-mono">
                  {st.defaultStoreActive}
                </div>
              ) : (
                stores.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{s.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {s.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {s.address || "Casablanca"}
                    </p>
                    <div className="pt-2 border-t border-white/5 flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>{s.devicesCount} {st.terminalCount}</span>
                      <span>{s.salesCount} {st.salesCount}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Locked Sensitive Owner Vault Security Card */}
          <div className="kaspi-frosted-card rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white">
                      {locale === "ar"
                        ? "خزنة المالك والبيانات المالية الحساسة"
                        : locale === "en"
                        ? "Owner Vault & Sensitive Financial Gateways"
                        : "Coffre Propriétaire & Données Financières Sensibles"}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.10] font-bold">
                      SECURED & MASKED
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {locale === "ar"
                      ? "بوابات الدفع، عنوان TPE، الحساب البنكي، ورقم WhatsApp الخاص بالتقارير مشفرة ومحمية بكلمة مرور المالك."
                      : locale === "en"
                      ? "Payment gateways, TPE IP, bank RIB, and owner WhatsApp are encrypted and password-protected from staff."
                      : "Passerelles de paiement, IP TPE, RIB bancaire et WhatsApp propriétaire sont chiffrés et masqués aux employés."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-owner-vault"))}
                className="sheen-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black transition cursor-pointer shadow-md shrink-0 active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {locale === "ar"
                    ? "فتح خزنة المالك"
                    : locale === "en"
                    ? "Unlock Owner Vault"
                    : "Ouvrir le Coffre"}
                </span>
              </button>
            </div>

            {/* Masked Previews Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* RIB Preview */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{locale === "ar" ? "الحساب البنكي (RIB) :" : "RIB Bancaire :"}</span>
                </span>
                <p className="text-xs font-mono font-bold text-white tracking-wider pt-0.5">
                  •••• •••• •••• {bankRib ? bankRib.slice(-4) : "7014"}
                </p>
              </div>

              {/* WhatsApp Preview */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{locale === "ar" ? "رقم WhatsApp المالك :" : "WhatsApp Propriétaire :"}</span>
                </span>
                <p className="text-xs font-mono font-bold text-white tracking-wider pt-0.5">
                  {whatsappReportNumber && whatsappReportNumber.length > 5
                    ? `•••• •••• ••${whatsappReportNumber.slice(-2)}`
                    : "•••• •••• ••00"}
                </p>
              </div>

              {/* Payment Gateway Preview */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{locale === "ar" ? "بوابة الدفع المسجلة :" : "Passerelle Active :"}</span>
                </span>
                <p className="text-xs font-mono font-bold text-white uppercase pt-0.5">
                  {selectedGateway === "cmi_tpe"
                    ? "CMI / TPE Electronique"
                    : selectedGateway === "youcanpay"
                    ? "YouCan Pay Maroc"
                    : selectedGateway === "stripe"
                    ? "Stripe Global"
                    : "Espèces & Chèques"}
                </p>
              </div>

              {/* TPE IP Preview */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{locale === "ar" ? "عنوان IP المحلي TPE :" : "IP Terminal TPE :"}</span>
                </span>
                <p className="text-xs font-mono font-bold text-white pt-0.5">
                  192.168.1.•••
                </p>
              </div>
            </div>

            {/* Quick Automation Schedule Indicators */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-xs text-zinc-400 border-t border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {locale === "ar"
                    ? `التقرير الليلي التلقائي مجدول عند ${nightlyReportHour} (بتوقيت الدار البيضاء)`
                    : `Rapport nocturne automatique planifié à ${nightlyReportHour} (${storeTimezone})`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleTestWhatsAppReport}
                className="h-8 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>{st.testSend}</span>
                {testResult && <span className="text-emerald-400 font-mono ml-1">{testResult}</span>}
              </button>
            </div>
          </div>

          {/* Demo Data Reset Card */}
          <div className="bg-zinc-900/70 border border-red-500/20 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {st.demoResetTitle}
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    {st.demoResetSubtitle}
                  </p>
                </div>
              </div>

              {!resetConfirmOpen && (
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  className="h-8 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{st.purgeDemoBtn}</span>
                </button>
              )}
            </div>

            {resetFeedback && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                {resetFeedback}
              </div>
            )}

            {resetConfirmOpen && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-red-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    {st.purgeWarning}
                  </span>
                </div>
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetClearCatalog}
                    onChange={(e) => setResetClearCatalog(e.target.checked)}
                    className="w-4 h-4 rounded accent-red-500"
                  />
                  <span>{st.purgeCatalogCheckbox}</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isResettingDemo}
                    onClick={handleResetDemoData}
                    className="h-8 px-3 rounded-lg bg-red-500 hover:bg-red-400 text-black font-bold text-xs cursor-pointer"
                  >
                    {isResettingDemo ? st.purgingBtn : st.confirmPurgeBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetConfirmOpen(false)}
                    className="h-8 px-3 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
                  >
                    {st.cancel}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* TAB 2: THERMAL RECEIPT & HARDWARE                                   */}
      {/* =================================================================== */}
      {activeTab === "hardware" && (
        <div className="kaspi-frosted-card rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-sky-400" />
              <div>
                <h2 className="text-sm font-bold text-white">
                  {st.hardwareTitle}
                </h2>
                <p className="text-[11px] text-zinc-400">
                  {st.hardwareSubtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestPrintReceipt}
                disabled={isTestPrinting}
                className="h-8 px-3 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isTestPrinting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
                <span>{st.testReceiptBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptPaperDark(!receiptPaperDark)}
                className="h-8 px-3 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-zinc-300 hover:text-white cursor-pointer"
              >
                {st.paperColor} : {receiptPaperDark ? st.paperDark : st.paperLight}
              </button>
            </div>
          </div>

          {testPrintStatus && (
            <div className="p-3 rounded-xl bg-zinc-950 border border-white/10 text-xs font-mono text-sky-300">
              {testPrintStatus}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    <span>{st.receiptLang}</span>
                  </label>
                  <select
                    value={receiptLanguage}
                    onChange={(e) => setReceiptLanguage(e.target.value as ReceiptLanguage)}
                    className="w-full h-10 px-3 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white font-semibold"
                  >
                    {SUPPORTED_RECEIPT_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    {st.rollWidth}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { mm: 80 as const, label: "80mm Standard" },
                      { mm: 58 as const, label: "58mm Compact" },
                    ].map((w) => (
                      <button
                        key={w.mm}
                        type="button"
                        onClick={() => setPaperWidthMm(w.mm)}
                        className={`h-10 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          paperWidthMm === w.mm
                            ? "bg-white text-black border-white"
                            : "bg-zinc-950 border-white/10 text-zinc-400"
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  {st.connMode}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "auto" as const, title: st.connAuto },
                    { id: "usb_serial" as const, title: st.connUsb },
                    { id: "network" as const, title: st.connNetwork },
                    { id: "browser" as const, title: st.connBrowser },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPrinterConnectionMode(m.id)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                        printerConnectionMode === m.id
                          ? "bg-zinc-950 border-sky-400 text-white"
                          : "bg-zinc-950/50 border-white/10 text-zinc-400"
                      }`}
                    >
                      {m.title}
                    </button>
                  ))}
                </div>
              </div>

              {printerConnectionMode === "usb_serial" && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    {st.printerNamePort}
                  </label>
                  <input
                    type="text"
                    value={printerTarget}
                    onChange={(e) => setPrinterTarget(e.target.value)}
                    placeholder="POS-80C, Epson TM-T20III, COM3"
                    className="w-full h-10 px-3 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              )}

              {printerConnectionMode === "network" && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-zinc-400 mb-1">{st.lanIpAddress}</label>
                    <input
                      type="text"
                      value={printerIp}
                      onChange={(e) => setPrinterIp(e.target.value)}
                      placeholder="192.168.1.50"
                      className="w-full h-10 px-3 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">{st.port}</label>
                    <input
                      type="text"
                      value={printerPort}
                      onChange={(e) => setPrinterPort(e.target.value)}
                      placeholder="9100"
                      className="w-full h-10 px-3 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 space-y-2.5">
                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPrintReceipt}
                    onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                    className="w-4 h-4 rounded accent-white"
                  />
                  <span>{st.autoPrintCheck}</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openDrawer}
                    onChange={(e) => setOpenDrawer(e.target.checked)}
                    className="w-4 h-4 rounded accent-white"
                  />
                  <span>{st.drawerPulseCheck}</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showStoreLogo}
                    onChange={(e) => setShowStoreLogo(e.target.checked)}
                    className="w-4 h-4 rounded accent-white"
                  />
                  <span>{st.logoCheck}</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={audioFeedbackEnabled}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setAudioFeedbackEnabled(next);
                      persistAudioEnabled(next);
                      if (next) playSuccessSound();
                    }}
                    className="w-4 h-4 rounded accent-white"
                  />
                  <span>
                    {st.audioCheck}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">{st.receiptHeaderLabel}</label>
                  <input
                    type="text"
                    value={receiptHeader}
                    onChange={(e) => setReceiptHeader(e.target.value)}
                    placeholder={getReceiptTranslation(receiptLanguage).welcomeHeader}
                    className="w-full h-10 px-3 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">{st.receiptFooterLabel}</label>
                  <input
                    type="text"
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    placeholder={getReceiptTranslation(receiptLanguage).thankYou}
                    className="w-full h-10 px-3 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Supermarket Hardware & Operational Preferences */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-teal-500/20 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-bold text-teal-300">
                    {locale === "ar"
                      ? "إعدادات عتاد السوبرماركت والميزان (Mode Supermarché)"
                      : "Paramètres Matériel Supermarché & Balance"}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">Mode 1</span>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                    <span>
                      {locale === "ar"
                        ? "الماسح الضوئي USB: إدخال تلقائي (Enter) وإضافة سريعة للسلة"
                        : "Scanner USB : Auto-Enter (Ajout instantané au panier)"}
                    </span>
                    <input
                      type="checkbox"
                      checked={barcodeAutoEnter}
                      onChange={(e) => setBarcodeAutoEnter(e.target.checked)}
                      className="w-4 h-4 rounded accent-teal-400"
                    />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1 font-mono">
                        {locale === "ar" ? "بادئة باركود الميزان (EAN-13)" : "Préfixe Balance EAN-13"}
                      </label>
                      <input
                        type="text"
                        value={scaleEanPrefix}
                        onChange={(e) => setScaleEanPrefix(e.target.value)}
                        placeholder="20 / 21"
                        className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1 font-mono">
                        {locale === "ar" ? "سعر رهن قنينة الغاز (MAD)" : "Consigne Bouteille Gaz"}
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={defaultGasDeposit}
                        onChange={(e) => setDefaultGasDeposit(e.target.value)}
                        className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1 font-mono">
                        {locale === "ar" ? "سعر رهن الصندوق (MAD)" : "Consigne Caisse Plastique"}
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={defaultCrateDeposit}
                        onChange={(e) => setDefaultCrateDeposit(e.target.value)}
                        className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Receipt Preview */}
            <div className="lg:col-span-5 flex flex-col items-center">
              {(() => {
                const previewDict = getReceiptTranslation(receiptLanguage);
                return (
                  <div
                    dir="ltr"
                    className={`w-full ${
                      paperWidthMm === 58 ? "max-w-[230px]" : "max-w-xs"
                    } font-mono text-xs p-5 shadow-2xl rounded-sm ${
                      receiptPaperDark
                        ? "bg-zinc-950 text-zinc-100 border border-white/15"
                        : "bg-[#fbfbfa] text-zinc-950 border border-zinc-200"
                    }`}
                  >
                    <div className="text-center space-y-1 pb-2 border-b border-dashed border-current/40">
                      {showStoreLogo && (
                        <img
                          src={storeLogoUrl || "/logo.png"}
                          alt="Store Logo"
                          className="w-10 h-10 object-contain mx-auto mb-1 grayscale contrast-200"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      )}
                      <h4 className="font-black text-sm uppercase tracking-tight">
                        {shopName || "KASPI POS STORE"}
                      </h4>
                      <p className="text-[10px] opacity-80">{address || "Casablanca, Maroc"}</p>
                      {phone && (
                        <p className="text-[9px] opacity-75 font-mono" dir="ltr">
                          Tel: {toWesternNumerals(phone)}
                        </p>
                      )}
                      <div className="text-[9px] opacity-75 font-bold space-y-0.5" dir="ltr">
                        {ice && <p>ICE: {toWesternNumerals(ice)}</p>}
                        {(taxId || rcNumber) && (
                          <p>
                            {taxId ? `IF: ${toWesternNumerals(taxId)}` : ""}{" "}
                            {rcNumber ? `| RC: ${toWesternNumerals(rcNumber)}` : ""}
                          </p>
                        )}
                      </div>
                      {receiptHeader && (
                        <p className="text-[10px] italic pt-0.5">{receiptHeader}</p>
                      )}
                    </div>

                    <div className="py-2 space-y-1 text-[10px] border-b border-dashed border-current/40">
                      <div className="flex justify-between">
                        <span>{previewDict.invoiceNo} :</span>
                        <span className="font-bold" dir="ltr">
                          FAC-2026-000412
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{previewDict.date} :</span>
                        <span dir="ltr">{formatReceiptDate(new Date(), receiptLanguage)}</span>
                      </div>
                    </div>

                    <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-current/40">
                      <div className="flex justify-between">
                        <span>
                          {receiptLanguage === "ar"
                            ? "1x قهوة أرابيكا"
                            : receiptLanguage === "en"
                            ? "1x Arabica Coffee"
                            : "1x Café Arabica"}
                        </span>
                        <span dir="ltr">{formatReceiptAmount(18.0)} MAD</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-current/20">
                        <span>{previewDict.grandTotal} :</span>
                        <span dir="ltr">{formatReceiptAmount(18.0)} MAD</span>
                      </div>
                    </div>

                    <div className="pt-2 text-center text-[9px] opacity-75">
                      <p className="font-bold">{receiptFooter || previewDict.thankYou}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}



      {/* =================================================================== */}
      {/* TAB 4: USER & ROLES                                                 */}
      {/* =================================================================== */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="kaspi-frosted-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">
                  {st.rbacTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={fetchMeProfile}
                className="h-8 px-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-zinc-300 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{st.refreshBtn}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
                <span className="text-[11px] text-zinc-400">{st.connectedUser}</span>
                <div className="text-sm font-bold text-white mt-1">
                  {currentUser?.fullName || (locale === "ar" ? "مالك كاسبي" : locale === "fr" ? "Propriétaire KASPI" : "KASPI Owner")}
                </div>
                <div className="text-xs text-zinc-400 font-mono mt-0.5" dir="ltr">
                  {currentUser?.email || "admin@kaspipos.com"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
                <span className="text-[11px] text-zinc-400">{st.rolePrivileges}</span>
                <div className="text-sm font-bold text-emerald-400 uppercase font-mono mt-1">
                  {currentUser?.role || "OWNER"}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {st.fullAccess}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
                <span className="text-[11px] text-zinc-400">{st.authorizedDevices}</span>
                <div className="text-sm font-bold text-white font-mono mt-1">
                  {currentUser?.maxDevices || 3} {locale === "ar" ? "أجهزة نقطة بيع" : locale === "fr" ? "Terminaux POS" : "POS Terminals"}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {st.cloudOfflineSync}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: E-COMMERCE SYNC HUB (YOUCAN & SHOPIFY)                       */}
      {/* =================================================================== */}
      {activeTab === "ecommerce" && (
        <div className="space-y-6">
          <div className="kaspi-frosted-card rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-bold shadow-xs">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t.settings.ecommerceSyncTitle}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {t.settings.ecommerceSyncSubtitle}
                  </p>
                </div>
              </div>

              {/* Sync Active Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSyncActive}
                  onChange={(e) => setIsSyncActive(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                    isSyncActive ? "bg-white" : "bg-zinc-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-zinc-950 transition-transform ${
                      isSyncActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
                <span className="text-xs font-semibold text-zinc-300">
                  {t.settings.syncStockOnline}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* YouCan Platform Integration */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    YouCan Maroc
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/15">
                    Webhooks & API
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {t.settings.youcanStoreKey}
                  </label>
                  <input
                    type="password"
                    value={youcanApiKey}
                    onChange={(e) => setYoucanApiKey(e.target.value)}
                    placeholder="yc_live_xxxxxxxxxxxxxxxx"
                    className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-white"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  {locale === "ar"
                    ? "يتيح التحديث الفوري للكميات في متجرك على YouCan بمجرد إتمام أي عملية بيع في المحل."
                    : locale === "en"
                    ? "Enables instant inventory synchronization on your YouCan store upon in-store POS checkout."
                    : "Permet la mise à jour instantanée des stocks sur votre boutique YouCan lors d'un encaissement en magasin."}
                </p>
              </div>

              {/* Shopify Platform Integration */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Shopify
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/15">
                    REST & GraphQL
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {t.settings.shopifyStoreUrl}
                  </label>
                  <input
                    type="text"
                    value={shopifyStoreUrl}
                    onChange={(e) => setShopifyStoreUrl(e.target.value)}
                    placeholder="mon-magasin.myshopify.com"
                    className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {t.settings.shopifyWebhookSecret}
                  </label>
                  <input
                    type="password"
                    value={shopifySecret}
                    onChange={(e) => setShopifySecret(e.target.value)}
                    placeholder="shpss_xxxxxxxxxxxx"
                    className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>

            {/* Webhook Endpoint Info */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-white block">
                {t.settings.webhookEndpointLabel}
              </span>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 select-all">
                  /api/v1/webhooks/ecommerce
                </code>
              </div>
              <p className="text-[11px] text-zinc-500">
                {locale === "ar"
                  ? "انسخ هذا الرابط والصقه في إعدادات Webhooks في متجرك الإلكتروني على YouCan أو Shopify (الأحداث: إنشاء طلب، تعديل المخزون)."
                  : locale === "en"
                  ? "Copy this webhook URL into your YouCan or Shopify webhook settings (events: order created, inventory modified)."
                  : "Copiez cette URL dans les paramètres de Webhooks de votre boutique YouCan ou Shopify (événements supportés : commande créée, modification de stock)."}
              </p>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {ecommerceSavedFeedback && (
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {locale === "ar"
                    ? "تم حفظ إعدادات المتاجر بنجاح!"
                    : locale === "en"
                    ? "E-Commerce settings synced!"
                    : "Paramètres synchronisés !"}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("kaspi_youcan_api_key", youcanApiKey);
                  localStorage.setItem("kaspi_shopify_store_url", shopifyStoreUrl);
                  localStorage.setItem("kaspi_shopify_webhook_secret", shopifySecret);
                  localStorage.setItem("kaspi_ecommerce_sync_active", String(isSyncActive));
                  setEcommerceSavedFeedback(true);
                  setTimeout(() => setEcommerceSavedFeedback(false), 2000);
                }}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition cursor-pointer shadow-xs"
              >
                {t.settings.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
