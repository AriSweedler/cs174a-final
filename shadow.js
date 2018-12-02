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
      varying vec4 positionFromLight[N_LIGHTS];
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
          positionFromLight[i] = projection_transform * light_transform[i] * world_position;
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
        vec3 vertex_relative_to_light = positionFromLight[0].xyz / positionFromLight[0].w;
        vertex_relative_to_light = vertex_relative_to_light * 0.5 + 0.5;
        vec4 shadowmap_dist = texture2D(shadowmap, vertex_relative_to_light.xy);
        gl_FragColor = shadowmap_dist;
        
        if (in_shadow(positionFromLight[0])) {
          gl_FragColor = vec4(1.0,0.0,0.0,1.0);
        }
        else {
          gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
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