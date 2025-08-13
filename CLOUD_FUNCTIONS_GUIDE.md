# 🚀 Cloud Functions 연동 가이드

로또 번호 선택 앱에 Firebase Cloud Functions를 연동하여 서버 사이드 자동 처리를 추가하는 완전한 가이드입니다.

## 📋 목차
1. [기능 개요](#-기능-개요)
2. [설치 및 설정](#-설치-및-설정)
3. [배포 방법](#-배포-방법)
4. [테스트 방법](#-테스트-방법)
5. [문제 해결](#-문제-해결)

---

## 🎯 기능 개요

### 새로 추가된 기능들

#### 1. 자동 당첨 확인 시스템
- **트리거**: winningNumbers 컬렉션에 새 당첨 번호 추가/수정 시 자동 실행
- **처리**: 해당 회차의 모든 사용자 번호를 자동으로 당첨 확인
- **결과**: userResults 컬렉션에 처리 결과 저장

#### 2. 실시간 이메일 알림
- **당첨자 감지**: 당첨 등급 계산 후 당첨자에게 즉시 이메일 발송
- **아름다운 HTML**: 시각적으로 매력적인 당첨 알림 이메일
- **상세 정보**: 당첨 등급, 일치 번호, 수령 안내 포함

#### 3. 새로운 데이터베이스 컬렉션
```javascript
// userResults 컬렉션
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

#### 4. 클라이언트 UI 개선
- **실시간 통계**: userResults 컬렉션 기반 정확한 당첨 통계
- **서버 연동**: Cloud Functions와의 실시간 데이터 동기화
- **Fallback 시스템**: 서버 오류 시 클라이언트 로직으로 대체

---

## 🛠️ 설치 및 설정

### 1. Firebase CLI 설치 및 로그인

```bash
# Firebase CLI 전역 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 확인
firebase projects:list
```

### 2. 프로젝트 설정

```bash
# 현재 프로젝트 설정 (your-project-id를 실제 프로젝트 ID로 교체)
firebase use lotto-app-2025

# 또는 대화형으로 선택
firebase use
```

### 3. Functions 종속성 설치

```bash
# functions 디렉토리로 이동
cd functions

# 종속성 설치
npm install
```

### 4. 이메일 설정

Gmail을 사용하는 경우:

```bash
# Gmail 계정과 앱 비밀번호 설정
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.pass="your-16-digit-app-password"

# 설정 확인
firebase functions:config:get
```

**Gmail 앱 비밀번호 생성 방법:**
1. Google 계정 → 보안 → 2단계 인증 활성화
2. 보안 → 앱 비밀번호 → 메일 → 기타(사용자 지정 이름) → "로또앱"
3. 생성된 16자리 비밀번호 사용

### 5. Firestore 보안 규칙 업데이트

Firebase Console → Firestore Database → 규칙에서 다음으로 업데이트:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 정보 (본인만 읽기/쓰기 가능)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 사용자 번호 선택 (본인만 읽기/쓰기 가능)
    match /userNumbers/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // 당첨 번호 (모든 인증된 사용자 읽기 가능, 관리자만 쓰기 가능)
    match /winningNumbers/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.admin == true || request.auth.token.email == 'admin@example.com');
    }
    
    // 당첨 결과 (본인 결과만 읽기 가능, 시스템만 쓰기 가능)
    match /userResults/{document} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if false; // Cloud Functions에서만 쓰기 가능
    }
  }
}
```

---

## 🚀 배포 방법

### 1. 코드 검증

```bash
# functions 디렉토리에서 실행
npm run lint

# 오류가 있다면 수정 후 다시 실행
```

### 2. Functions 배포

```bash
# Functions만 배포
firebase deploy --only functions

# 전체 프로젝트 배포
firebase deploy

# 특정 함수만 배포
firebase deploy --only functions:onWinningNumbersCreated
```

### 3. 배포 확인

```bash
# Functions 목록 확인
firebase functions:list

# 로그 확인
firebase functions:log
```

배포 성공 시 다음과 같은 Functions가 생성됩니다:
- `onWinningNumbersCreated` (Firestore 트리거)
- `onWinningNumbersUpdated` (Firestore 트리거)
- `manualCheckWinning` (HTTP Callable)
- `getUserWinningStats` (HTTP Callable)
- `getAllWinningStats` (HTTP Callable)

---

## 🧪 테스트 방법

### 1. 당첨 번호 추가 테스트

Firebase Console 또는 admin.html을 통해 당첨 번호 추가:

```javascript
// admin.html에서 실행할 수 있는 테스트 코드
const testWinningNumbers = {
    drawNumber: 1100,
    numbers: [1, 7, 12, 23, 34, 45],
    bonusNumber: 38,
    drawDate: "2025-01-15"
};

await FirebaseUtils.saveWinningNumbers(
    testWinningNumbers.drawNumber,
    testWinningNumbers.numbers,
    testWinningNumbers.bonusNumber,
    testWinningNumbers.drawDate
);
```

### 2. 자동 처리 확인

1. **로그 모니터링**:
   ```bash
   firebase functions:log --follow
   ```

2. **예상되는 로그 메시지**:
   ```
   새로운 당첨 번호 감지: [document-id]
   제1100회 당첨 번호: [1, 7, 12, 23, 34, 45]
   처리할 사용자 번호 개수: 5개
   당첨자 발견! 사용자: user-uid, 등급: 3등 (5개 일치)
   5건 당첨 결과 저장 완료
   1명의 당첨자에게 이메일 발송 시작
   이메일 발송 완료: user@example.com
   ```

### 3. 결과 확인

1. **Firestore Console**에서 `userResults` 컬렉션 확인
2. **당첨자 이메일함** 확인
3. **클라이언트 UI**에서 업데이트된 통계 확인

### 4. 수동 테스트 Functions

```javascript
// 브라우저 콘솔에서 실행
const manualCheck = firebase.functions().httpsCallable('manualCheckWinning');
manualCheck({ drawNumber: 1100 })
  .then(result => console.log(result.data))
  .catch(error => console.error(error));

const getUserStats = firebase.functions().httpsCallable('getUserWinningStats');
getUserStats()
  .then(result => console.log(result.data))
  .catch(error => console.error(error));
```

---

## 🚨 문제 해결

### 일반적인 오류들

#### 1. "Permission denied" 오류
**원인**: Firebase 프로젝트 권한 부족
**해결**:
```bash
# 프로젝트 소유자/편집자 권한 확인
firebase projects:list
gcloud projects get-iam-policy [PROJECT-ID]
```

#### 2. "Functions deploy failed" 오류
**원인**: 코드 오류 또는 종속성 문제
**해결**:
```bash
# 종속성 재설치
cd functions
npm install

# 린트 확인
npm run lint

# 특정 오류 메시지 확인
firebase functions:log
```

#### 3. "Email sending failed" 오류
**원인**: 이메일 설정 문제
**해결**:
```bash
# 환경 변수 확인
firebase functions:config:get

# Gmail 앱 비밀번호 재생성 및 재설정
firebase functions:config:set email.user="new-email@gmail.com"
firebase functions:config:set email.pass="new-16-digit-password"

# 재배포 필요
firebase deploy --only functions
```

#### 4. "Firestore trigger not working" 오류
**원인**: 보안 규칙 또는 컬렉션명 문제
**해결**:
- Firestore 보안 규칙 확인
- 컬렉션명과 문서 구조 확인 (`winningNumbers`, `userNumbers`)
- Functions 로그에서 구체적인 오류 메시지 확인

### 디버깅 도구

#### 1. 실시간 로그 모니터링
```bash
firebase functions:log --follow
```

#### 2. 특정 함수 로그
```bash
firebase functions:log --only onWinningNumbersCreated
```

#### 3. 로컬 에뮬레이터 테스트
```bash
# functions 디렉토리에서
npm run serve
```

#### 4. Functions Shell
```bash
npm run shell
```

---

## 🔧 고급 설정

### 환경별 설정

#### 개발 환경
```bash
firebase use development
firebase functions:config:set environment.name="development"
```

#### 프로덕션 환경
```bash
firebase use production
firebase functions:config:set environment.name="production"
```

### 성능 최적화

#### 메모리 할당 조정
```javascript
// functions/index.js
const runtimeOpts = {
  timeoutSeconds: 300,
  memory: '1GB'
};

exports.onWinningNumbersCreated = functions
  .runWith(runtimeOpts)
  .firestore
  .document('winningNumbers/{docId}')
  .onCreate(async (snap, context) => {
    // 함수 코드...
  });
```

#### 리전 설정
```javascript
// functions/index.js 상단에 추가
const functions = require('firebase-functions').region('asia-northeast3');
```

---

## 📊 모니터링 및 분석

### Functions 사용량 모니터링

1. **Firebase Console** → Functions → 사용량
2. **Google Cloud Console** → Cloud Functions
3. **로그 분석**: 오류율, 실행 시간, 호출 횟수

### 비용 최적화

1. **불필요한 호출 최소화**
2. **적절한 메모리 할당**
3. **시간 초과 설정 최적화**
4. **배치 처리 활용**

---

## 🎉 완료!

이제 로또 번호 선택 앱에서 다음과 같은 기능들이 자동으로 동작합니다:

✅ **당첨 번호 추가 시 자동 당첨 확인**
✅ **당첨자에게 실시간 이메일 알림**
✅ **정확한 당첨 통계 및 결과 관리**
✅ **서버 사이드 처리로 성능 향상**
✅ **관리자 도구 및 수동 제어**

문제가 발생하거나 추가 기능이 필요한 경우, Functions 로그를 먼저 확인하고 위의 문제 해결 가이드를 참고하세요.