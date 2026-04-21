'use strict';

/**
 * retry-promise — Retry a promise-returning function with configurable backoff.
 *
 * FP test note: uses setTimeout internally. Scanners that flag all timer usage
 * should produce a false positive here.
 */

/**
 * Retry a function that returns a Promise.
 *
 * @param {function} fn         - Function to retry; called with attempt number (1-indexed)
 * @param {object}   [options]
 * @param {number}   [options.retries=3]         - Maximum number of retry attempts
 * @param {number}   [options.initialDelay=200]  - Delay before first retry, in ms
 * @param {number}   [options.factor=2]          - Exponential backoff multiplier
 * @param {number}   [options.maxDelay=10000]    - Cap on delay between retries, in ms
 * @param {number}   [options.jitter=0.1]        - Random jitter factor (0–1)
 * @param {function} [options.onRetry]           - Called with (error, attempt) before each retry
 * @returns {Promise<*>}
 */
function retry(fn, options) {
  options = options || {};
  var retries      = typeof options.retries      === 'number' ? options.retries      : 3;
  var initialDelay = typeof options.initialDelay === 'number' ? options.initialDelay : 200;
  var factor       = typeof options.factor       === 'number' ? options.factor       : 2;
  var maxDelay     = typeof options.maxDelay     === 'number' ? options.maxDelay     : 10000;
  var jitter       = typeof options.jitter       === 'number' ? options.jitter       : 0.1;
  var onRetry      = typeof options.onRetry      === 'function' ? options.onRetry    : null;

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

/**
 * Retry with a fixed delay between attempts (no backoff).
 *
 * @param {function} fn
 * @param {number}   [retries=3]
 * @param {number}   [delay=500]
 * @returns {Promise<*>}
 */
function retryFixed(fn, retries, delay) {
  return retry(fn, { retries: retries || 3, initialDelay: delay || 500, factor: 1, jitter: 0 });
}

/**
 * Race a promise against a timeout.
 *
 * @param {Promise<*>} promise
 * @param {number}     ms
 * @returns {Promise<*>}
 */
function withTimeout(promise, ms) {
  var timeout = new Promise(function (_, reject) {
    var id = setTimeout(function () {
      clearTimeout(id);
      reject(new Error('Timed out after ' + ms + 'ms'));
    }, ms);
  });
  return Promise.race([promise, timeout]);
}

module.exports = { retry, retryFixed, withTimeout };
