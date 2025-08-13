# Firebase Cloud Functions - 로또 번호 선택 앱

Firebase Cloud Functions를 사용한 서버 사이드 자동 당첨 확인 및 이메일 알림 시스템입니다.

## 📋 기능

### 🚀 자동 트리거 Functions
- **onWinningNumbersCreated**: winningNumbers 컬렉션에 새 당첨 번호 추가 시 자동 실행
- **onWinningNumbersUpdated**: winningNumbers 컬렉션 수정 시 자동 실행

### 🎯 주요 처리 로직
1. **모든 사용자 번호 조회**: 해당 회차의 모든 사용자 선택 번호 가져오기
2. **당첨 확인 처리**: 각 번호별로 당첨 등급 계산
3. **결과 저장**: userResults 컬렉션에 처리 결과 저장
4. **이메일 알림**: 당첨자에게 자동 이메일 발송

### 📧 이메일 알림 기능
- HTML 형식의 아름다운 당첨 알림 메일
- 당첨 번호 하이라이트
- 등급별 맞춤 메시지
- 당첨금 수령 안내

### 🔧 관리자 Functions
- **manualCheckWinning**: 수동 당첨 확인 (HTTP Callable)
- **getUserWinningStats**: 사용자 당첨 통계 조회
- **getAllWinningStats**: 전체 사용자 통계 조회 (관리자용)

## 🏗️ 데이터베이스 구조

### userResults 컬렉션
```javascript
{
  userId: "user-uid",
  drawNumber: 1050,
  userNumbers: [1, 5, 12, 23, 34, 45],
  winningNumbers: [1, 7, 12, 23, 34, 45],
  bonusNumber: 38,
  matchCount: 5,
  matchNumbers: [1, 12, 23, 34, 45],
  rank: 3,
  prize: "3등 (5개 일치)",
  hasBonus: false,
  createdAt: Timestamp,
  processedAt: Timestamp
}
```

## 🚀 배포 방법

### 1. Firebase CLI 설치 (전역)
```bash
npm install -g firebase-tools
```

### 2. Firebase 로그인
```bash
firebase login
```

### 3. 프로젝트 설정
```bash
firebase use <your-project-id>
```

### 4. Functions 의존성 설치
```bash
cd functions
npm install
```

### 5. 이메일 설정 (환경 변수)
```bash
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.pass="your-app-password"
```

### 6. Functions 배포
```bash
firebase deploy --only functions
```

## 📧 이메일 설정

### Gmail 사용 시
1. Google 계정 2단계 인증 활성화
2. 앱 비밀번호 생성
3. 환경 변수로 설정:
   ```bash
   firebase functions:config:set email.user="your-email@gmail.com"
   firebase functions:config:set email.pass="your-16-digit-app-password"
   ```

### 다른 이메일 서비스 사용 시
`functions/index.js`의 nodemailer 설정을 수정하세요.

## 🔒 보안 규칙

### Firestore 보안 규칙 예시
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 정보
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 사용자 번호 선택
    match /userNumbers/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // 당첨 번호 (읽기 전용)
    match /winningNumbers/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // 당첨 결과 (읽기 전용)
    match /userResults/{document} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## 🔧 로컬 개발

### 1. Functions 에뮬레이터 실행
```bash
npm run serve
```

### 2. 로그 확인
```bash
npm run logs
```

### 3. Functions Shell
```bash
npm run shell
```

## 📊 모니터링

### Functions 로그 확인
```bash
firebase functions:log
```

### 특정 함수 로그 확인
```bash
firebase functions:log --only onWinningNumbersCreated
```

## 🚨 문제 해결

### 일반적인 오류들

#### 권한 오류
- Firebase 프로젝트 소유자/편집자 권한 확인
- IAM 권한 설정 확인

#### 이메일 발송 실패
- Gmail 앱 비밀번호 확인
- 2단계 인증 활성화 확인
- 환경 변수 설정 확인

#### 트리거 실행 안됨
- Firestore 보안 규칙 확인
- 컬렉션/필드명 정확성 확인

## 📝 개발 노트

### 성능 최적화
- 배치 쓰기 사용 (최대 500개 문서)
- 적절한 인덱스 설정
- 불필요한 필드 조회 최소화

### 비용 최적화
- 함수 실행 시간 최적화
- 불필요한 데이터베이스 읽기 방지
- 적절한 리전 선택

## 🔄 업데이트 로그

### v1.0.0 (2025-01-XX)
- 초기 Cloud Functions 구현
- 자동 당첨 확인 트리거
- 이메일 알림 기능
- 관리자 도구 Functions