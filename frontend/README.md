# Frontend (React + Vite)

## 처음 받았을 때

```bash
npm install
cp .env.example .env     # 윈도우 PowerShell: copy .env.example .env
npm run dev
```

`.env` 를 만들지 않으면 **지도가 뜨지 않습니다.** 카카오맵 키를 못 읽어 주소만 보이는
대체 화면으로 넘어갑니다. `.env` 는 git 에 올리지 않으므로 저장소를 새로 받을 때마다 만들어야 합니다.

| 환경변수 | 용도 | 없으면 |
|---|---|---|
| `VITE_API_URL` | 백엔드 주소 (기본 `http://localhost:8000`) | 로그인·데이터 요청 실패 |
| `VITE_KAKAO_MAP_KEY` | 카카오맵 JavaScript 키 | 지도 대신 주소만 표시 |

**Vite 는 `.env` 를 서버가 시작할 때 한 번만 읽습니다.** 값을 고쳤으면 `npm run dev` 를
껐다 켜야 반영됩니다.

백엔드도 같이 띄워야 화면에 데이터가 들어옵니다. `backend/README.md` 를 참고하세요.

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
