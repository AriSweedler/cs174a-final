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

  collides(otherCollider) {
    if (otherCollider.constructor.name === "CollidingSphere") {
      const diffVec = Vec.of(...this.position).minus(Vec.of(...otherCollider.position))
      //console.log(diffVec)
      const dist = Math.sqrt(diffVec.dot(diffVec))
      return dist <= this.radius + otherCollider.radius
    }
    if (otherCollider.constructor.name === "CollidingCube") {
      for (let i = 0; i < 6; i++) {
        //console.log(otherCollider.planes[i].collides(this))
        //console.log(i)
        if (otherCollider.planes[i].collides(this)) {
          return true;
        }
      }
      return false;
    }
  }

  translate(x, y, z) {
    this.position[0] = x
    this.position[1] = y
    this.position[2] = z
  }
}

window.CollidingCube = window.classes.CollidingCube =
class CollidingCube {
  constructor(position, scale, rotAngle, rotAxis) {
    this.position = position
    this.scale = scale;
    this.rotAngle = rotAngle
    this.rotAxis = rotAxis
    this.planes = []

    const x = scale[0]
    const y = scale[1]
    const z = scale[2]
    let corners = [Vec.of(x, y, z, 1),Vec.of(-x,y,z,1),Vec.of(-x,-y,z,1),Vec.of(x,-y,z,1),Vec.of(x,y,-z,1),Vec.of(-x,y,-z,1),Vec.of(-x,-y,-z,1),Vec.of(x,-y,-z,1)]
    for (let i = 0; i < 8; i++) {
      corners[i] = Mat4.translation(position).times(Mat4.rotation(rotAngle, rotAxis)).times(corners[i])
     //console.log(Mat4.rotation(rotAngle, rotAxis).times(Mat4.translation(position).times(corners[i])))
     //console.log(Mat4.translation(position).times(corners[i]))
    }
  
    let centers = [corners[0].plus(corners[7]).times(0.5), corners[1].plus(corners[6]).times(0.5), corners[0].plus(corners[5]).times(0.5), corners[3].plus(corners[6]).times(0.5), corners[0].plus(corners[2]).times(0.5), corners[4].plus(corners[6]).times(0.5)]
    //console.log(centers[0])
   //console.log(centers)
   //console.log(corners)
    this.planes[0] = new CollidingPlane(centers[0], [corners[0], corners[3], corners[4], corners[7]])
    this.planes[1] = new CollidingPlane(centers[1], [corners[1], corners[2], corners[5], corners[6]])
    this.planes[2] = new CollidingPlane(centers[2], [corners[0], corners[3], corners[4], corners[5]])
    this.planes[3] = new CollidingPlane(centers[3], [corners[2], corners[3], corners[6], corners[7]])
    this.planes[4] = new CollidingPlane(centers[4], [corners[0], corners[1], corners[2], corners[3]])
    this.planes[5] = new CollidingPlane(centers[5], [corners[4], corners[5], corners[6], corners[7]])
  }

  draw(graphics_state, model, material) {
    const transform = Mat4.translation(this.position)
                      .times(Mat4.rotation(this.rotAngle, this.rotAxis))
                      .times(Mat4.scale(this.scale))
    
    model.draw(graphics_state, transform, material)
  }

  translate(x, y, z) {
    this.position[0] = x
    this.position[1] = y
    this.position[2] = z
  }

}

class CollidingPlane {
  constructor(center, points) {
    this.center = center
    this.points = points
  }

  collides(otherSphere) {
    this.normal = Vec.of(...this.points[0]).minus(Vec.of(...this.points[1])).cross(Vec.of(...this.points[0]).minus(Vec.of(...this.points[2])))
    //console.log(Vec.of(...this.points[0]).minus(Vec.of(...this.points[1])))
    //console.log(Vec.of(...this.points[0]).minus(Vec.of(...this.points[2])))
    //console.log(this.normal)
    const spherePos = Vec.of(...otherSphere.position)
    //console.log(spherePos)
    const planePos = Vec.of(...this.center)
    //console.log(planePos)
    const planeToSphere = spherePos.minus(planePos)
    //console.log(planeToSphere)
    const pointOnPlane = planePos.plus(planeToSphere.minus(this.normal.normalized().times(planeToSphere.dot(this.normal.normalized())))).to3()
    //console.log(this.normal.normalized())
    //console.log(planeToSphere.dot(this.normal.normalized()))
    //console.log(pointOnPlane)
    const toCorners = []
    for (let i = 0; i < 4; i++) {
      toCorners[i] = Vec.of(...this.points[i]).to3().minus(pointOnPlane)
      //console.log(toCorners[0])
    }
    const outside = toCorners[0].dot(toCorners[1]) > 0 && toCorners[0].dot(toCorners[2]) > 0 && toCorners[0].dot(toCorners[3]) > 0
    //console.log(outside)
    //console.log(pointOnPlane.minus(spherePos))
    //console.log(pointOnPlane.minus(spherePos).norm())
    return !outside && pointOnPlane.minus(spherePos).norm() <= otherSphere.radius
  }
}