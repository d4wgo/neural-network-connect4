var canvas = document.getElementById("playCanvas");
var ctx = canvas.getContext("2d");
canvas.height = window.innerHeight * 0.75;
canvas.width = window.innerHeight * 1.1666 * 0.75
var scale = canvas.height / 300;
const gameBoardImage = new Image();
gameBoardImage.src = "https://i.ibb.co/KztLGPf/gameboard.png";

class Vector2 {
    constructor(startX, startY) {
        this.x = startX;
        this.y = startY;
    }
}
class Node {
    constructor() {
        this.value = 0;
    }
    addToValue(additive) {
        this.value += additive;
    }
    get calculatedValue() {
        return Math.tanh(this.value);
    }
}
function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}
var inputCount = 42;
var outputCount = 7;
class Network {
    constructor(middleSize,parentNetworks){ //middleSize is a array of integers that defines each middle layer
        this.middleSizes = middleSize;
        if(parentNetworks != null){
            this.middleSizes = parentNetworks[0].middleSizes;
        }
        this.depth = this.middleSizes.length;
        this.weights = []; 
        this.nodes = [];
        let nodeCount = 0;
        for(var i = 0; i < this.middleSizes.length; i++){
            nodeCount += this.middleSizes[i];
        }
        for(var i = 0; i < nodeCount; i++){
            this.nodes.push(new Node());
        }
        this.weightCount = (inputCount * this.middleSizes[0]) + (outputCount * this.middleSizes[this.middleSizes.length - 1]);
        if(this.middleSizes.length > 1){
            for(var i = 1; i < this.middleSizes.length; i++){
                this.weightCount += (this.middleSizes[i] * this.middleSizes[i - 1]);
            }
        }
        if(parentNetworks == null){
            for(var i = 0; i < this.weightCount; i++){
                this.weights.push((Math.random() * 2) - 1);
            }
        }
        else{
            this.mate(parentNetworks);
        }
    }
    mate(nets){
        //console.log("mate");
        var c1 = Math.floor(Math.random() * nets.length);
        var p1 = nets[c1];
        var c2 = Math.floor(Math.random() * nets.length);
        while(true){
            if(c2 != c1){
                break;
            }
            c2 = Math.floor(Math.random() * nets.length);
        }
        var p2 = nets[c2];
        if(this.weightCount != p1.weightCount){
            console.error("Weightcounts do not match.");
        }
        for(var i = 0; i < this.weightCount; i++){
            if(Math.random() < 0.5){
                this.weights.push(p1.weights[i]);
            }
            else{
                this.weights.push(p2.weights[i]);
            }
            if(Math.random() < 0.01){
                //console.log("mutate");
                if(Math.random() < 0.5){
                    this.weights[this.weights.length - 1] *= (Math.random() * 2);
                }
                else{
                    this.weights[this.weights.length - 1] *= (Math.random() * 4) - 1;
                }
            }
        }
    }
    runThrough(inputs){
        if(inputs.length != inputCount){
            console.error("Inputs does not equal input count!");
            return null;            
        }
        for(var i = 0; i < this.nodes.length; i++){
            this.nodes[i].value = 0;
        }
        var nextNodeToEdit = 0;
        var nextWeight = 0;
        for(var i = 0; i < inputs.length; i++){
            nextNodeToEdit = 0;
            for(var j = 0; j < this.middleSizes[0]; j++){
                this.nodes[nextNodeToEdit].addToValue(inputs[i] * this.weights[nextWeight]);
                nextWeight++;
                nextNodeToEdit++;
            }
        }
        if(this.middleSizes.length > 1){
            for(var n = 1; n < this.middleSizes.length; n++){
                var remeberedNode = nextNodeToEdit;
                for(var i = 0; i < this.middleSizes[n - 1]; i++){
                    nextNodeToEdit = remeberedNode;
                    for(var j = 0; j < this.middleSizes[n]; j++){
                        this.nodes[nextNodeToEdit].addToValue(this.nodes[nextNodeToEdit - this.middleSizes[n - 1]].calculatedValue * this.weights[nextWeight]);
                        nextNodeToEdit++;
                        nextWeight++;
                    }
                }
            }
        }
        if(this.nodes[this.nodes.length - 1] == 0){
            console.error("Not all nodes have been reached, there is a problem");
        }
        var finalArray = [];
        for(var i = 0; i < outputCount; i++){
            var toPut = 0;
            for(var j = 0; j < this.middleSizes[this.middleSizes.length - 1]; j++){
                //console.log(this.nodes[nextNodeToEdit - this.middleSizes[this.middleSizes.length - 1] + j].calculatedValue);
                toPut += (this.nodes[nextNodeToEdit - this.middleSizes[this.middleSizes.length - 1] + j].calculatedValue * this.weights[nextWeight]);
                nextWeight++;
            }
            finalArray.push(toPut);
        }
        return finalArray;
    }
}

