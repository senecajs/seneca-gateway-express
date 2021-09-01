
const Seneca = require('seneca')
const Express = require('express')


async function run() {

let seneca = Seneca({legacy:false})
    .test()
    .use('promisify')
    .use('gateway')
    .use('..')
    .message('foo:1', async function(m) {
      return {x:m.x,sid:this.id,did:this.did}
    })

  await seneca.ready()
  
  let app = Express()

  app
    .use(Express.json())
    .use(seneca.export('gateway-express/handler'))
    .listen(8080)

  console.log(seneca.id)
}

run()

