var raf = require('./raf');
var rng = require('./rng');
var input = require('./input');

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

var colors = [
  '#632F27', '#C35A51', '#FF4700', '#FF794B', '#FFC945'
]

var landColors = [
  '#a0e768',
  '#b6e353',
  '#837d4a',
  '#a2fb75',
  '#c7be60'
]

var levels = [
  { cityName: 'Ryazan', size: 20, lines: 2, soldiers: 9, forests: 6 },
  { cityName: 'Kolomna', size: 25, lines: 3, soldiers: 8, forests: 4 },
  { cityName: 'Moscow', size: 10, lines: 3, soldiers: 15, forests: 8 },
  { cityName: 'Vladimir', size: 30, lines: 4, soldiers: 10, forests: 7},
  { cityName: 'Suzdal', size: 10, lines: 3, soldiers: 15, forests: 10 },
  { cityName: 'Tver', size: 20, lines: 3, soldiers: 15, forests: 6 },
  { cityName: 'Kostroma', size: 60, lines: 3, soldiers: 10, forests: 8 },
  { cityName: 'Kiev', size: 30, lines: 2, soldiers: 10, forests: 10 }
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
var forests;
var mainBall;
var year;
var city;
var round;
var roundWon;
var currentCityName;
var bgColor = '#a0e768';
var score;

function start() {
  state = 'running';
  gameOverMessage = '';
  rand = rng(1);
  hordeStrength = 0;
  score = 0;
  year = 1200;
  round = -1;
  bgColor = '#a0e768';
  nextRound();
}

raf.start(function(elapsed) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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

  forests.forEach(function(forest) {
    ctx.beginPath();
    ctx.arc(forest.x, forest.y, forest.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = forest.color;
    ctx.fill();
  });

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
        // Walk towards leader
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

    var bdx = ball.dx;
    var bdy = ball.dy;
    for (var k = 0; k < forests.length; k++) {
      var forest = forests[k];
      if (Math.abs(ball.x - forest.x) <= ball.radius * 2 && Math.abs(ball.y - forest.y) <= ball.radius * 2) {
        bdx *= 0.3;
        bdy *= 0.3;
        break;
      }
    }
    ball.x += bdx * elapsed;
    ball.y += bdy * elapsed;
    if (ball.radius <= 3) {
      if (state === 'running') {
        hordeStrength -= ball.radius;
      }
      balls.splice(j, 1);
      j--;
      if (ball === mainBall) {
        gameOver('The Khan is dead.');
      }
      continue;
    }

    // Render the ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = ball.color;
    ctx.fill();
    if (ball === mainBall) {
      ctx.fillStyle = '#000000';
      ctx.font = "24px Georgia";
      ctx.fillText("♠", ball.x, ball.y + 8);
    }
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
    ctx.arc(supplyLine.x, supplyLine.y, supplyLine.radius + 5, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(supplyLine.x, supplyLine.y, supplyLine.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = bgColor;
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = "24px Georgia";
    ctx.fillText("♟︎", supplyLine.x, supplyLine.y + 8);
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
      ball.radius -= 0.1;
      if (state === 'running') {
        hordeStrength -= 0.1;
      }
      if (hordeStrength <= 0) {
        hordeStrength = 0;
        gameOver('The horde disbands')
      }
    };
  }

  if (soldier.x - soldier.radius < 0 && soldier.dx < 0 || soldier.x + soldier.radius > canvas.width && soldier.dx > 0) soldier.dx = -soldier.dx * 0.7;
  if (soldier.y - soldier.radius < 0 && soldier.dy < 0 || soldier.y + soldier.radius > canvas.height && soldier.dy > 0) soldier.dy = -soldier.dy * 0.7;

  soldier.x += soldier.dx * elapsed;
  soldier.y += soldier.dy * elapsed;
  ctx.fillStyle = '#000000';
  ctx.font = "24px Georgia";
  ctx.fillText("♞", soldier.x - soldier.radius, soldier.y - soldier.radius);
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
if (city.radius < 3 && state === 'running') {
  roundWon = true;
  score += Math.floor(hordeStrength);
  gameOver('You have invaded ' + currentCityName + '!');
}

if (supplyLinesCount > 0) {
  ctx.beginPath();
  ctx.arc(city.x, city.y, city.radius + 5, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = '#000000';
  ctx.fill();
}

  ctx.beginPath();
  ctx.arc(city.x, city.y, city.radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = supplyLinesCount > 0 ? bgColor : '#000000';
  ctx.fill();

  if (city.radius >= 3) {
    ctx.fillStyle = supplyLinesCount > 0 ? '#000000' : bgColor;
    ctx.font = "24px Georgia";
    ctx.fillText("♜", city.x, city.y + 8);
  }

  ctx.fillStyle = '#000000';
  ctx.font = "24px Georgia";
  ctx.textAlign = 'left';
  ctx.fillText("Supply Lines: " + supplyLinesCount, 10, 530);
  ctx.fillText("Horde Strength: " + Math.floor(hordeStrength), 10, 580);
  ctx.textAlign = 'right';
  ctx.fillText("Round: " + (round + 1), 780, 530);
  ctx.fillText("Score: " + (score), 780, 580);
  ctx.textAlign = 'center';
  ctx.fillText("Year " + Math.floor(year), canvas.width / 2, 580);
  if (state === 'gameOver') {
    ctx.fillText(gameOverMessage, canvas.width / 2, 40);
    if (roundWon) {
      ctx.fillText('Press [Enter to raid on]', canvas.width / 2, 90);
    } else {
      ctx.fillText('Press [Enter to restart]', canvas.width / 2, 90);
    }
  }
  ctx.font = "16px Georgia";
  ctx.textAlign = 'center';
  ctx.fillText(currentCityName, canvas.width / 2, canvas.height * 0.25 + 50);
  
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
    if (roundWon) {
      nextRound();
    } else {
      state = 'title';
    }
  } else if (state === 'title') {
    start();
  }
});

function drawTitle (ctx) {
  ctx.fillStyle = '#000000';
  ctx.font = "48px Georgia";
  ctx.textAlign = 'left';
  ctx.fillText("The First Horde", 10, 60);
  ctx.font = "32px Georgia";
  ctx.fillText("Use the cursor keys to guide your horde.", 10, 120);
  ctx.fillText("Avoid the Rus army (♞) if possible.", 10, 160);
  ctx.fillText("Destroy the supply lines (♟︎) to weaken the", 10, 200);
  ctx.fillText("defenses of the cities.", 10, 240);
  ctx.fillText("Raid the cities to win.", 10, 320);
  ctx.fillText("An entry for js13k 2023 by slashie and stoltverd", 10, 400);
  ctx.fillText("Press [Enter] to start", 10, 480);
}

function nextRound () {
  roundWon = false;
  round++;
  var levelData = levels[round];
  supplyLinesCount = levelData.lines;
  balls = [];
  supplyLines = [];
  soldiers = [];
  forests = [];

  bgColor = rand.pick(landColors);

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

  balls.push({
    x: canvas.width * 0.75,
    y: canvas.height * 0.75,
    radius: 15,
    dx: 0,
    dy: 0,
    color: rand.pick(colors),
    cooldown: Math.random()
  });

  hordeStrength = balls.length * 10 - 100;

  for (var i = 0; i < supplyLinesCount; i++) {
    supplyLines.push({
      x: rand.int(canvas.width),
      y: rand.int(canvas.height / 2),
      radius: 20,
      dx: Math.random() * hordeSpeed / 2,
      dy: Math.random() * hordeSpeed / 2,
      color: '#00FF00',
      cooldown: Math.random()
    });
  }

  for (var i = 0; i < levelData.forests; i++) {
    var blobs = rand.int(5) + 10;
    var fx = rand.int(canvas.width);
    var fy = rand.int(canvas.height / 2);
    for (var j = 0; j < blobs; j++) {
      forests.push({
        x: fx - 40 + rand.int(80),
        y: fy - 40 + rand.int(80),
        radius: 20 + rand.int(10),
        color: '#228B22'
      });
    }
  }

  for (var i = 0; i < levelData.soldiers; i++) {
    soldiers.push({
      x: rand.int(canvas.width),
      y: rand.int(canvas.height / 2),
      radius: 15,
      dx: Math.random() * hordeSpeed / 2,
      dy: Math.random() * hordeSpeed / 2,
      color: '#FF0000',
      cooldown: Math.random()
    });
    if (i < supplyLinesCount){
      soldiers[i].supplyLine = supplyLines[i];
    }
  }
  mainBall = balls[balls.length - 1];
  mainBall.dx = -hordeSpeed;

  city = {
    x: canvas.width * 0.5,
    y: canvas.height * 0.25,
    radius: levelData.size
  }

  currentCityName = levelData.cityName;
  state = 'running';
}

state = 'title';

(function() {
  window.addEventListener('resize', resizeCanvas, false);
  function resizeCanvas() {
    ih = window.innerHeight - 30;
    iw = window.innerWidth - 20;
    rat = 800 / 600;

    if (window.innerWidth > window.screen.width) {
      // The innerWidth is < 600
      iw = window.screen.width - 20;
    }
    
    if (iw > ih * rat) {
      iw = ih * rat;
    } else {
      ih = iw * (1/rat);
    }
    canvas.style.width = iw + 'px';
    canvas.style.height = ih + 'px';
    if (iw > ih * rat) {
      document.getElementById('touchControls').style.display = 'none';
    } else {
      document.getElementById('touchControls').style.display = 'block';
      buttonHeight = (window.innerHeight - ih - 7 * 10) / 4;
      document.querySelectorAll('.touchButton').forEach(function(button) {
        button.style.height = buttonHeight + 'px';
      })
    }
  }
  
  resizeCanvas();
})();