// FIXME, issue of clicking-out-of-window then releasing key then clicking back into the window

// TODO, comment on the changes, upload to github
// TODO, full game over screen
// TODO, full pause screen
// TODO, back button from canvas
// TODO, better looking info page
// TODO, better looking snake-canvas and score
// TODO, package this up into an electron app 




// helper functions
function getRandomInt(min_included, max_not_included) 
    {
        return Math.floor(Math.random() * (max_not_included - min_included)) + min_included;
    }
function sigmoid(input_) 
    {
        return 1/(1+Math.pow(Math.E, -input_));
    }


// global vars (mostly for the can)
var SCORE             = 0;
var DEFAULT_FRAMERATE = 10;
var FRAMERATE         = DEFAULT_FRAMERATE;
var PIXELS_PER_BLOCK  = 30;
var INFOBAR_HEIGHT    = 60;
var REL_WIDTH  = window.innerWidth;
var REL_HEIGHT = window.innerHeight;
var NUM_OF_HORIZONTAL_BLOCKS = Math.floor( window.innerWidth  / PIXELS_PER_BLOCK);
var NUM_OF_VERTICAL_BLOCKS   = Math.floor((window.innerHeight - INFOBAR_HEIGHT) / PIXELS_PER_BLOCK);
var CENTER_BLOCK_X           = Math.round(NUM_OF_HORIZONTAL_BLOCKS/2)*PIXELS_PER_BLOCK;
var CENTER_BLOCK_Y           = Math.round(NUM_OF_VERTICAL_BLOCKS  /2)*PIXELS_PER_BLOCK;
let ALL_KILLER_BLOCKS = new Set();

// classes 
function Block(x=0,y=0)
    {
        // summary
            // a generic block that can draw itself
        
        // x and y are the location data 
        this.x = x;
        this.y = y;
        
        // methods
        this.JumpTo = function (new_x, new_y) 
            {
                // summary:
                    // this is just a set-method for x and y 
                this.x = new_x;
                this.y = new_y;
            }
        this.Draw = function (color_=color(255),border_=color('#4CAF50')) 
            {
                // summary:
                    // this will draw the block on the canvas
                if (border_ == null)
                    {
                        border_ = color(255,0)
                    }
                fill(color_)
                stroke(border_)
                strokeWeight(2)
                rect(this.x, this.y, PIXELS_PER_BLOCK, PIXELS_PER_BLOCK);
            }

    }
function KillerBlock(x=0,y=0)
    {
        // summary:
            // this essentially inherits from Block
            // KillerBlocks add themselves to the
            // ALL_KILLER_BLOCKS set, which is then
            // used to check for collisions with the_snake
            // (and if collided with, they should kill the_snake)
        
        // add itself to the set
        ALL_KILLER_BLOCKS.add(this);
        // manage deletion from the ALL_KILLER_BLOCKS set 
        this.Delete = function () 
            {
                // summary:
                    // this should be called before trying to delete a KillerBlock
                    // this removes the block from the set before deleting it
                ALL_KILLER_BLOCKS.delete(this);
            }
        
        // this (below) is used to essentially inherit from the Block class
        this.block = new Block(x,y);
        this.x      = this.block.x;
        this.y      = this.block.y;
        this.JumpTo = this.block.JumpTo;
        this.Draw   = function(color_=color(255),border_=color(150))
            {
                this.block.Draw(color_,border_)
            }
        
    }
function TailBlock(x,y)
    {
        this.block = new KillerBlock(x,y)
        this.Draw = function()
            {
                this.block.Draw(220,255)
            }
        this.Delete = function()
            {
                this.block.Delete()
            }
    }





