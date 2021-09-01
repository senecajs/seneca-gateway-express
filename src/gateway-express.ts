/* Copyright © 2021 Richard Rodger, MIT License. */

function gateway_express(this: any, options: any) {
  const seneca: any = this
  const gateway = seneca.export('gateway/handler')
  const parseJSON = seneca.export('gateway/parseJSON')


  async function handler(req: any, res: any, next: any) {
    if (req.path.startsWith(options.prefix)) {
      let body = req.body
      let json = 'string' === typeof (body) ? parseJSON(body) : body
      if (json.error$) {
        res.status(400).send(json)
      }
      else {
        let out: any = await gateway(json)
        res.send(out)
      }
    }
    else next()
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
  prefix: '/seneca'
}


export default gateway_express

if ('undefined' !== typeof (module)) {
  module.exports = gateway_express
}
