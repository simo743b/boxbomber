let stage, queue, block, player1, player2, player3, player4, map, gameTimer,currentPosition=0;;
const TILESIZE = 64;

let sounds = {
    "backgroundSound":0,
    "bombDrop":0,
    "powerup":0,
    "explosion":0
}

let blocks = [];
let powerups = [];
let bombs = [];
let settings = {
    "game":{
        "level":0,
        "levelStarted":false,
        "levelFinished":false,
        "tryAgain":false,
        "endScreen":false,
        "playersReady":false,
        "playersAlive":0,
        "players":["player","player"]
    },
    "powerupLimit":{
        "SPEED": 8,
        "BOMBS": 8,
        "LIFE": 3,
        "FIRE": 7
    },
    "menu":{
        "select":false,
        "instructions":false,
        "game":false,
        "home":true
    }
}

// ------------------------------------------------------ LOADING STUFF ------------------
function setup(){
    stage = new createjs.Stage("stage");

    queue = new createjs.LoadQueue(true);
    queue.installPlugin(createjs.Sound);
    queue.loadManifest(
        [
            {id: "levels", src:"json/levels.json"},
            {id: "level0Landscape", src:"json/levelOne_landscape.json", type:"spritesheet"},
            {id: "level1Landscape", src:"json/levelTwo_landscape.json", type:"spritesheet"},
            {id: "universal", src:"json/universal.json", type:"spritesheet"},
            {id: "player1", src:"json/player1.json", type:"spritesheet"},
            {id: "player2", src:"json/player2.json", type:"spritesheet"},
            {id: "player3", src:"json/player3.json", type:"spritesheet"},
            {id: "player4", src:"json/player4.json", type:"spritesheet"},
            {id: "logoSprite", src:"json/BoxBomberLogo.json", type:"spritesheet"},
            {id:"gameended", src:"json/gameended.json", type:"spritesheet"},
            {id: "powerup", src:"json/powerup.json"},
            {id:"player1Start", src:"img/player1Start.png"},
            {id:"player2Start", src:"img/player2Start.png"},
            {id:"startNewGame", src:"img/startnewgame.png"},
            {id:"instructions", src:"img/instructions.png"},
            {id:"goback", src:"img/goback.png"},
            {id:"arrow", src:"img/arrow.png"},
            {id:"controls", src:"img/keys.png"},
            {id:"player1win", src:"img/win1.png"},
            {id:"player2win", src:"img/win2.png"},
            {id:"player3win", src:"img/win3.png"},
            {id:"player4win", src:"img/win4.png"},
            {id:"tryAgain", src:"img/tryagain.png"},
            {id:"bricktile", src:"img/bricktile.png"},
            {id:"grasstile", src:"img/grasstile.png"},
            {id:"start", src:"img/start.png"},
            {id:"backgroundSound", src:"sound/background.wav"},
            {id:"powerupSound", src:"sound/powerup.wav"},
            {id:"bombDropSound", src:"sound/bombdrop.wav"},
            {id:"explosionSound", src:"sound/explosion.wav"}
        ]
    );

    createjs.Ticker.framerate=60;

    function loader(e){
        let percent = Math.round(e.progress*100);

        load = new createjs.Text("loading "+percent+"%", "100px VT323", "#000000");
            load.x = stage.canvas.width/2 - 250
            load.y = stage.canvas.height/2
        stage.addChild(load);
        stage.update();
        stage.removeChild(load);
    }

    queue.on("progress", loader);

    queue.on("complete", startMenu);
}

// ------------------------------------------------------ PLAYER TRIGGERS ------------------

class Player extends createjs.Container {

