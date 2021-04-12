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
    heroWalkTime: 2,
    heroFallTime: 500,
    showGUI: true
}
const POLE_SUCCESSFUL = 0;
const POLE_TOO_SHORT = 1;
const POLE_TOO_LONG = 2;
const IDLE = 0;
const WAITING_FOR_INPUT_START = 1;
const WAITING_FOR_INPUT_STOP = 2;
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
        this.load.image("title", "assets/sprites/title.png");
        this.load.image("info", "assets/sprites/info.png");
        this.load.image("playbutton", "assets/sprites/playbutton.png");
        this.load.image("logo", "assets/sprites/logo.png");
        this.load.spritesheet("cloud", "assets/sprites/cloud.png", {
            frameWidth: 256,
            frameHeight: 256
        });
        this.load.spritesheet("hero", "assets/sprites/hero.png", {
            frameWidth: 77,
            frameHeight: 97
        });
        this.load.spritesheet("icons", "assets/sprites/icons.png", {
            frameWidth: 150,
            frameHeight: 150
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
        if(gameOptions.showGUI){
            this.addGameTitle();
            this.gameMode = IDLE;
        }
        else{
            this.addGameInfo();
        }
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
        if(this.gameMode == WAITING_FOR_INPUT_START){
            this.gameMode = WAITING_FOR_INPUT_STOP;
            let maxPoleWidth = gameOptions.platformGapRange[1] + gameOptions.platformWidthRange[1];
            this.growTween = this.tweens.add({
                targets: [this.pole],
                displayHeight: maxPoleWidth + 50,
                duration: gameOptions.poleGrowTime
            });
        }
    }
    handlePointerUp(){
        if(this.gameMode == WAITING_FOR_INPUT_STOP){
            this.gameMode = IDLE;
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
            duration: gameOptions.heroWalkTime * this.pole.displayHeight,
            callbackScope: this,
            onComplete: function(){
                switch(poleStatus){
                    case POLE_TOO_SHORT:
                        this.poleFallDown();
                        this.fallAndDie();
                        break;
                    case POLE_TOO_LONG:
                        this.fallAndDie();
                        break;
                    case POLE_SUCCESSFUL:
                        this.nextPlatform();
                        break;
                }
            },
            onUpdate: function(){
                let heroBounds = this.hero.getBounds();
                let poleBounds = this.pole.getBounds();
                let platformBounds = this.platforms[1 - this.mainPlatform].getBounds();
                if(heroBounds.centerX > poleBounds.left && heroBounds.centerX < poleBounds.right){
                    this.hero.y = poleBounds.top;
                }
                else{
                    this.hero.y = platformBounds.top;
                }
            }
        });
    }
    poleFallDown(){
        this.tweens.add({
            targets: [this.pole],
            angle: 180,
            duration: gameOptions.poleRotateTime,
            ease: "Cubic.easeIn"
        })
    }
    fallAndDie(){
        this.tweens.add({
            targets: [this.hero],
            y: game.config.height + this.hero.displayHeight * 2,
            angle: 180,
            duration: gameOptions.heroFallTime,
            ease: "Cubic.easeIn",
            callbackScope: this,
            onComplete: function(){
                this.cameras.main.shake(200, 0.01);
                this.showGameOver();
            }
        })
    }
    nextPlatform(){
        this.hero.anims.play("idle");
        this.hero.y = this.platforms[this.mainPlatform].getBounds().top;
        this.dangerZone.visible = false;
        let rightPlatformPosition =  this.platforms[1 - this.mainPlatform].x
        let distance = this.platforms[1 - this.mainPlatform].x - this.platforms[this.mainPlatform].x;
        this.tweens.add({
            targets: [this.hero, this.pole, this.platforms[0], this.platforms[1]],
            props: {
                x: {
                    value: "-= " + distance
                },
                alpha: {
                    value: {
                        getEnd: function(target, key, value){
                            if(target.x < rightPlatformPosition){
                                return 0
                            }
                            return 1
                        }
                    }
                }
            },
            duration: gameOptions.scrollTime,
            callbackScope: this,
            onComplete: function(){
                this.prepareNextMove();
            }
        })
    }
    prepareNextMove(){
        this.platforms[this.mainPlatform].x = game.config.width;
        this.platforms[this.mainPlatform].alpha = 1;
        this.mainPlatform = 1 - this.mainPlatform;
        this.tweenPlatform();
        this.pole.angle = 0;
        this.pole.alpha = 1;
        this.pole.x = this.platforms[this.mainPlatform].getBounds().right - gameOptions.poleWidth;
        this.pole.displayHeight = gameOptions.poleWidth;
        this.gameMode = WAITING_FOR_INPUT_START;
    }
    addGameTitle(){
        this.guiGroup = this.add.group();
        let blackOverlay = this.add.sprite(0, 0, "tile");
        blackOverlay.setOrigin(0, 0);
        blackOverlay.displayWidth = game.config.width;
        blackOverlay.displayHeight = game.config.height;
        blackOverlay.alpha = 0.8;
        this.guiGroup.add(blackOverlay);
        let title = this.add.sprite(game.config.width / 2, 50, "title");
        title.setOrigin(0.5, 0);
        this.guiGroup.add(title);
        let playButtonX = game.config.width / 2;
        let playButtonY = game.config.height / 2 - 20;
        let playButton = this.add.sprite(playButtonX, playButtonY, "playbutton");
        playButton.setInteractive();
        playButton.on("pointerup", function(){
            this.guiGroup.toggleVisible();
            this.guiGroup.active = false;
            this.cameras.main.flash();
            this.addGameInfo();
        }, this);
        this.guiGroup.add(playButton);
        this.tweens.add({
            targets: [playButton],
            y: game.config.height / 2 + 20,
            duration: 5000,
            yoyo: true,
            repeat: -1
        })
    }
    addGameInfo(){
        this.info = this.add.sprite(game.config.width / 2, game.config.height / 4, "info");
        this.gameMode = WAITING_FOR_INPUT_START;
    }
    showGameOver(){
        let halfGameWidth = game.config.width / 2;
        let restartIcon = this.add.sprite(halfGameWidth - 120, game.config.height + 150, "icons");
        restartIcon.setInteractive();
        restartIcon.on("pointerup", function(){
            gameOptions.showGUI = false;
            this.scene.start("PlayGame");
        }, this);
        let homeIcon = this.add.sprite(halfGameWidth + 120, game.config.height + 150, "icons");
        homeIcon.setFrame(1)
        homeIcon.setInteractive();
        homeIcon.on("pointerup", function(){
            gameOptions.showGUI = true;
            this.scene.start("PlayGame");
        }, this);
        this.tweens.add({
            targets: [this.dangerZone, this.pole, this.platforms[0], this.platforms[1]],
            alpha: 0,
            duration: 800,
            ease: "Cubic.easeIn"
        })
        this.tweens.add({
            targets: [restartIcon, homeIcon],
            y: game.config.height / 2,
            duration: 800,
            ease: "Cubic.easeIn"
        })
        let logo = this.add.sprite(game.config.width / 2, game.config.height + 150, "logo");
        logo.setInteractive();
        logo.on("pointerup", function(){
            window.location.href = "https://www.emanueleferonato.com/"
        }, this);
        this.tweens.add({
            targets: [logo],
            y: game.config.height / 4 * 3,
            duration: 800,
            ease: "Cubic.easeIn"
        })
    }
};
