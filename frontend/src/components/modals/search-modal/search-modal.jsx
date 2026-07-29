import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../api/client.js";

function HospitalSearchModal({ isOpen, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "done" | "error"
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setStatus("idle");
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (trimmed === "") {
      setResults([]);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    const timeoutId = setTimeout(() => {
      apiClient
        .get("/hospitals", { params: { query: trimmed } })
        .then(({ data }) => {
          setResults(data);
          setStatus("done");
        })
        .catch(() => {
          setResults([]);
          setStatus("error");
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div
      className="search-modal fixed inset-0 z-50 flex items-center justify-center bg-[#1E2A3ACC] p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="searchModalTitle"
        className="search-modal__panel flex w-[480px] max-w-full max-h-[85vh] flex-col gap-4 overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white p-8 shadow-[0_12px_32px_rgba(30,42,58,0.25)]"
      >
        <div className="search-modal__head flex items-center justify-between">
          <h2 id="searchModalTitle" className="text-xl font-bold text-[#1E2A3A]">
            병원 검색
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="search-modal__close flex h-8 w-8 items-center justify-center rounded-full bg-[#EDF1F6] text-[#5A6B80] hover:bg-[#DCE3EC]"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="search-modal__search flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px]">
          <svg
            aria-hidden="true"
            focusable="false"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[#5A6B80]"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="병원명으로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full border-0 bg-transparent text-[15px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
          />
        </div>
        <p className="search-modal__helper -mt-2 text-xs text-[#5A6B80]">
          병원명으로 검색할 수 있어요
        </p>

        <ul className="search-modal__results flex flex-col overflow-y-auto rounded-xl border border-[#DCE3EC]">
          {status === "idle" && (
            <li className="px-4 py-8 text-center text-sm text-[#5A6B80]">검색어를 입력해 주세요.</li>
          )}
          {status === "loading" && (
            <li className="px-4 py-8 text-center text-sm text-[#5A6B80]">검색 중...</li>
          )}
          {status === "error" && (
            <li className="px-4 py-8 text-center text-sm text-[#E0435D]">검색 중 오류가 발생했습니다.</li>
          )}
          {status === "done" && results.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-[#5A6B80]">일치하는 병원이 없습니다.</li>
          )}
          {status === "done" &&
            results.map((hospital, index) => (
              <li key={hospital.hospital_id} className={index > 0 ? "border-t border-[#DCE3EC]" : ""}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(hospital);
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left bg-white hover:bg-[#F5F7FA]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDF1F6] text-[#5A6B80]">
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 22V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v18Z" />
                      <path d="M6 12H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" />
                      <path d="M18 9h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2" />
                      <path d="M10 6h4" />
                      <path d="M10 10h4" />
                      <path d="M10 14h4" />
                      <path d="M10 18h4" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    <span className="truncate text-sm font-bold text-[#1E2A3A]">{hospital.name}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-[#EDF1F6] px-[10px] py-1 text-[11px] font-bold text-[#5A6B80]">
                    {hospital.area}
                  </span>
                </button>
              </li>
            ))}
        </ul>

        <p className="search-modal__footer flex items-center justify-center gap-1 pt-1 text-xs">
          <span className="text-[#5A6B80]">찾는 병원이 없나요?</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/signup/hospital-code");
            }}
            className="font-bold text-[#2B6FE3] hover:underline"
          >
            병원 직접 등록하기
          </button>
        </p>
      </div>
    </div>
  );
}

export default HospitalSearchModal;
