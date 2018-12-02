const moveRate = 0.35;
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
        this.viewDir = 0;
        this.posZ = 0;
        this.posX = 0;
    }

    changeAngle(angle) {
        this.viewDir = this.viewDir + angle * angleRate;
    }

    move(dist) {
        dist *= moveRate;
        this.posZ += dist * Math.cos(this.viewDir);
        this.posX += dist * Math.sin(this.viewDir);
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