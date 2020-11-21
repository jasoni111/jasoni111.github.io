// import * as HighScore from './highscore.js'

// The point and size class used in this program
class Point {
    constructor(x, y) {
        this.x = (x) ? parseFloat(x) : 0.0;
        this.y = (y) ? parseFloat(y) : 0.0;
    }
    plus(p2) {
        return new Point(this.x + p2.x, this.y + p2.y);
    }
    minus(p2) {
        return new Point(this.x - p2.x, this.y - p2.y);
    }
    times(p2) {
        if (p2 instanceof Point)
            return new Point(this.x * p2.x, this.y * p2.y);
        else
            return new Point(this.x * p2, this.y * p2);
    }
    normalize() {
        let length = this.L2(new Point(0, 0));
        let toReturn = new Point(this.x, this.y);

        return toReturn.times(1.0 / length);
    }
    L2(p2) {
        if (p2 instanceof Point)
            return Math.hypot(this.x - p2.x, this.y - p2.y);
        else
            throw 'wrong type';
    }
}
function Size(w, h) {
    this.w = (w) ? parseFloat(w) : 0.0;
    this.h = (h) ? parseFloat(h) : 0.0;
}


//
// Below are constants used in the game
//
var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
var PLAYER_SIZE = new Size(40, 30);         // The size of the player
var MONSTER_SIZE = new Size(40, 40);         // The size of the player

var SCREEN_SIZE = new Size(600, 560);       // The size of the game screen
var PLAYER_INIT_POS = new Point(0, 0);     // The initial position of the player

var MOVE_DISPLACEMENT = 5;                  // The speed of the player in motion
var JUMP_SPEED = 15;                        // The speed of the player jumping
var VERTICAL_DISPLACEMENT = 1;              // The displacement of vertical speed

var GAME_INTERVAL = 25;                     // The time interval of running the game

var motionType = { NONE: 0, LEFT: 1, RIGHT: 2 }; // Motion enum

var player = null;                          // The player object
var gameInterval = null;                    // The interval
var zoom = 1.0;                             // The zoom level of the screen


let monsters = [];
let goodStuffs = [];
let playerBullets = [];
let monsterBullet = null;
let brokenPlatforms = [];

let score = 0;
let numGoodStuffCollected = 0;
let startTime = new Date();
let remainingBullet = 8;
let level = 1;
let numMonster = 6;
let exit;

let goodStuffScore = 100;
let killMonsterScore = 100;
let userID = "Anonymous";

let portal1;
let portal2;
let lastPortalTime = new Date();

let isCheating = false;




class PlanarObject {
    constructor(x, y, w, h) {
        this.position = new Point(x, y);       // The size of the game screen
        this.boundingBox = new Size(w, h);
    }
    setPos(x, y) {
        this.node.setAttribute('transform', `translate(${x} ${y})`);
        this.position.x = x;
        this.position.y = y;
    }
    collidePlayer() {
        return intersect(player.position, PLAYER_SIZE, this.position, this.boundingBox);
    }
    collideBullet(bulletPosition) {
        return intersect(bulletPosition.minus(new Point(0.5, 0.5)), new Size(1, 1), this.position, this.boundingBox);
    }
}


let hasStrongMonster = false;

