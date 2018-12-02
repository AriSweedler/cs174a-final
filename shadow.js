window.Shadow_Phong_Shader = window.classes.Shadow_Phong_Shader =
    class Shadow_Phong_Shader extends Shader          // THE DEFAULT SHADER: This uses the Phong Reflection Model, with optional Gouraud shading.
                                               // Wikipedia has good defintions for these concepts.  Subclasses of class Shader each store
                                               // and manage a complete GPU program.  This particular one is a big "master shader" meant to
                                               // handle all sorts of lighting situations in a configurable way.
                                               // Phong Shading is the act of determining brightness of pixels via vector math.  It compares
                                               // the normal vector at that pixel to the vectors toward the camera and light sources.
        // *** How Shaders Work:
        // The "vertex_glsl_code" string below is code that is sent to the graphics card at runtime,
        // where on each run it gets compiled and linked there.  Thereafter, all of your calls to draw
        // shapes will launch the vertex shader program once per vertex in the shape (three times per
        // triangle), sending results on to the next phase.  The purpose of this vertex shader program
        // is to calculate the final resting place of vertices in screen coordinates; each vertex
        // starts out in local object coordinates and then undergoes a matrix transform to get there.
        //
        // Likewise, the "fragment_glsl_code" string is used as the Fragment Shader program, which gets
        // sent to the graphics card at runtime.  The fragment shader runs once all the vertices in a
        // triangle / element finish their vertex shader programs, and thus have finished finding out
        // where they land on the screen.  The fragment shader fills in (shades) every pixel (fragment)
        // overlapping where the triangle landed.  It retrieves different values (such as vectors) that
        // are stored at three extreme points of the triangle, and then interpolates the values weighted
        // by the pixel's proximity to each extreme point, using them in formulas to determine color.
        // The fragment colors may or may not become final pixel colors; there could already be other
        // triangles' fragments occupying the same pixels.  The Z-Buffer test is applied to see if the
        // new triangle is closer to the camera, and even if so, blending settings may interpolate some
        // of the old color into the result.  Finally, an image is displayed onscreen.
    {
        material(color, properties)     // Define an internal class "Material" that stores the standard settings found in Phong lighting.
        {
            return new class Material       // Possible properties: ambient, diffusivity, specularity, smoothness, gouraud, texture.
            {
                constructor(shader, color = Color.of(0, 0, 0, 1), ambient = 0, diffusivity = 1, specularity = 1, smoothness = 40, texture = 0) {
                    Object.assign(this, {shader, color, ambient, diffusivity, specularity, smoothness, texture});  // Assign defaults.
                    Object.assign(this, properties);                                                        // Optionally override defaults.
                }

                override(properties)                      // Easily make temporary overridden versions of a base material, such as
                {
                    const copied = new this.constructor();  // of a different color or diffusivity.  Use "opacity" to override only that.
                    Object.assign(copied, this);
                    Object.assign(copied, properties);
                    copied.color = copied.color.copy();
                    if (properties["opacity"] != undefined) copied.color[3] = properties["opacity"];
                    return copied;
                }
            }(this, color);
        }

        map_attribute_name_to_buffer_name(name)                  // We'll pull single entries out per vertex by field name.  Map
        {                                                        // those names onto the vertex array names we'll pull them from.
            return {object_space_pos: "positions", normal: "normals", tex_coord: "texture_coords"}[name];
        }   // Use a simple lookup table.
        shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        {
            return `precision mediump float;
        const int N_LIGHTS = 1;             // We're limited to only so many inputs in hardware.  Lights are costly (lots of sub-values).
        uniform float ambient, diffusivity, specularity, smoothness, animation_time, attenuation_factor;
        uniform bool GOURAUD, COLOR_NORMALS, USE_TEXTURE;               // Flags for alternate shading methods
        uniform vec4 lightPosition, lightColor, shapeColor;
        varying vec3 N, E;                    // Specifier "varying" means a variable's final value will be passed from the vertex shader 
        varying vec2 f_tex_coord;             // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the 
        varying vec4 VERTEX_COLOR;            // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 L, H;
        varying float dist;
        varying vec4 positionFromLight;
        
        vec3 phong_model_lights( vec3 N, bool shadowed )
          { vec3 result = vec3(0.0);

                float s = 1.0;
                if (shadowed) { s = 0.5; }
                float attenuation_multiplier = 1.0 / (1.0 + attenuation_factor * (dist * dist));
                float diffuse  =      max( dot(N, L), 0.0 );
                float specular = pow( max( dot(N, H), 0.0 ), smoothness );

                result += s * attenuation_multiplier * ( shapeColor.xyz * diffusivity * diffuse + lightColor.xyz * specularity * specular );
              
            return result;
          }
        `;
        }

        vertex_glsl_code()           // ********* VERTEX SHADER *********
        {
            return `
        attribute vec3 object_space_pos, normal;
        attribute vec2 tex_coord;

        uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform, projection_transform, model_transform, light_transform;
        uniform mat3 inverse_transpose_modelview;

        void main()
        { gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);     // The vertex's final resting place (in NDCS).
          N = normalize( inverse_transpose_modelview * normal );                             // The final normal vector in screen space.
          f_tex_coord = tex_coord;                                         // Directly use original texture coords and interpolate between.
            
          vec4 world_position = (model_transform * vec4(object_space_pos, 1.0));
          positionFromLight = projection_transform * light_transform * world_position;


          if( COLOR_NORMALS )                                     // Bypass all lighting code if we're lighting up vertices some other way.
          { VERTEX_COLOR = vec4( N[0] > 0.0 ? N[0] : sin( animation_time * 3.0   ) * -N[0],             // In "normals" mode, 
                                 N[1] > 0.0 ? N[1] : sin( animation_time * 15.0  ) * -N[1],             // rgb color = xyz quantity.
                                 N[2] > 0.0 ? N[2] : sin( animation_time * 45.0  ) * -N[2] , 1.0 );     // Flash if it's negative.
            return;
          }
                                                  // The rest of this shader calculates some quantities that the Fragment shader will need:
          vec3 screen_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
          E = normalize( -screen_space_pos );


         // Light positions use homogeneous coords.  Use w = 0 for a directional light source -- a vector instead of a point.
            L = normalize( ( camera_transform * lightPosition ).xyz - lightPosition.w * screen_space_pos );
            H = normalize( L + E );
            
            // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
            dist  = lightPosition.w > 0.0 ? distance((camera_transform * lightPosition).xyz, screen_space_pos)
                                               : distance( attenuation_factor * -lightPosition.xyz, object_space_pos.xyz );
          

          if( GOURAUD )                   // Gouraud shading mode?  If so, finalize the whole color calculation here in the vertex shader, 
          {                               // one per vertex, before we even break it down to pixels in the fragment shader.   As opposed 
                                          // to Smooth "Phong" Shading, where we *do* wait to calculate final color until the next shader.
            VERTEX_COLOR      = vec4( shapeColor.xyz * ambient, shapeColor.w);
            VERTEX_COLOR.xyz += phong_model_lights( N, false );
          }
        }`;
        }

        fragment_glsl_code()           // ********* FRAGMENT SHADER *********
        {                            // A fragment is a pixel that's overlapped by the current triangle.
            // Fragments affect the final image or get discarded due to depth.
            return `
            uniform sampler2D shadowmap;
        uniform sampler2D texture;
        
        void main()
        { 
          vec3 vertex_relative_to_light = positionFromLight.xyz / positionFromLight.w;
          vertex_relative_to_light = vertex_relative_to_light * 0.5 + 0.5;
          float shadowmap_dist = texture2D(shadowmap, vertex_relative_to_light.xy).r;
          bool shadowed = vertex_relative_to_light.z > shadowmap_dist + 0.00002;
          
          if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          vec4 tex_color = texture2D( texture, f_tex_coord );                    // Sample the texture image in the correct place.
          float s = 1.0;
          if (shadowed) {s = 0.5;}                                                                            // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( s * ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N, shadowed );                   // Compute the final color with contributions from lights.
        }`;
        }

        // Define how to synchronize our JavaScript's variables to the GPU's:
        update_GPU(g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl) {                              // First, send the matrices to the GPU, additionally cache-ing some products of them we know we'll need:
            this.update_matrices(g_state, model_transform, gpu, gl);
            gl.uniform1f(gpu.animation_time_loc, g_state.animation_time / 1000);

            if (g_state.gouraud === undefined) {
                g_state.gouraud = g_state.color_normals = false;
            }    // Keep the flags seen by the shader
            gl.uniform1i(gpu.GOURAUD_loc, g_state.gouraud || material.gouraud);                // program up-to-date and make sure
            gl.uniform1i(gpu.COLOR_NORMALS_loc, g_state.color_normals);                              // they are declared.

            gl.uniform4fv(gpu.shapeColor_loc, material.color);    // Send the desired shape-wide material qualities
            gl.uniform1f(gpu.ambient_loc, material.ambient);    // to the graphics card, where they will tweak the
            gl.uniform1f(gpu.diffusivity_loc, material.diffusivity);    // Phong lighting formula.
            gl.uniform1f(gpu.specularity_loc, material.specularity);
            gl.uniform1f(gpu.smoothness_loc, material.smoothness);

            if (material.texture)                           // NOTE: To signal not to draw a texture, omit the texture parameter from Materials.
            {
                gpu.shader_attributes["tex_coord"].enabled = true;
                gl.uniform1f(gpu.USE_TEXTURE_loc, 1);
                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, material.texture.id);
                gl.activeTexture(gl.TEXTURE0)
            }
            else {
                gl.uniform1f(gpu.USE_TEXTURE_loc, 0);
                gpu.shader_attributes["tex_coord"].enabled = false;
            }

            if (!g_state.light) return;
            var lightPositions_flattened = [], lightColors_flattened = [], lightAttenuations_flattened = [];
            for (var i = 0; i < 4; i++) {
                lightPositions_flattened.push(g_state.light.position[i % 4]);
                lightColors_flattened.push(g_state.light.color[i % 4]);
                lightAttenuations_flattened[0] = g_state.light.attenuation;
            }
            
            var lightTransforms_flattened = Mat.flatten_2D_to_1D(g_state.light.transform.transposed())
            

            gl.uniformMatrix4fv(gpu.light_transform_loc, false, lightTransforms_flattened);
            gl.uniform4fv(gpu.lightPosition_loc, lightPositions_flattened);
            gl.uniform4fv(gpu.lightColor_loc, lightColors_flattened);
            gl.uniform1fv(gpu.attenuation_factor_loc, lightAttenuations_flattened);
            
            let shadowmap_loc = gl.getUniformLocation(this.program, "shadowmap")
            gl.uniform1i(shadowmap_loc, 0);
            let texture_loc = gl.getUniformLocation(this.program, "texture")
            gl.uniform1i(texture_loc, 1);
            
        }

        update_matrices(g_state, model_transform, gpu, gl)                                    // Helper function for sending matrices to GPU.
        {                                                   // (PCM will mean Projection * Camera * Model)
            let [P, C, M] = [g_state.projection_transform, g_state.camera_transform, model_transform],
                CM = C.times(M),
                PCM = P.times(CM),
                inv_CM = Mat4.inverse(CM).sub_block([0, 0], [3, 3]);
            // Send the current matrices to the shader.  Go ahead and pre-compute
            // the products we'll need of the of the three special matrices and just
            // cache and send those.  They will be the same throughout this draw
            // call, and thus across each instance of the vertex shader.
            // Transpose them since the GPU expects matrices as column-major arrays.
            gl.uniformMatrix4fv(gpu.model_transform_loc, false, Mat.flatten_2D_to_1D(M.transposed()));
            gl.uniformMatrix4fv(gpu.projection_transform_loc, false, Mat.flatten_2D_to_1D(P.transposed()));
            gl.uniformMatrix4fv(gpu.camera_transform_loc, false, Mat.flatten_2D_to_1D(C.transposed()));
            gl.uniformMatrix4fv(gpu.camera_model_transform_loc, false, Mat.flatten_2D_to_1D(CM.transposed()));
            gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
            gl.uniformMatrix3fv(gpu.inverse_transpose_modelview_loc, false, Mat.flatten_2D_to_1D(inv_CM));
        }
    }

