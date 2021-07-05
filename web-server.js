const { createServer } = require('http')

const server = createServer()

server.on('request', (req, res) => {
	switch (req.url) {
		case '/':
			const html = readFileSync('html/index.html', 'utf8')
			res.writeHead(200, { 'Content-Type': 'text/html' })
			res.end(html)
			break
		case '/main.js':
			const js = readFileSync('html/main.js', 'utf8')
			res.writeHead(200, { 'Content-Type': 'text/javascript' })
			res.end(js)
			break
		case '/styles.css':
			const css = readFileSync('html/styles.css', 'utf8')
			res.writeHead(200, { 'Content-Type': 'text/css' })
			res.end(css)
			break
		case '/vs.png':
			const img = readFileSync('html/vs.png')
			res.writeHead(200, { 'Content-Type': 'image/png' })
			res.end(img)
			break
		default:
			res.writeHead(404, { 'Content-Type': 'text/plain' })
			res.end('404 Not found')
			break
	}
})

module.exports = {
	start: (ip, port) => {
		server.listen(port, ip, () => console.log(`WebServer listen destination: ${ip}:${port}`))
	}
}