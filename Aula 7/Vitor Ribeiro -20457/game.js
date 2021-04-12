// the game itself
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
    showGUI: true,
    bonusTime: 3,
    localStorageName: "irresponsible",
    initialTime: 30,

    // do we have to play sounds?
    soundOn: true
}
const POLE_SUCCESSFUL = 0;
const POLE_TOO_SHORT = 1;
const POLE_TOO_LONG = 2;

// idle state: the ninja is moving due to latest player action
const IDLE = 0;

// waiting for input start state: the game is waiting for player input
const WAITING_FOR_INPUT_START = 1;

// waiting for input stop state: the game is waiting for the player to release the input
const WAITING_FOR_INPUT_STOP = 2;

// function to be executed when the window loads
window.onload = function() {

    // get optimal window's width and height
    let width = gameOptions.defaultSize.width;
    let height = gameOptions.defaultSize.height;

    // this is the best case aspect ratio
    let perfectRatio = width / height;

    // actual window's width and height
    let innerWidth = window.innerWidth;
    let innerHeight = window.innerHeight;

    // actual width and height ratio
    let actualRatio = Math.min(innerWidth / innerHeight, gameOptions.defaultSize.maxRatio);

    // if perfect ratio is greater than actual ratio...
    if(perfectRatio > actualRatio){

        // ... then adjust height
        height = width / actualRatio;
    }
    else{

        // ... otherwise adjust width
        width = height * actualRatio;
    }

    // game configuration object
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

        // array with game scenes
        scene: [preloadGame, playGame]
    }

    // creation of the game itself
    game = new Phaser.Game(gameConfig);

    // give focus to window
    window.focus();
}

// the scene is just a JavaScript class, so we are going to extend it
class preloadGame extends Phaser.Scene{

    // class constructor
    constructor(){
        super("PreloadGame");
    }

