
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
        //return {
        //  send: (out: any) => tmp[0].out = out
        //}
      },
      send: (out: any) => tmp[0].out = out
    }
    let nextmock = () => tmp[0].next = true

    await handler(reqmock({ foo: 1, x: 2 }), resmock, nextmock)

    expect(tmp[0].out).toMatchObject({ x: 2, y: 99 })

    tmp[0] = {}
    // use quiet$ directive when available
    await handler(reqmock({ bad: 1 }), resmock, nextmock)

    // console.log(tmp)
    expect(tmp[0].out).toMatchObject({
      'seneca$': true,
      'code$': 'act_not_found',
      'error$': true,
    })

  })

})

