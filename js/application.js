// HTML5 Asteroids was developed by Travis Luong

// declare globals
var WIDTH = 800;
var HEIGHT = 600;
var score = 0;
var lives = 3;
var started = false;
var paused = false;
var game_over = false;
var time = 0;
var time2 = 640;

// create the canvas
var canvas = $('<canvas width ="' + WIDTH + '" height="' + HEIGHT + '"></canvas>');
var ctx = canvas.get(0).getContext("2d");
$(canvas).appendTo('#stage');

// load audio
// created with sfxr
// http://www.drpetter.se/project_sfxr.html
var missile_sound = new Audio("sound/missile.wav");

var explosion_sound = new Audio("sound/explosion.wav");

var ship_explosion_sound = new Audio("sound/ship_explosion.wav");

var hit_sound = new Audio("sound/hit.wav");

var thrust_sound = new Audio("sound/thrust.mp3");

// load soundtrack
// http://ericskiff.com/music/
var soundtrack = new Audio("sound/07-we-the-resistors.mp3");

soundtrack.volume = 0.3;
soundtrack.loop = true;
soundtrack.play();

// load images
// art assets created by Kim Lathrop
ship_info = new ImageInfo(45, 45, 90, 90, 15, false);
var ship_img = new Image();
ship_img.onload = function () {
  ship_info.img_ready = true;
}
ship_img.src = "img/double_ship.png";

asteroid_info = new ImageInfo(45, 45, 90, 90, 40, -1);
var asteroid_img = new Image();
asteroid_img.onload = function () {
  asteroid_info.img_ready = true;
}
asteroid_img.src = "img/asteroid_blue.png";

missile_info = new ImageInfo(5, 5, 10, 10, 3, 60);
var missile_img = new Image();
missile_img.onload = function () {
  missile_info.img_ready = true;
}
missile_img.src = "img/shot2.png";

explosion_info = new ImageInfo(64, 64, 128, 128, 17, 24, true);
var explosion_img = new Image();
explosion_img.onload = function () {
  explosion_info.img_ready = true;
}
explosion_img.src = "img/explosion_alpha.png";

explosion_orange_info = new ImageInfo(64, 64, 128, 128, 17, 24, true);
var explosion_orange_img = new Image();
explosion_orange_img.onload = function () {
  explosion_orange_info.img_ready = true;
}
explosion_orange_img.src = "img/explosion_orange.png";

nebula_info = new ImageInfo(400, 300, 800, 600);
var nebula_img = new Image();
nebula_img.onload = function () {
  nebula_info.img_ready = true;
}
nebula_img.src = "img/nebula_blue.png";

debris_info = new ImageInfo(320, 240, 640, 480);
var debris_img = new Image();
debris_img.onload = function () {
  debris_info.img_ready = true;
}
debris_img.src = "img/debris2_blue.png";

// image info class
function ImageInfo(x_center, y_center, width, height, radius, lifespan, animated, img_ready) {
  this.x_center = x_center;
  this.y_center = y_center;
  this.width = width;
  this.height = height;
  this.radius = radius;
  this.lifespan = lifespan;
  this.animated = animated;
  this.img_ready = img_ready;
};

// angle to vector helper function
var angle_to_vector = function (ang) {
  return [Math.cos(ang), Math.sin(ang)];
};

// distance helper function
var dist = function (px, py, qx, qy) {
  return Math.sqrt(Math.pow(px - qx, 2) + Math.pow(py - qy, 2));
};

// ship class
function Ship(x, y, x_vel, y_vel, ang, ang_vel, image, info, type) {
  this.x = x;
  this.y = y;
  this.x_vel = x_vel;
  this.y_vel = y_vel;
  this.thrust = true;
  this.ang = ang;
  this.ang_vel = ang_vel;
  this.image = image;
  this.image_center_x = info.x_center;
  this.image_center_y = info.y_center;
  this.radius = info.radius;
  this.type = type;
  this.draw = function () {
    // save context
    ctx.save();
    // move origin to the x and y position of ship
    ctx.translate(this.x, this.y);
    // rotate ship
    ctx.rotate(this.ang);
    if (info.img_ready) {
      // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      if (this.thrust) {
        ctx.drawImage(image, 90, 0, info.width, info.height, -this.image_center_x, -this.image_center_y, info.width, info.height);
      } else {
        ctx.drawImage(image, 0, 0, info.width, info.height, -this.image_center_x, -this.image_center_y, info.width, info.height);
      }
    }
    // restore context
    ctx.restore();
  };
  this.update = function (modifier) {
    // update thrust
    if (38 in keysDown && lives > 0) { // up
      this.thrust = true;
      thrust_sound.play();
    } else {
      thrust_sound.pause();
      this.thrust = false;
    }
    // update ang velocity
    if (37 in keysDown && 39 in keysDown) {
      this.ang_vel = 0;
    } else if (37 in keysDown) { // left
      this.ang_vel = -5;
    } else if (39 in keysDown) { // right
      this.ang_vel = 5;
    } else {
      this.ang_vel = 0;
    }
    // update ang
    this.ang += this.ang_vel * modifier;
    // update position
    if (this.y <= 0) {
      this.y = HEIGHT;
    } else {
      this.y = (this.y + (this.y_vel * modifier)) % HEIGHT;
    }
    if (this.x <= 0) {
      this.x = WIDTH;
    } else {
      this.x = (this.x + (this.x_vel * modifier)) % WIDTH;
    }
    // update velocity
    if (this.thrust) {
      var acc = angle_to_vector(this.ang);
      this.x_vel += acc[0] * 10;
      this.y_vel += acc[1] * 10;
    }
    // friction
    this.x_vel *= 0.99;
    this.y_vel *= 0.99;
  };
  this.shoot = function () {
    if (lives > 0) {
      var forward = angle_to_vector(this.ang);
      var missile_x = this.x + this.radius * forward[0];
      var missile_y = this.y + this.radius * forward[1];
      var missile_x_vel = this.x_vel + 400 * forward[0];
      var missile_y_vel = this.y_vel + 400 * forward[1];
      var a_missile = new Sprite(missile_x, missile_y, missile_x_vel, missile_y_vel, this.angle, 0, missile_img, missile_info, missile_sound, "missile");
      missile_group.push(a_missile);
    }
  };
  return this;
};

