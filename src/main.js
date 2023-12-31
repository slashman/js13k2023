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
  '#a2fb75',
  '#c7be60'
]

var levels = [
  { cityName: 'Ryazan', size: 20, lines: 2, soldiers: 7, forests: 5, seed: 12 },
  { cityName: 'Kolomna', size: 25, lines: 2, soldiers: 10, forests: 6, seed: 10 },
  { cityName: 'Moscow', size: 10, lines: 3, soldiers: 12, forests: 8, seed: 4 },
  { cityName: 'Vladimir', size: 30, lines: 4, soldiers: 10, forests: 7, seed: 5},
  { cityName: 'Suzdal', size: 10, lines: 3, soldiers: 15, forests: 10, seed: 6 },
  { cityName: 'Tver', size: 20, lines: 4, soldiers: 15, forests: 12, seed: 7 },
  { cityName: 'Kostroma', size: 40, lines: 4, soldiers: 10, forests: 8, seed: 8 },
  { cityName: 'Kiev', size: 30, lines: 5, soldiers: 15, forests: 10, seed: 9 }
];

var upgrades = {
  // Increases defense
  armor: ['Heavy coat', 'Brigandine', 'Hardened leather Lamellar', 'Plate Lamellar'],
  // Increases attack
  attack: ['Wooden Saddles', 'Stirrup', 'Hooked lance', 'Three-Quivered Arrows'],
  // Increases horde size
  hordeSize: ['Jagutu-iin Darga', 'Mingghan-u Noyan', 'Tumetu-iin Noyan', 'Khan Khuu'],
  // Increases speed (horse quality)
  speed: ['Pure Ado', 'War Training', 'High Cantle', 'Tengri\'s Blessing'],
}

var baseHordeSpeed = 80;

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
var upgradeState;

function start() {
  state = 'running';
  gameOverMessage = '';
  hordeStrength = 0;
  score = 0;
  year = 1237;
  round = -1;
  bgColor = '#a0e768';
  upgradeState = {
    armor: 0,
    attack: 0,
    hordeSize: 0,
    speed: 0
  };
  zzfxX=new(window.AudioContext||webkitAudioContext);
  playMusic(0);
  nextRound();
}

raf.start(function(elapsed) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state === 'title') {
    if (!musicLoaded) {
      drawLoading(ctx);
    } else {
      drawTitle(ctx);
    }
    return;
  }

  if (state === 'running') {
    year += (elapsed * 0.15);
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

  var hordeSpeed = baseHordeSpeed + upgradeState.speed * 10;

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
        balls.splice(j, 1);
        j--;
        if (ball === mainBall) {
          playSound(2);
          gameOver('The Khan is dead.');
        }
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
      ctx.fillText("🐎", ball.x, ball.y + 8);
    }
  }

  for (var j = 0; j < supplyLines.length; j++) {
    var supplyLine = supplyLines[j];
    if (supplyLine.cooldown < 0) {
      // Change direction
      var angle = Math.random() * Math.PI * 2;
      supplyLine.dx = baseHordeSpeed * Math.cos(angle) * 0.1;
      supplyLine.dy = baseHordeSpeed * Math.sin(angle) * 0.1;
      var rando = Math.random();
      supplyLine.dx = supplyLine.dx * (1 + rando * 0.3);
      supplyLine.dy = supplyLine.dy * (1 + rando * 0.3);
      supplyLine.cooldown = 5 + Math.random();
    } else {
      supplyLine.cooldown -= elapsed;
    }

    if (state === 'running') {
      for (var i = 0; i < balls.length; i++) {
        var ball = balls[i];
        if (Math.abs(ball.x - supplyLine.x) <= supplyLine.radius * 2
        && Math.abs(ball.y - supplyLine.y) <= supplyLine.radius * 2 && Math.random() > 0.7) {
          // Damage
          var damage = 0.1 + upgradeState.attack * 0.02;
          supplyLine.radius -= damage;
          playSound(5);
        };
      }
      if (supplyLine.radius < 3) {
        supplyLinesCount--;
        supplyLines.splice(j, 1);
        j--;
        playSound(supplyLinesCount ? 3 : 2);
        continue;
      }
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
    ctx.fillText("🌾", supplyLine.x, supplyLine.y + 8);
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
      soldier.dx = baseHordeSpeed * Math.cos(angle) * 0.2;
      soldier.dy = baseHordeSpeed * Math.sin(angle) * 0.2;
      var rando = Math.random();
      soldier.dx = soldier.dx * (1 + rando * 0.3);
      soldier.dy = soldier.dy * (1 + rando * 0.3);
      soldier.cooldown = 3 + Math.random();
  } else {
    soldier.cooldown -= elapsed;
  }

  if (state === 'running') {
    for (var i = 0; i < balls.length; i++) {
      var ball = balls[i];
      if (Math.abs(ball.x - soldier.x) <= soldier.radius * 2
      && Math.abs(ball.y - soldier.y) <= soldier.radius * 2 && Math.random() > 0.7) {
        var damage = 0.2 - upgradeState.armor * 0.03;
        playSound(4);
        ball.radius -= damage;
        hordeStrength -= damage;
        if (hordeStrength <= 0) {
          hordeStrength = 0;
          gameOver('The horde disbands')
          playSound(2);
        }
      }
    }
  }

  if (soldier.x - soldier.radius < 0 && soldier.dx < 0 || soldier.x + soldier.radius > canvas.width && soldier.dx > 0) soldier.dx = -soldier.dx * 0.7;
  if (soldier.y - soldier.radius < 0 && soldier.dy < 0 || soldier.y + soldier.radius > canvas.height && soldier.dy > 0) soldier.dy = -soldier.dy * 0.7;

  soldier.x += soldier.dx * elapsed;
  soldier.y += soldier.dy * elapsed;

  ctx.beginPath();
  ctx.arc(soldier.x, soldier.y, soldier.radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = '#be913c';
  ctx.fill();
  
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.font = "24px Georgia";
  ctx.fillText("⚔️", soldier.x, soldier.y + 8);
});

