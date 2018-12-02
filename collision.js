window.CollidingSphere = window.classes.CollidingSphere =
class CollidingSphere {
  constructor(position, rotAngle = 0.0, rotAxis= [1,0,0], radius) {
    this.position = position
    this.rotAngle = rotAngle
    this.rotAxis = rotAxis
    this.radius = radius
  }

  draw(graphics_state, model, material) {
    //console.log('hello')
    const transform = Mat4.identity()//.times(Mat4.translation([0,1,0]))
                                     .times(Mat4.translation(this.position))
                                     .times(Mat4.rotation(this.rotAngle, this.rotAxis))
                                     .times(Mat4.scale([this.radius, this.radius, this.radius]))
    model.draw(graphics_state, transform, material)
  }

  collides(otherSphere) {
      const diffVec = Vec.of(...this.position).minus(Vec.of(...otherSphere.position))
      //console.log(diffVec)
      const dist = Math.sqrt(diffVec.dot(diffVec))
      return dist <= this.radius + otherSphere.radius
  }

  translate(x, y, z) {
    this.position[0] += x
    this.position[1] += y
    this.position[2] += z
  }

}
