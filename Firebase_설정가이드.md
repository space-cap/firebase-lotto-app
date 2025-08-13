# 🔥 Firebase 프로젝트 설정 가이드

로또 번호 선택 앱에 Firebase 인증과 Firestore 데이터베이스를 연동하는 방법을 설명합니다.

## 📋 목차
1. [Firebase 프로젝트 생성](#1-firebase-프로젝트-생성)
2. [웹 앱 등록](#2-웹-앱-등록)
3. [Authentication 설정](#3-authentication-설정)
4. [Firestore Database 설정](#4-firestore-database-설정)
5. [보안 규칙 설정](#5-보안-규칙-설정)
6. [API 키 설정](#6-api-키-설정)
7. [테스트 방법](#7-테스트-방법)
8. [문제 해결](#8-문제-해결)

---

## 1. Firebase 프로젝트 생성

### 1.1 Firebase Console 접속
1. 웹 브라우저에서 [Firebase Console](https://console.firebase.google.com/)에 접속
2. Google 계정으로 로그인

### 1.2 새 프로젝트 생성
1. **"프로젝트 추가"** 버튼 클릭
2. 프로젝트 이름 입력 (예: `lotto-app-2025`)
3. 프로젝트 ID는 자동으로 생성됩니다 (변경 가능)
4. Google Analytics 사용 여부 선택 (권장: **사용함**)
5. **"프로젝트 만들기"** 클릭
6. 생성 완료까지 1-2분 대기

---

## 2. 웹 앱 등록

### 2.1 웹 앱 추가
1. 프로젝트 대시보드에서 **웹 아이콘 (</>)** 클릭
2. 앱 별명 입력 (예: `lotto-web-app`)
3. Firebase Hosting 설정 체크박스는 **선택사항**
4. **"앱 등록"** 클릭

### 2.2 SDK 설정 정보 복사
생성된 Firebase 설정을 복사하여 `firebase-config.js` 파일에 적용:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789abcdef"
};
```

---

## 3. Authentication 설정

### 3.1 Authentication 활성화
1. 왼쪽 메뉴에서 **"Authentication"** 클릭
2. **"시작하기"** 버튼 클릭

### 3.2 로그인 방법 설정

#### 이메일/비밀번호 로그인
1. **"Sign-in method"** 탭 클릭
2. **"이메일/비밀번호"** 선택
3. **"사용 설정"** 체크
4. **"저장"** 클릭

#### Google 소셜 로그인
1. **"Google"** 제공업체 선택
2. **"사용 설정"** 체크
3. 프로젝트 공개용 이름 입력
4. 지원 이메일 선택
5. **"저장"** 클릭

---

## 4. Firestore Database 설정

### 4.1 Firestore 생성
1. 왼쪽 메뉴에서 **"Firestore Database"** 클릭
2. **"데이터베이스 만들기"** 클릭

### 4.2 보안 규칙 모드 선택
- **테스트 모드로 시작**: 개발 중에 선택 (권장)
- **잠금 모드로 시작**: 프로덕션용

### 4.3 Cloud Firestore 위치 선택
- 권장: **asia-northeast3 (서울)**
- 다른 아시아 지역: asia-northeast1 (도쿄), asia-east1 (타이완)

---

## 5. 보안 규칙 설정

### 5.1 개발용 규칙 (테스트 단계)
Firestore > 규칙 탭에서 다음 규칙 적용:

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
  }
}
```

### 5.2 프로덕션용 규칙
더 엄격한 보안이 필요한 경우:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId
        && request.auth.token.email_verified == true;
    }
    
    match /userNumbers/{document} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId
        && request.auth.token.email_verified == true;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId
        && request.auth.token.email_verified == true
        && isValidNumberData(request.resource.data);
    }
  }
}

function isValidNumberData(data) {
  return data.keys().hasAll(['userId', 'numbers', 'createdAt'])
    && data.numbers is list
    && data.numbers.size() == 6
    && data.numbers.hasAll([1, 2, 3, 4, 5, 6].toSet().intersection(data.numbers.toSet()));
}
```

---

## 6. API 키 설정

### 6.1 firebase-config.js 수정
`firebase-config.js` 파일에서 설정값 교체:

```javascript
const firebaseConfig = {
    // 🔄 여기에 실제 Firebase 설정값을 입력하세요
    apiKey: "AIzaSyBdVl-cTICSwYKpe6gDNVYVDdqbpEn4XYM",           // ← 실제 값으로 교체
    authDomain: "lotto-app-12345.firebaseapp.com",              // ← 실제 값으로 교체
    projectId: "lotto-app-12345",                               // ← 실제 값으로 교체
    storageBucket: "lotto-app-12345.appspot.com",               // ← 실제 값으로 교체
    messagingSenderId: "123456789012",                          // ← 실제 값으로 교체
    appId: "1:123456789012:web:abcdef123456789abcdef"          // ← 실제 값으로 교체
};
```

### 6.2 보안 고려사항
- API 키는 공개적으로 노출되어도 안전합니다 (클라이언트측 키)
- 중요한 것은 Firestore 보안 규칙 설정
- Git에 커밋할 때도 문제없음

---

## 7. 테스트 방법

### 7.1 로컬 테스트
1. `index.html` 파일을 웹 브라우저에서 열기
2. 개발자 도구 (F12) 콘솔 확인
3. 다음 메시지가 나타나면 성공:
   ```
   ✅ Firebase 초기화 성공
   🔥 Firebase Authentication & Firestore 연결 완료
   📍 프로젝트 ID: your-project-id
   ✅ Firebase 연결 테스트 성공
   ```

### 7.2 기능 테스트
1. **로그인 테스트**
   - "로그인" 버튼 클릭
   - 이메일/비밀번호로 회원가입
   - Google 로그인 테스트

2. **번호 저장 테스트**
   - 6개 번호 선택
   - "저장하기" 버튼 클릭
   - 성공 메시지 확인

3. **Firestore 확인**
   - Firebase Console > Firestore Database
   - `users`, `userNumbers` 컬렉션 생성 확인

---

## 8. 문제 해결

### 8.1 일반적인 오류와 해결책

#### "Firebase is not defined" 오류
```
❌ 오류: Firebase is not defined
✅ 해결: HTML에서 Firebase SDK 스크립트 로딩 순서 확인
```

#### 권한 오류 (Permission denied)
```
❌ 오류: Missing or insufficient permissions
✅ 해결: Firestore 보안 규칙 확인 및 인증 상태 확인
```

#### Google 로그인 팝업 차단
```
❌ 오류: 팝업이 차단됨
✅ 해결: 브라우저 팝업 차단 해제 또는 redirect 방식 사용
```

#### API 키 오류
```
❌ 오류: API key not valid
✅ 해결: Firebase Console에서 API 키 재확인 및 도메인 제한 설정
```

### 8.2 디버깅 도구

#### 브라우저 개발자 도구 활용
```javascript
// 콘솔에서 현재 사용자 확인
firebase.auth().currentUser

// Firestore 연결 확인
firebase.firestore().enableNetwork()

// 인증 상태 확인
firebase.auth().onAuthStateChanged((user) => {
    console.log('Current user:', user);
});
```

#### Firebase Console에서 로그 확인
1. Authentication > 사용자 탭: 등록된 사용자 확인
2. Firestore Database: 저장된 데이터 확인
3. 사용량 탭: API 호출 현황 확인

### 8.3 성능 최적화

#### 효율적인 Firestore 쿼리
```javascript
// ✅ 좋은 예: 인덱스 활용
db.collection('userNumbers')
  .where('userId', '==', currentUser.uid)
  .orderBy('createdAt', 'desc')
  .limit(10);

// ❌ 나쁜 예: 전체 컬렉션 스캔
db.collection('userNumbers').get();
```

#### 인증 상태 캐싱
```javascript
// 인증 상태를 로컬 스토리지에 캐싱하여 빠른 로딩
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
```

---

## 🎯 완료 체크리스트

설정 완료 후 다음 항목들을 확인하세요:

- [ ] Firebase 프로젝트 생성 완료
- [ ] 웹 앱 등록 및 설정 정보 복사
- [ ] Authentication 활성화 (이메일/비밀번호, Google)
- [ ] Firestore Database 생성
- [ ] 보안 규칙 설정
- [ ] firebase-config.js 파일 업데이트
- [ ] 로컬 테스트 성공
- [ ] 회원가입/로그인 기능 동작
- [ ] 번호 저장 기능 동작
- [ ] Firestore에서 데이터 확인

---

## 📞 추가 도움말

- **Firebase 공식 문서**: https://firebase.google.com/docs
- **Firestore 보안 규칙 가이드**: https://firebase.google.com/docs/firestore/security/get-started
- **Authentication 가이드**: https://firebase.google.com/docs/auth

설정 중 문제가 발생하면 브라우저 개발자 도구의 콘솔을 확인하고, 위의 문제 해결 섹션을 참고하세요.