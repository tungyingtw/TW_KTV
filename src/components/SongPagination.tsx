import { useEffect, useRef, useState } from 'react';

interface Props { currentPage: number; totalPages: number; compact: boolean; onPageChange: (page: number) => void }

export function SongPagination({ currentPage, totalPages, compact, onPageChange }: Props) {
  const [draft, setDraft] = useState(String(currentPage));
  const [jumpOpen, setJumpOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setDraft(String(currentPage)); }, [currentPage, totalPages]);
  useEffect(() => { if (jumpOpen) { inputRef.current?.focus(); inputRef.current?.select(); } }, [jumpOpen]);
  const requestedPage = Number(draft);
  const valid = /^\d+$/.test(draft) && Number.isSafeInteger(requestedPage) && requestedPage >= 1 && requestedPage <= totalPages;
  const pages = Array.from({ length: totalPages <= 7 ? totalPages : 0 }, (_, index) => index + 1);
  if (!pages.length) {
    pages.push(1);
    for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page++) pages.push(page);
    pages.push(totalPages);
  }
  const changePage = (page: number) => {
    setJumpOpen(false);
    setDraft(String(page));
    if (page !== currentPage) onPageChange(page);
  };
  return (
    <nav aria-label="歌曲分頁" className="song-pagination">
      <div className="song-pagination-controls">
        <button type="button" className="btn-secondary" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>上一頁</button>
        {compact ? (
          <button type="button" className="song-pagination-summary" aria-label={`目前第 ${currentPage} 頁，共 ${totalPages} 頁，點擊指定跳頁`} aria-expanded={jumpOpen} aria-controls="song-page-jump" onClick={() => setJumpOpen(value => !value)}>第 {currentPage} / {totalPages} 頁 <span aria-hidden="true">⌄</span></button>
        ) : (
          <div className="song-pagination-numbers">
            {pages.map((page, index) => <span key={page} className="song-pagination-item">
              {index > 0 && page - pages[index - 1] > 1 && <span className="song-pagination-ellipsis" aria-hidden="true">…</span>}
              <button type="button" className={page === currentPage ? 'btn-primary' : 'btn-secondary'} aria-label={`第 ${page} 頁`} aria-current={page === currentPage ? 'page' : undefined} onClick={() => changePage(page)}>{page}</button>
            </span>)}
          </div>
        )}
        <button type="button" className="btn-primary" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>下一頁</button>
      </div>
      {(!compact || jumpOpen) && <form id="song-page-jump" className="song-pagination-jump" onSubmit={event => { event.preventDefault(); if (valid) changePage(requestedPage); }}>
        {!compact && <span>第 {currentPage} / {totalPages} 頁</span>}
        <label htmlFor="song-page-number">跳至</label>
        <input ref={inputRef} id="song-page-number" type="text" inputMode="numeric" pattern="[0-9]+" required maxLength={String(totalPages).length} value={draft} aria-label={`頁碼，1 至 ${totalPages}`} aria-invalid={draft !== '' && !valid} aria-describedby="song-page-range" onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') setJumpOpen(false); }} />
        <span>頁</span>
        <button type="submit" className="btn-secondary" disabled={!valid}>前往</button>
        <span id="song-page-range" className="song-pagination-range">可輸入 1–{totalPages}</span>
      </form>}
    </nav>
  );
}
