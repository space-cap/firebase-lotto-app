# GitHub Pages 배포 가이드

## 자동 배포 설정

이 프로젝트는 GitHub Actions를 통해 자동으로 GitHub Pages에 배포됩니다.

### 설정 방법

1. GitHub 레포지토리의 **Settings** > **Pages**로 이동
2. **Source**를 **GitHub Actions**로 설정
3. `main` 브랜치에 코드를 푸시하면 자동으로 배포됩니다

### 접속 URL

배포 후 다음 URL로 접속할 수 있습니다:
`https://space-cap.github.io/firebase-lotto-app/`

## 주의사항

### Firebase 설정
- GitHub Pages는 정적 호스팅이므로 Firebase의 모든 기능을 사용할 수 있습니다
- `firebase-config.js`의 설정이 올바른지 확인하세요
- Firebase Console에서 도메인을 승인된 도메인에 추가해야 할 수 있습니다

### HTTPS
- GitHub Pages는 기본적으로 HTTPS를 제공합니다
- Firebase는 HTTPS에서만 작동하므로 문제없이 사용할 수 있습니다

### 커스텀 도메인 (선택사항)
- GitHub Pages에서 커스텀 도메인을 설정할 수 있습니다
- `CNAME` 파일을 루트에 추가하거나 Settings에서 설정하세요

## 로컬 테스트

로컬에서 테스트하려면:
```bash
# 간단한 HTTP 서버 실행
python -m http.server 8000
# 또는
npx serve .
```

## 문제 해결

1. **배포가 실패하는 경우**: Actions 탭에서 로그 확인
2. **Firebase 연결 실패**: 도메인 승인 및 API 키 확인
3. **CORS 오류**: Firebase Console에서 승인된 도메인 추가