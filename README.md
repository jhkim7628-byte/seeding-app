# 현신바이오 시딩 캠페인 관리 시스템
## 배포 가이드 (개발자 없이 따라하기)

---

## 준비물 (계정 3개 — 모두 무료)

| 서비스 | 용도 | 주소 |
|--------|------|------|
| GitHub | 코드 저장소 | https://github.com |
| Supabase | 데이터베이스 | https://supabase.com |
| Vercel | 배포 (호스팅) | https://vercel.com |

---

## STEP 1. GitHub에 코드 올리기

### 1-1. GitHub 계정 만들기
1. https://github.com 접속
2. [Sign up] 클릭 → 이메일·비밀번호 입력 → 계정 생성

### 1-2. 새 저장소 만들기
1. 로그인 후 오른쪽 상단 [+] → [New repository] 클릭
2. Repository name: `seeding-app` 입력
3. [Create repository] 클릭

### 1-3. 코드 업로드
1. 새 저장소 페이지에서 [uploading an existing file] 링크 클릭
2. 이 ZIP 파일을 압축 해제한 `seeding-app` 폴더 안의 **모든 파일**을 드래그해서 업로드
3. [Commit changes] 클릭

> ⚠️ `.env.local.example` 파일은 올리되 실제 `.env.local` 파일은 올리지 마세요

---

## STEP 2. Supabase DB 세팅

### 2-1. Supabase 계정 만들기
1. https://supabase.com 접속
2. [Start your project] → GitHub으로 로그인 또는 이메일 가입

### 2-2. 프로젝트 생성
1. [New project] 클릭
2. Organization: 기본값 사용
3. Name: `seeding-app` 입력
4. Database Password: 기억하기 쉬운 비밀번호 입력 (나중에 필요 없음)
5. Region: `Northeast Asia (Seoul)` 선택
6. [Create new project] 클릭 (약 2분 기다리기)

### 2-3. DB 테이블 생성
1. 왼쪽 메뉴 [SQL Editor] 클릭
2. [New query] 클릭
3. `supabase_schema.sql` 파일 내용 전체 복사
4. SQL Editor 입력창에 붙여넣기
5. [Run] 버튼 클릭
6. 하단에 "Success" 메시지 확인

### 2-4. API 키 복사
1. 왼쪽 메뉴 [Project Settings] → [API] 클릭
2. 아래 두 가지를 복사해서 어딘가에 저장해두기:
   - **Project URL**: `https://xxxx.supabase.co` 형태
   - **anon public key**: `eyJhbGci...` 형태의 긴 문자열

---

## STEP 3. Vercel 배포

### 3-1. Vercel 계정 만들기
1. https://vercel.com 접속
2. [Sign Up] → [Continue with GitHub] 클릭
3. GitHub 계정으로 로그인

### 3-2. 프로젝트 배포
1. Vercel 대시보드에서 [Add New...] → [Project] 클릭
2. GitHub 저장소 목록에서 `seeding-app` 찾기
3. [Import] 클릭
4. Framework Preset: **Next.js** (자동 감지)
5. **Environment Variables** 섹션에서 아래 두 개 추가:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | STEP 2-4에서 복사한 Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | STEP 2-4에서 복사한 anon public key |

6. [Deploy] 클릭
7. 약 2~3분 기다리기
8. 배포 완료! `https://seeding-app-xxx.vercel.app` 형태의 URL 생성됨

---

## STEP 4. 팀원 공유

배포된 URL을 팀원에게 공유하면 끝이에요.

```
https://seeding-app-xxx.vercel.app
```

- 새로고침해도 데이터 유지됩니다
- 팀원 모두 같은 데이터를 실시간으로 봅니다
- PC·모바일 모두 접속 가능합니다

---

## 자주 있는 문제

### 배포 후 흰 화면이 나와요
→ Vercel 대시보드 → 프로젝트 → [Settings] → [Environment Variables]에서 URL과 Key가 정확히 입력됐는지 확인 후 [Redeploy]

### 데이터가 안 저장돼요
→ Supabase [SQL Editor]에서 `supabase_schema.sql` 다시 실행

### URL을 바꾸고 싶어요
→ Vercel [Settings] → [Domains] → 원하는 도메인 추가 (도메인 구매 필요, 연 1~2만원)

---

## 비용 요약

| 항목 | 비용 |
|------|------|
| Supabase | **무료** (월 50만 행 이하) |
| Vercel | **무료** (소규모 팀) |
| GitHub | **무료** |
| 도메인 (선택) | 연 1~2만원 |

---

문의사항이 있으면 Claude에게 물어보세요 🌿

---

## 로그인 기능 세팅 (추가)

### Supabase 이메일 인증 설정
1. Supabase 대시보드 → [Authentication] → [Providers]
2. [Email] 활성화 확인 (기본값 ON)
3. [Authentication] → [URL Configuration]
4. Site URL: `https://your-app.vercel.app` 입력
5. Redirect URLs에 `https://your-app.vercel.app/**` 추가

### 첫 번째 관리자 계정 만들기
1. Supabase → [Authentication] → [Users] → [Invite user]
2. 대표님 이메일 입력 → [Send Invitation]
3. 이메일 받고 링크 클릭 → 비밀번호 설정
4. Supabase → [Table Editor] → `team_members` 테이블
5. 대표님 계정의 role을 `editor` → `admin` 으로 변경

### 팀원 초대 방법 (이후)
1. 앱 로그인 → 왼쪽 메뉴 [👥 팀원 관리]
2. 초대할 이메일 입력 → 권한 선택 → [초대 발송]
3. 팀원이 이메일 받고 링크 클릭 → 비밀번호 설정 → 완료

### 권한 구분
| 권한 | 할 수 있는 것 |
|------|--------------|
| 관리자 | 모든 기능 + 팀원 초대·관리 |
| 편집자 | 데이터 읽기·쓰기 (팀원 관리 제외) |