    constructor(spritesheet){
        super();

        let sprite = new createjs.Sprite(spritesheet,"idleDown");
        this.sprite = sprite;
        this.addChild(sprite);
        this.regY = TILESIZE/2;
        this.regX = TILESIZE/2;
        this.width = TILESIZE;
        this.height = TILESIZE;
        this.fireRange = 2;
        this.lives = 1;
        this.speed = 4;
        this.bombs = 0;
        this.bombLimit = 1;
        this.canBomb = true;
        this.direction = "down";
        this.alive=true;
        this.alpha=1;
        this.controls = {
            left: false,
            right: false,
            up: false,
            down: false,
            fire: false
        }
    }
    move(){
        if(this.alive && !settings.game.levelFinished){
        if(this.controls.left && canIMove(this,"left")){
            this.x-= this.speed;
        }
        if (this.controls.right && canIMove(this,"right")){
            this.x+= this.speed;
        }
        if(this.controls.up && canIMove(this,"up")){
            this.y-= this.speed;
        }
        if(this.controls.down && canIMove(this,"down")){
            this.y+= this.speed;
        }
        }
    }
    animate(){
        let thisPlayer = this;
        function animateMovePlayer(){
            if(thisPlayer.sprite.currentAnimation == "run"+thisPlayer.direction){
            }
            else{
            thisPlayer.sprite.gotoAndPlay("run"+thisPlayer.direction);
            }
        }
        function animateStopPlayer(){
            thisPlayer.sprite.gotoAndPlay("idle"+thisPlayer.direction);
        }

        if(this.lives>0  && !settings.game.levelFinished){
            if(this.controls.left){
                this.direction = "Left";
                animateMovePlayer();
            }else if(this.controls.right){
                this.direction = "Right";
                animateMovePlayer();
            }else if(this.controls.up){
                this.direction = "Up";
                animateMovePlayer();
            }else if(this.controls.down){
                this.direction = "Down";
                animateMovePlayer();
            }else{
                animateStopPlayer();
            }
        }else{
            //animate death
        }
    }
    character(){
        // player position in grid
        this.column = Math.floor(this.x/TILESIZE);
        this.row = Math.floor(this.y/TILESIZE);
        let myBlock = map[this.row][this.column];

        // is player alive?
        if(this.lives < 1){
            this.alive = false;
            stage.removeChild(this);
        }

        // is player on an explosion?
        if(myBlock.boom){
            if(this.lives > 0){
                this.lives--;
            }
            document.getElementById(""+this.name+"").innerHTML = this.lives;
        }

        // is player on a powerup?
        if(myBlock.powerup){

            sounds.powerup = createjs.Sound.play("powerupSound");
            sounds.powerup.volume = 0.5;

            function removePowerup(powerup){
                if(powerup.row == myBlock.row && powerup.column == myBlock.column){
                    stage.removeChild(powerup);
                }
            }

            if(this.speed < settings.powerupLimit.SPEED && myBlock.powerupSettings.name == "SPEED"){
                this.speed += myBlock.powerupSettings.power;
            }
            if(this.fireRange < settings.powerupLimit.FIRE && myBlock.powerupSettings.name == "FIRE"){
                this.fireRange += myBlock.powerupSettings.power;
            }
            if(this.lives < settings.powerupLimit.LIFE && myBlock.powerupSettings.name == "LIFE"){
                this.lives += myBlock.powerupSettings.power;
                document.getElementById(""+this.name+"").innerHTML = this.lives;
            }
            if(this.bombs < settings.powerupLimit.BOMBS && myBlock.powerupSettings.name == "BOMB"){
                this.bombLimit += myBlock.powerupSettings.power;
            }

            myBlock.powerup = false;

            powerups.forEach(removePowerup);
        }
    }
    bomb(){

        if(this.alive && this.controls.fire && this.bombLimit <= this.bombs  && !settings.game.levelFinished){
            this.canBomb = false;
        }
        else if(map[this.row][this.column].hasBomb){
            this.canBomb = false;
        }
        else if(this.alive && this.canBomb && this.controls.fire  && !settings.game.levelFinished){
            let player = this;
            let bomb = new createjs.Sprite(queue.getResult("universal"), "B");

            bomb.row = player.row;
            bomb.column = player.column;
            bomb.x = map[bomb.row][bomb.column].x + TILESIZE/2;
            bomb.y = map[bomb.row][bomb.column].y + TILESIZE/2;
            bomb.regX = TILESIZE / 2;
            bomb.regY = TILESIZE / 2;
            bomb.duration = 3000;
            bomb.detonate = false;
            bomb.owner = player;
            map[bomb.row][bomb.column].canMove = false;
            map[bomb.row][bomb.column].hasBomb = true;
            stage.addChild(bomb);
            bombs.push(bomb);
            player.bombs++;

            sounds.bombDrop = createjs.Sound.play("bombDropSound");
            sounds.bombDrop.volume = 0.5;

            function detonateBomb(){
                bomb.detonate = true;
            }
        
            setTimeout(detonateBomb,bomb.duration);

        }

        this.canBomb = true;
    }
}

function canIMove(player,direction){
    let nextBlock;
    let walkable = true;
    let cutCorners = 20;
    if(player.speed >= 6){
        cutCorners = 30;
    }
    if(player.speed >= 8){
        cutCorners = 40;
    }

    if (direction == "left"){
        nextBlock = map[player.row][player.column-1];
        if(nextBlock.canMove){

            // calibrating the spritesheet to the grid
            if(nextBlock.y + nextBlock.height + cutCorners < player.y + player.height/2
                || nextBlock.y - cutCorners > player.y - player.height/2){
                walkable = false;
            }
            else{
                if(player.controls.up || player.controls.down){
                    //do nothing because it will get stuck
                }
                else{
                    player.y = nextBlock.y + TILESIZE / 2;
                }
                walkable = true;
            }
        }
        else{
        
            // calibrating the spritesheet to the grid
            if(nextBlock.x + nextBlock.width > player.x - player.width/2 - player.speed){
                walkable = false;
            }
            else{
                walkable = true;
            }
        }
    }
    if (direction == "right"){
        nextBlock = map[player.row][player.column+1];

        if(nextBlock.canMove){

            // calibrating the spritesheet to the grid
            if(nextBlock.y + nextBlock.height + cutCorners < player.y + player.height/2
                || nextBlock.y - cutCorners > player.y - player.height/2){
                walkable = false;
            }
            else{
                if(player.controls.up || player.controls.down){
                    //do nothing because it will get stuck
                }
                else{
                    player.y = nextBlock.y + TILESIZE / 2;
                }
                walkable = true;
            }
        }
        else{
        
            // calibrating the spritesheet to the grid
            if(nextBlock.x < player.x + player.width/2 + player.speed){
                walkable = false;
            }
            else{
                walkable = true;
            }
        }
    }
    if (direction == "up"){
        nextBlock = map[player.row-1][player.column];
        if(nextBlock.canMove){
            
            // calibrating the spritesheet to the grid
            if(nextBlock.x + nextBlock.width + cutCorners < player.x + player.width/2
                || nextBlock.x - cutCorners > player.x - player.width/2){
                walkable = false;
            }
            else{
                player.x = nextBlock.x + TILESIZE / 2;
                walkable = true;
            }
        }
        else{
        
            // calibrating the spritesheet to the grid
            if(nextBlock.y + nextBlock.height > player.y - player.height/2 - player.speed){
                walkable = false;
            }
            else{
                walkable = true;
            }
        }
    }
    if (direction == "down"){
        nextBlock = map[player.row+1][player.column];

        if(nextBlock.canMove){

            // calibrating the spritesheet to the grid
            if(nextBlock.x + nextBlock.width + cutCorners < player.x + player.width/2
                || nextBlock.x - cutCorners > player.x - player.width/2){
                walkable = false;
            }
            else{
                player.x = nextBlock.x + TILESIZE / 2;
                walkable = true;
            }
        }
        else{
        
            // calibrating the spritesheet to the grid
            if(nextBlock.y < player.y + player.height/2 + player.speed){
                walkable = false;
            }
            else{
                walkable = true;
            }
        }
    }
    
    return walkable;
}