function runThroughGame(net1,net2,drawIt){
    let gameBoard = [];
    for(let i = 0; i < 7; i++){
        gameBoard.push([0,0,0,0,0,0]);
    }
    let turn = true;
    let p1win = false;
    let p2win = false;
    let tie = false;
    let exceptions = [];
    for(let t = 0; t < 50; t++){
        turn = !turn;
        exceptions = findExceptions(gameBoard);
        let slot;
        if(turn){
            slot = findMax(net1.runThrough(oneDimension(gameBoard)),exceptions);
        }
        else{
            slot = findMax(net2.runThrough(flip(oneDimension(gameBoard))),exceptions);
        }
        if(slot == -1){
            console.log("tie");
            tie = true;
            break;
        }
        if(turn){
            gameBoard = addToBoard(gameBoard,slot,1);
            if(checkWin(gameBoard,1)){
                p1win = true;
                break;
            }
        }
        else{
            gameBoard = addToBoard(gameBoard,slot,-1);
            if(checkWin(gameBoard,-1)){
                p2win = true;
                break;
            }
        }
        if(drawIt){
            //printBoard(gameBoard);
        }
    }
    if(drawIt){
        //printBoard(gameBoard);
        renderBoard(gameBoard);
    }
    if(tie){
        return null;
    }
    if(p1win){
        return net1;
    }
    if(p2win){
        return net2;
    }
    return null;
}

function runThroughGameArtificial(net1){
    let gameBoard = [];
    for(let i = 0; i < 7; i++){
        gameBoard.push([0,0,0,0,0,0]);
    }
    let turn = true;
    let p1win = false;
    let p2win = false;
    let tie = false;
    let exceptions = [];
    let goodGen = false;
    for(let t = 0; t < 50; t++){
        turn = !turn;
        exceptions = findExceptions(gameBoard);
        let slot;
        if(turn){
            slot = findMax(net1.runThrough(oneDimension(gameBoard)),exceptions);
        }
        else{
            slot = Math.floor(Math.random() * 7);
        }
        if(slot == -1){
            tie = true;
            break;
        }
        if(turn){
            gameBoard = addToBoard(gameBoard,slot,1);
            if(checkWin(gameBoard,1)){
                p1win = true;
                if(t < 12){
                    goodGen = true;
                }
                break;
            }
        }
        else{
            gameBoard = addToBoard(gameBoard,slot,-1);
            if(checkWin(gameBoard,-1)){
                p2win = true;
                break;
            }
        }
        //printBoard(gameBoard);
    }
    //printBoard(gameBoard);
    if(tie){
        return "tie";
    }
    if(p1win){
        if(goodGen){
            return net1;
        }
        else{
            return "okGen";
        }
    }
    if(p2win){
        return "p2Win";
    }
    return null;
}

function printBoard(board){
    let logger = "";
    for(let r = 0; r < board[0].length; r++){
        for(let c = 0; c < board.length; c++){
            logger += board[c][r] + " ";
        }
        logger += "\n";
    }
    console.log(logger);
}

function checkWin(gameBoard,token){
    //printBoard(gameBoard);
    //console.log("checking  " + token);
    //vertical
    var inArow = 0;
    for(let c = 0; c < gameBoard.length; c++){
        for(let r = 0; r < gameBoard[c].length; r++){
            if(gameBoard[c][r] == token){
                inArow++;
                if(inArow >= 4){
                    return true;
                }
            }
            else{
                inArow = 0;
            }
        }
        inArow = 0;
    }
    //horizontal
    inArow = 0;
    for(let r = 0; r < gameBoard[0].length; r++){
        for(let c = 0; c < gameBoard.length; c++){
            if(gameBoard[c][r] == token){
                inArow++;
                if(inArow >= 4){
                    return true;
                }
            }
            else{
                inArow = 0;
            }
        }
        inArow = 0;
    }
    //diagonal negative slope
    inArow = 0;
    for(let c = -2; c < 4; c++){
        for(let d = 0; d < 6; d++){
            try{
                if(gameBoard[c + d][5 - d] == token){
                    inArow++;
                    if(inArow >= 4){
                        return true;
                    }
                }
                else{
                    inArow = 0;
                }
            }
            catch{
                inArow = 0;
            }
        }
        inArow = 0;
    }
    //diagonal positive slope
    inArow = 0;
    for(let c = 3; c < 9; c++){
        for(let d = 0; d < 6; d++){
            try{
                if(gameBoard[c - d][5 - d] == token){
                    inArow++;
                    if(inArow >= 4){
                        return true;
                    }
                }
                else{
                    inArow = 0;
                }
            }
            catch{
                inArow = 0;
            }
        }
        inArow = 0;
    }
    return false;
}

