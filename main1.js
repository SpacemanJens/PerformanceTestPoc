const gameConstants = {
  planetDiameter: 900,
  bulletSpeed: 2,
  bulletDiameter: 10,
  centerX: 500,  // Add center coordinates
  centerY: 500,
  shootingIntervals: {
    'Extreem (0.1s)': 100,
    'Very fast (0.3s)': 300,
    'Fast (0.5s)': 500,
    'Normal (1s)': 1000,
    'Slow (2s)': 2000,
    'Very Slow (3s)': 3000
  }
}

let counter = 0
let xText;

let towerCountSelect; // Add dropdown variable
let shootingIntervalSelect; // Add new dropdown variable
let bulletSpeedSelect;  // <-- new dropdown
let gameObjects = []; // Initialize as empty array

let previousTowerCount; // Store the previous tower count - Declare here

class Flight {
  constructor(config) {
    this.playerNumber = config.playerNumber;
    this.playerName = config.playerName;
    this.x = config.x;
    this.y = config.y;
    this.r = config.r;
    this.xMouse = config.xMouse;
    this.yMouse = config.yMouse;
    this.spawnX = config.spawnX;
    this.spawnY = config.spawnY;
    this.color = config.color;
    this.buls = config.buls || [];
    // Initialize hits array with 15 elements, all set to 0
    this.hits = config.hits || Array(15).fill(0);
    this.rotation = config.rotation;
  }

  draw() {
    this.drawFlight();
    this.drawBullets();
    this.drawScore();
  }

  drawFlight() {
    fill(this.color);
    push();
    imageMode(CENTER);
    translate(this.x, this.y);
    let head = createVector(
      this.xMouse - this.x,
      this.yMouse - this.y,
    ).normalize().heading();
    rotate(head + 1.555);
    rect(-10, -10, 30, 30);
    rect(0, -15, 10, 15);
    pop();
  }

  drawBullets() {
    if (this.buls) {
      this.buls.forEach(bullet => {
        this.drawBullet(bullet);
      });
    }
  }

  drawBullet(bullet) {
    fill('yellow');
    push();
    imageMode(CENTER);
    translate(bullet.x, bullet.y);
    let head = createVector(
      bullet.xMouseStart - bullet.xStart,
      bullet.yMouseStart - bullet.yStart,
    ).normalize().heading();
    rotate(head + 1.555);
    rect(-3, -3, 10, 10);
    pop();
  }

  drawScore() {
    fill(this.color);
    xText += 20;
    let playerHits = 0;
    for (let i = 0; i < this.hits.length; i++) {
      if (i != this.playerNumber) {
        playerHits += this.hits[i];
      }
    }
    let canonHits = 0;
    if (shared.canonTowerHits && this.playerName !== "observer") {
      canonHits = shared.canonTowerHits ? -shared.canonTowerHits[this.playerNumber] : 0;
    }
    text(this.playerName + " (" + playerHits + ", " + canonHits + ")", 1000, xText);
  }

  shoot() {
    let bullet = {
      x: this.x,
      y: this.y,
      xStart: this.x,
      yStart: this.y,
      xMouseStart: mouseX,
      yMouseStart: mouseY
    };
    this.buls.push(bullet);
  }

  moveBullets() {
    for (let i = this.buls.length - 1; i >= 0; i--) {
      let bullet = this.buls[i];
      let bulletVector = createVector(
        int(bullet.xMouseStart) - bullet.xStart,
        int(bullet.yMouseStart) - bullet.yStart,
      ).normalize();
      bullet.x += bulletVector.x * parseInt(shared.bulletSpeed);
      bullet.y += bulletVector.y * parseInt(shared.bulletSpeed);

      if (!onScreen(bullet.x, bullet.y)) {
        this.buls.splice(i, 1);
      }
    }
  }

