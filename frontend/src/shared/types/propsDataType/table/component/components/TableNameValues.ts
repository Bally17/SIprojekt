import { TABLE_NAMES } from "src/constants/Table";

type TableNamesKeys = keyof typeof TABLE_NAMES;
export type TableNameValues = (typeof TABLE_NAMES)[TableNamesKeys];
