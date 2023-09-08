var raf = require('./raf');
var rng = require('./rng');
var input = require('./input');

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

var colors = [
  '#7FDBFF', '#0074D9', '#01FF70', '#001F3F', '#39CCCC',
  '#3D9970', '#2ECC40', '#FF4136', '#85144B', '#FF851B',
  '#B10DC9', '#FFDC00', '#F012BE',
];

var hordeSpeed = 100;

var state;
var gameOverMessage;
var rand;
var supplyLinesCount;
var hordeStrength;
var balls;
var supplyLines;
var soldiers;
var mainBall;
var year;
var city;

function start() {
  state = 'running';
  gameOverMessage = '';
  rand = rng(1);
  supplyLinesCount = 4;
  hordeStrength = 0;
  balls = [];
  supplyLines = [];
  soldiers = [];
  year = 1200;

  balls.push({
    x: canvas.width * 0.75,
    y: canvas.height * 0.75,
    radius: 15,
    dx: 0,
    dy: 0,
    color: rand.pick(colors),
    cooldown: Math.random()
  });

  for (var i = 0; i < 49; i++) {
    balls.push({
      x: canvas.width * 0.75 + rand.int(canvas.width),
      y: canvas.height / 2  + rand.int(canvas.height / 2),
      radius: 10,
      dx: 0,
      dy: 0,
      color: rand.pick(colors),
      cooldown: -1
    });
  }

  hordeStrength = balls.length * 10;

  for (var i = 0; i < supplyLinesCount; i++) {
    supplyLines.push({
      x: rand.int(canvas.width),
      y: rand.int(canvas.height / 2),
      radius: 20,
      dx: Math.random() * hordeSpeed / 2,
      dy: Math.random() * hordeSpeed / 2,
      color: '#FF0000',
      cooldown: Math.random()
    });
  }

  for (var i = 0; i < 15; i++) {
    soldiers.push({
      x: rand.int(canvas.width),
      y: rand.int(canvas.height / 2),
      radius: 15,
      dx: Math.random() * hordeSpeed / 2,
      dy: Math.random() * hordeSpeed / 2,
      color: '#00FF00',
      cooldown: Math.random()
    });
    if (i < supplyLinesCount){
      soldiers[i].supplyLine = supplyLines[i];
    }
  }
  mainBall = balls[0];
  mainBall.dx = -hordeSpeed;

  city = {
    x: canvas.width * 0.5,
    y: canvas.height * 0.25,
    radius: 30
  }
}

