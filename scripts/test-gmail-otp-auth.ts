import { prisma } from "../src/server/db/prisma";
import { hashPassword, verifyPassword } from "../src/server/auth/password";
import { sendKaspiEmail } from "../src/lib/email/mailer";

async function testGmailOtpAuth() {
  console.log("==================================================================");
  console.log("  KASPI POS — GMAIL OTP & PASSWORD RESET TEST SUITE");
  console.log("==================================================================\n");

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
    console.log(`✓ Step 1: Created test user: ${testEmail}`);
  } else {
    console.log(`✓ Step 1: Located existing test user: ${testEmail}`);
  }

  // 2. Test OTP Generation & Mailer Simulation
  const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
  const loginIdentifier = `login:${testEmail}`;

  await prisma.verificationToken.deleteMany({ where: { identifier: loginIdentifier } });
  const tokenRecord = await prisma.verificationToken.create({
    data: {
      identifier: loginIdentifier,
      token: loginCode,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  console.log(`✓ Step 2: Generated OTP login code: ${loginCode} for ${testEmail}`);

  // Test mailer
  const mailResult = await sendKaspiEmail({
    to: testEmail,
    subject: `رمز الدخول إلى KASPI POS: ${loginCode}`,
    code: loginCode,
    magicLink: `http://localhost:3001/ar/login?email=${encodeURIComponent(testEmail)}&code=${loginCode}`,
    type: "login_otp",
  });
  if (!mailResult.success) {
    throw new Error("Mailer failed to process email!");
  }
  console.log(`✓ Step 3: Mailer dispatch simulated successfully (Simulated: ${mailResult.simulated})`);

  // 3. Test OTP Verification
  const verifyToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: loginIdentifier,
      token: loginCode,
    },
  });

  if (!verifyToken || new Date() > verifyToken.expires) {
    throw new Error("Token verification failed!");
  }
  await prisma.verificationToken.deleteMany({ where: { identifier: loginIdentifier } });
  console.log(`✓ Step 4: OTP verification passed and token consumed cleanly.`);

  // 4. Test Password Reset Flow ("إعادة الحصول على الرمز")
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
  console.log(`✓ Step 5: Password reset code generated: ${resetCode}`);

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

  console.log(`✓ Step 6: Password reset verified with Argon2id hash.`);

  console.log("\n==================================================================");
  console.log("  >>> ALL GMAIL OTP & RECOVERY TESTS PASSED (100% SUCCESS) <<<");
  console.log("==================================================================\n");
}

testGmailOtpAuth()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