class Monster extends PlanarObject {
    constructor(x, y) {

        let platforms = document.getElementById("platforms");
        super(x, y, 40, 40);

        let node = document.getElementById("monster");

        this.isStrongMonster = false;
        if (!hasStrongMonster) {
            hasStrongMonster = true;
            this.isStrongMonster = true;
            node = document.getElementById("strongMonster");
        }



        this.node = node.cloneNode(true);
        this.node.id = "monsterClone";
        this.node.setAttribute('transform', `translate(${x} ${y})`);
        this.node.setAttribute('display', "inline");
        this.move_distance = 40;
        this.faceing = motionType.RIGHT;

        this.generateNewTargetLoc();
        platforms.appendChild(this.node);
        this.lastTime = new Date();


    }
    generateNewTargetLoc() {
        this.target_loc = new Point(Math.random() * SCREEN_SIZE.w, Math.random() * SCREEN_SIZE.h);
    }
    update() {
        let dt = new Date() - this.lastTime;
        let dirVec = this.target_loc.minus(this.position).normalize()

        if (this.target_loc.L2(this.position) < 0.1) {
            this.generateNewTargetLoc()
        }
        if (this.target_loc.L2(this.position) < this.move_distance * dt / 1000.0) {
            this.position = this.target_loc;
        }
        else {
            this.position = this.position.plus(this.target_loc.minus(this.position).normalize().times(this.move_distance * dt / 1000.0))
        }
        if (dirVec.x > 0) {
            this.faceing = motionType.RIGHT;
            this.node.setAttribute('transform', `translate(${this.position.x} ${this.position.y})`);
        }
        else {
            this.faceing = motionType.LEFT;
            this.node.setAttribute('transform', `matrix(-1 0 0 1 ${this.position.x + MONSTER_SIZE.w}  ${this.position.y} )`)
        }


        this.lastTime = new Date();
        let isShoot = playerBullets.some(
            (b) => {
                return this.collideBullet(b.position);
            }
        )
        if (isShoot) {
            score += killMonsterScore;
            this.destruct();
            return false;
        } else {
            if (this.isStrongMonster) {
                this.shoot();
            }
            return true;
        }


    }
    shoot() {
        if (monsterBullet == null) {
            let newpos = this.faceing == motionType.LEFT ?
                this.position.plus(new Point(0, MONSTER_SIZE.h / 2)) :
                this.position.plus(new Point(MONSTER_SIZE.w, MONSTER_SIZE.h / 2));
            monsterBullet = new Bullet(newpos.x, newpos.y, this.faceing);
        }
        else {
            if (!monsterBullet.update()) {
                monsterBullet = null;
            }

        }
    }
    destruct() {
        if (this.isStrongMonster) {
            hasStrongMonster = false;
        }
        let platforms = document.getElementById("platforms");
        platforms.removeChild(this.node);
    }
}
class GoodStuff extends PlanarObject {
    constructor(x, y) {
        super(x, y, 40, 40);
        let platforms = document.getElementById("platforms");

        let node = document.getElementById("goodStuff");
        this.node = node.cloneNode(true);
        this.node.id = "goodStuffClone";

        this.node.setAttribute('transform', `translate(${x} ${y})`);
        this.node.setAttribute('display', "inline");

        platforms.appendChild(this.node);

    }
    destruct() {
        let platforms = document.getElementById("platforms");
        if (platforms.contains(this.node)) {
            platforms.removeChild(this.node);
            numGoodStuffCollected += 1;
        }


    }
}
class Bullet extends PlanarObject {
    // seems that only typescript accept private constructor
    constructor(x, y, dir) {
        super(x, y, 10, 10);
        let platforms = document.getElementById("platforms");

        let node = document.getElementById("playerBullet");
        this.node = node.cloneNode(true);
        this.node.id = "bulletClone";
        this.setPos(x, y);
        this.dir = dir;
        this.node.setAttribute('display', "inline");

        platforms.appendChild(this.node);
        this.lastTime = new Date();
        return;

    }

    isOutOfBound() {
        return (this.position.x < 0 || this.position.x > SCREEN_SIZE.w || this.position.y < 0 || this.position.y > SCREEN_SIZE.h)
    }
    update() {
        let dt = (new Date() - this.lastTime) / 1000.0;
        let dx = this.dir == motionType.LEFT ? -200.0 : 200.0;
        this.setPos(this.position.x + dx * dt, this.position.y);
        this.lastTime = new Date();
        if (this.isOutOfBound()) {
            this.destruct();
            return false;
        }
        return true;
    }


    destruct() {
        console.log("bullet destructed");
        let platforms = document.getElementById("platforms");
        if (platforms.contains(this.node)) {
            platforms.removeChild(this.node);
        }

    }
}

class Exit extends PlanarObject {
    constructor() {
        super(600, 100, 40, 40);
        this.node = document.getElementById("exit");
        this.setPos(560, 500);
    }
}

class Portal extends PlanarObject {
    constructor(x, y, id) {
        super(x, y, 40, 40);
        this.node = document.getElementById(id);
        this.setPos(x, y);
    }
}

