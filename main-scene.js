window.Term_Project_Scene = window.classes.Term_Project_Scene =
    class Term_Project_Scene extends Scene_Component {
        constructor(context, control_box)     // The scene begins by requesting the camera, shapes, and materials it will need.
        {
            super(context, control_box);    // First, include a secondary Scene that provides movement controls:
            
            new CollidingSphere(true, Mat4.translation([1,2,3]), true, true)
            if (!context.globals.has_controls)
                context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

            context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 2, 8), Vec.of(0, 2, 0), Vec.of(0, 1, 0));

            const r = context.width / context.height;
            context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

            this.webgl_manager = context;      // Save off the Webgl_Manager object that created the scene.
            this.scratchpad = document.createElement('canvas');
            this.scratchpad_context = this.scratchpad.getContext('2d');     // A hidden canvas for re-sizing the real canvas to be square.
            this.scratchpad.width   = 256;
            this.scratchpad.height  = 256;
            this.texture = new Texture ( context.gl, "", false, false );        // Initial image source: Blank gif file
            this.texture.image.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

            // TODO:  Create two cubes, including one with the default texture coordinates (from 0 to 1), and one with the modified
            //        texture coordinates as required for cube #2.  You can either do this by modifying the cube code or by modifying
            //        a cube instance's texture_coords after it is already created.
            const shapes = {
                box: new Cube(),
                box_2: new Cube(),
                cone: new Rounded_Closed_Cone(10, 10),
                axis: new Axis_Arrows(),
                square: new Square(),
                player: new Subdivision_Sphere(4)
            };  
            this.colliders =  [new Monster([0,0,0])];
         
           
            this.submit_shapes(context, shapes);
            this.logic = new Logic();
            this.materials = {
                phong: context.get_instance(Phong_Shader).material(Color.of(1, 1, 0, 1)),
                phong2:context.get_instance(Phong_Shader).material(Color.of(1, 1, 1, 1),{ambient: 1, diffuse: 1}),
                'wall': context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                    specularity: 0,
                    ambient: 0.5,
                    texture: context.get_instance("assets/stone03b.jpg", false)
                }),
                'floor': context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                    specularity: 0,
                    ambient: 0.7,
                    texture: context.get_instance("assets/floor.jpg", false)
                }),
                flashlight: context.get_instance(Flashlight_Shader).material(Color.of(0, 0, 0, 1), {
                    // ambient to 1, diffuse to 0, and specular to 0
                    ambient: 1,
                    diffusivity: 0,
                    specularity: 0,
                })
            };

            this.lights = [new Light(Vec.of(-5, 5, 5, 1), Color.of(0, 1, 1, 1), 100000)];

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
            //this.colliders = [];
            this.nextSpawn = 5.0;
            this.flashlight = {
                angle: {
                    x: 0,
                    y: 0
                },
                centerToTip: [0, 0, 1],
                playerToHand: [0.1, 0.1, -0.9],
                longThin: [1, 1, 5]
            };
        }

        make_control_panel() {
            this.key_triggered_button("MoveForward", ["g"], () => {
                this.logic.move(-1);
            });
            this.key_triggered_button("MoveBack", ["b"], () => {
                this.logic.move(1);
            });
            this.key_triggered_button("turnLeft", ["c"], () => {
                this.logic.changeAngle(1);
            });
            this.key_triggered_button("turnRight", ["v"], () => {
                this.logic.changeAngle(-1);
            });
            this.key_triggered_button("switchCamera", ["x"], () => {
                this.camera = !this.camera;
            });
            this.result_img = this.control_panel.appendChild( 
                Object.assign( document.createElement( "img" ), {
                    style:"width:200px; height:" + 200 * this.aspect_ratio + "px"
                } ) 
            );

            this.new_line();
            /*y = 0.8 is as far left, y=-0.8 is as far right*/
            /*x = 0.44 is top of the screen, x = -0.03 is the bottom of the screen*/
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
            });
        }

        display(graphics_state) {
            // (Draw scene 1)
            graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
            const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
            this.time = t;
            let box1_transform = Mat4.identity();
            let box2_transform = Mat4.identity();

            let floor_transform = Mat4.identity();
            floor_transform = floor_transform.times(Mat4.translation([0, -1, 1]))
                .times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0)));

            //box1_transform = box1_transform.times(Mat4.translation([-2,0,0]));
            box2_transform = box2_transform.times(Mat4.translation([2, 0, 0]));
            if (this.rotateFlag) {
                this.r1 = this.r1 + 0.5 * (t - this.rTime);
                this.r2 = this.r2 + ((t - this.rTime) / 3);

            }
            this.rTime = t;
            box1_transform = box1_transform.times(Mat4.rotation(this.r1, Vec.of(1, 0, 0)));
            box2_transform = box2_transform.times(Mat4.rotation(this.r2, Vec.of(0, 1, 0)));

            //PLAYER camera
            if (this.camera) {
                this.playerM = Mat4.identity();
                this.playerM = this.playerM.times(Mat4.translation([this.logic.posX, 0, this.logic.posZ]));
                this.playerM = this.playerM.times(Mat4.rotation(this.logic.viewDir, Vec.of(0, 1, 0)));
                graphics_state.camera_transform = Mat4.inverse(this.playerM.times(Mat4.translation([0, 1, 0])));
                this.time = t;
            } else if (t > this.time + 1) {
                graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 6, 8), Vec.of(0, 2, 0), Vec.of(0, 1, 0));
            }

            /************************************* flashlight *************************************************/
            /* Draw light coming from flashlight (player's hand) */
            this.flashlight.transform = this.playerM.times( Mat4.translation(this.flashlight.playerToHand) );

            /*place the tip of the flashlight where the players hand would be */
            this.flashlight.transform = this.flashlight.transform.times( Mat4.translation(this.flashlight.playerToHand) );

            /* Rotate the light first */
            /* angle.x++ moves the light up */
            /* angle.y++ moves the light left */
            this.flashlight.transform = this.flashlight.transform
                .times( Mat4.translation(this.flashlight.centerToTip) )
                .times( Mat4.rotation(this.flashlight.angle.x, [1, 0, 0]) )
                .times( Mat4.rotation(this.flashlight.angle.y, [0, 1, 0]) )
                .times( Mat4.translation(this.flashlight.centerToTip.map(i=>-i)) );

            /* Make the lightcone long and thin (long enough to hit the far wall) */
            this.flashlight.transform = this.flashlight.transform
                .times( Mat4.translation(this.flashlight.centerToTip) )
                .times( Mat4.scale(this.flashlight.longThin) )
                .times( Mat4.translation(this.flashlight.centerToTip.map(i=>-i)) );

            this.shapes.cone.draw(graphics_state, this.flashlight.transform, this.materials.flashlight);
            /************************************* flashlight *************************************************/

            let grid_transform = Mat4.identity().times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0))).times(Mat4.translation([-7, 0, 0]));
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
            }
            this.playerPos = Vec.of(this.logic.posX, 0, this.logic.posZ);

            if(t > this.nextSpawn && t < this.nextSpawn+1){
                if(this.colliders.length < 7){
                     this.colliders.push(new Monster([-5,1,0]));
                }
                this.nextSpawn += 5.0;
            }

            for(var i =0; i<this.colliders.length; i++){
                this.colliders[i].draw(graphics_state, this.shapes.player, this.materials.phong.override({color: this.colliders[i].color}));
                this.colliders[i].move(t,this.playerPos);
            }
            // (Save scene 1 into an image)
            this.scratchpad_context.drawImage( this.webgl_manager.canvas, 0, 0, 256, 256 );
            this.texture.image.src = this.result_img.src = this.scratchpad.toDataURL("image/png");

            // Clear the canvas and start over, beginning scene 2:
            // this.webgl_manager.gl.clear( this.webgl_manager.gl.COLOR_BUFFER_BIT | this.webgl_manager.gl.DEPTH_BUFFER_BIT);

            // (Draw scene 2)
        }
    };

class Flashlight_Shader extends Phong_Shader {
    /*************************** FRAGMENT SHADER ****************************/
    fragment_glsl_code() {return `
    uniform sampler2D texture;
    void main()
    {
        gl_FragColor = vec4(1, 1, 1, 1);
    }
    `;}
}