class Shadow_Shader extends Shader {
  constructor (gl) {
    super(gl)

  }

  material() {
    return {shader: this}
  }
  
  map_attribute_name_to_buffer_name(name)        // The shader will pull single entries out of the vertex arrays, by their data fields'
  {                                              // names.  Map those names onto the arrays we'll pull them from.  This determines
            // which kinds of Shapes this Shader is compatible with.  Thanks to this function,
            // Vertex buffers in the GPU can get their pointers matched up with pointers to
            // attribute names in the GPU.  Shapes and Shaders can still be compatible even
            // if some vertex data feilds are unused.
    return {object_space_pos: "positions", color: "colors"}[name];      // Use a simple lookup table.
  }

  update_GPU(g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl) {
    const [P, C, M] = [g_state.projection_transform, g_state.camera_transform, model_transform],
      PCM = P.times(C).times(M), CM = C.times(M);
    gl.uniformMatrix4fv(gpu.model_transform_loc, false, Mat.flatten_2D_to_1D(M.transposed()));
    gl.uniformMatrix4fv(gpu.camera_transform_loc, false, Mat.flatten_2D_to_1D(C.transposed()));
    gl.uniformMatrix4fv(gpu.projection_transform_loc, false, Mat.flatten_2D_to_1D(P.transposed()));
    gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
    var lightTransforms_flattened = []
    for (var i = 0 ; i < g_state.lights.length; i++) {
      lightTransforms_flattened = Mat.flatten_2D_to_1D(g_state.lights[i].transform.transposed())
    }
    let lightColors_flattened = []
    for (var i = 0; i < 4 * g_state.lights.length; i++) {
      lightColors_flattened.push(g_state.lights[Math.floor(i / 4)].color[i % 4]);
    }
    gl.uniformMatrix4fv(gpu.light_transform_loc, false, lightTransforms_flattened);
    gl.uniform4fv(gpu.light_color_loc, lightColors_flattened);
  }

