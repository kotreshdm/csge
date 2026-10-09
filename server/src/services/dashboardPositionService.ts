import { Prisma } from "@prisma/client";

import prisma from "../db/prisma.js";

const zero = () => new Prisma.Decimal(0);
const amountOrZero = (amount: Prisma.Decimal | null) => amount ?? zero();

export async function getDashboardPositions() {
  const [shareTransactions, siteTransactions, memberCounts, siteRecords] =
    await Promise.all([
      prisma.transaction.groupBy({
        by: ["memberId", "type"],
        where: { subType: "SHARE", type: { in: ["CREDIT", "DEBIT"] } },
        _sum: { shareAmount: true },
      }),
      prisma.transaction.groupBy({
        by: ["layoutId", "memberId", "type"],
        where: { subType: "SITE", type: { in: ["CREDIT", "DEBIT"] } },
        _sum: { siteDepositAmount: true },
      }),
      prisma.member.groupBy({
        by: ["memberType", "status"],
        _count: { _all: true },
      }),
      prisma.site.findMany({
        where: {
          allottedMemberId: { not: null },
          status: {
            in: ["TEMP_ALLOTTED", "ALLOTTED", "REGISTERED", "SETTLED"],
          },
        },
        select: { layoutId: true, allottedMemberId: true, status: true },
      }),
    ]);

  const shareBalances = new Map<string, Prisma.Decimal>();
  let totalShare = zero();
  let totalShareIn = zero();
  let totalShareOut = zero();
  for (const transaction of shareTransactions) {
    const amount = amountOrZero(transaction._sum.shareAmount);
    if (transaction.type === "CREDIT") totalShareIn = totalShareIn.plus(amount);
    else totalShareOut = totalShareOut.plus(amount);
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
  let regularShareIn = zero();
  let regularShareOut = zero();
  let associateShareIn = zero();
  let associateShareOut = zero();
  for (const [memberId, balance] of shareBalances) {
    const memberType = memberTypeById.get(memberId);
    if (memberType === "MEMBER") memberShare = memberShare.plus(balance);
    if (memberType === "ASSOCIATE")
      associateShare = associateShare.plus(balance);
  }
  for (const transaction of shareTransactions) {
    if (transaction.memberId === null) continue;

    const memberType = memberTypeById.get(transaction.memberId.toString());
    const amount = amountOrZero(transaction._sum.shareAmount);
    if (memberType === "MEMBER" && transaction.type === "CREDIT") {
      regularShareIn = regularShareIn.plus(amount);
    } else if (memberType === "MEMBER") {
      regularShareOut = regularShareOut.plus(amount);
    } else if (memberType === "ASSOCIATE" && transaction.type === "CREDIT") {
      associateShareIn = associateShareIn.plus(amount);
    } else if (memberType === "ASSOCIATE") {
      associateShareOut = associateShareOut.plus(amount);
    }
  }

  let totalSiteDeposit = zero();
  const depositsByLayout = new Map<string, Prisma.Decimal>();
  const layoutIncoming = new Map<string, Prisma.Decimal>();
  const layoutOutgoing = new Map<string, Prisma.Decimal>();
  const layoutMembers = new Map<string, Map<string, Prisma.Decimal>>();
  const layoutSiteMembers = new Map<
    string,
    { allotted: Set<string>; registered: Set<string>; settled: Set<string> }
  >();
  for (const site of siteRecords) {
    if (site.allottedMemberId === null) continue;
    const layoutId = site.layoutId.toString();
    const memberId = site.allottedMemberId.toString();
    const members = layoutSiteMembers.get(layoutId) ?? {
      allotted: new Set<string>(),
      registered: new Set<string>(),
      settled: new Set<string>(),
    };
    if (site.status === "TEMP_ALLOTTED" || site.status === "ALLOTTED") {
      members.allotted.add(memberId);
    } else if (site.status === "REGISTERED") {
      members.registered.add(memberId);
    } else if (site.status === "SETTLED") {
      members.settled.add(memberId);
    }
    layoutSiteMembers.set(layoutId, members);
  }
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
      if (transaction.type === "CREDIT") {
        layoutIncoming.set(
          layoutId,
          (layoutIncoming.get(layoutId) ?? zero()).plus(amount),
        );
      } else {
        layoutOutgoing.set(
          layoutId,
          (layoutOutgoing.get(layoutId) ?? zero()).plus(amount),
        );
      }
      if (transaction.memberId !== null) {
        const memberId = transaction.memberId.toString();
        const members =
          layoutMembers.get(layoutId) ?? new Map<string, Prisma.Decimal>();
        members.set(
          memberId,
          (members.get(memberId) ?? zero()).plus(signedAmount),
        );
        layoutMembers.set(layoutId, members);
      }
    }
  }

  const notAllottedByLayout = new Map<string, number>();
  for (const [layoutId, memberBalances] of layoutMembers) {
    const siteMembers = layoutSiteMembers.get(layoutId);
    const assignedMemberIds = new Set([
      ...(siteMembers?.allotted ?? []),
      ...(siteMembers?.registered ?? []),
      ...(siteMembers?.settled ?? []),
    ]);
    let count = 0;
    for (const [memberId, balance] of memberBalances) {
      if (balance.greaterThan(0) && !assignedMemberIds.has(memberId)) {
        count += 1;
      }
    }
    notAllottedByLayout.set(layoutId, count);
  }
  const siteMemberTotals = [...layoutSiteMembers.entries()].reduce(
    (totals, [layoutId, members]) => {
      totals.allotted += members.allotted.size;
      totals.registered += members.registered.size;
      totals.settled += members.settled.size;
      totals.notAllotted += notAllottedByLayout.get(layoutId) ?? 0;
      return totals;
    },
    { allotted: 0, registered: 0, settled: 0, notAllotted: 0 },
  );
  for (const [layoutId, count] of notAllottedByLayout) {
    if (!layoutSiteMembers.has(layoutId)) siteMemberTotals.notAllotted += count;
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
        totalInAmount: (layoutIncoming.get(id) ?? zero()).toString(),
        totalOutAmount: (layoutOutgoing.get(id) ?? zero()).toString(),
        uniqueMemberCount: [...(layoutMembers.get(id)?.values() ?? [])].filter(
          (balance) => balance.greaterThan(0),
        ).length,
        allottedMemberCount: layoutSiteMembers.get(id)?.allotted.size ?? 0,
        registeredMemberCount: layoutSiteMembers.get(id)?.registered.size ?? 0,
        settledMemberCount: layoutSiteMembers.get(id)?.settled.size ?? 0,
        notAllottedMemberCount: notAllottedByLayout.get(id) ?? 0,
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
      totalInAmount: totalShareIn.toString(),
      totalOutAmount: totalShareOut.toString(),
      memberAmount: memberShare.toString(),
      associateAmount: associateShare.toString(),
      regularShareInAmount: regularShareIn.toString(),
      regularShareOutAmount: regularShareOut.toString(),
      associateShareInAmount: associateShareIn.toString(),
      associateShareOutAmount: associateShareOut.toString(),
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
      totalInAmount: [...layoutIncoming.values()]
        .reduce((total, amount) => total.plus(amount), zero())
        .toString(),
      totalOutAmount: [...layoutOutgoing.values()]
        .reduce((total, amount) => total.plus(amount), zero())
        .toString(),
      uniqueMemberCount: new Set(
        [...layoutMembers.values()].flatMap((members) =>
          [...members.entries()]
            .filter(([, balance]) => balance.greaterThan(0))
            .map(([memberId]) => memberId),
        ),
      ).size,
      allottedMemberCount: siteMemberTotals.allotted,
      registeredMemberCount: siteMemberTotals.registered,
      settledMemberCount: siteMemberTotals.settled,
      notAllottedMemberCount: siteMemberTotals.notAllotted,
      layouts: layoutDeposits,
    },
  };
}
