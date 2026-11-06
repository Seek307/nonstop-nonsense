// Find the game canvas in our HTML
const canvas = document.getElementById("game-canvas");

// Get the 2D drawing context
const ctx = canvas.getContext("2d");

// Find our game controls
const startButton = document.getElementById("start-button");
const scoreDisplay = document.getElementById("score-display");

// Find our additional game displays
const highScoreDisplay = document.getElementById("high-score-display");
const gameStatus = document.getElementById("game-status");

// Audio elements
const gameMusic = document.getElementById("game-music");

const flapSound = document.getElementById("flap-sound");
const scoreSound = document.getElementById("score-sound");
const gameOverSound = document.getElementById("game-over-sound");
const highScoreSound = document.getElementById("high-score-sound");

// Audio controls
const musicVolume = document.getElementById("music-volume");
const sfxVolume = document.getElementById("sfx-volume");
const musicMuteButton = document.getElementById("music-mute-button");

// Audio settings
let musicMuted = false;
let currentMusicVolume = Number(musicVolume.value);
let currentSfxVolume = Number(sfxVolume.value);

gameMusic.volume = 0;

let musicShouldPlay = false;

// Play a sound effect
function playSound(sound) {
  sound.currentTime = 0;
  sound.volume = currentSfxVolume;
  sound.play();
}

// Fade background music
let musicFadeInterval;

function fadeMusic(targetVolume, duration, pauseWhenFinished = false) {
  clearInterval(musicFadeInterval);

  const startVolume = gameMusic.volume;
  const volumeChange = targetVolume - startVolume;
  const steps = 30;
  const stepDuration = duration / steps;

  let step = 0;

  musicFadeInterval = setInterval(() => {
    step++;

    gameMusic.volume = Math.max(
      0,
      Math.min(1, startVolume + volumeChange * (step / steps))
    );

    if (step >= steps) {
      clearInterval(musicFadeInterval);
      gameMusic.volume = targetVolume;

      if (pauseWhenFinished) {
          gameMusic.pause();
      }
    }
  }, stepDuration);
}

function startGameMusic() {
  musicShouldPlay = true;

  clearInterval(musicFadeInterval);

  gameMusic.currentTime = 0;
  gameMusic.volume = 0;

  gameMusic.play().then(() => {
    fadeMusic(
      musicMuted ? 0 : currentMusicVolume,
      1000
    );
  });
}

function stopGameMusic() {
  musicShouldPlay = false;
  fadeMusic(0, 1000, true);
}

// Store the canvas dimensions
const gameWidth = canvas.width;
const gameHeight = canvas.height;

// Find Cole's sprite
const coleImage = new Image();
coleImage.onload = () => {
  drawGame();
};

coleImage.src = "../assets/images/cole.png";

// Cole's starting properties
let cole = {
  x: 150,
  y: 250,
  radius: 18,
  velocityY: 0,
  angle: 0
};

// Physics settings
const gravity = 0.4;
const flapStrength = -7;

// Obstacle settings
const obstacleWidth = 70;
const obstacleGap = 160;
const obstacleSpeed = 3;
const obstacleSpawnRate = 110;

// Cloud settings
let clouds = [
  { x: 100, y: 90, scale: 1.2, speed: 0.4 },
  { x: 400, y: 150, scale: 0.9, speed: 0.25 },
  { x: 700, y: 70, scale: 1.4, speed: 0.35 }
];

// Store all active obstacles
let obstacles = [];

// Track time between obstacle spawns
let obstacleTimer = 0;

// Ground settings
const groundHeight = 40;

// Track the current game state
let gameStarted = false;
let gameOver = false;

// Track the player's score
let score = 0;

// Load the saved high score from the browser
let highScore = Number(localStorage.getItem("flappyColeHighScore")) || 0;
let beatHighScoreThisRun = false;

// Display the saved high score
highScoreDisplay.textContent = `Best: ${highScore}`;

function updateGame() {

  // Apply gravity to Cole's vertical velocity
  cole.velocityY += gravity;

  // Update Cole's vertical position
  cole.y += cole.velocityY;

  // Calculate Cole's tilt
  const targetAngle = Math.max(
    -0.25,
    Math.min(1.2, cole.velocityY * 0.08)
  );

  cole.angle += (targetAngle - cole.angle) * 0.3;

  // Check whether Cole hits the ceiling or ground
  if (
    cole.y <= 0 ||
    cole.y + cole.radius >= gameHeight - groundHeight
  ) {
    endGame();
  }

  // Stop updating if Cole has crashed
  if (gameOver) {
    return;
  }

  // Update our clouds
  updateClouds();

  // Update our obstacles
  updateObstacles();

}

