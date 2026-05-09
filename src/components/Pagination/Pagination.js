function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) {
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage
    const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalItems)

    const getPageNumbers = () => {
        const pages = []
        const maxVisiblePages = 5
        
        if (totalPages <= maxVisiblePages + 2) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // Always show first page
            pages.push(1)
            
            let startPage = Math.max(2, currentPage - 1)
            let endPage = Math.min(totalPages - 1, currentPage + 1)
            
            // Adjust if near the start
            if (currentPage <= 3) {
                endPage = Math.min(maxVisiblePages, totalPages - 1)
            }
            
            // Adjust if near the end
            if (currentPage >= totalPages - 2) {
                startPage = Math.max(2, totalPages - maxVisiblePages + 1)
            }
            
            // Add ellipsis after first page if needed
            if (startPage > 2) {
                pages.push('...')
            }
            
            // Add middle pages
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i)
            }
            
            // Add ellipsis before last page if needed
            if (endPage < totalPages - 1) {
                pages.push('...')
            }
            
            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages)
            }
        }
        
        return pages
    }

    const pageNumbers = getPageNumbers()

    return (
        <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
                Showing {totalItems > 0 ? indexOfFirstItem + 1 : 0} to {indexOfLastItem} of {totalItems} entries
            </div>
            <div className="flex gap-1">
                {/* First page button */}
                <button 
                    className="btn btn-sm btn-ghost" 
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    title="First page"
                >
                    «
                </button>
                
                {/* Previous button */}
                <button 
                    className="btn btn-sm btn-ghost" 
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous page"
                >
                    ‹
                </button>
                
                {/* Page numbers */}
                {pageNumbers.map((page, index) => (
                    page === '...' ? (
                        <span key={`ellipsis-${index}`} className="btn btn-sm btn-ghost btn-disabled">
                            ...
                        </span>
                    ) : (
                        <button 
                            key={page}
                            className={`btn btn-sm ${currentPage === page ? 'btn-active btn-primary' : 'btn-ghost'}`}
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </button>
                    )
                ))}
                
                {/* Next button */}
                <button 
                    className="btn btn-sm btn-ghost" 
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Next page"
                >
                    ›
                </button>
                
                {/* Last page button */}
                <button 
                    className="btn btn-sm btn-ghost" 
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Last page"
                >
                    »
                </button>
            </div>
        </div>
    )
}

export default Pagination
