window.Monster= window.classes.Monster =
class Monster extends CollidingSphere {
  constructor(position) {
     super(position, 0, Vec.of(0,1,0), 0.5);
     this.health = 100.0;
     this.color = Color.of(1,1,1,1);
     this.hit = false;
     this.direction = Vec.of(-4+14*Math.random(),4*Math.random(),10*Math.random()).minus(Vec.of(...position));
     this.speed = 0.005;
     this.alive = true;

     
  }

  damage(){
    this.health = this.health - 0.5;
    this.speed = 0.005+(100-this.health)*0.0015;
    this.color = Color.of(1,1,1,(this.health/100.0));
    this.radius = this.radius*((this.health+10.0)/110.0);
    if(this.radius < 0.3){
      this.radius = 0.3;

    }
    this.hit = true;
    if(this.health < 60){
      this.alive = false;
    }
  }

  move(t,playerPos){
     
    if(this.hit){ //seek player if hit
        this.direction = playerPos.minus(Vec.of(...this.position));
        const dist = Math.sqrt(this.direction.dot(this.direction));

        this.translate(this.speed*this.direction[0]/dist, this.speed*this.direction[1]/dist, this.speed*this.direction[2]/dist);
        var sq = Math.sqrt((this.direction[0]*this.direction[0])+(this.direction[2]*this.direction[2]));
        

    }else{//move arbitrarily
        t = 0.02*Math.sin(1.3*t);
        if(this.position[0] > 10 || this.position[0] <-5 || this.position[1] < -1 || this.position[1] > 4
        || this.position[2] > 9 || this.position[2] < -1){
          this.rotation = 0.0;
          //this.rotAxis = Vec.of(0,0,0);

          this.direction = Vec.of(-4+14*Math.random(),4*Math.random(),9*Math.random()).minus(Vec.of(...this.position));
          var sq = Math.sqrt((this.direction[0]*this.direction[0])+(this.direction[2]*this.direction[2]));
          this.rotation = Math.atan2(sq,Math.abs(this.direction[1]));      
        
        }
        this.translate(this.speed*this.direction[0], this.speed*this.direction[1], this.speed*this.direction[2]);
       
    }
     
  }

}