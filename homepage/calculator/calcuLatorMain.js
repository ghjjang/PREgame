function add(char){
var display = document.getElementById('result');
    // 버튼을 누르면 숫자가 나타날 input태그를 가진 id 불러오기.(**result 인풋박스에 숫자 보이게 변경)
display.value = display.value + char; // result 인풋박스의 value값은, 각 버튼을 onclick시 추가되는 값을 가진다.
}

// display에 저장된 값을 계산한다.
function caculate(){
document.getElementById('display').value = document.getElementById('result').value + ' ='; // (** '=' 버튼 클릭시 result 인풋박스에 있던 값이 display 인풋박스로 전환되도록 변경)
var display = document.getElementById('result'); // 계산식에 사용할 값을 지닌 input 태그를 가진 id 불러오기.
var result = eval(display.value);// 식을 계산하고 result 변수에 display에 나타난값 저장
document.getElementById('result').value = result; //위에서 저장한 값을 result 인풋박스의 value값으로 연결.
}

// 인풋박스에 출력된 값을 초기화한다.
function reset(){
document.getElementById('display').value = ''; // display의 값을 ''으로 저장한다.
document.getElementById('result').value = ''; // display의 값을 ''으로 저장한다.
}


//히스토리: bottomSheet에 추가
//bottomSheet에 추가
function toggleSheet() {
    var bottomSheet = document.getElementById('bottomSheet');

    // overlay 확장/축소
    if (bottomSheet.classList.contains('expanded')) {
        bottomSheet.classList.remove('expanded');
    } else {
        bottomSheet.classList.add('expanded');

       
    }
}
// history 추가
function addHistory() {
    var result = document.getElementById('result').value;
    var display = document.getElementById('display').value;
    var historyList = document.getElementById('historyList');

    // 히스토리 항목 생성
    var historyItem = document.createElement('p');
    historyItem.textContent = display + ' ' + result;

    // 히스토리 목록에 추가
    historyList.appendChild(historyItem);

    // 히스토리 목록에 추가한 내용을 bottomSheet에 표시
    var bottomSheetContent = document.getElementById('bottomSheetContent');
    var sheetItem = document.createElement('p');
    sheetItem.textContent = display + ' ' + result;
    bottomSheetContent.appendChild(sheetItem);  
    
}

    
    






window.addEventListener('DOMContentLoaded', function() {
    document.body.style.backgroundColor = getColor();
});



// 로고 클릭 이벤트 처리
const homeButton = document.querySelector('#logo');

    homeButton.addEventListener('click', () => {
        window.close(); // 현재 탭 닫기
    });
