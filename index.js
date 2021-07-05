const webserver = require('./web-server.js')
const gameserver = require('./game-server.js')
const ip = '192.168.0.7'
webserver.start(ip, 80)
gameserver.start(ip, 8080)