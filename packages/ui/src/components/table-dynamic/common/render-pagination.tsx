const RenderPagination = ({totalPages, currentPage, handlePageChange}:any) => {
    if (typeof totalPages !== "number" || totalPages <= 0) {
      return null; // Don't render pagination if no pages
    }
    if (typeof currentPage !== "number" || currentPage < 1 || currentPage > totalPages) {
      return null; // Don't render if current page is invalid
    }
    if (typeof handlePageChange !== "function") {
      return null; // Don't render if handler is not a function
    }
  
    const pages = [];
  
    // Constants for button styles
    const baseButtonClass = "w-8 h-8 flex items-center justify-center rounded-full";
    const activeButtonClass = "bg-gray-800 text-white";
    const inactiveButtonClass = "bg-white text-gray-700 hover:bg-gray-100";
  
    // Helper function to render a page button
    const renderPageButton = (pageNumber:any, isActive = false) => (
      <button
        key={pageNumber}
        onClick={() => handlePageChange(pageNumber)}
        className={`${baseButtonClass} ${isActive ? activeButtonClass : inactiveButtonClass}`}
        aria-label={`Go to page ${pageNumber}`}
        aria-current={isActive ? "page" : undefined}
      >
        {pageNumber}
      </button>
    );
  
    // Helper function to render an ellipsis
    const renderEllipsis = (key:any) => (
      <span key={key} className="w-8 h-8 flex items-center justify-center">
        ...
      </span>
    );
  
    if (totalPages <= 5) {
      // Show all pages if total pages are 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(renderPageButton(i, currentPage === i));
      }
    } else {
      // Show first page
      pages.push(renderPageButton(1, currentPage === 1));
  
      // Show ellipsis if there's a gap
      if (currentPage > 3) {
        pages.push(renderEllipsis('ellipsis1'));
      }
  
      // Show previous button if current page is greater than 2
      if (currentPage > 2) {
        pages.push(renderPageButton(currentPage - 1));
      }
  
      // Show current page if it's not the first or last page
      if (currentPage > 1 && currentPage < totalPages) {
        pages.push(renderPageButton(currentPage, true));
      }
  
      // Show next button if current page is less than totalPages - 1
      if (currentPage < totalPages - 1) {
        pages.push(renderPageButton(currentPage + 1));
      }
  
      // Show ellipsis if there's a gap
      if (currentPage < totalPages - 2) {
        pages.push(renderEllipsis('ellipsis2'));
      }
  
      // Show last page
      pages.push(renderPageButton(totalPages, currentPage === totalPages));
    }
  
    return pages;
  };
  export default RenderPagination