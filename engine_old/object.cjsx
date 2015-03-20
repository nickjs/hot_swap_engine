objectsNeedingUpdate = []

class RObject
  @state: (key, options) ->
    Object.defineProperty @prototype, key
      get: ->
        return @state[key]

      set: (value) ->
        @state[key] = value
        @update()
        return value

  @component: (key, options) ->
    @_components ||= {}
    @_components[key] = options

  constructor: ->
    @state = {}

  update: ->
    objectsNeedingUpdate.push(this)

exports = RObject
