//scoreboard setup
var scoreBoard = document.getElementById('scoreBoard');
var infoSpans = scoreBoard.children;

for(var i = 0; i < infoSpans.length; i++){
	infoSpans[i].style.width = Math.floor(100 / infoSpans.length) - 1 + '%';
};

//load audio
var backgroundLoop = new Audio('sounds/backgroundLoop.wav');
backgroundLoop.loop = true;
backgroundLoop.volume = 0.3;
var haloLoop = new Audio('sounds/halo.wav');
haloLoop.volume = 0.2;
var commonBounce = new Audio('sounds/commonBounce.wav');
var gameEnd = new Audio('sounds/gameEnd.wav');
var gameWin = new Audio('sounds/gameWin.wav');

//ready canvas
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');

//game variables
var pause = true;
var hit = false;
var difficulty = 10;

//ball variables
var x = canvas.width/2;
var y = canvas.height - 40;
var ballColor = randRGBA(1);
var radius = 10;
//ballmovement
var dx; //pos >> right
var dy = -2; //pos >> down
var swing = 0;

var ballOne = new Ball(canvas.width / 2,      //x
			           canvas.height - 40, 	  //y
					   10, 					  //radius
					   0, 					  //swing
					   1					  //status
					   );
var ballArr = [ballOne];

function Ball(x, y, radius, swing, status){
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.color = setBallInitColor(status);
	this.dx = setBallInitDirection();
	this.dy = -2;
	this.swing = swing;
	this.status = status;
}

function setBallInitDirection(){
	var dx;
	if(Math.floor(Math.random() * 2))
		dx = 2; //right
	else 
		dx = -2; //left
	return dx;
}

function setBallInitColor(status){
	if(status > 0)
		return randRGBA(1);
	else 
		return 'white';
}

var haloColor = randRGBA(0.5);

//paddle variables
var paddleHeight = 10;
var paddleWidth = 75;
var paddleX = (canvas.width - paddleWidth)/2;
var paddleY = canvas.height - paddleHeight - 10;
var paddleTopMax = 100;
var paddleColor = randRGBA(1);
//paddlemovement speed
var pxs = 5;
var pys = 2;

//lazer variables
var llen = 150;
var rightUp = false; var rUx; var rUy;
var leftUp = false; var lUx; var lUy;
var rightDown = false; var rDx; var rDy;
var leftDown = false; var lDx; var lDy;
var lx;
var ly;
var lspeed = 10;
var lazerRightUpArr = [];
var lazerLeftUpArr = [];
var lazerRightDownArr = [];
var lazerLeftDownArr = [];

//brick variables
var brickWidth = 75;
var brickHeight = 20;
var brickPadding = 11;
var brickOffsetTop = 30;
var brickOffsetLeft = 30;

var brickRowCount = 4;
var brickColumnCount = 11;

var bricks;
function setBricks(){
	bricks = [];
	for(c=0; c<brickColumnCount; c++) {
		bricks[c] = [];
		for(r=0; r<brickRowCount; r++) {
			bricks[c][r] = { x: 0, y: 0, status: 1, hardness: 0};
		}
	}
	//increase hardness of one brick
	for(var i = 0; i < difficulty; i++){
		bricks[Math.floor(Math.random() * bricks.length)][Math.floor(Math.random()* bricks[0].length)].hardness++;
	}
}
setBricks();

//control variables
var rightPressed = false;
var leftPressed = false;
var upPressed = false;
var downPressed = false;
var haloOn = false;
var spacePressed = false;
var aPressed = false;
var sPressed = false;
var dPressed = false;
var fPressed = false;

//score variables
var score = 0;
var totalScore = 0;
var wins = 0;
var startTime;
var frameRate = 60;


