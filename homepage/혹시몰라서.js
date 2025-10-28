import { musicList } from 'homepage/musicData.js';








// 태어난 날짜 설정 (예: 2000년 1월 1일)
const birthDate = new Date('2004-10-18');

// 날짜 계산 함수
function updateDaysSinceBirth() {
    const today = new Date(); // 오늘 날짜
    const timeDifference = today - birthDate; // 밀리초 단위 차이
    const daysSinceBirth = Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // 일 단위로 변환

    // HTML에 결과 업데이트
    document.getElementById('days-since-birth').textContent = daysSinceBirth;
}

// 페이지 로드 시 함수 실행
updateDaysSinceBirth();

function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    // 등장 애니메이션
    setTimeout(() => toast.classList.add('show'), 10);

    // 자동 제거
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // transition 후 제거
    }, duration);
}
let isShowingDaysSinceStart = false; // 현재 D+ 상태인지 여부



// 요소 선택
const section1 = document.querySelector('.section');
const letterL = document.querySelector('.section .hero h2 span:nth-child(1)');
const letterH1 = document.querySelector('.section .hero h2 span:nth-child(2)');
const letterH2 = document.querySelector('.section .hero h2 span:nth-child(3)');

let currentBackgroundColor = getComputedStyle(section1).backgroundColor;
const defaultBackground = currentBackgroundColor;

// 배경색 변경 함수
function changeBackground(color) {
    section1.style.backgroundColor = color;
    currentBackgroundColor = color;
    localStorage.setItem('section1BgColor', color);
    console.log('현재 배경색:', currentBackgroundColor);
}

// 글자에 따른 색상 반환 함수
function getColorByLetter(letter) {
    if (letter === letterL) return '#ffd1dc';
    if (letter === letterH1) return '#c1e1c1';
    if (letter === letterH2) return '#add8e6';
    return currentBackgroundColor;
}

// 이벤트 바인딩 함수
function bindLetterEvents(letters) {
    letters.forEach(letter => {
        // 더블클릭: 기본 배경색 복원
        letter.addEventListener('dblclick', () => changeBackground(defaultBackground));

        // 클릭: 배경색 변경
        letter.addEventListener('click', (event) => {
            const color = getColorByLetter(event.target);
            changeBackground(color);
        });

        // 호버: 배경색 잠시 덮어씌우기
        letter.addEventListener('mouseenter', (event) => {
            section1.style.backgroundColor = getColorByLetter(event.target);
        });
        letter.addEventListener('mouseleave', () => {
            section1.style.backgroundColor = currentBackgroundColor;
        });
    });
}

// 한 번에 이벤트 바인딩
bindLetterEvents([letterL, letterH1, letterH2]);





/*섹션 나누기*/
// 섹션 나누기 및 스크롤 이벤트 처리
const sections = document.querySelectorAll('.section');
let currentSection = 0;
let isScrolling = false;

// 섹션 스크롤 함수
function scrollToSection(index) {
  if (index >= 0 && index < sections.length) {
    isScrolling = true;
    sections[index].scrollIntoView({ behavior: 'smooth' });
    currentSection = index;
    setTimeout(() => isScrolling = false, 800);
  }
}

// 마우스 휠 이벤트
window.addEventListener('wheel', (e) => {
  if (isScrolling) return;
  if (e.deltaY > 0) {
    scrollToSection(currentSection + 1);
  } else if (e.deltaY < 0) {
    scrollToSection(currentSection - 1);
  }
});

// 키보드 방향키 이벤트
window.addEventListener('keydown', (e) => {
  if (isScrolling) return;
  if (e.key === 'ArrowDown') {
    scrollToSection(currentSection + 1);
  } else if (e.key === 'ArrowUp') {
    scrollToSection(currentSection - 1);
  }
});

// 스크롤 상단(첫 섹션)으로 이동 함수
function scrollToTop() {
  scrollToSection(0);
}



