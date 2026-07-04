# 협업 규칙

## 브랜치 전략 (GitHub Flow)
- main : 항상 정상 동작하는 상태 유지. 직접 push 금지!
- 작업할 땐 항상 main에서 새 브랜치를 만들어서 -> PR -> 리뷰 1명 -> merge -> 브랜치 삭제.

### 브랜치 이름
타입/영역-내용
- 타입: feat(기능) / fix(버그) / docs(문서) / chore(설정)
- 영역: be(백엔드) / fe(프론트) / hw(하드웨어)
- 예) feat/be-vitals-api, fix/fe-chart-lag, feat/hw-mmwave-reader

## 커밋 메시지
타입: 내용
- 예) feat: 심박 POST 엔드포인트 추가
- 예) fix: SSE 재연결 버그 수정

## 작업 흐름
git checkout main && git pull
git checkout -b feat/be-vitals-api
# ...작업...
git add . && git commit -m "feat: ..."
git push origin feat/be-vitals-api
# GitHub에서 PR 생성 -> 리뷰 -> merge
