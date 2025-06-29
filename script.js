// DOM 요소들
const apiKeyInput = document.getElementById('apiKey');
const officeCodeInput = document.getElementById('officeCode');
const schoolCodeInput = document.getElementById('schoolCode');
const mealDateInput = document.getElementById('mealDate');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const searchMealBtn = document.getElementById('searchMeal');
const todayMealBtn = document.getElementById('todayMeal');
const loadingElement = document.getElementById('loading');
const mealContentElement = document.getElementById('mealContent');

// 로컬스토리지 키
const STORAGE_KEYS = {
    API_KEY: 'gangwon_meal_api_key',
    OFFICE_CODE: 'gangwon_meal_office_code',
    SCHOOL_CODE: 'gangwon_meal_school_code'
};

// 페이지 로드 시 저장된 데이터 불러오기
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    setupEventListeners();
    setDefaultDate();
});

// 기본 날짜 설정 (오늘 날짜)
function setDefaultDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    mealDateInput.value = todayStr;
}

// 저장된 데이터 불러오기
function loadSavedData() {
    const savedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    const savedOfficeCode = localStorage.getItem(STORAGE_KEYS.OFFICE_CODE);
    const savedSchoolCode = localStorage.getItem(STORAGE_KEYS.SCHOOL_CODE);
    
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }
    
    if (savedOfficeCode) {
        officeCodeInput.value = savedOfficeCode;
    }
    
    if (savedSchoolCode) {
        schoolCodeInput.value = savedSchoolCode;
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    searchMealBtn.addEventListener('click', searchMeal);
    todayMealBtn.addEventListener('click', searchTodayMeal);
    
    // Enter 키로도 검색 가능하도록
    schoolCodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMeal();
        }
    });
    
    apiKeyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveApiKey();
        }
    });
    
    officeCodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMeal();
        }
    });
    
    mealDateInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMeal();
        }
    });
}

// API 키 저장
function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showMessage('API 키를 입력해주세요.', 'error');
        return;
    }
    
    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
    showMessage('API 키가 성공적으로 저장되었습니다!', 'success');
}

// 오늘 급식 조회
function searchTodayMeal() {
    setDefaultDate();
    searchMeal();
}

// 급식 정보 검색
async function searchMeal() {
    const apiKey = apiKeyInput.value.trim();
    const officeCode = officeCodeInput.value.trim();
    const schoolCode = schoolCodeInput.value.trim();
    const mealDate = mealDateInput.value;
    
    if (!apiKey) {
        showMessage('API 키를 입력해주세요.', 'error');
        return;
    }
    
    if (!officeCode) {
        showMessage('교육청 코드를 입력해주세요.', 'error');
        return;
    }
    
    if (!schoolCode) {
        showMessage('학교 번호를 입력해주세요.', 'error');
        return;
    }
    
    if (!mealDate) {
        showMessage('조회 날짜를 선택해주세요.', 'error');
        return;
    }
    
    // 교육청 코드와 학교 번호 저장
    localStorage.setItem(STORAGE_KEYS.OFFICE_CODE, officeCode);
    localStorage.setItem(STORAGE_KEYS.SCHOOL_CODE, schoolCode);
    
    showLoading(true);
    
    try {
        // 선택된 날짜를 YYYYMMDD 형식으로 변환
        const selectedDate = new Date(mealDate);
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        
        // 나이스 교육정보 개방 포털 API URL
        const apiUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo`;
        
        const params = new URLSearchParams({
            KEY: apiKey,
            Type: 'json',
            ATPT_OFCDC_SC_CODE: officeCode, // 사용자가 입력한 교육청 코드
            SD_SCHUL_CODE: schoolCode,
            MLSV_YMD: dateStr
        });
        
        const response = await fetch(`${apiUrl}?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.RESULT && data.RESULT.CODE === 'INFO-200') {
            // 급식 정보가 없는 경우
            const formattedDate = formatDisplayDate(mealDate);
            showMealInfo([], `${formattedDate}에는 급식 정보가 없습니다.`);
        } else if (data.mealServiceDietInfo && data.mealServiceDietInfo[1]) {
            // 급식 정보가 있는 경우
            const mealData = data.mealServiceDietInfo[1].row;
            showMealInfo(mealData, null);
        } else {
            showMessage('급식 정보를 불러올 수 없습니다. API 키, 교육청 코드, 학교 번호를 확인해주세요.', 'error');
        }
        
    } catch (error) {
        console.error('Error fetching meal data:', error);
        showMessage('급식 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    } finally {
        showLoading(false);
    }
}

// 로딩 상태 표시
function showLoading(show) {
    if (show) {
        loadingElement.style.display = 'flex';
        mealContentElement.style.display = 'none';
    } else {
        loadingElement.style.display = 'none';
        mealContentElement.style.display = 'block';
    }
}

