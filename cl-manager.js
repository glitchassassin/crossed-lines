function GameManager(canvasElement, clockElement, menuElement)
{
	var gameBoard = new GameBoard(canvasElement, function(node)
	{
		// Exclusion function (for the clock widget)
		if (node.x > (window.innerWidth - 150) && node.y < 150)
		{
			return true;
		}
		return false;
	});
	var clock = new Clock(clockElement);
	var menu = new Menu(menuElement);

	this.init = function()
	{
		$(gameBoard).on("won", handleWon);
		gameBoard.init();
		clock.init();
		menu.init();
		setupMenuItems();

		render();
	}

	function setupMenuItems()
	{
		// Set up advanced menu elements

		$("#clock").click(function()
		{
			if (menu.visible)
			{
				menu.hide(function()
				{
					resumeGame();
				});
			}
			else
			{
				pauseGame();
				menu.show();
			}
		});

		$("#continuebutton").click(function() 
		{
			menu.hide(function() 
			{
				resumeGame();
			});
		});

		$("#difficulty-slider").slider({
			orientation: "vertical", 
			max: 6,
			min: 0,
			animate: "fast",
			value: 1,
			change: function(evt, ui) { gameBoard.setDifficulty(ui.value); }
		});

		$("#restartbutton").click(function() {
			menu.hide(function() 
			{
				resetGame();
			});
		});
	}
	
	function handleWon()
	{
		clock.pause();
		var difficulty = gameBoard.difficulty;
		var time = clock.toString();

		var message = $("<div></div>")
					.text("Good job!")
					.append($("<div></div>", 
						{class: "won-difficulty-label", text: "Difficulty:"}))	
					.append($("<div></div>", 
						{class: "won-difficulty", text: difficulty.name}))
					.append($("<div></div>", 
						{class: "won-time-label", text: "Time:"}))
					.append($("<div></div>", 
						{class: "won-time", text: time}));
		var wonDialog = new Modal(message, "won");
		wonDialog.show();
		$(wonDialog).on("buttonClicked", wonDialog, closeWonDialog);
	}

	function closeWonDialog(evt)
	{
		var wonDialog = evt.data;
		wonDialog.hide(resetGame);
	}

	function pauseGame()
	{
		gameBoard.pause();
		clock.pause();
	}

	function resumeGame()
	{
		gameBoard.play();
		clock.start();
	}

	function resetGame()
	{
		gameBoard.reset();
		gameBoard.play();
		clock.restart();
	}

	function render()
	{
		if (!gameBoard.won)
		{
			gameBoard.updateStatus();
		}
		gameBoard.draw();
		clock.draw();

		// Repeat at next frame
		requestAnimationFrame(render);
	}
}
