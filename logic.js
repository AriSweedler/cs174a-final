const moveRate = 0.30;
const angleRate = 0.04;

class Logic {
    constructor() {
        this.grid = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];
        this.reset();
    }

    reset() {
        this.dead = false;
        this.deathTime = 0;
        this.viewDir = 0;
        this.posZ = 0;
        this.posX = 0;
        this.health = 100;
        this.score = 0;
        this.spawn_period = 5.0;
        this.playerHit = 0;
        this.ghostDamage = 3;
        this.timeBetweenHits = 1;
        this.max_ghosts = 4;
        this.level = 1;
    }

    levelUp() {
        this.level++;
        this.spawn_period *= 0.8;
        this.ghostDamage += 4;
        this.timeBetweenHits *= 0.7;
        this.max_ghosts += 2;
    }

    getKill() {
        this.score += 10 + 5*this.level;
    }

    minusHealth(damage) {
        this.health = this.health - damage;
        if (this.health <= 0) {
            this.endGame = true;
        }
    }

    killMonster() {
        this.score += 50;
    }

    changeAngle(angle) {
        this.viewDir = this.viewDir + angle * angleRate;
    }

    move(dist) {
        dist *= moveRate;
        this.posZ += dist * Math.cos(this.viewDir);
        this.posX += dist * Math.sin(this.viewDir);
    }

    moveP(dist) {
        dist *= moveRate;
        this.posZ += dist * Math.cos(this.viewDir);
        this.posX += dist * Math.sin(this.viewDir);
    }

    jump(dist) {
        dist *= moveRate;
        this.posY += dist;
    }

    checkBoundries(grid) {
        for (let i = 0; i < grid.length; i++) {
            let row = grid[i];
            for (let j = 0; j < row.length; j++) {
                if (row[j] === 2) {
                    if (j > row.length || j < 0) {
                        return false;
                    } else if (i > grid.length || i < 0) {
                        return false;
                    } else {
                        true;
                    }
                }
            }
        }
    }
}