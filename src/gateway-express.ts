/* Copyright © 2021-2022 Richard Rodger, MIT License. */

function gateway_express(this: any, options: any) {
  const seneca: any = this
  const tag = seneca.plugin.tag
  const gtag = (null == tag || '-' === tag) ? '' : '$' + tag

  const gateway = seneca.export('gateway' + gtag + '/handler')
  const parseJSON = seneca.export('gateway' + gtag + '/parseJSON')


  seneca.act('sys:gateway,add:hook,hook:delegate', {
    gateway: 'express',
    tag: seneca.plugin.tag,
    action: (_json: any, ctx: any) => {
      ctx.req.seneca$ = this
    }
  })


  async function handler(req: any, res: any, next: any) {
    const body = req.body

    const json = 'string' === typeof body ? parseJSON(body) : body

    if (json.error$) {
      return res.status(400).send(json)
    }

    const out: any = await gateway(json, { req, res })

    if (out?.handler$?.done) {
      return next()
    }

    // TODO: review
    if (out?.handler$?.error && !options.bypass_express_error_handler) {
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