function findExceptions(board){
    let result = [];
    for(let i = 0; i < board.length; i++){
        if(board[i][0] != 0){
            result.push(i);
        }
    }
    return result;
}

function addToBoard(board, slot, token){
    let arrEdit = board[slot].slice(0);
    for(let i = 0; i < arrEdit.length; i++){
        if(arrEdit[i] != 0 && arrEdit[i - 1] == 0){
            arrEdit[i - 1] = token;
            break;
        }
        else if(i == arrEdit.length - 1 && arrEdit[i] == 0){
            arrEdit[i] = token;
            break;
        }
    }
    board[slot] = arrEdit;
    return board;
}

function oneDimension(twoDimensionalArray){
    let result = [];
    for(let i = 0; i < twoDimensionalArray.length; i++){
        for(let j = 0; j < twoDimensionalArray[i].length; j++){
            result.push(twoDimensionalArray[i][j]);
        }
    }
    return result;
}

function flip(arrToFlip){
    let result = [];
    for(let i = 0; i < arrToFlip.length; i++){
        result.push(-arrToFlip[i]);
    }
    return result;
}

function findMax(outputs,exclusions){
    //console.log("exclusions: " + exclusions);
    var order = [];
    let temput = outputs.slice(0);
    outputs.sort(function(a, b){return b-a});;
    for(let i = 0; i < outputs.length; i++){
        order.push(temput.indexOf(outputs[i]));
    }
    if(outputs[0] == 0){
        return Math.floor(Math.random() * 7);
    }
    for(let i = 0; i < order.length; i++){
        if(!exclusions.includes(order[i])){
            return order[i];
        }
    }
    return -1;
}

function resetBoard(){
    board = [];
    for(let i = 0; i < 7; i++){
        board.push([0,0,0,0,0,0]);
    }
    return board;
}

var train = false;
var gGameBoard = resetBoard();
var gNetwork = new Network([25,25],null);
var gTurn = true;
var gWin = false;

function renderBoard(gameBoard){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let c = 0; c < gameBoard.length; c++){
        for(let r = 0; r < gameBoard[c].length; r++){
            let v = gameBoard[c][r];
            if(v == -1){
                ctx.fillStyle = "yellow";
                ctx.fillRect(c * 50 * scale,r * 50 * scale,50 * scale, 50 * scale);
            }
            else if(v == 1){
                ctx.fillStyle = "red";
                ctx.fillRect(c * 50 * scale,r * 50 * scale,50 * scale, 50 * scale);
            }
        }
    }
    ctx.drawImage(gameBoardImage,0,0,350 * scale,300 * scale);
}


var input = {
    one:false,
    two:false,
    three:false,
    four:false,
    five:false,
    six:false,
    seven:false,
    mouse1:false
}


