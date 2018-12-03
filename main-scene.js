window.Term_Project_Scene = window.classes.Term_Project_Scene =
    class Term_Project_Scene extends Scene_Component {
        constructor(context, control_box)     // The scene begins by requesting the camera, shapes, and materials it will need.
        {
            super(context, control_box);    // First, include a secondary Scene that provides movement controls:

            const gl = context.gl;

            //new CollidingSphere(true, Mat4.translation([1,2,3]), true, true)
            if (!context.globals.has_controls)
                context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

            context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 2, 10), Vec.of(0, 2, 0), Vec.of(0, 1, 0));

            const r = context.width / context.height;
            context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

            const shapes = {
                box: new Cube(),
                box_2: new Cube(),
                cone: new Cone_Tip(13, 13),
                axis: new Axis_Arrows(),
                square: new Square(),
                player: new Subdivision_Sphere(4),
                sphere: new Subdivision_Sphere(1),
            };
            this.colliders = [new Monster([0, 0, 0])];


            this.submit_shapes(context, shapes);
            this.logic = new Logic();
            this.materials = {
                phong: context.get_instance(Phong_Shader).material(Color.of(1, 1, 0, 1)),
                phong2: context.get_instance(Phong_Shader).material(Color.of(1, 1, 1, 1), {ambient: 1, diffuse: 1}),
                phong3: context.get_instance(Phong_Shader).material(Color.of(1, 0, 1, 1), {ambient: 1, diffuse: 1}),
                'wall': context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                    specularity: 0,
                    ambient: 0.5,
                    texture: context.get_instance("assets/stone03b.jpg", false)
                }),
                'floor': context.get_instance(Texture_Tile).material(Color.of(0, 0, 0, 1), {
                    specularity: 0,
                    ambient: 0.7,
                    texture: context.get_instance("assets/floor.jpg", false)
                }),
                'flashlight': context.get_instance(Flashlight_Shader).material(Color.of(0, 0, 0, 1), {
                    // ambient to 1, diffuse to 0, and specular to 0
                    ambient: 1,
                    diffusivity: 0,
                    specularity: 0,
                    texture: context.get_instance("assets/sunray2.png", true)
                }),
                'heart': context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                    specularity: 0,
                    ambient: 0.7,
                    texture: context.get_instance("assets/heartheart.jpg", false)
                }),
                tex: context.get_instance(Tex_Shader).material(),
                shadow: context.get_instance(Shadow_Phong_Shader).material(Color.of(1, 1, 0, 1), {
                    ambient: 0.5,
                    diffuse: 1,
                    texture: context.get_instance("assets/stone03b.jpg", false)
                }),
                orig: context.get_instance(Shadow_Shader).material(),
                floor_shadow: context.get_instance(Tiling_Shadow_Shader).material(Color.of(0, 0, 0, 1), {
                    specularity: 0,
                    ambient: 0.3,
                    texture: context.get_instance("assets/floor.jpg", false)
                }),
                wall_shadow: context.get_instance(Shadow_Phong_Shader).material(Color.of(0, 0, 0, 1), {
                    specularity: 0,
                    ambient: 0.4,
                    texture: context.get_instance("assets/stone03b.jpg", false)
                }),
                

            };

            this.rotateFlag = false;
            this.r1 = 0;
            this.r2 = 0;
            this.rTime = 0;
            this.c = 0;
            this.playerM = Mat4.identity();//POSITION OF THE PLAYER!!!!
            this.logic.move(5);
            this.logic.changeAngle(35);
            this.camera = true;
            this.time = 0;
            this.nextSpawn = 5.0;

            /* initialize flashlight (make it a class probably) */
            this.flashlight = {
                angle: {
                    x: 0,
                    y: 0
                },
                centerToTip: [0, 0, 1],
                playerToHand: [0.1, 0.1, -0.9],
                longThin: [1, 1, 5],
                collider_transform: null,
                colliders: [],
                rotation: 0
            };

            this.lights = [new Light(gl, Mat4.look_at(Vec.of(50, 10, 50), Vec.of(10, 0, 10), Vec.of(0, 1, 0)), Vec.of(50, 10, 50, 1), Color.of(1, 1, 1, 1), 100000),
            ];

            this.walls = []
            for (let i = 0; i < 10; i++) {
                this.walls.push(new CollidingCube([Math.random() * 40 + 5, 0, Math.random() * 40 + 5], [1, 4, 1], Math.random() * 7, [0, 1, 0]))
                this.walls.push(new CollidingCube([Math.random() * -40 - 5, 0, Math.random() * 40 + 5], [1, 4, 1], Math.random() * 7, [0, 1, 0]))
                this.walls.push(new CollidingCube([Math.random() * 40 + 5, 0, Math.random() * -40 - 5], [1, 4, 1], Math.random() * 7, [0, 1, 0]))
                this.walls.push(new CollidingCube([Math.random() * -40 - 5, 0, Math.random() * -40 - 5], [1, 4, 1], Math.random() * 7, [0, 1, 0]))
            }
            this.player_collider = new CollidingSphere([0, 0, 0], 0, [1, 0, 0], 0.5)

        }

        make_control_panel() {
            this.key_triggered_button("Forward", ["w"], () => this.forward = true, undefined, () => this.forward = false);
            this.key_triggered_button("Back", ["s"], () => this.back = true, undefined, () => this.back = false);
            this.key_triggered_button("Turn Left", ["a"], () => this.left = true, undefined, () => this.left = false);
            this.key_triggered_button("Turn Right", ["d"], () => this.right = true, undefined, () => this.right = false);

            this.key_triggered_button("MoveForward", ["g"], () => {
                this.logic.move(-1);
            });
            this.key_triggered_button("MoveBack", ["b"], () => {
                this.logic.move(1);
            });
            this.key_triggered_button("turnLeft", ["q"], () => {
                this.logic.changeAngle(1);
            });
            this.key_triggered_button("turnRight", ["e"], () => {
                this.logic.changeAngle(-1);
            });
            this.key_triggered_button("switchCamera", ["x"], () => {
                this.camera = !this.camera;
            });
            this.result_img = this.control_panel.appendChild(
                Object.assign(document.createElement("img"), {
                    style: "width:200px; height:" + 200 * this.aspect_ratio + "px"
                })
            );

            /*this.key_triggered_button("up", ["8"], () => this.moveup = true, undefined, () => this.moveup = false);
            this.key_triggered_button("down", ["2"], () => this.movedown = true, undefined, () => this.movedown = false);
            this.key_triggered_button("left", ["4"], () => this.moveleft = true, undefined, () => this.moveleft = false);
            this.key_triggered_button("right", ["6"], () => this.moveright = true, undefined, () => this.moveright = false);
            this.key_triggered_button("in", ["7"], () => this.movein = true, undefined, () => this.movein = false);
            this.key_triggered_button("out", ["9"], () => this.moveout = true, undefined, () => this.moveout = false);*/

            this.new_line();
            /*y = 0.8 is as far left, y=-0.8 is as far right*/
            /*x = 0.44 is top of the screen, x = -0.03 is the bottom of the screen*//*
            this.key_triggered_button("lightLeft", ["a"], () => {
                if (this.flashlight.angle.y >= 0.8) {
                    return
                }
                this.flashlight.angle.y += 0.01;
            });
            this.key_triggered_button("lightRight", ["d"], () => {
                if (this.flashlight.angle.y <= -0.8) {
                    return;
                }
                this.flashlight.angle.y -= 0.01;
            });
            this.key_triggered_button("lightUp", ["w"], () => {
                if (this.flashlight.angle.x >= 0.5) {
                    return;
                }
                this.flashlight.angle.x += 0.01;
            });
            this.key_triggered_button("lightDown", ["s"], () => {
                if (this.flashlight.angle.x <= 0) {
                    return;
                }
                this.flashlight.angle.x -= 0.01;
            });*/
        }

        display(graphics_state, gl) {
            graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
            const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
            this.time = t;

            if (this.forward) {
                this.logic.move(-1)
            }
            if (this.back) {
                this.logic.move(1)
            }
            if (this.left) {
                this.logic.changeAngle(1)
            }
            if (this.right) {
                this.logic.changeAngle(-1)
            }

            const x = Math.cos(t / 2)
            const y = Math.sin(t / 2)

            this.lights[0].transform = Mat4.look_at(Vec.of(120 * x, 40, 120 * y), Vec.of(40 * x, 0, 30 * y), Vec.of(0, 1, 0))
            this.lights[0].position = Vec.of(50 * x, 0, 50 * y)

            //this.player_collider.draw(graphics_state, this.shapes.player, this.materials.phong2)
            this.player_collider.translate(this.logic.posX, 0, this.logic.posZ)
            for (let wall of this.walls) {

                if (this.player_collider.collides(wall)) {
                    console.log("hit")
                    if (this.forward) {
                        this.logic.move(1)
                    }
                    if (this.back) {
                        this.logic.move(-1)
                    }
                    //if (this.left) { this.logic.changeAngle(-2) }
                    //if (this.right) { this.logic.changeAngle(2) }
                    //this.player_collider.draw(graphics_state, this.shapes.player, this.materials.phong)
                    break;
                }

            }

            //this.shapes.box.draw(graphics_state, Mat4.scale([50, 1, 50]).times(Mat4.translation([0, -3, 0])), this.materials.floor)
            //this.shapes.box.draw(graphics_state, Mat4.scale([500, 100, 3]).times(Mat4.translation([0, 0, 150])), this.materials.wall)
            //this.shapes.box.draw(graphics_state, Mat4.scale([500, 100, 3]).times(Mat4.translation([0, 0, -150])), this.materials.wall)
            //this.shapes.box.draw(graphics_state, Mat4.scale([3, 100, 500]).times(Mat4.translation([150, 0, 0])), this.materials.wall)
            //this.shapes.box.draw(graphics_state, Mat4.scale([3, 100, 500]).times(Mat4.translation([-150, 0, 0])), this.materials.wall)

            for (let i = 0; i < 1; i++) {
                this.lights[i].drawDepthBuffer(graphics_state, () => {
                    for (let wall of this.walls) {
                        wall.draw(graphics_state, this.shapes.box, this.materials.wall)
                    }
                })
            }

            for (let i = 0; i < 1; i++) {
                this.lights[i].drawOutputBuffer(graphics_state, () => {
                    for (let wall of this.walls) {
                        wall.draw(graphics_state, this.shapes.box, this.materials.wall_shadow)
                    }
                    this.shapes.box.draw(graphics_state, Mat4.scale([50, 1, 50]).times(Mat4.translation([0, -3, 0])), this.materials.floor_shadow)
                })
            }

            for (let i = 0; i < 1; i++) {
                this.lights[i].clearDepthBuffer();
            }

            for (let i = 0; i < 1; i++) {
                this.shapes.box.draw(graphics_state, Mat4.inverse(this.lights[i].transform), this.materials.phong2)
            }
            /*
            for (let wallset of this.walls) {
                for (let wall of wallset) {wall.draw(graphics_state, this.shapes.box, this.materials.wall)
                }
            }
            */
            /*let box1_transform = Mat4.identity();
            let box2_transform = Mat4.identity();

            let floor_transform = Mat4.identity();
            floor_transform = floor_transform.times(Mat4.translation([0, -1, 1]))
                .times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0)));

            box2_transform = box2_transform.times(Mat4.translation([2, 0, 0]));
            if (this.rotateFlag) {
                this.r1 = this.r1 + 0.5 * (t - this.rTime);
                this.r2 = this.r2 + ((t - this.rTime) / 3);

            }
            this.rTime = t;
            box1_transform = box1_transform.times(Mat4.rotation(this.r1, Vec.of(1, 0, 0)));
            box2_transform = box2_transform.times(Mat4.rotation(this.r2, Vec.of(0, 1, 0)));
*/
            //PLAYER camera
            if (this.camera) {
                this.playerM = Mat4.identity();
                this.playerM = this.playerM.times(Mat4.translation([this.logic.posX, 0, this.logic.posZ]));
                this.playerM = this.playerM.times(Mat4.rotation(this.logic.viewDir, Vec.of(0, 1, 0)));
                graphics_state.camera_transform = Mat4.inverse(this.playerM.times(Mat4.translation([0, 1, 0])));
                let health = this.playerM.times(Mat4.translation([0.8, 1.8, -2])).times(Mat4.scale([1 / 16, 1 / 16, 1 / 16]))
                    .times(Mat4.translation([-0.5, -0.5, 0]));
                for (let i = 0; i < this.logic.health; i++) {
                    this.shapes.square.draw(graphics_state, health.times(Mat4.translation([-2 * i, 0, 0])), this.materials.heart);
                }
                this.time = t;
            } else if (t > this.time + 1) {
                graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 6, 8), Vec.of(0, 2, 0), Vec.of(0, 1, 0));
            }

            /************************************* flashlight *************************************************/
            /* Draw light coming from flashlight (player's hand) */
            this.flashlight.transform = this.playerM.times(Mat4.translation(this.flashlight.playerToHand));

            /*place the tip of the flashlight where the players hand would be */
            this.flashlight.transform = this.flashlight.transform.times(Mat4.translation(this.flashlight.playerToHand));

            /* Rotate the light first */
            /* angle.x++ moves the light up */
            /* angle.y++ moves the light left */
            this.flashlight.transform = this.flashlight.transform
                .times(Mat4.translation(this.flashlight.centerToTip))
                .times(Mat4.rotation(this.flashlight.angle.x, [1, 0, 0]))
                .times(Mat4.rotation(this.flashlight.angle.y, [0, 1, 0]))
                .times(Mat4.translation(this.flashlight.centerToTip.map(i => -i)));

            /* Save the flashlight origin position before making the flashlight long and thin */
            this.flashlight.collider_transform = this.flashlight.transform
                .times(Mat4.translation(this.flashlight.centerToTip))
                .times(Mat4.scale(Array(3).fill(0.01)));

            /* Make the lightcone long and thin (long enough to hit the far wall) */
            this.flashlight.transform = this.flashlight.transform
                .times(Mat4.translation(this.flashlight.centerToTip))
                .times(Mat4.scale(this.flashlight.longThin))
                .times(Mat4.translation(this.flashlight.centerToTip.map(i => -i)));
            
            for (let i = 0; i < 5; i++) {
                this.flashlight.rotation += Math.random()*0.01;
                this.shapes.cone.draw(graphics_state, this.flashlight.transform, this.materials.flashlight);
                this.flashlight.transform = this.flashlight.transform
                    .times(Mat4.translation(this.flashlight.centerToTip))
                    .times(Mat4.rotation(this.flashlight.rotation, [0, 0, 1]))
                    .times( Mat4.scale([0.5, 0.5, 0.5]) )
                    .times(Mat4.translation(this.flashlight.centerToTip.map(x => -x)));
            }

            /* Compute where the collider spheres would be */
            for (let i = 0; i < 20; i++) {
                this.flashlight.collider_transform = this.flashlight.collider_transform
                    .times( Mat4.translation([0, 0, -3]) ) //move the next sphere forwards
                    .times( Mat4.scale(Array(3).fill(1.3)) ); //make the next sphere bigger

                // let matTemp = this.materials.phong2;

                let sphere = {
                    position: this.flashlight.collider_transform.times( Vec.of(0,0,0,1) ),
                    radius: 0.001 + i*0.03
                };
                /* For each colliding sphere, check to see if it hits a ghost */
                for (let j = 0; j < this.colliders.length; j++) {
                    if (this.colliders[j].collides(sphere)) {
                        this.colliders[j].damage();
                        // matTemp = this.materials.phong;
                        console.log("hit ghost");
                    }
                }
                // this.shapes.sphere.draw(graphics_state, this.flashlight.collider_transform, matTemp);
            }

            /* Go through each colliders object and see if we've hit any. If so, then call "hit" */

            /************************************* flashlight *************************************************/

            /*let grid_transform = Mat4.identity().times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0))).times(Mat4.translation([-7, 0, 0]));
            for (let i = 0; i < this.logic.grid.length; i++) {
                let transform = grid_transform.times(Mat4.translation([0, i, 0]));
                let row = this.logic.grid[i];
                for (let j = 0; j < row.length; j++) {
                    let row_translation = transform.times(Mat4.translation([j, 0, 0]));
                    if (row[j] === 0) {
                        this.shapes.square.draw(graphics_state, row_translation, this.materials.floor);
                        let cealing = row_translation.times(Mat4.translation([0, 0, -4]));
                        this.shapes.square.draw(graphics_state, cealing, this.materials.floor);
                    } else if (row[j] === 1) {
                        box1_transform = row_translation.times(Mat4.rotation(4.7, Vec.of(1, 0, 0))).times(Mat4.translation([0, 2, 0]));
                        this.shapes.square.draw(graphics_state, box1_transform, this.materials.wall);
                        this.shapes.square.draw(graphics_state, box1_transform.times(Mat4.translation([0, -1, 0])), this.materials.wall);
                        this.shapes.square.draw(graphics_state, box1_transform.times(Mat4.translation([0, 1, 0])), this.materials.wall);
                        this.shapes.square.draw(graphics_state, box1_transform.times(Mat4.translation([0, 2, 0])), this.materials.wall);
                    } else if (row[j] === 2) {
                        box1_transform = row_translation.times(Mat4.rotation(4.7, Vec.of(1, 0, 0)))
                            .times(Mat4.rotation(4.7, Vec.of(0, 1, 0))).times(Mat4.translation([0, 2, 0]));
                        this.shapes.square.draw(graphics_state, box1_transform, this.materials.wall);
                        this.shapes.square.draw(graphics_state, box1_transform.times(Mat4.translation([0, -1, 0])), this.materials.wall);
                        this.shapes.square.draw(graphics_state, box1_transform.times(Mat4.translation([0, 1, 0])), this.materials.wall);
                        this.shapes.square.draw(graphics_state, box1_transform.times(Mat4.translation([0, 2, 0])), this.materials.wall);
                    } else if (row[j] === 3) {
                        this.shapes.square.draw(graphics_state, row_translation, this.materials.floor);
                        let player_transform = row_translation.times(Mat4.translation([this.c, 0, -1])).times(Mat4.scale([1 / 2, 1 / 2, 1 / 2]));
                        //this.shapes.player.draw(graphics_state, player_transform, this.materials.phong.override({color: Color.of(.5, 2, .5, 1)}));
                        //const desired_camera = Mat4.inverse(player_transform);
                        //graphics_state.camera_transform = desired_camera.map((x, i) => Vec.from(graphics_state.camera_transform[i]).mix(x, 4 * dt));
                    }
                }
            }*/
            this.playerPos = Vec.of(this.logic.posX, 0, this.logic.posZ);

            //this.shapes.box.draw(graphics_state, Mat4.translation([5,0,0]), this.materials.phong.override({color: Color.of([1.0,0.0,0.0,1.0]), ambient: 1}))
            /*this.colliders[1].translate(this.x, this.y, this.z)
            if (this.colliders[1].collides(this.colliders[2])) {
                this.colliders[1].draw(graphics_state, this.shapes.player, this.materials.phong2)
            }*/

            if (t > this.nextSpawn && t < this.nextSpawn + 1) {
                if (this.colliders.length < 7) {
                    this.colliders.push(new Monster([-5, 1, 0]));
                }
                this.nextSpawn += 5.0;
            }

            for (var i = 0; i < this.colliders.length; i++) {
                this.colliders[i].draw(graphics_state, this.shapes.player, this.materials.phong.override({color: this.colliders[i].color}));
                this.colliders[i].move(t, this.playerPos);
            }
        }
    };

window.Flashlight_Shader = window.classes.Flashlight_Shader =
    class Flashlight_Shader extends Phong_Shader {
        shared_glsl_code() {
            return `
        precision mediump float;
        varying float ambient, animation_time;
        varying vec2 f_tex_coord;
        varying vec4 position, center;
    `;}

        vertex_glsl_code() {
            return `
    attribute vec3 object_space_pos;
    attribute vec2 tex_coord;

    uniform mat4 model_transform, camera_model_transform, projection_camera_model_transform;

    void main()
    {
        position = model_transform * vec4(object_space_pos, 1.0);
        center = model_transform * vec4( 0,0,0,1 );
        gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);
        f_tex_coord = tex_coord;

        vec3 screen_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
    }
    `;
        }

        fragment_glsl_code() {
            return `
    uniform sampler2D texture;
    uniform vec4 shapeColor;
    void main()
    {
        float distance = distance(position, center);
        vec4 tex_color = texture2D( texture, f_tex_coord );

        float alpha = tex_color.w * shapeColor.w;
        if (alpha < 0.2) discard;

        gl_FragColor = vec4( tex_color.xyz, alpha );
    }
    `;
        }
    }