  syncFromShared(sharedFlight) {
    //        Object.assign(this, sharedFlight);
    this.x = sharedFlight.x;
    this.y = sharedFlight.y;
    this.xMouse = sharedFlight.xMouse;
    this.yMouse = sharedFlight.yMouse;
    this.buls = sharedFlight.buls || [];
    this.hits = sharedFlight.hits || Array(15).fill(0);
    this.rotation = sharedFlight.rotation;
  }
}

class CanonTower {
  constructor(config) {
    this.objectNumber = config.objectNumber;
    this.objectName = config.objectName;
    this.x = config.x;
    this.y = config.y;
    this.r = config.r;
    this.spawnX = config.spawnX;
    this.spawnY = config.spawnY;
    this.color = config.color;
    this.buls = config.buls || [];
    this.hits = config.hits || Array(15).fill(0);
    this.rotation = config.rotation;
    this.angle = 0; // Add angle for movement
    this.amplitude = 50; // Movement range
    this.speed = 0.02; // Movement speed
    this.lastShotTime = 0;  // Add this line
  }

  draw() {
    this.drawCanonTower();
    this.drawBullets();
    this.drawScore();
  }

  move() {
    this.angle += this.speed;
    this.x = this.spawnX + sin(this.angle) * this.amplitude;
    this.y = this.spawnY + cos(this.angle * 0.7) * this.amplitude; // Different speed for y
  }

  drawCanonTower() {
    fill(this.color);
    push();
    imageMode(CENTER);
    translate(this.x, this.y);
    // Fixed: use circle with correct parameters instead of extra argument
    circle(0, 0, 30);
    rect(0, -15, 10, 15);
    pop();
  }

  drawBullets() {
    if (this.buls) {
      this.buls.forEach(bullet => {
        this.drawBullet(bullet);
      });
    }
  }

  drawBullet(bullet) {
    fill('yellow');
    push();
    imageMode(CENTER);
    translate(bullet.x, bullet.y);
    let head = createVector(
      bullet.xMouseStart - bullet.xStart,
      bullet.yMouseStart - bullet.yStart,
    ).normalize().heading();
    rotate(head + 1.555);
    rect(-3, -3, 10, 10);
    pop();
  }

  drawScore() {
    fill(0);
    xText += 30;
    const totalHits = this.hits.reduce((a, b) => a + b, 0);
    text(this.objectName + " (Hits: " + totalHits + ")", 1000, xText);
  }

  findNearestFlight(flights) {
    let nearestFlight = null;
    let minDistance = Infinity;

    flights.forEach(flight => {
      const distance = dist(this.x, this.y, flight.x, flight.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearestFlight = flight;
      }
    });

    return nearestFlight;
  }

  shoot(nearestFlight) {
    if (!nearestFlight) return;

    let bullet = {
      x: this.x,
      y: this.y,
      xStart: this.x,
      yStart: this.y,
      xMouseStart: nearestFlight.x,
      yMouseStart: nearestFlight.y
    };
    this.buls.push(bullet);
  }

  moveBullets() {
    for (let i = this.buls.length - 1; i >= 0; i--) {
      let bullet = this.buls[i];
      let bulletVector = createVector(
        int(bullet.xMouseStart) - bullet.xStart,
        int(bullet.yMouseStart) - bullet.yStart,
      ).normalize();
      bullet.x += bulletVector.x * (parseInt(shared.bulletSpeed) * 2);
      bullet.y += bulletVector.y * (parseInt(shared.bulletSpeed) * 2);

      if (!onScreen(bullet.x, bullet.y)) {
        this.buls.splice(i, 1);
      }
    }
  }

  checkCollisionsWithFlights(flights) {
    for (let i = this.buls.length - 1; i >= 0; i--) {
      let bullet = this.buls[i];

      flights.forEach((flight) => {
        if (flight.x >= 0) {  // Only check visible flights
          let d = dist(flight.x, flight.y, bullet.x, bullet.y);
          if (d < (flight.r + gameConstants.bulletDiameter) / 2) {
            this.hits[flight.playerNumber]++;
            this.buls.splice(i, 1);
          }
        }
      });
    }
  }