if (state === 'running') {
  for (var i = 0; i < balls.length; i++) {
    var ball = balls[i];
    if (supplyLinesCount === 0 &&
      Math.abs(ball.x - city.x) <= city.radius * 2 &&
      Math.abs(ball.y - city.y) <= city.radius * 2 && Math.random() > 0.9
    ) {
      var damage = 0.1 + upgradeState.attack * 0.02;
      city.radius -= damage / 2;
      playSound(5);
    }
  }
  if (city.radius < 6) {
    score += Math.floor(hordeStrength);
    playSound(6);
    playSound(0);
    if (round === levels.length - 1) {
      gameOver('Congratulations, you conquered Rus!');
    } else {
      roundWon = true;
      gameOver('You have invaded ' + currentCityName + '!');
    }
  }
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
  ctx.font = "16px Georgia";
  ctx.fillText(currentCityName, canvas.width / 2, canvas.height * 0.25 + 50);
  ctx.font = "24px Georgia";
  if (state === 'gameOver') {
    ctx.fillText(gameOverMessage, canvas.width / 2, 40);
    if (roundWon) {
      if (upgradeState.armor + upgradeState.attack + upgradeState.hordeSize + upgradeState.speed === 16) {
        ctx.fillText('Press [Enter to raid on]', canvas.width / 2, 90);
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(canvas.width / 2 - 200, 0, 400, 90 + 50 * 6);
        ctx.fillStyle = '#000000';
        ctx.fillText(gameOverMessage, canvas.width / 2, 40);
        ctx.fillText('Select an improvement', canvas.width / 2, 90);
        ctx.font = "18px Georgia";
        var row = 0;
        if (upgradeState.armor < 4) {
          ctx.beginPath();
          ctx.rect(canvas.width / 2 - 180, 115 + 70 * row, 360, 60);
          ctx.stroke();
          ctx.fillText('1. Armor: ' + upgrades.armor[upgradeState.armor], canvas.width / 2, 135 + 70 * row);
          ctx.fillText('+3 Skirmish Defense', canvas.width / 2, 160 + 70 * row);
        }
        row++;
        if (upgradeState.attack < 4) {
          ctx.beginPath();
          ctx.rect(canvas.width / 2 - 180, 115 + 70 * row, 360, 60);
          ctx.stroke();
          ctx.fillText('2. Weapons: ' + upgrades.attack[upgradeState.attack], canvas.width / 2, 135 + 70 * row);
          ctx.fillText('+2 Raid Attack', canvas.width / 2, 160 + 70 * row);
        }
        row++;
        if (upgradeState.hordeSize < 4) {
          ctx.beginPath();
          ctx.rect(canvas.width / 2 - 180, 115 + 70 * row, 360, 60);
          ctx.stroke();
          ctx.fillText('3. Leadership: ' + upgrades.hordeSize[upgradeState.hordeSize], canvas.width / 2, 135 + 70 * row);
          ctx.fillText('+5 horde units on each new round', canvas.width / 2, 160 + 70 * row);
        }
        row++;
        if (upgradeState.speed < 4) {
          ctx.beginPath();
          ctx.rect(canvas.width / 2 - 180, 115 + 70 * row, 360, 60);
          ctx.stroke();
          ctx.fillText('4. Horse Training: ' + upgrades.speed[upgradeState.speed], canvas.width / 2, 135 + 70 * row);
          ctx.fillText('+10 horde speed', canvas.width / 2, 160 + 70 * row);
        }
      }
    } else {
      ctx.fillText('Press [Enter to restart]', canvas.width / 2, 90);
    }
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
  doEnterKey();
});