// Helper function for checking intersection between two rectangles
// simple AABB
function intersect(pos1, size1, pos2, size2) {
    return (pos1.x < pos2.x + size2.w && pos1.x + size1.w > pos2.x &&
        pos1.y < pos2.y + size2.h && pos1.y + size1.h > pos2.y);
}


// The player class used in this program
class Player {
    constructor() {
        this.node = document.getElementById("player");
        this.svg = document.getElementById("cat_svg");

        this.position = PLAYER_INIT_POS;
        this.motion = motionType.NONE;
        this.verticalSpeed = 0;

        this.faceing = motionType.RIGHT;
    }

    isOnPlatform() {
        var platforms = document.getElementById("platforms");
        for (var i = 0; i < platforms.childNodes.length; i++) {
            var node = platforms.childNodes.item(i);
            if (node.nodeName != "rect") continue;

            var x = parseFloat(node.getAttribute("x"));
            var y = parseFloat(node.getAttribute("y"));
            var w = parseFloat(node.getAttribute("width"));
            var h = parseFloat(node.getAttribute("height"));

            if (((this.position.x + PLAYER_SIZE.w > x && this.position.x < x + w) ||
                ((this.position.x + PLAYER_SIZE.w) == x && this.motion == motionType.RIGHT) ||
                (this.position.x == (x + w) && this.motion == motionType.LEFT)) &&
                this.position.y + PLAYER_SIZE.h == y) return true;
        }
        if (this.position.y + PLAYER_SIZE.h == SCREEN_SIZE.h) return true;

        return false;
    }

    collidePlatform(position) {
        var platforms = document.getElementById("platforms");
        for (var i = 0; i < platforms.childNodes.length; i++) {
            let node = platforms.childNodes.item(i);
            if (node.nodeName != "rect") continue;

            var x = parseFloat(node.getAttribute("x"));
            var y = parseFloat(node.getAttribute("y"));
            var w = parseFloat(node.getAttribute("width"));
            var h = parseFloat(node.getAttribute("height"));
            var pos = new Point(x, y);
            var size = new Size(w, h);

            if (intersect(position, PLAYER_SIZE, pos, size)) {
                if (node.classList.contains("breakingPlatform")) {
                    // "let node = .." works without "that" but "var node = .." doesn't, intersting..
                    // closure, maybe?
                    let that = node;
                    setTimeout(() => {
                        if (platforms.contains(that)) {
                            brokenPlatforms.push(that);
                            platforms.removeChild(that);
                            that.classList.remove("shake");
                        }

                    }, 500);
                    that.classList.add("shake");
                }
                position.x = this.position.x;
                if (intersect(position, PLAYER_SIZE, pos, size)) {
                    if (this.position.y >= y + h)
                        position.y = y + h;
                    else
                        position.y = y - PLAYER_SIZE.h;
                    this.verticalSpeed = 0;
                }
            }
        }
    }

    collideScreen(position) {
        if (position.x < 0) position.x = 0;
        if (position.x + PLAYER_SIZE.w > SCREEN_SIZE.w) position.x = SCREEN_SIZE.w - PLAYER_SIZE.w;
        if (position.y < 0) {
            position.y = 0;
            this.verticalSpeed = 0;
        }
        if (position.y + PLAYER_SIZE.h > SCREEN_SIZE.h) {
            position.y = SCREEN_SIZE.h - PLAYER_SIZE.h;
            this.verticalSpeed = 0;
        }
    }

    collideMonsters(position) {
        if (isCheating) {
            return;
        }


        var platforms = document.getElementById("platforms");
        let touchesMonster = monsters.some(
            (m) => {
                return m.collidePlayer();
            }
        )
        if (touchesMonster) {
            console.log("rip");
            die();
        }
        // if(goodStuffs.som )
        // goodStuffs = goodStuffs.filter(
        //     (goodStuff) => {
        //         if (goodStuff.collidePlayer()) {
        //             score += goodStuffScore;
        //             goodStuff.destruct();
        //             return false;
        //         }
        //         return true;
        //     }
        // )

    }

    collideGoodStuff(position) {
        var platforms = document.getElementById("platforms");
        goodStuffs = goodStuffs.filter(
            (goodStuff) => {
                if (goodStuff.collidePlayer()) {
                    score += goodStuffScore;
                    goodStuff.destruct();
                    return false;
                }
                return true;
            }
        )

    }

