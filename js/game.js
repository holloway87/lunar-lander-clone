/**
 * Game code.
 *
 * @author Thomas Rudolph <me@holloway-web.de>
 * @since 2016.12.27
 */
function pageLoaded() {
    var canvas = document.getElementById('game-canvas');
    /** @type {CanvasRenderingContext2D} */
    var context = canvas.getContext('2d');
    var debug = false;
    var floor;
    var resourceLoader = new ResourceLoader();
    var lastUpdateTime;
    var minBox2dStep = 2 / 60;
    var positionIterations = 3;
    var rocket;
    var rocketThrustSound;
    var scale = 4;
    var tilesWidth = 32;
    var tilesX = Math.floor(canvas.width / tilesWidth);
    var tilesY = Math.floor(canvas.height / tilesWidth);
    var velocityIterations = 8;
    var world;

    init();

    /**
     * Draw everything.
     */
    function draw() {
        requestAnimationFrame(gameLoop, canvas);

        // background
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);

        if (debug) {
            world.DrawDebugData();
        }

        if (!resourceLoader.isFullyLoaded()) {
            return;
        }

        // ground
        for (var x = 0; x < tilesX; x++) {
            context.drawImage(resourceLoader.getImage('tiles'), tilesWidth, 0, tilesWidth, tilesWidth, (x * tilesWidth),
                ((tilesY -1) * tilesWidth), tilesWidth, tilesWidth);
        }

        // rocket
        context.save();
        context.translate(rocket.GetPosition().x * scale, rocket.GetPosition().y * scale);
        context.rotate(rocket.GetAngle());
        context.drawImage(resourceLoader.getImage('rocket'), -Math.ceil(rocket.GetUserData().width / 2),
            -Math.ceil(rocket.GetUserData().height / 2));
        context.restore();
    }

    /**
     * Game loop.
     *
     * Updates entities and draws everything.
     */
    function gameLoop() {
        update();
        draw();
    }

    /**
     * Initializes everything.
     */
    function init() {
        initAssets();
        initWorld();
        initRocket();
        if (debug) {
            initBox2DDebug();
        }
        initKeyboard();
        gameLoop();
    }

    /**
     * Initialize all assets.
     */
    function initAssets() {
        //noinspection SpellCheckingInspection
        /**
         * Credit: Stephen Challener (Redshrike), hosted by OpenGameArt.org
         * Source: http://opengameart.org/content/space-ship-building-bits-volume-1
         */
        resourceLoader.addImage('rocket', 'images/rocket.png');
        //noinspection SpellCheckingInspection
        /**
         * Credit: Lanea Zimmerman
         * Source: http://opengameart.org/content/dirt-platformer-tiles
         */
        resourceLoader.addImage('tiles', 'images/platformer-tiles.png');
        //noinspection SpellCheckingInspection
        /**
         * Credit: xhunterko
         * Source: http://opengameart.org/content/static
         */
        rocketThrustSound = resourceLoader.addSound('rocket-thrust', 'sound/rocket');
        if (rocketThrustSound) {
            rocketThrustSound.loop = true;
        }
    }

    /**
     * Initialize Box2D debug.
     */
    function initBox2DDebug() {
        var debugDraw = new Box2D.Dynamics.b2DebugDraw();
        debugDraw.SetSprite(context);
        debugDraw.SetDrawScale(scale);
        debugDraw.SetFillAlpha(0.3);
        debugDraw.SetLineThickness(1);
        debugDraw.SetFlags(Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit);
        world.SetDebugDraw(debugDraw);
    }

    /**
     * Initializes keyboard events.
     */
    function initKeyboard() {
        //noinspection SpellCheckingInspection
        document.addEventListener('keydown', function (event) {
            if (38 == event.keyCode) {
                rocket.GetUserData().thrusting = true;
            } else if (37 == event.keyCode) {
                rocket.GetUserData().turningLeft = true;
            } else if (39 == event.keyCode) {
                rocket.GetUserData().turningRight = true;
            }
        });

        //noinspection SpellCheckingInspection
        document.addEventListener('keyup', function (event) {
            if (38 == event.keyCode) {
                rocket.GetUserData().thrusting = false;
            } else if (37 == event.keyCode) {
                rocket.GetUserData().turningLeft = false;
            } else if (39 == event.keyCode) {
                rocket.GetUserData().turningRight = false;
            }
        });
    }

    /**
     * Initialize the rocket.
     */
    function initRocket() {
        var rocketData = {
            'width': 11,
            'height': 30,
            'thrusting': false,
            'turningLeft': false,
            'turningRight': false,
            'thrust': 3,
            'turning': 0.5
        };
        var rocketDef;
        var rocketFixtureDef;

        rocketDef = new Box2D.Dynamics.b2BodyDef();
        rocketDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
        rocketDef.position.x = (tilesWidth + (tilesWidth / 2)) / scale;
        rocketDef.position.y = (((tilesY -1) * tilesWidth) - (rocketData.height / 2)) / scale;
        rocketFixtureDef = new Box2D.Dynamics.b2FixtureDef();
        rocketFixtureDef.density = 1;
        rocketFixtureDef.friction = 0.5;
        rocketFixtureDef.restitution = 0.2;
        rocketFixtureDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
        rocketFixtureDef.shape.SetAsBox(rocketData.width / 2 / scale, rocketData.height / 2 / scale);
        rocket = world.CreateBody(rocketDef);
        rocket.SetUserData(rocketData);
        rocket.CreateFixture(rocketFixtureDef);
    }

    /**
     * Initialize the world map.
     */
    function initWorld() {
        var floorDef;
        var floorFixtureDef;

        world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(0, 1.62519), true);
        floorDef = new Box2D.Dynamics.b2BodyDef();
        floorDef.type = Box2D.Dynamics.b2Body.b2_staticBody;
        floorDef.position.x = canvas.width / 2 / scale;
        floorDef.position.y = ((tilesY -1) * tilesWidth + tilesWidth / 2) / scale;
        floorFixtureDef = new Box2D.Dynamics.b2FixtureDef();
        floorFixtureDef.density = 1;
        floorFixtureDef.friction = 0.5;
        floorFixtureDef.restitution = 0.2;
        floorFixtureDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
        floorFixtureDef.shape.SetAsBox(tilesX * tilesWidth / scale, tilesWidth / 2 / scale);
        floor = world.CreateBody(floorDef);
        floor.CreateFixture(floorFixtureDef);
    }

    /**
     * Update entities status.
     */
    function update() {
        var currentTime = new Date().getTime();
        var impulse;
        var shipData = rocket.GetUserData();
        var steeringPoint;
        var timeStep;

        if (shipData.thrusting) {
            impulse = new Box2D.Common.Math.b2Vec2(Math.sin(rocket.GetAngle()) * shipData.thrust,
                -(Math.cos(rocket.GetAngle()) * shipData.thrust));
            rocket.ApplyImpulse(impulse, rocket.GetWorldCenter());
        }

        if (shipData.turningLeft || shipData.turningRight) {
            steeringPoint = rocket.GetWorldCenter().Copy();
            steeringPoint.y -= (shipData.height / 2 + 1) / scale;
        }
        if (shipData.turningLeft) {
            impulse = new Box2D.Common.Math.b2Vec2(-shipData.turning, 0);
            rocket.ApplyImpulse(impulse, steeringPoint);
        }
        if (shipData.turningRight) {
            impulse = new Box2D.Common.Math.b2Vec2(shipData.turning, 0);
            rocket.ApplyImpulse(impulse, steeringPoint);
        }

        if (rocketThrustSound) {
            if (rocketThrustSound.paused && (shipData.thrusting || shipData.turningLeft || shipData.turningRight)) {
                rocketThrustSound.play();
            } else if (!rocketThrustSound.paused && !shipData.thrusting && !shipData.turningLeft && !shipData.turningRight
            ) {
                rocketThrustSound.pause();
            }
        }

        if (lastUpdateTime) {
            timeStep = (currentTime - lastUpdateTime) / 1000;
            if (minBox2dStep > timeStep) {
                timeStep = minBox2dStep;
            }
            world.Step(timeStep, velocityIterations, positionIterations);
        }
        lastUpdateTime = currentTime;
    }
}
