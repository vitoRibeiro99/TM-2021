let game;
let gameOptions = {
    defaultSize: {
        width: 750,
        height: 1334,
        maxRatio: 4 / 3
    },
    platformGapRange: [200, 400],
    platformWidthRange: [50, 150],
    scrollTime: 250,
    platformHeight: 0.6,
    dangerZoneWidth: 20,
    poleWidth: 8,
    poleGrowTime: 400,
    poleRotateTime: 500,
    heroWalkTime: 2
}
const POLE_SUCCESSFUL = 0;
const POLE_TOO_SHORT = 1;
const POLE_TOO_LONG = 2;
window.onload = function() {
    let width = gameOptions.defaultSize.width;
    let height = gameOptions.defaultSize.height;
    let perfectRatio = width / height;
    let innerWidth = window.innerWidth;
    let innerHeight = window.innerHeight;
    let actualRatio = Math.min(innerWidth / innerHeight, gameOptions.defaultSize.maxRatio);
    if(perfectRatio > actualRatio){
        height = width / actualRatio;
    }
    else{
        width = height * actualRatio;
    }
    let gameConfig = {
        type: Phaser.AUTO,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
            width: width,
            height: height
        },
        backgroundColor: 0x132c43,
        scene: [preloadGame, playGame]
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
}
class preloadGame extends Phaser.Scene{
    constructor(){
        super("PreloadGame");
    }
    preload(){
        this.load.image("background", "assets/sprites/background.png");
        this.load.image("tile", "assets/sprites/tile.png");
        this.load.image("dangertile", "assets/sprites/dangertile.png");
        this.load.spritesheet("cloud", "assets/sprites/cloud.png", {
            frameWidth: 256,
            frameHeight: 256
        });
        this.load.spritesheet("hero", "assets/sprites/hero.png", {
            frameWidth: 77,
            frameHeight: 97
        })
    }
    create(){
        this.anims.create({
            key: "idle",
            frames: this.anims.generateFrameNumbers("hero", {
                start: 0,
                end: 11
            }),
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: "run",
            frames: this.anims.generateFrameNumbers("hero", {
                start: 12,
                end: 19
            }),
            frameRate: 15,
            repeat: -1
        });
        this.scene.start("PlayGame");
    }
}
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    create(){
        this.addBackground();
        this.addPlatforms();
        this.addDangerZone();
        this.addPole();
        this.addPlayer();
        this.addClouds();
        this.input.on("pointerdown", this.handlePointerDown, this);
        this.input.on("pointerup", this.handlePointerUp, this);
    }
    addBackground(){
        let background = this.add.sprite(-50, -50, "background");
        background.setOrigin(0, 0);
        background.displayWidth = game.config.width + 100;
        background.displayHeight = game.config.height + 100;
    }
    addClouds(){
        let clouds = Math.ceil(game.config.width / 128);
        let cloudsArray = [];
        for(let i = 0; i <= 1; i ++){
            for(let j = 0; j <= clouds; j ++){
                let cloud = this.add.sprite(128 * j + Phaser.Math.Between(-10, 10), game.config.height + i * 32 + Phaser.Math.Between(-10, 10), "cloud");
                cloud.setFrame(i);
                cloudsArray.push(cloud);
            }
        }
        this.tweens.add({
            targets: cloudsArray,
            props: {
                x: {
                    value: {
                        getEnd: function(target, key, value){
                            return target.x + Phaser.Math.Between(-10, 10)
                        }
                    }
                },
                y: {
                    value: {
                        getEnd: function(target, key, value){
                            return target.y + Phaser.Math.Between(-10, 10)
                        }
                    }
                }
            },
            duration: 3000,
            repeat: -1,
            yoyo: true
        });
    }
    addPlatforms(){
        this.mainPlatform = 0;
        this.platforms = [
            this.addPlatform((game.config.width - gameOptions.defaultSize.width) / 2),
            this.addPlatform(game.config.width)
        ];
        this.tweenPlatform();
    }
    addPlatform(posX){
        let platform = this.add.sprite(posX, game.config.height * gameOptions.platformHeight, "tile");
        let width = (gameOptions.platformWidthRange[0] + gameOptions.platformWidthRange[1]) / 2;
        platform.displayWidth = width;
        platform.displayHeight = game.config.height * (1 - gameOptions.platformHeight) + 50
        platform.setOrigin(0, 0);
        return platform
    }
    addDangerZone(){
        this.dangerZone = this.add.sprite(0, this.platforms[this.mainPlatform].y, "dangertile");
        this.dangerZone.setOrigin(0, 0);
        this.dangerZone.displayWidth = gameOptions.dangerZoneWidth;
        this.dangerZone.displayHeight = 10;
        this.dangerZone.visible = false;
    }
    placeDangerZone(){
        this.dangerZone.visible = true;
        let platformBound = this.platforms[1 - this.mainPlatform].getBounds().right;
        if(Phaser.Math.Between(0, 1) == 0){
            this.dangerZone.x = this.platforms[1 - this.mainPlatform].x
        }
        else{
            this.dangerZone.x = platformBound - gameOptions.dangerZoneWidth;
        }
    }
    tweenPlatform(){
        let rightBound = this.platforms[this.mainPlatform].getBounds().right;
        let minGap = gameOptions.platformGapRange[0];
        let maxGap = gameOptions.platformGapRange[1];
        let gap = Phaser.Math.Between(minGap, maxGap);
        let destination = rightBound + gap;
        let minWidth = gameOptions.platformWidthRange[0];
        let maxWidth = gameOptions.platformWidthRange[1];
        let width = Phaser.Math.Between(minWidth, maxWidth)
        this.platforms[1 - this.mainPlatform].displayWidth = width;
        this.tweens.add({
            targets: [this.platforms[1 - this.mainPlatform]],
            x: destination,
            duration: gameOptions.scrollTime,
            callbackScope: this,
            onComplete: function(){
                this.placeDangerZone();
            }
        })
    }
    addPole(){
        let bounds = this.platforms[this.mainPlatform].getBounds();
        this.pole = this.add.sprite(bounds.right - gameOptions.poleWidth, bounds.top, "tile");
        this.pole.setOrigin(1, 1);
        this.pole.displayWidth = gameOptions.poleWidth;
        this.pole.displayHeight = gameOptions.poleWidth;
    }
    addPlayer(){
        let platformBounds = this.platforms[this.mainPlatform].getBounds();
        let heroPosX = platformBounds.right - gameOptions.poleWidth;
        let heroPosY = platformBounds.top;
        this.hero = this.add.sprite(heroPosX, heroPosY, "hero");
        this.hero.setOrigin(1, 1);
        this.hero.anims.play("idle");
    }
    handlePointerDown(){
        let maxPoleWidth = gameOptions.platformGapRange[1] + gameOptions.platformWidthRange[1];
        this.growTween = this.tweens.add({
            targets: [this.pole],
            displayHeight: maxPoleWidth + 50,
            duration: gameOptions.poleGrowTime
        });
    }
    handlePointerUp(){
        this.growTween.stop();
        this.tweens.add({
            targets: [this.pole],
            angle: 90,
            duration: gameOptions.poleRotateTime,
            ease: "Bounce.easeOut",
            callbackScope: this,
            onComplete: function(){
                let poleBounds = this.pole.getBounds();
                let platformBounds = this.platforms[1 - this.mainPlatform].getBounds();
                let poleStatus = POLE_SUCCESSFUL;
                if(poleBounds.right < platformBounds.left){
                    poleStatus = POLE_TOO_SHORT;
                }
                else{
                    if(poleBounds.right > platformBounds.right){
                        poleStatus = POLE_TOO_LONG;
                    }
                }
                this.moveHero(poleStatus);
            }
        })
    }
    moveHero(poleStatus){
        let platformBounds = this.platforms[1 - this.mainPlatform].getBounds();
        let heroBounds = this.hero.getBounds();
        let poleBounds = this.pole.getBounds();
        let heroDestination;
        switch(poleStatus){
            case POLE_SUCCESSFUL:
                heroDestination = platformBounds.right - gameOptions.poleWidth;
                break;
            case POLE_TOO_SHORT:
                heroDestination = poleBounds.right;
                break;
            case POLE_TOO_LONG:
                heroDestination = poleBounds.right + heroBounds.width / 2;
                break;
        }
        this.hero.anims.play("run");
        this.walkTween = this.tweens.add({
            targets: [this.hero],
            x: heroDestination,
            duration: gameOptions.heroWalkTime * this.pole.displayHeight
        });
    }
};