raf.start(function(elapsed) {
  // Clear the screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state === 'title') {
    drawTitle(ctx);
    return;
  }

  if (state === 'running') {
    year += (elapsed * 0.4);
    if (year > 1299) {
      gameOver('The XIII century is over.');
    }
  }

  // Update each balls
  for (var j = 0; j < balls.length; j++) {
    var ball = balls[j];
    if (ball === mainBall && state === 'running') {
      if (input.isDown("ArrowLeft")) {
        ball.dy = 0;
        ball.dx = -hordeSpeed;
      } else if (input.isDown("ArrowRight")) {
        ball.dy = 0;
        ball.dx = hordeSpeed;
      } else if (input.isDown("ArrowUp")) {
        ball.dx = 0;
        ball.dy = -hordeSpeed;
      } else if (input.isDown("ArrowDown")) {
        ball.dx = 0;
        ball.dy = hordeSpeed;
      }
    } else {
      if (ball.cooldown < 0) {
        // Walk towards main ball
        var angle = Math.atan2(mainBall.y - ball.y, mainBall.x - ball.x);
        if (state === 'gameOver') {
          angle = Math.random() * Math.PI * 2;
        }
        ball.dx = hordeSpeed * Math.cos(angle) * 0.9;
        ball.dy = hordeSpeed * Math.sin(angle) * 0.9;
        var rando = Math.random();
        ball.dx = ball.dx * (1 + rando * 0.3);
        ball.dy = ball.dy * (1 + rando * 0.3);
        for (var i = 0; i < balls.length; i++) {
          var ball2 = balls[i];
          if (ball2 === ball)
            break;
          if (Math.abs(ball.x - ball2.x) <= ball.radius * 2 && Math.abs(ball.y - ball2.y) <= ball.radius * 2) {
            //angle = Math.random() * Math.PI * 2;
            angle = (angle - Math.PI / 4) + Math.random() * (Math.PI / 2);
            ball.dx = hordeSpeed * Math.cos(angle) * 0.9;
            ball.dy = hordeSpeed * Math.sin(angle) * 0.9;
            break;
          };   
        }
        ball.cooldown = 0.5 + Math.random() * 0.5;
      } else {
        ball.cooldown -= elapsed;
      }
    }

    // Handle collision against the canvas's edges
    if (ball.x - ball.radius < 0 && ball.dx < 0 || ball.x + ball.radius > canvas.width && ball.dx > 0) ball.dx = -ball.dx * 0.7;
    if (ball.y - ball.radius < 0 && ball.dy < 0 || ball.y + ball.radius > canvas.height && ball.dy > 0) ball.dy = -ball.dy * 0.7;

    // Update ball position
    ball.x += ball.dx * elapsed;
    ball.y += ball.dy * elapsed;

    if (ball.radius <= 3) {
      if (state === 'running') {
        hordeStrength -= ball.radius;
      }
      balls.splice(j, 1);
      j--;
      if (ball === mainBall) {
        gameOver('Batu Khan is dead.');
      }
      continue;
    }

    // Render the ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = ball.color;
    ctx.fill();
  }

  for (var j = 0; j < supplyLines.length; j++) {
    var supplyLine = supplyLines[j];
    if (supplyLine.cooldown < 0) {
      // Change direction
      var angle = Math.random() * Math.PI * 2;
      supplyLine.dx = hordeSpeed * Math.cos(angle) * 0.1;
      supplyLine.dy = hordeSpeed * Math.sin(angle) * 0.1;
      var rando = Math.random();
      supplyLine.dx = supplyLine.dx * (1 + rando * 0.3);
      supplyLine.dy = supplyLine.dy * (1 + rando * 0.3);
      supplyLine.cooldown = 5 + Math.random();
    } else {
      supplyLine.cooldown -= elapsed;
    }

    for (var i = 0; i < balls.length; i++) {
      var ball = balls[i];
      if (Math.abs(ball.x - supplyLine.x) <= supplyLine.radius * 2
       && Math.abs(ball.y - supplyLine.y) <= supplyLine.radius * 2 && Math.random() > 0.7) {
        supplyLine.radius -= 0.1;
      };
    }
    if (supplyLine.radius < 3) {
      supplyLinesCount--;
      supplyLines.splice(j, 1);
      j--;
      continue;
    }

    // Handle collision against the canvas's edges
    if (supplyLine.x - supplyLine.radius < 0 && supplyLine.dx < 0 || supplyLine.x + supplyLine.radius > canvas.width && supplyLine.dx > 0) supplyLine.dx = -supplyLine.dx * 0.7;
    if (supplyLine.y - supplyLine.radius < 0 && supplyLine.dy < 0 || supplyLine.y + supplyLine.radius > canvas.height && supplyLine.dy > 0) supplyLine.dy = -supplyLine.dy * 0.7;

    // Update ball position
    supplyLine.x += supplyLine.dx * elapsed;
    supplyLine.y += supplyLine.dy * elapsed;

    // Render the ball
    ctx.beginPath();
    ctx.arc(supplyLine.x, supplyLine.y, supplyLine.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = supplyLine.color;
    ctx.fill();
  };

  
  soldiers.forEach(function(soldier) {
    if (soldier.cooldown < 0) {
      // Change direction
      var angle;
      if (soldier.supplyLine) {
        angle = Math.atan2(soldier.supplyLine.y - soldier.y, soldier.supplyLine.x - soldier.x);
      } else {
        angle = Math.random() * Math.PI * 2;
      }
      soldier.dx = hordeSpeed * Math.cos(angle) * 0.2;
      soldier.dy = hordeSpeed * Math.sin(angle) * 0.2;
      var rando = Math.random();
      soldier.dx = soldier.dx * (1 + rando * 0.3);
      soldier.dy = soldier.dy * (1 + rando * 0.3);
      soldier.cooldown = 3 + Math.random();
  } else {
    soldier.cooldown -= elapsed;
  }

  for (var i = 0; i < balls.length; i++) {
    var ball = balls[i];
    if (Math.abs(ball.x - soldier.x) <= soldier.radius * 2
     && Math.abs(ball.y - soldier.y) <= soldier.radius * 2 && Math.random() > 0.7) {
      ball.radius -= 0.2;
      if (state === 'running') {
        hordeStrength -= 0.2;
      }
      if (hordeStrength < 100) {
        gameOver('The horde disbands')
      }
    };
  }

  // Handle collision against the canvas's edges
  if (soldier.x - soldier.radius < 0 && soldier.dx < 0 || soldier.x + soldier.radius > canvas.width && soldier.dx > 0) soldier.dx = -soldier.dx * 0.7;
  if (soldier.y - soldier.radius < 0 && soldier.dy < 0 || soldier.y + soldier.radius > canvas.height && soldier.dy > 0) soldier.dy = -soldier.dy * 0.7;

  // Update ball position
  soldier.x += soldier.dx * elapsed;
  soldier.y += soldier.dy * elapsed;

  // Render the ball
  ctx.beginPath();
  ctx.arc(soldier.x, soldier.y, soldier.radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = soldier.color;
  ctx.fill();
});

for (var i = 0; i < balls.length; i++) {
  var ball = balls[i];
  if (supplyLinesCount === 0 &&
    Math.abs(ball.x - city.x) <= city.radius * 2 &&
    Math.abs(ball.y - city.y) <= city.radius * 2 && Math.random() > 0.7
  ) {
    city.radius -= 0.1;
  }
}
if (city.radius < 3) {
  gameOver('You have invaded Ryazan!')
}

if (supplyLinesCount > 0) {
  ctx.beginPath();
  ctx.arc(city.x, city.y, city.radius + 5, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = '#ff00ff';
  ctx.fill();
}

  ctx.beginPath();
  ctx.arc(city.x, city.y, city.radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = '#0000ff';
  ctx.fill();


  ctx.fillStyle = '#000000';
  ctx.font = "24px Georgia";
  ctx.fillText("Supply Lines: " + supplyLinesCount, 10, 30);
  ctx.fillText("Horde Strength: " + Math.floor(hordeStrength), 10, 80);
  ctx.fillText("Year: " + Math.floor(year), 300, 30);
  if (state === 'gameOver') {
    ctx.fillText(gameOverMessage, 10, 140);
    ctx.fillText('Press [Enter to restart]', 10, 190);
    
  }
  
});


function gameOver (message) {
  if (state === 'gameOver') {
    return;
  }
  state = 'gameOver';
  gameOverMessage = message;
}

input.typed('Enter', function () {
  if (state === 'gameOver') {
    state = 'title';
  } else if (state === 'title') {
    start();
  }
});

function drawTitle (ctx) {
  ctx.fillStyle = '#000000';
  ctx.font = "48px Georgia";
  ctx.fillText("The first horde", 10, 60);
  ctx.font = "32px Georgia";
  ctx.fillText("Use the cursor keys to guide your horde.", 10, 120);
  ctx.fillText("Avoid the Rus army (green dots) if possible.", 10, 160);
  ctx.fillText("Destroy the supply lines (red dots) to weaken the", 10, 200);
  ctx.fillText("defenses of Ryazan.", 10, 240);
  ctx.fillText("Raid the city, Ryazan, to win.", 10, 320);
  ctx.fillText("An entry for js13k 2023 by slashie and stoltverd", 10, 400);
  ctx.fillText("Press [Enter] to start", 10, 480);
}

state = 'title';