// 급식 정보 표시
function showMealInfo(mealData, noDataMessage) {
    const mealContent = document.getElementById('mealContent');
    
    if (noDataMessage) {
        mealContent.innerHTML = `<p class="placeholder-text">${noDataMessage}</p>`;
        return;
    }
    
    if (!mealData || mealData.length === 0) {
        const selectedDate = formatDisplayDate(mealDateInput.value);
        mealContent.innerHTML = `<p class="placeholder-text">${selectedDate}에는 급식 정보가 없습니다.</p>`;
        return;
    }
    
    // 날짜별로 급식을 그룹화
    const mealsByDate = {};
    
    mealData.forEach(meal => {
        const date = meal.MLSV_YMD;
        const formattedDate = `${date.substring(0, 4)}년 ${date.substring(4, 6)}월 ${date.substring(6, 8)}일`;
        
        if (!mealsByDate[formattedDate]) {
            mealsByDate[formattedDate] = {
                '조식': [],
                '중식': [],
                '석식': []
            };
        }
        
        const mealType = getMealType(meal.MMEAL_SC_CODE);
        if (mealType) {
            mealsByDate[formattedDate][mealType].push(meal);
        }
    });
    
    let html = '<div class="meal-container">';
    
    // 각 날짜별로 표시
    Object.keys(mealsByDate).forEach(date => {
        const meals = mealsByDate[date];
        html += `<div class="meal-date-section">`;
        html += `<h3 class="meal-date-title">${date}</h3>`;
        
        // 조식, 중식, 석식 순서로 표시
        ['조식', '중식', '석식'].forEach(mealType => {
            const mealList = meals[mealType];
            if (mealList.length > 0) {
                html += `<div class="meal-type-item">`;
                html += `<h4 class="meal-type-label">${mealType}</h4>`;
                html += `<div class="meal-menu-content">`;
                
                mealList.forEach(meal => {
                    // 급식 메뉴 정리 (알레르기 정보 완전 제거)
                    let menu = meal.DDISH_NM || '메뉴 정보 없음';
                    
                    // 알레르기 정보 완전 제거 (괄호 안의 모든 내용, 느낌표, 숫자 등)
                    menu = cleanMenuText(menu);
                    
                    // 메뉴를 개별 메뉴로 분리
                    const menuItems = splitMenuItems(menu);
                    
                    html += `<div class="meal-menu-list">`;
                    menuItems.forEach(item => {
                        const cleanItem = cleanMenuText(item);
                        if (cleanItem.trim()) {
                            html += `<div class="meal-menu-item">• ${cleanItem.trim()}</div>`;
                        }
                    });
                    html += `</div>`;
                });
                
                html += `</div>`;
                html += `</div>`;
            }
        });
        
        html += `</div>`;
    });
    
    html += '</div>';
    mealContent.innerHTML = html;
}

// 메뉴를 개별 메뉴로 분리
function splitMenuItems(menuText) {
    if (!menuText) return [];
    
    // HTML 태그 제거
    let cleaned = menuText.replace(/<[^>]*>/g, '');
    
    // 줄바꿈으로 먼저 분리
    let items = cleaned.split(/<br\s*\/?>/i);
    
    // 각 아이템을 공백으로 추가 분리
    let finalItems = [];
    items.forEach(item => {
        if (item.trim()) {
            // 공백으로 구분된 메뉴들을 개별 메뉴로 분리
            const subItems = item.trim().split(/\s+/);
            subItems.forEach(subItem => {
                if (subItem.trim()) {
                    finalItems.push(subItem.trim());
                }
            });
        }
    });
    
    return finalItems;
}

// 메뉴 텍스트 정리 (알레르기 정보 완전 제거)
function cleanMenuText(text) {
    if (!text) return '';
    
    // 괄호 안의 모든 내용 제거 (알레르기 정보)
    let cleaned = text.replace(/\([^)]*\)/g, '');
    
    // 느낌표와 숫자 제거
    cleaned = cleaned.replace(/[!0-9]/g, '');
    
    // HTML 태그 제거
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // 연속된 공백을 하나로 치환
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // 앞뒤 공백 제거
    cleaned = cleaned.trim();
    
    return cleaned;
}

// 급식 타입 코드를 한글로 변환
function getMealType(mealCode) {
    const mealTypes = {
        '1': '조식',
        '2': '중식',
        '3': '석식'
    };
    return mealTypes[mealCode] || null;
}

// 메시지 표시
function showMessage(message, type) {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}-message`;
    messageElement.textContent = message;
    
    // 메시지를 적절한 위치에 삽입
    const settingsSection = document.querySelector('.settings-section .card');
    settingsSection.appendChild(messageElement);
    
    // 3초 후 메시지 자동 제거
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 3000);
}

// 날짜 포맷팅 (YYYY-MM-DD → YYYY년 MM월 DD일)
function formatDisplayDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${year}년 ${month}월 ${day}일`;
}

// 유틸리티 함수: 날짜 포맷팅
function formatDate(dateString) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${year}년 ${month}월 ${day}일`;
}

// 유틸리티 함수: 메뉴 정리
function cleanMenu(menuString) {
    if (!menuString) return '메뉴 정보 없음';
    
    // 알레르기 정보 제거
    let cleaned = menuString.replace(/\([^)]*\)/g, '').trim();
    
    // HTML 태그 제거
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    return cleaned;
} 