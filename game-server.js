const WebSocket = require('ws')
const teams = ['X', 'O']

const lobbies = new Set()

const WINNING_COMBINATIONS = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[2, 4, 6]
]

class Player {
	constructor(ws) {
		this.ws = ws
		this.team = ''
		this.name = ''
	}
	error = (msg) => {
		const json = JSON.stringify({ type: 'error', message: msg })
		console.log(`Send ERROR to ${this.name} - ${json}`)
		this.ws.send(json)
	}
	send = (data) => {
		const json = JSON.stringify(data)
		console.log(`Send to ${this.name} - ${json}`)
		this.ws.send(json)
	}
}

class Lobby {
	constructor() {
		this.token = Math.random().toString(36).slice(-8).toUpperCase()
		this.draws = 0
		this.winsOne = 0
		this.winsTwo = 0
	}

	start() {
		console.log(`Lobby with token '${this.token}' is started`)
		this.table = ['', '', '', '', '', '', '', '', '']
		this.turn = 'X'
		let randTeam = Math.floor(Math.random() * 100) % 2
		this.playerOne.team = teams[randTeam]
		this.playerOne.send({ type: 'gameStart', token: this.token, team: this.playerOne.team, opponentName: this.playerTwo.name })
		this.playerTwo.team = teams[1 - randTeam]
		this.playerTwo.send({ type: 'gameStart', token: this.token, team: this.playerTwo.team, opponentName: this.playerOne.name })
	}
	checkWin(team) {
		return WINNING_COMBINATIONS.some(combination => {
			return combination.every(index => {
				return this.table[index] == team
			})
		})
	}
	checkDraw() {
		return this.table.every(e => e != '')
	}
	swapTurns() {
		if (this.turn == 'X') this.turn = 'O'
		else this.turn = 'X'
	}
	win(team) {
		if (this.playerOne.team == team) this.winsOne++
		if (this.playerTwo.team == team) this.winsTwo++
		this.broadcast({ type: 'win', team: team })
	}
	draw() {
		this.draws++
		this.broadcast({ type: 'draw' })
	}
	restart() {
		this.start()
	}
	placeMark(player, position) {
		if (position > 8 || position < 0) return player.error('wrong position')
		if (this.table[position] != '') return player.error('position is already marked')

		const team = player.team
		this.table[position] = team
		this.broadcast({ type: 'placeMark', team: team, position: position })
		if (this.checkWin(team)) {
			this.win(team)
		} else if (this.checkDraw()) {
			this.draw()
		} else {
			this.swapTurns()
		}
	}
	sendScore(player) {
		let score
		if (this.playerOne == player)
			score = { type: 'score', your: this.winsOne, draws: this.draws, opponent: this.winsTwo }
		else score = { type: 'score', your: this.winsTwo, draws: this.draws, opponent: this.winsOne }

		player.send(score)
	}
	leave(player) {
		if (player == this.playerOne) {
			if (this.playerTwo) this.playerTwo.send({ type: 'leavePlayer' })
			this.close()
		} else if (player == this.playerTwo) {
			this.playerOne.send({ type: 'leavePlayer', opponentName: this.playerTwo.name })
			player.send({ type: "leaveLobby", token: this.token })
			delete this.playerTwo.lobby
			delete this.playerTwo
					this.draws = 0
		this.winsOne = 0
		this.winsTwo = 0
		}
	}
	close() {
		if (this.playerOne) delete this.playerOne.lobby
		if (this.playerTwo) delete this.playerTwo.lobby
		this.broadcast({ type: 'closeLobby', status: 'success' })

		lobbies.delete(this)
		console.log(`Lobby with token '${this.token}' is closed`)
	}
	broadcast(msg) {
		if (this.playerOne) this.playerOne.send(msg)
		if (this.playerTwo) this.playerTwo.send(msg)
	}
}

function createLobby(player, msg) {
	if (!player.name) return player.error('you must enter nickname')
	if (player.lobby) return player.error('you already in lobby')

	const lobby = new Lobby()
	lobby.playerOne = player

	player.lobby = lobby
	player.send({ type: 'createLobby', token: lobby.token })
	lobbies.add(lobby)
}

function joinLobby(player, msg) {
	const token = msg.token
	for (let lobby of lobbies) {
		if (lobby.token == token) {
			if (lobby.playerOne == player) return player.error('u cant play with yourself')
			lobby.playerTwo = player
			player.lobby = lobby
			lobby.start()
			return
		}
	}
	player.error('lobby not found')
}

function placeMark(player, msg) {
	const lobby = player.lobby
	if (lobby.turn != player.team) return player.error('not your turn')
	lobby.placeMark(player, msg.position)
}

function setName(player, msg) {
	if (!msg.name) {
		player.error('empty name')
		return
	}
	if (player.name) {
		player.error('name already setted')
		return
	}
	player.name = msg.name
	player.send({ type: 'setName', status: 'success' })
}

function restartGame(player, msg) {
	player.lobby.restart()
}

function getScore(player, msg) {
	player.lobby.sendScore(player)
}

function leaveLobby(player, msg) {
	const lobby = player.lobby
	if (!lobby) return player.error('you currently not in lobby')

	lobby.leave(player)
}


module.exports = {
	start: (ip, port) => {
		const wss = new WebSocket.Server({ port: port })
		console.log(`GameServer listen destination: 0.0.0.0:${port}`)
		wss.on('connection', ws => {
			const player = new Player(ws)
			ws.on('message', data => {
				console.log(`Recieve from ${player.name} - ${data}`)
				try {
					const msg = JSON.parse(data)
					switch (msg.type) {
						case 'setName':
							setName(player, msg)
							break
						case 'createLobby':
							createLobby(player, msg)
							break
						case 'joinLobby':
							joinLobby(player, msg)
							break
						case 'placeMark':
							placeMark(player, msg)
							break
						case 'restartGame':
							restartGame(player, msg)
							break
						case 'getScore':
							getScore(player, msg)
							break
						case 'leaveLobby':
							leaveLobby(player, msg)
							break
						default:
							return console.error(`unknown command: ${msg.type}`)
					}
				}
				catch (e) {
					if (e instanceof SyntaxError) return player.error('json parse')
					console.error(e)
				}
			})
			ws.on('close', () => {
				if(player.lobby) player.lobby.leave(player)
			})
		})
	}
}