// sprite class
function Sprite(x, y, x_vel, y_vel, ang, ang_vel, image, info, sound, type) {
  this.x = x;
  this.y = y;
  this.x_vel = x_vel;
  this.y_vel = y_vel;
  this.ang = ang;
  this.ang_vel = ang_vel;
  this.image = image;
  this.radius = info.radius;
  this.lifespan = info.lifespan;
  this.animated = info.animated;
  this.image_center_x = info.x_center;
  this.image_center_y = info.y_center;
  this.sound = sound;
  this.type = type;
  this.age = 0;
  if (sound) {
    sound.play();
  }
  this.draw = function () {
    // save context
    ctx.save();
    // move origin to the x and y position of sprite
    ctx.translate(this.x, this.y);
    // rotate sprite
    ctx.rotate(this.ang);
    if (info.img_ready) {
      if (this.animated) {
        animation_index = parseInt(this.age % this.lifespan);
        ctx.drawImage(image, animation_index * info.width, 0, info.width, info.height, -this.image_center_x, -this.image_center_y, info.width, info.height);
      } else {
        // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        ctx.drawImage(image, 0, 0, info.width, info.height, -this.image_center_x, -this.image_center_y, info.width, info.height);
      }

    }
    // restore context
    ctx.restore();
  };
  this.update = function (modifier) {
    // update position
    if (this.y <= 0) {
      this.y = HEIGHT;
    } else {
      this.y = (this.y + (this.y_vel * modifier)) % HEIGHT;
    }
    if (this.x <= 0) {
      this.x = WIDTH;
    } else {
      this.x = (this.x + (this.x_vel * modifier)) % WIDTH;
    }

    // update angle
    this.ang += this.ang_vel * modifier;

    // update age
    this.age += 1;

    if (this.lifespan == -1) { // permanent
      return true;
    } else if (this.age >= this.lifespan) {
      return false; // end
    } else {
      return true; // keep
    }
  };
  this.collide = function (other_object) {
    distance = dist(this.x, this.y, other_object.x, other_object.y);
    if (distance < (this.radius + other_object.radius)) {
      return true;
    } else {
      return false;
    }
  };
}

var rock_group = [];

// rock spawner
var rock_spawner = function () {
  if (rock_group.length < 12 && started) {
    var plus_or_minus = Math.random() < 0.5 ? -1 : 1;
    var rock_x = Math.random() * WIDTH;
    var rock_y = Math.random() * HEIGHT;
    var rock_x_vel = Math.random() * 100 * plus_or_minus;
    var rock_y_vel = Math.random() * 100 * plus_or_minus;
    var rock_ang_vel = Math.random() * 5 * plus_or_minus;
    var a_rock = new Sprite(rock_x, rock_y, rock_x_vel, rock_y_vel, 0, rock_ang_vel, asteroid_img, asteroid_info, null, "asteroid");
    rock_group.push(a_rock);
  }
}

setInterval(rock_spawner, 1000);

var my_ship = new Ship(WIDTH / 2, HEIGHT / 2, 0, 0, 0, 0, ship_img, ship_info, "ship");

var missile_group = [];

var explosion_group = [];

