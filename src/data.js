// src/data.js
export const GameData = {
    saveData: {
        
    },

    save() {
        localStorage.setItem('projectBattleship', JSON.stringify(this.saveData));
        console.log('게임 데이터 저장 완료');
    },

    load() {
        const data = localStorage.getItem('projectBattleship');
        if (data) {
            this.saveData = JSON.parse(data);
            console.log('게임 데이터 불러오기 완료');
        }else{
            console.log('저장된 게임 데이터가 없습니다. 기본값 사용');
        }
    }
};