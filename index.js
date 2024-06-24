function gradeReport() {
    let score = document.getElementById("scoreInput").value;
    let grade = '';

    if (score === '') {
        grade = '점수를 입력해주세요.';
    } else {
        score = Number(score);
        if (90 <= score && score <= 100) {
            grade = 'A';
        } else if (80 <= score && score <= 89) {
            grade = 'B';
        } else if (70 <= score && score <= 79) {
            grade = 'C';
        } else if (60 <= score && score <= 69) {
            grade = 'D';
        } else if (0 <= score && score <= 59) {
            grade = 'F';
        } else {
            grade = '유효한 점수를 입력해주세요.';
        }
    }

    document.getElementById("result").innerText = '등급: ' + grade;
}
