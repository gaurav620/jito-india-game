import React from 'react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  className?: string;
  emptyMessage?: string;
}

/**
 * Casino Data Table
 * Recreates the clean cream/tan table styling used in the History and Report modals.
 */
export function Table<T>({
  columns,
  data,
  keyExtractor,
  className = '',
  emptyMessage = 'No records found.',
}: TableProps<T>): React.ReactElement {
  return (
    <div
      className={`w-full overflow-hidden rounded-lg border-2 border-[#D4AF37]/50 bg-[#F4E2BB] shadow-inner ${className}`}
    >
      <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
        <table className="w-full border-collapse text-left text-sm text-[#1A1A1A]">
          <thead>
            <tr className="bg-gradient-to-b from-[#F9EDD2] via-[#EED5A5] to-[#E3C385] border-b-2 border-[#D4AF37]/60">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-2.5 text-center font-black uppercase text-xs sm:text-sm tracking-wider text-[#332200] border-r last:border-r-0 border-[#D4AF37]/30 ${
                    col.className || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm font-bold text-gray-600 italic bg-[#FAF2DE]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={keyExtractor(row, rowIdx)}
                  className={`border-b border-[#D4AF37]/20 font-bold transition-colors ${
                    rowIdx % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#FAF2DE]'
                  } hover:bg-[#FFF7D6]`}
                >
                  {columns.map((col, colIdx) => {
                    const value =
                      typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : (row[col.accessor] as unknown as React.ReactNode);
                    return (
                      <td
                        key={colIdx}
                        className={`px-4 py-2.5 text-center border-r last:border-r-0 border-[#D4AF37]/20 ${
                          col.className || ''
                        }`}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