var loopHandle;
function draw(timestamp)
{
	if(!startTime)
		startTime = timestamp;
	else if(!isNaN(Math.floor((timestamp - startTime) / 100)))
		document.getElementById('time').innerHTML = 'Time: ' + (Math.floor((timestamp - startTime) / 100)) / 10;

	setTimeout(function(){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawBox();
		
		//draw elements
		drawBricks();
		ballArr.forEach(function(ball){drawBall(ball)});
		drawPaddle();
		ballArr.forEach(function(ball){collisionDetection(ball)});
		
		
		function handleBallMovement(ball){
			//Ball Movement
			if(ball.x< ball.radius  && ball.dx < 0)//hits left wall
			{
				if(dPressed && ball.status > 0)
				{
					ball.x = canvas.width + ball.radius 
				}
				else
					ball.dx = -ball.dx;
				
				//glitch protection
				ball.x += ball.dx;
				ball.y += ball.dy;
				
				setBallColor(ball);
				commonBounce.play();	
			}
			if(ball.x> canvas.width - ball.radius  && ball.dx > 0)//hits right wall
			{
				if(dPressed)
				{
					ball.x= 0 - ball.radius ;
				}
				else
					ball.dx = -ball.dx;
				
				//glitch protection
				ball.x+= ball.dx;
				ball.y += ball.dy;
				
				setBallColor(ball);
				commonBounce.play();
			}
			if(ball.y < ball.radius ) //hits cieling
			{
				ball.dy = 2;
				if(hit && ball.dx > 0)
				{
					ball.dx = 2;
					hit = false;
					ball.swing = 0;
				}
				else if(hit && ball.dx < 0){
					ball.dx = -2;
					hit = false;
					ball.swing = 0;
				}
				if(ball.status > 0)
					dPressed = false;
				setBallColor(ball);
				commonBounce.play();
			}
			if(ball.x > paddleX - ball.radius  && ball.x - ball.radius < paddleX + paddleWidth) //is within borders of paddle
			{
				if(ball.y >= paddleY - ball.radius ) //is below or at top of paddle 
				{
					if(ball.y >= paddleY + ball.radius ) //is below or at bottom of paddle 
					{
						if(spacePressed && ball.y > canvas.height - ball.radius ) //hits floor with spacebar pressed in between paddle edges
						{
							var gameWin = new Audio('sounds/gameWin.wav');
							gameWin.play();
							ball.y = 0;
						}
						else if(!spacePressed && ball.y > canvas.height - ball.radius)  //space bar not pressed
						{
							if(ball.status < 1)
							{
								var thisInd = ballArr.indexOf(ball);
								ballArr.splice(thisInd, 1);
								totalScore -= 1;
								document.getElementById('score').style.color = "#770000";
							}
							else
							{
								backgroundLoop.pause();
								haloLoop.pause();
								gameEnd.play();
								document.getElementById('score').style.color = "white";
								startTime = null;
								window.cancelAnimationFrame(loopHandle);
								pause = true;
								ball.x= canvas.width/2;
								ball.y = canvas.height-30;
								if(Math.floor(Math.random() * 2)) //flip coin to see if ball starts out left or right
									ball.dx = 2; //right
								else 
									ball.dx = -2; //left
								ball.dy = -2;
								paddleX = (canvas.width-paddleWidth)/2;
								paddleY = canvas.height - paddleHeight;
								setBricks();
								document.getElementById('msg').innerHTML = "Game Over <br /> Press space to restart";
								score = 0;
								totalScore = 0;
							}
						}
						else
						{
							setBallColor(ball);
							commonBounce.play();
						}
					}
					else
					{
						ball.dy = -(Math.abs(-ball.dy));
						if(upPressed)
							ball.dy = -(Math.abs(-ball.dy) + 1);
						if(downPressed)
							ball.dy = -(Math.abs(-ball.dy - 1));
						if((leftPressed || rightPressed) && ball.swing < 2)
						{
							hit = true;
							ball.swing++;
							ball.dx = ball.dx * 2;
							if(leftPressed)
								ball.dx = -(Math.abs(ball.dx));
							if(rightPressed)
								ball.dx = Math.abs(ball.dx);
						}
						setBallColor(ball);
						commonBounce.play();
					}
				}
				
			}
			else if(ball.x<= paddleX || ball.x>= paddleX + paddleWidth) //not within borders of paddle
			{
				if(ball.y > canvas.height - ball.radius )// hits floor
				{
					if(ball.status < 1)
					{
						var thisInd = ballArr.indexOf(ball);
						ballArr.splice(thisInd, 1);
						totalScore -= 2;
						document.getElementById('score').innerHTML = "Score: " + totalScore;
						document.getElementById('score').style.color = "#440000";
					}
					else
					{
						backgroundLoop.pause();
						haloLoop.pause();
						gameEnd.play();
						document.getElementById('score').style.color = "white";
						startTime = null;
						window.cancelAnimationFrame(loopHandle);
						pause = true;
						ball.x= canvas.width/2;
						ball.y = canvas.height-30;
						if(Math.floor(Math.random() * 2)) //flip coin to see if ball starts out left or right
							ball.dx = 2; //right
						else 
							ball.dx = -2; //left
						ball.dy = -2;
						paddleX = (canvas.width-paddleWidth)/2;
						paddleY = canvas.height - paddleHeight;
						setBricks();
						document.getElementById('msg').innerHTML = "Game Over <br /> Press space to restart";
						score = 0;
						totalScore = 0;
					}
				}
			}
			
			ball.x+= ball.dx;
			ball.y += ball.dy;
		}
		ballArr.forEach(function(ball){
			handleBallMovement(ball);
		});
		
		//Paddle Movement
		if(leftPressed && paddleX > 0)
		{
			paddleX += -pxs;
		}
		if(rightPressed && paddleX < canvas.width - paddleWidth)
		{
			paddleX += pxs;
		}
		if(upPressed && paddleY > canvas.height - paddleHeight - paddleTopMax)
		{
			paddleY -= pys;
		}
		if(downPressed && paddleY < canvas.height - paddleHeight)
		{
			paddleY += pys;
		}
		
		//halo
		if(haloOn)
			drawHalo(ballArr[0].x, ballArr[0].y);
			
		//Lazer Conditionals
		lazerRightUpArr.forEach(function(curArr){
			drawRightUp(curArr);
		});
		lazerLeftUpArr.forEach(function(curArr){
			drawLeftUp(curArr);
		});
		lazerRightDownArr.forEach(function(curArr){
			drawRightDown(curArr);
		});
		lazerLeftDownArr.forEach(function(curArr){
			drawLeftDown(curArr);
		});
		
		if(aPressed)
			ballOne.radius  += 0.02;
		if(sPressed)
			ballOne.radius  -= 0.02;
		
		if(!pause)
		   loopHandle = window.requestAnimationFrame(draw);
	}, 1000 / frameRate);
}
//quick draw just to get picture up, without repeat and looping
draw();


