UPDATE "members" AS member
SET "status" = CASE
    WHEN COALESCE(
        (
            SELECT SUM(
                CASE
                    WHEN transaction."type" = 'CREDIT' THEN transaction."shareAmount"
                    ELSE -transaction."shareAmount"
                END
            )
            FROM "transactions" AS transaction
            WHERE transaction."memberId" = member."memberId"
              AND transaction."type" IN ('CREDIT', 'DEBIT')
              AND UPPER(REGEXP_REPLACE(BTRIM(transaction."subType"), '[[:space:]-]+', '_', 'g'))
                  IN ('SHARE', 'SHARE_WITHDRAWAL')
        ),
        0
    ) > 0 THEN 'ACTIVE'::"MemberStatus"
    ELSE 'INACTIVE'::"MemberStatus"
END;