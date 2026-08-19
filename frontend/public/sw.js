/*
 * 보호자 앱 서비스 워커 (최소 구성).
 *
 * 왜 필요한가: 크롬은 "설치 가능한 앱"으로 인정할 때 fetch 를 처리하는 서비스
 * 워커가 있는지를 본다. 이게 없으면 홈 화면 추가 버튼(beforeinstallprompt)이
 * 아예 뜨지 않는다.
 *
 * 무엇을 하는가: 화면 이동(navigate) 요청만 다룬다. 인터넷이 되면 그대로
 * 네트워크에서 받아오고(항상 최신 화면), 안 되면 저장해 둔 앱 껍데기를 보여준다.
 *
 * 무엇을 하지 않는가: 생체신호 같은 API 응답은 절대 캐시하지 않는다.
 * 옛날 심박수를 최신값처럼 보여주면 위험하기 때문이다.
 */

const CACHE = "guardian-shell-v1";
const SHELL = "/index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // 화면 이동만 처리. 나머지(API·이미지·스크립트)는 브라우저 기본 동작에 맡긴다.
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 다음 오프라인 실행을 위해 최신 껍데기를 저장해 둔다
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(SHELL, copy));
        return response;
      })
      .catch(() => caches.match(SHELL).then((cached) => cached || Response.error()))
  );
});
