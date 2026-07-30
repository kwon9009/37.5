import axios from "axios";
import { useAuthStore } from "../store/auth-store.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

// 필드명(loc의 마지막 조각) -> 화면에 보여줄 한글 라벨
const FIELD_LABEL = {
  hospital_id: "소속 병원",
  hospital_name: "병원명",
  department_name: "부서명",
  login_id: "아이디",
  email: "이메일",
  password: "비밀번호",
  name: "이름",
  phone: "휴대전화 번호",
  address: "주소",
  bed_count: "병상 수",
};

// FastAPI 에러 응답에서 화면에 보여줄 문자열만 뽑아낸다.
// detail이 문자열(HTTPException)일 수도, 배열(pydantic 422 검증 오류)일 수도 있어서
// 배열을 그대로 렌더링하면 React가 "Objects are not valid as a React child"로 죽는다.
// 배열인 경우 어느 필드가 문제인지 알 수 있게 필드명(한글 라벨)도 같이 붙인다.
export function getErrorMessage(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => {
        const field = item.loc?.[item.loc.length - 1];
        const label = FIELD_LABEL[field] ?? field;
        return label ? `${label}: ${item.msg}` : item.msg ?? String(item);
      })
      .join(" / ");
  }
  return fallback;
}
