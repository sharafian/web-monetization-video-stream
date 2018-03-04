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
const FREE_BYTES = 100000

async function run () {
  const receiver = await createReceiver({
    plugin,
    paymentHandler: async params => {
      const amount = params.prepare.amount
      const id = params.prepare.destination.split('.').slice(-3)[0]

      let balance = buckets.get(id) || 0
      balance += Number(amount) * 5000
      buckets.set(id, balance)
      setImmediate(() => balanceEvents.emit(id, balance))
      console.log('got money for bucket. amount=' + amount,
        'id=' + id,
        'balance=' + balance)

      await params.acceptSingleChunk()
    }
  })

  router.get('/pay/:id', async ctx => {
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
        shared_secret: sharedSecret.toString('base64')
      }
    }
  })

  router.get('/video/:vid/:id', async ctx => {
    const id = ctx.params.id
    const readStream = fs.createReadStream('./res/video.webm')
    const transform = new stream.Transform({
      writableObjectMode: true,
      transform (chunk, encoding, cb) {
        if (readStream.bytesRead < FREE_BYTES) {
          console.log('giving free bytes. total=' + readStream.bytesRead)
          cb(null, chunk)
          return
        }

        let balance = buckets.get(id) || 0
        let cost = chunk.length
        console.log('got chunk. chunk=', chunk.length,
          'cost=' + cost,
          'balance=' + balance)

        if (cost > balance) {
          readStream.pause()

          function reopenStream (newBalance) {
            if (newBalance > cost) {
              readStream.resume()
              setImmediate(() => balanceEvents.removeListener(id, reopenStream))
            }
          }

          balanceEvents.on(id, reopenStream)
        }

        balance -= cost
        buckets.set(id, balance)
        cb(null, chunk)
      }
    })

    readStream.on('error', e => console.error(e))
    transform.on('error', e => console.error(e))

    console.log('returing a pipe of video')
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
