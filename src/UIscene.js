// src/UIscene.js
import { GameEvents } from './events.js';
import { LanguageData } from './translate.js';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        const gameScene = this.scene.get('GameScene');

        // --------------------------------------------------
        // 1. 일시정지 UI 버튼 (우상단)
        // --------------------------------------------------
        const pauseBtn = this.add.text(this.scale.width - 20, 20, '⏸️ PAUSE', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 6 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        pauseBtn.on('pointerdown', () => {
            // GameScene의 pauseGame 메서드 직접 호출 또는 이벤트 발송
            gameScene.pauseGame();
        });

        // --------------------------------------------------
        // 2. 일시정지 팝업 메뉴 컨테이너 (초기에는 숨김)
        // --------------------------------------------------
        this.make_pauseManuContainer();

        // --------------------------------------------------
        // 3. GameScene 이벤트 수신
        // --------------------------------------------------
        gameScene.events.on(GameEvents.TOGGLE_PAUSE, (isPaused) => {
            this.pauseMenuContainer.setVisible(isPaused);
        }, this);

        this.make_turnEndButton();

        this.make_portraitContainer();
    }

    make_portraitContainer() {
        this.portraitContainer = this.add.container(20, this.scale.height-20);
        

        // 배경 사각형
        const bgRect = this.add.rectangle(0, 0, 400, 180, 0x222222, 0.8)
            .setOrigin(0,1)
            .setStrokeStyle(2, 0xffffff);

        // 배경 이미지 (예: 군함 초상화)
        const portraitImage = this.add.image(10, -10, 'p_iowa')
            .setDisplaySize(120, 160)
            .setOrigin(0,1);

        const nameText = this.add.text(140, -160, '군함 이름', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0, 0);

        const infoText = this.add.text(140, -120, 'H:12, C:16, T1:3, T2:3, T3:3', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0, 0);



        this.portraitContainer.setVisible(false);
        this.portraitContainer.data ={
            image: portraitImage,
            bg: bgRect,
            nameText: nameText,
            infoText: infoText
        }
        // 컨테이너에 요소 추가
        this.portraitContainer.add([bgRect, portraitImage, nameText, infoText]);
    }
    set_portraitVisible(isVisible , shipData = null) {
        this.portraitContainer.setVisible(isVisible);
        //console.log('shipData:', shipData);
        if (shipData) {
            const data = this.portraitContainer.data;
            data.image.setTexture(`p_${shipData.name}`);
            data.nameText.setText(`${this.capitalizeFirstLetter(shipData.name)} class ${this.capitalizeFirstLetter(shipData.type)}`);
            data.infoText.setText(`Rotation: ${shipData.rotation}, \nH: ${shipData.H}, C: ${shipData.C}, \nTurrets: ${shipData.T1} ${shipData.T2} ${shipData.T3||''} ${shipData.T4||''}`);
        }
    }
    capitalizeFirstLetter(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(); // 나머지를 소문자로 만들고 싶을 때
        // 또는 원래 나머지 유지: return str.charAt(0).toUpperCase() + str.slice(1);
    }

    make_turnEndButton(){
        const turnEndBtn = this.add.text(this.scale.width - 40, this.scale.height - 50, LanguageData.getText('turn_end'), {
            fontSize: '28px',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 12, y: 12 }
        }).setOrigin(1, 1).setInteractive({ useHandCursor: true });

        turnEndBtn.on('pointerdown', () => {
            // GameScene의 turnEnd 메서드 직접 호출 또는 이벤트 발송
            const gameScene = this.scene.get('GameScene');
            gameScene.turnEnd();
        });
    }

    make_pauseManuContainer() {
            this.pauseMenuContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);
        this.pauseMenuContainer.setVisible(false);

        // 어두운 반투명 배경 레이어 (화면 전체 덮기)
        const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
            .setInteractive(); // 뒤쪽 인게임 클릭 차단

        // 팝업 박스
        const menuBg = this.add.rectangle(0, 0, 320, 240, 0x222222, 0.95)
            .setStrokeStyle(2, 0xffffff);

        const titleText = this.add.text(0, -80, LanguageData.getText('paused'), {
            fontSize: '28px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // 계속하기 (Resume) 버튼
        const resumeBtn = this.add.text(0, -10, LanguageData.getText('resume'), {
            fontSize: '20px',
            fill: '#00ff00'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        resumeBtn.on('pointerdown', () => {
            // UIScene -> GameScene으로 재개 이벤트 발송
            this.events.emit(GameEvents.GAME_RESUMED);
        });

        // 메인 메뉴로 이동 버튼
        const mainBtn = this.add.text(0, 40, LanguageData.getText('main_menu'), {
            fontSize: '20px',
            fill: '#ff4444'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        mainBtn.on('pointerdown', () => {
            // GameScene과 UIScene을 모두 멈추고 MainMenuScene으로 이동
            this.scene.stop('UIScene');
            this.scene.stop('GameScene');
            this.scene.start('MainMenuScene');
        });

        // 컨테이너에 요소 추가
        this.pauseMenuContainer.add([overlay, menuBg, titleText, resumeBtn, mainBtn]);

        // 화면 크기 변경 시 팝업 위치 재조정
        this.scale.on('resize', (gameSize) => {
            this.pauseMenuContainer.setPosition(gameSize.width / 2, gameSize.height / 2);
            overlay.setSize(gameSize.width, gameSize.height);
        });
    }
    renderDice(){
        // 주사위 렌더링 로직
        // 예: 주사위 이미지 생성 및 위치 설정
        const position =  { x: this.scale.width / 2 + Phaser.Math.Between(-20,20)*10, y: this.scale.height / 2 + Phaser.Math.Between(-20,20)*10 };
        const diceValue = Phaser.Math.Between(1, 6); // 1~6 랜덤 값
        const diceImage = this.add.sprite(position.x, position.y, 'dice', `${diceValue-1}`)
            .setOrigin(0.5)
            .setScale(0.5);
        //console.log(`주사위 값: ${diceValue} `);
        
        // 주사위 애니메이션 (예: 잠시 후 사라지게)
        // 1.4초 후에 주사위 이미지 제거
        this.time.delayedCall(1400, () => {
            this.tweens.add({
                targets: diceImage,
                alpha: { from: 1, to: 0 },
                duration: 500,
                ease: 'Power2.Out',
                onComplete: () => {
                    diceImage.destroy();
                }
            }); 
        });
        
        return diceValue; // 주사위 값을 반환하여 다른 로직에서 활용 가능
    }
    
    ///
}