    shoot() {
        if (isCheating) {
            let newpos = this.faceing == motionType.LEFT ?
                this.position.plus(new Point(0, PLAYER_SIZE.h / 2)) :
                this.position.plus(new Point(PLAYER_SIZE.w, PLAYER_SIZE.h / 2));
            playerBullets.push(new Bullet(newpos.x, newpos.y, this.faceing));
            return true;
        }

        if (remainingBullet > 0) {
            remainingBullet -= 1;
            let newpos = this.faceing == motionType.LEFT ?
                this.position.plus(new Point(0, PLAYER_SIZE.h / 2)) :
                this.position.plus(new Point(PLAYER_SIZE.w, PLAYER_SIZE.h / 2));
            playerBullets.push(new Bullet(newpos.x, newpos.y, this.faceing));
            return true;
        }
        else {
            return false;
        }
    }
    reset() {
        this.position = PLAYER_INIT_POS;
        this.motion = motionType.NONE;
        this.verticalSpeed = 0;

        this.faceing = motionType.RIGHT;
    }

    collideBullet() {
        if (monsterBullet != null) {
            return intersect(monsterBullet.position.minus(new Point(0.5, 0.5)), new Size(1, 1), this.position, PLAYER_SIZE);

        }
        else {
            return false;
        }
    }

    isShoot() {
        if (this.collideBullet()) {
            die();
        }
    }
}


function detectfreespace() {
    var freeSpaceForMonsterSpown = [];

    let platforms = document.getElementById("platforms");
    let count = 0;
    for (let x = 0; x < SCREEN_SIZE.w - 31; x += MONSTER_SIZE.w / 5) {
        for (let y = 0; y < SCREEN_SIZE.h - 1; y += MONSTER_SIZE.h / 5) {
            // let PlanarObject 
            let block = new PlanarObject(x, y, MONSTER_SIZE.w, MONSTER_SIZE.h);
            let flag = true;

            for (let i = 0; i < platforms.childNodes.length; i++) {
                var node = platforms.childNodes.item(i);
                if (node.nodeName != "rect") continue;

                let x = parseFloat(node.getAttribute("x"));
                let y = parseFloat(node.getAttribute("y"));
                let w = parseFloat(node.getAttribute("width"));
                let h = parseFloat(node.getAttribute("height"));
                let pos = new Point(x, y);
                let size = new Size(w, h);

                if (intersect(block.position, block.boundingBox, pos, size)) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                if (new Point(x, y).L2(player.position) > 100) {
                    freeSpaceForMonsterSpown.push(new Point(x, y));

                }

            }
        }
    }
    let generator = function* () {
        var i = freeSpaceForMonsterSpown.length;
        while (i--) {
            yield freeSpaceForMonsterSpown.splice(Math.floor(Math.random() * (i + 1)), 1)[0];
        }
    };
    return generator();
}


function generateMonster(pos) {
    monsters.push(new Monster(pos.x, pos.y));
}
function generateGoodStuff(pos) {
    goodStuffs.push(new GoodStuff(pos.x, pos.y));
}

function isString(s) {
    return typeof (s) === 'string' || s instanceof String;
}

function promptUserName() {

    userID = getCookie("USERID");
    if (userID===null ||userID=="null" ) {
        console.log("lel");
        userID = "Anonymous";
    }
    userID = prompt("Please enter your name", userID);
    let playerNameNode = document.getElementById("userID");
    setCookie("USERID", userID);

    playerNameNode.innerHTML = userID;
}
// Should be executed after the page is loaded
function load() {
    document.getElementById("intro").style.setProperty("visibility", "hidden", null);

    // Attach keyboard events
    document.addEventListener("keydown", keydown, false);
    document.addEventListener("keyup", keyup, false);

    // Create the player
    player = new Player();

    let it = detectfreespace();
    for (let i = 0; i < numMonster; i++) {
        generateMonster(it.next().value);
    }
    for (let i = 0; i < 8; i++) {
        generateGoodStuff(it.next().value);
    }
    // Start the game interval
    gameInterval = setInterval("gamePlay()", GAME_INTERVAL);
    exit = new Exit();

    let pos = it.next().value;
    portal1 = new Portal(pos.x, pos.y, "portal1");
    pos = it.next().value;
    portal2 = new Portal(pos.x, pos.y, "portal2");
}