// global objects 
var BORDER    = {
        // summary:
            // the border is basically a set of KillerBlocks
            // if the_snake touches an KillerBlock, it dies
            
        blocks:new Set(), 
        // methods   
        Create: function()
            {
                // summary:
                    // this function should be run once to create the border objects
                    // the border will change shape according to the window size
                
                // if all of these following loops were not cut short 
                // (either not skipping the first loop or not skipping the last loop)
                // then the corners of the border would have 2 blocks in the same place
                
                // top row (doesn't do the last one)
                for(loop_number = 1; loop_number <= NUM_OF_HORIZONTAL_BLOCKS-1; loop_number++)
                    {
                        this.blocks.add(    new KillerBlock(  (loop_number-1)*PIXELS_PER_BLOCK,  0  )    );
                    }
                
                // bottom row (doesn't do the first one)
                for(loop_number = 2; loop_number <= NUM_OF_HORIZONTAL_BLOCKS; loop_number++)
                    {
                        this.blocks.add(     new KillerBlock(  (loop_number-1)*PIXELS_PER_BLOCK,  (NUM_OF_VERTICAL_BLOCKS-1)*PIXELS_PER_BLOCK  )    );
                    }
                
                // right column (doesn't do the last one)
                for(loop_number = 1; loop_number <= NUM_OF_VERTICAL_BLOCKS-1; loop_number++)
                    {
                        this.blocks.add(     new KillerBlock(  (NUM_OF_HORIZONTAL_BLOCKS-1) * PIXELS_PER_BLOCK, (loop_number-1)*PIXELS_PER_BLOCK  )    );
                    }
            
                // left column (doesn't do the first one)
                for(loop_number = 2; loop_number <= NUM_OF_VERTICAL_BLOCKS; loop_number++)
                    {
                        this.blocks.add(     new KillerBlock(  0,  (loop_number-1)*PIXELS_PER_BLOCK  )    );
                    }
            }, // end function
        Update: function()
            {
                // summary:
                    // this function makes sure that the border blocks are Drawn onto the screen
                // if performance is an issue then:
                    // rather then having the background update every frame
                    // use some p5.js tools to only update the non-border part of the screen
                    // and then this function will no long be necessary
                for (each of this.blocks) 
                    {
                        each.Draw();
                    }
            } // end function 
    } // end BORDER object 
var THE_FOOD  = {
        // summary:
            // this is the (by-default red) block that the snake will eat
            // the_snake object should use THE_FOOD.ChangeLocation() function every
            // time the_snake eats the food
        // potencial improvemnts:
            // currently the food can appear on the_snake's tail 
            // it might be good to change that behavior 
        
        // x and y location are randomly generated within the playing field 
        x : getRandomInt(1, NUM_OF_HORIZONTAL_BLOCKS-1) * PIXELS_PER_BLOCK,
        y : getRandomInt(1, NUM_OF_VERTICAL_BLOCKS  -1) * PIXELS_PER_BLOCK,
        
        // methods
        Update : function (input_={ border_:color(255,0,100), color_:color(255,0) }) 
            {
                // summary
                    // this will Draw the food block onto the screen
                stroke(input_.border_)
                fill(input_.color_)
                rect(this.x, this.y, PIXELS_PER_BLOCK, PIXELS_PER_BLOCK)
            },
        ChangeLocation : function () 
            {
                // x and y location are randomly generated within the playing field 
                this.x = getRandomInt(1, NUM_OF_HORIZONTAL_BLOCKS-1) * PIXELS_PER_BLOCK;
                this.y = getRandomInt(1, NUM_OF_VERTICAL_BLOCKS  -1) * PIXELS_PER_BLOCK;
            },

    } // end object 
