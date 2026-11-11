import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { verifyPassword } from "@/server/auth/password";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const { action, password, data } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "كلمة المرور مطلوبة للوصول إلى الخزنة" },
        { status: 400 }
      );
    }

    // 1. Fetch current user with password hash
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "تعذر العثور على بيانات الأمان للحساب" },
        { status: 403 }
      );
    }

    // 2. Verify account password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "كلمة المرور غير صحيحة. تم رفض الوصول إلى الخزنة" },
        { status: 401 }
      );
    }

    // 3. ACTION: UNLOCK -> Return sensitive vault data
    if (action === "unlock") {
      const [settings, payoutRecord] = await Promise.all([
        prisma.tenantSettings.findUnique({
          where: { tenantId: ctx.tenantId },
        }),
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

      const payoutConfig = (payoutRecord?.responseBody as Record<string, any>) || {};

      return NextResponse.json({
        success: true,
        vault: {
          email: user.email,
          fullName: user.fullName || "",
          logoUrl: settings?.logoUrl || "",
          shopName: settings?.shopName || ctx.activeTenant?.displayName || "",
          ownerPhone: settings?.whatsappReportNumber || settings?.phone || "",
          bankName: payoutConfig.bankName || "",
          bankRib: payoutConfig.bankRib || "",
          tpeTerminalId: payoutConfig.tpeTerminalId || "",
          selectedGateway: payoutConfig.selectedGateway || "cash_only",
        },
      });
    }

    // 4. ACTION: SAVE -> Persist sensitive data
    if (action === "save") {
      const {
        logoUrl,
        shopName,
        ownerPhone,
        bankName,
        bankRib,
        tpeTerminalId,
        selectedGateway,
        fullName,
      } = data || {};

      // Update tenant settings (Logo, ShopName, WhatsApp/Phone)
      await prisma.tenantSettings.upsert({
        where: { tenantId: ctx.tenantId },
        create: {
          tenantId: ctx.tenantId,
          logoUrl: logoUrl || null,
          shopName: shopName || ctx.activeTenant?.displayName || "",
          whatsappReportNumber: ownerPhone || null,
          phone: ownerPhone || null,
        },
        update: {
          logoUrl: logoUrl !== undefined ? logoUrl : undefined,
          shopName: shopName !== undefined ? shopName : undefined,
          whatsappReportNumber: ownerPhone !== undefined ? ownerPhone : undefined,
          phone: ownerPhone !== undefined ? ownerPhone : undefined,
        },
      });

      // Update User FullName if provided
      if (fullName && fullName.trim()) {
        await prisma.user.update({
          where: { id: user.id },
          data: { fullName: fullName.trim() },
        });
      }

      // Update Payout Config in IdempotencyRecord
      const currentPayoutRecord = await prisma.idempotencyRecord
        .findUnique({
          where: {
            tenantId_scope_key: {
              tenantId: ctx.tenantId,
              scope: "payout_studio",
              key: "payout_config",
            },
          },
        })
        .catch(() => null);

      const existingPayout = (currentPayoutRecord?.responseBody as Record<string, any>) || {};
      const newPayoutConfig = {
        ...existingPayout,
        ...(bankName !== undefined ? { bankName: String(bankName).trim() } : {}),
        ...(bankRib !== undefined ? { bankRib: String(bankRib).trim().replace(/\s+/g, "") } : {}),
        ...(tpeTerminalId !== undefined ? { tpeTerminalId: String(tpeTerminalId).trim() } : {}),
        ...(selectedGateway !== undefined ? { selectedGateway: String(selectedGateway).trim() } : {}),
        updatedAt: new Date().toISOString(),
      };

      await prisma.idempotencyRecord.upsert({
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
          requestHash: "vault_payout_config",
          responseStatus: 200,
          expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000 * 10),
          responseBody: newPayoutConfig,
        },
        update: {
          responseBody: newPayoutConfig,
        },
      });

      return NextResponse.json({
        success: true,
        message: "تم تحديث خزنة المالك والبيانات البنكية بنجاح",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[Owner Vault Error]:", err);
    return NextResponse.json({ error: err.message || "Vault error" }, { status: 500 });
  }
}
