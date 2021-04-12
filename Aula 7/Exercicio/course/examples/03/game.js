let game;
let gameOptions = {
    defaultSize: {
        width: 750,
        height: 1334,
        maxRatio: 4 / 3
    }
}
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
        this.load.spritesheet("cloud", "assets/sprites/cloud.png", {
            frameWidth: 256,
            frameHeight: 256
        });
    }
    create(){
        this.scene.start("PlayGame");
    }
}
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    create(){
        this.addBackground();
        this.addClouds();
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
};