function doEnterKey () {
  if (state === 'gameOver') {
    if (roundWon) {
      if (upgradeState.armor + upgradeState.attack + upgradeState.hordeSize + upgradeState.speed === 16) {
        nextRound(false);
      }
    } else {
      state = 'title';
    }
  } else if (state === 'title') {
    if (musicLoaded) {
      start();
    }
  }/* else {
    // test
    roundWon = true;
    playSound(6);
    gameOver('You have invaded ' + currentCityName + '!');
  }*/
}

input.typed('1', function () {
  if (state === 'gameOver' && roundWon && upgradeState.armor < 4) {
   nextRound('armor');
  }
});

input.typed('2', function () {
  if (state === 'gameOver' && roundWon && upgradeState.attack < 4) {
   nextRound('attack');
  }
});

input.typed('3', function () {
  if (state === 'gameOver' && roundWon && upgradeState.hordeSize < 4) {
   nextRound('hordeSize');
  }
});

input.typed('4', function () {
  if (state === 'gameOver' && roundWon && upgradeState.speed < 4) {
   nextRound('speed');
  }
});

function drawTitle (ctx) {
  ctx.fillStyle = '#000000';
  ctx.font = "48px Georgia";
  ctx.textAlign = 'left';
  ctx.fillText("The First Horde", 10, 60);
  ctx.font = "32px Georgia";
  ctx.fillText("Use the cursor keys or swipe to guide your horde.", 10, 120);
  ctx.fillText("Avoid the Rus armies (⚔️) if possible.", 10, 160);
  ctx.fillText("Destroy the supply lines (🌾) to weaken the", 10, 200);
  ctx.fillText("defenses of the cities.", 10, 240);
  ctx.fillText("Raid the cities to win.", 10, 320);
  ctx.fillText("An entry for js13k 2023 by slashie and stoltverd.", 10, 400);
  ctx.fillText("Music and sound effects by quietgecko.", 10, 440);
  ctx.fillText("Press [Enter] to start", 10, 520);
}

function drawLoading (ctx) {
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.font = "32px Georgia";
  ctx.fillText("Loading music...", 10, 120);
}

