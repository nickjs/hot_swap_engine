class Component
  virtual: ->
    return {
      type: @constructor.name
    }

exports = Component
