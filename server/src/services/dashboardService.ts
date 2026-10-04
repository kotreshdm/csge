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
const transactionTypes = [
  "SHARE",
  "LAYOUT",
  "BANK",
  "EXPENSE",
  "INCOME",
  "ADVANCE",
  "ASSET",
  "OTHER",
] as const;

type Balance = { share: Prisma.Decimal; siteDeposit: Prisma.Decimal };
type BalanceGroup = {
  memberId: bigint | null;
  type: string;
  layoutId: bigint | null;
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
  const endExclusive = new Date(Date.UTC(startYear + 1, 3, 1));
  return {
    label: `${startYear}-${startYear + 1}`,
    startYear,
    start: new Date(Date.UTC(startYear, 3, 1)),
    end: endExclusive,
    endExclusive,
  };
}

function parseDateString(value: string, field: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(400, `${field} must use YYYY-MM-DD format.`);
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new AppError(400, `${field} must be a valid date.`);
  }

  return date;
}

function parseReportPeriod(input: {
  financialYear?: string;
  fromDate?: string;
  toDate?: string;
}) {
  if (input.financialYear) {
    return {
      ...parseFinancialYear(input.financialYear),
      kind: "financialYear" as const,
    };
  }

  if (!input.fromDate || !input.toDate) {
    throw new AppError(400, "Select a financial year or provide both dates.");
  }

  const start = parseDateString(input.fromDate, "From date");
  const end = parseDateString(input.toDate, "To date");
  if (start > end) {
    throw new AppError(400, "From date cannot be after To date.");
  }

  return {
    label: `${input.fromDate} → ${input.toDate}`,
    startYear: start.getUTCFullYear(),
    start,
    endExclusive: new Date(end.getTime() + 86400000),
    kind: "custom" as const,
  };
}

