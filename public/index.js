//document.addEventListener("contextmenu", function(e){
//    e.preventDefault();
//}, false);

//const { get } = require("http")

//document.addEventListener("keydown", function(e){
//    if(e.ctrlKey || e.key=="u"){
//        e.stopPropagation();
//        e.preventDefault();
//    }
//})

function _(element) {
  return document.querySelector(element);
}

const socket = io();

const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = 1024;
canvas.height = 576;

c.fillRect(0, 0, canvas.width, canvas.height);

const gravity = 0.7;

var act = "idle";
var game = false;
var wait_f_e = false;

const background = new Sprite({
  position: {
    x: 0,
    y: 0,
  },
  imageSrc: "./img/background.png",
});

const shop = new Sprite({
  position: {
    x: 600,
    y: 128,
  },
  imageSrc: "./img/shop.png",
  scale: 2.75,
  framesMax: 6,
});

const initialPlayerAData = {
  position: {
    x: 100,
    y: 300,
  },
  velocity: {
    x: 0,
    y: 0,
  },
  imageSrc: "./img/samuraiMack/Idle.png",
  framesMax: 8,
  scale: 2.5,
  offset: {
    x: 215,
    y: 157,
  },
  sprites: {
    idle: {
      imageSrc: "./img/samuraiMack/Idle.png",
      framesMax: 8,
    },
    run: {
      imageSrc: "./img/samuraiMack/Run.png",
      framesMax: 8,
    },
    jump: {
      imageSrc: "./img/samuraiMack/Jump.png",
      framesMax: 2,
    },
    fall: {
      imageSrc: "./img/samuraiMack/Fall.png",
      framesMax: 2,
    },
    attack1: {
      imageSrc: "./img/samuraiMack/Attack1.png",
      framesMax: 6,
    },
    takeHit: {
      imageSrc: "./img/samuraiMack/Take Hit - white silhouette.png",
      framesMax: 4,
    },
    death: {
      imageSrc: "./img/samuraiMack/Death.png",
      framesMax: 6,
    },
  },
  attackBox: {
    offset: {
      x: 100,
      y: 50,
    },
    width: 150,
    height: 50,
  },
  player: "A"
};
var PlayerAData = JSON.parse(JSON.stringify(initialPlayerAData));

const initialPlayerBData = {
  position: {
    x: 874,
    y: 300,
  },
  velocity: {
    x: 0,
    y: 0,
  },
  color: "blue",
  offset: {
    x: -50,
    y: 0,
  },
  imageSrc: "./img/kenji/Idle.png",
  framesMax: 4,
  scale: 2.5,
  offset: {
    x: 215,
    y: 167,
  },
  sprites: {
    idle: {
      imageSrc: "./img/kenji/Idle.png",
      framesMax: 4,
    },
    run: {
      imageSrc: "./img/kenji/Run.png",
      framesMax: 8,
    },
    jump: {
      imageSrc: "./img/kenji/Jump.png",
      framesMax: 2,
    },
    fall: {
      imageSrc: "./img/kenji/Fall.png",
      framesMax: 2,
    },
    attack1: {
      imageSrc: "./img/kenji/Attack1.png",
      framesMax: 4,
    },
    takeHit: {
      imageSrc: "./img/kenji/Take hit.png",
      framesMax: 3,
    },
    death: {
      imageSrc: "./img/kenji/Death.png",
      framesMax: 7,
    },
  },
  attackBox: {
    offset: {
      x: -170,
      y: 50,
    },
    width: 170,
    height: 50,
  },
  player: "B"
};
var PlayerBData = JSON.parse(JSON.stringify(initialPlayerBData));

//console.log(initialPlayerBData)
//console.log(PlayerBData)


var player = new Fighter(PlayerAData);
var enemy = new Fighter(PlayerBData);

//console.log(player.image.src)


//console.log(player);

var my_room;

var user = null;

function set_data_to_norm() {
  if (user != null) {
    PlayerAData = JSON.parse(JSON.stringify(initialPlayerAData));
    PlayerBData = JSON.parse(JSON.stringify(initialPlayerBData));
    if (user === "first") {
      player.reset(PlayerAData);
      enemy.reset(PlayerBData);
    } else if (user === "second") {
      player.reset(PlayerBData);
      enemy.reset(PlayerAData);
    }
    player.isAttacking = false;
  }
  
}

function give_get() {
  var data = {
    position: player.position,
    velocity: player.velocity,
    p_health: enemy.health,
    wait_f_e: wait_f_e,
    game: game,
    change_sprite_to: act,
  };
  socket.emit("give_data", data);

  socket.on("get_to_enemy", (data) => {
    if (game) {
      enemy.position = data.position;
      enemy.velocity = data.velocity;
      player.health = data.p_health;
      enemy.switchSprite(data.change_sprite_to);
    }
  });

  socket.on("get_to_room", (data) => {
    game = data.game;
    if (data.game) {
      wait_f_e = false;
    }
  });
  socket.on("get_to_player", (data) => {
    user = data.user;

    my_room = data.room;

    if (data.update_data) {
      set_data_to_norm();
    }
  });
}

const keys = {
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
};

