export type RoleType = "student" | "firma" | "garant";

export interface RoleDataType<TQ = string, TA = string> {
  a: TQ;
  b: TA;
}