function keyDown(evt) {

    // PLAYER 1 CONTROLS
    if (evt.code == "ArrowLeft") {
        player1.controls.left = true;
        evt.preventDefault();
    }if (evt.code == "ArrowRight") {
        player1.controls.right = true;
        evt.preventDefault();
    }if (evt.code == "ArrowUp") {
        player1.controls.up = true;
        evt.preventDefault();
    }if (evt.code == "ArrowDown") {
        player1.controls.down = true;
        evt.preventDefault();
    }if (evt.code == "AltRight") {
        player1.controls.fire = true;
        evt.preventDefault();
    }

    // PLAYER 2 CONTROLS
    if (evt.code == "KeyA") {
        player2.controls.left = true;
        evt.preventDefault();
    }if (evt.code == "KeyD") {
        player2.controls.right = true;
        evt.preventDefault();
    }if (evt.code == "KeyW") {
        player2.controls.up = true;
        evt.preventDefault();
    }if (evt.code == "KeyS") {
        player2.controls.down = true;
        evt.preventDefault();
    }if (evt.code == "Digit1") {
        player2.controls.fire = true;
        evt.preventDefault();
    }

    // PLAYER 3 CONTROLS
    if (evt.code == "KeyF") {
        player3.controls.left = true;
        evt.preventDefault();
    }if (evt.code == "KeyH") {
        player3.controls.right = true;
        evt.preventDefault();
    }if (evt.code == "KeyT") {
        player3.controls.up = true;
        evt.preventDefault();
    }if (evt.code == "KeyG") {
        player3.controls.down = true;
        evt.preventDefault();
    }if (evt.code == "KeyX") {
        player3.controls.fire = true;
        evt.preventDefault();
    }

    // PLAYER 4 CONTROLS
    if (evt.code == "KeyJ") {
        player4.controls.left = true;
        evt.preventDefault();
    }if (evt.code == "KeyL") {
        player4.controls.right = true;
        evt.preventDefault();
    }if (evt.code == "KeyI") {
        player4.controls.up = true;
        evt.preventDefault();
    }if (evt.code == "KeyK") {
        player4.controls.down = true;
        evt.preventDefault();
    }if (evt.code == "KeyB") {
        player4.controls.fire = true;
        evt.preventDefault();
    }

    // GAME ENDED CONTROLS
    if(settings.game.levelFinished){
        if(evt.code == "ArrowLeft"){
            arrow.x = tryAgain.x - tryAgain.width/2 - 50;
            arrow.at = "tryAgain";
        }
        if(evt.code == "ArrowRight"){
            arrow.x = back.x - back.width/2 - 50;
            arrow.at = "goBack";
        }
        if(evt.code == "Space"){
            if(arrow.at == "goBack"){

                location.reload();
            }
            if(arrow.at == "tryAgain"){

                settings.game.tryAgain = true;
                settings.game.levelFinished = false;
                settings.game.levelStarted = false;
                settings.game.playersReady = false;
                settings.game.endScreen = false;

                startGame();
            }
        }
    }

}

function keyUp(evt) {

    // PLAYER 1 CONTROLS
    if (evt.code == "ArrowLeft") {
        player1.controls.left = false;
        evt.preventDefault();
    }if (evt.code == "ArrowRight") {
        player1.controls.right = false;
        evt.preventDefault();
    }if (evt.code == "ArrowUp") {
        player1.controls.up = false;
        evt.preventDefault();
    }if (evt.code == "ArrowDown") {
        player1.controls.down = false;
        evt.preventDefault();
    }if (evt.code == "AltRight") {
        player1.controls.fire = false;
        evt.preventDefault();
    }

    // PLAYER 2 CONTROLS
    if (evt.code == "KeyA") {
        player2.controls.left = false;
        evt.preventDefault();
    }if (evt.code == "KeyD") {
        player2.controls.right = false;
        evt.preventDefault();
    }if (evt.code == "KeyW") {
        player2.controls.up = false;
        evt.preventDefault();
    }if (evt.code == "KeyS") {
        player2.controls.down = false;
        evt.preventDefault();
    }if (evt.code == "Digit1") {
        player2.controls.fire = false;
        evt.preventDefault();
    }

    // PLAYER 3 CONTROLS
    if (evt.code == "KeyF") {
        player3.controls.left = false;
        evt.preventDefault();
    }if (evt.code == "KeyH") {
        player3.controls.right = false;
        evt.preventDefault();
    }if (evt.code == "KeyT") {
        player3.controls.up = false;
        evt.preventDefault();
    }if (evt.code == "KeyG") {
        player3.controls.down = false;
        evt.preventDefault();
    }if (evt.code == "KeyX") {
        player3.controls.fire = false;
        evt.preventDefault();
    }

    // PLAYER 4 CONTROLS
    if (evt.code == "KeyJ") {
        player4.controls.left = false;
        evt.preventDefault();
    }if (evt.code == "KeyL") {
        player4.controls.right = false;
        evt.preventDefault();
    }if (evt.code == "KeyI") {
        player4.controls.up = false;
        evt.preventDefault();
    }if (evt.code == "KeyK") {
        player4.controls.down = false;
        evt.preventDefault();
    }if (evt.code == "KeyB") {
        player4.controls.fire = false;
        evt.preventDefault();
    }

}

