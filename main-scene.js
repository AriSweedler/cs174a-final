window.Assignment_Three_Scene = window.classes.Assignment_Three_Scene =
    class Assignment_Three_Scene extends Scene_Component {
        constructor(context, control_box)     // The scene begins by requesting the camera, shapes, and materials it will need.
        {
            super(context, control_box);    // First, include a secondary Scene that provides movement controls:
            
            new CollidingSphere(true, Mat4.translation([1,2,3]), true, true)
            if (!context.globals.has_controls)
                context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

            context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 4, 9), Vec.of(0, -1, 0), Vec.of(0, 1, 0));

            const r = context.width / context.height;
            context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

            // TODO:  Create two cubes, including one with the default texture coordinates (from 0 to 1), and one with the modified
            //        texture coordinates as required for cube #2.  You can either do this by modifying the cube code or by modifying
            //        a cube instance's texture_coords after it is already created.
            const shapes = {
                box: new Cube(),
                box_2: new Cube(),
                axis: new Axis_Arrows(),
                square: new Square(),
                player: new Subdivision_Sphere(4),
            }
            this.colliders = {
                sphere1: new CollidingSphere([-5, 3, 3], 0, [1,0,0], 1),
                sphere2: new CollidingSphere([5, 3, 3], 0, [1,0,0], 2)
            }
            shapes.box_2.texture_coords = [Vec.of(0, 0), Vec.of(2, 0), Vec.of(0, 2), Vec.of(2, 2),
                Vec.of(2, 0), Vec.of(4, 0), Vec.of(2, 2), Vec.of(4, 2),
                Vec.of(0, 2), Vec.of(2, 2), Vec.of(0, 4), Vec.of(2, 4),
                Vec.of(2, 2), Vec.of(4, 2), Vec.of(2, 4), Vec.of(4, 4),
                Vec.of(0, 0), Vec.of(2, 0), Vec.of(0, 2), Vec.of(2, 2),
                Vec.of(2, 0), Vec.of(4, 0), Vec.of(2, 2), Vec.of(4, 2),
                Vec.of(0, 2), Vec.of(2, 2), Vec.of(0, 4), Vec.of(2, 4),
                Vec.of(2, 2), Vec.of(4, 2), Vec.of(2, 4), Vec.of(4, 4),
                Vec.of(0, 0), Vec.of(2, 0), Vec.of(0, 2), Vec.of(2, 2),
                Vec.of(2, 0), Vec.of(4, 0), Vec.of(2, 2), Vec.of(4, 2),
                Vec.of(0, 2), Vec.of(2, 2), Vec.of(0, 4), Vec.of(2, 4),
                Vec.of(2, 2), Vec.of(4, 2), Vec.of(2, 4), Vec.of(4, 4),
                Vec.of(0, 0), Vec.of(2, 0), Vec.of(0, 2), Vec.of(2, 2),
                Vec.of(2, 0), Vec.of(4, 0), Vec.of(2, 2), Vec.of(4, 2),
                Vec.of(0, 2), Vec.of(2, 2), Vec.of(0, 4), Vec.of(2, 4),
                Vec.of(2, 2), Vec.of(4, 2), Vec.of(2, 4), Vec.of(4, 4),
                Vec.of(0, 0), Vec.of(2, 0), Vec.of(0, 2), Vec.of(2, 2),
                Vec.of(2, 0), Vec.of(4, 0), Vec.of(2, 2), Vec.of(4, 2),
                Vec.of(0, 2), Vec.of(2, 2), Vec.of(0, 4), Vec.of(2, 4),
                Vec.of(2, 2), Vec.of(4, 2), Vec.of(2, 4), Vec.of(4, 4),
                Vec.of(0, 0), Vec.of(2, 0), Vec.of(0, 2), Vec.of(2, 2),
                Vec.of(2, 0), Vec.of(4, 0), Vec.of(2, 2), Vec.of(4, 2),
                Vec.of(0, 2), Vec.of(2, 2), Vec.of(0, 4), Vec.of(2, 4),
                Vec.of(2, 2), Vec.of(4, 2), Vec.of(2, 4), Vec.of(4, 4)];
            this.submit_shapes(context, shapes);
            this.logic = new Logic();
            // TODO:  Create the materials required to texture both cubes with the correct images and settings.
            //        Make each Material from the correct shader.  Phong_Shader will work initially, but when
            //        you get to requirements 6 and 7 you will need different ones.
            this.materials =
                {
                    phong: context.get_instance(Phong_Shader).material(Color.of(1, 1, 0, 1)),
                    'wall': context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                        specularity: 0,
                        ambient: 0.5,
                        texture: context.get_instance("assets/stone03b.jpg", false)
                    }),
                    'floor': context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                        specularity: 0,
                        ambient: 0.7,
                        texture: context.get_instance("assets/floor.jpg", false)
                    })

                }

            this.lights = [new Light(Vec.of(-5, 5, 5, 1), Color.of(0, 1, 1, 1), 100000)];

            // TODO:  Create any variables that needs to be remembered from frame to frame, such as for incremental movements over time.
            this.rotateFlag = false;
            this.r1 = 0;
            this.r2 = 0;
            this.rTime = 0;
            this.c = 0;
            this.moveright = false;
        }

        make_control_panel() { // TODO:  Implement requirement #5 using a key_triggered_button that responds to the 'c' key.
            this.key_triggered_button("MoveRight", ["c"], () => { this.moveright = true; }, undefined, () => { this.moveright = false });
            this.key_triggered_button("MoveLeft", ["x"], () => { this.moveleft = true; }, undefined, () => { this.moveleft = false });
        }

        display(graphics_state) {
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


            // TODO:  Draw the required boxes. Also update their stored matrices.
            //this.shapes.axis.draw( graphics_state, Mat4.identity(), this.materials.phong );
            let grid_transform = Mat4.identity().times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0))).times(Mat4.translation([-7, 0, 0]));
            for (let i = 0; i < this.logic.grid.length; i++) {
                let transform = grid_transform.times(Mat4.translation([0, i, 0]));
                let row = this.logic.grid[i];
                for (let j = 0; j < row.length; j++) {
                    let row_translation = transform.times(Mat4.translation([j, 0, 0]));
                    if (row[j] === 0) {
                        this.shapes.square.draw(graphics_state, row_translation, this.materials.floor);
                    } else if (row[j] === 1) {
                        box1_transform = row_translation.times(Mat4.rotation(80, Vec.of(1, 0, 0))).times(Mat4.translation([0, 2, 0]));
                        this.shapes.square.draw(graphics_state, box1_transform.times(Mat4.scale([1, 2, 1])), this.materials.wall);
                    } else if (row[j] === 2) {
                        this.shapes.square.draw(graphics_state, row_translation, this.materials.floor);
                        if (this.c >= 10)
                            this.c = -5;
                        let player_transform = row_translation.times(Mat4.translation([this.c, 0, -1])).times(Mat4.scale([1 / 2, 1 / 2, 1 / 2]));
                        this.shapes.player.draw(graphics_state, player_transform, this.materials.phong.override({color: Color.of(.5, 2, .5, 1)}));
                    }
                }
            }

            if (this.moveright) { this.colliders.sphere1.translate(0.2,0,0) }
            if (this.moveleft) { this.colliders.sphere1.translate(-0.2,0,0) }

            //console.log(this.colliders)
            this.colliders.sphere1.draw(graphics_state, this.shapes.player, this.materials.phong)
            //console.log(1)
            if (this.colliders.sphere1.collides(this.colliders.sphere2)) {
                //console.log('colliding')
                this.colliders.sphere2.draw(graphics_state, this.shapes.player, this.materials.phong.override({color: Color.of(1, 0, 0, 1)}))
            }
            else {
                //console.log('not colliding')
                this.colliders.sphere2.draw(graphics_state, this.shapes.player, this.materials.phong)
            }
            //console.log(2)

            // this.shapes.square.draw(graphics_state, box1_transform, this.materials.wall);
            // this.shapes.square.draw(graphics_state, box2_transform, this.materials.wall);
            // this.shapes.square.draw(graphics_state, floor_transform, this.materials.floor);
        }
    }

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