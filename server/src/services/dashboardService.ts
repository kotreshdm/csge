import { Prisma } from "@prisma/client";

import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";

const feeFields = [
  "shareFeeAmount",
  "membershipFeeAmount",
  "welfareFundAmount",
  "booksFormsAmount",
  "miscellaneousAmount",
] as const;

type Balance = { share: Prisma.Decimal; siteDeposit: Prisma.Decimal };
type BalanceGroup = {
  memberId: bigint | null;
  type: string;
  direction: string;
  layoutId: bigint | null;
  fromLayoutId: bigint | null;
  toLayoutId: bigint | null;
  _sum: {
    shareAmount: Prisma.Decimal | null;
    siteDepositAmount: Prisma.Decimal | null;
  };
};

const zero = () => new Prisma.Decimal(0);
const decimal = (value: Prisma.Decimal | null | undefined) => value ?? zero();
const emptyBalance = (): Balance => ({ share: zero(), siteDeposit: zero() });

function parseFinancialYear(value: string) {
  const match = /^(\d{4})-(\d{4})$/.exec(value);
  if (!match || Number(match[2]) !== Number(match[1]) + 1) {
    throw new AppError(400, "Financial year must use YYYY-YYYY format.");
  }
  const startYear = Number(match[1]);
  return {
    label: `${startYear}-${startYear + 1}`,
    startYear,
    start: new Date(Date.UTC(startYear, 3, 1)),
    end: new Date(Date.UTC(startYear + 1, 3, 1)),
  };
}

function currentFinancialYearStart() {
  const today = new Date();
  return today.getUTCMonth() >= 3
    ? today.getUTCFullYear()
    : today.getUTCFullYear() - 1;
}

function calculateBalances(groups: BalanceGroup[]) {
  const balances = new Map<string, Balance>();
  for (const group of groups) {
    if (group.memberId === null) continue;
    const key = group.memberId.toString();
    const balance = balances.get(key) ?? emptyBalance();
    const sign = group.direction === "IN" ? 1 : group.direction === "OUT" ? -1 : 0;
    if (group.type === "SHARE") {
      const share = decimal(group._sum.shareAmount);
      balance.share =
        sign > 0 ? balance.share.plus(share) : balance.share.minus(share);
    } else if (group.type === "LAYOUT") {
      const deposit = decimal(group._sum.siteDepositAmount);
      balance.siteDeposit =
        group.direction === "TRANSFER"
          ? balance.siteDeposit
          : sign > 0
            ? balance.siteDeposit.plus(deposit)
            : balance.siteDeposit.minus(deposit);
    }
    balances.set(key, balance);
  }
  return balances;
}

function serializeBalance(balance: Balance) {
  return {
    share: balance.share.toString(),
    siteDeposit: balance.siteDeposit.toString(),
  };
}

function formatLocalDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function balancesAsOf(endExclusive: Date, memberIds?: bigint[]) {
  const groups = await prisma.transaction.groupBy({
    by: [
      "memberId",
      "type",
      "direction",
      "layoutId",
      "fromLayoutId",
      "toLayoutId",
    ],
    where: {
      memberId: memberIds ? { in: memberIds } : { not: null },
      transactionDate: { lt: endExclusive },
      type: { in: ["SHARE", "LAYOUT"] },
      direction: { in: ["IN", "OUT", "TRANSFER"] },
    },
    _sum: { shareAmount: true, siteDepositAmount: true },
  });
  return calculateBalances(groups as BalanceGroup[]);
}

export async function getAvailableFinancialYears() {
  const dates = await prisma.transaction.findMany({
    select: { transactionDate: true },
    distinct: ["transactionDate"],
    orderBy: { transactionDate: "desc" },
  });
  const startYears = new Set<number>([currentFinancialYearStart()]);
  for (const { transactionDate } of dates) {
    startYears.add(
      transactionDate.getUTCMonth() >= 3
        ? transactionDate.getUTCFullYear()
        : transactionDate.getUTCFullYear() - 1,
    );
  }
  return [...startYears]
    .sort((a, b) => b - a)
    .map((year) => `${year}-${year + 1}`);
}

function expenseValue(group: {
  type: string;
  direction: string;
  _sum: { otherAmount: Prisma.Decimal | null };
}) {
  return group.type === "EXPENSE" && group.direction === "OUT"
    ? decimal(group._sum.otherAmount)
    : zero();
}

function incomeValue(group: {
  type: string;
  direction: string;
  _sum: Record<string, Prisma.Decimal | null>;
}) {
  if (group.type === "INCOME" && group.direction === "IN") {
    return decimal(group._sum.otherAmount);
  }
  if (group.type !== "SHARE" || group.direction !== "IN") return zero();
  return feeFields.reduce(
    (sum, field) => sum.plus(decimal(group._sum[field])),
    zero(),
  );
}

