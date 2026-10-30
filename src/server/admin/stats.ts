import { prisma } from "@/server/db/prisma";
import { toDecimal, roundMoney } from "@/domain/money";

export interface AdminDashboardStats {
  totalTenants: number;
  activeSubscriptions: number;
  mrrUsd: string;
  totalGmvMad: string;
  newTenantsThisMonth: number;
  totalAiMessages: number;
  tenants: Array<{
    id: string;
    legalName: string;
    displayName: string;
    slug: string;
    ice: string | null;
    city: string | null;
    status: string;
    createdAt: string;
    storesCount: number;
    usersCount: number;
    subscription: {
      status: string;
      planCode: string;
      currentPeriodEnd: string | null;
    } | null;
  }>;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Total Tenants & Growth
  const totalTenants = await prisma.tenant.count();
  const newTenantsThisMonth = await prisma.tenant.count({
    where: { createdAt: { gte: startOfMonth } },
  });

  // 2. Active Subscriptions & MRR calculation
  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: "active" },
    include: { plan: true },
  });

  let calculatedMrr = toDecimal(0);
  for (const sub of activeSubscriptions) {
    if (sub.plan) {
      const price = toDecimal(sub.plan.price);
      if (sub.billingInterval === "yearly") {
        calculatedMrr = calculatedMrr.plus(price.dividedBy(12));
      } else {
        calculatedMrr = calculatedMrr.plus(price);
      }
    } else {
      // Default Kasbi POS All-in-One standard rate: $10/mo
      calculatedMrr = calculatedMrr.plus(10);
    }
  }

  // 3. Platform Gross Merchandise Value (GMV in MAD across all tenants)
  const salesAgg = await prisma.sale.aggregate({
    where: { status: "completed" },
    _sum: { grandTotal: true },
  });
  const totalGmvMad = toDecimal(salesAgg._sum.grandTotal || 0).toFixed(2);

  // 3b. Total AI Messages Consumed across the SaaS platform
  const totalAiMessages = await prisma.aIChatMessage.count();

  // 4. Detailed Tenants List with subscriptions and member counts
  const rawTenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          stores: true,
          memberships: true,
        },
      },
    },
  });

  const tenants = rawTenants.map((t) => {
    const latestSub = t.subscriptions[0] || null;
    return {
      id: t.id,
      legalName: t.legalName,
      displayName: t.displayName,
      slug: t.slug,
      ice: t.ice,
      city: t.city,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      storesCount: t._count.stores,
      usersCount: t._count.memberships,
      subscription: latestSub
        ? {
            status: latestSub.status,
            planCode: latestSub.planCode,
            currentPeriodEnd: latestSub.currentPeriodEnd
              ? latestSub.currentPeriodEnd.toISOString()
              : null,
          }
        : null,
    };
  });

  return {
    totalTenants,
    activeSubscriptions: activeSubscriptions.length,
    mrrUsd: roundMoney(calculatedMrr).toFixed(2),
    totalGmvMad,
    newTenantsThisMonth,
    totalAiMessages,
    tenants,
  };
}
