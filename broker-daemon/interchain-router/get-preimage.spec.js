const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getPreimage = rewire(path.resolve(__dirname, 'get-preimage'))

describe('getPreimage', () => {
  let params
  let getRecords
  let Order
  let ordersByHash
  let send
  let fromStorageBound
  let order
  let engines
  let preimage

  beforeEach(() => {
    order = {
      inboundSymbol: 'BTC',
      inboundAmount: '1000000',
      swapHash: 'as09fdjasdf09ja0dsf==',
      outboundSymbol: 'LTC',
      outboundAmount: '10000000',
      takerAddress: 'bolt:9128734923874'
    }

    preimage = 'as9fja9s8fh98qahwef9phs=='

    getRecords = sinon.stub().resolves([ order ])
    fromStorageBound = getPreimage.__get__('fromStorage')

    getPreimage.__set__('getRecords', getRecords)
    getPreimage.__set__('Order', Order)

    ordersByHash = {
      range: sinon.stub()
    }
    params = {
      paymentHash: 'as09fdjasdf09ja0dsf==',
      amount: '1000000',
      symbol: 'BTC',
      timeLock: '10000',
      bestHeight: '9000'
    }
    send = sinon.stub()
    engines = new Map()
    engines.set('LTC', {
      translateSwap: sinon.stub().resolves(preimage)
    })
    engines.set('BTC', {
      currencyConfig: {
        secondsPerBlock: 600
      }
    })
  })

  it('gets the records for the hash', async () => {
    const fakeRange = 'myrange'
    ordersByHash.range.returns(fakeRange)
    await getPreimage({ params, send, ordersByHash, engines })

    expect(ordersByHash.range).to.have.been.calledOnce()
    expect(ordersByHash.range).to.have.been.calledWith({
      gte: params.paymentHash,
      lte: params.paymentHash
    })
    expect(getRecords).to.have.been.calledOnce()
    expect(getRecords).to.have.been.calledWith(ordersByHash)
    expect(getRecords).to.have.been.calledWith(sinon.match.any, fromStorageBound)
    expect(getRecords).to.have.been.calledWith(sinon.match.any, sinon.match.any, fakeRange)
  })

  it('throws if too many orders match the hash', () => {
    getRecords.resolves([ order, order ])

    return expect(getPreimage({ params, send, ordersByHash, engines })).to.eventually.be.rejectedWith('Too many routing entries')
  })

  it('throws if no orders match the hash', () => {
    getRecords.resolves([ ])

    return expect(getPreimage({ params, send, ordersByHash, engines })).to.eventually.be.rejectedWith('No routing entry available')
  })

  it('throws if the amount is not at least as much as on the order', () => {
    params.amount = '10'

    return expect(getPreimage({ params, send, ordersByHash, engines })).to.eventually.be.rejectedWith('Insufficient currency')
  })

  it('throws if the symbol does not match the inbound symbol on the order', () => {
    order.inboundSymbol = 'LTC'

    return expect(getPreimage({ params, send, ordersByHash, engines })).to.eventually.be.rejectedWith('Wrong currency')
  })

  it('throws if the current block height is too high for the time lock', () => {
    params.bestHeight = '10000'

    return expect(getPreimage({ params, send, ordersByHash, engines })).to.eventually.be.rejectedWith('is higher than')
  })

  it('throws if the outbound engine is unavailable', () => {
    order.outboundSymbol = 'XYZ'

    return expect(getPreimage({ params, send, ordersByHash, engines })).to.eventually.be.rejectedWith('No engine')
  })

  it('makes a payment to the outbound engine', async () => {
    await getPreimage(({ params, send, ordersByHash, engines }))

    expect(engines.get('LTC').translateSwap).to.have.been.calledOnce()
    expect(engines.get('LTC').translateSwap).to.have.been.calledWith(order.takerAddress, params.paymentHash, order.outboundAmount, '600000')
  })

  it('returns the preimage to the requesting client', async () => {
    await getPreimage(({ params, send, ordersByHash, engines }))

    expect(send).to.have.been.calledOnce()
    expect(send).to.have.been.calledWith({ paymentPreimage: preimage })
  })
})
