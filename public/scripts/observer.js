/* Copyright (c) 2016 Paul Nebel */
'use strict'

/**
 * A module that allows objects to automatically run handler functions in response to changes in property values.
 */

var DFObserver = (function (spec) {
  var activeHandler
  var that = {}
  var observableProp = (provider, prop) => {
    var value = provider[prop]
    Object.defineProperty(provider, prop, {
      get () {
          // passively assigns handlers to provider when getting properties
        if (activeHandler) {
          provider._handlers[prop] = activeHandler
        }
        return value
      },
      set (newValue) {
          // runs the handler whenever a value is changed
        value = newValue
        var handler = provider._handlers[prop]
        if (handler) {
          that.observe(handler)
        }
      }
    })
  }

  /** @function observe
   *
   *  @summary Assigns a handler to respond to changes in the provider.  By explicitly calling
   *           the handler function once we are assigning it to all the properties it, in turn,
   *           calls through the get method for those properties.  From this point onwards, every
   *           time the property is assigned a new value the handler will be run implicitly.
   *
   *  @since 1.0.0
   *
   *  @param  {Function}  handler - The handler function to be run on property change.
   *
   *  @returns  {Object} The Observer.
   */
  that.observe = function (handler) {
    activeHandler = handler
    handler()
    activeHandler = undefined
    return that
  }

  /** @function observable
   *
   *  @summary Makes a provider observable by associating handlers with properties and property changes.
   *
   *  @since 1.0.0
   *
   *  @param  {Object}  provider - The object providing the data to be observed.
   *
   *  @returns  {Object} The Observer.
   */
  that.observable = function (provider) {
    for (var prop in provider) {
      observableProp(provider, prop)
      if (typeof provider[prop] === 'object') {
        that.observable(provider[prop])
      }
    }
    provider._handlers = {}
    return provider
  }

  return that
})()
DFObserver
