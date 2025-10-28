// music.js
import { musicList } from "./musicData.js";

let currentIndex = 0;
let audioEl;
let albumImgEl;
let titleEl;
let artistEl;
let progressBar;
let progressFill;
let playerContainer;
let userInteracted = false;

document.addEventListener("DOMContentLoaded", () => {
  audioEl = document.querySelector(".audio");
  albumImgEl = document.querySelector(".album-art img");
  titleEl = document.querySelector(".track-title");
  artistEl = document.querySelector(".track-artist");
  progressBar = document.querySelector(".progress-bar");
  progressFill = document.querySelector(".progress-fill");
  playerContainer = document.querySelector(".music-player-modern");

  // 안전 체크: 요소들이 모두 존재하는지
  if (!audioEl || !albumImgEl || !titleEl || !artistEl || !progressBar || !progressFill || !playerContainer) {
    console.error("뮤직플레이어 초기화 실패 — DOM 요소가 없습니다.", {
      audioEl, albumImgEl, titleEl, artistEl, progressBar, progressFill, playerContainer
    });
    return;
  }

  setupMusicPlayer();
  setupUserInteractionGuard();
});



function onTrackEnded() {
  // 다음곡 (루프)
  nextTrack();
}

function loadTrack(i) {
  const track = musicList[i];
  if (!track) {
    console.warn("트랙 인덱스가 유효하지 않음:", i);
    return;
  }

  currentIndex = i;
  audioEl.src = track.audio;
  albumImgEl.src = track.albumArt;
  titleEl.innerText = track.title;
  artistEl.innerText = track.artist;

  // 이미지 로드 후 dominant color 시도 (안전하게)
  albumImgEl.onload = () => {
    try {
      extractDominantColor();
    } catch (err) {
      console.warn("Dominant color 추출 실패:", err);
      // 폴백 배경
      playerContainer.style.background = "";
    }
  };

  // 재생 시도 (autoplay 정책 때문에 실패할 수 있음)
  attemptPlay();
}

async function attemptPlay() {
  // 이미 유저 인터랙션이 있거나 muted이면 시도
  if (!userInteracted && !audioEl.muted) {
    // 유저 인터랙션 전이면 시도하지 않음 — 대신 재생 버튼 UI를 남겨라.
    console.log("유저 인터랙션 전이라 자동 재생을 하지 않습니다.");
    return;
  }

  try {
    await audioEl.play();
  } catch (err) {
    console.warn("play() 실패:", err);
    // UI에 재생 버튼 보여주거나 유저에게 클릭을 유도하자.
  }
}

// ▶ Play (외부에서 호출하는 함수)
export function audioPlay() {
  // 클릭 한 번으로만 등록해서 중복 방지
  if (!userInteracted) {
    userInteracted = true;
  }
  audioEl.play().catch(err => console.warn("audioPlay 에러:", err));
}

// ⏸ Pause
export function audioPause() {
  audioEl.pause();
}

// ⏭ 다음곡
export function nextTrack() {
  userInteracted = true;
  currentIndex = (currentIndex + 1) % musicList.length;
  loadTrack(currentIndex);
  // 자동 재생 시도
  attemptPlay();
}

// ⏮ 이전곡
export function prevTrack() {
  userInteracted = true;
  currentIndex = (currentIndex - 1 + musicList.length) % musicList.length;
  loadTrack(currentIndex);
  attemptPlay();
}

// 진행바 업데이트
function updateProgressBar() {
  if (!audioEl.duration) return;
  const percent = (audioEl.currentTime / audioEl.duration) * 100;
  progressFill.style.width = `${percent}%`;
}

// Dominant Color 추출 (안전하게)
function extractDominantColor() {
  // crossOrigin 문제 회피: 같은 도메인에서 제공하는 이미지일 때만
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 1;
  canvas.height = 1;
  // drawImage가 실패하면 예외가 발생할 수 있음 (cross-origin)
  ctx.drawImage(albumImgEl, 0, 0, 1, 1);

  const data = ctx.getImageData(0, 0, 1, 1).data;
  const r = data[0], g = data[1], b = data[2];

  playerContainer.style.background = `linear-gradient(to bottom right, rgba(${r},${g},${b},0.8), #111)`;
}

// 페이지 전체에서 최초 상호작용을 잡아서 autoplay 트리거 가능하게
function setupUserInteractionGuard() {
  const onFirstInteraction = () => {
    userInteracted = true;
    // 만약 로드된 트랙이 자동 재생 대기 상태였다면 시도
    attemptPlay();
    // 한 번만 실행
    document.removeEventListener("click", onFirstInteraction);
    document.removeEventListener("keydown", onFirstInteraction);
    document.removeEventListener("touchstart", onFirstInteraction);
  };

  document.addEventListener("click", onFirstInteraction);
  document.addEventListener("keydown", onFirstInteraction);
  document.addEventListener("touchstart", onFirstInteraction);
}


export function setupMusicPlayer() {
  // 이벤트 등록은 audioEl이 존재한 이후
  audioEl.addEventListener("ended", onTrackEnded);
  audioEl.addEventListener("timeupdate", updateProgressBar);

  // progress bar 클릭으로 이동 (선택)
  progressBar.addEventListener("click", (e) => {
    if (!audioEl.duration) return;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    audioEl.currentTime = pct * audioEl.duration;
  });

  loadTrack(currentIndex);
  return {
    nextTrack,
    prevTrack,
    audioPlay,
    audioPause,
    audioEl
  };
}