  syncFromShared(sharedFlight) {
    Object.assign(this, sharedFlight);
  }
}

// Convert initial flight configs to Flight instances
let flights = [];
const playerColors = ['green', 'blue', 'red', 'yellow', 'purple', 'orange', 'pink', 'brown', 'cyan', 'magenta', 'lime', 'teal', 'lavender', 'maroon', 'olive']

for (let i = 0; i < 15; i++) {
  flights.push(new Flight({
    playerNumber: i,
    playerName: "player" + i,
    x: 500 + i * 10,
    y: 500,
    r: 30,
    xMouse: 0,
    yMouse: 0,
    spawnX: 300 + i * 30,
    spawnY: 300 + i * 30,
    color: playerColors[i % playerColors.length]
  }));
}

let me;
let guests;
let gameState = "PLAYING"; // TITLE, PLAYING
let shared;

function preload() {
  partyConnect("wss://p5js-spaceman-server-29f6636dfb6c.herokuapp.com", "jkv-PerformanceTestPoc");

  shared = partyLoadShared("shared", {
    gameObjects: [],  // Start with empty array
    canonTowerHits: Array(15).fill(0),
    shootingInterval: 'Normal (1s)',  // host shooting interval selection
    bulletSpeed: '3'   // default bullet speed selection (for Flight factor; CanonTower uses double)
  });

  me = partyLoadMyShared({ playerName: "observer" });
  guests = partyLoadGuestShareds();
}

function setup() {
  createCanvas(1200, 1000);

  // Create dropdown for tower count
  towerCountSelect = createSelect();
  towerCountSelect.position(10, 60);
  towerCountSelect.option('3');
  towerCountSelect.option('6');
  towerCountSelect.option('9');
  towerCountSelect.option('12');
  towerCountSelect.option('15');
  towerCountSelect.option('18');

  if (partyIsHost()) {
    towerCountSelect.changed(updateTowerCount);
  }

  // Create dropdown for shooting interval
  shootingIntervalSelect = createSelect();
  shootingIntervalSelect.position(10, 120);
  Object.keys(gameConstants.shootingIntervals).forEach(key => {
    shootingIntervalSelect.option(key);
  });
  shootingIntervalSelect.selected('Normal (1s)');

  // [NEW] Create dropdown for bullet speed option
  bulletSpeedSelect = createSelect();
  bulletSpeedSelect.position(10, 180);
  bulletSpeedSelect.option('2');   // slow
  bulletSpeedSelect.option('3');   // normal
  bulletSpeedSelect.option('4');   // fast
  bulletSpeedSelect.option('5');   // very fast
  bulletSpeedSelect.selected('3');

  if (me.playerName === "observer") {
    joinGame();
    return;
  }

  // Initial tower generation
  if (partyIsHost()) {
    updateTowerCount();
  }
  previousTowerCount = parseInt(towerCountSelect.value()); // Initialize here, after dropdown is created
}

function updateTowerCount() {
  const count = parseInt(towerCountSelect.value());
  gameObjects = generateTowers(count);
  shared.gameObjects = gameObjects.map(tower => ({
    x: tower.x,
    y: tower.y,
    buls: [],
    angle: 0,
    hits: Array(15).fill(0),
    lastShotTime: 0
  }));
}

function generateTowers(count) {
  const towers = [];
  const radius = 200; // Distance from center
  const angleStep = (2 * PI) / count;

  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    const x = gameConstants.centerX + radius * cos(angle);
    const y = gameConstants.centerY + radius * sin(angle);

    towers.push(new CanonTower({
      objectNumber: i,
      objectName: `canonTower${i}`,
      x: x,
      y: y,
      r: 30,
      xMouse: 0,
      yMouse: 0,
      spawnX: x,
      spawnY: y,
      color: 'grey',
    }));
  }
  return towers;
}

