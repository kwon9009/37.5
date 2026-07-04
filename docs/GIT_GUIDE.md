# Git 협업 가이드 (팀원용)

비전공자 팀원도 그대로 따라 할 수 있게 만든 협업 설명서입니다.
브랜치/커밋 **규칙 자체**는 [CONTRIBUTING.md](../CONTRIBUTING.md)에, 여기선 **"어떻게 하는지" 실전 방법**을 담았습니다.

---

## 0. 큰 그림 (1분 이해)

- 저장소(레포)는 **딱 하나**를 4명이 공유합니다 → https://github.com/kwon9009/37.5
- 각자 그걸 **자기 컴퓨터에 복제(clone)** 해서, **자기 컴퓨터에서 작업**합니다.
- 작업이 끝나면 **push + PR**로 합칠 때만 공유 레포를 건드립니다.

> 핵심 원칙: 브랜치는 **"사람마다"가 아니라 "작업(기능)마다"** 만듭니다.
> 작업 하나 = 브랜치 하나, 합치고 나면 그 브랜치는 삭제합니다.

```
[내 컴퓨터: 브랜치에서 작업] --push--> [GitHub: PR] --리뷰1명--> [main에 merge]
        ^                                                              |
        |--------------------- git pull (최신 받기) --------------------|
```

---

## 1. 최초 1회 세팅

### (레포 주인만) 팀원 초대
레포가 개인 계정(`kwon9009`) 소유라, **초대해야 팀원이 push할 수 있습니다.**
GitHub 레포 → `Settings` → `Collaborators` → `Add people` → 팀원 GitHub 아이디 입력 → 초대.
초대받은 팀원은 이메일/알림의 **초대를 수락**해야 합니다.

### (팀원 각자) git 설정 + 복제
```bash
# 본인 정보 등록 (한 번만)
git config --global user.name "본인이름"
git config --global user.email "본인깃허브이메일@example.com"

# 레포 복제
git clone https://github.com/kwon9009/37.5.git
cd "37.5"
```

### (팀원 각자) 개발환경 세팅
자기가 맡은 부분의 README를 따라 하세요:
- 백엔드 → [backend/README.md](../backend/README.md)
- 하드웨어 → [hardware/README.md](../hardware/README.md)
- 프론트 → [frontend/README.md](../frontend/README.md)

> `.env`는 **절대 커밋 금지**입니다. `.env.example`을 복사해 `.env`로 만들어 본인 값만 채우세요.

---

## 2. 매일 작업하는 흐름 (계속 반복)

```bash
# ① 항상 최신 main에서 시작
git checkout main
git pull                                   # 남들이 합친 최신 내용 받기

# ② 작업용 브랜치 만들기  (규칙: 타입/영역-내용)
git checkout -b feat/be-vitals-api

# ③ ...코드 작업...

# ④ 저장(commit)
git add .
git commit -m "feat: 심박 POST 엔드포인트 추가"

# ⑤ 내 브랜치를 GitHub로 올리기
git push -u origin feat/be-vitals-api
```

그다음 **GitHub 웹사이트**에서:
1. `Compare & pull request` 버튼 → **PR** 생성 (제목/설명 작성)
2. 팀원 **1명이 리뷰** → `Files changed` 확인 → **Approve**
3. **`Merge pull request`** → main에 합치기
4. **`Delete branch`** → 끝난 브랜치 정리

### 이름/메시지 규칙 (요약)
- 브랜치: `타입/영역-내용` — 타입=`feat`/`fix`/`docs`/`chore`, 영역=`be`/`fe`/`hw`
  - 예: `feat/be-vitals-api`, `fix/fe-chart-lag`, `feat/hw-mmwave-reader`
- 커밋: `타입: 내용`
  - 예: `feat: 심박 파싱 추가`, `fix: SSE 재연결 버그 수정`

---

## 3. 남이 합친 뒤 최신화 / 충돌

누가 main에 merge하면 나도 받아옵니다:
```bash
git checkout main
git pull
```

작업 중인 브랜치가 오래됐다면, 최신 main을 내 브랜치로 끌어오기:
```bash
git checkout feat/내-브랜치
git merge main
```

**충돌(conflict)** 이 나면 (같은 파일 같은 줄을 둘이 고친 경우), git이 `<<<<<<<` 표시를 남깁니다.
당황하지 말고 팀 채널에 공유하거나 Claude Code에게 도움을 요청하세요.

---

## 4. main 브랜치 보호 설정 (레포 주인이 1회)

실수로 main에 직접 push하거나, 리뷰 없이 합치는 걸 막는 안전장치입니다.
`Settings` → 왼쪽 `Branches` → **`Add branch protection rule`**:

- **Branch name pattern**: `main`
- ✅ **Require a pull request before merging** (PR 없이는 main 변경 불가)
  - **Require approvals**: `1` (팀 규칙: 리뷰 1명)
  - ✅ Dismiss stale approvals (새 커밋 올리면 승인 초기화 — 선택)
- ✅ **Require conversation resolution before merging** (리뷰 코멘트 다 처리해야 merge — 선택, 권장)
- ✅ **Do not allow bypassing the above settings** (관리자도 규칙 적용 — 권장)
- ❌ Require status checks: 아직 자동 테스트(CI)가 없으니 **끄기**

`Create`로 저장.

> 주의할 점
> - **본인 PR은 본인이 승인 못 합니다.** 승인 1명 규칙이면 항상 다른 팀원이 Approve 해야 합니다.
> - 비공개(private) 레포에서 옵션이 제한되면, 같은 기능을 무료로 쓰는 **`Rulesets`**(Settings → Rules → Rulesets)로 대체하세요.

---

## 5. 자주 쓰는 명령어 모음

| 하고 싶은 것 | 명령어 |
|---|---|
| 최신 상태 받기 | `git pull` |
| 지금 상태 보기 | `git status` |
| 새 작업 브랜치 만들기 | `git checkout -b feat/be-xxx` |
| 브랜치 이동 | `git checkout 브랜치이름` |
| 변경 저장(스테이지) | `git add .` |
| 커밋 | `git commit -m "feat: ..."` |
| 브랜치 업로드 | `git push -u origin 브랜치이름` |
| 브랜치 목록 | `git branch` |
| 최근 커밋 보기 | `git log --oneline` |

> 막히면 Claude Code에게 "이 상황 어떻게 해?" 하고 화면 상태(`git status` 결과)를 보여주면 됩니다.
