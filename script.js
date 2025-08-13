// 로또 번호 선택기 JavaScript

class LottoApp {
    constructor() {
        this.selectedNumbers = [];
        this.maxSelections = 6;
        this.maxNumber = 45;
        this.currentUser = null;
        this.isLoginMode = true;
        this.userNumbers = [];
        this.isLoading = false;
        this.winningNumbers = [];
        this.winningNumbersListener = null;
        this.latestWinning = null;
        
        this.init();
    }

    init() {
        this.createNumberGrid();
        this.bindEvents();
        this.bindAuthEvents();
        this.setupAuthStateListener();
        this.updateUI();
    }

    // 번호 그리드 생성 (1-45)
    createNumberGrid() {
        const numberGrid = document.getElementById('numberGrid');
        
        for (let i = 1; i <= this.maxNumber; i++) {
            const button = document.createElement('button');
            button.className = 'number-btn';
            button.textContent = i;
            button.dataset.number = i;
            button.addEventListener('click', () => this.toggleNumber(i));
            
            numberGrid.appendChild(button);
        }
    }

    // 이벤트 바인딩
    bindEvents() {
        // 초기화 버튼
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetSelection();
        });

        // 임의 선택 버튼
        document.getElementById('randomBtn').addEventListener('click', () => {
            this.randomSelection();
        });

        // 저장 버튼
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveNumbers();
        });
    }

    // 번호 토글 (선택/해제)
    toggleNumber(number) {
        const index = this.selectedNumbers.indexOf(number);
        
        if (index > -1) {
            // 이미 선택된 번호면 해제
            this.selectedNumbers.splice(index, 1);
        } else {
            // 선택되지 않은 번호면 추가 (최대 6개까지)
            if (this.selectedNumbers.length < this.maxSelections) {
                this.selectedNumbers.push(number);
            } else {
                this.showMessage('최대 6개까지만 선택할 수 있습니다.', 'warning');
                return;
            }
        }
        
        this.selectedNumbers.sort((a, b) => a - b);
        this.updateUI();
    }

    // UI 업데이트
    updateUI() {
        this.updateSelectedNumbersDisplay();
        this.updateNumberGridButtons();
        this.updateControlButtons();
        this.updateSelectionInfo();
    }

    // 선택된 번호 표시 업데이트
    updateSelectedNumbersDisplay() {
        const selectedNumbersContainer = document.getElementById('selectedNumbers');
        const balls = selectedNumbersContainer.querySelectorAll('.selected-ball');
        
        balls.forEach((ball, index) => {
            if (index < this.selectedNumbers.length) {
                ball.textContent = this.selectedNumbers[index];
                ball.classList.remove('empty');
            } else {
                ball.textContent = '-';
                ball.classList.add('empty');
            }
        });
    }

    // 번호 그리드 버튼 상태 업데이트
    updateNumberGridButtons() {
        const buttons = document.querySelectorAll('.number-btn');
        
        buttons.forEach(button => {
            const number = parseInt(button.dataset.number);
            const isSelected = this.selectedNumbers.includes(number);
            const isDisabled = !isSelected && this.selectedNumbers.length >= this.maxSelections;
            
            button.classList.toggle('selected', isSelected);
            button.classList.toggle('disabled', isDisabled);
        });
    }

    // 컨트롤 버튼 상태 업데이트
    updateControlButtons() {
        const saveBtn = document.getElementById('saveBtn');
        const isComplete = this.selectedNumbers.length === this.maxSelections;
        
        saveBtn.disabled = !isComplete;
    }

    // 선택 정보 텍스트 업데이트
    updateSelectionInfo() {
        const selectionInfo = document.querySelector('.selection-info');
        const remaining = this.maxSelections - this.selectedNumbers.length;
        
        if (remaining === 0) {
            selectionInfo.textContent = '6개 번호 선택 완료! 저장할 수 있습니다.';
            selectionInfo.style.color = '#48bb78';
        } else if (remaining === 6) {
            selectionInfo.textContent = '6개 번호를 선택해주세요';
            selectionInfo.style.color = '#666';
        } else {
            selectionInfo.textContent = `${remaining}개 번호를 더 선택해주세요`;
            selectionInfo.style.color = '#ed8936';
        }
    }

    // 선택 초기화
    resetSelection() {
        this.selectedNumbers = [];
        this.updateUI();
        this.showMessage('선택이 초기화되었습니다.', 'info');
    }

    // 임의 선택
    randomSelection() {
        this.selectedNumbers = [];
        
        while (this.selectedNumbers.length < this.maxSelections) {
            const randomNumber = Math.floor(Math.random() * this.maxNumber) + 1;
            
            if (!this.selectedNumbers.includes(randomNumber)) {
                this.selectedNumbers.push(randomNumber);
            }
        }
        
        this.selectedNumbers.sort((a, b) => a - b);
        this.updateUI();
        this.showMessage('임의로 6개 번호가 선택되었습니다.', 'success');
    }

    // 번호 저장 (인증된 사용자만 가능)
    async saveNumbers() {
        if (this.selectedNumbers.length !== this.maxSelections) {
            this.showMessage('6개 번호를 모두 선택해주세요.', 'warning');
            return;
        }

        // 로그인 확인
        if (!this.currentUser) {
            this.showLoginRequired();
            return;
        }

        try {
            this.showLoadingSpinner(true);
            
            if (typeof FirebaseUtils !== 'undefined') {
                await FirebaseUtils.saveNumbers(this.selectedNumbers);
                this.showMessage('번호가 성공적으로 저장되었습니다!', 'success');
                
                // 저장 후 내 번호 목록 새로고침
                await this.loadUserNumbers();
                
                // 저장 후 새로운 선택을 위해 초기화
                setTimeout(() => {
                    this.resetSelection();
                }, 2000);
                
            } else {
                console.log('선택된 번호:', this.selectedNumbers);
                this.showMessage('Firebase 설정이 필요합니다.', 'info');
            }
            
        } catch (error) {
            console.error('저장 오류:', error);
            if (error.message === '로그인이 필요합니다.') {
                this.showLoginRequired();
            } else {
                this.showMessage('저장 중 오류가 발생했습니다.', 'error');
            }
        } finally {
            this.showLoadingSpinner(false);
        }
    }

    // 메시지 표시
    showMessage(message, type = 'info') {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 새 메시지 생성
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
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

    // 선택된 번호 가져오기
    getSelectedNumbers() {
        return [...this.selectedNumbers];
    }

    // 번호 유효성 검사
    isValidSelection() {
        return this.selectedNumbers.length === this.maxSelections &&
               this.selectedNumbers.every(num => num >= 1 && num <= this.maxNumber);
    }

    // 인증 관련 이벤트 바인딩
    bindAuthEvents() {
        // 로그인 버튼
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.showLoginModal();
        });

        // 로그아웃 버튼
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
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

        // 탭 전환
        document.getElementById('loginTab').addEventListener('click', () => {
            this.switchAuthTab('login');
        });
        
        document.getElementById('signupTab').addEventListener('click', () => {
            this.switchAuthTab('signup');
        });

        // 폼 제출
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuthSubmit();
        });

        // Google 로그인
        document.getElementById('googleLoginBtn').addEventListener('click', () => {
            this.handleGoogleLogin();
        });
    }

    // 인증 상태 리스너 설정
    setupAuthStateListener() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
                this.updateAuthUI();
                
                if (user) {
                    console.log('로그인됨:', user.email);
                    this.loadUserNumbers();
                    this.setupWinningNumbersListener();
                } else {
                    console.log('로그아웃됨');
                    this.userNumbers = [];
                    this.updateMyNumbersSection();
                    this.cleanupWinningNumbersListener();
                }
            });
        }
    }

    // 로그인 모달 표시
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.style.display = 'block';
        this.switchAuthTab('login');
    }

    // 로그인 모달 숨김
    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.style.display = 'none';
        this.clearAuthForm();
    }

    // 인증 탭 전환
    switchAuthTab(mode) {
        this.isLoginMode = mode === 'login';
        
        const loginTab = document.getElementById('loginTab');
        const signupTab = document.getElementById('signupTab');
        const displayNameGroup = document.getElementById('displayNameGroup');
        const submitBtn = document.getElementById('authSubmitBtn');
        
        if (this.isLoginMode) {
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            displayNameGroup.style.display = 'none';
            submitBtn.textContent = '로그인';
            document.querySelector('.modal-content h2').textContent = '로그인';
        } else {
            loginTab.classList.remove('active');
            signupTab.classList.add('active');
            displayNameGroup.style.display = 'block';
            submitBtn.textContent = '회원가입';
            document.querySelector('.modal-content h2').textContent = '회원가입';
        }
    }

    // 인증 폼 제출 처리
    async handleAuthSubmit() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const displayName = document.getElementById('displayName').value;

        if (!email || !password) {
            this.showMessage('이메일과 비밀번호를 입력해주세요.', 'warning');
            return;
        }

        if (!this.isLoginMode && !displayName) {
            this.showMessage('닉네임을 입력해주세요.', 'warning');
            return;
        }

        try {
            if (typeof AuthUtils !== 'undefined') {
                if (this.isLoginMode) {
                    await AuthUtils.signInWithEmail(email, password);
                    this.showMessage('로그인 성공!', 'success');
                } else {
                    await AuthUtils.signUpWithEmail(email, password, displayName);
                    this.showMessage('회원가입 성공!', 'success');
                }
                this.hideLoginModal();
            } else {
                this.showMessage('Firebase 설정이 필요합니다.', 'error');
            }
        } catch (error) {
            console.error('인증 오류:', error);
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

    // 로그아웃
    async logout() {
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

    // 인증 UI 업데이트
    updateAuthUI() {
        const loginSection = document.getElementById('loginSection');
        const userSection = document.getElementById('userSection');
        const userName = document.getElementById('userName');

        if (this.currentUser) {
            loginSection.style.display = 'none';
            userSection.style.display = 'flex';
            userName.textContent = this.currentUser.displayName || this.currentUser.email;
        } else {
            loginSection.style.display = 'block';
            userSection.style.display = 'none';
        }
    }

    // 로그인 필요 메시지 표시
    showLoginRequired() {
        this.showMessage('로그인이 필요합니다. 로그인 후 다시 시도해주세요.', 'warning');
        setTimeout(() => {
            this.showLoginModal();
        }, 1500);
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
            case 'auth/email-already-in-use':
                message = '이미 사용 중인 이메일입니다.';
                break;
            case 'auth/weak-password':
                message = '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
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

    // 인증 폼 초기화
    clearAuthForm() {
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.getElementById('displayName').value = '';
    }

    // 사용자 번호 조회
    async loadUserNumbers() {
        if (!this.currentUser) {
            this.userNumbers = [];
            this.updateMyNumbersSection();
            return;
        }

        try {
            this.showLoadingSpinner(true);
            
            if (typeof FirebaseUtils !== 'undefined') {
                this.userNumbers = await FirebaseUtils.getUserNumbers();
                this.updateMyNumbersSection();
            }
        } catch (error) {
            console.error('번호 조회 오류:', error);
            this.showMessage('번호 조회 중 오류가 발생했습니다.', 'error');
        } finally {
            this.showLoadingSpinner(false);
        }
    }

    // 내 번호 섹션 업데이트
    updateMyNumbersSection() {
        const myNumbersSection = document.getElementById('myNumbersSection');
        const myNumbersList = document.getElementById('myNumbersList');
        
        if (!this.currentUser) {
            myNumbersSection.style.display = 'none';
            return;
        }

        myNumbersSection.style.display = 'block';
        myNumbersList.innerHTML = '';

        if (this.userNumbers.length === 0) {
            myNumbersList.innerHTML = `
                <div class="no-numbers">
                    <p>저장된 번호가 없습니다.</p>
                    <p>번호를 선택하고 저장해보세요!</p>
                </div>
            `;
            return;
        }

        this.userNumbers.forEach(numberData => {
            const card = this.createNumberCard(numberData);
            myNumbersList.appendChild(card);
        });

        // 당첨 통계 업데이트
        this.updateWinningStats();
    }

    // 번호 카드 생성 (당첨 정보 포함)
    createNumberCard(numberData) {
        const card = document.createElement('div');
        card.className = 'number-card';
        
        // 당첨 확인
        let winningInfo = '';
        let winningClass = '';
        
        if (this.latestWinning && numberData.drawNumber <= this.latestWinning.drawNumber) {
            const winningResult = this.checkWinningForNumber(numberData);
            if (winningResult && winningResult.rank > 0) {
                winningInfo = `<div class="winning-badge rank-${winningResult.rank}">${winningResult.prize}</div>`;
                winningClass = ` winning-card rank-${winningResult.rank}`;
            }
        }

        card.className += winningClass;
        card.innerHTML = `
            <div class="card-header">
                <span class="draw-number">제${numberData.drawNumber}회</span>
                <span class="save-date">${numberData.date}</span>
                <button class="delete-btn" data-id="${numberData.id}" title="삭제">×</button>
            </div>
            <div class="card-numbers">
                ${this.renderNumberBalls(numberData.numbers, numberData.drawNumber)}
            </div>
            ${winningInfo}
        `;

        // 삭제 버튼 이벤트
        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteUserNumber(numberData.id);
        });

        return card;
    }

    // 번호 볼 렌더링 (당첨 번호 하이라이트)
    renderNumberBalls(numbers, drawNumber) {
        if (!this.latestWinning || drawNumber > this.latestWinning.drawNumber) {
            return numbers.map(num => `<span class="number-ball">${num}</span>`).join('');
        }

        const winningData = this.getWinningDataByDraw(drawNumber);
        if (!winningData) {
            return numbers.map(num => `<span class="number-ball">${num}</span>`).join('');
        }

        return numbers.map(num => {
            const isWinning = winningData.numbers.includes(num);
            const isBonus = num === winningData.bonusNumber;
            let className = 'number-ball';
            
            if (isWinning) {
                className += ' winning-number';
            } else if (isBonus) {
                className += ' bonus-number';
            }

            return `<span class="${className}">${num}</span>`;
        }).join('');
    }

    // 특정 번호의 당첨 확인
    checkWinningForNumber(numberData) {
        if (!this.latestWinning || numberData.drawNumber > this.latestWinning.drawNumber) {
            return null;
        }

        const winningData = this.getWinningDataByDraw(numberData.drawNumber);
        if (!winningData) {
            return null;
        }

        if (typeof FirebaseUtils !== 'undefined') {
            return FirebaseUtils.checkWinning(
                numberData.numbers,
                winningData.numbers,
                winningData.bonusNumber
            );
        }
        return null;
    }

    // 특정 회차의 당첨 데이터 찾기
    getWinningDataByDraw(drawNumber) {
        return this.winningNumbers.find(w => w.drawNumber === drawNumber);
    }

    // 번호 삭제
    async deleteUserNumber(docId) {
        if (!confirm('이 번호를 삭제하시겠습니까?')) {
            return;
        }

        try {
            this.showLoadingSpinner(true);
            
            if (typeof FirebaseUtils !== 'undefined') {
                await FirebaseUtils.deleteUserNumber(docId);
                this.showMessage('번호가 삭제되었습니다.', 'success');
                await this.loadUserNumbers();
            }
        } catch (error) {
            console.error('삭제 오류:', error);
            if (error.message === '삭제 권한이 없습니다.') {
                this.showMessage('삭제 권한이 없습니다.', 'error');
            } else {
                this.showMessage('삭제 중 오류가 발생했습니다.', 'error');
            }
        } finally {
            this.showLoadingSpinner(false);
        }
    }

    // 로딩 스피너 표시/숨김
    showLoadingSpinner(show) {
        this.isLoading = show;
        let spinner = document.getElementById('loadingSpinner');
        
        if (show && !spinner) {
            spinner = document.createElement('div');
            spinner.id = 'loadingSpinner';
            spinner.className = 'loading-spinner';
            spinner.innerHTML = `
                <div class="spinner-overlay">
                    <div class="spinner"></div>
                    <p>처리 중...</p>
                </div>
            `;
            document.body.appendChild(spinner);
        } else if (!show && spinner) {
            spinner.remove();
        }
    }

    // 당첨 번호 실시간 리스너 설정
    setupWinningNumbersListener() {
        if (typeof FirebaseUtils !== 'undefined' && FirebaseUtils.setupWinningNumbersListener) {
            this.winningNumbersListener = FirebaseUtils.setupWinningNumbersListener((winningNumbers) => {
                this.winningNumbers = winningNumbers;
                if (winningNumbers.length > 0) {
                    this.latestWinning = winningNumbers[0];
                }
                this.updateWinningNumbersSection();
                this.updateMyNumbersSection(); // 당첨 정보 업데이트를 위해 재렌더링
                this.updateWinningStats(); // 당첨 통계 업데이트
            });
        }
    }

    // 당첨 번호 리스너 정리
    cleanupWinningNumbersListener() {
        if (this.winningNumbersListener) {
            this.winningNumbersListener();
            this.winningNumbersListener = null;
        }
    }

    // 당첨 번호 섹션 업데이트
    updateWinningNumbersSection() {
        let winningSection = document.getElementById('winningNumbersSection');
        
        if (!winningSection) {
            // 당첨 번호 섹션이 없으면 생성
            this.createWinningNumbersSection();
            winningSection = document.getElementById('winningNumbersSection');
        }

        const winningList = document.getElementById('winningNumbersList');
        winningList.innerHTML = '';

        if (this.winningNumbers.length === 0) {
            winningList.innerHTML = `
                <div class="no-winning-numbers">
                    <p>아직 등록된 당첨 번호가 없습니다.</p>
                </div>
            `;
            return;
        }

        this.winningNumbers.forEach(winningData => {
            const card = this.createWinningNumberCard(winningData);
            winningList.appendChild(card);
        });
    }

    // 당첨 번호 섹션 생성
    createWinningNumbersSection() {
        const mainContent = document.querySelector('.main-content');
        const myNumbersSection = document.getElementById('myNumbersSection');
        
        const winningSection = document.createElement('div');
        winningSection.className = 'winning-numbers-section';
        winningSection.id = 'winningNumbersSection';
        winningSection.innerHTML = `
            <h2>🎯 당첨 번호</h2>
            <div class="winning-numbers-list" id="winningNumbersList">
                <!-- JavaScript로 동적 생성 -->
            </div>
        `;

        mainContent.insertBefore(winningSection, myNumbersSection);
        
        // 당첨 통계 섹션도 생성
        this.createWinningStatsSection();
    }

    // 당첨 통계 섹션 생성
    createWinningStatsSection() {
        const mainContent = document.querySelector('.main-content');
        const myNumbersSection = document.getElementById('myNumbersSection');
        
        const statsSection = document.createElement('div');
        statsSection.className = 'winning-stats-section';
        statsSection.id = 'winningStatsSection';
        statsSection.innerHTML = `
            <h3>🏆 나의 당첨 통계</h3>
            <div class="stats-grid" id="statsGrid">
                <div class="stat-item">
                    <span class="stat-number" id="totalNumbers">0</span>
                    <span class="stat-label">총 번호</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number" id="totalWinnings">0</span>
                    <span class="stat-label">당첨 횟수</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number" id="winningRate">0%</span>
                    <span class="stat-label">당첨률</span>
                </div>
            </div>
            <div class="rank-stats" id="rankStats">
                <div class="rank-stat rank-1">
                    <div class="stat-number">0</div>
                    <div class="stat-label">1등</div>
                </div>
                <div class="rank-stat rank-2">
                    <div class="stat-number">0</div>
                    <div class="stat-label">2등</div>
                </div>
                <div class="rank-stat rank-3">
                    <div class="stat-number">0</div>
                    <div class="stat-label">3등</div>
                </div>
                <div class="rank-stat rank-4">
                    <div class="stat-number">0</div>
                    <div class="stat-label">4등</div>
                </div>
                <div class="rank-stat rank-5">
                    <div class="stat-number">0</div>
                    <div class="stat-label">5등</div>
                </div>
            </div>
        `;

        mainContent.insertBefore(statsSection, myNumbersSection);
    }

    // 당첨 통계 업데이트
    async updateWinningStats() {
        if (!this.currentUser || this.userNumbers.length === 0) {
            return;
        }

        try {
            const stats = {
                total: this.userNumbers.length,
                winnings: { rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0, total: 0 }
            };

            // 각 번호에 대해 당첨 확인
            for (const numberData of this.userNumbers) {
                const winningResult = this.checkWinningForNumber(numberData);
                if (winningResult && winningResult.rank > 0) {
                    stats.winnings[`rank${winningResult.rank}`]++;
                    stats.winnings.total++;
                }
            }

            // UI 업데이트
            const totalNumbersEl = document.getElementById('totalNumbers');
            const totalWinningsEl = document.getElementById('totalWinnings');
            const winningRateEl = document.getElementById('winningRate');

            if (totalNumbersEl) totalNumbersEl.textContent = stats.total;
            if (totalWinningsEl) totalWinningsEl.textContent = stats.winnings.total;
            if (winningRateEl) {
                const rate = stats.total > 0 ? ((stats.winnings.total / stats.total) * 100).toFixed(1) : 0;
                winningRateEl.textContent = `${rate}%`;
            }

            // 등급별 통계 업데이트
            const rankStats = document.getElementById('rankStats');
            if (rankStats) {
                const rankElements = rankStats.querySelectorAll('.rank-stat');
                rankElements.forEach((el, index) => {
                    const rank = index + 1;
                    const countEl = el.querySelector('.stat-number');
                    if (countEl) {
                        countEl.textContent = stats.winnings[`rank${rank}`] || 0;
                    }
                });
            }

        } catch (error) {
            console.error('당첨 통계 업데이트 실패:', error);
        }
    }

    // 당첨 번호 카드 생성
    createWinningNumberCard(winningData) {
        const card = document.createElement('div');
        card.className = 'winning-card';
        card.innerHTML = `
            <div class="winning-header">
                <span class="draw-number">제${winningData.drawNumber}회</span>
                <span class="draw-date">${winningData.drawDate}</span>
            </div>
            <div class="winning-numbers">
                <div class="main-numbers">
                    ${winningData.numbers.map(num => `<span class="winning-ball">${num}</span>`).join('')}
                </div>
                <div class="bonus-section">
                    <span class="plus">+</span>
                    <span class="bonus-ball">${winningData.bonusNumber}</span>
                </div>
            </div>
        `;

        return card;
    }
}

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    const app = new LottoApp();
    
    // 전역 접근을 위해 window 객체에 할당
    window.lottoApp = app;
    
    console.log('로또 번호 선택기가 초기화되었습니다.');
});

// 유틸리티 함수들
const LottoUtils = {
    // 번호 배열을 문자열로 변환
    numbersToString(numbers) {
        return numbers.join(', ');
    },
    
    // 번호 생성 통계 (개발용)
    generateStats(count = 1000) {
        const stats = {};
        
        for (let i = 0; i < count; i++) {
            const numbers = [];
            while (numbers.length < 6) {
                const num = Math.floor(Math.random() * 45) + 1;
                if (!numbers.includes(num)) {
                    numbers.push(num);
                }
            }
            
            numbers.forEach(num => {
                stats[num] = (stats[num] || 0) + 1;
            });
        }
        
        return stats;
    },
    
    // 저장된 데이터 조회 (Firebase 연동 시)
    async getStoredSelections() {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const db = firebase.firestore();
                const snapshot = await db.collection('lotto-selections')
                    .orderBy('timestamp', 'desc')
                    .limit(10)
                    .get();
                
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (error) {
                console.error('데이터 조회 오류:', error);
                return [];
            }
        }
        return [];
    }
};