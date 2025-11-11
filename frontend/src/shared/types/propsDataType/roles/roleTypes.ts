export type RoleType = "student" | "company" | "garant";

export interface RoleDataType<TQ = string, TA = string> {
  a: TQ;
  b: TA;
}