// group collide
var group_collide = function (group, sprite) {
  var collisions = 0;
  var remove_list = [];
  for (var i = 0; i < group.length; i++) {
    if (group[i].collide(sprite)) {
      if (sprite.type === "ship") {
        hit_sound.play();
      } else {
        explosion_sound.play();
      }
      collisions += 1;
      explosion_group.push(new Sprite(group[i].x, group[i].y, 0, 0, 0, 0, explosion_img, explosion_info));
      if (lives == 1 && group[i].type == "asteroid" && sprite.type == "ship") { // ship explosion if on last life
        explosion_group.push(new Sprite(my_ship.x, my_ship.y, my_ship.x_vel, my_ship.y_vel, my_ship.ang, my_ship.ang_vel, explosion_orange_img, explosion_orange_info));
        ship_explosion_sound.play();
        setTimeout(function(){game_over = true}, 2000);
      }
      group.splice(i, 1);
      sprite.lifespan = 0;
      i--; // decrement i by 1 because group is now smaller by 1
    }
  }
  return collisions;
};

var group_group_collide = function (group1, group2) {
  for (var i = 0; i < group1.length; i++) {
    var collisions = group_collide(group2, group1[i]);
    score += collisions;
  };
};

// handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
  keysDown[e.keyCode] = true;
  switch(e.keyCode){
    case 37: case 39: case 38:  case 40: // arrow keys
    case 32: e.preventDefault(); break; // space
    default: break; // do not block other keys
  }
  if (e.keyCode == 32) {
    my_ship.shoot();
  }
}, false);

addEventListener("keyup", function (e) {
  delete keysDown[e.keyCode];
}, false);

// handle clicks
// http://www.ibm.com/developerworks/library/wa-games/
// calculate position of the canvas DOM element on the page
var canvasPosition = {
  x: canvas.offset().left,
  y: canvas.offset().top
};

canvas.on('click', function(e) {

  // use pageX and pageY to get the mouse position
  // relative to the browser window

  var mouse = {
    x: e.pageX - canvasPosition.x,
    y: e.pageY - canvasPosition.y
  }

  if (game_over) {
    reset();
  } else if (!started) {
    started = true;
  } else if (!paused) {
    clearInterval(main_loop);
    paused = true;
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "rgb(250, 250, 250)";
    ctx.font = "18px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText('PAUSED', WIDTH / 2, HEIGHT / 2);
  } else {
    then = Date.now(); // reset the delta so objects don't jump on unpause
    main_loop = setInterval(main, 16);
    paused = false;
  }

  // now you have local coordinates,
  // which consider a (0,0) origin at the
  // top-left of canvas element
});

// draw sprite group
var draw_sprite_group = function (sprite_group) {
  for (var i = 0; i < sprite_group.length; i++) {
    sprite_group[i].draw();
  };
}

// update sprite group
var update_sprite_group = function (sprite_group, modifier) {
  for (var i = 0; i < sprite_group.length; i++) {
    if (sprite_group[i].update(modifier) == false) {
      sprite_group.splice(i, 1);
      i--;
    }
  };
}

// reset the game
var reset = function () {
  started = false;
  paused = false;
  game_over = false;
  lives = 3;
  rock_group = [];
  score = 0;
};

// update game objects
var update = function (modifier) {
  if (lives > 0) {
    lives -= group_collide(rock_group, my_ship);
    group_group_collide(missile_group, rock_group);
  }

  my_ship.update(modifier);

  update_sprite_group(rock_group, modifier);

  update_sprite_group(missile_group, modifier);

  update_sprite_group(explosion_group, modifier);
};

// draw everything
var render = function () {

  // draw background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  ctx.drawImage(nebula_img, 0, 0, nebula_info.width, nebula_info.height, 0, 0, nebula_info.width, nebula_info.height);

  time += 0.5;
  time2 += 0.5;
  wtime = time % (debris_info.width * 2);
  wtime2 = time2 % (debris_info.width * 2);

  ctx.drawImage(debris_img, 0, 0, debris_info.width, debris_info.height, wtime - debris_info.width, 50, debris_info.width, debris_info.height);

  ctx.drawImage(debris_img, 0, 0, debris_info.width, debris_info.height, wtime2 - debris_info.width, 50, debris_info.width, debris_info.height);

  // draw ship
  if (lives > 0) {
    my_ship.draw();
  }

  // draw rocks
  draw_sprite_group(rock_group);

  // draw missiles
  draw_sprite_group(missile_group);

  // draw explosions
  draw_sprite_group(explosion_group);

  // draw position
  ctx.fillStyle = "rgb(250, 250, 250)";
  ctx.font = "18px 'Press Start 2P'";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText('SCORE: ' + score, 32, 32);
  ctx.fillText('LIVES: ' + lives, 558, 32);

  if (!started) {
    // draw background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "rgb(250, 250, 250)";
    ctx.font = "18px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText('CLICK TO START.', WIDTH / 2, HEIGHT / 2);
  }

  if (game_over) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "rgb(250, 250, 250)";
    ctx.font = "18px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2);
  }


};

// the main game loop
var main = function () {
  var now = Date.now();
  var delta = now - then;

  update(delta / 1000);
  render();

  then = now;
};

// let's play this game!
reset();
var then = Date.now();
var main_loop = setInterval(main, 16); // run script every 16 milliseconds, approx 60 FPS