// ------------------------------------------------------ MAP TRIGGERS ------------------

function createMap(currentLevel){
    let levels = queue.getResult("levels");
    let mapOriginal = levels.level[currentLevel].layout;
    let thisRow = [];
    let thisColumn = [];
    map = [];
    blocks = [];
    
    mapOriginal.forEach(row);
    function row(columns,row){
        columns.forEach(createGrid);

        function createGrid(type,column){
            block = new createjs.Sprite(queue.getResult("level"+currentLevel+"Landscape"), type);
            block.x = TILESIZE * column;
            block.y = TILESIZE * row;
            block.width = TILESIZE;
            block.height = TILESIZE;
            block.type = type;
            block.canMove = false;
            block.boom = false;
            block.hasBomb = false;
            block.row = row;
            block.column = column;

            if(type === "N"){
                block.canMove = true;
            }

            if(type === "P1" || type === "P2" || type === "P3" || type === "P4"){
                block.canMove = true;
                block.gotoAndPlay("N");

                if(type === "P1"){
                    player1 = {
                        "spawnX":block.x + TILESIZE/2,
                        "spawnY":block.y + TILESIZE/2
                    }
                }
                if(type === "P2"){
                    player2 = {
                        "spawnX":block.x + TILESIZE/2,
                        "spawnY":block.y + TILESIZE/2
                    }
                }
                if(type === "P3"){
                    player3 = {
                        "spawnX":block.x + TILESIZE/2,
                        "spawnY":block.y + TILESIZE/2
                    }
                }
                if(type === "P4"){
                    player4 = {
                        "spawnX":block.x + TILESIZE/2,
                        "spawnY":block.y + TILESIZE/2
                    }
                }
            }

            blocks.push(block);
            thisRow.push(block);
            stage.addChild(block);
        }
        map.push(thisRow)
        thisRow = [];
    }
}

function checkBlocks(){
    blocks.forEach(eachBlock)

    function eachBlock(block){

        if (block.boom){

            if(block.powerup){

                function destroyPowerup(powerup){

                    if(block.row == powerup.row && block.column == powerup.column){
                        stage.removeChild(powerup);
                        block.powerup = false;
                    }

                }

                powerups.forEach(destroyPowerup);

            }else{

                let chance = Math.floor(Math.random()*10);

                function powerup(block){
                    let availablePowerups = queue.getResult("powerup");
                    let powerPicker = Math.floor(Math.random()*availablePowerups.length);
                    let powerup = new createjs.Sprite(queue.getResult("universal"),availablePowerups[""+powerPicker].name+"");
                    powerup.x = block.x;
                    powerup.y = block.y;
                    powerup.regX = block.regX;
                    powerup.regY = block.regY;
                    powerup.width = block.width;
                    powerup.height = block.height;
                    powerup.row = block.row;
                    powerup.column = block.column;
                    block.powerup = true;
                    block.powerupSettings = availablePowerups[powerPicker];

                    powerups.push(powerup);

                    stage.addChild(powerup);

                }

                if(chance > 7 && block.type == "D"){
                    powerup(block);
                }

                block.canMove = true;
                block.type = "N";
                block.gotoAndPlay("N");
                block.boom = false;
            }
        }
    }
}

function detonateBombs(){

    bombs.forEach(detonate);

    function detonate(bomb){
        if(bomb.detonate){
            sounds.explosion = createjs.Sound.play("explosionSound");
            sounds.explosion.volume = 0.5;
            bomb.detonate = false;
            destroyBomb(bomb);
            bombs.splice(bomb,1);
        }
    }

};