function drawBall(ball)
{
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
	ctx.fillStyle = ball.color;
	ctx.fill();
	ctx.closePath();
}

function drawPaddle()
{
	ctx.beginPath();
	ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight);
	ctx.fillStyle = paddleColor;
	ctx.fill();
	ctx.closePath();
}



function drawBricks() {
    for(c=0; c<brickColumnCount; c++) {
        for(r=0; r<brickRowCount; r++) {
			if(bricks[c][r].status == 1)
			{
				var brickX = (c*(brickWidth+brickPadding))+brickOffsetLeft;
				var brickY = (r*(brickHeight+brickPadding))+brickOffsetTop;
				bricks[c][r].x = brickX;
				bricks[c][r].y = brickY;
				ctx.beginPath();
				ctx.rect(brickX, brickY, brickWidth, brickHeight);
				if(bricks[c][r].hardness > 0)
				{
					ctx.fillStyle = "red";
					if(bricks[c][r].hardness > 1)
					{
						ctx.fillStyle = "#770000";
					}
					else if(bricks[c][r].hardness > 2)
					{
						ctx.fillStyle = "#440000";
					}
				}
				else
				{
					ctx.fillStyle = "#0095DD";
				}
				ctx.fill();
				ctx.closePath();
			}
        }
    }
}