function draw() {

  background(200);
  fill('white')
  ellipse(500, 500, gameConstants.planetDiameter)

  fill('black')
  if (partyIsHost()) {
    towerCountSelect.removeAttribute('disabled');
    shootingIntervalSelect.removeAttribute('disabled');
    bulletSpeedSelect.removeAttribute('disabled');  // enable for host
    //  fill('yellow')
    text('I am host', 10, 20);
    // Host: update shared selections so clients see same values
    shared.shootingInterval = shootingIntervalSelect.value();
    shared.bulletSpeed = bulletSpeedSelect.value();
    stepHost();
    const currentTowerCount = parseInt(towerCountSelect.value());
    if (currentTowerCount !== previousTowerCount) {
      updateTowerCount(); // Call updateTowerCount() only when the tower count has changed
      previousTowerCount = currentTowerCount; // Update the previous tower count
    }
  } else {
    towerCountSelect.attribute('disabled', '');
    shootingIntervalSelect.attribute('disabled', '');
    bulletSpeedSelect.attribute('disabled', '');
    // Clients update dropdowns to host's selections
    towerCountSelect.selected()
    shootingIntervalSelect.selected(shared.shootingInterval);
    bulletSpeedSelect.selected(shared.bulletSpeed);
  }
  text(me.playerName, 10, 40);

  if (gameState === "PLAYING") {
    stepLocal();

    if (me.playerName != "observer") {
      moveMe();
      checkCollisions();

    }
    drawGame();

    if (partyIsHost()) {
      gameObjects.forEach((canonTower, index) => {

        canonTower.move();

        const currentTime = millis();
        const selectedInterval = gameConstants.shootingIntervals[shootingIntervalSelect.value()];

        // Check if selectedInterval is a valid number
        if (typeof selectedInterval === 'number') {
          if (currentTime - canonTower.lastShotTime > selectedInterval) {
            const activeFlights = flights.filter(f => f.x >= 0); // Only target visible flights - changed filter

            if (activeFlights.length > 0) {
              const nearestFlight = canonTower.findNearestFlight(activeFlights);

              if (nearestFlight) {
                canonTower.shoot(nearestFlight);
                canonTower.lastShotTime = currentTime;
              }
            }
          }
        } else {
          console.warn("Invalid shooting interval:", shootingIntervalSelect.value());
        }

        canonTower.moveBullets(); // Move bullets before drawing
        canonTower.checkCollisionsWithFlights(flights);  // Add this line

        // Sync to shared state
        shared.gameObjects[index] = {
          ...shared.gameObjects[index],
          x: canonTower.x,
          y: canonTower.y,
          //          buls: JSON.parse(JSON.stringify(canonTower.buls)), // Deep copy
          buls: canonTower.buls, // Deep copyfhg
          angle: canonTower.angle,
          lastShotTime: canonTower.lastShotTime,
          hits: canonTower.hits, // Update shared state to include hits
        };
      });

      // Calculate total hits from canon towers for each player
      let totalCanonHits = Array(15).fill(0);
      gameObjects.forEach(canonTower => {
        for (let i = 0; i < totalCanonHits.length; i++) {
          totalCanonHits[i] += canonTower.hits[i];
        }
      });
      shared.canonTowerHits = totalCanonHits;
    }
    // Clients sync from shared state
    else {
      // Ensure client has same number of towers as host
      while (gameObjects.length < shared.gameObjects.length) {
        const i = gameObjects.length;
        gameObjects.push(new CanonTower({
          objectNumber: i,
          objectName: `canonTower${i}`,
          x: shared.gameObjects[i].x,
          y: shared.gameObjects[i].y,
          r: 30,
          color: 'grey',
          spawnX: shared.gameObjects[i].x,
          spawnY: shared.gameObjects[i].y
        }));
      }
      // Remove extra towers if host has fewer
      while (gameObjects.length > shared.gameObjects.length) {
        gameObjects.pop();
      }
      // Update existing towers
      gameObjects.forEach((canonTower, index) => {
        canonTower.x = shared.gameObjects[index].x;
        canonTower.y = shared.gameObjects[index].y;
        canonTower.buls = shared.gameObjects[index].buls;
        canonTower.angle = shared.gameObjects[index].angle;
        canonTower.lastShotTime = shared.gameObjects[index].lastShotTime; // Sync lastShotTime
        canonTower.hits = shared.gameObjects[index].hits || Array(15).fill(0);
      });
    }

    // Draw Canon Towers for all players
    gameObjects.forEach(canonTower => {
      canonTower.drawCanonTower();
      canonTower.drawBullets();
      canonTower.drawScore();
    });
  }
}