    // method automatically executed by Phaser when the scene preloads
    preload(){
        this.load.image("background", "assets/sprites/background.png");
        this.load.image("tile", "assets/sprites/tile.png");
        this.load.image("dangertile", "assets/sprites/dangertile.png");
        this.load.image("title", "assets/sprites/title.png");
        this.load.image("info", "assets/sprites/info.png");
        this.load.image("playbutton", "assets/sprites/playbutton.png");
        this.load.image("logo", "assets/sprites/logo.png");
        this.load.image("clock", "assets/sprites/clock.png");
        this.load.image("energybar", "assets/sprites/energybar.png");
        this.load.image("whitetile", "assets/sprites/whitetile.png");
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
        });
        this.load.bitmapFont("font", "assets/fonts/font.png", "assets/fonts/font.fnt");

        // this is how we preload an audio file
        this.load.audio("death", ["assets/sounds/death.mp3", "assets/sounds/death.ogg"]);
        this.load.audio("run", ["assets/sounds/run.mp3", "assets/sounds/run.ogg"]);
        this.load.audio("stick", ["assets/sounds/stick.mp3", "assets/sounds/stick.ogg"]);
        this.load.audio("grow", ["assets/sounds/grow.mp3", "assets/sounds/grow.ogg"]);
        this.load.audio("pick", ["assets/sounds/pick.mp3", "assets/sounds/pick.ogg"]);
        this.load.audio("click", ["assets/sounds/click.mp3", "assets/sounds/click.ogg"]);
    }

    // method automatically executed by Phaser once the scene has been created,
    // often immediately after "preload" method
    create(){

        // create an animation
        this.anims.create({

            // we refer to this animation with "idle" key
            key: "idle",

            // frames of the sprite sheet to use
            frames: this.anims.generateFrameNumbers("hero", {
                start: 0,
                end: 11
            }),

            // frame rate, in frames per second
            frameRate: 15,

            // animation is be repeated endlessly
            repeat: -1
        });

        // same concept is applied to run animation
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

    // class constructor
    constructor(){
        super("PlayGame");
    }

    // method automatically executed by Phaser once the scene has been created

    create(){
        this.bestScore = localStorage.getItem(gameOptions.localStorageName);
        if(this.bestScore == null){
            this.bestScore = 0;
        }
        this.mountains = 0;
        this.timeLeft = gameOptions.initialTime;

        // method to add sounds to the game
        this.addSounds();
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

    // method to add background image
    addBackground(){

        // add background image as sprite, at coordinates x: -50, y: - 50
        let background = this.add.sprite(-50, -50, "background");

        // set background sprite origin - or registration point - to top left corner
        background.setOrigin(0, 0);

        // set background sprite display width to game width + 100 pixels
        background.displayWidth = game.config.width + 100;

        // set background sprite display height to game height + 100 pixels
        background.displayHeight = game.config.height + 100;
    }

    addClouds(){

        // clouds is the amount of cloud images needed to cover the entire game width
        let clouds = Math.ceil(game.config.width / 128);

        // we store clouds in cloudsArray array
        let cloudsArray = [];

        // this loop is executed twice because we want two rows of clouds
        for(let i = 0; i <= 1; i ++){

            // this loop is executed "cloud" times
            for(let j = 0; j <= clouds; j ++){

                // add cloud image to the game with a bit of randomization in its position
                let cloud = this.add.sprite(128 * j + Phaser.Math.Between(-10, 10), game.config.height + i * 32 + Phaser.Math.Between(-10, 10), "cloud");

                // set cloud frame
                cloud.setFrame(i);

                // insert the cloud in cloudsArray array
                cloudsArray.push(cloud);
            }
        }

        // tween the clouds
        this.tweens.add({

            // array containing game objects to tween: all clouds
            targets: cloudsArray,

            // properties to tween
            props: {

                // x property (horizontal position)
                x: {

                    // how do we change the value?
                    value: {

                        // once we have the position at the end of the tween...
                        getEnd: function(target, key, value){

                            // ... move it for a little amount of pixels
                            return target.x + Phaser.Math.Between(-10, 10)
                        }
                    }
                },

                // same concept applied to y property (vertical position)
                y: {
                    value: {
                        getEnd: function(target, key, value){
                            return target.y + Phaser.Math.Between(-10, 10)
                        }
                    }
                }
            },

            // duration of the tween, in milliseconds
            duration: 3000,

            // how many times are we repeating the tween? -1 = repeat forever
            repeat: -1,

            // yoyo effect: execute the tween back and forth
            yoyo: true
        });
    }

    addPlatforms(){

        // main platform is platform zero...
        this.mainPlatform = 0;

        // ... of this array of two platforms created with addPlatform method.
        // the argument is the x position
        this.platforms = [
            this.addPlatform((game.config.width - gameOptions.defaultSize.width) / 2),
            this.addPlatform(game.config.width)
        ];

        // finally, another method to tween a platform
        this.tweenPlatform();
    }

    addPlatform(posX){

        // add the platform sprite according to posX and gameOptions.platformHeight
        let platform = this.add.sprite(posX, game.config.height * gameOptions.platformHeight, "tile");

        // platform width initially is the arithmetic average of gameOptions.platformWidthRange values
        let width = (gameOptions.platformWidthRange[0] + gameOptions.platformWidthRange[1]) / 2;

        // adjust platform display width
        platform.displayWidth = width;

        // height is determined by the distance from the platform and the bottom of the screen
        // remember to add 50 more pixels for the shake effect
        platform.displayHeight = game.config.height * (1 - gameOptions.platformHeight) + 50

        // set platform origin to top left corner
        platform.setOrigin(0, 0);

        // return platform variable to be used by addPlatforms method
        return platform
    }

    tweenPlatform(){

        // get the right coordinate of left platform
        let rightBound = this.platforms[this.mainPlatform].getBounds().right;

        let minGap = gameOptions.platformGapRange[0];
        let maxGap = gameOptions.platformGapRange[1];

        // determine the random gap between the platforms
        let gap = Phaser.Math.Between(minGap, maxGap);

        // right platform destination is determined by adding the right coordinate of the platform to the gap
        let destination = rightBound + gap;
        let minWidth = gameOptions.platformWidthRange[0];
        let maxWidth = gameOptions.platformWidthRange[1];

        // determine a random platform width
        let width = Phaser.Math.Between(minWidth, maxWidth)

        // adjust right platform width
        this.platforms[1 - this.mainPlatform].displayWidth = width;

        // tweening the right platform to destination
        this.tweens.add({
            targets: [this.platforms[1 - this.mainPlatform]],
            x: destination,
            duration: gameOptions.scrollTime,

            // scope of the callback function
            callbackScope: this,

            // callback function once tween is complete
            onComplete: function(){
                this.placeDangerZone();
            }
        })
    }

    addDangerZone(){
        this.dangerZone = this.add.sprite(0, this.platforms[this.mainPlatform].y, "dangertile");
        this.dangerZone.setOrigin(0, 0);
        this.dangerZone.displayWidth = gameOptions.dangerZoneWidth;
        this.dangerZone.displayHeight = 10;
        this.dangerZone.visible = false;

        // add clock sprite...
        this.extraTime = this.add.sprite(0, 0, "clock");

        // ... and make it invisible
        this.extraTime.visible = false;
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

        // place clock icon a little above the danger zone
        this.extraTime.x = this.dangerZone.getBounds().centerX;

        // with the alpha set to 1 - fully opaque
        this.extraTime.alpha = 1;
        this.extraTime.y = this.platforms[this.mainPlatform].y - 30

        // not visible
        this.extraTime.visible = false;
    }

    addPole(){

        // get left platform bounds
        let bounds = this.platforms[this.mainPlatform].getBounds();

        // add the pole close to the right edge of the left platform
        this.pole = this.add.sprite(bounds.right - gameOptions.poleWidth, bounds.top, "tile");

        // set pole anchor point to bottom right
        this.pole.setOrigin(1, 1);

        // adjust pole size. The pole starts very short.
        this.pole.displayWidth = gameOptions.poleWidth;
        this.pole.displayHeight = gameOptions.poleWidth;
    }

    handlePointerDown(){
        if(this.gameMode == WAITING_FOR_INPUT_START){
            this.gameMode = WAITING_FOR_INPUT_STOP;
            let maxPoleWidth = gameOptions.platformGapRange[1] + gameOptions.platformWidthRange[1];

            // try to play "grow" sound
            this.playSound(this.sounds.grow);
            this.growTween = this.tweens.add({
                targets: [this.pole],
                displayHeight: maxPoleWidth + 50,
                duration: gameOptions.poleGrowTime,

                // we need to fire an onComplete event
                // to stop the sound
                callbackScope: this,
                onComplete: function(){

                    // stop "grow" sound
                    this.stopSound(this.sounds.grow);
                }
            });
            if(this.firstMove){
                this.info.visible = false;
                this.showGameScore();
                this.addGameTimer();
            }
        }
    }

    handlePointerUp(){
        if(this.gameMode == WAITING_FOR_INPUT_STOP){
            this.gameMode = IDLE;

            // stop "grow" sound
            this.stopSound(this.sounds.grow);

            // try to play "stick" sound
            this.playSound(this.sounds.stick);
            this.growTween.stop();
            this.tweens.add({
                targets: [this.pole],
                angle: 90,
                duration: gameOptions.poleRotateTime,
                ease: "Bounce.easeOut",
                callbackScope: this,
                onComplete: function(){
                    let poleBounds = this.pole.getBounds();
                    let dangerBounds = this.dangerZone.getBounds();
                    if(poleBounds.right >= dangerBounds.left && poleBounds.right <= dangerBounds.right){

                        // try to play "pick" sound
                        this.playSound(this.sounds.pick);
                        this.extraTime.visible = true;
                        let actualTime = this.timeLeft + gameOptions.bonusTime;
                        this.timeLeft = Math.min(actualTime, gameOptions.initialTime);
                        this.timeTween = this.tweens.add({
                            targets: [this.extraTime],
                            y: this.extraTime.y - 100,
                            alpha: 0,
                            duration: 500
                        })
                        this.updateTimer();
                    }
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

    addPlayer(){

        // get bounds of main platforms
        let platformBounds = this.platforms[this.mainPlatform].getBounds();

        // determine horizontal hero position subtracting pole width from right main platform bound
        let heroPosX = platformBounds.right - gameOptions.poleWidth;

        // vertical hero position is the same as top bound of main platform
        let heroPosY = platformBounds.top;

        // add hero sprite
        this.hero = this.add.sprite(heroPosX, heroPosY, "hero");

        // set hero registration point to right bottom corner
        this.hero.setOrigin(1, 1);

        // play "idle" animation
        this.hero.anims.play("idle");
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

        // try to play "run" sound
        this.playSound(this.sounds.run)
        this.walkTween = this.tweens.add({
            targets: [this.hero],
            x: heroDestination,
            duration: gameOptions.heroWalkTime * this.pole.displayHeight,
            callbackScope: this,
            onComplete: function(){

                // stop "run" sound
                this.stopSound(this.sounds.run)
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

// tween to make pole fall under ninja's feet
        this.tweens.add({

            // the pole is the target of this tween
            targets: [this.pole],

            // pole is being rotated by 180 degrees
            angle: 180,

            // tween duration: poleRotateTime milliseconds
            duration: gameOptions.poleRotateTime,

            // tween easing function
            ease: "Cubic.easeIn"
        })
    }

    fallAndDie(){
        this.gameTimer.remove();

        // try to play "death" sound with some delay
        this.playSound(this.sounds.death, {
            delay: gameOptions.heroFallTime / 2000
        });
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

        // play idle animation
        this.hero.anims.play("idle");

        // place the ninja on top of the platform, if not already
        this.hero.y = this.platforms[this.mainPlatform].getBounds().top;

        // hide danger zone
        this.dangerZone.visible = false;

        // get right platform position
        let rightPlatformPosition =  this.platforms[1 - this.mainPlatform].x

        // determine distance between left and righ platforms
        let distance = this.platforms[1 - this.mainPlatform].x - this.platforms[this.mainPlatform].x;

        // tween to move  hero, pole and platforms
        this.tweens.add({

            // look how different game objects can be tweened as long as they are in targets array
            targets: [this.hero, this.pole, this.platforms[0], this.platforms[1]],
            props: {

                // tween x property
                x: {

                    // subtract distance from their x position
                    value: "-= " + distance
                },

                // tween alpha property. The transparency
                alpha: {
                    value: {

                        // look at this: alpha is tweened to zero only if horizontal position
                        // of the target is less than right platform horizontal position.
                        // This way, the right platform and the ninja aren't affected
                        getEnd: function(target, key, value){
                            if(target.x < rightPlatformPosition){

                                // alpha = 0: completely transparent
                                return 0
                            }

                            // alpha = 1: completely opaque
                            return 1
                        }
                    }
                }
            },
            duration: gameOptions.scrollTime,
            callbackScope: this,
            onComplete: function(){

                // at the end of the tween, call prepareNextMove method
                this.prepareNextMove();
            }
        })
    }

    prepareNextMove(){

        // increase mountains
        this.mountains ++;

        // call updateScore method
        this.updateScore();
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

            // playSound method handles sound reproduction.
            // the sound to be played is passed as argument
            this.playSound(this.sounds.click);
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

        // add the sound icon
        let soundButton = this.add.sprite(playButtonX, playButtonY + 300, "icons");

        // set the proper frame according to soundOn value
        soundButton.setFrame(gameOptions.soundOn ? 2 : 3);

        // make sound button interactive
        soundButton.setInteractive();

        // when the player released the input...
        soundButton.on("pointerup", function(){

            // invert soundOn value
            gameOptions.soundOn = !gameOptions.soundOn;

            // set the proper frame according to soundOn value
            soundButton.setFrame(gameOptions.soundOn ? 2 : 3);

            // playSound method handles sound reproduction.
            // the sound to be played is passed as argument
            this.playSound(this.sounds.click)
        }, this);

        // sound button is also part of GUI group
        this.guiGroup.add(soundButton);
    }

    addGameInfo(){
        this.info = this.add.sprite(game.config.width / 2, game.config.height / 4, "info");
        this.gameMode = WAITING_FOR_INPUT_START;

        // it's the first move
        this.firstMove = true;
    }

    showGameOver(){
        let halfGameWidth = game.config.width / 2;
        let restartIcon = this.add.sprite(halfGameWidth - 120, game.config.height + 150, "icons");
        restartIcon.setInteractive();
        restartIcon.on("pointerup", function(){

            // try to play "click" sound
            this.playSound(this.sounds.click);
            gameOptions.showGUI = false;
            this.scene.start("PlayGame");
        }, this);
        let homeIcon = this.add.sprite(halfGameWidth + 120, game.config.height + 150, "icons");
        homeIcon.setFrame(1)
        homeIcon.setInteractive();
        homeIcon.on("pointerup", function(){

            // try to play "click" sound
            this.playSound(this.sounds.click);
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

    showGameScore(){

        // not the first move anymore
        this.firstMove = false;

        // add the energy bar in the horizontal center, vertical 1/5 of game height
        let energyBar = this.add.sprite(game.config.width / 2, game.config.height / 5, "energybar");

        // get energyBar bounds
        let energyBounds = energyBar.getBounds();

        // add the bitmap text representing the score
        this.scoreText = this.add.bitmapText(energyBounds.right, energyBounds.top - 40, "font", 	"DISTANCE: " + this.mountains.toString());
        this.scoreText.setOrigin(1, 0);

        // add the bitmap text representing the best score
        this.bestScoreText = this.add.bitmapText(energyBounds.left, energyBounds.bottom + 10, "font", 	"MAX DISTANCE: " + this.bestScore.toString());
        this.bestScoreText.setOrigin(0, 0);

        // fill energy bar with a white tile
        this.energyStatus = this.add.sprite(energyBounds.left + 5, energyBounds.top + 5, "whitetile");
        this.energyStatus.setOrigin(0, 0);
        this.energyStatus.displayWidth = 500;
        this.energyStatus.displayHeight = energyBounds.height - 10;
    }

    addGameTimer(){

        // create a time event
        this.gameTimer = this.time.addEvent({

            // event delay, in milliseconds
            delay: 1000,

            // callback function
            callback: function(){

                // decrease timeLeft property
                this.timeLeft --;

                // method to update the timer on the screen
                this.updateTimer();
            },

            // scope of callback function
            callbackScope: this,

            // execute the event forever
            loop: true
        });
    }

    updateTimer(){

        // resize energy according to time left
        this.energyStatus.displayWidth = 500 * this.timeLeft / gameOptions.initialTime;

        // did we run out of time?
        if(this.timeLeft == 0){

            // stop tweening the hero
            this.tweens.killTweensOf(this.hero);

            // stop tweening the pole
            this.tweens.killTweensOf(this.pole);

            // call fallAndDie method
            this.fallAndDie();
        }
    }

    updateScore(){

        // update text score
        this.scoreText.setText("DISTANCE: " + this.mountains)

        // if current score is higher than best score...
        if(this.mountains > this.bestScore){

            // update best score
            this.bestScore = this.mountains;

            // save best score to local storage
            localStorage.setItem(gameOptions.localStorageName, this.bestScore);

            // update best text score
            this.bestScoreText.setText("MAX DISTANCE: " + this.bestScore.toString());
        }
    }

    addSounds(){

        // creation of an object with all sounds
        this.sounds = {

            // this is how we add a sound to the game
            death: this.sound.add("death"),
            run: this.sound.add("run"),
            stick: this.sound.add("stick"),
            grow: this.sound.add("grow"),
            pick: this.sound.add("pick"),
            click: this.sound.add("click")
        }
    }

    playSound(sound, options){

        // if we have to play a sound...
        if(gameOptions.soundOn){

            // ... let's play it
            sound.play("", options);
        }
    }

    stopSound(sound){

        // just stop the sound
        sound.stop();
    }
}







