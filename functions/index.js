/**
 * Firebase Cloud Functions for 로또 번호 선택 앱
 * - winningNumbers 컬렉션 변경 감지
 * - 자동 당첨 확인 및 결과 저장
 * - 이메일 알림 발송
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Firebase Admin SDK 초기화
admin.initializeApp();
const db = admin.firestore();

/**
 * 이메일 전송 설정
 * 실제 환경에서는 환경 변수로 설정해야 합니다.
 */
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: functions.config().email?.user || 'your-email@gmail.com',
        pass: functions.config().email?.pass || 'your-app-password'
    }
});

/**
 * winningNumbers 컬렉션 변경 감지 트리거
 * 새로운 당첨 번호가 추가되면 자동으로 당첨 확인 프로세스 시작
 */
exports.onWinningNumbersCreated = functions.firestore
    .document('winningNumbers/{docId}')
    .onCreate(async (snap, context) => {
        console.log('새로운 당첨 번호 감지:', context.params.docId);
        
        const winningData = snap.data();
        console.log(`제${winningData.drawNumber}회 당첨 번호:`, winningData.numbers);
        
        try {
            // 모든 사용자 번호 조회 및 당첨 확인
            await processAllUserNumbers(winningData);
            
            console.log('모든 사용자 번호 당첨 확인 완료');
            return { success: true };
            
        } catch (error) {
            console.error('당첨 확인 처리 중 오류:', error);
            return { success: false, error: error.message };
        }
    });

/**
 * winningNumbers 컬렉션 업데이트 감지 트리거
 */
exports.onWinningNumbersUpdated = functions.firestore
    .document('winningNumbers/{docId}')
    .onUpdate(async (change, context) => {
        console.log('당첨 번호 업데이트 감지:', context.params.docId);
        
        const winningData = change.after.data();
        
        try {
            // 해당 회차의 기존 결과 삭제 후 재계산
            await deleteExistingResults(winningData.drawNumber);
            await processAllUserNumbers(winningData);
            
            console.log('당첨 번호 업데이트 처리 완료');
            return { success: true };
            
        } catch (error) {
            console.error('당첨 번호 업데이트 처리 중 오류:', error);
            return { success: false, error: error.message };
        }
    });

/**
 * 모든 사용자 번호에 대해 당첨 확인 처리
 */
async function processAllUserNumbers(winningData) {
    const { drawNumber, numbers: winningNumbers, bonusNumber } = winningData;
    
    console.log(`제${drawNumber}회차 모든 사용자 번호 당첨 확인 시작`);
    
    // 해당 회차의 모든 사용자 번호 조회
    const userNumbersSnapshot = await db.collection('userNumbers')
        .where('drawNumber', '==', drawNumber)
        .get();
    
    console.log(`처리할 사용자 번호 개수: ${userNumbersSnapshot.size}개`);
    
    const batch = db.batch();
    const winningUsers = []; // 당첨자 목록 (이메일 발송용)
    
    for (const doc of userNumbersSnapshot.docs) {
        const userData = doc.data();
        const userNumbers = userData.numbers;
        
        // 당첨 확인
        const winningResult = checkWinning(userNumbers, winningNumbers, bonusNumber);
        
        if (winningResult.rank > 0) {
            console.log(`당첨자 발견! 사용자: ${userData.userId}, 등급: ${winningResult.prize}`);
            
            // 사용자 정보 조회 (이메일 발송용)
            try {
                const userDoc = await db.collection('users').doc(userData.userId).get();
                if (userDoc.exists) {
                    winningUsers.push({
                        userId: userData.userId,
                        email: userDoc.data().email,
                        displayName: userDoc.data().displayName,
                        winningResult,
                        userNumbers,
                        winningNumbers,
                        bonusNumber,
                        drawNumber
                    });
                }
            } catch (error) {
                console.error('사용자 정보 조회 실패:', userData.userId, error);
            }
        }
        
        // userResults 컬렉션에 결과 저장
        const resultData = {
            userId: userData.userId,
            drawNumber: drawNumber,
            userNumbers: userNumbers,
            winningNumbers: winningNumbers,
            bonusNumber: bonusNumber,
            matchCount: winningResult.matchCount,
            matchNumbers: winningResult.matchNumbers,
            rank: winningResult.rank,
            prize: winningResult.prize,
            hasBonus: winningResult.hasBonus,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const resultRef = db.collection('userResults').doc();
        batch.set(resultRef, resultData);
    }
    
    // 배치 작업 실행
    await batch.commit();
    console.log('모든 당첨 결과 저장 완료');
    
    // 당첨자에게 이메일 발송
    if (winningUsers.length > 0) {
        console.log(`${winningUsers.length}명의 당첨자에게 이메일 발송 시작`);
        await sendWinningEmails(winningUsers);
    }
}

/**
 * 특정 회차의 기존 결과 삭제
 */
async function deleteExistingResults(drawNumber) {
    console.log(`제${drawNumber}회차 기존 결과 삭제 시작`);
    
    const existingResults = await db.collection('userResults')
        .where('drawNumber', '==', drawNumber)
        .get();
    
    if (!existingResults.empty) {
        const batch = db.batch();
        existingResults.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`${existingResults.size}개 기존 결과 삭제 완료`);
    }
}

