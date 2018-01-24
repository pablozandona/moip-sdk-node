import auth from './config/auth'
import moip from '../dist/index'
import chai from 'chai'
import orderModel from './schemas/order'
import paymentModel from './schemas/payment'
import shortid from 'shortid'

chai.should()
chai.use(require('chai-json-schema'))

describe('Moip Payments', () => {
  before((done) => {
    orderModel.ownId = shortid.generate()
    orderModel.customer.ownId = shortid.generate()
    done()
  })

  let orderId

  it('Should successfully create an order', (done) => {
    moip.init(auth).then((client) => {
      client.order.create(orderModel)
        .then(({body}) => {
          orderId = body.id
          done()
        })
        .catch(done)
    })
  })

  it('Should successfully create a payment for an order', (done) => {
    moip.init(auth).then((client) => {
      client.payment.create(orderId, paymentModel)
        .then(({body}) => {
          // Verify and add to schema
          body.should.have.property('id')
          body.should.have.property('status')
          body.should.have.property('delayCapture')
          body.should.have.property('amount')
          body.should.have.property('events')
          body.should.have.property('receivers')
          body.should.have.property('_links')
          body.should.have.property('createdAt')
          body.should.have.property('updatedAt')
          paymentModel.id = body.id
          paymentModel.status = body.status
          paymentModel.delayCapture = body.delayCapture
          paymentModel.amount = body.amount
          paymentModel.events = body.events
          paymentModel.receivers = body.receivers
          paymentModel._links = body._links
          paymentModel.createdAt = body.createdAt
          paymentModel.updatedAt = body.updatedAt
          body.should.be.jsonSchema(paymentModel)
          done()
        })
        .catch(done)
    })
  })

  it('Should successfully get a payment', (done) => {
    moip.init(auth).then((client) => {
      client.payment.getOne(paymentModel.id)
        .then(({body}) => {
          body.should.be.jsonSchema(paymentModel)
          done()
        })
        .catch(done)
    })
  })

  it('Should fail to get a payment', (done) => {
    moip.init(auth).then((client) => {
      client.payment.getOne('invalid-id')
        .catch(() => done())
    })
  })
})

describe('Moip Payment Pre-Authorization Capture', () => {
  /*
   Create delay between requests
  */
  beforeEach((done) => {
    setTimeout(done, 500)
  })

  before((done) => {
    orderModel.ownId = shortid.generate()
    orderModel.customer.ownId = shortid.generate()
    done()
  })

  let orderId

  it('Should successfully create an order', (done) => {
    moip.init(auth).then((client) => {
      client.order.create(orderModel)
        .then(({body}) => {
          orderId = body.id
          done()
        })
        .catch(done)
    })
  })

  it('Should create payment with pre authorization', (done) => {
    paymentModel.delayCapture = true
    moip.init(auth).then((client) => {
      client.payment.create(orderId, paymentModel)
        .then(({body}) => {
          body.should.have.property('id')
          body.delayCapture.should.be.eql(true)
          paymentModel.id = body.id
          done()
        })
        .catch(done)
    })
  })

  it('Should capture payment pre authorized', (done) => {
    moip.init(auth).then((client) => {
      client.payment.preAuthorizationCapture(paymentModel.id)
        .then(({body}) => {
          body.status.should.be.eql('AUTHORIZED')
          done()
        })
        .catch(done)
    })
  })
})

describe('Moip Payment Pre-Authorization Cancel', () => {
  /*
       Create delay between requests
   */
  beforeEach((done) => {
    setTimeout(done, 500)
  })

  before((done) => {
    orderModel.ownId = shortid.generate()
    orderModel.customer.ownId = shortid.generate()
    done()
  })

  let orderId

  it('Should successfully create an order', (done) => {
    moip.init(auth).then((client) => {
      client.order.create(orderModel)
        .then(({body}) => {
          orderId = body.id
          done()
        })
        .catch(done)
    })
  })

  it('Should create payment with pre authorization', (done) => {
    paymentModel.delayCapture = true
    moip.init(auth).then((client) => {
      client.payment.create(orderId, paymentModel)
        .then(({body}) => {
          body.should.have.property('id')
          body.delayCapture.should.be.eql(true)
          paymentModel.id = body.id
          done()
        })
        .catch(done)
    })
  })

  it('Should cancel payment pre authorized', (done) => {
    moip.init(auth).then((client) => {
      client.payment.preAuthorizationCancel(paymentModel.id)
        .then(({body}) => {
          body.status.should.be.eql('CANCELLED')
          done()
        })
        .catch(done)
    })
  })
})

describe('Moip Payment Simulate Authorization', () => {
  /*
      Create delay between requests
  */
  beforeEach((done) => {
    setTimeout(done, 500)
  })

  before((done) => {
    orderModel.ownId = shortid.generate()
    orderModel.customer.ownId = shortid.generate()
    done()
  })

  let orderId

  it('Should successfully create an order', (done) => {
    moip.init(auth).then((client) => {
      client.order.create(orderModel)
        .then(({body}) => {
          orderId = body.id
          done()
        })
        .catch(done)
    })
  })

  it('Should create payment', (done) => {
    paymentModel.delayCapture = false
    moip.init(auth).then((client) => {
      client.payment.create(orderId, paymentModel)
        .then(({body}) => {
          body.should.have.property('id')
          paymentModel.id = body.id
          done()
        })
        .catch((err) => done(err))
    })
  })

  it('Should authorize payment in sandbox', (done) => {
    moip.init(auth).then((client) => {
      client.payment._authorize(paymentModel.id, paymentModel.amount.total)
        .then(() => done())
        .catch(done)
    })
  })

  it('Should get an authorized payment in sandbox', (done) => {
    moip.init(auth).then((client) => {
      client.payment.getOne(paymentModel.id)
        .then(({body}) => {
          body.status.should.be.eql('AUTHORIZED')
          done()
        })
        .catch(done)
    })
  })
})
