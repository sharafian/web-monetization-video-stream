const Koa = require('koa')
const app = new Koa()
const router = require('koa-router')()
const parser = require('koa-bodyparser')()
const plugin = require('ilp-plugin')()
const { createReceiver } = require('ilp-protocol-psk2')
const path = require('path')
const root = path.join(__dirname, 'static')
const serve = require('koa-static')(root, {})
const fs = require('fs')
const buckets = new Map()
const stream = require('stream')
const EventEmitter = require('events')
const balanceEvents = new EventEmitter()

async function run () {
  const receiver = await createReceiver({
    plugin,
    paymentHandler: async params => {
      const amount = params.prepare.amount
      const id = params.prepare.destination.split('.').slice(-3)[0]

      let balance = buckets.get(id) || 0
      balance += amount
      buckets.set(id, score)
      setImmediate(() => balanceEvents.emit(id, balance))

      await params.acceptSingleChunk()
    }
  })

  router.get('/pay/:id', () => {
    if (ctx.get('Accept').indexOf('application/spsp+json') !== -1) {
      const { destinationAccount, sharedSecret } =
        receiver.generateAddressAndSecret()

      const segments = destinationAccount.split('.')
      const resultAccount = segments.slice(0, -2).join('.') +
        '.' + ctx.params.id +
        '.' + segments.slice(-2).join('.')

      ctx.set('Content-Type', 'application/spsp+json')
      ctx.body = {
        destination_account: resultAccount,
        shared_secret: details.sharedSecret.toString('base64')
      }
    }
  })

  router.get('/video/:vid/:id', () => {
    const id = ctx.params.id
    const readStream = fs.createReadStream('./res/video.mp4')
    const transform = new stream.Transform({
      writableObjectMode: true,
      transform (chunk, encoding, cb) {
        let balance = buckets.get(id)
        let cost = Math.floor(chunk.length / 1000000)

        if (cost > balance) {
          readStream.pause()

          function reopenStream (balance) {
            if (balance > cost) {
              readStream.unpause()
              setImmediate(() => balanceEvents.removeListener(id, reopenStream))
            }
          }

          balanceEvents.on(id, reopenStream)
        }

        balance -= cost
        cb(null, chunk)
      }
    })

    ctx.body = readStream.pipe(transform)
  })

  app
    .use(parser)
    .use(router.routes())
    .use(router.allowedMethods())
    .use(serve)
    .listen(process.env.PORT || 8080)
}

run()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