/**
 * 당첨 확인 로직
 */
function checkWinning(userNumbers, winningNumbers, bonusNumber) {
    if (!Array.isArray(userNumbers) || !Array.isArray(winningNumbers)) {
        return { rank: 0, matchCount: 0, matchNumbers: [], hasBonus: false, prize: '' };
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
        matchNumbers: matchNumbers.sort((a, b) => a - b),
        hasBonus: hasBonus && rank === 2
    };
}

/**
 * 당첨자에게 이메일 발송
 */
async function sendWinningEmails(winningUsers) {
    for (const winner of winningUsers) {
        try {
            await sendWinningEmail(winner);
            console.log(`이메일 발송 완료: ${winner.email}`);
        } catch (error) {
            console.error(`이메일 발송 실패 (${winner.email}):`, error);
        }
    }
}

/**
 * 개별 당첨 이메일 발송
 */
async function sendWinningEmail(winner) {
    const {
        email,
        displayName,
        winningResult,
        userNumbers,
        winningNumbers,
        bonusNumber,
        drawNumber
    } = winner;
    
    const subject = `🎉 축하합니다! 제${drawNumber}회 로또 ${winningResult.prize} 당첨!`;
    
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                <h1>🎉 축하합니다! 🎉</h1>
                <h2>${displayName || '고객'}님, 로또에 당첨되셨습니다!</h2>
            </div>
            
            <div style="padding: 20px; background: #f9f9f9;">
                <h3 style="color: #333;">당첨 정보</h3>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <p><strong>회차:</strong> 제${drawNumber}회</p>
                    <p><strong>당첨 등급:</strong> <span style="color: #e74c3c; font-weight: bold;">${winningResult.prize}</span></p>
                    <p><strong>일치 번호 개수:</strong> ${winningResult.matchCount}개</p>
                    ${winningResult.hasBonus ? '<p><strong>보너스 번호:</strong> 일치 ✅</p>' : ''}
                </div>
                
                <h3 style="color: #333;">번호 정보</h3>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <p><strong>선택한 번호:</strong></p>
                    <div style="margin: 10px 0;">
                        ${userNumbers.map(num => {
                            const isMatch = winningResult.matchNumbers.includes(num);
                            const isBonus = num === bonusNumber && winningResult.hasBonus;
                            return `<span style="display: inline-block; width: 35px; height: 35px; line-height: 35px; text-align: center; margin: 2px; border-radius: 50%; font-weight: bold; ${
                                isMatch ? 'background: #e74c3c; color: white;' : 
                                isBonus ? 'background: #f39c12; color: white;' : 
                                'background: #ecf0f1; color: #2c3e50;'
                            }">${num}</span>`;
                        }).join('')}
                    </div>
                    
                    <p><strong>당첨 번호:</strong></p>
                    <div style="margin: 10px 0;">
                        ${winningNumbers.map(num => 
                            `<span style="display: inline-block; width: 35px; height: 35px; line-height: 35px; text-align: center; margin: 2px; border-radius: 50%; background: #27ae60; color: white; font-weight: bold;">${num}</span>`
                        ).join('')}
                        <span style="margin: 0 10px; font-size: 20px;">+</span>
                        <span style="display: inline-block; width: 35px; height: 35px; line-height: 35px; text-align: center; margin: 2px; border-radius: 50%; background: #f39c12; color: white; font-weight: bold;">${bonusNumber}</span>
                    </div>
                </div>
                
                <div style="background: #3498db; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <h3 style="margin: 0;">다음 단계</h3>
                    <p style="margin: 5px 0;">당첨금 수령을 위해 가까운 복권판매점 또는 은행을 방문하세요.</p>
                    <p style="margin: 5px 0; font-size: 14px;">※ 당첨금 수령 기한: 지급개시일로부터 1년</p>
                </div>
            </div>
            
            <div style="background: #2c3e50; color: white; padding: 15px; text-align: center; font-size: 12px;">
                <p>본 메일은 자동으로 발송된 알림 메일입니다.</p>
                <p>로또 번호 선택 앱 | © 2025</p>
            </div>
        </div>
    `;
    
    const textContent = `
        축하합니다! ${displayName || '고객'}님, 제${drawNumber}회 로또에 당첨되셨습니다!
        
        당첨 정보:
        - 당첨 등급: ${winningResult.prize}
        - 일치 번호: ${winningResult.matchCount}개
        ${winningResult.hasBonus ? '- 보너스 번호: 일치' : ''}
        
        선택한 번호: ${userNumbers.join(', ')}
        당첨 번호: ${winningNumbers.join(', ')} + ${bonusNumber}
        
        당첨금 수령을 위해 가까운 복권판매점 또는 은행을 방문하세요.
        (수령 기한: 지급개시일로부터 1년)
    `;
    
    const mailOptions = {
        from: functions.config().email?.user || 'noreply@lotto-app.com',
        to: email,
        subject: subject,
        text: textContent,
        html: htmlContent
    };
    
    await transporter.sendMail(mailOptions);
}

/**
 * 수동 당첨 확인 트리거 (관리자용)
 * HTTP 호출로 특정 회차의 당첨 확인을 수동으로 실행
 */
exports.manualCheckWinning = functions.https.onCall(async (data, context) => {
    // 관리자 권한 확인
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            '관리자만 수동 당첨 확인을 실행할 수 있습니다.'
        );
    }
    
    const { drawNumber } = data;
    
    if (!drawNumber) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            '회차 번호를 입력해주세요.'
        );
    }
    
    try {
        // 해당 회차의 당첨 번호 조회
        const winningSnapshot = await db.collection('winningNumbers')
            .where('drawNumber', '==', drawNumber)
            .limit(1)
            .get();
        
        if (winningSnapshot.empty) {
            throw new functions.https.HttpsError(
                'not-found',
                `제${drawNumber}회 당첨 번호를 찾을 수 없습니다.`
            );
        }
        
        const winningData = winningSnapshot.docs[0].data();
        
        // 기존 결과 삭제 후 재계산
        await deleteExistingResults(drawNumber);
        await processAllUserNumbers(winningData);
        
        return {
            success: true,
            message: `제${drawNumber}회차 당첨 확인이 완료되었습니다.`
        };
        
    } catch (error) {
        console.error('수동 당첨 확인 실패:', error);
        throw new functions.https.HttpsError(
            'internal',
            '당첨 확인 처리 중 오류가 발생했습니다.'
        );
    }
});

/**
 * 당첨 통계 조회 (사용자용)
 */
exports.getUserWinningStats = functions.https.onCall(async (data, context) => {
    // 인증된 사용자만 접근 가능
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            '로그인이 필요합니다.'
        );
    }
    
    const userId = context.auth.uid;
    
    try {
        // 사용자의 모든 당첨 결과 조회
        const resultsSnapshot = await db.collection('userResults')
            .where('userId', '==', userId)
            .get();
        
        const stats = {
            totalEntries: resultsSnapshot.size,
            totalWinnings: 0,
            winningsByRank: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            winningRate: 0,
            recentWinnings: []
        };
        
        resultsSnapshot.docs.forEach(doc => {
            const result = doc.data();
            if (result.rank > 0) {
                stats.totalWinnings++;
                stats.winningsByRank[result.rank]++;
                
                if (stats.recentWinnings.length < 10) {
                    stats.recentWinnings.push({
                        drawNumber: result.drawNumber,
                        rank: result.rank,
                        prize: result.prize,
                        userNumbers: result.userNumbers,
                        winningNumbers: result.winningNumbers
                    });
                }
            }
        });
        
        stats.winningRate = stats.totalEntries > 0 ? 
            (stats.totalWinnings / stats.totalEntries * 100).toFixed(2) : 0;
        
        // 최신 순으로 정렬
        stats.recentWinnings.sort((a, b) => b.drawNumber - a.drawNumber);
        
        return stats;
        
    } catch (error) {
        console.error('당첨 통계 조회 실패:', error);
        throw new functions.https.HttpsError(
            'internal',
            '통계 조회 중 오류가 발생했습니다.'
        );
    }
});

/**
 * 모든 사용자 당첨 통계 조회 (관리자용)
 */
exports.getAllWinningStats = functions.https.onCall(async (data, context) => {
    // 관리자 권한 확인
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            '관리자만 전체 통계를 조회할 수 있습니다.'
        );
    }
    
    try {
        const resultsSnapshot = await db.collection('userResults').get();
        
        const stats = {
            totalUsers: new Set(),
            totalEntries: resultsSnapshot.size,
            totalWinnings: 0,
            winningsByRank: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            winningsByDraw: {}
        };
        
        resultsSnapshot.docs.forEach(doc => {
            const result = doc.data();
            stats.totalUsers.add(result.userId);
            
            if (result.rank > 0) {
                stats.totalWinnings++;
                stats.winningsByRank[result.rank]++;
                
                const drawNumber = result.drawNumber;
                if (!stats.winningsByDraw[drawNumber]) {
                    stats.winningsByDraw[drawNumber] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                }
                stats.winningsByDraw[drawNumber][result.rank]++;
            }
        });
        
        stats.totalUsers = stats.totalUsers.size;
        stats.winningRate = stats.totalEntries > 0 ? 
            (stats.totalWinnings / stats.totalEntries * 100).toFixed(2) : 0;
        
        return stats;
        
    } catch (error) {
        console.error('전체 통계 조회 실패:', error);
        throw new functions.https.HttpsError(
            'internal',
            '통계 조회 중 오류가 발생했습니다.'
        );
    }
});