
import GatewayExpress from '../src/gateway-express'

const Seneca = require('seneca')



describe('gateway-express', () => {

  test('happy', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use('gateway')
      .use(GatewayExpress)
    await seneca.ready()
  })

  test('basic', async () => {
    const seneca = Seneca({ legacy: false })
      .test()

      // use quiet$ directive when available
      .quiet()

      .use('promisify')
      .use('gateway')
      .use(GatewayExpress)
      .act('sys:gateway,add:hook,hook:fixed', { action: { y: 99 } })
      .message('foo:1', async function(m: any) {
        return { x: m.x, y: m.y }
      })

    await seneca.ready()

    let handler = seneca.export('gateway-express/handler')

    let tmp: any = [{}]
    let reqmock = (body: any) => ({
      path: '/seneca',
      body
    })
    let resmock = {
      status: (code: any) => {
        tmp[0].code = code
        return this
      },
      send: (out: any) => tmp[0].out = out
    }
    let nextmock = () => tmp[0].next = true

    await handler(reqmock({ foo: 1, x: 2 }), resmock, nextmock)

    expect(tmp[0].out).toMatchObject({ x: 2, y: 99 })
  })

})

describe('gateway-express error handling', () => {
  const make_mock_request = (args) => {
    const body = args.body

    return {
      path: '/whatever',
      body
    }
  }

  const make_mock_response = () => {
    return {
      status(_code) {
        throw new Error('response code should not be sent')
      },

      send(_out) {
        throw new Error('response data should not be sent')
      }
    }
  }

  test('runs the Express error handler', done => {
    Seneca({
      legacy: false
    })
      .quiet()
      .use('promisify')
      .use('gateway')
      .use(GatewayExpress)

      .test()

      .message('foo:1', async function (msg: any) {
        return msg
      })

      .ready(async function () {
        try {
          const seneca = this
          const handler = seneca.export('gateway-express/handler')

          const req = make_mock_request({ body: { bad: 2 } })
          const res = make_mock_response()

          await handler(req, res, (err, _req, _res, _next) => {
            expect(err).toMatchObject({
              error$: true,
              seneca$: true,
              code$: 'act_not_found'
            })

            return done()
          })
        } catch (err) {
          return done(err)
        }
      })
  })
})

