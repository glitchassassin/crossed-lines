function Modal(content)
{
	this.content = content;
	this.name = name;
	var matte = $("<div></div>", {
		class: "modal-matte",
		style: {display: "none", opacity: 0}
	});
	var dialog = $("<div></div>", {
		class: "modal-dialog"
	});
	var message = $("<div></div>", {
		class: "modal-message"
	});
	var button = $("<div></div>", {
		class: "modal-button"
	});
	var buttonTarget;
	var buttonLabel = $("<div></div>", {
		class: "modal-button-label",
		text: "New Game"
	});
	var that = this;	

	// Privileged methods
	
	this.init = function()
	{
		// Setting up DOM elements
		$(matte).append(dialog);
		$(dialog).append(message).append(button);
		$(message).append(content);
		$(message).append(buttonLabel);
		$(matte).hide();
		$(dialog).hide();
		$("body").append(matte);
		$.get(
			"img/button.svg", 
			function(data) 
			{
				button.append(data.documentElement);
				buttonTarget = button.find("#svgbuttonpath");
				buttonTarget
					.css("stroke", "rgba(0,200,0,1)")
					.css("fill", "rgba(0,255,0,0.3)")
					.hover(function() 
						{
							$(this).css("fill", "rgba(0,255,0,0.4)");
						},
						function()
						{
							$(this).css("fill", "rgba(0,255,0,0.3)")
						}
					)
					.click(function() { $(that).trigger("buttonClicked") });
			}
		);
		window_rescale();

		// Setting up event handlers
		$(window).on("resize", window_rescale);
		$(window).on("orientationchange", window_rescale);
	}

	this.show = function(callback)
	{
		$(matte).show("fade", 250);
		$(dialog).show("pulsate", 250, callback);
	};

	this.hide = function(callback)
	{
		$(matte).hide("fade", 500);
		$(dialog).hide("pulsate", 500, callback);
	};

	// Private methods

	function window_rescale()
	{
		$(dialog).css("top", (window.innerHeight - $(dialog).height()) / 2);
		$(dialog).css("left", (window.innerWidth - $(dialog).width()) / 2);
	}

	// Initialize the object

	this.init();
}