//
// This is the keydown handling function for the SVG document
//
function keydown(evt) {
    var keyCode = (evt.keyCode) ? evt.keyCode : evt.getKeyCode();

    switch (keyCode) {
        case "A".charCodeAt(0): {
            player.faceing = motionType.LEFT;

            player.motion = motionType.LEFT;
            break;
        }

        case "D".charCodeAt(0): {
            player.faceing = motionType.RIGHT;
            player.motion = motionType.RIGHT;
            break;
        }

        case "H".charCodeAt(0): {
            player.shoot();

            break;
        }
        case "C".charCodeAt(0): {
            isCheating = true;
            break;
        }
        case "V".charCodeAt(0): {
            isCheating = false;
            break;
        }


        case "W".charCodeAt(0):
            if (player.isOnPlatform()) {
                player.verticalSpeed = JUMP_SPEED;
            }
            break;
    }
}


//
// This is the keyup handling function for the SVG document
//
function keyup(evt) {
    // Get the key code
    var keyCode = (evt.keyCode) ? evt.keyCode : evt.getKeyCode();

    switch (keyCode) {

        case "A".charCodeAt(0): {
            if (player.motion == motionType.LEFT) player.motion = motionType.NONE;
            break;
        }

        case "D".charCodeAt(0): {
            if (player.motion == motionType.RIGHT) player.motion = motionType.NONE;
            break;
        }

        case "H".charCodeAt(0): {
            // TODO: shoot
            break;
        }
        case "C".charCodeAt(0): {
            // TODO: cheat code
            break;
        }
    }
}


//
// This function updates the position and motion of the player in the system
//
function gamePlay() {
    updateMovingPlatform();

    // Check whether the player is on a platform
    var isOnPlatform = player.isOnPlatform();

    // Update player position
    var displacement = new Point();

    // Move left or right
    if (player.motion == motionType.LEFT)
        displacement.x = -MOVE_DISPLACEMENT;
    if (player.motion == motionType.RIGHT)
        displacement.x = MOVE_DISPLACEMENT;

    // Fall
    if (!isOnPlatform && player.verticalSpeed <= 0) {
        displacement.y = -player.verticalSpeed;
        player.verticalSpeed -= VERTICAL_DISPLACEMENT;
    }

    // Jump
    if (player.verticalSpeed > 0) {
        displacement.y = -player.verticalSpeed;
        player.verticalSpeed -= VERTICAL_DISPLACEMENT;
        if (player.verticalSpeed <= 0)
            player.verticalSpeed = 0;
    }

    // Get the new position of the player
    var position = new Point();
    position.x = player.position.x + displacement.x;
    position.y = player.position.y + displacement.y;

    // Check collision with platforms and screen
    player.collideMonsters(position);
    player.collidePlatform(position);
    player.collideScreen(position);

    player.collideGoodStuff(position);
    player.isShoot();



    playerBullets = playerBullets.filter((b) => { return b.update() });
    // monsters.forEach((m) => { m.update() });
    monsters = monsters.filter((m) => { return m.update() });



    // Set the location back to the player object (before update the screen)
    player.position = position;

    if (new Date - lastPortalTime > 500) {
        if (portal1.collidePlayer()) {
            player.position = portal2.position;
            lastPortalTime = new Date();
        }
        
    }
    if (new Date - lastPortalTime > 500) {
        if (portal2.collidePlayer()) {
            player.position = portal1.position;
            lastPortalTime = new Date();
        }
        
    }

    if (exit.collidePlayer() && numGoodStuffCollected >= 8) {
        newLevel();
        return;
    }

    updateScreen();
}


function updateMovingPlatform() {
    if (typeof updateScreen.upward == 'undefined') {
        updateScreen.upward = true;
    }
    let movingPlatforms = document.getElementById("movingPlatform");
    let y = parseFloat(movingPlatforms.getAttribute("y"));

    if (updateScreen.upward) {
        movingPlatforms.setAttribute("y", `${y - 1}`);
        if (y <= 320) {
            updateScreen.upward = !updateScreen.upward;
        }
    } else {
        movingPlatforms.setAttribute("y", `${y + 1}`);
        if (y >= 400) {
            updateScreen.upward = !updateScreen.upward;
        }
    }

}

