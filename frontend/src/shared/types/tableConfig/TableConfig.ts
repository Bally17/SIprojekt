import LocalizedName from "./components/LocalizedName";
import TableColumn from "./components/TableColumn";

interface TableConfig {
  tableName: Array<LocalizedName>;
  columns: Array<TableColumn>;
  id?: number;
}

export default TableConfig;
