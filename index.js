'use strict';

/**
 * retry-promise v1.1.0
 * Added exponential backoff and jitter. withTimeout added in v1.2.3.
 */

/**
 * Retry with exponential backoff.
 * @param {function} fn
 * @param {object} [options]
 * @returns {Promise<*>}
 */
function retry(fn, options) {
  options = options || {};
  var retries      = typeof options.retries      === 'number' ? options.retries      : 3;
  var initialDelay = typeof options.initialDelay === 'number' ? options.initialDelay : 200;
  var factor       = typeof options.factor       === 'number' ? options.factor       : 2;
  var maxDelay     = typeof options.maxDelay     === 'number' ? options.maxDelay     : 10000;
  var jitter       = typeof options.jitter       === 'number' ? options.jitter       : 0.1;
  var onRetry      = typeof options.onRetry === 'function' ? options.onRetry : null;

  function attempt(n) {
    return Promise.resolve()
      .then(function () { return fn(n); })
      .catch(function (err) {
        if (n > retries) throw err;
        if (onRetry) onRetry(err, n);
        var delay = Math.min(initialDelay * Math.pow(factor, n - 1), maxDelay);
        delay += delay * jitter * Math.random();
        return new Promise(function (resolve) {
          setTimeout(resolve, Math.round(delay));
        }).then(function () { return attempt(n + 1); });
      });
  }

  return attempt(1);
}

function retryFixed(fn, retries, delay) {
  return retry(fn, { retries: retries || 3, initialDelay: delay || 500, factor: 1, jitter: 0 });
}

module.exports = { retry, retryFixed };
