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
const PRICE_PER_SECOND = 10
const MAX_PRICE_BUFFER_SECONDS = 5

async function run () {
  const receiver = await createReceiver({
    plugin,
    paymentHandler: async params => {
      const amount = params.prepare.amount
      const id = params.prepare.destination.split('.').slice(-3)[0]

      let expiry = Math.max(buckets.get(id) || Date.now())
      expiry = Math.min(
        Math.max(
          expiry + Math.floor(1000 * (Number(amount) / PRICE_PER_SECOND)),
          Date.now()),
        Date.now() + MAX_PRICE_BUFFER_SECONDS * 1000)

      buckets.set(id, expiry)

      setImmediate(() => balanceEvents.emit(id, expiry))
      console.log('got money for bucket. amount=' + amount,
        'id=' + id,
        'expiry=' + expiry)

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
    const readStream = fs.createReadStream('./res/video.mp4')
    const transform = new stream.Transform({
      writableObjectMode: true,
      transform (chunk, encoding, cb) {
        let expiry = buckets.get(id) || 0
        let now = Date.now()
        console.log('got chunk. chunk=', chunk.length,
          'now=' + now,
          'expiry=' + expiry,
          'diff=', expiry - now)

        if (expiry < now) {
          readStream.pause()
          balanceEvents.once(id, () => readStream.resume())
        }

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
