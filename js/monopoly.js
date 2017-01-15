var Monopoly = {};
Monopoly.allowRoll = true;
Monopoly.moneyAtStart = 150;
Monopoly.doublesCounter = 0;



//INITIALIZING CODE FUNCTIONS
Monopoly.init = function(){
    $(document).ready(function(){
        Monopoly.adjustBoardSize();
        $(window).bind("resize",Monopoly.adjustBoardSize);
        Monopoly.initDice();
        Monopoly.initPopups();
        Monopoly.start();        
    });
};



//START GAME POP-UP
Monopoly.start = function(){
    Monopoly.showPopup("intro")
};



//ADD CLICK EVENT TO DICE AND CALL ROLL DICE FUNCTION
Monopoly.initDice = function(){
    $(".dice").click(function(){
        if (Monopoly.allowRoll){
            Monopoly.rollDice();
        }
    });
};



//GET CURRENT PLAYER
Monopoly.getCurrentPlayer = function(){
    return $(".player.current-turn");
};



//GET CELL CLOSEST TO CURRENT PLAYER (CLOSEST = ANCESTOR/PARENT)
Monopoly.getPlayersCell = function(player){
    return player.closest(".cell");
};



//GET CURRENT PLAYER'S CURRENT AMOUNT OF MONEY
Monopoly.getPlayersMoney = function(player){
    return parseInt(player.attr("data-money"));
};



//UPDATE PLAYER MONEY AFTER TRANSACTION OR PLAY. CHECK IF MONEY IS 0
Monopoly.updatePlayersMoney = function(player,amount){

    var playersMoney = parseInt(player.attr("data-money"));
    playersMoney -= amount;
    player.attr("data-money",playersMoney);
    player.attr("title",player.attr("id") + ": $" + playersMoney);
    Monopoly.playSound("chaching");
    
    //FIND PLACE TO DISPLAY PLAYER'S MONEY IN WINDOW
    
};



//ROLL DICE - CHECK IF DOUBLES - 3 DOUBLES GO TO JAIL
Monopoly.rollDice = function(){
    Monopoly.playSound("rolldice");
    var result1 = Math.floor(Math.random() * 6) + 1 ;
    var result2 = Math.floor(Math.random() * 6) + 1 ;
    $(".dice").find(".dice-dot").css("opacity",0);
    $(".dice#dice1").attr("data-num",result1).find(".dice-dot.num" + result1).css("opacity",1);
    $(".dice#dice2").attr("data-num",result2).find(".dice-dot.num" + result2).css("opacity",1);
    

    //CHECK IF PLAYER ROLLED DOUBLES - 1st Doubles Set
    if (result1 === result2){

        //ADD 1 TO COUNTER
        Monopoly.doublesCounter++; //counter = 1

        if (Monopoly.doublesCounter < 3){
            //MOVE CURRENT PLAYER TOTAL NUMBER ON DICE
            var currentPlayer = Monopoly.getCurrentPlayer();
            Monopoly.handleAction(currentPlayer,"move",result1 + result2);
            Monopoly.allowRoll = true;

        } else {

            //IF 3RD DOUBLES SET OCCURS
            //SEND CURRENT PLAYER TO JAIL
            var currentPlayer = Monopoly.getCurrentPlayer();
            Monopoly.handleGoToJail(currentPlayer);
            Monopoly.doublesCounter = 0;
                        
        }

    } else {
        //MOVE CURRENT PLAYER TOTAL NUMBER ON DICE
        var currentPlayer = Monopoly.getCurrentPlayer();
        Monopoly.handleAction(currentPlayer,"move",result1 + result2);
        Monopoly.doublesCounter = 0;

    }

};



