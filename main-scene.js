window.Assignment_Three_Scene = window.classes.Assignment_Three_Scene =
    class Assignment_Three_Scene extends Scene_Component {
        constructor(context, control_box)     // The scene begins by requesting the camera, shapes, and materials it will need.
        {
            super(context, control_box);    // First, include a secondary Scene that provides movement controls:
            
            new CollidingSphere(true, Mat4.translation([1,2,3]), true, true)
            if (!context.globals.has_controls)
                context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

            context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 2, 10), Vec.of(0, 2, 0), Vec.of(0, 1, 0));

            const r = context.width / context.height;
            context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

            const shapes = {
                box: new Cube(),
                box_2: new Cube(),
                axis: new Axis_Arrows(),
                square: new Square(),
                player: new Subdivision_Sphere(4)
            };  
            this.colliders =  [new Monster([0,0,0])];
         
           
            this.submit_shapes(context, shapes);
            this.logic = new Logic();
            this.materials =
                {
                    phong: context.get_instance(Phong_Shader).material(Color.of(1, 1, 0, 1), {ambient: 1, diffuse: 1}),
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
                    tex: context.get_instance(Tex_Shader).material(),
                    shadow: context.get_instance(Shadow_Shader).material(0.1)

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

            this.lights = [ new Light( Mat4.look_at(Vec.of(15, 0, 15), Vec.of(0, 0, 0), Vec.of(0, 1, 0)), Vec.of(0,0,6), Color.of( 1, 1, 1, 1 ), 1000 ) ];
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
        }

        display(graphics_state, gl) {
            graphics_state.lights = this.lights

            const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

            const x = 2.0 * Math.cos(t)
            const y = 2.0 * Math.sin(t)
            let light = this.lights[0].transform

            let width = 256
      let height = 256
      let color_buffer = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, color_buffer);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
                                  gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      let depth_buffer = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, depth_buffer);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0,
                                  gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      let frame_buffer = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, frame_buffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color_buffer, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,  gl.TEXTURE_2D, depth_buffer, 0);

            //this.shapes.player.draw(graphics_state, Mat4.translation([x,y,1]), this.materials.phong2)
            let temp = graphics_state.camera_transform;
            graphics_state.camera_transform = light
            this.shapes.box.draw(graphics_state, Mat4.identity().times(Mat4.scale([2,2,1])), this.materials.phong)
            this.shapes.box.draw(graphics_state, Mat4.translation([0,0,-5]).times(Mat4.scale([8,8,1])), this.materials.phong2)
            this.shapes.box.draw(graphics_state, Mat4.translation([0,9,0]).times(Mat4.scale([8,1,8])), this.materials.phong2)
            this.shapes.box.draw(graphics_state, Mat4.translation([0,-9,0]).times(Mat4.scale([8,1,8])), this.materials.phong2)
            this.shapes.box.draw(graphics_state, Mat4.translation([9,0,0]).times(Mat4.scale([1,8,8])), this.materials.phong2)
            this.shapes.box.draw(graphics_state, Mat4.translation([-9,0,0]).times(Mat4.scale([1,8,8])), this.materials.phong2)
            //this.shapes.player.draw(graphics_state, Mat4.translation([0,0,4]), this.materials.phong2)
            graphics_state.camera_transform = temp
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            
            //gl.clearColor(0,0,0,1);
            //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

gl.bindTexture(gl.TEXTURE_2D, depth_buffer)
            this.shapes.box.draw(graphics_state, Mat4.identity().times(Mat4.scale([2,2,1])), this.materials.shadow)
            this.shapes.box.draw(graphics_state, Mat4.translation([0,0,-9]).times(Mat4.scale([8,8,1])), this.materials.shadow)
            this.shapes.box.draw(graphics_state, Mat4.translation([0,9,0]).times(Mat4.scale([8,1,8])), this.materials.shadow)
            this.shapes.box.draw(graphics_state, Mat4.translation([0,-9,0]).times(Mat4.scale([8,1,8])), this.materials.shadow)
            this.shapes.box.draw(graphics_state, Mat4.translation([9,0,0]).times(Mat4.scale([1,8,8])), this.materials.shadow)
            this.shapes.box.draw(graphics_state, Mat4.translation([-9,0,0]).times(Mat4.scale([1,8,8])), this.materials.shadow)

            //gl.bindTexture(gl.TEXTURE_2D, null)
//gl.bindTexture(gl.TEXTURE_2D, null)
            this.shapes.box.draw(graphics_state, Mat4.inverse(light), this.materials.phong2)
            //this.shapes.player.draw(graphics_state, Mat4.translation([0,0,4]), this.materials.phong2)
            
            
            

            /*
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
            */
        }
    };

class Texture_Scroll_X extends Phong_Shader {
    fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    {
        // TODO:  Modify the shader below (right now it's just the same fragment shader as Phong_Shader) for requirement #6.
        return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          vec4 workingCoords = vec4(f_tex_coord,1.0,1.0);
          float i = 2.0*(animation_time - 2.0 * floor(animation_time/2.0));
          mat4 translateM = mat4(1.0, 0.0, 0.0, 0.0,
                                 0.0, 1.0, 0.0, 0.0,
                                 0.0, 0.0, 1.0, 0.0,
                                 i,   0.0,   0.0,   1.0);
          vec4 translated = translateM*workingCoords;
          vec2 cut = translated.xy;
          vec4 tex_color = texture2D( texture, cut );                         // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }
}

class Texture_Rotate extends Phong_Shader {
    fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    {
        // TODO:  Modify the shader below (right now it's just the same fragment shader as Phong_Shader) for requirement #7.
        return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          vec4 workingCoords = vec4(f_tex_coord,1.0,1.0);
          float i = 0.5*3.1415926*(animation_time - 4.0 * floor(animation_time/4.0));
          mat4 translateM = mat4(1.0, 0.0, 0.0, 0.0,
                                 0.0, 1.0, 0.0, 0.0,
                                 0.0, 0.0, 1.0, 0.0,
                                 -0.5,   -0.5,   0.0,   1.0);
          mat4 rotateM = mat4(cos(i), sin(i), 0.0, 0.0,
                                 -sin(i), cos(i), 0.0, 0.0,
                                 0.0, 0.0, 1.0, 0.0,
                                 0.0,   0.0,   0.0,   1.0);
          mat4 invTranslateM = mat4(1.0, 0.0, 0.0, 0.0,
                                 0.0, 1.0, 0.0, 0.0,
                                 0.0, 0.0, 1.0, 0.0,
                                 -0.5,   -0.5,   0.0,   1.0);
          vec4 translated = invTranslateM*rotateM*translateM*workingCoords;
          vec2 cut = translated.xy;
          vec4 tex_color = texture2D( texture, cut );                          // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }
}
