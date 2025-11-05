export type RoleType = "student" | "firma" | "garant" | "api";

export interface RoleDataType<TQ = string, TA = string> {
  a: TQ;
  b: TA;
}
