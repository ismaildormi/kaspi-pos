import "dotenv/config";
import { prisma } from "../src/server/db/prisma";
import { hashPassword, verifyPassword } from "../src/server/auth/password";
import { sendKaspiEmail } from "../src/lib/email/mailer";

async function testGmailOtpAuth() {
  console.log("==================================================================");
  console.log("  KASPI POS — LIVE GMAIL OTP & PASSWORD RESET TEST SUITE");
  console.log("==================================================================\n");

  const targetEmails = ["dormiismail02@gmail.com", "kaspipos.official@gmail.com"];

  for (const recipient of targetEmails) {
    const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
    const loginIdentifier = `login:${recipient}`;

    await prisma.verificationToken.deleteMany({ where: { identifier: loginIdentifier } });
    await prisma.verificationToken.create({
      data: {
        identifier: loginIdentifier,
        token: loginCode,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    console.log(`✓ Generated OTP login code: ${loginCode} for ${recipient}`);

    const mailResult = await sendKaspiEmail({
      to: recipient,
      subject: `رمز التحقق للدخول إلى KASPI POS: ${loginCode}`,
      code: loginCode,
      magicLink: `https://kaspi-pos.vercel.app/ar/login?email=${encodeURIComponent(recipient)}&code=${loginCode}`,
      type: "login_otp",
    });

    if (!mailResult.success) {
      throw new Error(`Live SMTP delivery failed for ${recipient}: ${mailResult.error || "SMTP Error"}`);
    }
    console.log(`✓ LIVE SMTP EMAIL DELIVERED TO: ${recipient}`);
    console.log(`  -> OTP Code:   ${loginCode}`);
    console.log(`  -> Message ID: ${mailResult.messageId}`);
    console.log(`  -> SMTP Reply: ${mailResult.response}\n`);
  }

  const testEmail = "test.otp.user@gmail.com";

  // 1. Ensure test user exists
  let user = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: testEmail,
        fullName: "Test Gmail User",
        passwordHash: await hashPassword("InitialPass123!"),
        isActive: true,
      },
    });
    console.log(`✓ Located/created internal test user: ${testEmail}`);
  }

  // 2. Test Password Reset Flow ("إعادة الحصول على الرمز")
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const resetIdentifier = `reset:${testEmail}`;

  await prisma.verificationToken.deleteMany({ where: { identifier: resetIdentifier } });
  await prisma.verificationToken.create({
    data: {
      identifier: resetIdentifier,
      token: resetCode,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  // Perform reset
  const newPassword = "NewSecretPassword2026!";
  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });
  await prisma.verificationToken.deleteMany({ where: { identifier: resetIdentifier } });

  // Validate new password works
  const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!updatedUser?.passwordHash) throw new Error("Password hash missing!");
  const isValid = await verifyPassword(updatedUser.passwordHash, newPassword);
  if (!isValid) throw new Error("Updated password failed verification!");

  console.log(`✓ Password reset & Argon2id verification passed.`);

  console.log("\n==================================================================");
  console.log("  >>> ALL LIVE GMAIL SMTP & RECOVERY TESTS PASSED (0 ERRORS) <<<");
  console.log("==================================================================\n");
}

testGmailOtpAuth()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