//FUNCTION CALLED IN "handleAction" FUNCTION
Monopoly.movePlayer = function(player,steps){
    
    //DON'T ALLOW MORE ROLLS
    Monopoly.allowRoll = false;

    var playerMovementInterval = setInterval(function(){

        //CHECK #STEPS LEFT IN TURN
        if (steps == 0){

            //STOP TURN, DO SOMETHING
            clearInterval(playerMovementInterval);
            Monopoly.handleTurn(player);
        }else{

            //ID CURRENT CELL, MOVE PLAYER TO NEXT SPACE, SUBTRACT 1 FROM REMAINING MOVES
            var playerCell = Monopoly.getPlayersCell(player);
            var nextCell = Monopoly.getNextCell(playerCell);
            nextCell.find(".content").append(player);
            steps--;
        }
    },200);
};



//IDENTFIY CURRENT CELL AND PLAYER OPTIONS ON CURRENT CELL
Monopoly.handleTurn = function(){
    var player = Monopoly.getCurrentPlayer();
    var playerCell = Monopoly.getPlayersCell(player);

    if (playerCell.is(".available.property")){
        Monopoly.handleBuyProperty(player,playerCell);

    }else if(playerCell.is(".property:not(.available)") && !playerCell.hasClass(player.attr("id"))){
         Monopoly.handlePayRent(player,playerCell);

    }else if(playerCell.is(".go-to-jail")){
        Monopoly.handleGoToJail(player);

    }else if(playerCell.is(".chance")){
        Monopoly.handleChanceCard(player);

    }else if(playerCell.is(".community")){
        Monopoly.handleCommunityCard(player);
    
    }else{
        Monopoly.setNextPlayerTurn();
    }
}



//GET BOARD/DICE READY FOR NEXT PLAYER
Monopoly.setNextPlayerTurn = function(){
    var currentPlayerTurn = Monopoly.getCurrentPlayer();
    var playerId = parseInt(currentPlayerTurn.attr("id").replace("player",""));
    var nextPlayerId = playerId + 1;

    //IF LAST PLAYER TOOK TURN, GO BACK TO PLAYER 1
    if (nextPlayerId > $(".player").length){
        nextPlayerId = 1;
    }

    //IF CURRENT PLAYER ROLLED DOULBLES
    if (Monopoly.doublesCounter > 0 && Monopoly.doublesCounter < 3) {
        Monopoly.closePopup();
        Monopoly.allowRoll = true;
        return;
    }

    currentPlayerTurn.removeClass("happy-face");
    currentPlayerTurn.removeClass("current-turn");

    var nextPlayer = $(".player#player" + nextPlayerId);
    nextPlayer.addClass("current-turn");

    if (nextPlayer.is(".jailed")){
        var currentJailTime = parseInt(nextPlayer.attr("data-jail-time"));
        currentJailTime++;
        nextPlayer.attr("data-jail-time",currentJailTime);

        if (currentJailTime > 3){
            nextPlayer.removeClass("jailed sad-face");
            nextPlayer.removeAttr("data-jail-time");
        }

        Monopoly.setNextPlayerTurn();
        return;
    }

    if (nextPlayer.is(".broke")){
        Monopoly.setNextPlayerTurn();
        return;
    }

    Monopoly.closePopup();
    Monopoly.allowRoll = true;
};



//BUY PROPERTY
Monopoly.handleBuyProperty = function(player,propertyCell){
    var propertyCost = Monopoly.calculateProperyCost(propertyCell);
    var popup = Monopoly.getPopup("buy");
    popup.find(".cell-price").text(propertyCost);
    popup.find("button").unbind("click").bind("click",function(){
        var clickedBtn = $(this);
        if (clickedBtn.is("#yes")){
            Monopoly.handleBuy(player,propertyCell,propertyCost);
            player.addClass("happy-face");
        }else{
            Monopoly.closeAndNextTurn();
        }
    });
    Monopoly.showPopup("buy");
};



