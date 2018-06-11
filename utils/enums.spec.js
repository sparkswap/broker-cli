const { expect } = require('test/test-helper')

const {
  TIME_IN_FORCE,
  ORDER_TYPES,
  STATUS_CODES,
  MAX_CHANNEL_BALANCE
} = require('./enums')

describe('Validations', () => {
  it('defines TIME_IN_FORCE', () => {
    expect(TIME_IN_FORCE).to.not.be.null()
    expect(TIME_IN_FORCE).to.not.be.undefined()
  })

  it('defines ORDER_TYPES', () => {
    expect(ORDER_TYPES).to.not.be.null()
    expect(ORDER_TYPES).to.not.be.undefined()
  })

  it('defines STATUS_CODES', () => {
    expect(STATUS_CODES).to.not.be.null()
    expect(STATUS_CODES).to.not.be.undefined()
  })

  it('defines MAX_CHANNEL_BALANCE', () => {
    expect(MAX_CHANNEL_BALANCE).to.not.be.null()
    expect(MAX_CHANNEL_BALANCE).to.not.be.undefined()
  })
})
