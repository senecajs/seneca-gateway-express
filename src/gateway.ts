/* Copyright © 2021 Richard Rodger, MIT License. */

function gateway(this: any, options: any) {
  const seneca: any = this
  const root: any = seneca.root
  const tu: any = seneca.export('transport/utils')


  const hooknames = [
    // Functions to modify the custom object in Seneca message meta$ descriptions
    'custom',

    // Functions to modify the fixed arguments to Seneca messages
    'fixed',

    // Functions to modify the seneca request delegate
    'delegate',

    // Functions to modify the action or message
    'action',

    // Functions to modify the result
    'result'
  ]

  const hooks: any = hooknames.reduce((a: any, n) => (a[n] = [], a), {})

  seneca.message('sys:gateway,add:hook', async function add_hook(msg: any) {
    let hook: string = msg.hook
    let action: (...params: any[]) => any = msg.action

    if (null != action) {
      let hookactions = hooks[hook]
      hookactions.push(action)
      return { ok: true, hook, count: hookactions.length }
    }
    else {
      return { ok: false, why: 'no-action' }
    }
  })


  seneca.message('sys:gateway,get:hooks', async function get_hook(msg: any) {
    let hook: string = msg.hook
    let hookactions = hooks[hook]
    return { ok: true, hook, count: hookactions.length, hooks: hookactions }
  })


  // Handle inbound JSON, converting it into a message, and submitting to Seneca.
  async function handler(json: any) {
    const seneca = prepare_seneca(json)
    const msg = tu.internalize_msg(seneca, json)

    return await new Promise(resolve => {
      var out = null
      for (var i = 0; i < hooks.action.length; i++) {
        out = hooks.action[i].call(seneca, msg)
        if (out) {
          return resolve(out)
        }
      }

      seneca.act(msg, function(this: any, err: any, out: any, meta: any) {
        for (var i = 0; i < hooks.result.length; i++) {
          hooks.result[i].call(seneca, out, msg, err, meta)
        }

        if (err && !options.debug) {
          err.stack = null
        }

        var out = tu.externalize_reply(this, err, out, meta)

        // Don't expose internal activity unless debugging
        if (!options.debug) {
          out.meta$ = {
            id: out.meta$.id
          }
        }

        resolve(out)
      })
    })
  }


  function prepare_seneca(json: any) {
    let i, hookaction

    let custom: any = {}
    for (i = 0; i < hooks.custom.length; i++) {
      hookaction = hooks.custom[i]
      if ('object' === typeof (hookaction)) {
        custom = seneca.util.deep(custom, hookaction)
      }
      else {
        hookaction(custom, json)
      }
    }


    let fixed = {}
    for (i = 0; i < hooks.fixed.length; i++) {
      hookaction = hooks.fixed[i]
      if ('object' === typeof (hookaction)) {
        fixed = seneca.util.deep(fixed, hookaction)
      }
      else {
        hookaction(fixed, json)
      }
    }


    const delegate = root.delegate(fixed, { custom: custom })

    for (i = 0; i < hooks.delegate.length; i++) {
      hooks.delegate[i](delegate, json)
    }

    return delegate
  }


  return {
    exports: {
      handler: handler
    }
  }
}


// Default options.
gateway.defaults = {

  // When true, errors will include stack trace.
  debug: false
}


export default gateway

if ('undefined' !== typeof (module)) {
  module.exports = gateway
}
