
# Study

https://devsnap.me/ 만들어져있는 라이브러리 가져오는곳
https://thuvien.org/navnav
https://codingapple.com/unit/jquery-library-tutorial/


로그인 창
https://uiverse.io/JohnnyCSilva/bad-cheetah-74











게임 라이브러리
https://gsap.com/resources/get-started/


  python -m http.server


디자인 편집 사이트 깃허브 연동가능
  https://manage.wix.com/account/websites?referralAdditionalInfo=Dashboard










  SQLite를 사용해 달력 일정을 로컬에 영구 저장하는 간단한 서버입니다.

  설치 방법

  1. 의존성 설치:

    npm install

  2. 서버 시작:

    npm start

  서버는 `homepage/` 디렉터리를 정적 파일로 제공하며, `/api/events`에 REST API를 노출합니다.

  엔드포인트

  - GET /api/events -> 이벤트 목록 반환
  - POST /api/events {title, start, end, color} -> 이벤트 생성
  - PUT /api/events/:id {title, start, end, color} -> 이벤트 수정
  - DELETE /api/events/:id -> 이벤트 삭제

  테스트(수동)

  1) 서버가 실행 중인지 확인

    npm start

  2) 새 이벤트 생성 (curl 예시)

  ```bash
  curl -sS -X POST -H "Content-Type: application/json" \
    -d '{"title":"테스트 일정","start":"2025-10-20","end":"2025-10-21","color":"#FFA07A"}' \
    http://localhost:4000/api/events
  ```

  3) 이벤트 목록 확인

  ```bash
  curl -sS http://localhost:4000/api/events
  ```

  4) (선택) 서버를 재시작한 뒤에도 동일한 이벤트가 남아있는지 확인하여 영속성을 검증합니다.

  ```bash
  # 실행 중인 서버 프로세스를 종료하고 재시작
  pkill -f "node server.js" || true
  npm start &

  curl -sS http://localhost:4000/api/events
  ```

  참고

  - 데이터베이스 파일은 `data/events.db`에 생성됩니다.
  - 개발 편의를 위해 기본적으로 CORS를 모든 출처에 허용합니다. 배포 시에는 origin을 제한하세요.
