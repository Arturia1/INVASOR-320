var game = new Phaser.Game(400, 650, Phaser.AUTO, 'game');

var tiroUnico;
var Laser;
var BGM;


var Bullet = function (game, key) {

    Phaser.Sprite.call(this, game, 0, 0, key);

    this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;

    this.anchor.set(0.5);

    this.checkWorldBounds = true;
    this.outOfBoundsKill = true;
    this.exists = false;

    this.tracking = false;
    this.scaleSpeed = 0;

};

Bullet.prototype = Object.create(Phaser.Sprite.prototype);
Bullet.prototype.constructor = Bullet;

Bullet.prototype.fire = function (x, y, angle, speed, gx, gy) {

    gx = gx || 0;
    gy = gy || 0;

    this.reset(x, y);
    this.scale.set(1);

    this.game.physics.arcade.velocityFromAngle(angle, speed, this.body.velocity);

    this.angle = angle;

    this.body.gravity.set(gx, gy);

};

Bullet.prototype.update = function () {

    if (this.tracking)
    {
        this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x);
    }

    if (this.scaleSpeed > 0)
    {
        this.scale.x += this.scaleSpeed;
        this.scale.y += this.scaleSpeed;
    }

};

Bullet.prototype.damage = function() {

    this.health -= 1;

    if (this.health <= 0)
    {
        this.alive = false;

        this.shadow.kill();
        this.tank.kill();
        this.turret.kill();

        return true;
    }

    return false;

}


var Weapon = {};

//tiro basico//

Weapon.SingleBullet = function (game) {

    Phaser.Group.call(this, game, game.world, 'Tiro basico', false, true, Phaser.Physics.ARCADE);

    this.nextFire = 0;
    this.bulletSpeed = 600;
    this.fireRate = 100;

    for (var i = 0; i < 64; i++)
    {
        this.add(new Bullet(game, 'bullet2'), true);
    }

    return this;

};

Weapon.SingleBullet.prototype = Object.create(Phaser.Group.prototype);
Weapon.SingleBullet.prototype.constructor = Weapon.SingleBullet;

Weapon.SingleBullet.prototype.fire = function (source) {

    if (this.game.time.time < this.nextFire) { return; }

    var x = source.x + 15;
    var y = source.y + 10;

    this.getFirstExists(false).fire(x, y, 270, this.bulletSpeed, 0, 0);

    this.nextFire = this.game.time.time + this.fireRate;

};


//laser//


Weapon.Beam = function (game) {

    Phaser.Group.call(this, game, game.world, 'laser', false, true, Phaser.Physics.ARCADE);

    this.nextFire = 0;
    this.bulletSpeed = 1000;
    this.fireRate = 45;

    for (var i = 0; i < 64; i++)
    {
        this.add(new Bullet(game, 'bullet11'), true);
    }

    return this;

};

Weapon.Beam.prototype = Object.create(Phaser.Group.prototype);
Weapon.Beam.prototype.constructor = Weapon.Beam;

Weapon.Beam.prototype.fire = function (source) {

    if (this.game.time.time < this.nextFire) { return; }

    var x = source.x + 11;
    var y = source.y + -10;

    this.getFirstExists(false).fire(x, y, 270, this.bulletSpeed, 0, 0);

    this.nextFire = this.game.time.time + this.fireRate;

};


//  loop do jogo

var PhaserGame = function () {

    this.background = null;
    this.foreground = null;

    this.ufo = null;
    this.player = null;
    this.cursors = null;
    this.speed = 300;

    this.weapons = [];
    this.currentWeapon = 0;
    this.weaponName = null;

};