function drawHalo(x, y) {
	var ex = x;
	var ey = y;
	if(ballOne.dy > 0){ //ball going down
		while(ey < canvas.height)
		{
			ex += ballOne.dx;
			ey += Math.abs(ballOne.dy);
		}
	}
	else{
		while(ey > 0)
		{
			ex += ballOne.dx;
			ey += -(Math.abs(ballOne.dy));
		}
	}
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(ex + (paddleWidth / 2), ey);
	ctx.lineTo(ex - (paddleWidth / 2), ey);
	ctx.fillStyle = haloColor;
	ctx.fill();
}

function drawBox()
{
	var gr = ctx.createLinearGradient(0, 0, 0, canvas.height);

	// Add the color stops.
	gr.addColorStop(0,'#FFFFFF');
	gr.addColorStop(1,'#000000');

	ctx.beginPath();
	ctx.rect(0, canvas.height - 100 - paddleHeight - 1, canvas.width, canvas.height - 100);
	ctx.fillStyle = '#111111';
	ctx.fill();
	ctx.closePath();
}

function randInt(range){
	return Math.floor(Math.random() * range + 55);
}

function randRGBA(a){
	return "rgba("+randInt(200)+','+randInt(200)+','+randInt(200)+','+a+')';
}

function setBallColor(ball){
	if(dPressed && ball.status > 0)
		ball.color = randRGBA(0.05);
	else if(ball.status > 0)
		ball.color = randRGBA(1);
}


/*
	EVENT HANDLERS
*/
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("keypress", keyPressHandler, false);
function mouseMoveHandler(e) {
    var relativeX = e.clientX - canvas.offsetLeft;
    if(relativeX > 0 && relativeX < canvas.width) 
	{
        paddleX = relativeX - paddleWidth/2;
    }
	
	var relativeY = e.clientY - canvas.offsetTop;
	if(relativeY > (canvas.height - paddleTopMax) && relativeY < canvas.height)
	{
		paddleY = relativeY - paddleHeight/2;
	}
}

function keyDownHandler(e){
	if(e.key == "ArrowLeft")
		leftPressed = true;
	if(e.key == "ArrowRight")
		rightPressed = true;
	if(e.key == "ArrowDown")
		downPressed = true;
	if(e.key == "ArrowUp")
		upPressed = true;
	if(e.code == "Space")
		spacePressed = true;
	if(e.code == "KeyA")
		aPressed = true;
	if(e.code == "KeyS")
		sPressed = true;
	if(e.code == "KeyD")
	{
		if(!dPressed)
		{	
			dPressed = true;
			setBallColor(ballArr[0]);
		}
	}
	if(e.code == "KeyF")
	{
		fPressed = true;
		pxs = 15;
	}
	if(e.code == "KeyW")
	{
		var paddleCenterX = paddleX + (paddleWidth / 2);
		var paddleCenterY = paddleY + (paddleHeight / 2);
		var ballNext = new Ball(paddleCenterX, paddleCenterY - (paddleHeight * 2), ballArr[0].radius / 2, 0, 0);
		ballArr.push(ballNext);
	}
}

function keyUpHandler(e){
	if(e.key == "ArrowLeft")
		leftPressed = false;
	if(e.key == "ArrowRight")
		rightPressed = false;
	if(e.key == "ArrowDown")
		downPressed = false;
	if(e.key == "ArrowUp")
		upPressed = false;
	if(e.code == "Space");
		spacePressed = false;
	if(e.code == "KeyA")
		aPressed = false;
	if(e.code == "KeyS")
		sPressed = false;
	if(e.code == "KeyF")
	{
		fPressed = false;
		pxs = 5;
	}
}

function keyPressHandler(e){
	if(e.code == "KeyQ")
		lazerShow();
}

