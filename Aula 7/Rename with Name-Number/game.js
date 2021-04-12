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
        backgroundColor: 0x132c43
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
}
