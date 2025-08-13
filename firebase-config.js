/**
 * Firebase 설정 파일
 * 
 * 🔥 Firebase 프로젝트 생성 및 설정 방법:
 * 
 * 1. Firebase Console 접속
 *    - https://console.firebase.google.com/ 접속
 *    - Google 계정으로 로그인
 * 
 * 2. 새 프로젝트 생성
 *    - "프로젝트 추가" 클릭
 *    - 프로젝트 이름 입력 (예: lotto-app)
 *    - Google Analytics 사용 여부 선택 (선택사항)
 *    - "프로젝트 만들기" 클릭
 * 
 * 3. 웹 앱 추가
 *    - 프로젝트 개요에서 "웹" 아이콘 (</>)클릭
 *    - 앱 별명 입력 (예: lotto-web-app)
 *    - Firebase Hosting 설정 (선택사항)
 *    - "앱 등록" 클릭
 * 
 * 4. 구성 정보 복사
 *    - 제공되는 firebaseConfig 객체 복사
 *    - 아래 YOUR_CONFIG 부분에 붙여넣기
 * 
 * 5. Firestore Database 설정
 *    - 왼쪽 메뉴에서 "Firestore Database" 클릭
 *    - "데이터베이스 만들기" 클릭
 *    - 보안 규칙: 테스트 모드로 시작 선택
 *    - 위치 선택 (asia-northeast3 - 서울 권장)
 *    - "완료" 클릭
 * 
 * 6. 보안 규칙 설정 (중요!)
 *    - Firestore > 규칙 탭으로 이동
 *    - 아래 규칙으로 업데이트:
 *    
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        // 로또 선택 데이터 읽기/쓰기 허용
 *        match /lotto-selections/{document} {
 *          allow read, write: if true;
 *        }
 *      }
 *    }
 * 
 * 7. 설정 완료
 *    - 아래 firebaseConfig에 본인의 설정 입력
 *    - 웹브라우저에서 index.html 파일 열기
 */

// ⚠️  실제 Firebase 프로젝트 설정으로 교체해야 합니다!
const firebaseConfig = {
    // 여기에 Firebase Console에서 제공받은 설정을 입력하세요
    apiKey: "AIzaSyAV5V3pLC_Ja2DFRWlHObQeHrtU4TpCtI8",
    authDomain: "lotto-app-2025.firebaseapp.com",
    projectId: "lotto-app-2025",
    storageBucket: "lotto-app-2025.firebasestorage.app",
    messagingSenderId: "745543895161",
    appId: "1:745543895161:web:42097ff14f9b92cee22ca8",
    measurementId: "G-VC86RL4SKR"
    
    /* 예시 (실제로는 본인의 설정으로 교체)
    apiKey: "AIzaSyBdVl-cTICSwYKpe6gDNVYVDdqbpEn4XYM",
    authDomain: "lotto-app-12345.firebaseapp.com",
    projectId: "lotto-app-12345",
    storageBucket: "lotto-app-12345.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789abcdef"
    */
};

// Firebase 초기화
try {
    // Firebase 앱 초기화
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase 초기화 성공');
    }
    
    // Firebase 서비스 참조
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Google 로그인 프로바이더
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    
    // 한국 시간대 설정
    const timeZone = 'Asia/Seoul';
    
    console.log('🔥 Firebase Authentication & Firestore 연결 완료');
    console.log('📍 프로젝트 ID:', firebaseConfig.projectId);
    
} catch (error) {
    console.error('❌ Firebase 초기화 실패:', error);
    console.log('🔧 Firebase 설정을 확인해주세요.');
}

/**
 * Firebase 연결 테스트 함수
 */
async function testFirebaseConnection() {
    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const db = firebase.firestore();
            
            // 테스트 데이터 저장
            const testDoc = await db.collection('test').add({
                message: 'Firebase 연결 테스트',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Firebase 연결 테스트 성공, 문서 ID:', testDoc.id);
            
            // 테스트 데이터 삭제
            await testDoc.delete();
            console.log('🗑️ 테스트 데이터 정리 완료');
            
            return true;
        } else {
            console.warn('⚠️ Firebase가 로드되지 않았습니다.');
            return false;
        }
    } catch (error) {
        console.error('❌ Firebase 연결 테스트 실패:', error);
        return false;
    }
}

