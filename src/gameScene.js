// src/gameScene.js
import { GameEvents } from './events.js';

import { HexTile, TERRAIN_TYPES, HEX_SIZE } from './HexTile.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        this.tileMap = new Map(); // (q, r) 키 기반 타일 인스턴스 저장소
    }

    create() {
        this.input.addPointer(2);

        // UI 씬 병렬 실행
        this.scene.run('UIScene');

        // ESC 키 등록
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        // --------------------------------------------------
        // Scene 라이프사이클 이벤트 및 커스텀 이벤트 처리
        // --------------------------------------------------

        // 1. UIScene에서 '재개' 요청을 보냈을 때 수신
        const uiScene = this.scene.get('UIScene');
        uiScene.events.on(GameEvents.GAME_RESUMED, this.resumeGame, this);

        // 2. GameScene 자체 일시정지 이벤트 콜백
        this.events.on('pause', () => {
            console.log('GameScene 일시 정지됨');
            // 물리 엔진 정지 (필요 시)
            this.physics.pause();
        });

        // 3. GameScene 자체 재개 이벤트 콜백
        this.events.on('resume', () => {
            console.log('GameScene 재개됨');
            // 물리 엔진 재개
            this.physics.resume();
        });
        // 씬 종료 시 이벤트 해제
        this.events.once('shutdown', () => {
            
            //uiScene.events.off(GameEvents.GAME_RESUMED, this.resumeGame, this);
            this.events.off(GameEvents.TOGGLE_PAUSE);
            this.tweens.killAll(); // 모든 트윈 제거
            this.events.off('pause');
            this.events.off('resume');
            this.events.off('tileClicked');
            this.input.off('pointermove');
        });


        this.playerTeam = 1; // 플레이어 팀 설정 (예: 1)
        this.selectedShip = null;
        this.selectedTile = null;

        //타일클릭 이벤트 수신받음
        this.events.on('tileClicked', (tile) => {

            //console.log(`(${tile.q}, ${tile.r}) | 지형: ${tile.terrain.name}`);
            this.mapGrid[tile.r][tile.q] = tile.terrain.id; // 클릭된 타일의 지형 ID를 맵 데이터에 반영
            
            //this.saveMapGrid(); // 타일 클릭 시마다 맵 데이터 저장
            this.clearAttackTile();
            
            let shipFound = false;
            this.ships.forEach(ship => {
                if (ship.q === tile.q && ship.r === tile.r) {
                    console.log(`군함 ${ship.name}이 (${tile.q}, ${tile.r}) 위치에 있습니다.`);
                    
                    
                    shipFound = true;
                    if(this.selectedTile  && this.selectedTile.q === tile.q && this.selectedTile.r === tile.r){
                        //console.log(`(${tile.q}, ${tile.r}) | 지형: ${tile.terrain.name} | 이미 선택된 타일입니다. 선택 해제합니다.`);
                        this.clearSelectedTile(); // 이전 선택된 타일 초기화
                        this.clearAttackTile();
                        uiScene.set_portraitVisible(false);
                        shipFound = false;
                        return; // 이미 선택된 타일이면 선택 해제 후 종료
                    }
                    if(shipFound){
                        this.clearSelectedTile(); // 이전 선택된 타일 초기화
                        this.selectedTile = tile; // 선택된 타일 저장
                        this.selectedShip = ship; // 선택된 군함 저장
                        this.drawTile(TERRAIN_TYPES.SELECTED, tile.q, tile.r); // 선택된 타일 표시
                        this.renderAttackTile();
                        uiScene.set_portraitVisible(true, ship ); // 클릭된 타일의 지형 이름을 UI에 전달

                        return; // 군함이 발견되면 더 이상 확인하지 않음        
                    }
                        
                    
                    
                }
            });
            if (!shipFound) {
                

            }
            
            if(this.selectedTile){
                //타일이 선택된 상태에서
                if (tile.q === this.selectedTile.q && tile.r === this.selectedTile.r) {
                    //console.log(`(${tile.q}, ${tile.r}) | 지형: ${tile.terrain.name} | 이미 선택된 타일입니다. 선택 해제합니다.`);
                    //this.clearSelectedTile(); // 이전 선택된 타일 초기화
                    return; // 이미 선택된 타일이면 선택 해제 후 종료
                }
                if(this.selectedShip && this.selectedShip.team === this.playerTeam){
                    //선택된 군함이 있는 상태에서
                    if(this.selectedShip.q === tile.q && this.selectedShip.r === tile.r){
                        //console.log(`(${tile.q}, ${tile.r}) | 지형: ${tile.terrain.name} | 이미 선택된 군함이 있는 타일입니다. 선택 해제 후 종료합니다.`);
                        this.selectedShip.attackTile = null; // 선택된 군함의 공격 타일 초기화
                        this.clearAttackTile();
                        return; // 이미 선택된 군함이 있는 타일이면 선택 해제 후 종료
                    }
                    //선택된 군함이 있는 상태에서 다른 타일 클릭 시 공격 타일로 지정
                    
                    this.selectedShip.attackTile = tile; // 선택된 군함의 공격 타일 저장
                    this.renderAttackTile();
                }
                
            }
        });

        //////////////////
        // 1. 2D 맵 지형 데이터 정의 (코드/JSON/랜덤 생성 가능)
        // 0: 초원, 1: 산, 2: 강, 3: 도로, 4: 건물
        
        

        
        this.mapGrid = [
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,2,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,2,2,2,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];

         //console.log('GameScene에서 불러온 게임 데이터:', GameData);

        // 2. 맵 데이터 바탕으로 인스턴스 배치
        this.generateHexMapFromGrid(this.mapGrid);

        // 3. 카메라 드래그 이동 설정
        this.setupCameraControls();

        //군함 로드
        this.ships = [];

        this.renderShip('iowa', 0, 1, 60 , 1);
        
        this.renderShip('iowa', 12, 1, 120, 2);
        
    }
    
    renderShip(name,q,r, rotation = 0, playerTeam=1){
        const pos = this.axialToPixel(q, r);
        const ship =this.add.image(pos.x, pos.y, name).setOrigin(0.5);
        ship.setScale(0.2); // 이미지 크기 조정
        ship.setDepth(1); // 타일 위에 표시되도록 깊이 설정
        ship.setRotation(Phaser.Math.DegToRad(rotation)); // 회전 각도 설정 (라디안 단위)

        this.ships.push({ name, q, r, rotation, sprite: ship, team: playerTeam, type: 'Battleship', H:10, D:15, C:16,  T1:3, T2:3, T3:3, SHS:true });
        console.log(`군함 ${name}이 (${q}, ${r}) 위치에 배치되었습니다.`);
    }


    // Axial 좌표 (q, r) -> 화면 픽셀 좌표 (x, y) 변환식
    axialToPixel(q, r) {
        const startX = 200; // 맵 시작 X 오프셋
        const startY = 150; // 맵 시작 Y 오프셋

        const x =startX+ HEX_SIZE * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        const y =startY+ HEX_SIZE * (3 / 2 * r);
        return { x, y };
    }
    clearHexMap(){
        // 기존 타일 인스턴스 제거
        this.tileMap.forEach(tile => {
            tile.destroy();
        });
        this.tileMap.clear();
    }
    resetHexMap(grid) {
        this.clearHexMap(); // 기존 타일 제거
        this.generateHexMapFromGrid(grid); // 새로운 맵 생성
    }
    renderTile(q, r, terrainType) {
        const pos = this.axialToPixel(q, r);
        const tileInstance = new HexTile(this, pos.x, pos.y, q, r, terrainType);
        
    }
    renderAttackTile(){
        if(this.selectedShip && this.selectedShip.attackTile){
            const tile = this.selectedShip.attackTile;
            //this.renderTile(tile.q, tile.r, TERRAIN_TYPES.ATTACK); // 공격 타일 표시
            this.drawTile(TERRAIN_TYPES.ATTACK, tile.q, tile.r);
        }
    }
    clearSelectedTile(selected = false ) {
        if (this.selectedTile) {
            const { q, r, terrain } = this.selectedTile;
            //this.renderTile(q, r, terrain); // 원래 지형으로 복원
            this.clearSelectedTiles(); // 선택된 타일 그래픽 제거
            this.selectedTile = null; // 선택된 타일 초기화
            this.selectedShip = null; // 선택된 군함 초기화
            
        }
    }
    clearAttackTile(){
        this.clearSelectedTiles();
        if(this.selectedTile){
            const { q, r, terrain } = this.selectedTile;
            this.drawTile(TERRAIN_TYPES.SELECTED, q, r); // 선택된 타일 표시
        }
    }
    //selectedTile,attackTile을 배열에 넣고 새로 그리는 방식으로 랜더링
    selectedTiles = [];
    drawTile(tileData, q, r) {
        const pos = this.axialToPixel(q, r);
        const graphics = this.add.graphics();
        //TERRAIN_TYPES.SELECTED
        graphics.fillStyle(tileData.color, 0.6); // 색상과 투명도 설정
        graphics.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Phaser.Math.DegToRad(60 * i);
            const x = pos.x + HEX_SIZE * Math.sin(angle);
            const y = pos.y + HEX_SIZE * Math.cos(angle);
            if (i === 0) {
                graphics.moveTo(x, y);
            } else {
                graphics.lineTo(x, y);
            }
        }
        graphics.closePath();
        graphics.fillPath();
        this.selectedTiles.push(graphics); // 선택된 타일 그래픽 저장
    }
    clearSelectedTiles() {
        this.selectedTiles.forEach(tile => tile.destroy());
        this.selectedTiles = [];
    }
    
    generateHexMapFromGrid(grid) {
        

        for (let r = 0; r < grid.length; r++) { // 행(Row)
            for (let q = 0; q < grid[r].length; q++) { // 열(Column)
                const terrainId = grid[r][q];
                
                // 지형 객체 매핑
                const terrainType = Object.values(TERRAIN_TYPES).find(t => t.id === terrainId) || TERRAIN_TYPES.EMPTY;

                // 화면 위치 계산
                const pos = this.axialToPixel(q, r);
                const posX = pos.x;
                const posY =  pos.y;

                // 🔥 HexTile 인스턴스 생성!
                const tileInstance = new HexTile(this, posX, posY, q, r, terrainType);

                // Map에 인스턴스 저장 (q, r 키 사용)
                this.tileMap.set(`${q},${r}`, tileInstance);
            }
        }
    }

    setupCameraControls() {
        // 마우스 드래그로 탐험
        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x);
                this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y);
            }
        });
        // 두 점으로 확대 축소
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const zoomFactor = 0.001; // 확대/축소 속도 조절
            this.cameras.main.zoom -= deltaY * zoomFactor;
            this.cameras.main.zoom = Phaser.Math.Clamp(this.cameras.main.zoom, 0.5, 2); // 최소/최대 줌 제한
        });
    }

    update() {
        // ESC 키 입력 시 일시정지 토글
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.pauseGame();
        }
        // 두 개의 포인터를 가져옵니다.
        const pointer1 = this.input.pointer1;
        const pointer2 = this.input.pointer2;

        // 2. 두 손가락이 모두 화면을 누르고 있을 때만 실행
        if (pointer1.isDown && pointer2.isDown) {
            // 현재 두 포인터 사이의 거리를 계산 (Phaser.Math 사용)
            const currentDistance = Phaser.Math.Distance.Between(
                pointer1.x, pointer1.y,
                pointer2.x, pointer2.y
            );

            // 이전 거리가 기록되어 있다면 (터치를 시작한 직후 프레임이 아니라면)
            if (this.prevDistance > 0) {
                // 거리의 변화량을 계산 (확대 시 양수, 축소 시 음수)
                const distanceDelta = currentDistance - this.prevDistance;

                // 3. 카메라 줌 값 변경 (0.01은 민감도 조절용 가중치)
                let newZoom = this.cameras.main.zoom + (distanceDelta * 0.01);

                // 줌 제한 범위 설정 (최소 0.5배 ~ 최대 3.0배)
                newZoom = Phaser.Math.Clamp(newZoom, 0.5, 3.0);

                this.cameras.main.setZoom(newZoom);
            }

            // 현재 거리를 다음 프레임을 위해 저장
            this.prevDistance = currentDistance;
        } else {
            // 두 손가락 중 하나라도 떼어지면 이전 거리 기록을 초기화
            this.prevDistance = 0;
        }
    }

    turnEnd(){
        console.log('턴 종료!');
        this.clearSelectedTile(); // 선택된 타일 초기화
        this.resetHexMap(this.mapGrid); // 맵 초기화
        //군함 이동
        this.ships.forEach(ship => {

            //발사 메커니즘
            if(ship.attackTile){
               // console.log(`군함 ${ship.name}이 (${ship.attackTile.q}, ${ship.attackTile.r}) 위치를 공격합니다.`);

                //포탑 갯수만큼 여러 번 공격
                this.time.addEvent({
                    delay: 25,                // 1초(1000ms)마다 실행
                    callback: () => {
                        this.fireAnimation(ship, ship.attackTile);
                    },
                    callbackScope: this,
                    repeat: 2                   // ⚠️ 주의: 0부터 시작하므로 2를 적어야 총 3번 실행됩니다.
                });
                
                //공격 타일 초기화
                //ship.attackTile = null;
            }

            
            // 예시: 군함을 바라보는 방향으로 이동
            const direction = Phaser.Math.DegToRad(ship.rotation); // 배의 방향 (라디안)
            console.log(`군함 ${ship.name} 이동 방향: ${ship.rotation}도`);
            if(ship.rotation>59 && ship.rotation<61){
                ship.r += 1; // r 좌표 증가 (아래쪽 이동)
            }
            if(ship.rotation>119 && ship.rotation<121){
                ship.q -= 1; // q 좌표 감소
                ship.r += 1; // r 좌표 증가 (아래쪽 이동)
            }

            if(ship.rotation>-59 && ship.rotation<-61){
                ship.r -= 1; 
            }
            if(ship.rotation>-119 && ship.rotation<-121){
                ship.q += 1; 
                ship.r -= 1; 
            }
            if(ship.rotation>179 || ship.rotation<-179){
                ship.q -= 1; 
            }
            if(ship.rotation>-1 && ship.rotation<1){
                ship.q += 1; 
            }
            const newPos = this.axialToPixel(ship.q, ship.r);

            this.tweens.add({
                targets: ship.sprite,
                x: newPos.x,               // 목적지 X 좌표
                y: newPos.y,               // 목적지 Y 좌표
                duration: 500,        // 이동 시간 (1000ms = 1초)
                ease: 'Power2.easeInOut', // 부드러운 가감속 효과 (Cubic, Bounce, Back 등 가능)
                onComplete: function () {
                    console.log('이동 완료!');
                }
            });

            
            //ship.sprite.setPosition(newPos.x, newPos.y);
        });
    }
    renderDamageText(damage, position) {
        const damageText = this.add.text(position.x, position.y, `-${damage}`, {
            fontSize: '32px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(10);

        // 애니메이션: 위로 이동하며 점점 사라지기
        this.tweens.add({
            targets: damageText,
            y: position.y - 50,
            alpha: { from: 1, to: 0 },
            duration: 1000,
            ease: 'Power2.Out',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }
    hitTest(ship, targetTile) {
        // 간단한 충돌 판정 예시 (타일과 군함의 좌표 비교)
        const uiScene = this.scene.get('UIScene');
        this.ships.forEach(target => {
            if (target.q === targetTile.q && target.r === targetTile.r) {

                
                const diceValue = uiScene.renderDice();
                const damage = Phaser.Math.Clamp(ship.C - 6 + diceValue - target.D + (ship.SHS? 1 : 0)     ,0,100) ; // 최소  데미지 보장
                const pos = this.axialToPixel(targetTile.q, targetTile.r);
                if(damage>0){
                    console.log(`포탄이 ${target.name}에 (${targetTile.q}, ${targetTile.r}) 명중했습니다!`);
                    console.log(`데미지 계산: 군함 공격력 ${ship.C} + 주사위 값 ${diceValue} = 총 데미지 ${damage}`);
                    target.H -= damage; // 체력 감소
                    
                    this.renderDamageText(damage, { x: pos.x + Phaser.Math.Between(-20, 20), y: pos.y + Phaser.Math.Between(-20,20) });
                }else{
                    console.log(`타겟 ${target.name}에 명중했으나 장갑으로 막아냈습니다`);
                    //this.renderDamageText('miss', { x: pos.x + Phaser.Math.Between(-10, 10), y: pos.y + Phaser.Math.Between(-10, 10) });
                }
                

                
                if (target.H <= 0) {
                    console.log(`${target.name}이 파괴되었습니다!`);
                    const pos = this.axialToPixel(target.q, target.r);
                    const sunkImage =this.add.image(pos.x, pos.y, `${target.name}_sunk`).setOrigin(0.5).setScale(0.3).setDepth(1);// 침몰 이미지로 교체 (예시)
                    
                    target.sprite.destroy(); // 군함 스프라이트 제거
                    this.ships = this.ships.filter(s => s !== target); // 배열에서 제거
                }
                // 추가 로직: 데미지 계산, 애니메이션, 효과음 등
                return; // 명중 시 더 이상 확인하지 않음
            } else {
                //console.log(`포탄이 빗나갔습니다.`);
            }
        });
        
    }
    fireAnimation(ship, targetTile) {
        const startPos = this.axialToPixel(ship.q, ship.r);
        const endPos = this.axialToPixel(targetTile.q, targetTile.r);

        // 발사체 생성 (예: 작은 원)
        const projectile = this.add.circle(startPos.x, startPos.y, 5, 0xff0000);
        projectile.setDepth(2); // 타일 위에 표시되도록 깊이 설정

        // Tween을 사용하여 발사체 이동 애니메이션
        this.tweens.add({
            targets: projectile,
            x: endPos.x+Phaser.Math.Between(-10, 10),
            y: endPos.y+Phaser.Math.Between(-10, 10),
            duration: 500, // 이동 시간
            ease: 'Power2.easeInOut',
            onComplete: () => {
                // 도착 후 발사체 제거
                this.hitTest(ship, targetTile);
                projectile.destroy();

                // 폭발 효과 (예: 원 크기 확대 후 사라짐)
                const explosion = this.add.circle(endPos.x, endPos.y, 10, 0xffff00);
                explosion.setDepth(2);
                this.tweens.add({
                    targets: explosion,
                    scale: 3,
                    alpha: 0,
                    duration: 300,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        explosion.destroy();
                    }
                });
            }
        });
    }
    pauseGame() {
        if (!this.scene.isPaused('GameScene')) {
            // 1. GameScene 일시정지 (update, physics, tweens 동작 멈춤)
            this.scene.pause('GameScene');

            // 2. UIScene에 일시정지 상태 전달 (메뉴 팝업 띄우기)
            this.events.emit(GameEvents.TOGGLE_PAUSE, true);
        }
    }

    resumeGame() {
        if (this.scene.isPaused('GameScene')) {
            // 1. GameScene 재개
            this.scene.resume('GameScene');

            // 2. UIScene에 재개 상태 전달 (메뉴 팝업 닫기)
            this.events.emit(GameEvents.TOGGLE_PAUSE, false);
        }
    }
}