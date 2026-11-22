
import GatewayExpress from '../src/gateway-express'

import Seneca from 'seneca'


describe('gateway-express', () => {

  test('happy', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use('@seneca/gateway')
      .use(GatewayExpress)
    await seneca.ready()
  })


  test('basic', async () => {
    const seneca = Seneca({ legacy: false })
      .test()

      // use quiet$ directive when available
      .quiet()

      .use('@seneca/gateway')
      .use(GatewayExpress)
      .act('sys:gateway,add:hook,hook:fixed', { action: { y: 99 } })
      .message('foo:1', async function(m: any) {
        return {
          x: m.x,
          y: m.y,
          color: m.gateway.headers.color,
          gateway$: { header: { foo: 'bar' } }
        }
      })

    await seneca.ready()

    let handler = seneca.export('gateway-express/handler')

    let tmp: any = [{}]
    let reqmock = (body: any) => ({
      path: '/seneca',
      body,
      headers: {
        Color: 'red'
      }
    })
    let resmock = {
      status: (code: any) => {
        tmp[0].code = code
        return this
      },
      send: (out: any) => tmp[0].out = out,
      set: (headers: any) => {
        tmp[0].headers = headers
      },
    }
    let nextmock = () => tmp[0].next = true

    await handler(reqmock({ foo: 1, x: 2 }), resmock, nextmock)

    expect(tmp[0].out).toMatchObject({ x: 2, y: 99, color: 'red' })
    expect(tmp[0].headers).toMatchObject({ foo: 'bar' })
    expect(tmp[0].out.gateway$).toBeUndefined()
  })



  test('express-error-next', done => {
    Seneca({
      legacy: false
    })
      .test()
      .quiet()
      .use('@seneca/gateway')
      .use(GatewayExpress, {
        error: {
          next: true
        }
      })

      .message('foo:1', async function(msg: any) {
        return msg
      })

      .ready(async function() {
        try {
          const seneca = this
          const handler = seneca.export('gateway-express/handler')

          const req = make_mock_request({ body: { bad: 2 } })
          const res = {
            status(_code: any) {
              throw new Error('response code should not be sent')
            },

            send(_out: any) {
              console.log(_out)
              throw new Error('response data should not be sent')
            }
          }

          await handler(req, res, (err: any, _req: any, _res: any, _next: any) => {
            expect(err).toMatchObject({
              name: 'Error',
              code: 'act_not_found',
            })

            return done()
          })
        } catch (err) {
          return done(err)
        }
      })
  })


  test('express-error-bypass', done => {
    const responses = []

    Seneca({
      legacy: false
    })
      .test()
      .quiet()
      .use('@seneca/gateway')

      .use(GatewayExpress)

      .message('foo:1', async function(msg: any) {
        return msg
      })

      .ready(async function() {
        try {
          const seneca = this
          const handler = seneca.export('gateway-express/handler')

          const req = make_mock_request({ body: { bad: 2 } })

          const res = {
            status(_code: any) {
              return this
            },

            send(out: any) {
              responses.push(out)
            }
          }


          await handler(req, res, (_err: any, _req: any, _res: any, _next: any) => {
            return done(
              new Error("The Express error handler shouldn't have been called")
            )
          })

          expect(responses.length).toEqual(1)

          expect(responses[0]).toMatchObject({
            code: 'act_not_found',
            name: 'Error'
          })

          return done()
        } catch (err) {
          return done(err)
        }
      })
  })


  test('auth-cookie', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .quiet()
      .use('@seneca/gateway')
      .use(GatewayExpress, {
        auth: {
          token: {
            name: 'tok'
          },
          // Cookie fields pass through to Express, also those that the
          // defaults do not name.
          cookie: {
            domain: 'example.com'
          }
        }
      })
      .message('login:1', async function(_msg: any) {
        return {
          ok: true,
          gateway$: { auth: { token: 'abc', cookie: { path: '/a' } } }
        }
      })
      .message('logout:1', async function(_msg: any) {
        return { ok: true, gateway$: { auth: { remove: true } } }
      })

    await seneca.ready()

    const handler = seneca.export('gateway-express/handler')

    const res0 = make_mock_response()
    await handler(make_mock_request({ body: { login: 1 } }), res0, () => { })
    expect(res0.calls.cookie).toEqual([[
      'tok',
      'abc',
      {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: true,
        domain: 'example.com',
        path: '/a',
      }
    ]])
    expect(res0.calls.clearCookie).toBeUndefined()
    expect(res0.calls.send[0][0]).toMatchObject({ ok: true })

    const res1 = make_mock_response()
    await handler(make_mock_request({ body: { logout: 1 } }), res1, () => { })
    expect(res1.calls.cookie).toBeUndefined()
    expect(res1.calls.clearCookie).toEqual([['tok']])
    expect(res1.calls.send[0][0]).toMatchObject({ ok: true })
  })


  test('modify', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .quiet()
      .use('@seneca/gateway')
      .use(GatewayExpress, {
        modify: {
          req: function(req: any) {
            req.body = { ...req.body, x: 2 }
            return req
          },
          res: function(_req: any, msg: any, result: any) {
            result.out.y = msg.x + 1
            return result
          }
        }
      })
      .message('foo:1', async function(msg: any) {
        return { x: msg.x }
      })

    await seneca.ready()

    const handler = seneca.export('gateway-express/handler')

    const res = make_mock_response()
    await handler(make_mock_request({ body: { foo: 1 } }), res, () => { })
    expect(res.calls.send[0][0]).toMatchObject({ x: 2, y: 3 })
  })


  test('directives', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .quiet()
      .use('@seneca/gateway')
      .use(GatewayExpress)
      .message('a:1', async function(_msg: any) {
        return { ok: true, gateway$: { status: 201 } }
      })
      .message('a:2', async function(_msg: any) {
        return { ok: true, gateway$: { redirect: { location: '/b' } } }
      })
      .message('a:3', async function(_msg: any) {
        return { ok: true, gateway$: { next: true } }
      })
      .message('a:4', async function(_msg: any) {
        return { ok: true, gateway$: { done: true, status: 202 } }
      })

    await seneca.ready()

    const handler = seneca.export('gateway-express/handler')

    const res1 = make_mock_response()
    await handler(make_mock_request({ body: { a: 1 } }), res1, () => { })
    expect(res1.calls.status).toEqual([[201]])
    expect(res1.calls.send[0][0]).toMatchObject({ ok: true })

    const res2 = make_mock_response()
    await handler(make_mock_request({ body: { a: 2 } }), res2, () => { })
    expect(res2.calls.redirect).toEqual([['/b']])
    expect(res2.calls.send).toBeUndefined()

    const res3 = make_mock_response()
    const nexts: any[] = []
    await handler(make_mock_request({ body: { a: 3 } }), res3,
      (err: any) => nexts.push(err))
    expect(nexts).toEqual([undefined])
    expect(res3.calls.send).toBeUndefined()

    // done$ sends the result as it is.
    const res4 = make_mock_response()
    await handler(make_mock_request({ body: { a: 4 } }), res4, () => { })
    expect(res4.calls.status).toBeUndefined()
    expect(res4.calls.send[0][0]).toMatchObject({ ok: true })

    // A JSON string body is parsed; error$ in the request is rejected.
    const res5 = make_mock_response()
    await handler(make_mock_request({ body: '{"a":1,"error$":{}}' }), res5,
      () => { })
    expect(res5.calls.status).toEqual([[400]])
    expect(res5.calls.send[0][0]).toMatchObject({ a: 1, error$: {} })
  })


  test('hook', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .quiet()
      .use('@seneca/gateway')
      .use(GatewayExpress)
      .message('handle:hook', async function(msg: any) {
        return { name: msg.name, code: msg.code, body: msg.body }
      })

    await seneca.ready()

    const hook = seneca.export('gateway-express/hook')

    const res = make_mock_response()
    const req: any = make_mock_request({ body: '{"z":1}' })
    req.params = { name: 'foo', code: 'bar' }
    await hook(req, res, () => { })
    expect(res.calls.send[0][0]).toMatchObject({
      name: 'foo', code: 'bar', body: { z: 1 }
    })
  })


  test('tag', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use('@seneca/gateway')
      .use({ define: GatewayExpress, tag: 'foo' })
    await seneca.ready()
    expect(seneca.list('tag:foo')).toEqual([
      {
        name: 'gateway_express',
        plugin: 'define',
        role: 'seneca',
        // The second plugin definition: @seneca/gateway is the first.
        seq: '1',
        tag: 'foo'
      }
    ])
  })

})



function make_mock_request(args: any) {
  const body = args.body

  return {
    path: '/whatever',
    body
  }
}


function make_mock_response() {
  const calls: Record<string, any[][]> = {}
  const res: any = { calls }
  for (const name of
    ['status', 'send', 'set', 'cookie', 'clearCookie', 'redirect']) {
    res[name] = (...args: any[]) => {
      (calls[name] = calls[name] || []).push(args)
      return res
    }
  }
  return res
}
