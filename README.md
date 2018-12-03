# term-project-group-24 - Luigi's Legally Distinct Haunted Mansion

## What It Is

Our project is a simple 3D first person game. You are trapped in a location
swarming with rotund ghosts and you must use your trusty flashlight to destroy
as many of them as you can! The game uses WASD tank controls for movement and
the direction of your flashlight is controlled with IJKL.

## What We Did

### Ari Sweedler, 704742749, ari@sweedler.com
* The flashlight. Used Sijay's collider function to check collision (of the
  flashlight beam) with Darica's ghost.
  * I use the model transform of the player as my origin - I put the flashlight
    origin where I think the right hand of the player would be  (if our player
    had a right hand)
  * Then, I placed a cone at the flashlight origin to represent the light. I
    failed at the crepscular lighting part of my task 
    * I instead wrote a custom shader that just rotated a "light ray" texture
      over a cone. I placed 5 of these "light cones" a the flashlight origin to
      affect light rays.
  * Also coming from the flashlight origin are a series of sphere collider
    obejcts, scaled and translated to be inside the light cone. It's the same
    exact method as drawing assignment 1's boxes.
    * Instead of drawing these, I simply get their xyz coordinates & radius,
      then check to see if they collide with any ghosts.

### Darica Louie, 904785399, darica.louie@gmail.com
* Used Sijay's colliding sphere class to extend to ghost class.
  * ghosts move by randomly generating a position within bounds and moving toward there
  * once damaged, ghosts move toward player by traveling along vector from player position to ghost position
  * ghosts' damage is visually represented by their size and transparency
* Added sound
* Added start screen


### Nikita Lukyanenko, 104951076, nikita1923666@gmail.com
* Implemented text in to the dependencies
* Added logic general file
* Implemented health and score on the screen
* Implemented controls of the movement
* Added last dying scene

### Sijay Liu, 904787869, sijay.liu@gmail.com
* Implemented collider objects for sphere-sphere and sphere-cube collisions.
* Implemented shadowmapping shader.
* Implemented simple level generation.

## How To Run It

Our project is run just like the homework with either the host.bat or
host.command file. Also like the homework, it can be accessed by navigating
to localhost:8000.

## Additional Information
