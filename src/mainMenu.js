// src/mainMenu.js
import { LanguageData } from './translate.js';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        //배경 이미지 화면에 꽉 차게
        const mainImage = this.add.image(0, 0, 'main').setOrigin(0, 0);
        mainImage.displayWidth = this.scale.width;
        mainImage.displayHeight = this.scale.height;

        const titleText = this.add.text(400, 200, LanguageData.getText('game_title'), 
        { fontSize: '48px', fill: '#ffffff' , stroke: '#111111', strokeThickness: 4, padding: { x: 20, y: 10 }})
            .setOrigin(0.5);

        const startButton = this.add.text(300, height-200, LanguageData.getText('btn_start'),
    { fontSize: '32px', fill: '#ffffff' , stroke: '#111111', strokeThickness: 4, padding: { x: 20, y: 10 }})
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        //빌드
        const build ='build 20261104_0218'
        
        const buildText = this.add.text(10, height-10, build,{fontSize:'16px' , stroke: '#111111', strokeThickness: 4}).setOrigin(0,1);
    }
}