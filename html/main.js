let socket = new WebSocket("ws://192.168.0.7:8080")
const createButton = document.getElementById('createButton')
const joinButton = document.getElementById('joinButton')
const setNameButton = document.getElementById('setNameButton')
const leaveButton = document.getElementById('leaveLobby')
const bottom = document.querySelector('.root .bottom')
const middle = document.querySelector('.root .middle ')
joinButton.style.visibility = 'hidden'  
createButton.style.visibility = 'hidden' 
leaveButton.style.visibility = 'hidden'
bottom.style.visibility = 'hidden'  
middle.style.visibility = 'hidden'  
setNameButton.addEventListener('click', setName)
createButton.addEventListener('click', createLobby)
joinButton.addEventListener('click', joinLobby)
leaveButton.addEventListener('click', leaveLobby)

let myScore
let drawScore
let enemyScore

let token
let playerSign
let myName
let opponentName
function setName() {
  const playerName = document.getElementById('name').value
  if (!playerName) {
    alert('Bad Name')
    return
  }
  myName = playerName
  const data = {
    type: 'setName',
    name: playerName
  }
  socket.send(JSON.stringify(data))
}

function getScore() {
  const data = {
    type: 'getScore'
  }
  socket.send(JSON.stringify(data))
}

function createLobby() {
  const data = {
    type: 'createLobby'
  }
  socket.send(JSON.stringify(data))
}

function joinLobby() {
  const data = {
    type: 'joinLobby',
    token: document.getElementById('token').value
  }
  socket.send(JSON.stringify(data))
}

function restartGame() {
  const data = {
    type: 'restartGame'
  }
  socket.send(JSON.stringify(data))
  
}

function leaveLobby() {
  const data = {
    type: 'leaveLobby'
  }
  socket.send(JSON.stringify(data))

}

function closeLobby() {
  joinButton.style.visibility = 'visible'
  createButton.style.visibility = 'visible'
  setNameButton.style.visibility = 'hidden'
  leaveButton.style.visibility = 'hidden'
  bottom.style.visibility = 'hidden'  
  middle.style.visibility = 'hidden'  
  document.getElementById('token').value = ''
  document.getElementById('name').disabled = false  
}

function playerLeave() {
  bottom.style.visibility = 'hidden'  
  middle.style.visibility = 'hidden' 
}

socket.onmessage = (event) => {
  console.log(event)
  const data = JSON.parse(event.data)
  switch (data.type) {
    case 'setName':
      if(data.status == 'success') {
        joinButton.style.visibility = 'visible'
        createButton.style.visibility = 'visible'
        setNameButton.style.visibility = 'hidden' 
        document.getElementById('name').disabled = true
        document.getElementById('tokenContainer').style.visibility = 'visible'
      }
      break
    case 'createLobby':
      if (data.token) {
        token = data.token
        document.getElementById('token').value = token
        joinButton.style.visibility = 'hidden'  
        createButton.style.visibility = 'hidden'  
        leaveButton.style.visibility = 'visible'
      }
      else {
        alert('Bad Token')
      }
      break
    case 'gameStart':
        playerSign = data.team;
        opponentName = data.opponentName
        startGame()
        getScore()
      break
    case 'win':
      if (data.team == playerSign){
        winGame()
        getScore()
      }
      else {
        loseGame()
        getScore()
      }
      break
    case 'draw':
      drawGame()
      getScore()
      break
    case 'placeMark':
      placeMarkfromServer(data.position, data.team)
      swapTurns()
      setBoardHoverClass()
      break
    case 'score':
      myScore = data.your
      drawScore = data.draws
      enemyScore = data.opponent
      bottomFlush()
      break
    case 'leavePlayer':
      playerLeave()
      break
    case 'leaveLobby':
      closeLobby() 
      break 
    case 'closeLobby':
      closeLobby()
      break
  }
}


const X_CLASS = 'X'
const CIRCLE_CLASS = 'O'
const cellElements = document.querySelectorAll('[data-cell]')
const board = document.getElementById('board')
const winningMessageElement = document.getElementById('winningMessage')
const restartButton = document.getElementById('restartButton')
const winningMessageTextElement = document.querySelector('[data-winning-message-text]')
let circleTurn


restartButton.addEventListener('click', restartGame)

function startGame() {
  circleTurn = false
  cellElements.forEach(cell => {
    cell.classList.remove(X_CLASS)
    cell.classList.remove(CIRCLE_CLASS)
    cell.removeEventListener('click', clientHandleClick)
    cell.addEventListener('click', clientHandleClick)
  })
  document.getElementById('myName').innerText = myName
  document.getElementById('opponentName').innerText = opponentName
  bottom.style.visibility = 'visible'
  middle.style.visibility = 'visible'
  setBoardHoverClass()
  winningMessageElement.classList.remove('show')
}

function handleClick(e) {
  const cell = e.target
  const currentClass = circleTurn ? CIRCLE_CLASS : X_CLASS
  placeMark(cell, currentClass)
  if (checkWin(currentClass)) {
    endGame(false)
  } else if (isDraw()) {
    endGame(true)
  } else { 
    swapTurns()
    setBoardHoverClass()
  }
}


function clientHandleClick(e){
  const cell = e.target
  const position = Array.prototype.indexOf.call(cellElements, cell)


  const data = {
    type: 'placeMark',
    position: position
  }
  socket.send(JSON.stringify(data))
}


function winGame() {
  winningMessageTextElement.innerText = 'You Won!'
  winningMessageElement.classList.add('show')
}

function loseGame() {
  winningMessageTextElement.innerText = 'You lose!'
  winningMessageElement.classList.add('show')
}

function drawGame() {
  winningMessageTextElement.innerText = 'Draw!'
  winningMessageElement.classList.add('show')
}

function placeMarkfromServer(position, team) {
  cellElements[position].classList.add(team)
}

function swapTurns() {
  circleTurn = !circleTurn
}

function setBoardHoverClass() {
  board.classList.remove(X_CLASS)
  board.classList.remove(CIRCLE_CLASS)
  if (circleTurn) {
    board.classList.add(CIRCLE_CLASS)
  } else {
    board.classList.add(X_CLASS)
  }
}

function bottomFlush() {
  document.querySelector('.myScore span').innerText = myScore
  document.querySelector('.drawsScore span').innerText = drawScore
  document.querySelector('.EnemyScore span').innerText = enemyScore
}

