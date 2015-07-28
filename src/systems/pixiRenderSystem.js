(function () {
    'use strict';

    var _ = require('lodash');
    var pixi = require('pixi.js');

    var utils = require('../utils.js'),
        look = utils.look,
        proxy = utils.proxy;

    var PixiRenderSystem = function (stage) {
        var that = this;

        var sprites = {};
        var graphics = {};

        var offset = {
            x: 0,
            y: 0
        };

        var redraw = function (newValue, entity) {
            // Remove old sprite.
            stage.removeChild(graphics[entity.uid]);
            delete graphics[entity.uid];

            // Add new sprite.
            that.build.graphic(entity);
        };

        // Build the system, called by world on every entity.
        this.build = {
            graphic: function (entity) {
                switch (entity.c.graphic.type) {

                    case 'circle':
                        graphics[entity.uid] = new pixi.Graphics();
                        graphics[entity.uid].beginFill(entity.c.graphic.color);
                        graphics[entity.uid].drawCircle(0, 0, entity.c.graphic.radius);

                        // Look for changes to redrawing if necessary.
                        look(entity.c.graphic, 'radius', redraw, entity);

                        break;

                    case 'ellipse':
                        graphics[entity.uid] = new pixi.Graphics();
                        graphics[entity.uid].beginFill(entity.c.graphic.color);
                        graphics[entity.uid].drawEllipse(
                            0,
                            0,
                            entity.c.graphic.width,
                            entity.c.graphic.height
                        );

                        // Look for changes to line params, redrawing if necessary.
                        look(entity.c.graphic, 'width', redraw, entity);
                        look(entity.c.graphic, 'height', redraw, entity);

                        break;

                    case 'line':
                        graphics[entity.uid] = new pixi.Graphics();
                        graphics[entity.uid].lineStyle(
                            entity.c.graphic.thickness,
                            entity.c.graphic.color,
                            1
                        );
                        graphics[entity.uid].moveTo(
                            entity.c.graphic.x1,
                            entity.c.graphic.y1
                        );
                        graphics[entity.uid].lineTo(
                            entity.c.graphic.x2,
                            entity.c.graphic.y2
                        );

                        // Look for changes to line params, redrawing if necessary.
                        look(entity.c.graphic, 'thickness', redraw, entity);
                        look(entity.c.graphic, 'x1', redraw, entity);
                        look(entity.c.graphic, 'y1', redraw, entity);
                        look(entity.c.graphic, 'x2', redraw, entity);
                        look(entity.c.graphic, 'y2', redraw, entity);

                        break;

                    case 'polygon':
                        graphics[entity.uid] = new pixi.Graphics();
                        graphics[entity.uid].beginFill(entity.c.graphic.color);
                        graphics[entity.uid].drawPolygon(entity.c.graphic.points);
                        graphics[entity.uid].endFill();

                        // Look for changes to line params, redrawing if necessary.
                        look(entity.c.graphic, 'points', redraw, entity);

                        break;

                    case 'rectangle':
                        graphics[entity.uid] = new pixi.Graphics();
                        graphics[entity.uid].beginFill(entity.c.graphic.color);
                        graphics[entity.uid].drawRect(
                            -entity.c.graphic.width/2,
                            -entity.c.graphic.height/2,
                            entity.c.graphic.width,
                            entity.c.graphic.height
                        );

                        // Look for changes to line params, redrawing if necessary.
                        look(entity.c.graphic, 'width', redraw, entity);
                        look(entity.c.graphic, 'height', redraw, entity);

                        break;

                    case 'sprite':
                        if (_.isArray(entity.c.graphic.path) || entity.c.graphic.sheet) {
                            // Animation.
                            var frames;

                            if (entity.c.graphic.sheet) {
                                frames = _.map(entity.c.graphic.path, function (framePath) {
                                    return pixi.Texture.fromFrame(framePath);
                                });
                            } else {
                                frames = _.map(entity.c.graphic.path, function (framePath) {
                                    return pixi.Texture.fromImage(framePath);
                                });
                            }

                            graphics[entity.uid] = new pixi.extras.MovieClip(frames);

                            // Set and proxy framespeed.
                            graphics[entity.uid].animationSpeed = entity.c.graphic.animationSpeed;
                            proxy(
                                entity.c.graphic, 'animationSpeed',
                                graphics[entity.uid], 'animationSpeed'
                            );
                            graphics[entity.uid].gotoAndPlay(entity.c.graphic.currentFrame);
                        } else {
                            // Static sprite.
                            var texture = pixi.Texture.fromImage(entity.c.graphic.path);
                            graphics[entity.uid] = new pixi.Sprite(texture);
                        }

                        // Set anchor.
                        graphics[entity.uid].anchor = entity.c.graphic.anchor;
                        proxy(entity.c.graphic, 'anchor', graphics[entity.uid], 'anchor');

                        // Set and proxy visibility.
                        graphics[entity.uid].visible = entity.c.graphic.visible;
                        proxy(entity.c.graphic, 'visible', graphics[entity.uid], 'visible');

                        // Set and proxy rotation.
                        graphics[entity.uid].rotation = entity.c.graphic.rotation;
                        proxy( entity.c.graphic, 'rotation', graphics[entity.uid], 'rotation');

                        // Redraw on path change.
                        look(entity.c.graphic, 'path', redraw, entity);

                        // Change animation frame on frame change.
                        look(
                            entity.c.graphic,
                            'currentFrame',
                            function (currentFrame, entity) {
                                graphics[entity.uid].gotoAndPlay(currentFrame);
                            },
                            entity
                        );
                        break;

                    case 'text':
                        // Set and proxy copy.
                        graphics[entity.uid] = new pixi.Text(
                            entity.c.graphic.copy,
                            entity.c.graphic.options
                        );
                        proxy(entity.c.graphic, 'copy', graphics[entity.uid], 'text');
                        proxy(entity.c.graphic, 'options', graphics[entity.uid], 'style');
                        break;

                    default:
                        throw new Error('InvalidGraphicType');
                }

                // Set and proxy stuff.
                graphics[entity.uid].alpha = entity.c.graphic.alpha;
                proxy(entity.c.graphic, 'alpha', graphics[entity.uid], 'alpha');

                graphics[entity.uid].scale = entity.c.graphic.scale;
                proxy(entity.c.graphic, 'scale', graphics[entity.uid], 'scale');

                graphics[entity.uid].z = entity.c.graphic.z;
                proxy(entity.c.graphic, 'z', graphics[entity.uid], 'z');

                // Look for changes, redrawing if necessary.
                look(entity.c.graphic, 'color', redraw, entity);
                look(entity.c.graphic, 'type', redraw, entity);

                stage.addChild(graphics[entity.uid]);

                // Sort by depth.
                stage.children.sort(function (a,b) {
                    if (a.z < b.z) {
                        return -1;
                    }
                    if (a.z > b.z) {
                        return 1;
                    }
                    return 0;
                });

                // Move to correct position.
                that.update.graphic(entity);
            }
        };

        // Destroy an entity from the system.
        this.destroy = {
            graphic: function (entity) {
                var id = entity.uid;

                if (_.has(graphics, id)) {
                    stage.removeChild(graphics[id]);
                }

                delete graphics[id];
            }
        };

        this.update = {
            graphic: function (entity)  {
                var graphic = graphics[entity.uid];

                var x = 0;
                var y = 0;

                if (entity.c.graphic.relative) {
                    x = entity.c.position.x + offset.x;
                    y = entity.c.position.y + offset.y;
                }

                graphic.position.x = Math.floor(x);
                graphic.position.y = Math.floor(y);
            }

        };

         // Preload assets.
        this.load = function (assets, callback) {
            var loader = new pixi.loaders.Loader();

            if (!_.isArray(assets)) {
                assets = [assets];
            }
            _.each(assets, function (asset) {
                loader.add(asset, asset);
            });

            if (callback) {
                loader.once('complete', callback);
            }
            loader.load();
        };
    };

    module.exports = PixiRenderSystem;
} ());