// 날짜 설정
const dischargeDate = new Date('2025-12-23T00:00:00');
const alertDays = [59, 50, 40, 30, 20, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const alertStatus = {};
alertDays.forEach(day => alertStatus[day] = false);

let daysLeft; // 전역 변수
let timer;

// 토스트 알림 함수
function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// 단계별 알림 함수
function checkAlertDays(days) {
    if (alertDays.includes(days) && !alertStatus[days]) {
        showToast(`전역까지 ${days}일 남았습니다!`);
        alertStatus[days] = true; // 한 번만 알림
    }
}

// 타이머 업데이트
function updateTimeUntilDischarge() {
    const now = new Date();
    const timeDifference = dischargeDate - now;
    daysLeft = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    if (timeDifference <= 0) {
        document.getElementById('time-until-discharge').textContent = 'D-day!!!';
        stopTimer();
        return;
    }

    checkAlertDays(daysLeft);

    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

    document.getElementById('time-until-discharge').textContent =
        `${daysLeft} 일 ${hours} 시간 ${minutes} 분 ${seconds} 초`;
}

// 타이머 시작/중지
function startTimer() {
    if (timer) return;
    timer = setInterval(updateTimeUntilDischarge, 1000);
}

function stopTimer() {
    clearInterval(timer);
    timer = null;
}

// 홈 버튼 클릭 처리 (싱글/더블 클릭)
function handleHomeButtonClick() {
    const homeButton = document.querySelector('.HOME');
    if (!homeButton) return;

    const EVENT_DOUBLE_CLICK_DELAY = 250;
    let clickPending = 0;

    homeButton.addEventListener('click', () => {
        const now = new Date();
        const timeDifference = dischargeDate - now;
        const currentDaysLeft = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

        if (clickPending !== 0) {
            // 더블 클릭 처리
            clearTimeout(clickPending);
            clickPending = 0;
            console.log("더블 클릭!");
            // 홈 버튼 클릭 시 알림 상태 초기화 후 재확인
                if (alertDays.includes(currentDaysLeft)) {
                    alertStatus[currentDaysLeft] = false; // 다시 알림 가능
                }

                checkAlertDays(currentDaysLeft);
        } else {
            // 싱글 클릭 처리
            clickPending = setTimeout(() => {
                clickPending = 0;
                scrollToTop();

                console.log("싱글 클릭!");
            }, EVENT_DOUBLE_CLICK_DELAY);
        }
    });
}

// 상단 스크롤 함수
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 초기 실행
document.addEventListener('DOMContentLoaded', () => {
    handleHomeButtonClick();
    startTimer();
});

// 페이지 로드 시 타이머 시작
startTimer();





// 슬라이더 기능
const slides = document.querySelectorAll(".slide");
const slider = document.querySelector(".slider");
const nextBtn = document.querySelector(".next");
const prevBtn = document.querySelector(".prev");

let current = 0;

function updateSlide() {
    slides.forEach((slide, i) => {
        if (i === current) {
            slide.style.display = "block";      // 현재 슬라이드만 보이게
            slide.classList.add("active");
        } else {
            slide.style.display = "none";       // 나머지 슬라이드 숨김
            slide.classList.remove("active");
        }
    });
}
nextBtn.addEventListener("click", () => {
    current = (current + 1) % slides.length;
    updateSlide();
});

prevBtn.addEventListener("click", () => {
    current = (current - 1 + slides.length) % slides.length;
    updateSlide();
});

// 드래그로 슬라이드 이동
let startX = 0;
let endX = 0;

slider.addEventListener("mousedown", (e) => startX = e.clientX);
slider.addEventListener("mouseup", (e) => {
    endX = e.clientX;
    if (startX - endX > 50) nextBtn.click();
    else if (endX - startX > 50) prevBtn.click();
});

updateSlide();

// footer 클릭 시 계산 및 토글 함수
const footer = document.querySelector('footer');
const timeUntilDischargeElement = document.getElementById('time-until-discharge');

footer.addEventListener('click', () => {
    if (!isShowingDaysSinceStart) {
        const startDate = new Date(2024, 5, 24); // 시작 날짜
        const now = new Date(); // 현재 날짜
        const timeDifference = now - startDate; // 밀리초 단위 차이
        const daysSinceStart = Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // 일 단위로 변환

        // 메시지 업데이트
        timeUntilDischargeElement.textContent = `D + ${daysSinceStart}`;
        isShowingDaysSinceStart = true; // 상태 변경
        stopTimer(); // 타이머 중지
    } else {
        // 원래 남은 일수로 복원
        isShowingDaysSinceStart = false; // 상태 변경
        updateTimeUntilDischarge(); // 남은 시간 업데이트 함수 호출
        startTimer(); // 타이머 재시작
    }
});


// 🎧 플레이어 관련 요소
const player = document.querySelector(".music-player-modern");
const albumArtEl = player.querySelector(".album-art img");
const titleEl = player.querySelector(".track-title");
const artistEl = player.querySelector(".track-artist");
const audioEl = player.querySelector(".audio");

// 🎶 상태 변수
let currentTrack = 0;

// 🧭 트랙 로드 함수
function loadTrack(index) {
  const track = musicList[index];
  titleEl.textContent = track.title;
  artistEl.textContent = track.artist;
  albumArtEl.src = track.albumArt;
  audioEl.src = track.audio;
}

// ▶️ 재생/일시정지
function playPause() {
  if (audioEl.paused) {
    audioEl.play();
  } else {
    audioEl.pause();
  }
}

// ⏭ 다음 곡
function nextTrack() {
  currentTrack = (currentTrack + 1) % musicList.length;
  loadTrack(currentTrack);
  audioEl.play();
}

// ⏮ 이전 곡
function prevTrack() {
  currentTrack = (currentTrack - 1 + musicList.length) % musicList.length;
  loadTrack(currentTrack);
  audioEl.play();
}

// 🏁 첫 트랙 로드
loadTrack(currentTrack);

// 🎵 제목이 길면 자동 스크롤
document.querySelectorAll(".track-title").forEach(title => {
  if (title.scrollWidth > title.clientWidth) {
    title.classList.add("overflow");
    title.setAttribute("data-title", title.textContent);
  }
});