var THE_SNAKE = {
        // summary:
            // this is the main object
            // it handles collision detection with other blocks
            // it calls THE_FOOD.ChangeLocation() 
            // GameOver resets the snake 
        

        // the head is just a regular block 
        head       : new Block( CENTER_BLOCK_X, CENTER_BLOCK_Y ),
        // the tail will contain KillerBlocks 
        tail       : [],
        // the direction will be 1 of 5 values, null, 'up' , 'down' , 'left' , 'right' 
        direction  : null,
        // when grow is >1, the tail will be extended by 1 block on the next update
        grow       : 0,
        // last time it ate a block
        last_eat : 1,
        // direction_buffer keeps track of the next few directions for THE_SNAKE, see ReceiveDirection
        direction_buffer: [],
        
        CollisionChecker: function ()
            {
                // summary:
                    // this checks to see if the THE_SNAKE 
                    // ran into a killer block or food 
                
                // check for collisions with KillerBlocks 
                for (each of ALL_KILLER_BLOCKS) 
                    {   
                        // if the block exists 
                        if (each != null)
                            {
                                // check the blocks x and y coodinates 
                                if (each.x == this.head.x && each.y == this.head.y)
                                    {
                                        // if they match, then GameOver 
                                        GameOver();
                                    }
                            }
                    }
                
                // check for food 
                if (this.head.x == THE_FOOD.x && this.head.y == THE_FOOD.y)
                    {
                        this.grow = true;
                        SCORE = SCORE + 1;
                        THE_FOOD.ChangeLocation();
                    }
            },
        Move: function () 
            {
                // summary:
                    // this moves the snake by 
                    // creating a new block where the head is
                    // moving the head block in the correct direction
                    // then deleting the last block in the tail
                    // if this.grow is true, the last block isn't deleted
                
                // create a new block at same x/y as the head
                this.tail.push(new TailBlock(this.head.x, this.head.y));
                
                // then move the head
                     if (this.direction == 'up') { this.head.y = this.head.y - PIXELS_PER_BLOCK; }
                else if (this.direction == 'down') { this.head.y = this.head.y + PIXELS_PER_BLOCK; }
                else if (this.direction == 'left') { this.head.x = this.head.x - PIXELS_PER_BLOCK; }
                else if (this.direction == 'right') { this.head.x = this.head.x + PIXELS_PER_BLOCK; }
                
                // delete old block if grow is < 1
                if (this.grow >= 1)             
                    { 
                        this.grow -= 1
                        this.last_eat = 1
                    }
                else if (this.tail.length != 0) 
                    { 
                        this.last_eat += 1
                        this.tail[0].Delete()
                        this.tail.splice(0,1)
                    }
            },
        Is__DirectionValidGiven__Direction : function(future_direction, past_direction)
            {
                // summary:
                    // this is a helper-function for THE_SNAKE 
                    // it returns true or false
                    // for example if THE_SNAKE is going up, 
                    // then up is an invalid new direction
                
                // if there is no tail
                // or if there is no direction
                // then every direction is allowed
                if (this.tail.length == 0 || past_direction == null)
                    {
                        return true;
                    }
                
                
                // if the past_direction is up or down, 
                // then the only valid directions are left and right 
                if (past_direction == 'up' || past_direction == 'down')
                    {
                        if (future_direction == 'left' || future_direction == 'right')
                            {
                                return true;
                            }
                        else 
                            {
                                return false;
                            }
                    }
                // if the past_direction is left or right, 
                // then the only valid directions are up and down 
                else 
                    {
                        if (future_direction == 'up' || future_direction == 'down')
                            {
                                return true;
                            }
                        else 
                            {
                                return false;
                            }
                    } // end if
            }, // end function
        ReceiveDirection : function (new_direction) 
            {
                // summary:
                    // this puts valid new directions into the direction_buffer
                    // the buffer allows the snake to process buttons that are
                    // pressed faster than the snake can update  
                    // for example: 
                        // if the snake is travling 'right' 
                        // pressing 'up'-'left' quickly should do a u-turn, but without
                        // this function/buffer, pressing 'up'-'left' quickly would
                        // result in THE_SNAKE.direction changing from 'up' to 'left'
                        // before the snake could even move a single block
                        // which effectively skips 'up' and would only move the snake 'left'
                        // which would then result in the snake running into its tail 
                        // which would be a game over.
                
                // if the buffer is empty
                // then compare new_direction and THE_SNAKE.direction
                // if new_direction is valid, then put it in the direction_buffer
                if (this.direction_buffer.length == 0)
                    {
                        if (this.Is__DirectionValidGiven__Direction(new_direction, this.direction))
                            {
                                this.direction_buffer.push(new_direction);
                            }
                    }
                // if buffer has 1 direction in it 
                // then compare new_direction and the direction in the buffer
                // if new_direction is valid, then put it in the direction_buffer
                else if (this.direction_buffer.length == 1)
                    {
                        if (this.Is__DirectionValidGiven__Direction(new_direction, this.direction_buffer[1]))
                            {
                                this.direction_buffer.push(new_direction);
                            }
                    }
                // if the buffer has more than 1 thing in it, then ignore the new direction
            },
        Update : function ()
            {
                // summary:
                    // this should be run every frame 
                    // Update, updates THE_SNAKE's direction, location, and draws it
                
                // update direction:
                    // if no new directions (direction_buffer empty) then do nothing
                    // else extract the first key press from the direction_buffer
                    if (this.direction_buffer.length > 0)
                        {
                            this.direction = this.direction_buffer[0];
                            this.direction_buffer.splice(0,1);
                        }
                
                // update location:
                    // if there is a direction, then move the snake in that direction
                    if (this.direction != null)
                        {
                            this.Move();
                        }
                // Draw the snake 
                    for (each of this.tail) 
                        {
                            each.Draw()
                        }
                    this.head.Draw();
                // check for collisions
                this.CollisionChecker();
            },
        Reset : function ()
            {
                // summary:
                    // this will clear/reset the snake and the things it owns 
                
                // delete each KillerBlock in the tail
                for (each of this.tail) 
                    {
                        each.Delete() 
                        delete each
                    }
                // reset the tail 
                this.tail = []
                // reset the location of the head
                delete this.head;
                this.head = new Block( CENTER_BLOCK_X, CENTER_BLOCK_Y );
                // reset the direction 
                this.direction = null
                // clear the direction_buffer
                this.direction_buffer = []
            }
    } // end THE_SNAKE 

