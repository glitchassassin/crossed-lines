function GameManager(canvasElement, clockElement, menuElement)
{
	var gameBoard = new GameBoard(canvasElement, function(node)
	{
		// Exclusion function (for the clock widget)
		var clockWidth = 150;
		if (window.innerWidth < 1000)
		{
		    clockWidth = 100;
		}
		
		if (node.x > (window.innerWidth - clockWidth) && node.y < clockWidth)
		{
			return true;
		}

		// Nodes should also be prevented from spawning too close to the top 
		// or sides of the screen (for mobile browsers, which may have 
		// gestures around those areas).
		if (node.x < 20 || node.x > window.innerWidth - 20 || 
			node.y < 20 || node.y > window.innerHeight - 20)
		{
			return true
		}

		// Otherwise they're good!
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
		pauseGame();
		menu.show();

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
			change: function(evt, ui) { gameBoard.setDifficulty(ui.value); clock.restart(); clock.pause(); }
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
		var highScores = null;
		var newHighScore = false;
		
		
		if (supportsLocalStorage())
		{
		    // Load high scores
		    if (typeof localStorage["cl-highscores"] !== 'undefined')
		    {
		        highScores = JSON.parse(localStorage["cl-highscores"]);
		    }
		    else
		    {
		        highScores = [];
		        console.log(gameBoard);
		        for (var i = 0; i < gameBoard.difficulties.length; i++)
		        {
		            highScores[gameBoard.difficulties[i].value] = "99:99";
		        }
		    }
		    
		    
		    // Update high scores if necessary
    		if (highScores[difficulty.value] > time)
    		{
    		    newHighScore = true;
    		    highScores[difficulty.value] = time;
    		}
    		
    		// Save high scores
    		localStorage["cl-highscores"] = JSON.stringify(highScores);
		}
		
		
		

		var message = $("<div></div>")
					.append($("<div></div>", 
						{class: "modal-title", text: "Puzzle Solved"}))	
					.append($("<div></div>", 
						{class: "won-difficulty-label", text: "Difficulty:"}))	
					.append($("<div></div>", 
						{class: "won-difficulty", text: difficulty.name}))
					.append($("<div></div>", 
						{class: "won-time-label", text: "Time:"}))
					.append($("<div></div>", 
						{class: "won-time", text: time}));
						
		if (newHighScore)
		{
			message.append($("<div></div>", 
						{class: "high-score", text: "New High Score!"}))
					.append($("<div></div>", 
						{class: "new-high-score high-score-time", text: highScores[difficulty.value]}));
		}
		else if (highScores !== null)
		{
		    message.append($("<div></div>", 
						{class: "high-score", text: "High Score:"}))
					.append($("<div></div>", 
						{class: "high-score-time", text: highScores[difficulty.value]}));
		}
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
	
	function supportsLocalStorage() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    }
}
