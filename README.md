# ⚾ 한방 스윙스 (Hanbang Swings)

> 야구 동아리 **'한방 스윙스'**를 위한 웹 기반 통합 라인업 & 경기 기록 관리 애플리케이션입니다.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-10B981?style=for-the-badge&logo=github)](https://sungyullim.github.io/hanbangSwings/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

---

## 🌟 라이브 데모 (Live Site)

👉 **웹사이트 접속**: [https://sungyullim.github.io/hanbangSwings/](https://sungyullim.github.io/hanbangSwings/)

---

## 💡 주요 기능 (Key Features)

### 1. 🏟️ 시각적 야구장 다이아몬드 & 타순 작성 (Lineup Builder)
- **수비 위치 표기**: 야구장 다이아몬드 그래픽 위에 9개 수비 포지션(P, C, 1B, 2B, 3B, SS, LF, CF, RF)과 지명타자(DH), 벤치 선수를 직관적으로 배치.
- **선발 타순 (1번~9번 + DH)**: 드래그 앤 드롭으로 간편한 타순 순서 변경.
- **투수(P)의 지명타자(DH) 출전 지원**: 투수가 지명타자나 타순에 직접 출전하는 투타 겸업(오타니 룰) 완벽 지원.

### 2. ⚔️ 대외 경기 & 동아리 자체 청백전 지원
- **대외 경기**: 타 팀과의 공식/친선 경기 관리.
- **청백전 (내부 경기)**: 동아리 자체전 진행 시 **청팀 라인업**과 **백팀 라인업**을 각각 세팅하고 팀별 스코어 기록.

### 3. 📊 경기 후 성적 입력 및 개인/팀 통계 집계
- **투타 겸업 기록**: 한 경기에 출전한 선수의 타격 기록과 투구 기록을 동시에 작성 가능.
- **자동 비율 지표 연산**: 타율(BA), 출루율(OBP), 장타율(SLG), OPS, 방어율(ERA) 자동 연산.
- **리더보드 (Leaderboard)**: 타율/홈런/타점/방어율 등 부문별 순위표 제공 및 규정 타석/이닝 필터.
- **선수 프로필 카드**: 선수별 통산 성적 요약 및 경기에 따른 타율 트렌드 선 그래프 제공.

### 4. 🔑 권한 분리 및 안전한 경기 삭제 (Admin System)
- **일반 회원 모드 (조회 전용)**: 경기 기록, 라인업, 리더보드를 유실 걱정 없이 자유롭게 열람.
- **관리자 모드 (암호 인증)**: 헤더의 `🔑 관리자 로그인` (비밀번호: `hanbang2026`)을 통해 경기 생성, 라인업/성적 편집 및 기존 완료된 경기 삭제 가능.

### 5. 🔗 라인업 카카오톡 & SNS 원클릭 웹 공유
- 경기 전 완성된 라인업을 단 하나의 링크로 생성하여 동아리원들에게 간편하게 공유.

---

## 📋 26-2 선수단 공식 배번 및 포지션 명단 (23명)

| 배번 | 이름 | 소화 포지션 |
|:---:|:---:|:---:|
| **#2** | **정회제** | 2루수(2B), 유격수(SS) |
| **#3** | **이건욱** | 3루수(3B) |
| **#4** | **김준혁** | 3루수(3B), 1루수(1B) |
| **#6** | **박준현** | 외야수(LF/CF/RF) |
| **#12** | **이민형** | 포수(C), 1루수(1B) |
| **#13** | **김세훈** | 포수(C) |
| **#15** | **강현승** | 투수(P) |
| **#16** | **임성열** | 투수(P) |
| **#17** | **김필립** | 우익수(RF) |
| **#18** | **서지호** | 포수(C), 3루수(3B) |
| **#21** | **김승현** | 투수(P) |
| **#23** | **문예찬** | 좌익수(LF) |
| **#31** | **김찬호** | 유격수(SS), 2루수(2B) |
| **#33** | **구도현** | 1루수(1B) |
| **#36** | **탁월한** | 투수(P), 유격수(SS) |
| **#39** | **이준민** | 좌익수(LF) |
| **#41** | **이정훈** | 포수(C) |
| **#42** | **석권원** | 투수(P), 포수(C) |
| **#51** | **유은택** | 외야수(CF/LF/RF) |
| **#52** | **구본서** | 외야수(CF/LF/RF) |
| **#80** | **박건우** | 투수(P), 2루수(2B) |
| **#88** | **정우찬** | 2루수(2B) |
| **#91** | **김도경** | 유격수(SS) |

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Custom Design System
- **State Management**: Zustand (with LocalStorage Persist)
- **Charts & Icons**: Recharts, Lucide React
- **Deployment**: GitHub Pages (`gh-pages`)

---

## 🚀 로컬 실행 방법 (Getting Started)

```bash
# 1. 저장소 클론
git clone https://github.com/SungyulLim/hanbangSwings.git
cd hanbangSwings

# 2. 패키지 설치
npm install

# 3. 개발 서버 구동
npm run dev
```

---

## 📦 빌드 및 배포 (Build & Deploy)

```bash
# 프로덕션 빌드
npm run build

# GitHub Pages 자동 배포
npm run deploy
```

---

© 2026 한방 스윙스 ⚾ Hanbang Swings
