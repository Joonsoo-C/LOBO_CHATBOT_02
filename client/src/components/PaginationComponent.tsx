import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface PaginationComponentProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationComponent({
  currentPage,
  totalPages,
  onPageChange,
  className
}: PaginationComponentProps) {
  // 표시할 페이지 번호들을 계산
  const getVisiblePages = () => {
    const pages = []
    const maxVisible = 7 // 최대 표시할 페이지 수
    
    if (totalPages <= maxVisible) {
      // 전체 페이지가 7개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 현재 페이지 기준으로 앞뒤 2개씩 표시
      let start = Math.max(1, currentPage - 2)
      let end = Math.min(totalPages, currentPage + 2)
      
      // 시작이나 끝에 가까우면 조정
      if (currentPage <= 3) {
        end = Math.min(5, totalPages)
      } else if (currentPage >= totalPages - 2) {
        start = Math.max(totalPages - 4, 1)
      }
      
      // 첫 페이지 추가
      if (start > 1) {
        pages.push(1)
        if (start > 2) {
          pages.push('ellipsis-start')
        }
      }
      
      // 중간 페이지들 추가
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      // 마지막 페이지 추가
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push('ellipsis-end')
        }
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        
        {visiblePages.map((page, index) => (
          <PaginationItem key={index}>
            {typeof page === 'string' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                isActive={page === currentPage}
                onClick={() => onPageChange(page)}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        
        <PaginationItem>
          <PaginationNext 
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}