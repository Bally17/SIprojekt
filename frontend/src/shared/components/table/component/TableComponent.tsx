import TableProps from "@/shared/types/components/table/TableProps";
import useLoadTabelData from "@/shared/utils/actions";
import React, { FC } from "react";

const buildMediaUrl = (path: string) => {
  const backend = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(
    /\/api\/?$/,
    "",
  );
  return `${backend}/media/${path.replace(/^\/?/, "")}`;
};

const TableComponent: FC<TableProps> = (props) => {
  const { data, name } = props;

  const { columns } = useLoadTabelData(name);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-100">
        <thead>
          <tr className="bg-gray-100 text-left text-sm text-gray-600">
            {columns.map((c) => (
              <th key={c} className="px-4 py-3">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="border-t text-sm">
              <td className="px-4 py-3 font-medium">#{item.id}</td>
              <td className="px-4 py-3">{item.student}</td>
              <td className="px-4 py-3">{item.rok}</td>
              <td className="px-4 py-3 capitalize">{item.semester}</td>
              <td className="px-4 py-3">{item.datum_zaciatku}</td>
              <td className="px-4 py-3">{item.datum_konca}</td>
              <td className="px-4 py-3 capitalize">{item.stav}</td>
              <td className="px-4 py-3">
                {item.documents?.length ? (
                  <div className="space-y-1">
                    {item.documents
                      .filter((doc) => doc.subor_url)
                      .map((doc) => (
                        <a
                          key={doc.id}
                          href={buildMediaUrl(doc.subor_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-cyan-700 hover:underline"
                        >
                          {doc.typ_dokumentu.toUpperCase()}
                        </a>
                      ))}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableComponent;
