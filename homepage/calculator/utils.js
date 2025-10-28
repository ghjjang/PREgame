function getColor() {
    // localStorage에 저장된 값이 있으면 반환, 없으면 기본값 반환
    return localStorage.getItem('section1BgColor') || '#222';
}