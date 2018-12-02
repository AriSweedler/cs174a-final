window.Term_Project_Scene = window.classes.Term_Project_Scene =
    class Term_Project_Scene extends Scene_Component {
        constructor(context, control_box)     // The scene begins by requesting the camera, shapes, and materials it will need.
        {
            super(context, control_box);    // First, include a secondary Scene that provides movement controls:
            
            new CollidingSphere(true, Mat4.translation([1,2,3]), true, true)
            if (!context.globals.has_controls)
                context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

            context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 2, 10), Vec.of(0, 2, 0), Vec.of(0, 1, 0));

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
            this.colliders =  [new Monster([0,0,0]), new CollidingSphere([0,0,0], 0, [1,0,0], 1), new CollidingCube([0,0,0], [1,1,1], 0, [1,0,0])];
         
           
            this.submit_shapes(context, shapes);
            this.logic = new Logic();
            this.materials = {
                phong: context.get_instance(Phong_Shader).material(Color.of(1, 1, 0, 1)),
                phong2:context.get_instance(Phong_Shader).material(Color.of(1, 1, 1, 1),{ambient: 1, diffuse: 1}),
                phong3:context.get_instance(Phong_Shader).material(Color.of(1, 0, 1, 1),{ambient: 1, diffuse: 1}),
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
            this.x = 0;
            this.y = 0;
            this.z = 0;
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

            this.key_triggered_button("up", ["8"], () => this.moveup = true, undefined, () => this.moveup = false);
            this.key_triggered_button("down", ["2"], () => this.movedown = true, undefined, () => this.movedown = false);
            this.key_triggered_button("left", ["4"], () => this.moveleft = true, undefined, () => this.moveleft = false);
            this.key_triggered_button("right", ["6"], () => this.moveright = true, undefined, () => this.moveright = false);
            this.key_triggered_button("in", ["7"], () => this.movein = true, undefined, () => this.movein = false);
            this.key_triggered_button("out", ["9"], () => this.moveout = true, undefined, () => this.moveout = false);

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

        display(graphics_state) {

            // (Draw scene 1)
            graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
            const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
/*            this.time = t;
            let box1_transform = Mat4.identity();
            let box2_transform = Mat4.identity();

            let floor_transform = Mat4.identity();
            floor_transform = floor_transform.times(Mat4.translation([0, -1, 1]))
                .times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0)));

*/
            if (this.moveright) { this.x += 0.2 }
            if (this.moveup) { this.y += 0.2 }
            if (this.moveleft) { this.x -= 0.2 }
            if (this.movedown) { this.y -= 0.2 }
            if (this.movein) { this.z -= 0.2 }
            if (this.moveout) { this.z += 0.2 }
            

            //this.shapes.box.draw(graphics_state, Mat4.translation([5,0,0]), this.materials.phong.override({color: Color.of([1.0,0.0,0.0,1.0]), ambient: 1}))
            this.colliders[1].translate(this.x, this.y, this.z)
            if (this.colliders[1].collides(this.colliders[2])) {
                this.colliders[1].draw(graphics_state, this.shapes.player, this.materials.phong2)
            }
            else {
                this.colliders[1].draw(graphics_state, this.shapes.player, this.materials.phong3)
            }
            this.colliders[2].draw(graphics_state, this.shapes.box, this.materials.phong3)

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
