/* Copyright © 2021 Richard Rodger, MIT License. */

function gateway_express(this: any, options: any) {
  const seneca: any = this
  const gateway = seneca.export('gateway/handler')
  const parseJSON = seneca.export('gateway/parseJSON')


  seneca.act('sys:gateway,add:hook,hook:delegate', {
    action: (delegate: any, _json: any, ctx: any) => {
      ctx.req.seneca$ = delegate
    }
  })


  async function handler(req: any, res: any, next: any) {
    const body = req.body
    const json = 'string' === typeof body ? parseJSON(body) : body

    if (json.error$) {
      return res.status(400).send(json)
    }

    try {
      const out: any = await gateway(json, { req, res })

      if (out?.done$) {
        return next()
      }

      if (out?.error$ && !options.bypass_express_error_handler) {
        // NOTE: Here we are passing the object with information about
        // the error to the Express' error handler, which allows users
        // to handle errors in their application.
        //
        // This is useful, for example, when you want to return an HTTP
        // 404 for the 'act_not_found' error; - or handle any other error
        // that you defined and threw inside a Seneca instance.
        //
        return next(out)
      }

      return res.send(out)
    } catch (err) {
      // NOTE: Since the `gateway` function should not normally throw, and
      // all errors coming from the underlying Seneca instance should have
      // been handled by it already, - we assume that if something does throw,
      // then it's nothing that can be adequately handled. Hence, we do not
      // pass this error to the Express handler, and we let it crash instead.
      //
      throw err
    }
  }


  return {
    name: 'gateway-express',
    exports: {
      handler
    }
  }
}


// Default options.
gateway_express.defaults = {
}


export default gateway_express

if ('undefined' !== typeof (module)) {
  module.exports = gateway_express
}