// functions
function Align(way_to_align,html_element)
    {
             if (way_to_align == 'vertically'  )
                {
                    // create outer 
                    outer_Div = createDiv('')
                    outer_Div.addClass('outer_part_CenterVertically')
                    // create middle
                    middle_Div = createDiv('')
                    middle_Div.addClass('middle_part_CenterVertically')
                    outer_Div.child(middle_Div)
                    // make input the child
                    middle_Div.child(html_element)
                    // return outer encase it needs to be moved
                    output_Div = outer_Div
                }
        else if (way_to_align == 'horizontally')
            {
                // create a centeringDiv 
                centeringDiv = createDiv('')
                centeringDiv.addClass('outer_part_CenterHorizantally')
                centeringDiv.child(html_element)
                html_element.style('display','inline-block')
                output_Div = centeringDiv
            }
        else 
            {
                // create a centeringDiv 
                holdingDiv = createDiv('')
                holdingDiv.style('text-align', way_to_align)
                holdingDiv.child(html_element)
                html_element.style('display','inline-block')
                output_Div = holdingDiv
            }
        
        // inherit the html_element's height and width
        return output_Div
    }
function GameOver()
    {
        // summary:
            // this just shows the game over screen
            // it is responsible for reseting THE_SNAKE
        alert('Game Over');
        // reload THE_SNAKE
        THE_SNAKE.Reset();
        // reload the score 
        SCORE = 0;
        // reload the frameRate
        FRAMERATE = DEFAULT_FRAMERATE;
        frameRate(FRAMERATE);
    }
function Pause()
    {
        // summary
            // just pauses the screen
        alert('Paused');
    }
function DrawScore()
    {
        // summary
            // this just puts the score in the bottom left corner
            // this should be called every frame
        textSize(30)
        fill(255,0,100)
        stroke(0,0)
        text("Score: " +SCORE, 10, (NUM_OF_VERTICAL_BLOCKS * PIXELS_PER_BLOCK) + 35)
        
    }
function ShowIntro() 
    {
        // Create the intro screen
        intro_Div = createDiv('')
        intro_Div.style('width','100%')
        intro_Div.style('margin-bottom','20%')
        intro_page_Div = Align('horizontally',intro_Div)
        intro_page_Div.style('width','100%')
        
        // Title
        title_P = createP('Snake!')
        title_P.style('font-size','800%')
        title_P.style('font-family','Helvetica-Light')
        title_P_holder_Div = Align('horizontally',title_P)
        title_P_holder_Div.parent(intro_Div)
        

        
        // Create the start_Button button
        start_Button = createButton('Start')
        start_Button.addClass('introButton')
        start_Button.mousePressed(FromIntroToStartGame)
        start_Button.style('width',"28%")
        intro_Div.child(Align('horizontally',start_Button))
        function FromIntroToStartGame() { intro_page_Div.remove(); StartGame(); }
        
        // Create the controls button
        controls_Button = createButton('Controls')
        controls_Button.addClass('introButton')
        controls_Button.mousePressed(FromIntroToShowControls)
        controls_Button.style('width',"28%")
        intro_Div.child(Align('horizontally',controls_Button))
        function FromIntroToShowControls() { intro_page_Div.remove(); ShowControls(); }
        // Create the info button 
        info_Button = createButton('Info')
        info_Button.addClass('introButton')
        info_Button.mousePressed(FromIntroToShowInfo)
        info_Button.style('width',"28%")
        intro_Div.child(Align('horizontally',info_Button))
        function FromIntroToShowInfo() { intro_page_Div.remove(); ShowInfo(); }
    }
function StartGame() 
    {
        // set the frameRate
        frameRate(FRAMERATE)
        // show the canvas, 
        canvas.show()
        // Create the border 
        BORDER.Create()
    }