var generation1 = 1;
var run = setInterval(function () {
    if(train){
        document.getElementById("info2").innerHTML = "Training... Generation " + generation1 + " with a population of " + population + " press E to play";
        document.getElementById("info3").innerHTML = "";
        generation1++;
        var tempNet = [];
        for(let n1 = 0; n1 < nets.length; n1 += 2){
            let result;
            result = runThroughGame(nets[n1],nets[n1 + 1],false);
            if(result != null){
                tempNet.push(result);
            }
        }
        nets = tempNet.slice(0);
        tempNet = [];
        for(let n1 = 0; n1 < nets.length - 1; n1 += 2){
            let result;
            result = runThroughGame(nets[n1],nets[n1 + 1],false);
            if(result != null){
                tempNet.push(result);
            }
        }
        nets = tempNet.slice(0);
        tempNet = [];
        for(let n1 = 0; n1 < nets.length - 1; n1 += 2){
            let result;
            if(n1 == 4){
                result = runThroughGame(nets[n1],nets[n1 + 1],true);
            }
            else{
                result = runThroughGame(nets[n1],nets[n1 + 1],false);
            }
        
            if(result != null){
                tempNet.push(result);
            }
        }
        console.log("Generation "   + ": " + tempNet.length);
        if(tempNet.length > 1){
            nets = tempNet;
            let netsToGo = population - nets.length;
            for(let i = 0; i < netsToGo; i++){
                nets.push(new Network(null,tempNet));
            }
        }
        else{
            console.log(nets[120].weights);
            //break;
        }
    }
    else if(!gWin){
        document.getElementById("info2").innerHTML = "Playing VS you, press E to train";
        renderBoard(gGameBoard);
        let gExceptions = findExceptions(gGameBoard);
        if(gTurn){
            let selectedSpot = -1;
            if(input.one){
                selectedSpot = 1;
            }
            else if(input.two){
                selectedSpot = 2;
            }
            else if(input.three){
                selectedSpot = 3;
            }
            else if(input.four){
                selectedSpot = 4;
            }
            else if(input.five){
                selectedSpot = 5;
            }
            else if(input.six){
                selectedSpot = 6;
            }
            else if(input.seven){
                selectedSpot = 7;
            }
            input.one = false;
            input.two = false;
            input.three = false;
            input.four = false;
            input.five = false;
            input.six = false;
            input.seven = false;
            if(selectedSpot != -1){
                gGameBoard = addToBoard(gGameBoard,selectedSpot - 1,-1);
                if(checkWin(gGameBoard,-1)){
                    gWin = true;
                    document.getElementById("info3").innerHTML = "You win, R to reset";
                    //gGameBoard = resetBoard();
                }
                gTurn = !gTurn;
            }
        }
        else{
            gGameBoard = addToBoard(gGameBoard,findMax(gNetwork.runThrough(oneDimension(gGameBoard)),gExceptions),1);
            if(checkWin(gGameBoard,1)){
                gWin = true;
                document.getElementById("info3").innerHTML = "Ai wins, R to reset";
                //gGameBoard = resetBoard();
            }
            gTurn = !gTurn;
        }
    }
}, 1);


var nets = [];
var population = 420;
for(let n = 0; n < population; n++){
    nets.push(new Network([25,25],null));
}


function normalRun(){
    for (let g = 0; g < 5; g++) {
        var tempNet = [];
        for(let n1 = 0; n1 < nets.length; n1 += 2){
            let result;
            result = runThroughGame(nets[n1],nets[n1 + 1],false);
            if(result != null){
                tempNet.push(result);
            }
        }
        nets = tempNet.slice(0);
        tempNet = [];
        for(let n1 = 0; n1 < nets.length - 1; n1 += 2){
            let result;
            result = runThroughGame(nets[n1],nets[n1 + 1],false);
            if(result != null){
                tempNet.push(result);
            }
        }
        nets = tempNet.slice(0);
        tempNet = [];
        for(let n1 = 0; n1 < nets.length - 1; n1 += 2){
            let result;
            result = runThroughGame(nets[n1],nets[n1 + 1],false);
            if(result != null){
                tempNet.push(result);
            }
        }
        nets = tempNet.slice(0);
        tempNet = [];
        for(let n1 = 0; n1 < nets.length - 1; n1 += 2){
            let result;
            result = runThroughGame(nets[n1],nets[n1 + 1],false);
        
            if(result != null){
                tempNet.push(result);
            }
        }
        console.log("Generation " + g  + ": " + tempNet.length);
        if(tempNet.length > 1){
            nets = tempNet;
            let netsToGo = population - nets.length;
            gNetwork = new Network(null,tempNet);
            for(let i = 0; i < netsToGo; i++){
                nets.push(new Network(null,tempNet));
            }
        }
        else{
            console.log(nets[120].weights);
            break;
        }
    }
}


window.addEventListener('keydown', function (event) {
    switch (event.keyCode) {
        case 69: //e
            train = !train;
            break;
        case 82: //e
            gGameBoard = resetBoard();
            gWin = false;
            break;
    }
}, false);


document.addEventListener('keydown', function(event) {
    switch(event.code){
        case "Digit1":
            input.one = true;
            break;
        case "Digit2":
            input.two = true;
            break;
        case "Digit3":
            input.three = true;
            break;
        case "Digit4":
            input.four = true;
            break;
        case "Digit5":
            input.five = true;
            break;
        case "Digit6":
            input.six = true;
            break;
        case "Digit7":
            input.seven = true;
            break;
    }
});



