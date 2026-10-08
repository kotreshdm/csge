import { Prisma } from "@prisma/client";

import prisma from "../db/prisma.js";

const zero = () => new Prisma.Decimal(0);
const amountOrZero = (amount: Prisma.Decimal | null) => amount ?? zero();

export async function getDashboardPositions() {
  const [shareTransactions, siteTransactions, memberCounts] = await Promise.all(
    [
      prisma.transaction.groupBy({
        by: ["memberId", "type"],
        where: { subType: "SHARE", type: { in: ["CREDIT", "DEBIT"] } },
        _sum: { shareAmount: true },
      }),
      prisma.transaction.groupBy({
        by: ["layoutId", "type"],
        where: { subType: "SITE", type: { in: ["CREDIT", "DEBIT"] } },
        _sum: { siteDepositAmount: true },
      }),
      prisma.member.groupBy({
        by: ["memberType", "status"],
        _count: { _all: true },
      }),
    ],
  );

  const shareBalances = new Map<string, Prisma.Decimal>();
  let totalShare = zero();
  for (const transaction of shareTransactions) {
    const amount = amountOrZero(transaction._sum.shareAmount);
    const signedAmount =
      transaction.type === "CREDIT" ? amount : amount.negated();
    totalShare = totalShare.plus(signedAmount);
    if (transaction.memberId !== null) {
      const memberId = transaction.memberId.toString();
      shareBalances.set(
        memberId,
        (shareBalances.get(memberId) ?? zero()).plus(signedAmount),
      );
    }
  }

  const membersWithShareBalances = shareBalances.size
    ? await prisma.member.findMany({
        where: { memberId: { in: [...shareBalances.keys()].map(BigInt) } },
        select: { memberId: true, memberType: true },
      })
    : [];
  const memberTypeById = new Map(
    membersWithShareBalances.map((member) => [
      member.memberId.toString(),
      member.memberType,
    ]),
  );
  let memberShare = zero();
  let associateShare = zero();
  for (const [memberId, balance] of shareBalances) {
    const memberType = memberTypeById.get(memberId);
    if (memberType === "MEMBER") memberShare = memberShare.plus(balance);
    if (memberType === "ASSOCIATE")
      associateShare = associateShare.plus(balance);
  }

  let totalSiteDeposit = zero();
  const depositsByLayout = new Map<string, Prisma.Decimal>();
  for (const transaction of siteTransactions) {
    const amount = amountOrZero(transaction._sum.siteDepositAmount);
    const signedAmount =
      transaction.type === "CREDIT" ? amount : amount.negated();
    totalSiteDeposit = totalSiteDeposit.plus(signedAmount);
    if (transaction.layoutId !== null) {
      const layoutId = transaction.layoutId.toString();
      depositsByLayout.set(
        layoutId,
        (depositsByLayout.get(layoutId) ?? zero()).plus(signedAmount),
      );
    }
  }

  const layoutRows = depositsByLayout.size
    ? await prisma.layout.findMany({
        where: { id: { in: [...depositsByLayout.keys()].map(BigInt) } },
        select: { id: true, layoutCode: true, name: true },
      })
    : [];
  const layoutsById = new Map(
    layoutRows.map((layout) => [layout.id.toString(), layout]),
  );
  const layoutDeposits = [...depositsByLayout.entries()]
    .map(([id, amount]) => {
      const layout = layoutsById.get(id);
      return {
        id,
        name: layout?.name ?? "Unknown layout",
        layoutCode: layout?.layoutCode ?? "",
        amount: amount.toString(),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const countByTypeAndStatus = new Map(
    memberCounts.map((group) => [
      `${group.memberType}:${group.status}`,
      group._count._all,
    ]),
  );

  const regularActiveMemberCount =
    countByTypeAndStatus.get("MEMBER:ACTIVE") ?? 0;
  const regularInactiveMemberCount =
    countByTypeAndStatus.get("MEMBER:INACTIVE") ?? 0;
  const associateActiveMemberCount =
    countByTypeAndStatus.get("ASSOCIATE:ACTIVE") ?? 0;
  const associateInactiveMemberCount =
    countByTypeAndStatus.get("ASSOCIATE:INACTIVE") ?? 0;
  const regularMemberCount =
    regularActiveMemberCount + regularInactiveMemberCount;
  const associateMemberCount =
    associateActiveMemberCount + associateInactiveMemberCount;

  return {
    share: {
      totalAmount: totalShare.toString(),
      memberAmount: memberShare.toString(),
      associateAmount: associateShare.toString(),
      totalMemberCount: regularMemberCount + associateMemberCount,
      regularMemberCount,
      associateMemberCount,
      regularActiveMemberCount,
      regularInactiveMemberCount,
      associateActiveMemberCount,
      associateInactiveMemberCount,
    },
    siteDeposit: {
      totalAmount: totalSiteDeposit.toString(),
      layouts: layoutDeposits,
    },
  };
}