function destroyBomb(bomb){
    let player = bomb.owner; 
    let exp, expDirectionX, expDirectionY, singleExp;
    player.bombs--;

    stage.removeChild(bomb);

    player.canBomb = true;
    map[bomb.row][bomb.column].canMove = true;
    map[bomb.row][bomb.column].hasBomb = false;

    function createExplosion(expX,expY){
        exp = new createjs.Sprite(queue.getResult("universal"), "FM");
        exp.x = expX;
        exp.y = expY;
        exp.regX = TILESIZE / 2;
        exp.regY = TILESIZE / 2;
        exp.row = Math.floor(exp.y/TILESIZE);
        exp.column = Math.floor(exp.x/TILESIZE);
        exp.owner = player;
        map[exp.row][exp.column].boom = true;
        stage.addChild(exp);

        exp.addEventListener("animationend", function (e) {
            stage.removeChild(e.target);

        });
    }

    createExplosion(bomb.x,bomb.y);

    //LEFT
    leftLoop: for (let i = 1; i <= player.fireRange; i++) {
        expDirectionX = map[bomb.row][bomb.column-i].x+TILESIZE/2;
        expDirectionY = map[bomb.row][bomb.column-i].y+TILESIZE/2;
        singleExp = map[bomb.row][bomb.column-i];                
        if(singleExp.type === "E" || singleExp.type === "O"){
            break leftLoop;
        }        
        else if (singleExp.type === "D"){
            createExplosion(expDirectionX,expDirectionY);
            exp.gotoAndPlay("FEL");
            break leftLoop;
        }
        else if (singleExp.hasBomb){
            createExplosion(expDirectionX,expDirectionY);
            exp.gotoAndPlay("FEL");

            bombs.forEach(detonateLeft)

            function detonateLeft(nextBomb){
                if(bomb.column-i == nextBomb.column && bomb.row == nextBomb.row){
                    nextBomb.detonate = true;
                }
            }
            break leftLoop;
        }                    
        else{
            createExplosion(expDirectionX,expDirectionY);
            exp.gotoAndPlay("FMX");

            if(i == player.fireRange){
                exp.gotoAndPlay("FEL");
            }
        }
    }

    // RIGHT 
    rightLoop: for (let i = 1; i <= player.fireRange; i++) {
        expDirectionX = map[bomb.row][bomb.column+i].x+TILESIZE/2;
        expDirectionY = map[bomb.row][bomb.column+i].y+TILESIZE/2;
        singleExp = map[bomb.row][bomb.column+i];
        if(singleExp.type === "E" || singleExp.type === "O"){
            break rightLoop;
        }        
        else if (singleExp.type === "D"){
            createExplosion(expDirectionX,expDirectionY);
            exp.gotoAndPlay("FER");
            break rightLoop;
        }else if (singleExp.hasBomb){
            createExplosion(expDirectionX,expDirectionY);
            exp.gotoAndPlay("FER");

            bombs.forEach(detonateLeft)

            function detonateLeft(nextBomb){
                if(bomb.column+i == nextBomb.column && bomb.row == nextBomb.row){
                    nextBomb.detonate = true;
                }
            }
            break rightLoop;
        }                     
        else{
           createExplosion(expDirectionX,expDirectionY);
           exp.gotoAndPlay("FMX");

           if(i == player.fireRange){
            exp.gotoAndPlay("FER");
        }
       }
    }

    // UP
    upLoop: for (let i = 1; i <= player.fireRange; i++) {
        expDirectionX = map[bomb.row-i][bomb.column].x+TILESIZE/2;
        expDirectionY = map[bomb.row-i][bomb.column].y+TILESIZE/2;
        singleExp = map[bomb.row-i][bomb.column];                
        if(singleExp.type === "E" || singleExp.type === "O"){
            break upLoop;
        }        
         else if (singleExp.type === "D"){
            createExplosion(expDirectionX,expDirectionY);
            exp.gotoAndPlay("FET");
            break upLoop;
        }else if (singleExp.hasBomb){
            createExplosion(expDirectionX,expDirectionY);
            exp.gotoAndPlay("FET");

            bombs.forEach(detonateLeft)

            function detonateLeft(nextBomb){
                if(bomb.row-i == nextBomb.row && bomb.column == nextBomb.column){
                    nextBomb.detonate = true;
                }
            }
            break upLoop;
        }                  
        else{
            createExplosion(expDirectionX,expDirectionY);
            exp.gotoAndPlay("FMY");

            if(i == player.fireRange){
                exp.gotoAndPlay("FET");
            }
        }
    }

    // DOWN
    downLoop: for (let i = 1; i <= player.fireRange; i++) {
        expDirectionX = map[bomb.row+i][bomb.column].x+TILESIZE/2;
        expDirectionY = map[bomb.row+i][bomb.column].y+TILESIZE/2;
        singleExp = map[bomb.row+i][bomb.column];                
        if(singleExp.type === "E" || singleExp.type === "O"){
            break downLoop;
        }        
         else if (singleExp.type === "D"){
            createExplosion(expDirectionX,expDirectionY);
            exp.gotoAndPlay("FEB");
            break downLoop;
        }else if (singleExp.hasBomb){
            createExplosion(expDirectionX,expDirectionY);
            exp.gotoAndPlay("FEB");

            bombs.forEach(detonateLeft)

            function detonateLeft(nextBomb){
                if(bomb.row+i == nextBomb.row && bomb.column == nextBomb.column){
                    nextBomb.detonate = true;
                }
            }
            break downLoop;
        }                    
        else{
            createExplosion(expDirectionX,expDirectionY);
            exp.gotoAndPlay("FMY");

            if(i == player.fireRange){
                exp.gotoAndPlay("FEB");
            }
        }
    }
}

