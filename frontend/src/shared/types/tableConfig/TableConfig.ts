import LocalizedName from "./components/LocalizedName";
import TableColumn from "./components/TableColumn";

interface TableConfig {
  tableName: Array<LocalizedName>;
  columns: Array<TableColumn>;
  id?: number;
  tableSubtitle?: Array<LocalizedName>;
}

export default TableConfig;
