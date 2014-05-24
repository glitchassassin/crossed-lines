// Requires JQuery be included first

function GameBoard(canvas, exclude) 
{
	// Public Properties
	this.nodes = null;
	this.lines = null;
	this.canvas = canvas;
	this.difficulties = [	{value: 6,  name: "Child's Play"}, 
							{value: 10, name: "Casual"},
							{value: 20, name: "Fun"},
							{value: 30, name: "Challenging"},
							{value: 40, name: "Difficulty"},
							{value: 50, name: "Hair-Loss Special"},
							{value: 60, name: "OCD Nightmare"}];
	this.difficulty = this.difficulties[1];
	this.paused = false;
	this.won = false;
	// Set up the exclude function that blocks out segments of the canvas (for UI elements)
	if (typeof exclude == "function")
	{
		this.exclude = exclude;
	}
	else
	{
		this.exclude = function()
		{
			return false;
		}
	}
	var moving = [];
	var that = this;

	// Privileged methods
	this.init = function()
	{
		// Set up data objects
		this.nodes = new Nodes(this.exclude);
		this.lines = new Lines();

		// Set up event handlers
		$(this.canvas).on("mousedown", canvas_click);
		$(this.canvas).on("touchstart", canvas_click);
		$(this.canvas).on("mouseup", canvas_click);
		$(this.canvas).on("touchend", canvas_click);
		$(this.canvas).on("mousemove", canvas_move);
		$(this.canvas).on("touchmove", canvas_move);
		$(window).on("resize", window_rescale);
		$(window).on("orientationchange", window_rescale);
		// Initialize data objects
		window_rescale();
		this.reset();
	};

	this.draw = function() 
	{
		// Clear the canvas;
		var context = this.canvas.getContext("2d");
		context.clearRect(0, 0, canvas.width, canvas.height);

		// Draw lines and nodes
		this.lines.draw(this.canvas);
		this.nodes.draw(this.canvas);
	};

	this.pause = function()
	{
		this.paused = true;
	};
  
	this.play = function()
	{
		this.paused = false;
	};

	this.reset = function()
	{
		this.won = false;

		// Generate new nodes and lines
		this.nodes.generate(this.difficulty.value);
		this.lines.generate(this.nodes, 2, 5);

		// Shuffle the nodes until some of the lines cross
		do 
		{
			this.nodes.shuffle(this.canvas);
		} while(this.lines.checkCrossings() === 0);
	};
  
	this.updateStatus = function() 
	{
		if (this.lines.checkCrossings() === 0 && moving.length == 0)
		{
			this.won = true;
			$(this).trigger("won");
		}
	};

	this.setDifficulty = function(d)
	{
		this.difficulty = this.difficulties[d];
		this.reset();
	};

	// Private methods
	function Nodes(exclude) 
	{
		// Public properties
		this.nodes = [];

		// The exclude defines where nodes are not allowed to be.
		// We pass it a node (with x and y coordinates), and if the node is
		// in a Bad Place, it returns true (otherwise false). This is a
		// default function in case a custom one isn't defined. It always
		// returns true.
		
		if (typeof exclude != "function")
		{
			exclude = function() 
			{
				return false;
			};
		}
		

		// Privileged methods
		this.generate = function(n) 
		{
			this.nodes = [];
			for (var i = 0; i < n; i++)
			{
				// Generate array of nodes
				this.nodes.push(new Node(0,0));
			}
		};

		this.shuffle = function(canvas)
		{
			// Generate random coordinates for each node (based on the local canvas space)
			var margin = Math.min(100, Math.min(canvas.height*0.1, canvas.width*0.1));
			var d_min_x = margin;
			var d_min_y = margin;
			var d_max_x = canvas.width-margin;
			var d_max_y = canvas.height-margin;

			for (var i = 0; i < this.nodes.length; i++) 
			{
				// Generate random coordinates (repeat if node is in a Bad Place)
				do 
				{
					this.nodes[i].x = Math.floor(Math.random()*(d_max_x-d_min_x+1)+d_min_x);
					this.nodes[i].y = Math.floor(Math.random()*(d_max_y-d_min_y+1)+d_min_y);
				} while (exclude(this.nodes[i]));
			}
		};

		this.draw = function(canvas) 
		{
			for (var i = 0; i < this.nodes.length; i++)
			{
				this.nodes[i].draw(canvas);
			}
		};

		this.rescale = function(dx, dy)
		{
			// Adjusts location of all nodes based on a constant factor
			// Used for resizing the canvas
			for (var i = 0; i < this.nodes.length; i++)
			{
				this.nodes[i].x *= dx;
				this.nodes[i].y *= dy;
			}
		};

		this.findNode = function(x, y)
		{
			// We actually sort backward through the list, since the later nodes are rendered
			// on top - so when you click on overlapping nodes, you get the uppermost one.
			for (var i = this.nodes.length-1; i >= 0; i--)
			{
				// Get offset from the node;
				var dx = x - this.nodes[i].x;
				var dy = y - this.nodes[i].y;
				// ...and check if clicking within node's radius:
				if (Math.sqrt((dx*dx)+(dy*dy)) < this.nodes[i].r) { // Pythagorean theorem - a^2 + b^2 = c^2
					// We have a node!
					return this.nodes[i];
				}
			}
			// No nodes found
			return false;
		};

		// Private methods
		function Node(x, y, r) 
		{
			// Public properties
			this.x = (typeof x === "undefined") ? 0 : x;
			this.y = (typeof y === "undefined") ? 0 : y;
			this.r = (typeof r === "undefined") ? 22 : r;

			// Private variables
			var that = this;

			// Privileged methods
			this.draw = function(canvas) 
			{
				var context = canvas.getContext("2d");
				context.globalCompositeOperation = "source-over";

				var grd = context.createRadialGradient(that.x, that.y, 0.000, that.x, that.y, that.r);

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
			// Wrap up and deliver:
			return this;
		}
	
		// Wrap up and deliver:
		return this;
	}

	function Lines() 
	{
		// Public properties
		this.lines = [];
		this.crossings = 0;

		// Privileged methods
		this.generate = function(nodesObj, min_connections, max_connections, color) 
		{
			// This function connects nodes randomly, but in such a way that the lines aren't crossed.
			// An imaginary grid is constructed, and the nodes are laid out sequentially:
			//
			//  01---02---03---04  // Each node is connected horizontally within its row
			//  |  \ |  /    \  |                                                       
			//  05---06---07---08  // Odd nodes are allowed to connect diagonally with
			//     \ |     |             either even number below and to the right or left
			//  09---10---11---12
			//  |    |       \  |  // Any node is allowed to connect to the node directly below
			//  13---14---15---16 
			//     \ |  /  |    |  // Once the nodes are shuffled, all resemblance to a grid disappears.
			//  17---18---19---20

			// Calculate the grid width
			var nodes = nodesObj.nodes;
			var square = Math.floor(Math.sqrt(nodes.length));
			var lines = [];

			for (var index = 0; index < nodes.length; index++)
			{
				// Each node starts out with zero outgoing connections.
				var connections = 1;

				// Add a default horizontal connection, if the node isn't at the end of a line
				if ((index+1) % square > 0 && index+1 < nodes.length) 
				{
					lines.push(new Line(nodes[index], nodes[index+1], color)); 
				}
				
				// Now loop, adding random connections (if necessary) until we have at least 
				// min_connections from this node. (Note that some of these lines may be duplicates;
				// we'll eliminate these below.)
				do 
				{
					// Odd nodes are eligible to make a diagonal connection, either left or right.
					if (index % 2 !== 0 && Math.random() > 0.3 && connections < max_connections) 
					{
						connections++;
						var diagonal_target = index + square + (Math.random > 0.5 ? 1 : -1);
						if (diagonal_target < nodes.length) 
						{
							lines.push(new Line(nodes[index], nodes[diagonal_target], color));
						}
					}

					// Any node is eligible to make a vertical connection.
					if (Math.random() > 0.3 && connections < max_connections) 
					{
						connections++;
						var vertical_target = index + square;
						if (vertical_target < nodes.length) {
							lines.push(new Line(nodes[index], nodes[vertical_target], color));
						}
					}
				} while (connections <= min_connections);
			}

			// Create a new duplicate-free list, and parse the list for duplicates:
			var uniqueLines = [];
			for (var i = 0; i < lines.length; i++)
			{
				var duplicate = false;
				for (var j = 0; j < uniqueLines.length; j++)
				{
					if (uniqueLines[j].equals(lines[i])) 
					{
						duplicate = true;
						break;
					}
				}
				if (!duplicate) 
				{
					uniqueLines.push(lines[i]);
				}
			}
			this.lines = uniqueLines;
		};

		this.draw = function(canvas)
		{
			// Render each of the lines.
			for (var i = 0; i < this.lines.length; i++)
			{
				this.lines[i].draw(canvas);
			}
		};

		this.checkCrossings = function()
		{
			// TODO: Optimize this function.
			var exclude = [];
			this.crossings = 0;

			for (var i = 0; i < this.lines.length; i++)
			{
				if (exclude.indexOf(i) == -1) {  // This one has not intersected yet.
					this.lines[i].crossed = false; 
				}

				for (var j = i+1; j < this.lines.length; j++) // Loop through all remaining lines and see if any intersect
				{
					if (this.lines[i].crosses(this.lines[j])) {
						// The lines intersect.
						this.lines[i].crossed = true;
						this.lines[j].crossed = true;
						exclude.push(j);
						this.crossings++;
					}
				}
			}
			return this.crossings;
		};

		// Private methods
		function Line(node1, node2, color)
		{
			// Basic input validation - if the nodes are empty, we can't very well make a line.
			if (node1 === undefined || node2 === undefined) { throw new Error("Invalid node"); }
			
			// Private variables

			var that = this;
			var defaultColor = { // Default color scheme
				base: "rgba(0, 255, 255, 1.000)",
				baseCore: "rgba(255, 255, 255, 1.000)",
				crossed: "rgba(128, 0, 0, 1.000)",
				crossedCore: "rgba(128, 128, 128, 1.000)"
			};

			// Public properties
			this.n1 = node1;
			this.n2 = node2;
			this.color = (typeof color === "undefined") ? defaultColor : color;
			this.crossed = false;


			// Privileged methods

			this.draw = function(canvas) 
			{
				// Draws the line on the given canvas.
				var x1 = that.n1.x;
				var y1 = that.n1.y;
				var x2 = that.n2.x;
				var y2 = that.n2.y;

				var context = canvas.getContext("2d");

				context.globalCompositeOperation = "lighter";
				
				context.beginPath();
				context.moveTo(x1, y1);
				context.lineTo(x2, y2);
				context.strokeStyle = this.crossed ? this.color.crossed : this.color.base;
				context.lineWidth = 7;
				context.stroke();

				context.beginPath();
				context.moveTo(x1, y1);
				context.lineTo(x2, y2);
				context.strokeStyle = this.crossed ? this.color.crossedCore : this.color.baseCore;
				context.lineWidth = 3;
				context.stroke();
			};

			this.equals = function(line) 
			{
				// Checks if two lines have the same nodes.
				return ((line.n1 == this.n1 && line.n2 == this.n2) ||
								(line.n1 == this.n2 && line.n2 == this.n1));
			};

			this.crosses = function(line) 
			{
				// Calculate cross products for the first line.
				// Details on the math: http://stackoverflow.com/questions/7069420/check-if-two-line-segments-are-colliding-only-check-if-they-are-intersecting-n
				var xp1 = (this.n1.x - this.n2.x) * (line.n1.y - this.n1.y) - (this.n1.y - this.n2.y) * (line.n1.x - this.n1.x);
				var xp2 = (this.n1.x - this.n2.x) * (line.n2.y - this.n1.y) - (this.n1.y - this.n2.y) * (line.n2.x - this.n1.x);

				// ...and the second line:
				var xp3 = (line.n1.x - line.n2.x) * (this.n1.y - line.n1.y) - (line.n1.y - line.n2.y) * (this.n1.x - line.n1.x);
				var xp4 = (line.n1.x - line.n2.x) * (this.n2.y - line.n1.y) - (line.n1.y - line.n2.y) * (this.n2.x - line.n1.x);

				if (xp1 * xp2 < 0 && xp3 * xp4 < 0) 
				{
					// The lines intersect.
					return true;
				}
				return false;
			};
		}
	
		// Wrap up and deliver:
		return this;
	}

	// Canvas click handlers
	function canvas_click(evt)
	{
		if (that.paused) {return;} // Game is paused.
		evt.preventDefault();
		var coords = [];
		moving = [];
		if (evt.type == "touchstart" || evt.type == "touchend") // Touch event; check all current 
		{														// touches to see if any are still valid
			for (var i = 0; i < evt.originalEvent.touches.length; i++)
			{
				coords.push({
					x: evt.originalEvent.touches[i].pageX,
					y: evt.originalEvent.touches[i].pageY
				});
			}
		} else if (evt.type == "mousedown") { // Mousedown event; store coords and check them out.
			coords[0] = {
				x: evt.pageX,
				y: evt.pageY
			};
		} else { // Mouseup event; we just need to clear moving.
			return;
		}


		for (var j = 0; j < coords.length; j++)
		{
			var node = that.nodes.findNode(coords[j].x, coords[j].y);
			if (node !== false)
			{
				moving[j] = node;
			}
			
		}
	}

	function canvas_move(evt) 
	{
		// Check if we're moving something; if so, update its position.
		evt.preventDefault();
		if (moving.length > 0 && !that.paused && !that.won) {
			for (var i = 0; i < moving.length; i++)
			{
				if (evt.type == "touchmove") 
				{
					moving[i].x = evt.originalEvent.touches[i].pageX;
					moving[i].y = evt.originalEvent.touches[i].pageY;
				}
				else 
				{
					moving[i].x = evt.pageX;
					moving[i].y = evt.pageY;
				}
			}
		}
	}

	function window_rescale()
	{
		var context = that.canvas.getContext("2d");

		var old_x = context.canvas.width;
		var old_y = context.canvas.height;
		// Target bounding box:
		var new_x = window.innerWidth;
		var new_y = window.innerHeight;

		context.canvas.width  = new_x;
		context.canvas.height = new_y;

		that.nodes.rescale(new_x/old_x, new_y/old_y);
	}
}