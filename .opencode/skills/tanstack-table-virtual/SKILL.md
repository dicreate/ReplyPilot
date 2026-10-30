---
name: tanstack-table-virtual
description: Tables and virtualized lists with @tanstack/react-table 8.20 and @tanstack/react-virtual 3.13. Use when building data tables, sortable/filterable grids, paginated lists, or virtualized rendering of large datasets.
---

# Tables + Virtualization (pinned: table@8.20, virtual@3.13)

Offline-first. Headless UI: you own the markup, the libs own state.

## 1. Table v8 setup (controlled state lives with you)

```tsx
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table'

const [sorting, setSorting] = useState<SortingState>([])
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

const table = useReactTable({
  data,
  columns,
  state: { sorting, columnFilters },
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
})
```

Server-driven search: keep pagination/sort in URL search params via `useSearchParams` (React Router v7) and feed them into the query, not only into table state.

## 2. Column defs (stable, memoized)

```tsx
const columns = useMemo<ColumnDef<Doc>[]>(
  () => [
    { accessorKey: 'name', header: 'Name', cell: (info) => info.getValue() },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: (info) => formatDate(info.getValue<string>()),
      sortingFn: 'datetime',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActions doc={row.original} />,
    },
  ],
  []
)
```

Never inline `columns` without `useMemo` — new column objects reset sort/filter state.

## 3. Rendering rows

```tsx
<table>
  <thead>
    {table.getHeaderGroups().map((hg) => (
      <tr key={hg.id}>
        {hg.headers.map((h) => (
          <th key={h.id} onClick={h.column.getToggleSortingHandler()}>
            {flexRender(h.column.columnDef.header, h.getContext())}
          </th>
        ))}
      </tr>
    ))}
  </thead>
  <tbody>
    {table.getRowModel().rows.map((r) => (
      <tr key={r.id}>
        {r.getVisibleCells().map((c) => (
          <td key={c.id}>
            {flexRender(c.column.columnDef.cell, c.getContext())}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>
```

Use `flexRender` always; `row.original` for actions (typed entity).

## 4. Virtualization for 1000+ rows (react-virtual v3)

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

const parentRef = useRef<HTMLDivElement>(null)
const virtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 48, // row height estimate
  overscan: 8,
})

;<div ref={parentRef} style={{ height: 600, overflow: 'auto' }}>
  <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
    {virtualizer.getVirtualItems().map((v) => (
      <div
        key={v.key}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${v.start}px)`,
        }}
      >
        <Row data={rows[v.index]} />
      </div>
    ))}
  </div>
</div>
```

Virtualize only the body; keep header sticky outside the virtual container. `estimateSize` should match real row height — wrong estimates cause scrollbar jumps.

## 5. Perf rules

1. Server-paginate search results; client-paginate only small dictionaries (<500 rows).
2. Debounce global filter input (200–300ms) before feeding table/URL.
3. Memoize expensive cells; avoid inline arrow components in `cell`.
4. Selection state lives in Zustand (see client-state skill), table only renders it.

## Checklist

- [ ] Columns memoized.
- [ ] `flexRender` used.
- [ ] Pagination source decided (server vs client).
- [ ] 1000+ rows virtualized.
