export default function DataTable({
  columns,        // [{ key, label, render? }]
  data,
  loading = false,
  emptyMessage = 'No records found',
  emptyIcon = '📭',
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  rowKey = 'id',
  onRowClick,
}) {
  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="table-container animate-pulse">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}><div className="skeleton h-3 w-20 rounded" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key}><div className="skeleton h-4 w-full rounded" style={{ width: `${60 + Math.random() * 30}%` }} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-container">
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <span className="text-5xl mb-4 animate-bounce-soft">{emptyIcon}</span>
          <p className="text-sm font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row[rowKey] || idx}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {columns.map((c) => (
                  <td key={c.key}>
                    {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
          <span>
            Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="btn btn-secondary btn-sm"
            >
              ←
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="btn btn-secondary btn-sm"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
