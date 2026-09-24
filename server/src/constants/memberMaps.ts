export type MemberTypeValue = "SUPERUSER" | "MEMBER" | "ASSOCIATE";
export type MemberStatusValue =
  | "ACTIVE"
  | "INACTIVE"
  | "INCORRECT"
  | "RESIGNED"
  | "DECEASED";
export type GenderValue = "MALE" | "FEMALE" | "OTHER";

export const MEMBER_TYPE_MAP = {
  member: "MEMBER",
  associate: "ASSOCIATE",
  superuser: "SUPERUSER",
} as const satisfies Record<string, MemberTypeValue>;

export const MEMBER_STATUS_MAP = {
  active: "ACTIVE",
  inactive: "INACTIVE",
  incorrect: "INCORRECT",
  resigned: "RESIGNED",
  deceased: "DECEASED",
} as const satisfies Record<string, MemberStatusValue>;

export const GENDER_MAP = {
  male: "MALE",
  female: "FEMALE",
  other: "OTHER",
} as const satisfies Record<string, GenderValue>;
