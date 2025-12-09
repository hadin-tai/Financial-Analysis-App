import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export default function Pagination({ page, totalPages, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-center gap-4 my-4">
      <div className="rounded-full border border-black/50 px-4 py-2 flex items-center gap-4">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeftIcon />
        </button>
        <span className="text-sm md:text-base font-medium">
          Page: {page} of {Math.max(totalPages || 1, 1)}
        </span>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}
