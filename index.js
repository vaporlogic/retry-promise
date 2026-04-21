'use strict';

/**
 * retry-promise v1.0.0
 * Fixed-delay retry only. Exponential backoff added in v1.1.0.
 */

/**
 * Retry a promise-returning function with a fixed delay.
 * @param {function} fn
 * @param {number} [retries=3]
 * @param {number} [delay=500]
 * @returns {Promise<*>}
 */
function retry(fn, retries, delay) {
  retries = typeof retries === 'number' ? retries : 3;
  delay   = typeof delay   === 'number' ? delay   : 500;

  function attempt(n) {
    return Promise.resolve()
      .then(function () { return fn(n); })
      .catch(function (err) {
        if (n > retries) throw err;
        return new Promise(function (resolve) {
          setTimeout(resolve, delay);
        }).then(function () { return attempt(n + 1); });
      });
  }

  return attempt(1);
}

module.exports = { retry };
