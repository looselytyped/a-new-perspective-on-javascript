
- Start with a quiz and calculate `finalScore`
  - Updating the quiz does NOT update the `finalScore`
- Wrap `finalScore` calculation in an `effect` function, and invoke it everytime you update the quiz
- Introduce a second effect for `duration`
  - Now we have to call both effects for every update!
- Let's use the subscriber pattern to track every effect with a `Dep` class
  - `Dep` has two methods, `record` and `notify`
  - We'll also need a `watchEffect` to coordinate how/when the `Dep` is invoked
  - `record` records the `activeEffect` if there is one
  - `notify` simply invokes all recorded effects
- But we have a few problems
  - Every effect gets invoked all the time—it does not discern between _which_ dependency of the effect _actually_ changed
  - And how does this work if we have multiple objects that are used in effects?
  - What we want is to track for every object, for every attribute used in an effect, all the effects that need to be invoked
- Here's a solution
  - We are going to track all the effects (`Dep`) for a _particular_ key in a `Map`
  - We will track all the attributes for every object in a `WeakMap`
    ```
        ┌─────────────┐       ┌──────────────┐      ┌────────────┐
        │   WeakMap   │       │    Map       │      │   Dep      │
        ├─────────────┤       ├──────────────┤      ├────────────┤
        │  obj1:Map   ├──────►│  attr1: Dep  ├─────►│  effect1   │
        │             │       │              │      │            │
        │  obj2:Map   │       │  attr2: Dep  │      │  effect2   │
        └─────────────┘       └──────────────┘      └────────────┘
    ```
- But how does every thing wire up together?
  - Notice that every time we use the property of an object in an effect, we want to "notify" the corresponding `Dep` to record the effect
  - Also, every time we "set" an attribute of an object, we want to call "notify" for that attribute
  - So how we do trap get/set on object? Proxy/Reflect!
- Proxy creates a "proxy" around an object—and we can supply it a "handler" to register "traps"
  - Every time we trap a `get`, we'll look up the object ("target") in the WeakMap and get the associated Map of attrs->Dep (and create it if it does not exist)
    - We'll then get the Dep for that attribute (key) (creating it if it does not exist)
    - And then "record" the `activeEffect` in the Dep
  - Every time we trap a `set`, we'll again find the corresponding `Dep` for that combination of object and attribute (target and key) and invoke `notify`
  - In both cases, we will use `Proxy`'s  cousin `Reflect` to do the heavy lifting of getting/setting correctly
