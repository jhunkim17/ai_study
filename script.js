// 나이스 API 키 (하드코딩)
const API_KEY = '2a740c867dd448ba9496d2c88f525e61';

// 교육청 이름을 코드로 변환하는 매핑
const OFFICE_CODE_MAP = {
    '강원특별자치도교육청': 'K10',
    '서울특별시교육청': 'B10',
    '부산광역시교육청': 'C10',
    '대구광역시교육청': 'D10',
    '인천광역시교육청': 'E10',
    '광주광역시교육청': 'F10',
    '대전광역시교육청': 'G10',
    '울산광역시교육청': 'H10',
    '세종특별자치시교육청': 'I10',
    '경기도교육청': 'J10',
    '충청북도교육청': 'K10',
    '충청남도교육청': 'M10',
    '전라북도교육청': 'N10',
    '전라남도교육청': 'O10',
    '경상북도교육청': 'P10',
    '경상남도교육청': 'Q10',
    '제주특별자치도교육청': 'R10'
};

// DOM 요소들
const officeCodeInput = document.getElementById('officeCode');
const schoolCodeInput = document.getElementById('schoolCode');
const mealDateInput = document.getElementById('mealDate');
const searchMealBtn = document.getElementById('searchMeal');
const todayMealBtn = document.getElementById('todayMeal');
const loadingElement = document.getElementById('loading');
const mealContentElement = document.getElementById('mealContent');

// 로컬스토리지 키
const STORAGE_KEYS = {
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
    const savedOfficeCode = localStorage.getItem(STORAGE_KEYS.OFFICE_CODE);
    const savedSchoolCode = localStorage.getItem(STORAGE_KEYS.SCHOOL_CODE);
    
    if (savedOfficeCode) {
        officeCodeInput.value = savedOfficeCode;
    }
    
    if (savedSchoolCode) {
        schoolCodeInput.value = savedSchoolCode;
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    searchMealBtn.addEventListener('click', searchMeal);
    todayMealBtn.addEventListener('click', searchTodayMeal);
    
    // Enter 키로도 검색 가능하도록
    schoolCodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMeal();
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

    // 교육청 자동완성
    const officeCodeList = document.getElementById('officeCodeList');
    officeCodeInput.addEventListener('input', function() {
        const value = officeCodeInput.value.trim();
        if (value.length >= 1) {
            officeCodeList.innerHTML = Object.keys(OFFICE_CODE_MAP)
                .filter(name => name.includes(value))
                .map(name => `<option value="${name}">`)
                .join('');
        }
    });

    // 학교 자동완성
    const schoolCodeList = document.getElementById('schoolCodeList');
    schoolCodeInput.addEventListener('input', async function() {
        const officeName = officeCodeInput.value.trim();
        const officeCode = getOfficeCode(officeName);
        const value = schoolCodeInput.value.trim();
        if (officeCode && value.length >= 2) {
            const apiUrl = `https://open.neis.go.kr/hub/schoolInfo`;
            const params = new URLSearchParams({
                KEY: API_KEY,
                Type: 'json',
                ATPT_OFCDC_SC_CODE: officeCode,
                SCHUL_NM: value
            });
            try {
                const response = await fetch(`${apiUrl}?${params}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.schoolInfo && data.schoolInfo[1] && data.schoolInfo[1].row) {
                        schoolCodeList.innerHTML = data.schoolInfo[1].row
                            .map(s => `<option value="${s.SCHUL_NM}">`)
                            .join('');
                    }
                }
            } catch (e) {
                // 무시
            }
        }
    });
}

// 오늘 급식 조회
function searchTodayMeal() {
    setDefaultDate();
    searchMeal();
}

// 급식 정보 검색
async function searchMeal() {
    const officeName = officeCodeInput.value.trim();
    const schoolName = schoolCodeInput.value.trim();
    const mealDate = mealDateInput.value;
    
    if (!officeName) {
        showMessage('교육청을 입력해주세요.', 'error');
        return;
    }
    
    // 교육청 이름을 코드로 변환
    const officeCode = getOfficeCode(officeName);
    if (!officeCode) {
        showMessage('올바른 교육청 이름을 입력해주세요. (예: 강원특별자치도교육청, 서울특별시교육청)', 'error');
        return;
    }
    
    if (!schoolName) {
        showMessage('학교를 입력해주세요.', 'error');
        return;
    }
    
    if (!mealDate) {
        showMessage('조회 날짜를 선택해주세요.', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // 학교 이름을 코드로 변환
        let schoolCode = schoolName;
        
        // 입력된 값이 이미 숫자 코드인지 확인
        if (!/^\d+$/.test(schoolName)) {
            // 학교 이름으로 검색
            schoolCode = await searchSchoolCode(schoolName, officeCode);
            if (!schoolCode) {
                showMessage(`'${schoolName}' 학교를 찾을 수 없습니다. 학교 이름을 확인해주세요.`, 'error');
                showLoading(false);
                return;
            }
        }
        
        // 선택된 날짜를 YYYYMMDD 형식으로 변환
        const selectedDate = new Date(mealDate);
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        
        // 나이스 교육정보 개방 포털 API URL
        const apiUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo`;
        
        const params = new URLSearchParams({
            KEY: API_KEY,
            Type: 'json',
            ATPT_OFCDC_SC_CODE: officeCode, // 변환된 교육청 코드
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
            showMessage('급식 정보를 불러올 수 없습니다. 교육청, 학교를 확인해주세요.', 'error');
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

// 교육청 이름을 코드로 변환하는 함수
function getOfficeCode(officeName) {
    // 입력된 값이 이미 코드인 경우 (K10, B10 등)
    if (officeName.length <= 3 && /^[A-Z]\d{2}$/.test(officeName)) {
        return officeName;
    }
    
    // 교육청 이름을 코드로 변환
    return OFFICE_CODE_MAP[officeName] || null;
}

// 학교 이름으로 학교 코드를 검색하는 함수
async function searchSchoolCode(schoolName, officeCode) {
    try {
        const apiUrl = `https://open.neis.go.kr/hub/schoolInfo`;
        const params = new URLSearchParams({
            KEY: API_KEY,
            Type: 'json',
            ATPT_OFCDC_SC_CODE: officeCode,
            SCHUL_NM: schoolName
        });
        
        const response = await fetch(`${apiUrl}?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.RESULT && data.RESULT.CODE === 'INFO-200') {
            return null; // 학교를 찾을 수 없음
        } else if (data.schoolInfo && data.schoolInfo[1] && data.schoolInfo[1].row) {
            const schools = data.schoolInfo[1].row;
            // 첫 번째 학교의 코드를 반환
            return schools[0].SD_SCHUL_CODE;
        }
        
        return null;
    } catch (error) {
        console.error('Error searching school:', error);
        return null;
    }
} 