//PAY RENT
Monopoly.handlePayRent = function(player,propertyCell){
    var playersMoney = parseInt(player.attr("data-money"));
    var currentRent = parseInt(propertyCell.attr("data-rent"));

    if(playersMoney < currentRent){
        var popup = Monopoly.getPopup("gameOver");
        Monopoly.showPopup("gameOver");
        popup.find("button").unbind("click").bind("click",function(){
            player.hide();
            player.addClass("broke");
            $(".cell").removeClass(player.attr("id"))
                    .addClass("available")
                    .removeAttr("data-owner")
                    .removeAttr("data-rent");

            Monopoly.closeAndNextTurn();   
        });   

    } else {
        var popup = Monopoly.getPopup("pay"); 
        var properyOwnerId = propertyCell.attr("data-owner");
        popup.find("#player-placeholder").text(properyOwnerId);
        popup.find("#amount-placeholder").text(currentRent);
        popup.find("button").unbind("click").bind("click",function(){
            var properyOwner = $(".player#"+ properyOwnerId);
            Monopoly.updatePlayersMoney(player,currentRent);
            Monopoly.updatePlayersMoney(properyOwner,-1*currentRent);
            Monopoly.closeAndNextTurn();
        });
    Monopoly.showPopup("pay");
    }
};



//GO TO JAIL POP-UP, CALL "handleAction" FUNCTION ON JAIL
Monopoly.handleGoToJail = function(player){
    var popup = Monopoly.getPopup("jail");
    popup.find("button").unbind("click").bind("click",function(){
        Monopoly.handleAction(player,"jail");
    });
    Monopoly.showPopup("jail");
    Monopoly.doublesCounter = 0;
};



//SHOW CHANCE CARD & INVOKE ACTION
Monopoly.handleChanceCard = function(player){
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_chance_card", function(chanceJson){
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",chanceJson["action"]).attr("data-amount",chanceJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click",function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player,action,amount);
    });
    Monopoly.showPopup("chance");
};



//SHOW COMMUNITY CARD & INVOKE ACTION
Monopoly.handleCommunityCard = function(player){
    var popup = Monopoly.getPopup("community");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_community_card", function(communityJson){
        popup.find(".popup-content #text-placeholder").text(communityJson["content"]);
        popup.find(".popup-title").text(communityJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",communityJson["action"]).attr("data-amount",communityJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click",function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player,action,amount);
    });
    Monopoly.showPopup("community");
};



//SEND USER TO JAIL
Monopoly.sendToJail = function(player){
    player.addClass("jailed sad-face");
    player.attr("data-jail-time",1);
    $(".corner.game.cell.in-jail").append(player);
    Monopoly.playSound("woopwoop");
    Monopoly.doublesCounter = 0;
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};



//CALL POP-UPS
Monopoly.getPopup = function(popupId){
    return $(".popup-lightbox .popup-page#" + popupId);
};



//GET PRICE OF CELL PROPERTY
Monopoly.calculateProperyCost = function(propertyCell){
    var cellGroup = propertyCell.attr("data-group");
    var cellPrice = parseInt(cellGroup.replace("group","")) * 5;
    if (cellGroup == "rail"){
        cellPrice = 10;
    }
    return cellPrice;
};



//GET PRICE OF CELL RENT BASED ON PROPERTY COST
Monopoly.calculateProperyRent = function(propertyCost){
    return propertyCost/2;
};



//CLOSE POP-UP AND RESET FOR NEXT PLAYER TURN
Monopoly.closeAndNextTurn = function(){
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};



//INITIATE GAME-START POP-UP (GET # OF PLAYERS)
Monopoly.initPopups = function(){
    $(".popup-page#intro").find("button").click(function(){
        var numOfPlayers = $(this).closest(".popup-page").find("input").val();
        if (Monopoly.isValidInput("numofplayers",numOfPlayers)){
            Monopoly.createPlayers(numOfPlayers);
            Monopoly.closePopup();
        }
    });
};



