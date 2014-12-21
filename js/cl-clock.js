// Requires JQuery be included first

function Clock(canvas)
{
	// Public properties
	this.canvas = canvas;
	this.timer = new Date();
	this.paused = null;
	this.hovered = false;

	var that = this;
	var circle1 = new clockCircle(60, 6, true);
	var circle2 = new clockCircle(76, 6, false);

	// Privileged methods

	this.init = function()
	{
		$(this.canvas).click(function() 
		{
			$(that).trigger("click");
		});

		$(this.canvas).mouseover(function() 
		{
			that.hovered = true;
		})
		.mouseout(function()
		{
			that.hovered = false;
		});
		
		this.start();
	};

	this.start = function()
	{
		if (this.paused != null)
		{
			this.timer = new Date() - (this.paused - this.timer);
		}
		this.paused = null;
	};

	this.pause = function()
	{
		if (this.paused == null)
		{
			this.paused = new Date();
		}
	};

	this.restart = function()
	{
		this.timer = new Date();
		this.paused = null;
	};

	this.draw = function()
	{
		// Set up...
		var text = this.toString();
		var context = this.canvas.getContext("2d");
		context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Draw circles
		if (this.paused != null)
		{
			if (this.hovered == true) 
			{
				circle1.render("paused");
			}
			else
			{
				circle1.render("paused");
			}
			circle2.render("paused", true);
		}
		else
		{
			if (this.hovered == true) 
			{
				circle1.render("hovered");
			}
			else
			{
				circle1.render();
			}
			circle2.render();
		}
		circle1.draw(this.canvas);
		circle2.draw(this.canvas);

		// Calculate text position
		x = (this.canvas.width/2);
		y = this.canvas.height/2;

		// Draw text
		context.fillStyle = "white";
		context.font = "30px 'Open Sans'";
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.fillText(text, x, y);
	};

	this.toString = function()
	{
		var elapsed = new Date() - this.timer;
		if (this.paused != null) { elapsed = this.paused - this.timer; } // Timer doesn't go up when paused
		var milliseconds = Math.floor(elapsed/10) % 100;
		var seconds = Math.floor(elapsed/1000) % 60;
		var minutes = Math.floor(elapsed/60000) % 100;
        
        // Timer caps out at 99 minutes.
		return (minutes < 10 ? "0" : "") + Math.min(minutes, 99) + ":" + (seconds < 10 ? "0" : "") + seconds;
	};

	// Private functions

	function clockCircle(radius, width, wise)
	{
		console.log("clockCircle()");
		var base_r = radius;
		var r = base_r;
		var w = width;
		var segmentCount = 5;
		var segments = [];
		var arc = (Math.random()*(Math.PI*2/3))+Math.PI;
		var angle = (Math.random()*Math.PI*2);
		var clockwise = wise;
		var tick = new Date();
		var color = {r: 255, g: 255, b: 255, d: {r: 255, g: 255, b: 255}};

		this.speed = 0.0004;

		for (var i = 0; i < segmentCount; i++)
		{
			segment = {
				width: (Math.random()-0.5)*(arc/(2*segmentCount)) + (arc/(2*segmentCount)),
				angle: (Math.random()*Math.PI*2)
			};
			segments[i] = segment;
		}

		this.draw = function(canvas)
		{
			var context = canvas.getContext("2d");
			var x = canvas.width/2;
			var y = canvas.height/2;
			for (var i = 0; i < segmentCount; i++)
			{
				context.beginPath();
				context.arc(x, y, r-(width*0.75), segments[i].angle, ((segments[i].angle+segments[i].width)%(Math.PI*2)), false);
				context.lineWidth = width;
				context.strokeStyle = 'rgb('+Math.floor(color.r)+','+Math.floor(color.g)+','+Math.floor(color.b)+')';
				context.stroke();
			}

			context.beginPath();
			context.arc(x, y, r-(width), angle, ((angle+arc)%(Math.PI*2)), false);
			context.lineWidth = width/2;
			context.strokeStyle = 'rgb('+color.r+','+color.g+','+color.b+')';
			context.stroke();
		};

		this.render = function(status, outer)
		{
			var oldTick = tick;
			tick = new Date();
			var tickTime = tick.getTime()-oldTick.getTime();
			var speed = this.speed * (tickTime * (clockwise ? 1 : -1));
			var colorspeed = ((tickTime)/1000)*510;

			if (status == "paused")
			{
				var targetAngle1 = (Math.PI*1.5)-segments[0].width/2;
				var targetAngle2 = (Math.PI*0.5)-segments[1].width/2;
				speed = speed / 8;
				//colorspeed = colorspeed/2;
				color.d = {r: 255, g: 255, b: 255};
				r = base_r;
			}
			else if (status == "hovered")
			{
				r = base_r - 1;
				color = {r: 0, g: 255, b: 255, d: {r: 0, g: 255, b: 255}};
				speed = speed / 8;
			}
			else
			{
				r = base_r;
				color.d = {r: 255, g: 255, b: 255};
			}

			// Animate color shift

			if (color.r < color.d.r) { color.r += colorspeed; }
			else if  (color.r > color.d.r) { color.r -= colorspeed; }

			if (color.g < color.d.g) { color.g += colorspeed; }
			else if  (color.g > color.d.g) { color.g -= colorspeed; }

			if (color.b < color.d.b) { color.b += colorspeed; }
			else if  (color.b > color.d.b) { color.b -= colorspeed; }

			angle = ((angle + speed)%(Math.PI*2) + (Math.PI*2)) % (Math.PI*2);

			for (var i = 0; i < segmentCount; i++)
			{
				speed = speed * 1.3 * (i%2==0 ? 1 : -1);
				segments[i].angle = ((segments[i].angle + speed)%(Math.PI*2) + (Math.PI*2)) % (Math.PI*2);
			}
			if (targetAngle1 && outer) { segments[0].angle = targetAngle1; }
			if (targetAngle2 && outer) { segments[1].angle = targetAngle2; }
		};
	}
}