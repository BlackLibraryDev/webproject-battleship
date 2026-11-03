// src/HexTile.js
export const HEX_SIZE = 40; // 타일 반지름(px)

// 지형 정의 (이동 비용, 색상 등)
export const TERRAIN_TYPES = {
    EMPTY: { id: 0, name: 'empty', color: 0x000000},
    WATER: { id: 1, name: 'water', color: 0x3388cc },
    ISLAND: { id: 2, name: 'island', color: 0x55aa55},
    SELECTED: { id: 4, name: 'selected', color: 0xffff00},
    ATTACK: { id: 5, name: 'attack', color: 0xff0000},

};

export class HexTile extends Phaser.GameObjects.Container {
    constructor(scene, x, y, q, r, terrainType) {
        super(scene, x, y);

        this.q = q; // Axial 좌표 Q (열)
        this.r = r; // Axial 좌표 R (행)
        this.terrain = terrainType;
        this.isExplored = false; // 탐험 여부 (Fog of War)

        // 1. 육각형 배경 그래픽 생성
        this.bgGraphics = scene.add.graphics();
        this.drawHexagon(this.terrain.color);
        this.add(this.bgGraphics);
        //테두리 선 없애기

        // 2. 타일 상단 텍스트 (좌표 또는 건물/지형 이름 표시)
        this.label = scene.add.text(0, 0, `${q},${r}`, {
            fontSize: '14px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.add(this.label);

        // 3. 마우스 클릭 히트 영역(Hit Area) 설정
        const points = this.getHexPoints();
        const polygon = new Phaser.Geom.Polygon(points);
        this.setInteractive(polygon, Phaser.Geom.Polygon.Contains);

        // 마우스 상호작용 이벤트
        this.on('pointerdown', () => {

            
            //console.log(this.scene.mapNumber);
            //console.log(`(${this.q}, ${this.r}) | 지형: ${this.terrain.name}`);
            scene.events.emit('tileClicked', this);
        });

        this.on('pointerover', () => {
            this.bgGraphics.setAlpha(0.8);
        });

        this.on('pointerout', () => {
            this.bgGraphics.setAlpha(1.0);
        });

        // 씬에 Container 추가
        scene.add.existing(this);
    }

    // 육각형 꼭짓점 계산 (Pointy-Top)
    getHexPoints() {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angleDeg = 60 * i - 30;
            const angleRad = (Math.PI / 180) * angleDeg;
            points.push(new Phaser.Geom.Point(
                HEX_SIZE * Math.cos(angleRad),
                HEX_SIZE * Math.sin(angleRad)
            ));
        }
        return points;
    }

    // 육각형 그리기
    drawHexagon(color) {
        const points = this.getHexPoints();
        this.bgGraphics.clear();
        this.bgGraphics.fillStyle(color, 1);
        this.bgGraphics.lineStyle(1, 0xffffff, 0); // 테두리 선 스타일 설정
       // this.bgGraphics.lineStyle(2, 0x111111, 0.8);
        this.bgGraphics.fillPoints(points, true);
        this.bgGraphics.strokePoints(points, true);
    }
}