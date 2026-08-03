# Frontend (React + Vite)

## 처음 한 번: Vite 앱 생성
이 폴더(frontend/)에서:
npm create vite@latest . -- --template react
npm install
npm install axios zustand chart.js react-chartjs-2
# Tailwind: https://tailwindcss.com/docs/guides/vite 공식 가이드 따라 설정
cp .env.example .env
npm run dev

## 실시간 값 받아오기 (SSE)
센서 값은 폴링(N초마다 다시 물어보기)이 아니라 서버가 값을 받는 즉시 밀어줍니다.

- src/api/vital-stream.js : 접속·재연결을 담당하는 공용 도우미
- src/api/useVitals.js    : 환자 1명을 구독하는 React 훅

접속은 두 단계입니다. 브라우저의 SSE 도구(EventSource)는 요청 헤더를 붙일 수 없어서
로그인 토큰을 그대로 실을 수 없기 때문에,
(1) 로그인 토큰으로 60초짜리 1회용 티켓을 받고 (2) 그 티켓으로 접속합니다.
이 과정은 vital-stream.js가 알아서 처리하므로 화면 코드에서는 신경 쓰지 않아도 됩니다.

예 (로그인된 상태여야 합니다):
import { useVitals } from "./api/useVitals";
function Example() {
  const { vitals, status } = useVitals(1);   // 환자 ID
  return <h1>심박수: {vitals?.heart_rate ?? "--"}</h1>;
}

여러 환자를 한 번에 볼 때(대시보드)는 openVitalStream({ scope: "department", ... })를 씁니다.
연결이 끊기면 자동으로 다시 붙고, 그동안에는 기존 폴링이 5초 간격으로 화면을 채웁니다.
