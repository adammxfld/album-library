import type { SortOrder } from "../hooks/useAlbumFilters";
import { AzIcon, RandomIcon } from "./SortIcons";
import "./SortFilter.scss";

type SortProps = {
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
}

const sortOptions: { order: SortOrder; label: string; Icon: () => React.JSX.Element }[] = [
  { order: "random", label: "Random order", Icon: RandomIcon },
  { order: "alphabetical", label: "Alphabetical order", Icon: AzIcon },
]

function SortFilter({ sortOrder, onSortOrderChange }: SortProps) {
  return (
    <div className="sort-options">
      {sortOptions.map((option) => (
        <button
          key={option.order}
          type="button"
          className={`btn-sort${option.order === sortOrder ? " selected" : ""}`}
          aria-pressed={option.order === sortOrder}
          aria-label={option.label}
          title={option.label}
          onClick={() => onSortOrderChange(option.order)}>
          <option.Icon />
        </button>
      ))}
    </div>
  );
}

export default SortFilter;