function addAmount(target: Map<string, Prisma.Decimal>, key: string, value: Prisma.Decimal) {
  target.set(key, (target.get(key) ?? zero()).plus(value));
}

function serializeAmounts(amounts: Map<string, Prisma.Decimal>) {
  return [...amounts.entries()]
    .map(([label, amount]) => ({ label, amount: amount.toString() }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export async function getDashboardSummary(financialYearValue: string) {
  const fy = parseFinancialYear(financialYearValue);
  const asOf = new Date();
  asOf.setUTCHours(0, 0, 0, 0);
  asOf.setUTCDate(asOf.getUTCDate() + 1);
  const [
    activity,
    categoryActivity,
    balances,
    layoutGroups,
    layoutTransfersFrom,
    layoutTransfersTo,
    accounts,
    fromAccountGroups,
    toAccountGroups,
    cashGroups,
    welfareContributors,
    activeMembers,
    recent,
  ] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["transactionDate", "type", "direction"],
      where: { transactionDate: { gte: fy.start, lt: fy.end } },
      _sum: {
        otherAmount: true,
        shareFeeAmount: true,
        membershipFeeAmount: true,
        welfareFundAmount: true,
        booksFormsAmount: true,
        miscellaneousAmount: true,
      },
    }),
    prisma.transaction.groupBy({
      by: ["type", "subType", "direction"],
      where: { transactionDate: { gte: fy.start, lt: fy.end } },
      _sum: {
        otherAmount: true,
        shareFeeAmount: true,
        membershipFeeAmount: true,
        welfareFundAmount: true,
        booksFormsAmount: true,
        miscellaneousAmount: true,
      },
    }),
    balancesAsOf(asOf),
    prisma.transaction.groupBy({
      by: ["memberId", "layoutId", "direction"],
      where: {
        memberId: { not: null },
        layoutId: { not: null },
        type: "LAYOUT",
        direction: { in: ["IN", "OUT"] },
        transactionDate: { lt: asOf },
      },
      _sum: { siteDepositAmount: true },
    }),
    prisma.transaction.groupBy({
      by: ["memberId", "fromLayoutId"],
      where: {
        memberId: { not: null },
        fromLayoutId: { not: null },
        type: "LAYOUT",
        direction: "TRANSFER",
        transactionDate: { lt: asOf },
      },
      _sum: { siteDepositAmount: true },
    }),
    prisma.transaction.groupBy({
      by: ["memberId", "toLayoutId"],
      where: {
        memberId: { not: null },
        toLayoutId: { not: null },
        type: "LAYOUT",
        direction: "TRANSFER",
        transactionDate: { lt: asOf },
      },
      _sum: { siteDepositAmount: true },
    }),
    prisma.account.findMany({
      where: { isActive: true },
      orderBy: [{ accountCode: "asc" }, { id: "asc" }],
    }),
    prisma.transaction.groupBy({
      by: ["fromAccountId"],
      where: { fromAccountId: { not: null }, transactionDate: { lt: asOf } },
      _sum: { totalAmount: true },
    }),
    prisma.transaction.groupBy({
      by: ["toAccountId"],
      where: { toAccountId: { not: null }, transactionDate: { lt: asOf } },
      _sum: { totalAmount: true },
    }),
    prisma.transaction.groupBy({
      by: ["direction"],
      where: {
        transactionDate: { lt: asOf },
        paymentMode: "CASH",
        type: { not: "BANK" },
        fromAccountId: null,
        toAccountId: null,
        direction: { in: ["IN", "OUT"] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.transaction.groupBy({
      by: ["memberId"],
      where: {
        memberId: { not: null },
        transactionDate: { gte: fy.start, lt: fy.end },
        type: "SHARE",
        direction: "IN",
        welfareFundAmount: { gt: 0 },
      },
    }),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.findMany({
      where: { transactionDate: { gte: fy.start, lt: fy.end } },
      orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      take: 10,
      select: {
        id: true,
        transactionDate: true,
        direction: true,
        type: true,
        subType: true,
        totalAmount: true,
        paymentMode: true,
        receiptNo: true,
        chequeNo: true,
        remarks: true,
        description: true,
        member: { select: { memberCode: true, name: true } },
        party: { select: { name: true } },
        layout: { select: { layoutCode: true, name: true } },
        fromLayout: { select: { layoutCode: true, name: true } },
        toLayout: { select: { layoutCode: true, name: true } },
        fromAccount: { select: { accountCode: true, name: true } },
        toAccount: { select: { accountCode: true, name: true } },
      },
    }),
  ]);

  const months = Array.from({ length: 12 }, (_, index) => {
    const month = (index + 3) % 12;
    const year = fy.startYear + (index >= 9 ? 1 : 0);
    return {
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: new Date(Date.UTC(year, month, 1)).toLocaleString("en-IN", {
        month: "short",
        timeZone: "UTC",
      }),
      income: zero(),
      expense: zero(),
    };
  });
  let totalIncome = zero();
  let totalExpense = zero();
  let welfareFund = zero();
  const incomeBreakdown = new Map<string, Prisma.Decimal>();
  const expenseBreakdown = new Map<string, Prisma.Decimal>();
  const memberIncomeFields = [
    ["Share fee", "shareFeeAmount"],
    ["Membership fee", "membershipFeeAmount"],
    ["Books/forms charges", "booksFormsAmount"],
    ["Other charges", "miscellaneousAmount"],
  ] as const;
  for (const group of categoryActivity) {
    const subtype = group.subType || "Other";
    if (group.type === "EXPENSE" && group.direction === "OUT") {
      const amount = decimal(group._sum.otherAmount);
      addAmount(expenseBreakdown, subtype, amount);
      totalExpense = totalExpense.plus(amount);
      continue;
    }
    if (group.type === "INCOME" && group.direction === "IN") {
      const amount = decimal(group._sum.otherAmount);
      addAmount(incomeBreakdown, subtype, amount);
      totalIncome = totalIncome.plus(amount);
      continue;
    }
    if (group.type === "SHARE" && group.direction === "IN") {
      for (const [label, field] of memberIncomeFields) {
        const amount = decimal(group._sum[field]);
        addAmount(incomeBreakdown, label, amount);
        totalIncome = totalIncome.plus(amount);
      }
      welfareFund = welfareFund.plus(decimal(group._sum.welfareFundAmount));
      addAmount(incomeBreakdown, "Welfare fund", decimal(group._sum.welfareFundAmount));
      totalIncome = totalIncome.plus(decimal(group._sum.welfareFundAmount));
    }
  }
  for (const group of activity) {
    const income = incomeValue(group);
    const expense = expenseValue(group);
    const monthKey = `${group.transactionDate.getUTCFullYear()}-${String(
      group.transactionDate.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
    const month = months.find((item) => item.key === monthKey);
    if (month) {
      month.income = month.income.plus(income);
      month.expense = month.expense.plus(expense);
    }
  }

  let totalShare = zero();
  let totalSiteDeposit = zero();
  let memberShare = zero();
  let associateShare = zero();
  let shareMemberCount = 0;
  let associateMemberShareCount = 0;
  let siteDepositMemberCount = 0;
  const memberRecords = balances.size
    ? await prisma.member.findMany({
        where: { memberId: { in: [...balances.keys()].map(BigInt) } },
        select: { memberId: true, memberType: true },
      })
    : [];
  const memberTypes = new Map(
    memberRecords.map((member) => [member.memberId.toString(), member.memberType]),
  );
  for (const balance of balances.values()) {
    totalShare = totalShare.plus(balance.share);
    totalSiteDeposit = totalSiteDeposit.plus(balance.siteDeposit);
    if (balance.siteDeposit.greaterThan(0)) siteDepositMemberCount += 1;
  }
  for (const [memberId, balance] of balances) {
    const memberType = memberTypes.get(memberId);
    if (memberType === "ASSOCIATE") associateShare = associateShare.plus(balance.share);
    else if (memberType === "MEMBER") memberShare = memberShare.plus(balance.share);
    if (memberType === "MEMBER" && balance.share.greaterThan(0)) shareMemberCount += 1;
    if (memberType === "ASSOCIATE" && balance.share.greaterThan(0)) {
      associateMemberShareCount += 1;
    }
  }
  shareMemberCount += associateMemberShareCount;

  const layouts = await prisma.layout.findMany({
    select: { id: true, layoutCode: true, name: true },
    orderBy: [{ layoutCode: "asc" }, { id: "asc" }],
  });
  const layoutById = new Map(layouts.map((layout) => [layout.id.toString(), layout]));
  const layoutMemberBalances = new Map<string, Map<string, Prisma.Decimal>>();
  const updateLayoutMemberBalance = (
    layoutId: bigint | null,
    memberId: bigint | null,
    amount: Prisma.Decimal,
  ) => {
    if (layoutId === null || memberId === null) return;
    const layoutKey = layoutId.toString();
    const memberKey = memberId.toString();
    const memberBalances = layoutMemberBalances.get(layoutKey) ?? new Map();
    memberBalances.set(memberKey, (memberBalances.get(memberKey) ?? zero()).plus(amount));
    layoutMemberBalances.set(layoutKey, memberBalances);
  };
  for (const group of layoutGroups) {
    const sign = group.direction === "IN" ? 1 : -1;
    const amount = decimal(group._sum.siteDepositAmount);
    updateLayoutMemberBalance(
      group.layoutId,
      group.memberId,
      sign > 0 ? amount : amount.negated(),
    );
  }
  for (const group of layoutTransfersFrom) {
    updateLayoutMemberBalance(
      group.fromLayoutId,
      group.memberId,
      decimal(group._sum.siteDepositAmount).negated(),
    );
  }
  for (const group of layoutTransfersTo) {
    updateLayoutMemberBalance(
      group.toLayoutId,
      group.memberId,
      decimal(group._sum.siteDepositAmount),
    );
  }
  const perLayoutDeposits = layouts
    .map((layout) => {
      const id = layout.id.toString();
      const memberBalances = layoutMemberBalances.get(id) ?? new Map();
      const amount = [...memberBalances.values()].reduce(
        (sum, memberBalance) => sum.plus(memberBalance),
        zero(),
      );
      return {
        id,
        label: `${layout.layoutCode} · ${layout.name}`,
        amount: amount.toString(),
        memberCount: [...memberBalances.values()].filter((balance) => balance.greaterThan(0)).length,
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));

  const accountBalances = new Map(
    accounts.map((account) => [
      account.id.toString(),
      account.openingBalance,
    ]),
  );
  for (const group of fromAccountGroups) {
    if (group.fromAccountId === null) continue;
    const key = group.fromAccountId.toString();
    accountBalances.set(
      key,
      (accountBalances.get(key) ?? zero()).minus(decimal(group._sum.totalAmount)),
    );
  }
  for (const group of toAccountGroups) {
    if (group.toAccountId === null) continue;
    const key = group.toAccountId.toString();
    accountBalances.set(
      key,
      (accountBalances.get(key) ?? zero()).plus(decimal(group._sum.totalAmount)),
    );
  }
  const cashAccountIds = new Set(
    accounts
      .filter((account) => account.accountType.toUpperCase().includes("CASH"))
      .map((account) => account.id.toString()),
  );
  const cashTransactionBalance = cashGroups.reduce((balance, group) => {
    const amount = decimal(group._sum.totalAmount);
    return group.direction === "IN" ? balance.plus(amount) : balance.minus(amount);
  }, zero());
  let cashBalance = cashTransactionBalance;
  let bankBalance = zero();
  const bankAccounts = [] as Array<{ id: string; label: string; balance: string }>;
  for (const account of accounts) {
    const balance = accountBalances.get(account.id.toString()) ?? zero();
    if (cashAccountIds.has(account.id.toString())) {
      cashBalance = cashBalance.plus(balance);
    } else if (account.accountType.toUpperCase().includes("BANK")) {
      bankBalance = bankBalance.plus(balance);
      bankAccounts.push({
        id: account.id.toString(),
        label: `${account.name} (${account.accountCode})`,
        balance: balance.toString(),
      });
    }
  }
  const balancesByMember = new Map(balances);
  const currentMemberRecords = memberRecords;
  const memberSummaryRows = await prisma.member.findMany({
    where: { status: "ACTIVE" },
    select: { memberId: true, memberCode: true, name: true, memberType: true },
    orderBy: [{ name: "asc" }, { memberId: "asc" }],
    take: 20,
  });
  const memberSummaries = memberSummaryRows.map((member) => {
    const balance = balancesByMember.get(member.memberId.toString()) ?? emptyBalance();
    return {
      memberId: member.memberId.toString(),
      memberCode: member.memberCode,
      name: member.name,
      memberType: member.memberType,
      shareBalance: balance.share.toString(),
      siteDepositBalance: balance.siteDeposit.toString(),
    };
  });

  return {
    financialYear: fy.label,
    summary: {
      totalIncome: totalIncome.toString(),
      totalExpense: totalExpense.toString(),
      profitLoss: totalIncome.minus(totalExpense).toString(),
      totalLiability: totalShare.plus(totalSiteDeposit).toString(),
      totalMemberShare: totalShare.toString(),
      memberShare: memberShare.toString(),
      associateShare: associateShare.toString(),
      memberShareCount: shareMemberCount - associateMemberShareCount,
      associateShareCount: associateMemberShareCount,
      totalSiteDeposit: totalSiteDeposit.toString(),
      cashBalance: cashBalance.toString(),
      bankBalance: bankBalance.toString(),
      totalAvailableFunds: cashBalance.plus(bankBalance).toString(),
      welfareFund: welfareFund.toString(),
      welfareContributorCount: welfareContributors.length,
      activeMembers,
      shareMemberCount,
      siteDepositMemberCount,
    },
    monthly: months.map((month) => ({
      key: month.key,
      label: month.label,
      income: month.income.toString(),
      expense: month.expense.toString(),
      profitLoss: month.income.minus(month.expense).toString(),
    })),
    incomeBreakdown: serializeAmounts(incomeBreakdown),
    expenseBreakdown: serializeAmounts(expenseBreakdown),
    layoutDeposits: perLayoutDeposits,
    bankAccounts,
    members: memberSummaries,
    recentTransactions: recent.map((item) => ({
      ...item,
      id: item.id.toString(),
      transactionDate: formatLocalDateInput(item.transactionDate),
      totalAmount: item.totalAmount.toString(),
    })),
  };
}

export async function getMemberCurrentBalances(memberIdValues: string[]) {
  if (memberIdValues.length > 100) {
    throw new AppError(400, "At most 100 member IDs are allowed.");
  }
  const memberIds = memberIdValues.map((value) => {
    if (!/^\d+$/.test(value) || BigInt(value) <= 0n) {
      throw new AppError(400, "Invalid member ID.");
    }
    return BigInt(value);
  });
  const tomorrow = new Date();
  tomorrow.setUTCHours(0, 0, 0, 0);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const balances = await balancesAsOf(tomorrow, memberIds);
  return memberIdValues.map((memberId) => ({
    memberId,
    ...serializeBalance(balances.get(memberId) ?? emptyBalance()),
  }));
}

export async function getMemberTransactionReport(
  memberIdValue: string,
  options: {
    financialYear: string;
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    search?: string;
  },
) {
  if (!/^\d+$/.test(memberIdValue) || BigInt(memberIdValue) <= 0n) {
    throw new AppError(400, "Invalid member ID.");
  }
  const memberId = BigInt(memberIdValue);
  const fy = parseFinancialYear(options.financialYear);
  const page =
    Number.isFinite(options.page) && options.page > 0
      ? Math.floor(options.page)
      : 1;
  const limit = Math.min(100, Math.max(1, Math.floor(options.limit) || 20));
  const where: Prisma.TransactionWhereInput = {
    memberId,
    transactionDate: { gte: fy.start, lt: fy.end },
  };
  if (options.search?.trim()) {
    const term = options.search.trim();
    where.OR = [
      { subType: { contains: term, mode: "insensitive" } },
      { remarks: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { receiptNo: { contains: term, mode: "insensitive" } },
      { chequeNo: { contains: term, mode: "insensitive" } },
    ];
  }

  const tomorrow = new Date();
  tomorrow.setUTCHours(0, 0, 0, 0);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const [items, total, balances] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [
        { transactionDate: options.sortOrder },
        { id: options.sortOrder },
      ],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        party: { select: { name: true, partyType: true } },
        layout: { select: { name: true, layoutCode: true } },
        fromLayout: { select: { name: true, layoutCode: true } },
        toLayout: { select: { name: true, layoutCode: true } },
      },
    }),
    prisma.transaction.count({ where }),
    balancesAsOf(tomorrow, [memberId]),
  ]);
  const balance = balances.get(memberIdValue) ?? emptyBalance();
  return {
    financialYear: fy.label,
    balance: serializeBalance(balance),
    items: items.map((item) => ({
      ...item,
      id: item.id.toString(),
      transactionDate: formatLocalDateInput(item.transactionDate),
      memberId: item.memberId?.toString() ?? null,
      partyId: item.partyId?.toString() ?? null,
      layoutId: item.layoutId?.toString() ?? null,
      fromLayoutId: item.fromLayoutId?.toString() ?? null,
      toLayoutId: item.toLayoutId?.toString() ?? null,
      createdBy: item.createdBy.toString(),
      updatedBy: item.updatedBy?.toString() ?? null,
      totalAmount: item.totalAmount.toString(),
      shareAmount: item.shareAmount.toString(),
      shareFeeAmount: item.shareFeeAmount.toString(),
      membershipFeeAmount: item.membershipFeeAmount.toString(),
      siteDepositAmount: item.siteDepositAmount.toString(),
      welfareFundAmount: item.welfareFundAmount.toString(),
      booksFormsAmount: item.booksFormsAmount.toString(),
      miscellaneousAmount: item.miscellaneousAmount.toString(),
      otherAmount: item.otherAmount.toString(),
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
