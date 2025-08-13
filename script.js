// 로또 번호 선택기 JavaScript

class LottoApp {
    constructor() {
        this.selectedNumbers = [];
        this.maxSelections = 6;
        this.maxNumber = 45;
        
        this.init();
    }

    init() {
        this.createNumberGrid();
        this.bindEvents();
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

    // 번호 저장 (Firebase 연동 대기)
    async saveNumbers() {
        if (this.selectedNumbers.length !== this.maxSelections) {
            this.showMessage('6개 번호를 모두 선택해주세요.', 'warning');
            return;
        }

        try {
            // Firebase 설정이 완료되면 활성화
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const db = firebase.firestore();
                const docData = {
                    numbers: this.selectedNumbers,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    date: new Date().toLocaleDateString('ko-KR')
                };

                await db.collection('lotto-selections').add(docData);
                this.showMessage('번호가 성공적으로 저장되었습니다!', 'success');
                
                // 저장 후 새로운 선택을 위해 초기화
                setTimeout(() => {
                    this.resetSelection();
                }, 2000);
                
            } else {
                // Firebase 미설정 시 로컬 저장 시뮬레이션
                console.log('선택된 번호:', this.selectedNumbers);
                this.showMessage('Firebase 설정 후 저장 가능합니다.', 'info');
            }
            
        } catch (error) {
            console.error('저장 오류:', error);
            this.showMessage('저장 중 오류가 발생했습니다.', 'error');
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