function collisionDetection(ball) {
    for(c=0; c<brickColumnCount; c++) {
        for(r=0; r<brickRowCount; r++) {
            var b = bricks[c][r];
			if(b.status == 1)
			{
				//collision happens
				if(
				   ball.x>= b.x - ball.radius                  //ball edge is further right than left side of brick
				&& ball.x<= b.x + brickWidth + ball.radius     //ball edge is further left than right side of brick
				&& ball.y >= b.y - ball.radius   				 //ball edge is further down than top of brick
				&& ball.y < b.y + brickHeight + ball.radius     //ball is further up than bottom of brick
				) {
					
					
					var collisionType = null; 
					/*
						0 = top or bottom
						1 = side
						2 = corner
					*/
					
					if(!dPressed){
						//first find out which quandrant ball center (x) is in
						//by finding if its above/below to the left/right of block center
						var blockCenter = [b.x + (brickWidth / 2), b.y + (brickHeight / 2)];
						if(ball.y < blockCenter[1]){
							//ball is in quadrant 1 or 2
							if(ball.x< blockCenter[0])
							{
								//quadrant 1
								var cornerPoint = [b.x, b.y];
								if(ball.x< cornerPoint[0])
								{
									if(ball.y < cornerPoint[1])
									{
										//hit top left corner
										console.log('hit top left corner');
										if(ball.dx > 0 && ball.dy > 0)
											collisionType = 2;
										else	
											collisionType = 3;
									}
									else
									{
										//hit left side
										console.log('hit left side');
										collisionType = 1;
									}
								}
								else
								{
									//hit top
									console.log('hit top');
									collisionType = 0;
								}
							}
							else{
								//quadrant 2
								var cornerPoint = [b.x + brickWidth, b.y];
								if(ball.x< cornerPoint[0])
								{
									//hit top
									console.log('hit top');
									collisionType = 0;
								}
								else
								{
									if(ball.y < cornerPoint[1])
									{
										//hit top right corner
										console.log('hit top right corner');
										if(ball.dx < 0 && ball.dy > 0)
											collisionType = 2;
										else	
											collisionType = 3;
									}
									else
									{
										//hit right side
										console.log('hit right side');
										collisionType = 1;
									}
								}
							}
							
						}
						else{
							//ball is in quadrant 3 or 4
							if(ball.x< blockCenter[0])
							{
								//quadrant 3
								var cornerPoint = [b.x, b.y + brickHeight];
								if(ball.x> cornerPoint[0])
								{
									//hit bottom
									console.log('hit bottom');
									collisionType = 0;
								}
								else
								{
									if(ball.y > cornerPoint[1])
									{
										//hit bottom left corner
										console.log('hit bottom left corner');
										if(ball.dx > 0 && ball.dy < 0)
											collisionType = 2;
										else	
											collisionType = 3;
									}
									else
									{
										//hit left side
										console.log('hit left side');
										collisionType = 1;
									}
								}
							}
							else{
								//quadrant 4
								var cornerPoint = [b.x + brickWidth, b.y + brickHeight];
								if(ball.x< cornerPoint[0])
								{
									//hit bottom
									console.log('hit bottom');
									collisionType = 0;
								}
								else
								{
									if(ball.y > cornerPoint[1])
									{
										//hit bottom right corner
										console.log('hit bottom right corner');
										if(ball.dx < 0 && ball.dy < 0)
											collisionType = 2;
										else	
											collisionType = 3;
									}
									else
									{
										//hit right side
										console.log('hit right side');
										collisionType = 1;
									}
								}
							}
						}
						
						switch(collisionType)
						{
							case 0:         //hit top or bottom
								ball.dy = -ball.dy;   //change vertical direction
								break;
							case 1:			//hit side
								ball.dx = -ball.dx;   //change horizontal direction 
								break;
							case 2:			//hit corder
								ball.dy = -ball.dy;	//change vertical direction
								ball.dx = -ball.dx;	//change horizontal direction
								break;
							default:
								ball.dx = ball.dx;
								ball.dy = ball.dy;
						}
						
						//if ball is going fast sideways, slow it back down
						if(hit && ball.dx > 0)
						{
							ball.dx = 2;
							hit = false;
							ball.swing = 0;
						}
						else if(hit && ball.dx < 0){
							ball.dx = -2;
							hit = false;
							ball.swing = 0;
						}
					}
					
					if(b.hardness > 0)
					{
						
						if(Math.abs(ball.dy) > 2){
							b.hardness -= 2;
							if(b.hardness < 0)
								b.status = 0;
							totalScore += 5;
							document.getElementById('score').innerHTML = "Score: " + totalScore;
							document.getElementById('score').style.color = "lightgreen";
						}
						if(Math.abs(ball.dy) > 4){
							b.hardness -= 3;
							if(b.hardness < 0)
								b.status = 0;
							totalScore += 10;
							document.getElementById('score').innerHTML = "Score: " + totalScore;
							document.getElementById('score').style.color = "darkgreen";
						}
						
						b.hardness--;
						totalScore++;
						document.getElementById('score').innerHTML = "Score: " + totalScore;
						document.getElementById('score').style.color = "white";
						var thickBrick = new Audio('sounds/thickBrick.wav');
						thickBrick.play();
					}
					else
					{
						b.status = 0;
						totalScore++;
						document.getElementById('score').innerHTML = "Score: " + totalScore;
						document.getElementById('score').style.color = "white";
						var commonLazer = new Audio('sounds/commonLazer.wav');
						commonLazer.play();
					}
					var lx = b.x + (brickWidth / 2);
					var ly = b.y + (brickHeight / 2);
					var curLen = Math.floor(Math.random() * 150) + 20;
					lazerRightUpArr.push([lx, ly, lx, ly, true, curLen]);
					lazerLeftUpArr.push([lx, ly, lx, ly, true, curLen]);
					lazerRightDownArr.push([lx, ly, lx, ly, true, curLen]);
					lazerLeftDownArr.push([lx, ly, lx, ly, true, curLen]);
				
					score++;
					checkForWin();
					document.getElementById('score').innerHTML = 'Score: ' + totalScore;
				}
			}
        }
    }
}