/**
 * 데이터베이스 컬렉션 구조:
 * 
 * users/
 * ├── {uid}/
 * │   ├── email: "user@example.com"
 * │   ├── displayName: "사용자"
 * │   ├── createdAt: Timestamp
 * │   └── lastLoginAt: Timestamp
 * 
 * userNumbers/
 * ├── {document-id}/
 * │   ├── userId: "user-uid"
 * │   ├── numbers: [1, 5, 12, 23, 34, 45]
 * │   ├── drawNumber: 1050  // 추첨 회차
 * │   ├── createdAt: Timestamp
 * │   └── date: "2024/01/15"
 * 
 * winningNumbers/
 * ├── {document-id}/
 * │   ├── drawNumber: 1050  // 추첨 회차
 * │   ├── numbers: [1, 5, 12, 23, 34, 45]  // 당첨 번호
 * │   ├── bonusNumber: 7  // 보너스 번호
 * │   ├── drawDate: "2024-01-15"  // 추첨일
 * │   └── createdAt: Timestamp
 */

// 인증 관련 유틸리티 함수들
const AuthUtils = {
    /**
     * 이메일 회원가입
     */
    async signUpWithEmail(email, password, displayName) {
        try {
            const credential = await auth.createUserWithEmailAndPassword(email, password);
            
            // 사용자 프로필 업데이트
            await credential.user.updateProfile({
                displayName: displayName
            });
            
            // Firestore에 사용자 정보 저장
            await db.collection('users').doc(credential.user.uid).set({
                email: email,
                displayName: displayName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ 회원가입 성공:', credential.user.uid);
            return credential.user;
            
        } catch (error) {
            console.error('❌ 회원가입 실패:', error);
            throw error;
        }
    },
    
    /**
     * 이메일 로그인
     */
    async signInWithEmail(email, password) {
        try {
            const credential = await auth.signInWithEmailAndPassword(email, password);
            
            // 마지막 로그인 시간 업데이트
            await db.collection('users').doc(credential.user.uid).update({
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ 로그인 성공:', credential.user.uid);
            return credential.user;
            
        } catch (error) {
            console.error('❌ 로그인 실패:', error);
            throw error;
        }
    },
    
    /**
     * Google 로그인
     */
    async signInWithGoogle() {
        try {
            const result = await auth.signInWithPopup(googleProvider);
            const user = result.user;
            
            // 첫 로그인인지 확인
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                // 새 사용자인 경우 Firestore에 정보 저장
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    displayName: user.displayName,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // 기존 사용자인 경우 마지막 로그인 시간 업데이트
                await db.collection('users').doc(user.uid).update({
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            console.log('✅ Google 로그인 성공:', user.uid);
            return user;
            
        } catch (error) {
            console.error('❌ Google 로그인 실패:', error);
            throw error;
        }
    },
    
    /**
     * 로그아웃
     */
    async signOut() {
        try {
            await auth.signOut();
            console.log('✅ 로그아웃 성공');
        } catch (error) {
            console.error('❌ 로그아웃 실패:', error);
            throw error;
        }
    }
};

// Firebase 유틸리티 함수들
const FirebaseUtils = {
    /**
     * 번호 저장 (인증된 사용자용)
     */
    async saveNumbers(numbers, userId = null) {
        try {
            const currentUser = userId || (auth.currentUser ? auth.currentUser.uid : null);
            
            if (!currentUser) {
                throw new Error('로그인이 필요합니다.');
            }
            
            const docData = {
                userId: currentUser,
                numbers: numbers,
                drawNumber: await this.getCurrentDrawNumber(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                date: new Date().toLocaleDateString('ko-KR')
            };
            
            const docRef = await db.collection('userNumbers').add(docData);
            console.log('📝 번호 저장 완료, 문서 ID:', docRef.id);
            return docRef.id;
            
        } catch (error) {
            console.error('❌ 번호 저장 실패:', error);
            throw error;
        }
    },
    
    /**
     * 현재 추첨 회차 가져오기 (간단한 계산)
     */
    async getCurrentDrawNumber() {
        // 로또 1회차: 2002년 12월 7일
        const firstDraw = new Date('2002-12-07');
        const today = new Date();
        const diffTime = Math.abs(today - firstDraw);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        return diffWeeks + 1;
    },
    
    /**
     * 사용자별 저장된 번호 조회
     */
    async getUserNumbers(userId = null, limit = 10) {
        try {
            const currentUser = userId || (auth.currentUser ? auth.currentUser.uid : null);
            
            if (!currentUser) {
                throw new Error('로그인이 필요합니다.');
            }
            
            const snapshot = await db.collection('userNumbers')
                .where('userId', '==', currentUser)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            const selections = [];
            snapshot.forEach(doc => {
                selections.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`📋 ${selections.length}개 개인 선택 기록 조회 완료`);
            return selections;
            
        } catch (error) {
            console.error('❌ 데이터 조회 실패:', error);
            throw error;
        }
    },

    /**
     * 저장된 번호 삭제
     */
    async deleteUserNumber(docId) {
        try {
            if (!auth.currentUser) {
                throw new Error('로그인이 필요합니다.');
            }

            // 문서 권한 확인
            const doc = await db.collection('userNumbers').doc(docId).get();
            if (!doc.exists) {
                throw new Error('존재하지 않는 데이터입니다.');
            }

            const data = doc.data();
            if (data.userId !== auth.currentUser.uid) {
                throw new Error('삭제 권한이 없습니다.');
            }

            await db.collection('userNumbers').doc(docId).delete();
            console.log('🗑️ 번호 삭제 완료:', docId);
            return true;

        } catch (error) {
            console.error('❌ 번호 삭제 실패:', error);
            throw error;
        }
    },
    
    /**
     * 당첨 번호 저장 (관리자 전용)
     */
    async saveWinningNumbers(drawNumber, numbers, bonusNumber, drawDate) {
        try {
            if (!auth.currentUser) {
                throw new Error('로그인이 필요합니다.');
            }

            // 관리자 권한 확인 (간단한 예시, 실제로는 더 정교한 권한 확인 필요)
            if (auth.currentUser.email !== 'admin@example.com') {
                throw new Error('관리자만 당첨 번호를 등록할 수 있습니다.');
            }

            const docData = {
                drawNumber: drawNumber,
                numbers: numbers.sort((a, b) => a - b), // 오름차순 정렬
                bonusNumber: bonusNumber,
                drawDate: drawDate,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await db.collection('winningNumbers').add(docData);
            console.log('🎯 당첨 번호 저장 완료, 문서 ID:', docRef.id);
            return docRef.id;

        } catch (error) {
            console.error('❌ 당첨 번호 저장 실패:', error);
            throw error;
        }
    },

    /**
     * 최신 당첨 번호 조회
     */
    async getLatestWinningNumbers() {
        try {
            const snapshot = await db.collection('winningNumbers')
                .orderBy('drawNumber', 'desc')
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            const data = { id: doc.id, ...doc.data() };
            console.log('🎯 최신 당첨 번호 조회 완료:', data.drawNumber);
            return data;

        } catch (error) {
            console.error('❌ 당첨 번호 조회 실패:', error);
            throw error;
        }
    },

    /**
     * 특정 회차 당첨 번호 조회
     */
    async getWinningNumbersByDraw(drawNumber) {
        try {
            const snapshot = await db.collection('winningNumbers')
                .where('drawNumber', '==', drawNumber)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            const data = { id: doc.id, ...doc.data() };
            console.log(`🎯 ${drawNumber}회차 당첨 번호 조회 완료`);
            return data;

        } catch (error) {
            console.error('❌ 당첨 번호 조회 실패:', error);
            throw error;
        }
    },

    /**
     * 당첨 번호 실시간 리스너 설정
     */
    setupWinningNumbersListener(callback) {
        return db.collection('winningNumbers')
            .orderBy('drawNumber', 'desc')
            .limit(5)
            .onSnapshot((snapshot) => {
                const winningNumbers = [];
                snapshot.forEach(doc => {
                    winningNumbers.push({ id: doc.id, ...doc.data() });
                });
                callback(winningNumbers);
            }, (error) => {
                console.error('❌ 당첨 번호 실시간 조회 실패:', error);
            });
    },

    /**
     * 당첨 확인 및 등급 계산
     */
    checkWinning(userNumbers, winningNumbers, bonusNumber) {
        if (!Array.isArray(userNumbers) || !Array.isArray(winningNumbers)) {
            return { rank: 0, matchCount: 0, matchNumbers: [], hasBonus: false };
        }

        const matchNumbers = userNumbers.filter(num => winningNumbers.includes(num));
        const matchCount = matchNumbers.length;
        const hasBonus = userNumbers.includes(bonusNumber);

        let rank = 0;
        let prize = '';

        if (matchCount === 6) {
            rank = 1;
            prize = '1등 (6개 일치)';
        } else if (matchCount === 5 && hasBonus) {
            rank = 2;
            prize = '2등 (5개 + 보너스)';
        } else if (matchCount === 5) {
            rank = 3;
            prize = '3등 (5개 일치)';
        } else if (matchCount === 4) {
            rank = 4;
            prize = '4등 (4개 일치)';
        } else if (matchCount === 3) {
            rank = 5;
            prize = '5등 (3개 일치)';
        }

        return {
            rank,
            prize,
            matchCount,
            matchNumbers,
            hasBonus: hasBonus && rank === 2
        };
    },

    /**
     * 사용자 번호의 당첨 내역 조회
     */
    async getUserWinningHistory(userId = null) {
        try {
            const currentUser = userId || (auth.currentUser ? auth.currentUser.uid : null);
            if (!currentUser) {
                throw new Error('로그인이 필요합니다.');
            }

            // 사용자 번호 조회
            const userNumbers = await this.getUserNumbers(currentUser, 50);
            
            // 각 번호에 대해 당첨 확인
            const winningHistory = [];
            
            for (const userNumber of userNumbers) {
                const winningData = await this.getWinningNumbersByDraw(userNumber.drawNumber);
                if (winningData) {
                    const result = this.checkWinning(
                        userNumber.numbers,
                        winningData.numbers,
                        winningData.bonusNumber
                    );
                    
                    if (result.rank > 0) {
                        winningHistory.push({
                            ...userNumber,
                            winningResult: result,
                            winningData: winningData
                        });
                    }
                }
            }

            console.log(`🏆 당첨 내역 조회 완료: ${winningHistory.length}건`);
            return winningHistory;

        } catch (error) {
            console.error('❌ 당첨 내역 조회 실패:', error);
            throw error;
        }
    },

    /**
     * 통계 정보 조회
     */
    async getStatistics() {
        try {
            const snapshot = await db.collection('userNumbers').get();
            
            const stats = {
                totalSelections: snapshot.size,
                numberFrequency: {},
                dateFrequency: {},
                winningStats: {
                    rank1: 0,
                    rank2: 0,
                    rank3: 0,
                    rank4: 0,
                    rank5: 0,
                    total: 0
                }
            };
            
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // 번호 빈도 계산
                if (data.numbers && Array.isArray(data.numbers)) {
                    data.numbers.forEach(num => {
                        stats.numberFrequency[num] = (stats.numberFrequency[num] || 0) + 1;
                    });
                }
                
                // 날짜별 빈도 계산
                if (data.date) {
                    stats.dateFrequency[data.date] = (stats.dateFrequency[data.date] || 0) + 1;
                }
            });
            
            console.log('📊 통계 정보 조회 완료');
            return stats;
            
        } catch (error) {
            console.error('❌ 통계 조회 실패:', error);
            throw error;
        }
    }
};

// 개발 모드에서 연결 테스트 실행
if (firebaseConfig.projectId !== "YOUR_PROJECT_ID") {
    // 실제 설정이 입력된 경우에만 테스트 실행
    setTimeout(() => {
        testFirebaseConnection();
    }, 1000);
} else {
    console.log('🔧 Firebase 설정이 필요합니다. firebase-config.js 파일을 수정해주세요.');
}

/**
 * 설정 체크리스트:
 * 
 * ✅ Firebase 프로젝트 생성
 * ✅ 웹 앱 등록
 * ✅ Firestore Database 활성화
 * ✅ 보안 규칙 설정
 * ✅ firebaseConfig 객체 교체
 * ✅ 인터넷 연결 확인
 * 
 * 문제 해결:
 * - "Firebase is not defined" 오류: HTML에서 Firebase SDK 스크립트 로딩 확인
 * - 권한 오류: Firestore 보안 규칙 확인
 * - 네트워크 오류: 인터넷 연결 및 방화벽 설정 확인
 * - API 키 오류: Firebase Console에서 API 키 재확인
 */