// in ms
function getRemainingTimeMS() {
    return 60 * 1000 - (new Date() - startTime);
}

function updateText() {
    let node = document.getElementById("score");
    node.innerHTML = `Score: ${score}`;
    node = document.getElementById("magicCircle");
    node.innerHTML = `${numGoodStuffCollected}/8`;

    node = document.getElementById("remainingTime");
    let remainingTime = getRemainingTimeMS() / 1000;
    if(remainingTime<=0 ){
        die();
        return;
    }

    node.innerHTML = `${Math.floor(remainingTime)}`;

    node = document.getElementById("remainingBullet");
    node.innerHTML = `${remainingBullet}`;

    node = document.getElementById("level");
    node.innerHTML = `Level: ${level}`;

    node = document.getElementById("isCheating");
    if (isCheating) {
        node.innerHTML = `cheating`;
    }
    else {
        node.innerHTML = '';
    }



    // id="score"
}

function calScore() {
    score = (score +
        level * 100 +
        getRemainingTimeMS() / 1000 * 1000
    )
}

function restart() {
    console.log("restarting..")
    clearInterval(gameInterval);
    document.getElementById("highscoretable").style.setProperty("visibility", "hidden", null);

    promptUserName();
    score = 0;

    numMonster = 6;
    level = 1;

    player.reset();

    brokenPlatforms.forEach((p) => {
        let platforms = document.getElementById("platforms");
        platforms.appendChild(p);
    })
    brokenPlatforms = [];


    monsters.forEach((m) => m.destruct());
    monsters = [];

    let it = detectfreespace();
    for (let i = 0; i < numMonster; i++) {
        generateMonster(it.next().value);
    }

    goodStuffs.forEach((s) => s.destruct());
    goodStuffs = [];
    for (let i = 0; i < 8; i++) {
        generateGoodStuff(it.next().value);
    }

    playerBullets.forEach((b) => { b.destruct; });
    playerBullets = [];

    numGoodStuffCollected = 0;
    remainingBullet = 8;

    startTime = new Date();
    gameInterval = setInterval("gamePlay()", GAME_INTERVAL);
}

function newLevel() {
    console.log("starting new level..")
    clearInterval(gameInterval);
    calScore();

    numMonster += 4;
    level += 1;

    player.reset();

    brokenPlatforms.forEach((p) => {
        let platforms = document.getElementById("platforms");
        platforms.appendChild(p);
    })
    brokenPlatforms = [];


    monsters.forEach((m) => m.destruct());
    monsters = [];

    let it = detectfreespace();
    for (let i = 0; i < numMonster; i++) {
        generateMonster(it.next().value);
    }

    goodStuffs.forEach((s) => s.destruct());
    goodStuffs = [];
    for (let i = 0; i < 8; i++) {
        generateGoodStuff(it.next().value);
    }

    playerBullets.forEach((b) => { b.destruct; });
    playerBullets = [];

    numGoodStuffCollected = 0;
    remainingBullet = 8;

    startTime = new Date();
    gameInterval = setInterval("gamePlay()", GAME_INTERVAL);

}


//
// This function updates the position of the player's SVG object and
// set the appropriate translation of the game screen relative to the
// the position of the player
//
function updateScreen() {
    // Transform the player
    player.node.setAttribute("transform", "translate(" + player.position.x + "," + player.position.y + ")");

    // Calculate the scaling and translation factors
    if (motionType.LEFT == player.motion) {
        player.svg.setAttribute("transform", `matrix( -1,0,0,1,40,0 )`);
    }
    else if (motionType.RIGHT == player.motion) {
        player.svg.setAttribute("transform", `matrix( 1,0,0,1,0,0 )`);
    }

    updateText();

}


