import { create } from "zustand";
import { persist } from "zustand/middleware";

// 백엔드에 "병원 등록 요청" API가 아직 없어서, 관리자 페이지와 공유하기 위해
// 임시로 localStorage에 저장한다. (TODO: 백엔드 준비되면 실제 API로 교체)
export const useHospitalRequestStore = create(
  persist(
    (set) => ({
      requests: [],

      submitRequest: ({ hospitalName, area, address }) => {
        const request = {
          id: `HREQ-${Date.now()}`,
          hospitalName,
          area,
          address,
          status: "대기중",
          requestedAt: new Date().toLocaleString("ko-KR", { hour12: false }),
        };
        set((state) => ({ requests: [request, ...state.requests] }));
        return request;
      },

      approveRequest: (id) => {
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === id ? { ...request, status: "승인됨" } : request
          ),
        }));
      },

      rejectRequest: (id) => {
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === id ? { ...request, status: "거절됨" } : request
          ),
        }));
      },
    }),
    { name: "37.5-hospital-requests" }
  )
);
