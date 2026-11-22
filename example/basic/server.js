

const Express = require('express')
const Seneca = require('seneca')


run()

async function run() {
  let seneca = await runSeneca()
  let app = await runExpress(seneca)
}


async function runSeneca() {
  const seneca = Seneca({legacy:false})

  return seneca
    .test('print')    // Test mode, full debug logs
    .use('@seneca/gateway')
    .use('../..')  // 'gateway-express'
    .use('./bizlogic')
    .ready()
}


async function runExpress(seneca) {
  const app = Express()

  app
    .use(Express.json({type(req) { return true }}))
    .post('/api', seneca.export('gateway-express/handler'))
    .listen(8080)

  return app
}