function nextRound (upgrade) {
  if (upgrade) {
    upgradeState[upgrade]++;
  }

  var hordeSpeed = baseHordeSpeed + upgradeState.speed * 10;
  roundWon = false;
  round++;
  var levelData = levels[round];
  supplyLinesCount = levelData.lines;
  rand = rng(levelData.seed);
  balls = [];
  supplyLines = [];
  soldiers = [];
  forests = [];

  bgColor = landColors[round % landColors.length];

  var bonusBalls = Math.floor(hordeStrength / 10);

  for (var i = 0; i < 49 + upgradeState.hordeSize * 5 + bonusBalls; i++) {
    balls.push({
      x: canvas.width * 0.75 + rand.intN(canvas.width),
      y: canvas.height / 2  + rand.intN(canvas.height / 2),
      radius: 10,
      dx: 0,
      dy: 0,
      color: rand.pickN(colors),
      cooldown: -1
    });
  }

  balls.push({
    x: canvas.width * 0.75,
    y: canvas.height * 0.75,
    radius: 15,
    dx: 0,
    dy: 0,
    color: colors[1],
    cooldown: Math.random()
  });

  hordeStrength = balls.length * 10 - 100;

  for (var i = 0; i < supplyLinesCount; i++) {
    supplyLines.push({
      x: rand.int(canvas.width),
      y: rand.int(canvas.height / 2),
      radius: 20,
      dx: Math.random() * baseHordeSpeed / 2,
      dy: Math.random() * baseHordeSpeed / 2,
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
      dx: Math.random() * baseHordeSpeed / 2,
      dy: Math.random() * baseHordeSpeed / 2,
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

var theScale;

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

    theScale = iw / canvas.width;
    if (window.innerWidth > window.innerHeight) {
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

//! ZzFXM (v2.0.3) | (C) Keith Clark | MIT | https://github.com/keithclark/ZzFXM
zzfxM=(n,f,t,e=125)=>{let l,o,z,r,g,h,x,a,u,c,d,i,m,p,G,M=0,R=[],b=[],j=[],k=0,q=0,s=1,v={},w=zzfxR/e*60>>2;for(;s;k++)R=[s=a=d=m=0],t.map((e,d)=>{for(x=f[e][k]||[0,0,0],s|=!!f[e][k],G=m+(f[e][0].length-2-!a)*w,p=d==t.length-1,o=2,r=m;o<x.length+p;a=++o){for(g=x[o],u=o==x.length+p-1&&p||c!=(x[0]||0)|g|0,z=0;z<w&&a;z++>w-99&&u?i+=(i<1)/99:0)h=(1-i)*R[M++]/2||0,b[r]=(b[r]||0)-h*q+h,j[r]=(j[r++]||0)+h*q+h;g&&(i=g%1,q=x[1]||0,(g|=0)&&(R=v[[c=x[M=0]||0,g]]=v[[c,g]]||(l=[...n[c]],l[2]*=2**((g-12)/12),g>0?zzfxG(...l):[])))}m=G});return[b,j]}

// zzfx() - the universal entry point -- returns a AudioBufferSourceNode
zzfx=(...t)=>zzfxP(zzfxG(...t))

// zzfxP() - the sound player -- returns a AudioBufferSourceNode
zzfxP=(...t)=>{let e=zzfxX.createBufferSource(),f=zzfxX.createBuffer(t.length,t[0].length,zzfxR);t.map((d,i)=>f.getChannelData(i).set(d)),e.buffer=f,e.connect(zzfxX.destination),e.start();return e}

// zzfxG() - the sound generator -- returns an array of sample data
zzfxG=(q=1,k=.05,c=220,e=0,t=0,u=.1,r=0,F=1,v=0,z=0,w=0,A=0,l=0,B=0,x=0,G=0,d=0,y=1,m=0,C=0)=>{let b=2*Math.PI,H=v*=500*b/zzfxR**2,I=(0<x?1:-1)*b/4,D=c*=(1+2*k*Math.random()-k)*b/zzfxR,Z=[],g=0,E=0,a=0,n=1,J=0,K=0,f=0,p,h;e=99+zzfxR*e;m*=zzfxR;t*=zzfxR;u*=zzfxR;d*=zzfxR;z*=500*b/zzfxR**3;x*=b/zzfxR;w*=b/zzfxR;A*=zzfxR;l=zzfxR*l|0;for(h=e+m+t+u+d|0;a<h;Z[a++]=f)++K%(100*G|0)||(f=r?1<r?2<r?3<r?Math.sin((g%b)**3):Math.max(Math.min(Math.tan(g),1),-1):1-(2*g/b%2+2)%2:1-4*Math.abs(Math.round(g/b)-g/b):Math.sin(g),f=(l?1-C+C*Math.sin(2*Math.PI*a/l):1)*(0<f?1:-1)*Math.abs(f)**F*q*zzfxV*(a<e?a/e:a<e+m?1-(a-e)/m*(1-y):a<e+m+t?y:a<h-d?(h-a-d)/u*y:0),f=d?f/2+(d>a?0:(a<h-d?1:(h-a)/d)*Z[a-d|0]/2):f),p=(c+=v+=z)*Math.sin(E*x-I),g+=p-p*B*(1-1E9*(Math.sin(a)+1)%2),E+=p-p*B*(1-1E9*(Math.sin(a)**2+1)%2),n&&++n>A&&(c+=w,D+=w,n=0),!l||++J%l||(c=D,v=H,n=n||1);return Z}

// zzfxV - global volume
zzfxV=.3

// zzfxR - global sample rate
zzfxR=44100


const musics = [
  [[[,0,100,,.05,,,,,150,,,.04,.6,12,,,.3,.08],[.15,0,110,,2,1,4,.3,,,,2,.1,,,,.03,.7],[,0,80,,.1,,,20,,-10,,,10,.6,,,,.5,.08]],[[[,-1,,,,,1,1,1,1,,,,,1,8,8,1,,,,,1,8,,1,,,,,1,1,1,1,,,,,1,8,8,1,,,,,1,1,,1,,,,,1,1,,1,,,,,1,8,8,1],[2,,22,,27,28,22,,,,22,,,,22,,28,,28,,22,,22,,,,22,,,,22,28,29,30,22,,28,,22,25,28,30,22,,,,23,,,,22,,23,,23,,22,,22,,22,,22,,,23],[,1,26,,,,26,,,,26,,,,26,,26,,26,,,,26,,,,26,,,,26,,,,26,,26,,26,,,,26,,,,26,,,,26,,26,,26,,,,26,,,,26,,,,],[1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,]],[[,-1,,,,,1,1,1,1,,,,,1,8,8,1,,,,,1,8,,1,,,,,1,1,1,1,,,,,1,8,8,1,,,,,1,1,,1,,,,,1,1,,1,,,,,1,8,8,1],[,,8,,,,8,,7,,8,,,,8,,,,8,,,,8,8,,7,8,,,,8,,,,8,,7,,8,,7,,8,,,,8,,,,8,,7,,8,,,,8,,,,8,7,,8],[,1,26,,,,26,,,,26,,,,26,,26,,26,,,,26,,,,26,,,,26,,,,26,,26,,26,,,,26,,,,26,,,,26,,26,,26,,,,26,,,,26,,,,],[1,,3,,,,,,,,,,,,,,,,3,,,,,,,,,,,,,,,,6,,,,,,,,,,,,,,,,6,,,,,,,,,,,,,,,,]],[[,-1,1,,,,1,1,1,1,,,,,1,8,8,1,,,,,1,8,,1,,,,,1,1,1,1,,,,,1,8,8,1,,,,,1,1,,1,,,,,1,1,,1,,,,,1,8,8,1],[,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],[,1,26,,,,26,,,,26,,,,26,,26,,26,,,,26,,,,26,,,,26,,,,26,,26,,26,,,,26,,,,26,,,,26,,26,,26,,,,26,,,,26,,,,],[1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,]],[[,-1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],[,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],[,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],[1,,3,,,,,,,,,,,,,,,,3,,,,,,,,,,,,,,,,6,,,,,,,,,,,,,,,,6,,,,,,,,,,,,,,,,]]],[3,2,1,0,1,2],100]
];
  
let song;
function playMusic(i) {
    if (song) {
        song.stop();
    }
    song = zzfxP(...musicBuffers[i]);
    song.loop = true;
}

const sfxs = [
  [,,100,,.05,.4,4,0,,,100,,,2,,-0.7,.5,.37,.5,.35], // 0 - city destroyed
  [2.62,,269,.25,.04,1,4,.6,25,,,,.15,,.1,.1,.4,.7,.08,.45], // 1 - Supply lines broken
  [2.4,,210,.03,.4,.2,1,3,,-2,,,,1.4,3.5,,.09,.97,.3], // 2 - game over
  [1.22,,269,.25,.04,1,4,.6,25,,,,.15,,.1,.1,.4,.7,.08,.45], // 3 - enemy death
  [.4,.4,261.6256,,.05,.02,,3,-6,,,,,2.2,,,,1.1,.01,.21], // 4 - sword slash
  [.1,,332,.07,.03,.09,4,.3,12,,,,.03,,,.2,,.4,.03], // 5 - fire torch
  [,0,100,,.8,1.2,,,-2,1.2,4,1,,1.5,,,.07,.8,.4], // 6 - win level
];

function playSound(i) {
  zzfx(...sfxs[i]);
}

// Generate music...
let musicBuffers;
var musicLoaded = false;
setTimeout(() => {
    musicBuffers = musics.map(m => zzfxM(...m))
    musicLoaded = true;
}, 50);

var el = document.getElementById('game')
el.addEventListener('pointerdown', function(e){
  var x = (e.clientX - e.target.offsetLeft) / theScale;
  var y = (e.clientY - e.target.offsetTop) / theScale;
  if (state === 'gameOver' && roundWon) {
    if (into(x, y, canvas.width / 2 - 180, 115 + 70 * 0, 360, 60)) {
      if (upgradeState.armor < 4) { nextRound('armor'); }
    } else if (into(x, y, canvas.width / 2 - 180, 115 + 70 * 1, 360, 60)) {
      if (upgradeState.attack < 4) { nextRound('attack'); }
    } else if (into(x, y, canvas.width / 2 - 180, 115 + 70 * 2, 360, 60)) {
      if (upgradeState.hordeSize < 4) { nextRound('hordeSize'); }
    } else if (into(x, y, canvas.width / 2 - 180, 115 + 70 * 3, 360, 60)) {
      if (upgradeState.speed < 4) { nextRound('speed'); }
    }
  } else {
    // Act as enter
    doEnterKey();
  }
});

function into (x, y, xa, ya, w, h) {
  return x > xa && x < xa + w && y > ya && y < ya + h;
}