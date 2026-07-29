# Frontend (React + Vite)

## 처음 한 번: Vite 앱 생성
이 폴더(frontend/)에서:
npm create vite@latest . -- --template react
npm install
npm install axios zustand chart.js react-chartjs-2
# Tailwind: https://tailwindcss.com/docs/guides/vite 공식 가이드 따라 설정
cp .env.example .env
npm run dev

## 뼈대 목표
src/api/useVitals.js 훅으로 SSE를 구독해서, 심박수 숫자가
실시간으로 바뀌는 화면 하나를 먼저 만드세요.
(백엔드 + 하드웨어 더미가 켜져 있어야 값이 흐릅니다)

예:
import { useVitals } from "./api/useVitals";
function App() {
  const v = useVitals("test-001");
  return <h1>심박수: {v?.heart_rate ?? "--"}</h1>;
}
