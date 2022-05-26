let activeEffect;

/**
 * This class let's us track the effects depend on a particular attribute
 */
class Dep {
  #subscribers = new Set();

  record() {
    if(activeEffect) this.#subscribers.add(activeEffect);
  }

  notify() {
    this.#subscribers.forEach(e => e());
  }
}

/**
 * A helper function since we do this for both get/set in the Proxy
 */
const getDep = (target, key) => {
  let depsMap = targetMap.get(target);
  if(!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if(!dep) {
    dep = new Dep();
    depsMap.set(key, dep);
  }
  return dep;
};

/**
 * This prevents the creation of a "handler" object for every proxy.
 * Just optimizing the code a bit
 */
const handlers = () => {
  return {
    get(target, key, receiver) {
      const dep = getDep(target, key)
      dep.record();
      return Reflect.get(target, key, receiver);
    },
    set(target, key, newValue, receiver) {
      const dep = getDep(target, key)
      const ret = Reflect.set(target, key, newValue, receiver)
      dep.notify();
      return ret;
    }
  }
};

/**
 * This API is the engine of the whole system. It allows for making
 * an object "reactive"
 */
const reactive = target => new Proxy(target, handlers());

// See Notes.md for a clarification of the role of the targetMap
const targetMap = new WeakMap();

// Allows us to register (side) effects
const watchEffect = (effect) => {
  activeEffect = effect;
  effect();
  activeEffect = null;
};

// ---------------------------
const quiz = {
  questions: 10,
  incorrect: 4,
};
let finalScore;
let duration;

const proxiedQuiz = reactive(quiz);
watchEffect(() => {
  console.log('in effect 1');
  finalScore = proxiedQuiz.questions - proxiedQuiz.incorrect;
});
watchEffect(() => {
  console.log('in effect 2');
  duration = proxiedQuiz.questions * 10;
});

console.log(`finalScore: ${finalScore}, duration: ${duration}`);
proxiedQuiz.incorrect = 3;
console.log(`finalScore: ${finalScore}, duration: ${duration}`);

