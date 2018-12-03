window.Monster= window.classes.Monster =
class Monster extends CollidingSphere {
  constructor(position) {
     super(position, 0, Vec.of(0,1,0), 0.75);
     this.health = 100.0;
     this.color = Color.of(1,1,1,1);
     this.hit = false;
     this.direction = Vec.of(-25+50*Math.random(),4*Math.random(),10*Math.random()).minus(Vec.of(...position));
     this.speed = 0.002;
     this.alive = true;
  }

  damage(){
    this.health = this.health - 0.5;
    this.speed = 0.005+(100-this.health)*0.0015;
    this.color = Color.of(1,1-((250-2.5*this.health)/100),1-((250-2.5*this.health)/100),(this.health/100.0));
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
     
     const maxX = 50;
     const minX = -50;
     const maxZ = 50;
     const minZ = -50;
     const minY = -4;
     const maxY = 4; 

    if(this.hit){ //seek player if hit
        this.direction = playerPos.minus(Vec.of(...this.position));
        const dist = Math.sqrt(this.direction.dot(this.direction));

        this.position[0] += this.speed*this.direction[0]/dist;
        this.position[1] += this.speed*this.direction[1]/dist;
        this.position[2] += this.speed*this.direction[2]/dist;
        var sq = Math.sqrt((this.direction[0]*this.direction[0])+(this.direction[2]*this.direction[2]));
        

    }else{//move arbitrarily
        t = 0.02*Math.sin(1.3*t);
        if(this.position[0] > maxX || this.position[0] <minX || this.position[1] < minY || this.position[1] > maxY
        || this.position[2] > maxZ || this.position[2] < minZ){
          this.rotation = 0.0;
          //this.rotAxis = Vec.of(0,0,0);

          this.direction = Vec.of(minX+(maxX-minX)*Math.random(),minY+(maxY-minY)*Math.random(),minZ+(maxZ-minZ)*Math.random()).minus(Vec.of(...this.position));
          var sq = Math.sqrt((this.direction[0]*this.direction[0])+(this.direction[2]*this.direction[2]));
          this.rotation = Math.atan2(sq,Math.abs(this.direction[1]));      
        
        }
        this.position[0] += this.speed*this.direction[0]; 
        this.position[1] += this.speed*this.direction[1]; 
        this.position[2] += this.speed*this.direction[2];
       
    }
     
  }

}