function lazerShow() {
    for(c=0; c<brickColumnCount; c++) {
		var offset = 0;
        for(r=0; r<brickRowCount; r++) {
            var b = bricks[c][r];
			if(b.status == 1)
			{

				var lx = b.x + (brickWidth / 2);
				var ly = b.y + (brickHeight / 2);
				var curLen = Math.floor(Math.random() * 150) + 20;
				lazerRightUpArr.push([lx, ly, lx, ly, true, curLen]);
				lazerLeftUpArr.push([lx, ly, lx, ly, true, curLen]);
				lazerRightDownArr.push([lx, ly, lx, ly, true, curLen]);
				lazerLeftDownArr.push([lx, ly, lx, ly, true, curLen]);
				setTimeout(function(){
					var gameWin = new Audio('sounds/gameWin.wav');
					gameWin.play();
				}, offset);
				offset += 100;
			}
        }
    }
}

function checkForWin(){
	var allZero = true;
	for(c=0; c<brickColumnCount; c++) {
		for(r=0; r<brickRowCount; r++) {
			var b = bricks[c][r];
			if(b.status == 1)
			{
				allZero = false;
			}
		}
	}
	if(allZero)
	{
		score += 50;
		wins++;
		document.getElementById('wins').innerHTML = 'Wins: ' + wins;
		difficulty++;
		gameWin.play();
		setBricks();
		drawBricks();
	}
}

document.addEventListener('keyup', function(e){
	if(e.code == "Space" && pause == true)
	{
		loopHandle = window.requestAnimationFrame(draw);
		document.getElementById('score').innerHTML = 'Score: ' + totalScore;
		document.getElementById('msg').innerHTML = '';
		if(haloLoop.paused)
			backgroundLoop.play();
		pause = false;
	}
	else if(e.code == "Space" && pause == false)
	{
		//paddle prediction triangle code
		console.log('%c Show me the money','color:green;font-size:3em;');
	}
	if(e.code == "KeyP")
	{
		if(pause == true)
		{
			loopHandle = window.requestAnimationFrame(draw);
			pause = false;
			backgroundLoop.play();
		}
		else
		{
			pause = true;
			backgroundLoop.pause();
			document.getElementById('msg').innerHTML = 'Press space to continue';
		}
	}

	if(e.code == "KeyL")
	{
		haloOn = !haloOn;
		haloColor = randRGBA(0.5);
		if(backgroundLoop.paused)
		{
			backgroundLoop.play();
			haloLoop.pause();
		}
		else
		{
			backgroundLoop.pause();
			haloLoop.play();
			haloLoop.addEventListener('ended',function(){
				haloLoop.currentTime = 0;
				haloOn = false;
				backgroundLoop.play();
			});
		}
	}
});