function stepHost() {
}

function moveMe() {
  let offSetX = 0;
  let offSetY = 0;
  if (keyIsDown(70)) { offSetX = -3 } // F
  if (keyIsDown(72)) { offSetX = 3 } // H
  if (keyIsDown(84)) { offSetY = -3 } // T
  if (keyIsDown(71)) { offSetY = 3 } // G

  xTemp = me.x + offSetX;
  yTemp = me.y + offSetY;

  if (onScreen(xTemp, yTemp)) {
    me.x = xTemp;
    me.y = yTemp;
  }

  me.xMouse = mouseX;
  me.yMouse = mouseY;

  const myFlight = flights.find(f => f.playerName === me.playerName);
  if (myFlight) {
    myFlight.x = me.x;
    myFlight.y = me.y;
    myFlight.xMouse = me.xMouse;
    myFlight.yMouse = me.yMouse;
    myFlight.buls = me.buls;
    myFlight.moveBullets();
    me.buls = myFlight.buls;
  }
}

function checkCollisions() {

  flights.forEach((flight) => {
    if (flight.playerName != me.playerName) {
      checkCollisionsWithFlight(flight);
    }
  });

}
function checkCollisionsWithFlight(flight) {

  for (let i = me.buls.length - 1; i >= 0; i--) {

    let bullet = me.buls[i];

    let d = dist(flight.x, flight.y, bullet.x, bullet.y);

    if (d < (flight.r + gameConstants.bulletDiameter) / 2) {
      me.hits[flight.playerNumber]++;
      me.buls.splice(i, 1);
    }
  }
}

function onScreen(x, y) {
  return dist(500, 500, x, y) < gameConstants.planetDiameter / 2;
}
function stepLocal() {

  flights.forEach(flight => {
    const guest = guests.find((p) => p.playerName === flight.playerName);
    if (guest) {
      flight.syncFromShared(guest);
    } else {
      flight.x = -32;
    }
  });
}

function mousePressed() {

  if (me.playerName === "observer")
    return

  const myFlight = flights.find(f => f.playerName === me.playerName);
  if (myFlight) {
    myFlight.shoot();
    me.buls = myFlight.buls;
  }
}

function drawGame() {
  xText = 0
  flights.forEach((flight) => {
    flight.draw();
  });
}

function joinGame() {

  // don't let current players double join
  if (me.playerName.startsWith("player")) return;
  for (let flight of flights) {
    if (!guests.find((p) => p.playerName === flight.playerName)) {
      spawn(flight);
      me.playerName = flight.playerName;
      return;
    }
  }
}

function watchGame() {
  me.playerName = "observer";
}

function spawn(flight) {
  me.playerNumber = flight.playerNumber;
  me.playerName = flight.playerName;
  me.x = flight.spawnX;
  me.y = flight.spawnY;
  me.r = flight.r
  me.rotation = flight.rotation;
  me.color = flight.color;
  me.buls = [];
  // Initialize hits array with 15 elements, all set to 0
  me.hits = Array(15).fill(0);
}