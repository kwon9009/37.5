import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./style.css";
import "./guardian/index.css";
// 설치 안내(홈 화면에 추가)를 놓치지 않도록, 화면이 그려지기 전에 이벤트부터 잡아 둔다
import "./guardian/lib/pwa-install.ts";

// 서비스 워커 등록. 이게 있어야 크롬이 "설치 가능한 앱"으로 인정한다.
// 개발 중에는 캐시가 수정한 코드를 가려서 헷갈리므로 빌드된 앱에서만 켠다.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // 등록 실패해도 앱은 그대로 동작한다 (설치 버튼만 안 뜸)
    });
  });
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
