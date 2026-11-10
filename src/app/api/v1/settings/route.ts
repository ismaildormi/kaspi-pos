import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const [settings, printerRecord, workspaceRecord, payoutRecord] = await Promise.all([
      prisma.tenantSettings.findUnique({
        where: { tenantId: ctx.tenantId },
      }),
      prisma.idempotencyRecord
        .findUnique({
          where: {
            tenantId_scope_key: {
              tenantId: ctx.tenantId,
              scope: "printer_studio",
              key: "thermal_config",
            },
          },
        })
        .catch(() => null),
      prisma.idempotencyRecord
        .findUnique({
          where: {
            tenantId_scope_key: {
              tenantId: ctx.tenantId,
              scope: "workspace_config",
              key: "store_profile",
            },
          },
        })
        .catch(() => null),
      prisma.idempotencyRecord
        .findUnique({
          where: {
            tenantId_scope_key: {
              tenantId: ctx.tenantId,
              scope: "payout_studio",
              key: "payout_config",
            },
          },
        })
        .catch(() => null),
    ]);

    const printerConfig = (printerRecord?.responseBody as Record<string, any>) || {};
    const workspaceConfig = (workspaceRecord?.responseBody as Record<string, any>) || {};
    const payoutConfig = (payoutRecord?.responseBody as Record<string, any>) || {};

    return NextResponse.json({
      success: true,
      settings: {
        shopName: settings?.shopName || ctx.activeTenant?.displayName || ctx.activeTenant?.legalName || "",
        address: settings?.address || "",
        ice: settings?.ice || "",
        taxId: settings?.taxId || "",
        rcNumber: settings?.rcNumber || "",
        phone: settings?.phone || "",
        logoUrl: settings?.logoUrl || "",
        receiptHeader: settings?.receiptHeader || "Bienvenue dans notre magasin",
        receiptFooter: settings?.receiptFooter || "Merci de votre visite et à bientôt !",
        whatsappReportNumber: settings?.whatsappReportNumber || "",
        whatsappReportHour: settings?.whatsappReportHour || "21:00",
        storeTimezone: settings?.storeTimezone || "Africa/Casablanca",
        ecommerceSyncConfig: settings?.ecommerceSyncConfig || {},
        isWhatsappReportsActive: settings?.isWhatsappReportsActive ?? true,
        receiptLanguage: printerConfig.receiptLanguage || ctx.activeTenant?.locale || "fr",
        paperWidthMm: printerConfig.paperWidthMm || 80,
        printerConnectionMode: printerConfig.printerConnectionMode || "auto",
        printer: printerConfig.printer || "",
        printerIp: printerConfig.printerIp || "192.168.1.50",
        printerPort: printerConfig.printerPort || "9100",
        autoPrintReceipt: printerConfig.autoPrintReceipt ?? false,
        openDrawer: printerConfig.openDrawer ?? true,
        showStoreLogo: printerConfig.showStoreLogo ?? true,
        storeType: workspaceConfig.storeType || "grocery",
        onboardingCompleted: Boolean(workspaceConfig.onboardingCompleted),
        currency: workspaceConfig.currency || ctx.activeTenant?.currency || "MAD",
        enableKds: workspaceConfig.enableKds ?? (workspaceConfig.storeType === "restaurant"),
        enableTableGrid: workspaceConfig.enableTableGrid ?? (workspaceConfig.storeType === "restaurant"),
        enableVariantsMatrix: workspaceConfig.enableVariantsMatrix ?? (workspaceConfig.storeType === "fashion"),
        enableSerialTracking: workspaceConfig.enableSerialTracking ?? (workspaceConfig.storeType === "electronics"),
        enableWeightScale: workspaceConfig.enableWeightScale ?? (workspaceConfig.storeType === "grocery"),
        bankName: payoutConfig.bankName || "",
        bankRib: payoutConfig.bankRib || "",
        tpeTerminalId: payoutConfig.tpeTerminalId || "",
        selectedGateway: payoutConfig.selectedGateway || "cash_only",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();

    const ecommerceSyncConfig = {
      ...(body.ecommerceSyncConfig || {}),
      ...(body.youcanStoreKey !== undefined ? { youcanStoreKey: body.youcanStoreKey } : {}),
      ...(body.shopifyStoreUrl !== undefined ? { shopifyStoreUrl: body.shopifyStoreUrl } : {}),
      ...(body.shopifyWebhookSecret !== undefined ? { shopifyWebhookSecret: body.shopifyWebhookSecret } : {}),
      ...(body.syncStockOnline !== undefined ? { syncStockOnline: Boolean(body.syncStockOnline) } : {}),
    };

    const updated = await prisma.tenantSettings.upsert({
      where: { tenantId: ctx.tenantId },
      create: {
        tenantId: ctx.tenantId,
        shopName: body.shopName,
        address: body.address,
        ice: body.ice,
        taxId: body.taxId,
        rcNumber: body.rcNumber,
        phone: body.phone,
        logoUrl: body.logoUrl,
        receiptHeader: body.receiptHeader,
        receiptFooter: body.receiptFooter,
        whatsappReportNumber: body.whatsappReportNumber,
        whatsappReportHour: body.whatsappReportHour || body.nightlyReportHour || "21:00",
        storeTimezone: body.storeTimezone || "Africa/Casablanca",
        ecommerceSyncConfig,
        isWhatsappReportsActive: body.isWhatsappReportsActive ?? true,
      },
      update: {
        shopName: body.shopName,
        address: body.address,
        ice: body.ice,
        taxId: body.taxId,
        rcNumber: body.rcNumber,
        phone: body.phone,
        logoUrl: body.logoUrl,
        receiptHeader: body.receiptHeader,
        receiptFooter: body.receiptFooter,
        whatsappReportNumber: body.whatsappReportNumber,
        whatsappReportHour: body.whatsappReportHour || body.nightlyReportHour || "21:00",
        storeTimezone: body.storeTimezone || "Africa/Casablanca",
        ecommerceSyncConfig,
        isWhatsappReportsActive: body.isWhatsappReportsActive ?? true,
      },
    });

    const thermalConfig = {
      receiptLanguage: body.receiptLanguage || "fr",
      paperWidthMm: Number(body.paperWidthMm) === 58 ? 58 : 80,
      printerConnectionMode: body.printerConnectionMode || "auto",
      printer: body.printer || "",
      printerIp: body.printerIp || "192.168.1.50",
      printerPort: body.printerPort || "9100",
      autoPrintReceipt: Boolean(body.autoPrintReceipt),
      openDrawer: body.openDrawer !== undefined ? Boolean(body.openDrawer) : true,
      showStoreLogo: body.showStoreLogo !== undefined ? Boolean(body.showStoreLogo) : true,
    };

    const farFuture = new Date("2099-12-31T23:59:59Z");
    await prisma.idempotencyRecord
      .upsert({
        where: {
          tenantId_scope_key: {
            tenantId: ctx.tenantId,
            scope: "printer_studio",
            key: "thermal_config",
          },
        },
        create: {
          tenantId: ctx.tenantId,
          scope: "printer_studio",
          key: "thermal_config",
          requestHash: "thermal_config_v1",
          responseStatus: 200,
          responseBody: thermalConfig,
          expiresAt: farFuture,
        },
        update: {
          responseBody: thermalConfig,
          expiresAt: farFuture,
        },
      })
      .catch((e) => console.warn("[Settings Thermal Config Persist Warning]:", e));

    let workspaceConfig: Record<string, any> | undefined;
    if (body.storeType !== undefined || body.onboardingCompleted !== undefined) {
      const existingWs = await prisma.idempotencyRecord
        .findUnique({
          where: {
            tenantId_scope_key: {
              tenantId: ctx.tenantId,
              scope: "workspace_config",
              key: "store_profile",
            },
          },
        })
        .catch(() => null);

      const prevWs = (existingWs?.responseBody as Record<string, any>) || {};
      const nextStoreType = body.storeType || prevWs.storeType || "grocery";

      workspaceConfig = {
        ...prevWs,
        storeType: nextStoreType,
        onboardingCompleted:
          body.onboardingCompleted !== undefined
            ? Boolean(body.onboardingCompleted)
            : Boolean(prevWs.onboardingCompleted ?? true),
        currency: body.currency || prevWs.currency || "MAD",
        enableKds: body.enableKds ?? (nextStoreType === "restaurant"),
        enableTableGrid: body.enableTableGrid ?? (nextStoreType === "restaurant"),
        enableVariantsMatrix: body.enableVariantsMatrix ?? (nextStoreType === "fashion"),
        enableSerialTracking: body.enableSerialTracking ?? (nextStoreType === "electronics"),
        enableWeightScale: body.enableWeightScale ?? (nextStoreType === "grocery"),
        updatedAt: new Date().toISOString(),
      };

      await prisma.idempotencyRecord
        .upsert({
          where: {
            tenantId_scope_key: {
              tenantId: ctx.tenantId,
              scope: "workspace_config",
              key: "store_profile",
            },
          },
          create: {
            tenantId: ctx.tenantId,
            scope: "workspace_config",
            key: "store_profile",
            requestHash: "store_profile_v1",
            responseStatus: 200,
            responseBody: workspaceConfig,
            expiresAt: farFuture,
          },
          update: {
            responseBody: workspaceConfig,
            expiresAt: farFuture,
          },
        })
        .catch((e) => console.warn("[Settings Workspace Config Persist Warning]:", e));
    }

    const payoutConfig = {
      bankName: body.bankName || "",
      bankRib: body.bankRib || "",
      tpeTerminalId: body.tpeTerminalId || "",
      selectedGateway: body.selectedGateway || "cash_only",
      updatedAt: new Date().toISOString(),
    };

    await prisma.idempotencyRecord
      .upsert({
        where: {
          tenantId_scope_key: {
            tenantId: ctx.tenantId,
            scope: "payout_studio",
            key: "payout_config",
          },
        },
        create: {
          tenantId: ctx.tenantId,
          scope: "payout_studio",
          key: "payout_config",
          requestHash: "payout_config_v1",
          responseStatus: 200,
          responseBody: payoutConfig,
          expiresAt: farFuture,
        },
        update: {
          responseBody: payoutConfig,
          expiresAt: farFuture,
        },
      })
      .catch((e) => console.warn("[Settings Payout Config Persist Warning]:", e));

    return NextResponse.json({
      success: true,
      settings: {
        ...updated,
        ...thermalConfig,
        ...(workspaceConfig || {}),
        ...payoutConfig,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