function endGame() {

  // Mark the game as over
  gameOver = true;
  gameStarted = false;

  // Update the game status
  gameStatus.textContent = "Game Over!";

  // Update the button
  startButton.textContent = "Play Again";

  playSound(gameOverSound);
  stopGameMusic();

}

function gameLoop() {

  // Stop if the game has ended
  if (gameOver) {
    return;
  }

  // Update the game's logic
  updateGame();

  // Draw the updated game scene
  drawGame();

  // Continue only if the game is still running
  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  }

}

function flap() {

  // Can't flap if game's over
  if (!gameStarted || gameOver) {
    return;
  }

  playSound(flapSound);

  // Give Cole an upward boost
  cole.velocityY = flapStrength;

}

function drawGame() {

  // Clear the previous frame
  ctx.clearRect(0, 0, gameWidth, gameHeight);

  // Draw the sky
  const skyGradient = ctx.createLinearGradient(
    0, 0, 0, gameHeight
  );

  skyGradient.addColorStop(0, "#87ceeb");
  skyGradient.addColorStop(1, "#d5f3ff");

  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, gameWidth, gameHeight);

  // Draw the clouds
  drawClouds();

  // Draw the obstacles
  drawObstacles();

  // Draw the ground
  ctx.fillStyle = "#78a84b";
  ctx.fillRect(
    0,
    gameHeight - groundHeight,
    gameWidth,
    groundHeight
  );

  // Ground texture
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";

  for (let x = 10; x < gameWidth; x += 70) {
    ctx.beginPath();
    ctx.ellipse(
      x,
      gameHeight - 20,
      20,
      6,
      10,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Draw Cole
  if (coleImage.complete && coleImage.naturalWidth > 0) {
    ctx.save();

    ctx.translate(cole.x, cole.y);
    ctx.rotate(cole.angle);

    ctx.drawImage(
      coleImage,
      -45,
      -30,
      90,
      60
    );

    ctx.restore();
  }
}

function createObstacle() {

  // Calculate the available vertical space
  const groundTop = gameHeight - groundHeight;

  // Choose a random vertical position for the gap
  const minGapY = 100;
  const maxGapY = groundTop - 100;

  const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

  // Create the obstacle
  const obstacle = {
    x: gameWidth,
    gapY: gapY,
    passed: false
  };

  // Add it to our obstacle array
  obstacles.push(obstacle);
}

function checkPipeCollision(obstacle) {

  // Find the boundaries of the opening
  const gapTop = obstacle.gapY - obstacleGap / 2;
  const gapBottom = obstacle.gapY + obstacleGap / 2;

  // Account for the obstacle caps
  const obstacleLeft = obstacle.x - 5;
  const obstacleRight = obstacle.x + obstacleWidth + 5;

  // Check whether Cole overlaps the obstacle horizontally
  const horizontalCollision =
    cole.x + cole.radius > obstacleLeft &&
    cole.x - cole.radius < obstacleRight;
  
  // Check whether Cole is outside the opening vertically
  const verticalCollision =
    cole.y - cole.radius < gapTop ||
    cole.y + cole.radius > gapBottom;

  // Return true if both conditions are met
  return horizontalCollision && verticalCollision;

}

function drawObstacles() {

  for (let i = 0; i < obstacles.length; i++) {

    const obstacle = obstacles[i];

    // Calculate the top and bottom of the opening
    const gapTop = obstacle.gapY - obstacleGap / 2;
    const gapBottom = obstacle.gapY + obstacleGap / 2;

    // Calculate the ground's position
    const groundTop = gameHeight - groundHeight;

    // Draw the upper obstacle
    ctx.fillStyle = "#78a84b";
    ctx.fillRect(
      obstacle.x,
      0,
      obstacleWidth,
      gapTop
    );

    // Draw the lower obstacle
    ctx.fillRect(
      obstacle.x,
      gapBottom,
      obstacleWidth,
      groundTop - gapBottom
    );

    // Outline both obstacles
    ctx.strokeStyle = "#426b2d";
    ctx.lineWidth = 3;

    ctx.strokeRect(
      obstacle.x,
      -2,
      obstacleWidth,
      gapTop + 2
    );

    ctx.strokeRect(
      obstacle.x,
      gapBottom,
      obstacleWidth,
      groundTop - gapBottom
    );

    // Draw small caps on the obstacles
    ctx.fillStyle = "#9bc76a";

    ctx.fillRect(
      obstacle.x - 5,
      gapTop - 15,
      obstacleWidth + 10,
      15
    );

    ctx.fillRect(
      obstacle.x - 5,
      gapBottom,
      obstacleWidth + 10,
      15
    );
  }

}

function updateObstacles() {

  // Count frames until the next obstacle
  obstacleTimer++;

  // Generate a new obstacle when the timer expires
  if (obstacleTimer >= obstacleSpawnRate) {

    createObstacle();

    obstacleTimer = 0;

  }

  // Update every obstacle
  for (let i = 0; i < obstacles.length; i++) {

    const obstacle = obstacles[i];

    // Move the obstacle to the left
    obstacle.x -= obstacleSpeed;

    // Check for a collision
    if (checkPipeCollision(obstacle)) {

      endGame();
      return;

    }

    // Check whether Cole has passed this obstacle
    if (
      !obstacle.passed &&
      obstacle.x + obstacleWidth < cole.x
    ) {

      obstacle.passed = true;

      // Award a point
      score++;

      // Update the current score
      scoreDisplay.textContent = `Score: ${score}`;

      // Check for a new personal best
      if (score > highScore) {

        // Update the high score
        highScore = score;

        // Save the new record
        localStorage.setItem("flappyColeHighScore", highScore);

        // Update the high score display
        highScoreDisplay.textContent = `Best: ${highScore}`;

        // Celebrate the new record
        if (!beatHighScoreThisRun) {
        gameStatus.textContent = "NEW PERSONAL BEST!";
        beatHighScoreThisRun = true;
        playSound(highScoreSound);
        } else {
          playSound(scoreSound);
        }

      } else {
          playSound(scoreSound);
      }

    }

  }

  // Remove obstacles that have left the screen
  obstacles = obstacles.filter(function(obstacle) {

    return obstacle.x + obstacleWidth > 0;

  });

}

function updateClouds() {
  clouds.forEach(cloud => {
    cloud.x -= cloud.speed;

    if (cloud.x < -100) {
      cloud.x = gameWidth + 100;
    }
  });
}

function drawClouds() {
  clouds.forEach(cloud => {
    ctx.save();

    ctx.translate(cloud.x, cloud.y);
    ctx.scale(cloud.scale, cloud.scale);

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"

    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.arc(20, -10, 25, 0, Math.PI * 2);
    ctx.arc(45, 0, 20, 0, Math.PI * 2);
    ctx.arc(22, 8, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

// Start or restart the game
startButton.addEventListener("click", function() {

  // Prevent multiple game loops
  if (gameStarted) {
    return;
  }

  // Reset Cole's position and movement
  cole.y = 250;
  cole.velocityY = 0;
  cole.angle = 0;

  // Clear existing obstacles
  obstacles = [];

  // Reset the obstacle timer
  obstacleTimer = 0;

  // Reset the game state
  gameOver = false;
  gameStarted = true;

  // Start music
  startGameMusic();

  // Reset the player's score
  score = 0;
  beatHighScoreThisRun = false;

  // Reset the interface
  scoreDisplay.textContent = "Score: 0";
  gameStatus.textContent = "Playing...";
  startButton.textContent = "Playing...";

  // Start the game loop
  gameLoop();

});

// Flap when the player clicks the game area
canvas.addEventListener("pointerdown", flap);

// Flap when the player presses Space
window.addEventListener("keydown", function(event) {

  if (event.code === "Space") {

    // Prevent the browser from scrolling
    event.preventDefault();

    // Make Cole flap
    flap();

  }

});

// Music volume slider
musicVolume.addEventListener("input", () => {
  currentMusicVolume = Number(musicVolume.value);

  if (!musicMuted && musicShouldPlay) {
    gameMusic.volume = currentMusicVolume;
  }
});

// Sound effects volume slider
sfxVolume.addEventListener("input", () => {
  currentSfxVolume = Number(sfxVolume.value);
});

// Music mute button
musicMuteButton.addEventListener("click", () => {
  musicMuted = !musicMuted;

  if (musicMuted) {
    gameMusic.volume = 0;
    musicMuteButton.textContent = "Unmute";
  } else {
    gameMusic.volume = musicShouldPlay
      ? currentMusicVolume
      : 0;

    musicMuteButton.textContent = "Mute";
  }
});

// Draw the initial game scene
drawGame();