function ShowControls() 
    {
        // Create the controls container 
        controls_page_Div = createDiv('')
        controls_page_Div.style('margin-bottom','20%')
        controls_Div      = createDiv('')
        controls_Div.parent(controls_page_Div)
        controls_Div.addClass('grid')
        //CenterHorizantally(keys_Div).style('margin-top',REL_HEIGHT*0.25 +"px")
        function CreateKeyExplation(key_,explaination_) 
            {
                 
                key_Div = createDiv(key_)
                key_Div.addClass('key')
                controls_Div.child(Align('right',key_Div))
                
                explaination_Div = createDiv(explaination_)
                explaination_Div.addClass('key_explaination')
                controls_Div.child(Align('vertically',explaination_Div))
            }
        // Arrow keys 
        CreateKeyExplation('Arrow Keys','Change Direction')
        //controls_Div.child(createDiv('Arrow Keys'))
        //controls_Div.child(createDiv('blah blah blah'))
        // speed up
        CreateKeyExplation('W','Speeds Up!')
        //controls_Div.child(createDiv('W'))
        //controls_Div.child(createDiv('Speeds Up!'))
        // slow down
        CreateKeyExplation('Shift','S l o w s  D o w n')
        //controls_Div.child(createDiv())
        //controls_Div.child(createDiv())
        // Pause
        CreateKeyExplation('Esc or Spacebar','Pauses')
        //controls_Div.child(createDiv('Esc or Spacebar'))
        //controls_Div.child(createDiv('Pause'))

        back_Button = createButton('Back')
        back_Button.addClass('introButton')
        back_Button.mousePressed(GoToShowIntro)
        back_Button.style('width','28%')
        controls_page_Div.child(Align('horizontally',back_Button))
        
        
        function GoToShowIntro() 
            {
                controls_page_Div.remove()
                ShowIntro()
            }
            
        
    }
function ShowInfo() 
    {
        // create page div 
        info_page_Div = createDiv('')
        
        // create info text
        actual_info1_P = createP("Developed by Jeff Hykin<br>")
        info_page_Div.child(Align('horizontally',actual_info1_P))
        
        var a_string = (function () {/*
           This was programmed using p5.js, which I learned from Daniel Shiffman's tutorials on Youtube.
        */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
        actual_info2_P = createP(a_string)
        actual_info2_P.style('font-size','18px')
        actual_info2_P.style('margin-bottom','10%')
        info_page_Div.child(Align('horizontally',actual_info2_P))
        
        // create back button
        back_Button = createButton('Back')
        back_Button.addClass('introButton')
        back_Button.mousePressed(FromInfoToShowIntro)
        back_Button.style('width','28%')
        back_Button_holder_Div = Align('horizontally',back_Button)
        info_page_Div.child(back_Button_holder_Div)
        function FromInfoToShowIntro() 
            {
                info_page_Div.remove()
                ShowIntro()
            }
    }


// setup is a builtin with p5.js, 
// it is run once 
function setup() 
    {
        // Hide the canvas (otherwise a default one is created because of p5)
        canvas = createCanvas(window.innerWidth, window.innerHeight)
        canvas.hide()
        ShowIntro()
    }

// Draw is a builtin with p5.js, 
// it is an infinite loop
function draw() 
    {
        // draw the background
        background(255);

        // update the snake
        THE_SNAKE.Update();
        // draw the border
        BORDER.Update();
        // update the food
        THE_FOOD.Update();
        // show score 
        DrawScore();
    }

// keyPressed is a builtin with p5.js 
// it is run every time a key is pressed down
function keyPressed() 
    {   
        // keyCode, key, UP_ARROW, DOWN_ARROW, etc are builtin's with p5
             if (keyCode === UP_ARROW    ) { THE_SNAKE.ReceiveDirection('up'   ); } 
        else if (keyCode === DOWN_ARROW  ) { THE_SNAKE.ReceiveDirection('down' ); } 
        else if (keyCode === LEFT_ARROW  ) { THE_SNAKE.ReceiveDirection('left' ); } 
        else if (keyCode === RIGHT_ARROW ) { THE_SNAKE.ReceiveDirection('right'); } 
        // ESCAPE or spacebar will pause the game
        else if (keyCode === ESCAPE      ) { Pause(); }
        else if (key     === ' '   )       { Pause(); }
        // W speeds up
        // SHIFT slows down 
        else if (key     === 'W'   ) { FRAMERATE = FRAMERATE * 2; frameRate(FRAMERATE); }
        else if (keyCode === SHIFT ) { FRAMERATE = FRAMERATE / 2; frameRate(FRAMERATE); }
    }

// keyReleased is a builtin with p5.js 
// it is run every time a key is released
function keyReleased()
    {
        // W slows down on release
        // SHIFT speeds up on release
             if (key     === 'W'   ) { FRAMERATE = FRAMERATE / 2; frameRate(FRAMERATE); }
        else if (keyCode === SHIFT ) { FRAMERATE = FRAMERATE * 2; frameRate(FRAMERATE); }
    }