function endGame(){

    if(settings.game.levelFinished && !settings.game.endScreen){

        clearTimeout(gameTimer);

        blackFade = new createjs.Shape();
            blackFade.graphics.beginFill("#000000");
            blackFade.graphics.drawRect(0,0,stage.canvas.width,stage.canvas.height);
            blackFade.x = stage.canvas.x;
            blackFade.y = stage.canvas.y;
            blackFade.alpha = 0.5;
        stage.addChild(blackFade);

        gameended = new createjs.Sprite(queue.getResult("gameended"),"show");
            gameended.width = 703;
            gameended.height = 93;
            gameended.regX = gameended.width/2;
            gameended.regY = gameended.height/2;
            gameended.x = stage.canvas.width/2;
            gameended. y = stage.canvas.height/2 - stage.canvas.height/4 - 50;
        stage.addChild(gameended);

        settings.game.endScreen = true;

        if(settings.game.playersAlive > 1){

            winnerText = new createjs.Text("Time ran out! There is no winner.","50px VT323","#FFFFFF");
                    winnerText.x = stage.canvas.width/4;
                    winnerText.y = stage.canvas.height/2;
                stage.addChild(winnerText);

        }
        
        else{
            function whoWon(player,number){
            if(player.alive){

                let playerNumber = number+1;

                playerWin = new createjs.Bitmap(queue.getResult(""+player.name+"win"));
                    playerWin.width = 221;
                    playerWin.height = 250;
                    playerWin.regX = playerWin.width/2;
                    playerWin.regY = playerWin.height/2;
                    playerWin.x = stage.canvas.width/2;
                    playerWin.y = stage.canvas.height/2 + 50;
                stage.addChild(playerWin);

                winnerText = new createjs.Text("The winner is player "+playerNumber,"50px VT323","#FFFFFF");
                    winnerText.x = gameended.x - 210;
                    winnerText.y = gameended.y + 60;
                stage.addChild(winnerText);
            }
        }
        settings.game.players.forEach(whoWon);
        }

        tryAgain = new createjs.Bitmap(queue.getResult("tryAgain"));
            tryAgain.width = 218;
            tryAgain.height = 45;
            tryAgain.x = stage.canvas.width/2 - stage.canvas.width/4;
            tryAgain.y = 600;
            tryAgain.regX = tryAgain.width/2;
            tryAgain.regY = tryAgain.height/2;
        stage.addChild(tryAgain);

        back = new createjs.Bitmap(queue.getResult("goback"));
            back.width = 200;
            back.height = 39;
            back.regX = back.width/2;
            back.regY = back.height/2;
            back.x = stage.canvas.width/2 + stage.canvas.width/4;
            back.y = 600;
        stage.addChild(back);

        arrow = new createjs.Bitmap(queue.getResult("arrow"));
            arrow.width =40;
            arrow.height =52;
            arrow.x = tryAgain.x - tryAgain.width/2 - 50;
            arrow.y = tryAgain.y;
            arrow.regX = arrow.width/2;
            arrow.regY = arrow.height/2;
            arrow.at = "tryAgain";
        stage.addChild(arrow);


    }
    if(settings.game.levelStarted && !settings.game.levelFinished){

        settings.game.playersAlive = 0;

        function checkLives(player){
            if(player.alive){
                settings.game.playersAlive++;
            }
        }

        settings.game.players.forEach(checkLives);

        if(settings.game.playersAlive <= 1){
            settings.game.levelFinished = true;
            clearTimeout(gameTimer);
        }
    }
    if(!settings.game.levelStarted && !settings.game.levelFinished){
        // CODEPEN CODE
        function timer(){
            document.getElementById('timer').innerHTML =
            05 + ":" + 00;
            startTimer();

            function startTimer() {
                let presentTime = document.getElementById('timer').innerHTML;
                let timeArray = presentTime.split(/[:]+/);
                let m = timeArray[0];
                let s = checkSecond((timeArray[1] - 1));
                
                if(s==59){
                    m=m-1
                }
                if(m<=0 && s<=00){
                    settings.game.levelFinished = true;
                }
                
                document.getElementById('timer').innerHTML =
                    m + ":" + s;
                gameTimer = setTimeout(startTimer, 1000);
            }

            function checkSecond(sec) {
            if (sec < 10 && sec >= 0) {sec = "0" + sec};
            if (sec < 0) {sec = "59"};
            return sec;
            }
        }
        timer();
        settings.game.levelStarted = true;
    }
}

// ------------------------------------------------------ NEW LEVEL TRIGGERS ------------------


function startGame(){

    stage.removeAllChildren();
    settings.menu.select = false;
    settings.menu.instructions = false;
    settings.menu.game = false;
    settings.menu.home = false;

    // NEXT LEVEL
    if(settings.game.levelFinished){
        levelCounter++;
        settings.game.levelFinished = false;
    }

    // CREATE PLAYERS
    function createPlayer(person,number){

        if(number === 0){
            let x = player1.spawnX;
            let y = player1.spawnY;
            player1 = new Player(queue.getResult("player1"));
            settings.game.players.splice("player",1);
            settings.game.players.push(player1);
            player1.x = x;
            player1.y = y;
            player1.name = "player1";
            document.getElementById(""+player1.name+"").innerHTML = player1.lives;
            stage.addChild(player1);
        }
        if(number === 1){
            let x = player2.spawnX;
            let y = player2.spawnY;
            player2 = new Player(queue.getResult("player2"));
            settings.game.players.splice("player",1);
            settings.game.players.push(player2);
            player2.x = x;
            player2.y = y;
            player2.name = "player2";
            document.getElementById(""+player2.name+"").innerHTML = player2.lives;
            stage.addChild(player2);
        }
        if(number === 2){
            let x = player3.spawnX;
            let y = player3.spawnY;
            player3 = new Player(queue.getResult("player3"));
            settings.game.players.splice("player",1);
            settings.game.players.push(player3);
            player3.x = x;
            player3.y = y;
            player3.name = "player3";
            document.getElementById(""+player3.name+"").innerHTML = player3.lives;
            stage.addChild(player3);
        }
        if(number === 3){
            let x = player4.spawnX;
            let y = player4.spawnY;
            player4 = new Player(queue.getResult("player4"));
            settings.game.players.splice("player",1);
            settings.game.players.push(player4);
            player4.x = x;
            player4.y = y;
            player4.name = "player4";
            document.getElementById(""+player4.name+"").innerHTML = player4.lives;
            stage.addChild(player4);
        }
        settings.game.playersReady = true;
    }

    // CREATE MAP
    createMap(settings.game.level);
    settings.game.players.forEach(createPlayer);
    document.getElementById("ui").style.display='grid';

    // ------------------ CREATE TICKER ------
    if(!settings.game.tryAgain){
        createjs.Ticker.removeAllEventListeners();
        createjs.Ticker.addEventListener("tick",tock);

    // ------------ REGISTER KEYBOARD ------
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);
    }

}

// ------------------------------------------------------ START MENU ------------------

function create(obj,x,y,width,height){
    obj.x = x;
    obj.y = y;
    obj.width = width;
    obj.height = height;
    obj.regX = obj.width/2;
    obj.regY = obj.height/2;
    obj.alpha = 1;
}