PhaserGame.prototype = {

    init: function () {

        this.game.renderer.renderSession.roundPixels = true;

        this.physics.startSystem(Phaser.Physics.ARCADE);

    },

    preload: function () {


        
        this.load.baseURL = 'http://127.0.0.1:5500/assets/';
        console.log('teste se pega');
        this.load.crossOrigin = 'anonymous';
        this.load.image('background', 'back2.png');
        this.load.image('player', 'ship2.png');
        this.load.bitmapFont('shmupfont', 'shmupfont.png', 'shmupfont.xml');
        this.load.image('ufo', 'ufo5.png');

        game.load.audio('tiro unico', 'arcade-beep.wav');
        game.load.audio('laser', 'laser-gun-shot.wav');
        game.load.audio('bgm', 'bgm.mp3');


        for (var i = 1; i <= 11; i++)
        {
            this.load.image('bullet' + i, 'bullet' + i + '.png');
        }


    },

    create: function () {

        this.background = this.add.tileSprite(0, 0, this.game.width, this.game.height, 'background');
        this.background.autoScroll(0, 40);

        this.weapons.push(new Weapon.SingleBullet(this.game));
        this.weapons.push(new Weapon.Beam(this.game));    

        this.currentWeapon = 0;

        for (var i = 1; i < this.weapons.length; i++)
        {
            this.weapons[i].visible = false;
        }

        this.player = this.add.sprite(190, 650, 'player');

        this.physics.arcade.enable(this.player);

        this.player.body.collideWorldBounds = true;

        tiroUnico = game.add.audio('tiro unico');

        Laser = game.add.audio('laser');
        
        BGM = game.add.audio('bgm');

        tiroUnico.volume = 0.2;

        Laser.volume = 0.2;

        this.ufo = this.add.sprite(190, 300, 'ufo');

        this.physics.arcade.enable(this.ufo);

        this.ufo.body.collideWorldBounds = true;

        BGM.play();

        BGM.loop = true;

        this.weaponName = this.add.bitmapText(8, 630, 'shmupfont', "Tiro basico", 15);

        var score = 0;
        var scoreText;

        scoreText = this.add.bitmapText(130, 0, 'shmupfont', "score: 0", 15);

        function destroyUfo (player
            , ufo)
        {
            ufo.disableBody(true, true);

            score += 1;
            scoreText.setText('Score: ' + score);
        }

        //  comandos de movimento + tiro
        this.cursors = this.input.keyboard.createCursorKeys();

        this.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);

        var changeKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        changeKey.onDown.add(this.nextWeapon, this);

    },

    

    nextWeapon: function () {

        // ativa arma primária
        if (this.currentWeapon > 1)
        {
            this.weapons[this.currentWeapon].reset();
        }
        else
        {
            this.weapons[this.currentWeapon].visible = false;
            this.weapons[this.currentWeapon].callAll('reset', null, 0, 0);
            this.weapons[this.currentWeapon].setAll('exists', false);
        }

        // ativa prox arma
        this.currentWeapon++;

        if (this.currentWeapon === this.weapons.length)
        {
            this.currentWeapon = 0;
        }

        this.weapons[this.currentWeapon].visible = true;

        this.weaponName.text = this.weapons[this.currentWeapon].name;

    },

    update: function () {

        this.player.body.velocity.set(0);

        if (this.cursors.left.isDown)
        {
            this.player.body.velocity.x = -this.speed;
        }
        else if (this.cursors.right.isDown)
        {
            this.player.body.velocity.x = this.speed;
        }

        if (this.cursors.up.isDown)
        {
            this.player.body.velocity.y = -this.speed;
        }
        else if (this.cursors.down.isDown)
        {
            this.player.body.velocity.y = this.speed;
        }

        if (this.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR))
        {
            this.weapons[this.currentWeapon].fire(this.player);
                if(this.currentWeapon == 0)
                { 
                    Laser.pause();
                    Laser.currentTime = 0;
                    tiroUnico.play();
                }
                else if (this.currentWeapon == 1){
                    tiroUnico.pause();
                    tiroUnico.currentTime = 1;
                    Laser.play();

                }

        }   

    }

};

game.state.add('Game', PhaserGame, true);