function animate() {
  //document.getElementById("image_p").innerHTML = `img_p:${initialPlayerAData.position.x}`;
  //document.getElementById("image_e").innerHTML = `img_e:${initialPlayerBData.position.x}`;
  give_get();

  window.requestAnimationFrame(animate);

  //_("#user").innerHTML = `user: ${user}`;

  if (game) {
    _("#roomm").style.display = "block";
    _("#roomm").innerHTML = `your room:${my_room}`;
    _("#buttons").style.display = "none";
    _("#pan").style.display = "flex";
    c.fillStyle = "black";
    c.fillRect(0, 0, canvas.width, canvas.height);
    background.update();
    shop.update();
    c.fillStyle = "rgba(255, 255, 255, 0.1)";
    c.fillRect(0, 0, canvas.width, canvas.height);

    player.update();

    enemy.update();

    player.velocity.x = 0;

    //player movement
    if (keys.a.pressed && player.lastKey == "a") {
      player.velocity.x = -5;
      act = "run";
      player.switchSprite("run");
    } else if (keys.d.pressed && player.lastKey == "d") {
      player.velocity.x = 5;
      act = "run";
      player.switchSprite("run");
    } else {
      act = "idle";
      player.switchSprite("idle");
    }

    if (player.velocity.y < 0) {
      act = "jump";
      player.switchSprite("jump");
    } else if (player.velocity.y > 0) {
      act = "fall";
      player.switchSprite("fall");
    }

    if (player.isAttacking) {
      act = "attack1";
      player.switchSprite("attack1");
    }
    //else {
    //  act="idle"
    //  player.switchSprite("idle");
    //}

    //enemy movement
    //if (enemy.velocity.x == -5) {
    //  enemy.switchSprite("run");
    //} else if (enemy.velocity.x == 5) {
    //  enemy.switchSprite("run");
    //} else {
    //  enemy.switchSprite("idle");
    //}
    //
    //if (enemy.velocity.y < 0) {
    //  enemy.switchSprite("jump");
    //} else if (enemy.velocity.y > 0) {
    //  enemy.switchSprite("fall");
    //}

    //direct for collision & enemy gets hit
    if (
      rectangularCollision({
        rectangle1: player,
        rectangle2: enemy,
      }) &&
      player.isAttacking &&
      player.framesCurrent == player.sprites.attack1.framesMax - 2
    ) {
      enemy.takeHit();
      player.isAttacking = false;

      //gsap.to('#enemyHealth', {
      //    width: enemy.health + "%"
      //})
    }

    // if player misses
    if (
      player.isAttacking &&
      player.framesCurrent == player.sprites.attack1.framesMax - 2
    ) {
      player.isAttacking = false;
    }

    if (user == "first") {
      document.getElementById("playerAHealth").style.width =
        player.health + "%";
      document.getElementById("playerBHealth").style.width = enemy.health + "%";
    } else if (user == "second") {
      document.getElementById("playerAHealth").style.width = enemy.health + "%";
      document.getElementById("playerBHealth").style.width =
        player.health + "%";
    }

    //gsap.to('#playerHealth', {
    //    width: player.health + "%"
    //})

    // end game based on health
    //if (enemy.health <= 0 || player.health <= 0) {
    //  determineWinner({ player, enemy, timerId });
    //}
  } else {
    _("#roomm").style.display = "none";
    _("#buttons").style.display = "flex";
    _("#pan").style.display = "none";
    if (!wait_f_e) {
      _("#button").innerHTML = "play";
      _("#displayText").style.display = "none";
      _("#room").style.display = "none";
    } else {
      _("#displayText").innerHTML = "Whait for players";
      _("#displayText").style.display = "flex";
      _("#button").innerHTML = "stop";
      _("#room").innerHTML = `your room is "${my_room}"`;
      _("#room").style.display = "flex";
    }

    //document.getElementById("pan").style.display="none"

    //gsap.to('#playerHealth', {
    //    width: player.health + "%"
    //})

    //gsap.to('#enemyHealth', {
    //    width: enemy.health + "%"
    //})
    //document.querySelector('#displayText').style.display = 'flex'

    if (user == "first") {
      document.getElementById("playerAHealth").style.width =
        player.health + "%";
      document.getElementById("playerBHealth").style.width = enemy.health + "%";
    } else if (user == "second") {
      document.getElementById("playerAHealth").style.width = enemy.health + "%";
      document.getElementById("playerBHealth").style.width =
        player.health + "%";
    }

    c.fillStyle = "red";
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = "blue";
    //document.querySelector('#displayText').innerHTML = 'Whait for players'
  }
}

animate();

window.addEventListener("keydown", (event) => {
  if (!player.dead) {
    switch (event.key) {
      case "d":
        keys.d.pressed = true;
        player.lastKey = "d";
        break;
      case "a":
        keys.a.pressed = true;
        player.lastKey = "a";
        break;
      case "w":
        player.velocity.y = -20;
        break;
      case " ":
        player.attack();
        break;
    }
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "d":
      keys.d.pressed = false;
      break;
    case "a":
      keys.a.pressed = false;
      break;
  }
});

_("#button").addEventListener("click", () => {
  if (!game) {
    if (!wait_f_e) {
      wait_f_e = true;
    } else {
      wait_f_e = false;
    }
  }
});
