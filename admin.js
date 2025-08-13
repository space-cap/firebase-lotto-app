// 관리자 페이지 JavaScript

class AdminApp {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.recentWinningNumbers = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupAuthStateListener();
        this.loadRecentWinningNumbers();
        
        // 오늘 날짜를 기본값으로 설정
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('drawDate').value = today;
    }

    // 이벤트 바인딩
    bindEvents() {
        // 로그인 버튼
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.showLoginModal();
        });

        // 모달 관련
        const modal = document.getElementById('loginModal');
        const closeBtn = modal.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            this.hideLoginModal();
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideLoginModal();
            }
        });

        // 인증 폼
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Google 로그인
        document.getElementById('googleLoginBtn').addEventListener('click', () => {
            this.handleGoogleLogin();
        });

        // 당첨 번호 폼
        document.getElementById('winningNumberForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmitWinningNumbers();
        });

        // 번호 입력 필드 자동 정렬 및 검증
        const numberInputs = document.querySelectorAll('.number-input');
        numberInputs.forEach(input => {
            input.addEventListener('input', this.validateNumberInput);
            input.addEventListener('blur', this.sortNumbers);
        });

        document.getElementById('bonusNumber').addEventListener('input', this.validateNumberInput);
    }

    // 인증 상태 리스너
    setupAuthStateListener() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
                this.checkAdminStatus();
                this.updateAuthUI();
            });
        }
    }

    // 관리자 권한 확인
    checkAdminStatus() {
        if (this.currentUser) {
            // 간단한 관리자 확인 (실제 환경에서는 더 정교한 권한 시스템 필요)
            this.isAdmin = this.currentUser.email === 'admin@example.com' || 
                          this.currentUser.email?.includes('admin');
        } else {
            this.isAdmin = false;
        }
    }

    // 인증 UI 업데이트
    updateAuthUI() {
        const authStatus = document.getElementById('authStatus');
        const authMessage = document.getElementById('authMessage');
        const loginBtn = document.getElementById('loginBtn');
        const adminForm = document.getElementById('adminForm');

        if (this.currentUser) {
            if (this.isAdmin) {
                authStatus.className = 'auth-status admin';
                authMessage.innerHTML = `
                    <strong>✅ 관리자로 로그인됨</strong>
                    ${this.currentUser.displayName || this.currentUser.email}
                `;
                loginBtn.textContent = '로그아웃';
                loginBtn.onclick = () => this.handleLogout();
                adminForm.style.display = 'block';
            } else {
                authStatus.className = 'auth-status not-admin';
                authMessage.innerHTML = `
                    <strong>⚠️ 관리자 권한이 없습니다</strong>
                    현재 계정: ${this.currentUser.displayName || this.currentUser.email}
                `;
                loginBtn.textContent = '다른 계정으로 로그인';
                loginBtn.onclick = () => this.handleLogout();
                adminForm.style.display = 'none';
            }
        } else {
            authStatus.className = 'auth-status not-admin';
            authMessage.textContent = '관리자 로그인이 필요합니다.';
            loginBtn.textContent = '로그인';
            loginBtn.onclick = () => this.showLoginModal();
            adminForm.style.display = 'none';
        }
    }

    // 로그인 모달 표시
    showLoginModal() {
        document.getElementById('loginModal').style.display = 'block';
    }

    // 로그인 모달 숨김
    hideLoginModal() {
        document.getElementById('loginModal').style.display = 'none';
        this.clearForm();
    }

    // 로그인 처리
    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            this.showMessage('이메일과 비밀번호를 입력해주세요.', 'warning');
            return;
        }

        try {
            if (typeof AuthUtils !== 'undefined') {
                await AuthUtils.signInWithEmail(email, password);
                this.showMessage('로그인 성공!', 'success');
                this.hideLoginModal();
            } else {
                this.showMessage('Firebase 설정이 필요합니다.', 'error');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            this.showAuthError(error);
        }
    }

    // Google 로그인 처리
    async handleGoogleLogin() {
        try {
            if (typeof AuthUtils !== 'undefined') {
                await AuthUtils.signInWithGoogle();
                this.showMessage('Google 로그인 성공!', 'success');
                this.hideLoginModal();
            } else {
                this.showMessage('Firebase 설정이 필요합니다.', 'error');
            }
        } catch (error) {
            console.error('Google 로그인 오류:', error);
            this.showAuthError(error);
        }
    }

    // 로그아웃 처리
    async handleLogout() {
        try {
            if (typeof AuthUtils !== 'undefined') {
                await AuthUtils.signOut();
                this.showMessage('로그아웃되었습니다.', 'info');
            }
        } catch (error) {
            console.error('로그아웃 오류:', error);
            this.showMessage('로그아웃 중 오류가 발생했습니다.', 'error');
        }
    }

    // 당첨 번호 등록 처리
    async handleSubmitWinningNumbers() {
        if (!this.isAdmin) {
            this.showMessage('관리자 권한이 필요합니다.', 'error');
            return;
        }

        const drawNumber = parseInt(document.getElementById('drawNumber').value);
        const drawDate = document.getElementById('drawDate').value;
        const bonusNumber = parseInt(document.getElementById('bonusNumber').value);

        // 당첨 번호 수집
        const numberInputs = document.querySelectorAll('.number-input');
        const numbers = Array.from(numberInputs).map(input => parseInt(input.value)).filter(n => !isNaN(n));

        // 유효성 검사
        if (!this.validateWinningNumbers(drawNumber, numbers, bonusNumber, drawDate)) {
            return;
        }

        try {
            this.setLoading(true);

            if (typeof FirebaseUtils !== 'undefined') {
                await FirebaseUtils.saveWinningNumbers(drawNumber, numbers, bonusNumber, drawDate);
                this.showMessage('당첨 번호가 성공적으로 등록되었습니다!', 'success');
                this.clearWinningNumberForm();
                this.loadRecentWinningNumbers();
            } else {
                this.showMessage('Firebase 설정이 필요합니다.', 'error');
            }
        } catch (error) {
            console.error('당첨 번호 등록 오류:', error);
            if (error.message.includes('관리자만')) {
                this.showMessage('관리자만 당첨 번호를 등록할 수 있습니다.', 'error');
            } else {
                this.showMessage('당첨 번호 등록 중 오류가 발생했습니다.', 'error');
            }
        } finally {
            this.setLoading(false);
        }
    }

    // 당첨 번호 유효성 검사
    validateWinningNumbers(drawNumber, numbers, bonusNumber, drawDate) {
        if (!drawNumber || drawNumber < 1) {
            this.showMessage('유효한 추첨 회차를 입력해주세요.', 'warning');
            return false;
        }

        if (!drawDate) {
            this.showMessage('추첨일을 선택해주세요.', 'warning');
            return false;
        }

        if (numbers.length !== 6) {
            this.showMessage('당첨 번호 6개를 모두 입력해주세요.', 'warning');
            return false;
        }

        if (numbers.some(n => n < 1 || n > 45)) {
            this.showMessage('당첨 번호는 1~45 사이여야 합니다.', 'warning');
            return false;
        }

        if (new Set(numbers).size !== 6) {
            this.showMessage('중복된 당첨 번호가 있습니다.', 'warning');
            return false;
        }

        if (!bonusNumber || bonusNumber < 1 || bonusNumber > 45) {
            this.showMessage('유효한 보너스 번호를 입력해주세요. (1~45)', 'warning');
            return false;
        }

        if (numbers.includes(bonusNumber)) {
            this.showMessage('보너스 번호는 당첨 번호와 중복될 수 없습니다.', 'warning');
            return false;
        }

        return true;
    }

    // 번호 입력 검증
    validateNumberInput(e) {
        const value = parseInt(e.target.value);
        if (value < 1 || value > 45) {
            e.target.style.borderColor = '#f56565';
        } else {
            e.target.style.borderColor = '#e2e8f0';
        }
    }

    // 번호 자동 정렬
    sortNumbers() {
        const numberInputs = document.querySelectorAll('.number-input');
        const values = Array.from(numberInputs)
            .map(input => parseInt(input.value))
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);

        numberInputs.forEach((input, index) => {
            input.value = values[index] || '';
        });
    }

    // 최근 당첨 번호 조회
    async loadRecentWinningNumbers() {
        try {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const db = firebase.firestore();
                const snapshot = await db.collection('winningNumbers')
                    .orderBy('drawNumber', 'desc')
                    .limit(5)
                    .get();

                this.recentWinningNumbers = [];
                snapshot.forEach(doc => {
                    this.recentWinningNumbers.push({ id: doc.id, ...doc.data() });
                });

                this.updateRecentNumbersList();
            }
        } catch (error) {
            console.error('최근 당첨 번호 조회 오류:', error);
        }
    }

    // 최근 당첨 번호 목록 업데이트
    updateRecentNumbersList() {
        const list = document.getElementById('recentNumbersList');
        
        if (this.recentWinningNumbers.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #718096;">등록된 당첨 번호가 없습니다.</p>';
            return;
        }

        list.innerHTML = '';
        this.recentWinningNumbers.forEach(data => {
            const item = document.createElement('div');
            item.className = 'recent-item';
            item.style.cssText = `
                background: white;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 10px;
                border: 1px solid #e2e8f0;
            `;

            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong>제${data.drawNumber}회</strong>
                    <span style="color: #718096; font-size: 0.9rem;">${data.drawDate}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${data.numbers.map(num => 
                        `<span style="display: inline-flex; align-items: center; justify-content: center; 
                         width: 30px; height: 30px; border-radius: 50%; background: #4299e1; 
                         color: white; font-weight: bold; font-size: 0.9rem;">${num}</span>`
                    ).join('')}
                    <span style="margin: 0 8px; font-weight: bold;">+</span>
                    <span style="display: inline-flex; align-items: center; justify-content: center; 
                     width: 30px; height: 30px; border-radius: 50%; background: #f093fb; 
                     color: white; font-weight: bold; font-size: 0.9rem;">${data.bonusNumber}</span>
                </div>
            `;

            list.appendChild(item);
        });
    }

    // 폼 초기화
    clearWinningNumberForm() {
        document.getElementById('drawNumber').value = '';
        document.getElementById('drawDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('bonusNumber').value = '';
        
        const numberInputs = document.querySelectorAll('.number-input');
        numberInputs.forEach(input => {
            input.value = '';
            input.style.borderColor = '#e2e8f0';
        });
    }

    clearForm() {
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    }

    // 로딩 상태 설정
    setLoading(loading) {
        const submitBtn = document.getElementById('submitBtn');
        const form = document.getElementById('winningNumberForm');
        
        if (loading) {
            submitBtn.disabled = true;
            submitBtn.textContent = '등록 중...';
            form.style.opacity = '0.7';
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = '당첨 번호 등록';
            form.style.opacity = '1';
        }
    }

    // 메시지 표시
    showMessage(message, type = 'info') {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.admin-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 새 메시지 생성
        const messageDiv = document.createElement('div');
        messageDiv.className = `admin-message message-${type}`;
        messageDiv.textContent = message;
        
        // 메시지 스타일
        Object.assign(messageDiv.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '1000',
            minWidth: '200px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        });

        // 타입별 색상
        const colors = {
            success: '#48bb78',
            warning: '#ed8936',
            error: '#f56565',
            info: '#4299e1'
        };
        
        messageDiv.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(messageDiv);

        // 3초 후 자동 제거
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateX(-50%) translateY(-10px)';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 300);
        }, 3000);
    }

    // 인증 에러 처리
    showAuthError(error) {
        let message = '인증 중 오류가 발생했습니다.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                message = '등록되지 않은 이메일입니다.';
                break;
            case 'auth/wrong-password':
                message = '잘못된 비밀번호입니다.';
                break;
            case 'auth/invalid-email':
                message = '잘못된 이메일 형식입니다.';
                break;
            case 'auth/popup-closed-by-user':
                message = '로그인이 취소되었습니다.';
                break;
        }
        
        this.showMessage(message, 'error');
    }
}

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    const adminApp = new AdminApp();
    
    // 전역 접근을 위해 window 객체에 할당
    window.adminApp = adminApp;
    
    console.log('관리자 페이지가 초기화되었습니다.');
});