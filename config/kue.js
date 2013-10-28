module.exports = {
  redis: {
    // host      : 'localhost',
    port      : process.env.NODE_ENV === 'test' ? 6380 : null,
    // pass:     : '...',
    url       : process.env.NODE_ENV === 'production' ? process.env.REDIS_URL : null
  }
}