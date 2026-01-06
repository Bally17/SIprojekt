import type React from "react";

type SearchItem = {
  id: number;
  primary: string;
  secondary?: string | null;
  label: string;
};

type Props = {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
  onSelect: (item: SearchItem) => void;
  items: SearchItem[];
  isFetching?: boolean;
  loadingText?: string;
};

export default function SearchSelect({
  label,
  value,
  placeholder,
  onChange,
  onSelect,
  items,
  isFetching,
  loadingText,
}: Readonly<Props>) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase text-ink-500">{label}</label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      />

      {isFetching ? <p className="text-xs text-ink-400 mt-1">{loadingText}</p> : null}

      {items.length ? (
        <ul className="border mt-2 rounded-md max-h-40 overflow-y-auto divide-y">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="w-full px-3 py-2 text-left hover:bg-primary-50"
              >
                <span className="font-medium">{item.primary || `#${item.id}`}</span>
                {item.secondary ? (
                  <div className="text-xs text-ink-500">{item.secondary}</div>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