function turnOnLazers(blocx, blocy)
{
	lx = blocx;
	ly = blocy;

	rightUp = true;
	leftUp = true;
	rightDown = true;
	leftDown = true;
	
	rUx = lx; 
	rUy = ly;
}

function drawOneLazer(x0, y0, x1, y1)
{
	ctx.beginPath();
	ctx.moveTo(x0, y0);
	ctx.lineTo(x1, y1);
	ctx.lineWidth = 3;
	ctx.strokeStyle = randRGBA(1);
	ctx.stroke();	
}

function drawRightUp(origin)
{	
	//use xlen as line len
	var linelen = origin[2] - origin[0];
	var llen = origin[5];
	
	//not reached growth
	if(linelen <= llen)
	{
		//change 1 points to grow up and to the right
		origin[2] += lspeed;
		origin[3] -= lspeed;
	}
	//reached growth
	else
	{	
		//not reached past edge of screen
		if(origin[0] < canvas.width + 5 && origin[1] > -5)
		{
			//call lazers with correct params to move lines to edge of screen
			origin[0] += lspeed; 
			origin[1] -= lspeed;
		}
		//reached past edge of screen
		else
		{
			origin[4] = false;
		}	
	}
	drawOneLazer(origin[0], origin[1], origin[2], origin[3]);
}

function drawLeftUp(origin)
{
	//use xlen as line len
	var linelen = origin[0] - origin[2];
	var llen = origin[5];
	
	//not reached growth
	if(linelen <= llen)
	{
		//change points to grow up and to the left
		origin[2] -= lspeed;
		origin[3] -= lspeed;
	}
	//reached growth
	else
	{	
		
		//not reached past edge of screen
		if(origin[0] > -5 && origin[1] > -5)
		{
			//call lazers with correct params to move lines to edge of screen
			origin[0] -= lspeed; 
			origin[1] -= lspeed;
		}
		//reached past edge of screen
		else
		{
			origin[4] = false;
		}	
	}
	drawOneLazer(origin[0], origin[1], origin[2], origin[3]);
}

function drawRightDown(origin)
{	
	//use xlen as line len
	var linelen = origin[2] - origin[0];
	var llen = origin[5];
	
	//not reached growth
	if(linelen <= llen)
	{
		//change 1 points to grow up and to the right
		origin[2] += lspeed;
		origin[3] += lspeed;
	}
	//reached growth
	else
	{	
		//not reached past edge of screen
		if(origin[0] < canvas.width + 5 && origin[1] < canvas.height + 5)
		{
			//call lazers with correct params to move lines to edge of screen
			origin[0] += lspeed; 
			origin[1] += lspeed;
		}
		//reached past edge of screen
		else
		{
			origin[4] = false;
		}	
	}
	drawOneLazer(origin[0], origin[1], origin[2], origin[3]);
}

function drawLeftDown(origin)
{	
	//use xlen as line len
	var linelen = origin[0] - origin[2];
	var llen = origin[5];
	
	//not reached growth
	if(linelen <= llen)
	{
		//change 1 points to grow up and to the right
		origin[2] -= lspeed;
		origin[3] += lspeed;
	}
	//reached growth
	else
	{	
		//not reached past edge of screen
		if(origin[0] > -5 && origin[1] < canvas.height + 5)
		{
			//call lazers with correct params to move lines to edge of screen
			origin[0] -= lspeed; 
			origin[1] += lspeed;
		}
		//reached past edge of screen
		else
		{
			origin[4] = false;
		}	
	}
	drawOneLazer(origin[0], origin[1], origin[2], origin[3]);
}