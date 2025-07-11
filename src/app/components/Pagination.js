import React, { useState, useEffect } from 'react';
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
    const [isMobile, setIsMobile] = useState(false);
    
    // Handle responsive behavior
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        
        // Set initial value
        checkIsMobile();
        
        // Add event listener
        window.addEventListener('resize', checkIsMobile);
        
        // Cleanup
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    const noPagination = totalItems <= setsPerPage;

    // Don't render pagination if not needed
    if (noPagination || totalPages <= 1) return null;

    const delta = 10; // Show 10 pages per group
    const startPage = Math.floor((currentPage - 1) / delta) * delta + 1;
    const endPage = Math.min(startPage + delta - 1, totalPages);

    // Generate an array of page numbers to display in the current group
    const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);

    // Check if there are pages before and after the current group for ellipses
    const showPrevEllipsis = startPage > 1;
    const showNextEllipsis = endPage < totalPages;

    // Filter page numbers for mobile
    const visiblePageNumbers = isMobile 
        ? pageNumbers.filter((_, idx) => {
            // Show only 5 pages on small screens
            const half = 2;
            const start = Math.max(currentPage - half - 1, 0);
            const end = Math.min(currentPage + half, pageNumbers.length);
            return idx >= start && idx < end;
        })
        : pageNumbers;

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
            {visiblePageNumbers.map((number) => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 border rounded-md transition-colors ${
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