  shared_glsl_code() {
    return `
      precision mediump float;

      uniform float red;
      const int N_LIGHTS = 1;
      uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS];
      varying vec4 positionFromLight;
      varying vec4 world_position;
    `
  }
    
  vertex_glsl_code() {
    return `
      attribute vec3 object_space_pos;
      uniform mat4 projection_camera_model_transform;
      uniform mat4 projection_transform;
      uniform mat4 model_transform;
      uniform mat4 camera_transform;
      uniform mat4 light_transform[N_LIGHTS];

      void main() {
        gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);
        world_position = (model_transform * vec4(object_space_pos, 1.0));
        for (int i = 0; i < N_LIGHTS; i++) {
          positionFromLight = projection_transform * light_transform[i] * world_position;
        }

      }
    `
  }
    
  fragment_glsl_code() {
    return `
      uniform sampler2D shadowmap;
      bool in_shadow(vec4 vert) {
        vec3 vertex_relative_to_light = vert.xyz / vert.w;
        vertex_relative_to_light = vertex_relative_to_light * 0.5 + 0.5;
        float shadowmap_dist = texture2D(shadowmap, vertex_relative_to_light.xy).r;
        return vertex_relative_to_light.z > shadowmap_dist + 0.00001;
      }

      void main() {
        vec3 vertex_relative_to_light = positionFromLight.xyz / positionFromLight.w;
        vertex_relative_to_light = vertex_relative_to_light * 0.5 + 0.5;
        vec4 shadowmap_dist = texture2D(shadowmap, vertex_relative_to_light.xy);
        gl_FragColor = shadowmap_dist;
        
        if (in_shadow(positionFromLight)) {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
        else {
          gl_FragColor = vec4(0.0,1.0,0.0,1.0);
        }

        //gl_FragColor = texture2D(shadowmap, vertex_relative_to_light.xy);
      }
    `
  }
}