function startGameMenu(){

    settings.menu.select = false;
    settings.menu.game = true;
    settings.menu.home = false;
    settings.menu.instructions = false;

    //-- REMOVE START MENU -- //

    stage.removeChild(logo);
    stage.removeChild(startNewGame);
    stage.removeChild(instructions);
    stage.removeChild(arrow);

    // -- ADD SELECT ITEMS -- //

    back.x = stage.canvas.width/2 - 100;
    back.y = stage.canvas.height/2 + stage.canvas.height/3;
    back.height = 39;

    start = new createjs.Bitmap(queue.getResult("start"));
    start.x = stage.canvas.width/2 - 70
    start.y = stage.canvas.height/2 + stage.canvas.height/4
    start.height = 39

    playersText = new createjs.Text("PLAYERS", "60px VT323", "#ffffff");
    create(playersText,stage.canvas.width/2 - stage.canvas.width/4,stage.canvas.height/2 - stage.canvas.height/10,0,30);

    mapText = new createjs.Text("MAP", "60px VT323", "#ffffff");
    create(mapText,stage.canvas.width/2 - stage.canvas.width/4,stage.canvas.height/2 + 30,0,30);

    grassTile = new createjs.Bitmap(queue.getResult("grasstile"));
    create(grassTile,mapText.x*2 + 100,mapText.y - 20)

    brickTile = new createjs.Bitmap(queue.getResult("bricktile"));
    create(brickTile,mapText.x*2 + 100,mapText.y - 20)

    function numberPlayers(playerName,alpha){
        playerName.x = playersText.x + 420;
        playerName.y = playersText.y - 18;
        playerName.height = 30;
        playerName.alpha = alpha;
    }

    arrow.x = playersText.x - 50;
    arrow.y = playersText.y + 15;
    arrow.at = "players";


    playerLeft = new createjs.Bitmap(queue.getResult("arrow"));
    playerRight = new createjs.Bitmap(queue.getResult("arrow"));
    mapLeft = new createjs.Bitmap(queue.getResult("arrow"));
    mapRight = new createjs.Bitmap(queue.getResult("arrow"));
        create(playerLeft,playersText.x + 354, playersText.y + 20,40,52);
        create(playerRight,playersText.x + 512, playersText.y + 20,40,52);
        create(mapRight,brickTile.x + 110, brickTile.y + 30,40,52, 1);
        create(mapLeft,brickTile.x - 50, brickTile.y + 30,40,52, -1);
        playerLeft.scaleX = -1;
        mapLeft.scaleX = -1;

    player2 = new createjs.Text("2", "70px VT323", "#ffffff");
    player3 = new createjs.Text("3", "70px VT323", "#ffffff");
    player4 = new createjs.Text("4", "70px VT323", "#ffffff");
        numberPlayers(player2,1);
        numberPlayers(player3,0);
        numberPlayers(player4,0);

    stage.addChild(
        blackFade, 
        logo, 
        back, 
        start, 
        playersText,
        mapText, 
        grassTile, 
        brickTile, 
        arrow, 
        playerLeft, 
        playerRight, 
        mapRight, 
        mapLeft, 
        player2, 
        player3, 
        player4);
};

function homeMenu(){

    settings.menu.select = false;
    settings.menu.home = true;

    player1Intro = new createjs.Bitmap(queue.getResult("player1Start"));
        create(player1Intro,-300,260);

    player2Intro = new createjs.Bitmap(queue.getResult("player2Start"));
        create(player2Intro,1216,350);

    logo = new createjs.Sprite(queue.getResult("logoSprite"), "show");
        create(logo,stage.canvas.width/2,-stage.canvas.width/2,775,100)

    startNewGame = new createjs.Bitmap(queue.getResult("startNewGame"));
        create(startNewGame, stage.canvas.width/2, stage.canvas.height/2 + stage.canvas.height, 500, 53);

    instructions = new createjs.Bitmap(queue.getResult("instructions"));
        create(instructions,stage.canvas.width/2,stage.canvas.height/2 + stage.canvas.width/2, 400, 45);
    
    arrow = new createjs.Bitmap(queue.getResult("arrow"));
        create(arrow,instructions.x - instructions.width/2 - 50,stage.canvas.height/2 - instructions.height*2, 40, 52);
        arrow.alpha = 0;
        arrow.at = "instructions";

    blackFade = new createjs.Shape();
        create(blackFade,stage.canvas.x,stage.canvas.y);
        blackFade.graphics.beginFill("#000000");
        blackFade.graphics.drawRect(0,0,stage.canvas.width,stage.canvas.height);
        blackFade.alpha = 0.5;

    back = new createjs.Bitmap(queue.getResult("goback"));

    stage.addChild(player1Intro,player2Intro,logo,startNewGame,instructions,arrow);

    if(settings.menu.instructions || settings.menu.game){
        player1Intro.x = 50;
        player1Intro.y = 260;
        player2Intro.x = 800;
        player2Intro.y = 350;
        logo.y = stage.canvas.height/2 - logo.height*2;
        startNewGame.y = stage.canvas.height/2;
        instructions.y = stage.canvas.height/2 - instructions.height*2;
        arrow.alpha = 1;
    }else{
        createjs.Tween.get(player1Intro, {loop:false})
            .to({x:50, y:260}, 3000);

        createjs.Tween.get(player2Intro, {loop:false})
            .to({x:800, y:350}, 3000);

        createjs.Tween.get(logo, {loop:false})
            .wait(2000)
            .to({x:logo.x, y:stage.canvas.height/2 - logo.height*2}, 3000)

        createjs.Tween.get(startNewGame, {loop:false})
            .wait(2000)
            .to({x:startNewGame.x, y:stage.canvas.height/2},3000)

        createjs.Tween.get(instructions, {loop:false})
            .wait(2000)
            .to({x:instructions.x, y:stage.canvas.height/2 - instructions.height*2},3000)
    
        createjs.Tween.get(arrow, {loop:false})
            .wait(5000)
            .to({ alpha: 1})
    }

    settings.menu.game = false;
    settings.menu.instructions = false;
};

