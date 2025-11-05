import { Internship } from "../../internship/internship";
import { TableNameValues } from "./components/TableNameValues";

interface TableProps {
  name: TableNameValues;
  //   data: { [key: string]: unknown };
  data: Internship[];
}
export default TableProps;