class Tex_Shader extends Shader {
  constructor (gl) {
    super(gl)
    
  }

  material(red) {
    return {shader: this, red: red}
  }
  
  map_attribute_name_to_buffer_name(name)        // The shader will pull single entries out of the vertex arrays, by their data fields'
  {                                              // names.  Map those names onto the arrays we'll pull them from.  This determines
            // which kinds of Shapes this Shader is compatible with.  Thanks to this function,
            // Vertex buffers in the GPU can get their pointers matched up with pointers to
            // attribute names in the GPU.  Shapes and Shaders can still be compatible even
            // if some vertex data feilds are unused.
    return {object_space_pos: "positions", normal: "normals", tex_coord: "texture_coords"}[name];      // Use a simple lookup table.
  }

  update_GPU(g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl) {
    const [P, C, M] = [g_state.projection_transform, g_state.camera_transform, model_transform],
      PCM = P.times(C).times(M);
    gl.uniformMatrix4fv(gpu.model_transform_loc, false, Mat.flatten_2D_to_1D(M.transposed()));
    gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
    gl.uniform1f(gpu.red_loc, material.red)
    var lightPositions_flattened = [], lightColors_flattened = [];
    for (var i = 0; i < 4 * g_state.lights.length; i++) {
      lightPositions_flattened.push(g_state.lights[Math.floor(i / 4)].position[i % 4]);
      lightColors_flattened.push(g_state.lights[Math.floor(i / 4)].color[i % 4]);
    }
    gl.uniform4fv(gpu.lightPosition_loc, lightPositions_flattened);
    gl.uniform4fv(gpu.lightColor_loc, lightColors_flattened);

    gpu.shader_attributes["tex_coord"].enabled = true;
    /*
    //gl.uniform1f(gpu.USE_TEXTURE_loc, 1);
    this.texture = gl.createTexture();

    var uint8 = new Uint8Array(262144 * 4)
    for (let i = 0; i < (262144 * 4); i += 4) {
      if (Math.sin(i / 10) > 0) {
        uint8[i] = 200
        uint8[i + 1] = 0
      }
      else {
        uint8[i] = 0
        uint8[i + 1] = 200
      }
      uint8[i + 2] = 0
      uint8[i + 3] = 255
    }


    uint8 = new Uint8Array([0, 0, 255, 255,0, 255, 0, 255,0, 255, 0, 255,0, 0, 255, 255])

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 
                             0, gl.RGBA, gl.UNSIGNED_BYTE, uint8);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //gl.bindTexture(gl.TEXTURE_2D, null)*/
  }

  shared_glsl_code() {
    return `
      precision mediump float;

      varying vec2 f_tex_coord;
      uniform float red;
      const int N_LIGHTS = 2;
      uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS];
      varying float dist[N_LIGHTS];
      
    `
  }
    
  vertex_glsl_code() {
    return `
      attribute vec3 object_space_pos;
      attribute vec2 tex_coord;
      uniform mat4 projection_camera_model_transform;
      uniform mat4 model_transform;

      void main() {
        f_tex_coord = tex_coord;
        gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);

      }
    `
  }
    
  fragment_glsl_code() {
    return `
      uniform sampler2D texture;

      void main() {
        //gl_FragColor = vec4(1.0, f_tex_coord.y, 0.0, 1.0);
        gl_FragColor = texture2D(texture, f_tex_coord);
        //gl_FragColor = vec4(1.0, 0.0, 0.0, 0.0);
        //for (int i = 0; i < N_LIGHTS; i++) {
        //  gl_FragColor.w += 1.0 / (1.0 + 0.5 * dist[i] * dist[i]);
        //}
      }
    `
  }
}