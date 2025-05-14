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
        <div className="flex mt-4 gap-2 items-center justify-center">
            {/* Previous Button */}
            <button
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-100"
            >
                <ChevronLeft size={24} />
            </button>

            {/* Previous Ellipsis */}
            {showPrevEllipsis && (
                <span className="px-4 py-2 text-gray-500">...</span>
            )}

            {/* Page Numbers */}
            {pageNumbers.map((number) => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`px-4 py-2 border rounded-md transition-colors ${
                        currentPage === number
                            ? 'bg-cyan-400 text-white'
                            : 'bg-white hover:bg-gray-100'
                    }`}
                >
                    {number}
                </button>
            ))}

            {/* Next Ellipsis */}
            {showNextEllipsis && (
                <span className="px-4 py-2 text-gray-500">...</span>
            )}

            {/* Next Button */}
            <button
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-100"
            >
                <ChevronRight size={24} />
            </button>
        </div>
    );
};

export default Pagination;
