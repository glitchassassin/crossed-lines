function Menu(menuElement)
{
	var domElement = menuElement;
	var matte = $("<div></div>", 
	{
		class: "menu-matte"
	}).hide();
	var outline;
	var that = this;

	this.visible = false;
	this.transitioning = false;


	// Privileged methods
	this.init = function()
	{
		$(domElement).hide();
		$(menuElement).parent().prepend(matte);
		$.get(
			"img/ui.svg", 
			function(data) 
			{
				outline = data.documentElement;
				$(menuElement).prepend($(outline).show());
			}
		);
	};

	this.show = function(callback)
	{
		matte.show();
		if (!that.visible)
		{
			$(domElement).show("pulsate", 300);
			//$(outline).stop().show("pulsate", 300);
			that.visible = true;
			if (typeof callback == "function") {callback()};
		}
	};

	this.hide = function(callback)
	{
		if (that.visible)
		{
			$(matte).hide();
			$(domElement).stop().hide();
			//$(outline).stop().hide();
			that.visible = false;
			if (typeof callback == "function") {callback()};
		}
	};

	this.addMenuElement = function(element)
	{
		$(domElement).append(element);
	};
}