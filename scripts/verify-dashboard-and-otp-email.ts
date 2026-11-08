import "dotenv/config";
import { prisma } from "../src/server/db/prisma";
import { ensureUserHasActiveTenant } from "../src/server/auth/context";
import { sendKaspiEmail, generateArabicEmailHtml } from "../src/lib/email/mailer";

async function main() {
  console.log("=== [1/3] VERIFYING USER & TENANT MEMBERSHIP FOR dormiismail02@gmail.com ===");
  const targetEmail = "dormiismail02@gmail.com";

  let user = await prisma.user.findUnique({
    where: { email: targetEmail },
    include: {
      memberships: {
        where: { status: "active" },
        include: { tenant: true },
      },
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: targetEmail,
        name: "Ismail Dormi",
        fullName: "Ismail Dormi",
        emailVerified: new Date(),
        isActive: true,
      },
      include: {
        memberships: {
          where: { status: "active" },
          include: { tenant: true },
        },
      },
    });
  }

  const memberships = await ensureUserHasActiveTenant(
    user.id,
    user.email,
    user.fullName || user.name
  );

  const activeTenant = memberships[0]?.tenant;
  if (!activeTenant) {
    throw new Error("Failed to provision active tenant for user!");
  }

  console.log(
    `✅ User verified: ${user.email} | Active Tenant: ${activeTenant.displayName} (${activeTenant.id})`
  );

  console.log("\n=== [2/3] SIMULATING /dashboard SERVER COMPONENT QUERIES ===");
  const tenantId = activeTenant.id;
  const [productsCount, salesCount, customersCount, workspaceRecord, salesAgg] =
    await Promise.all([
      prisma.product.count({ where: { tenantId } }),
      prisma.sale.count({ where: { tenantId, status: "completed" } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.idempotencyRecord.findUnique({
        where: {
          tenantId_scope_key: {
            tenantId,
            scope: "workspace_config",
            key: "store_profile",
          },
        },
      }),
      prisma.sale.aggregate({
        where: { tenantId, status: "completed" },
        _sum: { grandTotal: true },
      }),
    ]);

  console.log("✅ Dashboard Server Queries Succeeded with 0 exceptions:", {
    productsCount,
    salesCount,
    customersCount,
    hasWorkspaceProfile: Boolean(workspaceRecord),
    totalSalesMad: Number(salesAgg._sum.grandTotal || 0).toFixed(2),
  });

  console.log("\n=== [3/3] VERIFYING REDESIGNED OTP EMAIL (NO MAGIC LINK + COPY CODE BOX) ===");
  const testCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Save token in DB so user can also test logging in with it if desired
  await prisma.verificationToken.deleteMany({
    where: { identifier: `login:${targetEmail}` },
  });
  await prisma.verificationToken.create({
    data: {
      identifier: `login:${targetEmail}`,
      token: testCode,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const html = generateArabicEmailHtml({
    to: targetEmail,
    subject: `رمز التحقق KASPI POS: ${testCode} • Your verification code is ${testCode}`,
    code: testCode,
    type: "login_otp",
  });

  if (html.includes("اضغط هنا للدخول المباشر") || html.includes("<a href=")) {
    throw new Error(" Regression detected: Magic Link is still present in OTP email HTML!");
  }
  if (!html.includes("user-select: all") || !html.includes("application/ld+json")) {
    throw new Error(" Missing copy-code box or LD+JSON schema in OTP email HTML!");
  }

  const emailRes = await sendKaspiEmail({
    to: targetEmail,
    subject: `رمز التحقق KASPI POS: ${testCode} • Your verification code is ${testCode}`,
    code: testCode,
    type: "login_otp",
  });

  if (!emailRes.success) {
    throw new Error(`SMTP Delivery Failed: ${emailRes.error}`);
  }

  console.log(`✅ Live Redesigned OTP Email Delivered to ${targetEmail}!`);
  console.log(`   Code: ${testCode}`);
  console.log(`   Message ID: ${emailRes.messageId}`);
  console.log(`   SMTP Response: ${emailRes.response}`);
}

main()
  .catch((err) => {
    console.error("❌ VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
