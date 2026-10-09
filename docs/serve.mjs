import {createServer} from 'node:http'
import {createReadStream} from 'node:fs'
import {stat} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT) || 8080

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

const server = createServer(async (req, res) => {
  const {pathname} = new URL(req.url, 'http://localhost')
  let filePath = path.join(root, path.normalize(decodeURIComponent(pathname)))

  // Keep requests inside the docs folder.
  if (!filePath.startsWith(root + path.sep) && filePath !== root) {
    res.writeHead(403).end('Forbidden')
    return
  }

  try {
    const info = await stat(filePath)
    if (info.isDirectory()) filePath = path.join(filePath, 'index.html')
    await stat(filePath)
  } catch {
    res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'}).end('Not found')
    return
  }

  res.writeHead(200, {'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream'})
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  createReadStream(filePath).pipe(res)
})

server.listen(port, () => {
  console.log(`Serving docs/ at http://localhost:${port}/`)
})
