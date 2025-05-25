import React from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination component for paginating through data.
 *
 * @param {number} currentPage - The currently active page.
 * @param {number} totalPages - Total number of pages.
 * @param {function} onPageChange - Function to call when changing pages.
 * @param {number} totalItems - Total number of data items.
 * @param {number} setsPerPage - Items per page (used to hide pagination if unnecessary).
 */
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, setsPerPage }) => {
    const noPagination = totalItems <= setsPerPage;

    // Don't render pagination if not needed
    if (noPagination || totalPages <= 1) return null;

    const delta = 10; // Show 5 pages per group
    const startPage = Math.floor((currentPage - 1) / delta) * delta + 1;
    const endPage = Math.min(startPage + delta - 1, totalPages);

    // Generate an array of page numbers to display in the current group
    const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);

    // Check if there are pages before and after the current group for ellipses
    const showPrevEllipsis = startPage > 1;
    const showNextEllipsis = endPage < totalPages;

    return (
        <div className="flex flex-wrap gap-2 mt-4 items-center justify-center text-sm sm:text-base">
  {/* Previous Button */}
  <button
    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
    disabled={currentPage === 1}
    className="px-3 py-1.5 sm:px-4 sm:py-2 border rounded-md disabled:opacity-50 hover:bg-gray-100"
  >
    <ChevronLeft size={20} />
  </button>

  {/* Previous Ellipsis */}
  {showPrevEllipsis && (
    <span className="px-2 sm:px-4 py-1.5 text-gray-500">...</span>
  )}

  {/* Page Numbers */}
  {pageNumbers
    .filter((_, idx) => {
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        // Show only 5 pages on small screens
        const half = 5;
        const start = Math.max(currentPage - half - 1, 0);
        const end = Math.min(currentPage + half, pageNumbers.length);
        return idx >= start && idx < end;
      }
      return true;
    })
    .map((number) => (
      <button
        key={number}
        onClick={() => onPageChange(number)}
         className={`
                        px-4 py-2 rounded border
                        ${currentPage === number
                            ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500 dark:text-white'
                            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100 hover:text-black dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-white'
                        }
                        transition
                    `}
                >
        {number}
      </button>
    ))}

  {/* Next Ellipsis */}
  {showNextEllipsis && (
    <span className="px-2 sm:px-4 py-1.5 text-gray-500">...</span>
  )}

  {/* Next Button */}
  <button
    onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
    disabled={currentPage === totalPages}
    className="px-3 py-1.5 sm:px-4 sm:py-2 border rounded-md disabled:opacity-50 hover:bg-gray-100"
  >
    <ChevronRight size={20} />
  </button>
</div>


    );
};

export default Pagination;
