export type SortOption = "newest" | "payment-desc" | "payment-asc" | "status";

type FilterBarProps = {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
  totalCount: number;
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "0", label: "Posted" },
  { value: "1", label: "Accepted" },
  { value: "2", label: "Completed" },
  { value: "3", label: "Disputed" },
  { value: "4", label: "Cancelled" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "payment-desc", label: "Payment: high → low" },
  { value: "payment-asc", label: "Payment: low → high" },
  { value: "status", label: "By status" },
];

export function FilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sort,
  onSortChange,
  totalCount,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <input
        type="search"
        placeholder="Search jobs..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search jobs by description"
      />
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        aria-label="Sort jobs"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="card-metric" style={{ marginLeft: "auto" }}>
        <strong>{totalCount}</strong> job{totalCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

export function filterAndSortJobs<T>(
  items: T[],
  options: {
    search: string;
    statusFilter: string;
    sort: SortOption;
    getDescription: (item: T) => string;
    getStatus: (item: T) => number;
    getPayment: (item: T) => bigint;
    getIndex: (item: T) => number;
  }
): T[] {
  const { search, statusFilter, sort, getDescription, getStatus, getPayment, getIndex } = options;
  let result = [...items];

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter((item) => getDescription(item).toLowerCase().includes(q));
  }
  if (statusFilter !== "") {
    const s = parseInt(statusFilter, 10);
    result = result.filter((item) => getStatus(item) === s);
  }
  if (sort === "payment-desc") {
    result.sort((a, b) => (getPayment(b) > getPayment(a) ? 1 : -1));
  } else if (sort === "payment-asc") {
    result.sort((a, b) => (getPayment(a) > getPayment(b) ? 1 : -1));
  } else if (sort === "status") {
    result.sort((a, b) => getStatus(a) - getStatus(b));
  } else {
    result.sort((a, b) => getIndex(b) - getIndex(a));
  }
  return result;
}