//BUY PROPERTY FUNCTION
Monopoly.handleBuy = function(player,propertyCell,propertyCost){
    var playersMoney = Monopoly.getPlayersMoney(player)
    if (playersMoney < propertyCost){
        Monopoly.showErrorMsg();
        Monopoly.playSound("airhorn");
    }else{
        Monopoly.updatePlayersMoney(player,propertyCost);
        var rent = Monopoly.calculateProperyRent(propertyCost);

        propertyCell.removeClass("available")
                    .addClass(player.attr("id"))
                    .attr("data-owner",player.attr("id"))
                    .attr("data-rent",rent);
        Monopoly.setNextPlayerTurn();
    }
};



//GAME PLAY ACTIONS
Monopoly.handleAction = function(player,action,amount){
    switch(action){
        case "move":
            Monopoly.movePlayer(player,amount);
             break;
        case "pay":
            Monopoly.updatePlayersMoney(player,amount);
            Monopoly.setNextPlayerTurn();
            break;
        case "jail":
            Monopoly.sendToJail(player);
            break;
    };
    Monopoly.closePopup();
};



//CREATE PLAYER TOKENS
Monopoly.createPlayers = function(numOfPlayers){
    var startCell = $(".go");
    for (var i=1; i<= numOfPlayers; i++){
        var player = $("<div />").addClass("player shadowed").attr("id","player" + i).attr("title","player" + i + ": $" + Monopoly.moneyAtStart);
        startCell.find(".content").append(player);
        if (i==1){
            player.addClass("current-turn");
        }
        player.attr("data-money",Monopoly.moneyAtStart);
    }
};



//ID CELL NEXT TO PLAYER
//CALL "passedGo" FUNCTION
Monopoly.getNextCell = function(cell){
    var currentCellId = parseInt(cell.attr("id").replace("cell",""));
    var nextCellId = currentCellId + 1;
    if (nextCellId > 40){
        Monopoly.handlePassedGo();
        nextCellId = 1;
    }
    return $(".cell#cell" + nextCellId);
};



//PASSGO FUNCTION & UPDATE MONEY
Monopoly.handlePassedGo = function(){
    var player = Monopoly.getCurrentPlayer();
    var playersMoney = parseInt(player.attr("data-money"));
    playersMoney = playersMoney + 15; 
    player.attr("data-money",playersMoney);
    Monopoly.playSound("chaching");
};



//REMOVE PLAYER FROM GAME
// Monopoly.removePlayer = function(player){

// }



//CHECK IF #PLAYERS IS VALID
Monopoly.isValidInput = function(validate,value){
    var isValid = false;
    switch(validate){
        case "numofplayers":
            if(value > 1 && value <= 6){
                isValid = true;
                break;
            }  
    }

    if (!isValid){
        Monopoly.showErrorMsg();
    }
    return isValid;

}



//ERROR MESSAGE CATALOG
Monopoly.showErrorMsg = function(){
    $(".popup-page .invalid-error").fadeTo(500,1);
    setTimeout(function(){
            $(".popup-page .invalid-error").fadeTo(500,0);
    },2000);
};



//RESPONSIVE BOARD SIZE
Monopoly.adjustBoardSize = function(){
    var gameBoard = $(".board");
    var boardSize = Math.min($(window).height(),$(window).width());
    boardSize -= parseInt(gameBoard.css("margin-top")) *2;
    $(".board").css({"height":boardSize,"width":boardSize});
}



//CLOSE POP-UPS WITH FADE OUT
Monopoly.closePopup = function(){
    $(".popup-lightbox").fadeOut();
};



//PLAY SOUNDS, LOOP THROUGH
Monopoly.playSound = function(sound){
    var snd = new Audio("./sounds/" + sound + ".wav"); 
    snd.play();
}



//CONTROL POP-UP DISPLAYS
Monopoly.showPopup = function(popupId){
    $(".popup-lightbox .popup-page").hide();
    $(".popup-lightbox .popup-page#" + popupId).show();
    $(".popup-lightbox").fadeIn();
};



//START GAME
Monopoly.init();