function buildPeriodMonths(start: Date, endExclusive: Date) {
  const months: Array<{
    key: string;
    label: string;
    income: Prisma.Decimal;
    expense: Prisma.Decimal;
  }> = [];
  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1),
  );
  const lastMonth = new Date(
    Date.UTC(endExclusive.getUTCFullYear(), endExclusive.getUTCMonth(), 1),
  );

  for (
    let current = new Date(cursor);
    current <= lastMonth;
    current = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1),
    )
  ) {
    const key = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, "0")}`;
    months.push({
      key,
      label: current.toLocaleString("en-IN", {
        month: "short",
        timeZone: "UTC",
      }),
      income: zero(),
      expense: zero(),
    });
  }

  return months;
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
    const sign = group.type === "CREDIT" ? 1 : -1;
    if (group.layoutId === null) {
      const share = decimal(group._sum.shareAmount);
      balance.share =
        sign > 0 ? balance.share.plus(share) : balance.share.minus(share);
    } else {
      const deposit = decimal(group._sum.siteDepositAmount);
      balance.siteDeposit =
        sign > 0
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
    by: ["memberId", "type", "layoutId"],
    where: {
      memberId: memberIds ? { in: memberIds } : { not: null },
      transactionDate: { lt: endExclusive },
      type: { in: ["CREDIT", "DEBIT"] },
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

function addAmount(
  target: Map<string, Prisma.Decimal>,
  key: string,
  value: Prisma.Decimal,
) {
  target.set(key, (target.get(key) ?? zero()).plus(value));
}

function amountToString(value: Prisma.Decimal) {
  return value.toString();
}

function baseAdvanceSubtype(subType: string) {
  return subType.endsWith("_RETURN") ? subType.slice(0, -7) : subType;
}

function serializeAmounts(amounts: Map<string, Prisma.Decimal>) {
  return [...amounts.entries()]
    .map(([label, amount]) => ({ label, amount: amount.toString() }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export async function getDashboardSummary(
  financialYearValue?: string,
  fromDateValue?: string,
  toDateValue?: string,
) {
  const period = parseReportPeriod({
    financialYear: financialYearValue,
    fromDate: fromDateValue,
    toDate: toDateValue,
  });
  const asOf = new Date();
  asOf.setUTCHours(0, 0, 0, 0);
  asOf.setUTCDate(asOf.getUTCDate() + 1);
  const [
    activity,
    categoryActivity,
    typeActivity,
    advanceActivity,
    currentAdvanceActivity,
    balances,
    layoutGroups,
    accounts,
    accountGroups,
    cashGroups,
    welfareActivity,
    welfareContributors,
    activeMembers,
    recent,
  ] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["transactionDate", "type", "direction"],
      where: {
        transactionDate: { gte: period.start, lt: period.endExclusive },
      },
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
      where: {
        transactionDate: { gte: period.start, lt: period.endExclusive },
      },
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
      by: ["type", "direction"],
      where: {
        transactionDate: { gte: period.start, lt: period.endExclusive },
      },
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    prisma.transaction.groupBy({
      by: ["subType", "direction", "partyId"],
      where: {
        type: "ADVANCE",
        transactionDate: { gte: period.start, lt: period.endExclusive },
      },
      _sum: { otherAmount: true },
    }),
    prisma.transaction.groupBy({
      by: ["subType", "direction", "partyId"],
      where: { type: "ADVANCE", transactionDate: { lt: asOf } },
      _sum: { otherAmount: true },
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
    prisma.account.findMany({
      where: { isActive: true },
      orderBy: [{ accountCode: "asc" }, { id: "asc" }],
    }),
    prisma.transaction.groupBy({
      by: ["accountId", "direction"],
      where: { accountId: { not: null }, transactionDate: { lt: asOf } },
      _sum: { totalAmount: true },
    }),
    prisma.transaction.groupBy({
      by: ["direction"],
      where: {
        transactionDate: { lt: asOf },
        paymentMode: "CASH",
        type: { not: "BANK" },
        accountId: null,
        direction: { in: ["IN", "OUT"] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.transaction.groupBy({
      by: ["direction"],
      where: {
        type: "SHARE",
        transactionDate: { lt: asOf },
        welfareFundAmount: { gt: 0 },
        direction: { in: ["IN", "OUT"] },
      },
      _sum: { welfareFundAmount: true },
    }),
    prisma.transaction.groupBy({
      by: ["memberId"],
      where: {
        memberId: { not: null },
        transactionDate: { gte: period.start, lt: period.endExclusive },
        type: "SHARE",
        direction: "IN",
        welfareFundAmount: { gt: 0 },
      },
    }),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.findMany({
      where: {
        transactionDate: { gte: period.start, lt: period.endExclusive },
      },
      orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      take: 10,
      select: {
        id: true,
        transactionDate: true,
        memberId: true,
        partyId: true,
        layoutId: true,
        accountId: true,
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
        account: { select: { accountCode: true, name: true } },
      },
    }),
  ]);

  const months = buildPeriodMonths(period.start, period.endExclusive);
  let totalIncome = zero();
  let totalExpense = zero();
  let welfareFund = zero();
  let welfareFundReceived = zero();
  let welfareFundUsed = zero();
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
      welfareFundReceived = welfareFundReceived.plus(
        decimal(group._sum.welfareFundAmount),
      );
      addAmount(
        incomeBreakdown,
        "Welfare fund",
        decimal(group._sum.welfareFundAmount),
      );
      totalIncome = totalIncome.plus(decimal(group._sum.welfareFundAmount));
    }
  }
  for (const group of categoryActivity) {
    if (group.type === "SHARE" && group.direction === "OUT") {
      welfareFundUsed = welfareFundUsed.plus(
        decimal(group._sum.welfareFundAmount),
      );
    }
  }
  const welfareCurrent = welfareActivity.reduce((balance, group) => {
    const amount = decimal(group._sum.welfareFundAmount);
    return group.direction === "IN"
      ? balance.plus(amount)
      : balance.minus(amount);
  }, zero());
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
    memberRecords.map((member) => [
      member.memberId.toString(),
      member.memberType,
    ]),
  );
  for (const balance of balances.values()) {
    totalShare = totalShare.plus(balance.share);
    totalSiteDeposit = totalSiteDeposit.plus(balance.siteDeposit);
    if (balance.siteDeposit.greaterThan(0)) siteDepositMemberCount += 1;
  }
  for (const [memberId, balance] of balances) {
    const memberType = memberTypes.get(memberId);
    if (memberType === "ASSOCIATE")
      associateShare = associateShare.plus(balance.share);
    else if (memberType === "MEMBER")
      memberShare = memberShare.plus(balance.share);
    if (memberType === "MEMBER" && balance.share.greaterThan(0))
      shareMemberCount += 1;
    if (memberType === "ASSOCIATE" && balance.share.greaterThan(0)) {
      associateMemberShareCount += 1;
    }
  }
  shareMemberCount += associateMemberShareCount;

  const layouts = await prisma.layout.findMany({
    select: { id: true, layoutCode: true, name: true },
    orderBy: [{ layoutCode: "asc" }, { id: "asc" }],
  });
  const layoutById = new Map(
    layouts.map((layout) => [layout.id.toString(), layout]),
  );
  const layoutMemberBalances = new Map<string, Map<string, Prisma.Decimal>>();
  const layoutMovementTotals = new Map<
    string,
    {
      received: Prisma.Decimal;
      withdrawn: Prisma.Decimal;
      transferIn: Prisma.Decimal;
      transferOut: Prisma.Decimal;
    }
  >();
  const updateLayoutMemberBalance = (
    layoutId: bigint | null,
    memberId: bigint | null,
    amount: Prisma.Decimal,
  ) => {
    if (layoutId === null || memberId === null) return;
    const layoutKey = layoutId.toString();
    const memberKey = memberId.toString();
    const memberBalances = layoutMemberBalances.get(layoutKey) ?? new Map();
    memberBalances.set(
      memberKey,
      (memberBalances.get(memberKey) ?? zero()).plus(amount),
    );
    layoutMemberBalances.set(layoutKey, memberBalances);
  };
  for (const group of layoutGroups) {
    const sign = group.direction === "IN" ? 1 : -1;
    const amount = decimal(group._sum.siteDepositAmount);
    if (group.layoutId !== null) {
      const key = group.layoutId.toString();
      const totals = layoutMovementTotals.get(key) ?? {
        received: zero(),
        withdrawn: zero(),
        transferIn: zero(),
        transferOut: zero(),
      };
      if (sign > 0) totals.received = totals.received.plus(amount);
      else totals.withdrawn = totals.withdrawn.plus(amount);
      layoutMovementTotals.set(key, totals);
    }
    updateLayoutMemberBalance(
      group.layoutId,
      group.memberId,
      sign > 0 ? amount : amount.negated(),
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
        received: (layoutMovementTotals.get(id)?.received ?? zero()).toString(),
        withdrawn: (
          layoutMovementTotals.get(id)?.withdrawn ?? zero()
        ).toString(),
        transferIn: (
          layoutMovementTotals.get(id)?.transferIn ?? zero()
        ).toString(),
        transferOut: (
          layoutMovementTotals.get(id)?.transferOut ?? zero()
        ).toString(),
        amount: amount.toString(),
        memberCount: [...memberBalances.values()].filter((balance) =>
          balance.greaterThan(0),
        ).length,
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));

  const accountBalances = new Map(
    accounts.map((account) => [account.id.toString(), account.openingBalance]),
  );
  for (const group of accountGroups) {
    if (group.accountId === null) continue;
    const key = group.accountId.toString();
    const amount = decimal(group._sum.totalAmount);
    accountBalances.set(
      key,
      (accountBalances.get(key) ?? zero()).plus(
        group.direction === "OUT" ? amount : amount.negated(),
      ),
    );
  }
  const cashAccountIds = new Set(
    accounts
      .filter((account) => account.accountType.toUpperCase().includes("CASH"))
      .map((account) => account.id.toString()),
  );
  const cashTransactionBalance = cashGroups.reduce((balance, group) => {
    const amount = decimal(group._sum.totalAmount);
    return group.direction === "IN"
      ? balance.plus(amount)
      : balance.minus(amount);
  }, zero());
  const cashAccount = accounts.find((account) =>
    account.accountType.toUpperCase().includes("CASH"),
  );
  if (cashAccount) {
    const cashKey = cashAccount.id.toString();
    accountBalances.set(
      cashKey,
      (accountBalances.get(cashKey) ?? zero()).plus(cashTransactionBalance),
    );
  }
  let cashBalance = zero();
  let bankBalance = zero();
  const accountBalanceRows: Array<{
    id: string;
    label: string;
    accountType: string;
    balance: string;
  }> = [];
  const bankAccounts = [] as Array<{
    id: string;
    label: string;
    balance: string;
  }>;
  for (const account of accounts) {
    const balance = accountBalances.get(account.id.toString()) ?? zero();
    const label = `${account.name} (${account.accountCode})`;
    accountBalanceRows.push({
      id: account.id.toString(),
      label,
      accountType: account.accountType,
      balance: balance.toString(),
    });
    if (cashAccountIds.has(account.id.toString())) {
      cashBalance = cashBalance.plus(balance);
    } else if (account.accountType.toUpperCase().includes("BANK")) {
      bankBalance = bankBalance.plus(balance);
      bankAccounts.push({
        id: account.id.toString(),
        label,
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
    const balance =
      balancesByMember.get(member.memberId.toString()) ?? emptyBalance();
    return {
      memberId: member.memberId.toString(),
      memberCode: member.memberCode,
      name: member.name,
      memberType: member.memberType,
      shareBalance: balance.share.toString(),
      siteDepositBalance: balance.siteDeposit.toString(),
    };
  });

  const advanceSubtypes = new Map<
    string,
    { received: Prisma.Decimal; paid: Prisma.Decimal }
  >();
  let advancesGiven = zero();
  let advancesReceived = zero();
  for (const group of advanceActivity) {
    const amount = decimal(group._sum.otherAmount);
    const row = advanceSubtypes.get(group.subType) ?? {
      received: zero(),
      paid: zero(),
    };
    if (group.direction === "IN") {
      row.received = row.received.plus(amount);
      advancesReceived = advancesReceived.plus(amount);
    } else if (group.direction === "OUT") {
      row.paid = row.paid.plus(amount);
      advancesGiven = advancesGiven.plus(amount);
    }
    advanceSubtypes.set(group.subType, row);
  }
  const advanceLiabilityBalances = new Map<string, Prisma.Decimal>();
  const advanceReceivableBalances = new Map<string, Prisma.Decimal>();
  const advancePartyPositions = new Map<
    string,
    { given: Prisma.Decimal; received: Prisma.Decimal; balance: Prisma.Decimal }
  >();
  for (const group of currentAdvanceActivity) {
    const amount = decimal(group._sum.otherAmount);
    const baseSubtype = baseAdvanceSubtype(group.subType);
    const returned = group.subType.endsWith("_RETURN");
    const key = `${group.partyId?.toString() ?? "unassigned"}:${baseSubtype}`;
    const partyKey = group.partyId?.toString();
    if (!returned && group.direction === "IN") {
      advanceLiabilityBalances.set(
        key,
        (advanceLiabilityBalances.get(key) ?? zero()).plus(amount),
      );
    } else if (returned && group.direction === "OUT") {
      advanceLiabilityBalances.set(
        key,
        (advanceLiabilityBalances.get(key) ?? zero()).minus(amount),
      );
    } else if (!returned && group.direction === "OUT") {
      advanceReceivableBalances.set(
        key,
        (advanceReceivableBalances.get(key) ?? zero()).plus(amount),
      );
    } else if (returned && group.direction === "IN") {
      advanceReceivableBalances.set(
        key,
        (advanceReceivableBalances.get(key) ?? zero()).minus(amount),
      );
    }
    if (partyKey) {
      const position = advancePartyPositions.get(partyKey) ?? {
        given: zero(),
        received: zero(),
        balance: zero(),
      };
      if (!returned && group.direction === "OUT") {
        position.given = position.given.plus(amount);
        position.balance = position.balance.plus(amount);
      } else if (!returned && group.direction === "IN") {
        position.received = position.received.plus(amount);
        position.balance = position.balance.minus(amount);
      } else if (returned && group.direction === "OUT") {
        position.balance = position.balance.minus(amount);
      } else if (returned && group.direction === "IN") {
        position.balance = position.balance.minus(amount);
      }
      advancePartyPositions.set(partyKey, position);
    }
  }
  const advanceLiability = [...advanceLiabilityBalances.values()].reduce(
    (total, balance) => total.plus(balance.greaterThan(0) ? balance : zero()),
    zero(),
  );
  const advanceReceivable = [...advanceReceivableBalances.values()].reduce(
    (total, balance) => total.plus(balance.greaterThan(0) ? balance : zero()),
    zero(),
  );
  const advancePartyIds = [...advancePartyPositions.keys()].map(BigInt);
  const advanceParties = advancePartyIds.length
    ? await prisma.party.findMany({
        where: { id: { in: advancePartyIds } },
        select: { id: true, name: true, partyType: true },
        orderBy: [{ name: "asc" }, { id: "asc" }],
      })
    : [];
  const partyById = new Map(
    advanceParties.map((party) => [party.id.toString(), party]),
  );
  const advancePartyBreakdown = [...advancePartyPositions.entries()]
    .map(([id, position]) => ({
      id,
      name: partyById.get(id)?.name ?? "Unknown party",
      partyType: partyById.get(id)?.partyType ?? "",
      given: position.given.toString(),
      received: position.received.toString(),
      balance: position.balance.toString(),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
  const advanceSubtypeBreakdown = [...advanceSubtypes.entries()]
    .map(([subType, position]) => ({
      subType,
      received: position.received.toString(),
      paid: position.paid.toString(),
      net: position.received.minus(position.paid).toString(),
    }))
    .sort((left, right) => left.subType.localeCompare(right.subType));
  const transactionTypeSummary = transactionTypes.map((type) => {
    const groups = typeActivity.filter((group) => group.type === type);
    return {
      type,
      count: groups.reduce((sum, group) => sum + group._count._all, 0),
      amount: groups
        .reduce(
          (sum, group) => sum.plus(decimal(group._sum.totalAmount)),
          zero(),
        )
        .toString(),
    };
  });
  const transactionSubtypes = await prisma.transaction.groupBy({
    by: ["type", "subType"],
    where: {
      transactionDate: { gte: period.start, lt: period.endExclusive },
      subType: { not: "" },
    },
    orderBy: [{ type: "asc" }, { subType: "asc" }],
  });

  return {
    financialYear: period.label,
    summary: {
      totalIncome: totalIncome.toString(),
      totalExpense: totalExpense.toString(),
      profitLoss: totalIncome.minus(totalExpense).toString(),
      totalLiability: totalShare
        .plus(totalSiteDeposit)
        .plus(advanceLiability)
        .toString(),
      memberShareLiability: totalShare.toString(),
      siteDepositLiability: totalSiteDeposit.toString(),
      advanceLiability: advanceLiability.toString(),
      advanceReceivable: advanceReceivable.toString(),
      advancesGiven: advancesGiven.toString(),
      advancesReceived: advancesReceived.toString(),
      netAdvanceBalance: advanceReceivable.minus(advanceLiability).toString(),
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
      welfareFundReceived: welfareFundReceived.toString(),
      welfareFundUsed: welfareFundUsed.toString(),
      welfareFundCurrentBalance: welfareCurrent.toString(),
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
    accountBalances: accountBalanceRows,
    advanceSubtypeBreakdown,
    advancePartyBreakdown,
    transactionTypeSummary,
    transactionSubtypes,
    members: memberSummaries,
    recentTransactions: recent.map((item) => ({
      ...item,
      id: item.id.toString(),
      transactionDate: formatLocalDateInput(item.transactionDate),
      totalAmount: item.totalAmount.toString(),
      memberId: item.memberId?.toString() ?? null,
      partyId: item.partyId?.toString() ?? null,
      layoutId: item.layoutId?.toString() ?? null,
      accountId: item.accountId?.toString() ?? null,
    })),
  };
}

type FinancialYearTransactionFilters = {
  financialYear: string;
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  subType?: string;
  direction?: string;
  member?: string;
  party?: string;
  layout?: string;
  account?: string;
  fromDate?: string;
  toDate?: string;
};

function transactionDateFilter(value: string | undefined, field: string) {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(400, `${field} must use YYYY-MM-DD format.`);
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new AppError(400, `${field} must be a valid date.`);
  }
  return date;
}

export async function getFinancialYearTransactions(
  filters: FinancialYearTransactionFilters,
) {
  const period = parseReportPeriod({
    financialYear: filters.financialYear,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });
  const page = Math.max(1, Math.floor(Number(filters.page) || 1));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(Number(filters.limit) || 25)),
  );
  const where: Prisma.TransactionWhereInput = {
    transactionDate: {
      gte: period.start,
      lt: period.endExclusive,
    },
  };
  const and: Prisma.TransactionWhereInput[] = [];
  if (
    filters.type &&
    transactionTypes.includes(filters.type as (typeof transactionTypes)[number])
  ) {
    where.type = filters.type as (typeof transactionTypes)[number];
  }
  if (filters.direction && ["IN", "OUT"].includes(filters.direction)) {
    where.direction = filters.direction as "IN" | "OUT";
  }
  if (filters.subType) where.subType = filters.subType;
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    and.push({
      OR: [
        { subType: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { remarks: { contains: term, mode: "insensitive" } },
        { receiptNo: { contains: term, mode: "insensitive" } },
        { chequeNo: { contains: term, mode: "insensitive" } },
        {
          member: {
            is: {
              OR: [
                { name: { contains: term, mode: "insensitive" } },
                { memberCode: { contains: term, mode: "insensitive" } },
              ],
            },
          },
        },
        { party: { is: { name: { contains: term, mode: "insensitive" } } } },
      ],
    });
  }
  if (filters.member?.trim()) {
    const term = filters.member.trim();
    and.push({
      member: {
        is: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { memberCode: { contains: term, mode: "insensitive" } },
          ],
        },
      },
    });
  }
  if (filters.party?.trim()) {
    and.push({
      party: {
        is: { name: { contains: filters.party.trim(), mode: "insensitive" } },
      },
    });
  }
  if (filters.layout?.trim()) {
    const term = filters.layout.trim();
    and.push({
      layout: {
        is: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { layoutCode: { contains: term, mode: "insensitive" } },
          ],
        },
      },
    });
  }
  if (filters.account?.trim()) {
    const term = filters.account.trim();
    and.push({
      account: {
        is: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { accountCode: { contains: term, mode: "insensitive" } },
          ],
        },
      },
    });
  }
  if (and.length) where.AND = and;

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        member: { select: { memberCode: true, name: true } },
        party: { select: { name: true, partyType: true } },
        layout: { select: { layoutCode: true, name: true } },
        account: {
          select: { accountCode: true, name: true, accountType: true },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);
  return {
    financialYear: period.label,
    items: items.map((item) => ({
      ...item,
      id: item.id.toString(),
      transactionDate: formatLocalDateInput(item.transactionDate),
      chequeDate: item.chequeDate
        ? formatLocalDateInput(item.chequeDate)
        : null,
      memberId: item.memberId?.toString() ?? null,
      partyId: item.partyId?.toString() ?? null,
      layoutId: item.layoutId?.toString() ?? null,
      accountId: item.accountId?.toString() ?? null,
      referenceTransactionId: item.referenceTransactionId?.toString() ?? null,
      createdBy: item.createdBy.toString(),
      updatedBy: item.updatedBy?.toString() ?? null,
      shareAmount: item.shareAmount.toString(),
      shareFeeAmount: item.shareFeeAmount.toString(),
      membershipFeeAmount: item.membershipFeeAmount.toString(),
      siteDepositAmount: item.siteDepositAmount.toString(),
      welfareFundAmount: item.welfareFundAmount.toString(),
      booksFormsAmount: item.booksFormsAmount.toString(),
      miscellaneousAmount: item.miscellaneousAmount.toString(),
      otherAmount: item.otherAmount.toString(),
      totalAmount: item.totalAmount.toString(),
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
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