function die() {

    clearInterval(gameInterval);

    let table = getHighScoreTable();
    table.push(new ScoreRecord(userID, score));

    table.sort(
        (_x, _y) => {
            x = _x.score;
            y = _y.score;

            if (x < y) {
                return 1;
            }
            if (x > y) {
                return -1;
            }
            return 0;
        }
    )

    setHighScoreTable(table);
    showHighScoreTable(table);
}
// ====================================================================================================================================================================
// d
// 
// 
// 

// console.log(document.cookie);
// showHighScoreTable();
//
// A score record JavaScript class to store the name and the score of a player
//
function ScoreRecord(name, score) {
    this.name = name;
    this.score = score;
}


//
// This function reads the high score table from the cookies
//
function getHighScoreTable() {
    var table = new Array();

    for (var i = 0; i < 10; i++) {
        // Contruct the cookie name
        let name = `player${i}`

        // Get the cookie value using the cookie name
        let val = getCookie(name)
        // If the cookie does not exist exit from the for loop
        if (!val) {
            break;
        }
        // Extract the name and score of the player from the cookie value
        var res = val.split("~");

        // Add a new score record at the end of the array
        table.push(new ScoreRecord(res[0], parseInt(res[1])))
    }

    return table;
}


//
// This function stores the high score table to the cookies
//
function setHighScoreTable(table) {
    for (var i = 0; i < 10; i++) {
        // If i is more than the length of the high score table exit
        // from the for loop
        if (i >= table.length) break;

        // Contruct the cookie name
        let name = `player${i}`
        // Store the ith record as a cookie using the cookie name
        setCookie(name, `${table[i].name}~${table[i].score}`);


    }
}

//
// Clear the high score table, delete all the cookies
//
function clearHighScoreTable() {
    var highScoreTable = getHighScoreTable();
    for (var i = 0; i < highScoreTable.length; i++) {
        var name = "player" + i;
        deleteCookie(name);
    }
}

//
// This function adds a high score entry to the text node
//
function addHighScore(record, node) {
    // Create the name text span
    var name = document.createElementNS("http://www.w3.org/2000/svg", "tspan");

    // Set the attributes and create the text
    // let text = `${record.name}~${record.score}`; 
    name.textContent = `${record.name}`;
    name.setAttribute("x", 100);
    name.setAttribute("dy", 40);


    // Add the name to the text node
    // name.set = 

    // Create the score text span
    var score = document.createElementNS("http://www.w3.org/2000/svg", "tspan");

    // Set the attributes and create the text
    score.textContent = `${record.score}`;
    score.setAttribute("x", 400);


    // Add the score to the text node
    node.appendChild(name)
    node.appendChild(score)

}


//
// This function shows the high score table to SVG 
//
function showHighScoreTable(table) {
    // Show the table
    var node = document.getElementById("highscoretable");
    console.log(node);
    node.style.setProperty("visibility", "visible", null);

    // Get the high score text node
    var node = document.getElementById("highscoretext");
    node.innerHTML = "";

    for (var i = 0; i < 10; i++) {
        // If i is more than the length of the high score table exit
        // from the for loop
        if (i >= table.length) break;

        // Add the record at the end of the text node
        addHighScore(table[i], node);
    }
}


//
// The following functions are used to handle HTML cookies
//

//
// Set a cookie
//
function setCookie(name, value, expires, path, domain, secure) {
    var curCookie = name + "=" + escape(value) +
        ((expires) ? "; expires=" + expires.toGMTString() : "") +
        ((path) ? "; path=" + path : "") +
        ((domain) ? "; domain=" + domain : "") +
        ((secure) ? "; secure" : "");
    document.cookie = curCookie;
}


//
// Get a cookie
//
function getCookie(name) {
    var dc = document.cookie;
    var prefix = name + "=";
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1) {
        begin = dc.indexOf(prefix);
        if (begin != 0) return null;
    } else
        begin += 2;
    var end = document.cookie.indexOf(";", begin);
    if (end == -1)
        end = dc.length;
    return unescape(dc.substring(begin + prefix.length, end));
}


//
// Delete a cookie
//
function deleteCookie(name, path, domain) {
    if (get_cookie(name)) {
        document.cookie = name + "=" +
            ((path) ? "; path=" + path : "") +
            ((domain) ? "; domain=" + domain : "") +
            "; expires=Thu, 01-Jan-70 00:00:01 GMT";
    }
}