function instructionsMenu(){
    settings.menu.select = false;
    settings.menu.home = false;
    settings.menu.game = false;
    if(!settings.menu.instructions){

    //-- REMOVE START MENU -- //

    stage.removeChild(logo);
    stage.removeChild(startNewGame);
    stage.removeChild(instructions);
    stage.removeChild(arrow);

    // -- ADD INSTRUCTIONS 

    back.x = stage.canvas.width/5;
    back.y = 80;
    back.height = 39;

    arrow.x = back.x - 50;
    arrow.y = back.y + back.height/2;

    instructionsKeys = new createjs.Bitmap(queue.getResult("controls"));
    create(instructionsKeys,stage.canvas.x,stage.canvas.y);

    stage.addChild(blackFade,back,arrow,instructionsKeys);

    settings.menu.instructions = true;

    arrow.at = "backToMain";

    }
};

function startMenu(){
    // ------------------ CREATE MENU BACKGROUND --------
    document.getElementById("stage").style.backgroundImage = "url('img/background.png')";
    document.getElementById("ui").style.display='none';

    // ------------------ CREATE MENU TICKER ------
    createjs.Ticker.addEventListener("tick",menutock);

    sounds.backgroundSound = createjs.Sound.play("backgroundSound",{loop:-1});

    // ------------------- CREATE MENU CONTROLS --------
    function controls(e){

        if(e.code=="ArrowDown") {
            settings.menu.select = false;

            if(settings.menu.home){
                arrow.x = startNewGame.x - startNewGame.width/2 - 50;
                arrow.y = startNewGame.y;
                arrow.at = "startNewGame";
            }
            if(settings.menu.game){
                currentPosition++;
            }
        }
        if( e.code=="ArrowUp") {
            settings.menu.select = false;

            if(settings.menu.home){
                arrow.x = instructions.x - instructions.width/2 - 50;
                arrow.y = instructions.y;
                arrow.at = "instructions";
            }
            if(settings.menu.game){
                currentPosition--;
            }
        }
        if(e.code == "Space"){

            if(settings.menu.instructions){
                arrow.at = "backToMain";
            }
            settings.menu.select = true;
        }

        if(settings.menu.game){

            let arrowPositions = [
                playersText,
                mapText,
                start,
                back
            ]

            let mapType = [
                brickTile,
                grassTile
        
            ]

            if (currentPosition < 0) {
                currentPosition = arrowPositions.length - 1;
            } else if (currentPosition >= arrowPositions.length) {
                currentPosition = 0;
            }

            arrow.x = arrowPositions[currentPosition].x - 40;
            arrow.y = arrowPositions[currentPosition].y + arrowPositions[currentPosition].height / 2;

            if (currentPosition == 0) {
                if (e.code == "ArrowRight") {
                    if (settings.game.players.length >= 4) {
                        settings.game.players.splice("player",2);
                    }
                    else {
                        settings.game.players.push("player");
                    }
                }
                else if (e.code == "ArrowLeft") {
                    if (settings.game.players.length <= 2) {
                        settings.game.players.push("player","player");
                    }
                    else {
                        settings.game.players.splice("player",1);
                    }
                }
                showNumber(settings.game.players.length);
        
                function showNumber(number){
                    if(number == 2){
                        player2.alpha = 1;
                        player3.alpha = 0;
                        player4.alpha = 0;
                    }
                    if(number == 3){
                        player3.alpha = 1;
                        player2.alpha = 0;
                        player4.alpha = 0;
                    }
                    if(number == 4){
                        player4.alpha = 1;
                        player2.alpha = 0;
                        player3.alpha = 0;
                    }
                }
            }
            if (currentPosition == 1) {

                if (e.code == "ArrowLeft") {
                    if (settings.game.level >= 1) {
                        settings.game.level--;
                        mapType[settings.game.level + 1].alpha = 0;
                    } else {
                        settings.game.level++;
                        mapType[settings.game.level - 1].alpha = 0;
                    }
                    ;
                    mapType[settings.game.level].alpha = 1;
        
                }
                else if (e.code == "ArrowRight") {
                    if (settings.game.level <= 0) {
                        settings.game.level++;
                        mapType[settings.game.level - 1].alpha = 0;
                    } else {
                        settings.game.level--;
                        mapType[settings.game.level + 1].alpha = 0;
                    };
                    mapType[settings.game.level].alpha = 1;
                }
        
                if (currentPosition < 0) {
                    settings.game.level = mapType.length - 1;
                } else if (currentPosition >= mapType.length) {
                    settings.game.level = 0;
                }
            }
            if(currentPosition == 2){
                arrow.at = "start"
            }
            if(currentPosition == 3){
                arrow.at = "backToMain"
            }
        }

    }
    window.addEventListener("keydown",controls);

    homeMenu();

    stage.update();

}

// ------------------------------------------------------ FRAMERATE TRIGGERS ------------------

function tock(e){

    if(settings.game.playersReady){
    player1.move();
    player1.animate();
    player1.character();
    player1.bomb();

    player2.move();
    player2.animate();
    player2.character();
    player2.bomb();

    if(settings.game.players.length > 2){
        player3.move();
        player3.animate();
        player3.character();
        player3.bomb();

        if(settings.game.players.length > 3){

            player4.move();
            player4.animate();
            player4.character();
            player4.bomb();
        }
    }

    checkBlocks();
    detonateBombs();
    }
    endGame();

    stage.update(e);
}

function menutock(e){
    if(settings.menu.select){

        if(arrow.at === "instructions"){

            instructionsMenu();
        }
        else if (arrow.at === "start"){
            startGame();
            settings.menu.select = false;
        }
        else if (arrow.at === "backToMain"){

            stage.removeAllChildren();

            homeMenu();

        }
        else if(arrow.at === "startNewGame"){
            startGameMenu();
        }
    }
    stage.update(e);
}

window.addEventListener('load', setup);