//
// Animation Functions
//

// Handles displaying of canvas elements
function render() 
{
	// Check lines for crossings (and update their color accordingly)
	if (findCrossings() == 0 && moving == null) {
		// Game has been won
		endGame();
	}
	else {
		// Clear the canvas
		clearCanvas();

		// Draw the lines
		$.each(lines, function(index, value) {
			value.draw();
		});

		// Draw the nodes
		$.each(nodes, function(index, value) {
			value.draw();
		});

		// Set the clock
		setClock();

		// Repeat on the next animation frame
		requestAnimationFrame(render);
	}	
}

// Clears the canvas
function clearCanvas()
{
	// Clear the canvas...
	var canvas = document.getElementById("map");
	var context = canvas.getContext("2d");
	context.clearRect(0, 0, canvas.width, canvas.height);
}


//
// Event Handlers
//

// Mouse-down or touch-start events
function handler_down(evt) 
{
	if (paused != null) {return;} // Game is paused.
	evt.preventDefault();
	var x, y;
	if (evt.type == "touchstart") {
		x = evt.originalEvent.touches[0].pageX;
		y = evt.originalEvent.touches[0].pageY;
	}
	else {
		x = evt.pageX;
		y = evt.pageY;
	}

	for (var i = 0; i < nodes.length; i++)
	{
		dx = x - nodes[i].x;
		dy = y - nodes[i].y;
		// ...and check if clicking within node's radius:
		if (Math.sqrt((dx*dx)+(dy*dy)) < nodes[i].r) { // Pythagorean theorem - a^2 + b^2 = c^2
			// We have a node!
			moving = nodes[i];
			// TODO: Make this an array so we can drag multiple nodes with multitouch.
		}
	}
}

// Mouse-up or touch-end events
function handler_up(evt) 
{
	// Mouse button (or touch) was released, so if there was a node being dragged, let go of it.
	evt.preventDefault();
	if (moving != null)
	{
		moving = null;
	}
}

// Mouse-move or touch-move events
function handler_move(evt) 
{
	// Check if we're moving something; if so, update its position.
	evt.preventDefault();
	if (moving != null && paused == null) {
		if (evt.type == "touchmove" &&
			(evt.originalEvent.touches[0].pageX < window.innerWidth-150 ||
			evt.originalEvent.touches[0].pageY > 150)) {
			moving.x = evt.originalEvent.touches[0].pageX;
			moving.y = evt.originalEvent.touches[0].pageY;
		}
		else if (evt.pageX < window.innerWidth-150 ||
		         evt.pageY > 150){
			moving.x = evt.pageX;
			moving.y = evt.pageY;
		}
	}
}

// Window-resize or orientation-change events
function handler_rescale(evt)
{
	var canvas = document.getElementById("map");
	var context = canvas.getContext("2d");

	var old_max_x = context.canvas.width;
	var old_max_y = context.canvas.height;
	// Target bounding box:
	var d_max_x = window.innerWidth;
	var d_max_y = window.innerHeight;

	context.canvas.width  = d_max_x;
	context.canvas.height = d_max_y;

	for (var i = 0; i < nodes.length; i++)
	{
		// Calculate scale factor needed...
		nodes[i].x = (d_max_x) * (nodes[i].x/old_max_x);
		nodes[i].y = (d_max_y) * (nodes[i].y/old_max_y);
	}
}

//
// Special game functions
//

// Checks for crossed lines. Returns the number of crossings detected.
function findCrossings()
{
	// For each line, we'll check to see if it intersects with another line.
	// Since we only care if the line intersects with ANY line, we can knock out
	// two lines at once in some cases.

	var exclude = [];
	var crossed = 0;

	for (var i = 0; i < lines.length; i++)
	{
		if (exclude.indexOf(i) == -1) {  // This one has not intersected yet.
			lines[i].color = color_line; 
			lines[i].color_core = color_line_core; 
		}

		for (var j = i+1; j < lines.length; j++)
		{
			// Loop through all remaining lines and see if any intersect
			// Calculate cross products for the first line.
			// Details on the math: http://stackoverflow.com/questions/7069420/check-if-two-line-segments-are-colliding-only-check-if-they-are-intersecting-n
			xp1 = (lines[i].node1.x - lines[i].node2.x) * (lines[j].node1.y - lines[i].node1.y) - (lines[i].node1.y - lines[i].node2.y) * (lines[j].node1.x - lines[i].node1.x);
			xp2 = (lines[i].node1.x - lines[i].node2.x) * (lines[j].node2.y - lines[i].node1.y) - (lines[i].node1.y - lines[i].node2.y) * (lines[j].node2.x - lines[i].node1.x);

			// ...and the second line:
			xp3 = (lines[j].node1.x - lines[j].node2.x) * (lines[i].node1.y - lines[j].node1.y) - (lines[j].node1.y - lines[j].node2.y) * (lines[i].node1.x - lines[j].node1.x);
			xp4 = (lines[j].node1.x - lines[j].node2.x) * (lines[i].node2.y - lines[j].node1.y) - (lines[j].node1.y - lines[j].node2.y) * (lines[i].node2.x - lines[j].node1.x);

			if (xp1 * xp2 < 0 && xp3 * xp4 < 0) {
				// The lines intersect.
				lines[i].color = color_line_crossed;
				lines[i].color_core = color_line_crossed_core;
				lines[j].color = color_line_crossed;
				lines[j].color_core = color_line_crossed_core;
				exclude.push(j);
				crossed++;
			}
		}
	}
	return crossed;
}

