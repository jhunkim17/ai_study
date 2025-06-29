// 투두리스트 애플리케이션
class TodoApp {
    constructor() {
        this.todos = [];
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.editingTodoId = null;
        
        this.init();
    }

    init() {
        this.loadTodos();
        this.setupEventListeners();
        this.renderTodoList();
        this.renderCalendar();
        this.setDefaultDate();
    }

    // 한국 시간 기준으로 오늘 날짜를 YYYY-MM-DD 형식으로 반환
    getTodayDate() {
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
        return koreaTime.toISOString().split('T')[0];
    }

    // 한국 시간 기준으로 날짜를 YYYY-MM-DD 형식으로 변환
    formatDateToYYYYMMDD(date) {
        const koreaTime = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
        return koreaTime.toISOString().split('T')[0];
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 할 일 추가
        document.getElementById('addTodoBtn').addEventListener('click', () => this.addTodo());
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // 뷰 전환
        document.getElementById('listViewBtn').addEventListener('click', () => this.switchView('list'));
        document.getElementById('calendarViewBtn').addEventListener('click', () => this.switchView('calendar'));

        // 달력 네비게이션
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));

        // 모달 이벤트
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('saveEditBtn').addEventListener('click', () => this.saveEdit());
        document.getElementById('cancelEditBtn').addEventListener('click', () => this.closeModal());
        
        // 모달 외부 클릭 시 닫기
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('editModal')) {
                this.closeModal();
            }
        });
    }

    // 기본 날짜 설정 (오늘 날짜)
    setDefaultDate() {
        const today = this.getTodayDate();
        document.getElementById('todoDate').value = today;
    }

    // 할 일 추가
    addTodo() {
        const input = document.getElementById('todoInput');
        const dateInput = document.getElementById('todoDate');
        
        const text = input.value.trim();
        const date = dateInput.value;

        if (!text) {
            alert('할 일을 입력해주세요!');
            return;
        }

        if (!date) {
            alert('날짜를 선택해주세요!');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            date: date,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.push(todo);
        this.saveTodos();
        this.renderTodoList();
        this.renderCalendar();

        input.value = '';
        input.focus();
    }

    // 할 일 삭제
    deleteTodo(id) {
        if (confirm('정말로 이 할 일을 삭제하시겠습니까?')) {
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.saveTodos();
            this.renderTodoList();
            this.renderCalendar();
        }
    }

    // 할 일 완료/미완료 토글
    toggleTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodoList();
            this.renderCalendar();
        }
    }

    // 할 일 수정 모달 열기
    editTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            this.editingTodoId = id;
            document.getElementById('editTodoInput').value = todo.text;
            document.getElementById('editTodoDate').value = todo.date;
            document.getElementById('editModal').style.display = 'block';
        }
    }

    // 할 일 수정 저장
    saveEdit() {
        const text = document.getElementById('editTodoInput').value.trim();
        const date = document.getElementById('editTodoDate').value;

        if (!text) {
            alert('할 일을 입력해주세요!');
            return;
        }

        if (!date) {
            alert('날짜를 선택해주세요!');
            return;
        }

        const todo = this.todos.find(todo => todo.id === this.editingTodoId);
        if (todo) {
            todo.text = text;
            todo.date = date;
            this.saveTodos();
            this.renderTodoList();
            this.renderCalendar();
        }

        this.closeModal();
    }

    // 모달 닫기
    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editingTodoId = null;
    }

    // 뷰 전환
    switchView(view) {
        const listView = document.getElementById('listView');
        const calendarView = document.getElementById('calendarView');
        const listBtn = document.getElementById('listViewBtn');
        const calendarBtn = document.getElementById('calendarViewBtn');

        if (view === 'list') {
            listView.classList.add('active');
            calendarView.classList.remove('active');
            listBtn.classList.add('active');
            calendarBtn.classList.remove('active');
        } else {
            calendarView.classList.add('active');
            listView.classList.remove('active');
            calendarBtn.classList.add('active');
            listBtn.classList.remove('active');
        }
    }

    // 달력 월 변경
    changeMonth(delta) {
        this.currentMonth += delta;
        
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        
        this.renderCalendar();
    }

    // 할 일 목록 렌더링
    renderTodoList() {
        const todoList = document.getElementById('todoList');
        
        if (this.todos.length === 0) {
            todoList.innerHTML = '<p style="text-align: center; color: #636e72; font-style: italic;">할 일이 없습니다. 새로운 할 일을 추가해보세요!</p>';
            return;
        }

        // 날짜별로 정렬
        const sortedTodos = [...this.todos].sort((a, b) => {
            if (a.date === b.date) {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
            return a.date.localeCompare(b.date);
        });

        todoList.innerHTML = sortedTodos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-date">${this.formatDate(todo.date)}</div>
                </div>
                <div class="todo-actions">
                    <button class="complete-btn" onclick="todoApp.toggleTodo(${todo.id})" title="${todo.completed ? '완료 취소' : '완료'}">
                        ${todo.completed ? '↩️' : '✅'}
                    </button>
                    <button class="edit-btn" onclick="todoApp.editTodo(${todo.id})" title="수정">
                        ✏️
                    </button>
                    <button class="delete-btn" onclick="todoApp.deleteTodo(${todo.id})" title="삭제">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 달력 렌더링
    renderCalendar() {
        const calendarDays = document.getElementById('calendarDays');
        const currentMonthElement = document.getElementById('currentMonth');
        
        // 현재 월 표시
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', 
                           '7월', '8월', '9월', '10월', '11월', '12월'];
        currentMonthElement.textContent = `${this.currentYear}년 ${monthNames[this.currentMonth]}`;

        // 달력 생성
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let calendarHTML = '';
        const today = this.getTodayDate();

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dateString = this.formatDateToYYYYMMDD(currentDate);
            const dayNumber = currentDate.getDate();
            const isOtherMonth = currentDate.getMonth() !== this.currentMonth;
            const isToday = dateString === today;
            
            // 해당 날짜의 할 일들 가져오기
            const dayTodos = this.todos.filter(todo => todo.date === dateString);
            
            calendarHTML += `
                <div class="calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" 
                     data-date="${dateString}">
                    <div class="calendar-day-number">${dayNumber}</div>
                    <div class="calendar-day-todos">
                        ${dayTodos.map(todo => `
                            <div class="calendar-day-todo ${todo.completed ? 'completed' : ''}" title="${this.escapeHtml(todo.text)}">
                                <span>${this.escapeHtml(todo.text)}</span>
                                <button class="calendar-delete-btn" title="삭제" onclick="todoApp.deleteTodo(${todo.id})">×</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        calendarDays.innerHTML = calendarHTML;
    }

    // 날짜 포맷팅
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = this.getTodayDate();
        
        // 내일 날짜 계산 (한국 시간 기준)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = this.formatDateToYYYYMMDD(tomorrow);
        
        if (dateString === today) {
            return '오늘';
        } else if (dateString === tomorrowString) {
            return '내일';
        } else {
            return `${date.getMonth() + 1}월 ${date.getDate()}일`;
        }
    }

    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 로컬스토리지에 저장
    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    // 로컬스토리지에서 로드
    loadTodos() {
        const saved = localStorage.getItem('todos');
        if (saved) {
            this.todos = JSON.parse(saved);
        }
    }
}

// 애플리케이션 초기화
let todoApp;
document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoApp();
}); 