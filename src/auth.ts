import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { verifyPassword, hashPassword } from "@/server/auth/password";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
  otpCode: z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days persistent session
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days persistent token
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otpCode: { label: "OTP Code", type: "text" },
      },
      async authorize(credentials) {
        const parsed = CredentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          console.error("[NextAuth Authorize] Validation failed:", parsed.error.flatten());
          return null;
        }

        const { email, password, otpCode } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();
        console.log(`[NextAuth Authorize] Validating credentials for: "${normalizedEmail}" (hasPassword: ${Boolean(password)}, hasOtp: ${Boolean(otpCode)})`);

        if (!password && !otpCode) {
          console.error("[NextAuth Authorize] FAILED: Neither password nor otpCode provided.");
          return null;
        }

        try {
          // If authenticating via Email OTP Code
          if (otpCode) {
            const tokenRecord = await prisma.verificationToken.findFirst({
              where: {
                identifier: { in: [`login:${normalizedEmail}`, normalizedEmail] },
                token: otpCode.trim(),
              },
            });

            if (!tokenRecord || new Date() > tokenRecord.expires) {
              console.error(`[NextAuth Authorize] FAILED: Invalid or expired OTP code for "${normalizedEmail}".`);
              return null;
            }

            // Valid code consumed
            await prisma.verificationToken.deleteMany({
              where: {
                identifier: { in: [`login:${normalizedEmail}`, normalizedEmail] },
              },
            });
          }

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: {
              memberships: {
                where: { status: "active" },
              },
            },
          });

          if (!user) {
            console.error(`[NextAuth Authorize] FAILED: User "${normalizedEmail}" not found in database.`);
            return null;
          }

          if (!user.isActive) {
            console.error(`[NextAuth Authorize] FAILED: User "${normalizedEmail}" is deactivated.`);
            return null;
          }

          // If authenticating with password (and not OTP)
          if (!otpCode && password) {
            if (!user.passwordHash) {
              console.log(
                `[NextAuth Authorize] User "${normalizedEmail}" has no passwordHash. Setting initial password.`
              );
              const newHash = await hashPassword(password);
              await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: newHash },
              });
              user.passwordHash = newHash;
            } else {
              const isValid = await verifyPassword(user.passwordHash, password);
              if (!isValid) {
                console.error(`[NextAuth Authorize] FAILED: Password mismatch for user "${normalizedEmail}".`);
                return null;
              }
            }
          }

          console.log(
            `[NextAuth Authorize] SUCCESS: User "${normalizedEmail}" authenticated. isSuperAdmin=${user.isSuperAdmin}`
          );

          return {
            id: user.id,
            email: user.email,
            name: user.fullName || user.name,
            image: user.image,
            isSuperAdmin: user.isSuperAdmin,
          };
        } catch (dbErr) {
          console.error(`[NextAuth Authorize] Database error during authentication:`, dbErr);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isSuperAdmin = (user as any).isSuperAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).isSuperAdmin = token.isSuperAdmin;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