// Generates a new random network of nodes and lines.
function generateNodes()
{

	nodes = [];
	lines = [];
	min_connections = 2;
	max_connections = 5;
	n = Math.floor(Math.sqrt(max_nodes));

	for (var i = 0; i < max_nodes; i++)
	{
		// Generate array of nodes
		nodes.push(new Node(0,0));
	}

	$.each(nodes, function(index, value) {
		var connections = 1;
		if ((index+1) % n > 0 && index+1 < max_nodes) {
			lines.push(new Line(value, nodes[index+1])); // Horizontal connection
		}
		do {
			if (index % 2 != 0 && Math.random() > 0.3 && connections < max_connections) {
				// Every other node is eligible to make a diagonal connection.
				connections++;
				target = index + n + (Math.random > 0.5 ? 1 : -1);
				if (target < max_nodes) {
					lines.push(new Line(value, nodes[target]));
				}
			}
			if (Math.random() > 0.3 && connections < max_connections) {
				connections++;
				target = index + n;
				if (target < max_nodes) {
					lines.push(new Line(value, nodes[target]));
				}
			}
		}
		while (connections <= min_connections)
	});

	var newLines = [];
	$.each(lines, function(index1, value1) {
		var duplicate = false;
		$.each(newLines, function(index2, value2) {
			if (value2.equals(value1)) {
				duplicate=true;
			}
		});
		if (!duplicate) {
			newLines.push(value1);
		}
	});
	lines = newLines;
}

// Randomly arranges the nodes on the canvas.
function shuffleNodes()
{
	var margin = Math.min(100, Math.min(window.innerHeight*.1, window.innerWidth*.1));
	var d_min_x = margin;
	var d_min_y = margin;
	var d_max_x = window.innerWidth-margin;
	var d_max_y = window.innerHeight-margin;
	console.log(d_min_x+", "+d_max_x+", "+d_min_y+", "+d_max_y);

	for (var i = 0; i < nodes.length; i++) {
		do {
			nodes[i].x = Math.floor(Math.random()*(d_max_x-d_min_x+1)+d_min_x);
			nodes[i].y = Math.floor(Math.random()*(d_max_y-d_min_y+1)+d_min_y);
		}
		while (nodes[i].x > window.innerWidth-150 && nodes[i].y < 150)
	}
}

function pauseGame() 
{
	// Capture the pause time
	paused = new Date();
}

function resumeGame() 
{
	timer = new Date() - (paused - timer); // Reset the timer
	paused = null; // No longer paused
	render(); // Begin rendering again.
}

function restartGame() 
{
	generateNodes();
	while (findCrossings() == 0) {
		shuffleNodes();
	}
	timer = new Date();
	if (paused != null) {
		paused = timer;
	}
	render();
}

function setDifficulty(evt, ui) 
{
	if (max_nodes != difficulties[ui.value]) { // If difficulty is the same, do nothing. Otherwise start a new game.
		max_nodes = difficulties[ui.value].value;
		restartGame();
	}
}

// Sets the clock
function setClock()
{
	var elapsed = new Date() - timer;
	if (paused != null) { elapsed = paused - timer; } // Timer doesn't go up when paused
	var milliseconds = Math.floor(elapsed/10) % 100;
	var seconds = Math.floor(elapsed/1000) % 60;
	var minutes = Math.floor(elapsed/60000) % 100;

	var text = (minutes < 10 ? "0" : "") + minutes + ":";
	text += (seconds < 10 ? "0" : "") + seconds;

	$("#timer").text(text);
}


//
// Classes
//

// A basic node, with x and y coordinates.
// Node.draw() - Draws the node on the canvas.
function Node(x, y)
{
	this.x = x;
	this.y = y;
	this.r = 22;

	var that = this;
	this.draw = function() {
		var canvas = document.getElementById("map");
		var context = canvas.getContext("2d");
		grd = context.createRadialGradient(that.x, that.y, 0.000, that.x, that.y, that.r);
		      
	    // Add colors
	    grd.addColorStop(0.175, 'rgba(255, 255, 255, 1.000)');
	    grd.addColorStop(0.571, 'rgba(0, 255, 255, 1.000)');
	    grd.addColorStop(0.994, 'rgba(0, 255, 255, 0.000)');

		// Circle Code
		var startPoint = (Math.PI/180)*0;
		var endPoint = (Math.PI/180)*360;
		context.beginPath();
		context.arc(that.x, that.y, that.r, startPoint, endPoint, true);

		// Fill with gradient
	    context.fillStyle = grd;
		context.fill();
		context.closePath();
	};
}

// A line, from one node to another.
// Line.draw() - Draws the line on the canvas.
function Line(node1, node2)
{
	this.node1 = node1;
	this.node2 = node2;
	this.color = color_line;
	this.color_core = color_line_core;
	var that = this;

	this.draw = function() {
		var x1 = that.node1.x;
		var y1 = that.node1.y;
		var x2 = that.node2.x;
		var y2 = that.node2.y;

		var canvas = document.getElementById("map");
		var context = canvas.getContext("2d");
		context.globalCompositeOperation = "lighter";
		
		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		context.strokeStyle = that.color;
		context.lineWidth = 7;
		context.stroke();

		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		context.strokeStyle = that.color_core;
		context.lineWidth = 3;
		context.stroke();
		
		context.globalCompositeOperation = "source-over";
	};
	this.equals = function(line) {
		return ((line.node1 == this.node1 && line.node2 == this.node2) ||
			    (line.node1 == this.node2 && line.node2 == this.node1));
	};
}