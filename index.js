import AdapterError, { AbortError } from '@ember-data/adapter/error';

class NetworkManagerError extends Error {
  constructor({ url }) {
    super(`failed to fetch ${url}`);
    this.name = 'NetworkManagerError';
  }
}

export const NETWORK_ERROR_MESSAGES = new Set([
  // Chrome & Edge
  'Failed to fetch',
  // Firefox
  'NetworkError when attempting to fetch resource.',
  // Safari
  'cancelled',
  'annulé',
  'Abgebrochen',
  'Load failed',
  'La requête a expiré.',
  'La connexion Internet semble interrompue.',
  'La connexion réseau a été perdue.',
]);

export default class ErrorInfo {
  /** @public */
  static for(error) {
    return new ErrorInfo(error);
  }

  /** @private */
  constructor(error) {
    this.error = error;
  }

  /**
   * Returns the HTTP status code as a number, or `undefined` if this is not
   * an HTTP error.
   * @return {number | undefined}
   */
  get httpStatus() {
    if (this.isHttpError) {
      return this.error.status;
    }
  }

  /**
   * If an HTTP request responds with a non-2xx status code then this property will be `true`.
   * @returns {boolean}
   */
  get isHttpError() {
    return (
      this.error instanceof NetworkManagerError ||
      (this.error instanceof AdapterError && this.error.status > 0)
    );
  }

  /**
   * If an HTTP request responds with a 4xx status code then this property will be `true`.
   * @returns {boolean}
   */
  get isHttpClientError() {
    let { httpStatus } = this;
    return Boolean(httpStatus) && httpStatus >= 400 && httpStatus < 500;
  }

  /**
   * If an HTTP request responds with a 5xx status code then this property will be `true`.
   * @returns {boolean}
   */
  get isHttpServerError() {
    let { httpStatus } = this;
    return Boolean(httpStatus) && httpStatus >= 500 && httpStatus < 600;
  }

  /**
   * If a network request is aborted then this property will be `true`.
   * @returns {boolean}
   */
  get isAbortError() {
    return (
      (this.error instanceof DOMException && this.error.name === 'AbortError') ||
      this.error instanceof AbortError
    );
  }

  /**
   * If a network request fails due to network issues then this property will be `true`.
   * @returns {boolean}
   */
  get isNetworkError() {
    return (
      (this.error instanceof TypeError && NETWORK_ERROR_MESSAGES.has(this.error.message)) ||
      (this.error instanceof DOMException && this.error.name === 'NetworkError')
    );
  }

  /**
   * If an error should be sent to Sentry then this property will be `true`.
   * We return `false` for network issues, request abortions, HTTP server and unauthorized errors
   * @returns {boolean}
   */
  get shouldSendToSentry() {
    return (
      !this.isHttpServerError &&
      !this.isAbortError &&
      !this.isNetworkError &&
      !(this.httpStatus === 401)
    );
  }
}
