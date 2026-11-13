export function myPromiseAllSettled(iterable) {
  return new Promise((resolve) => {
    const items = [...iterable];
    const results = new Array(items.length);
    let completed = 0;

    if (items.length === 0) {
      resolve([]);
      return;
    }

    function record(index, outcome) {
      results[index] = outcome;
      completed++;

      if (completed === items.length) {
        resolve(results);
      }
    }

    items.forEach((item, index) => {
      Promise.resolve(item).then(
        (value) => {
          record(index, { status: "fulfilled", value });
        },
        (reason) => {
          record(index, { status: "rejected", reason });
        },
      );
    });
  });
}

export function myPromiseRace(iterable) {
  return new Promise((resolve, reject) => {
    for (const item of iterable) {
      Promise.resolve(item).then(resolve, reject);
    }
  });
}

export function myPromiseAny(iterable) {
  return new Promise((resolve, reject) => {
    const items = [...iterable];
    const errors = new Array(items.length);
    let rejected = 0;

    if (items.length === 0) {
      reject(new AggregateError([], "All promises were rejected"));
      return;
    }

    items.forEach((item, index) => {
      Promise.resolve(item).then(resolve, (reason) => {
        errors[index] = reason;
        rejected++;

        if (rejected === items.length) {
          reject(new AggregateError(errors, "All promises were rejected"));
        }
      });
    });
  });
}

export function myCall(context, ...args) {
  return Reflect.apply(this, context, args);
}

export function myApply(context, args) {
  return Reflect.apply(this, context, args == null ? [] : args);
}

export function myBind(context, ...presetArgs) {
  const originalFunction = this;

  if (typeof originalFunction !== "function") {
    throw new TypeError("Receiver must be a function");
  }

  return (...laterArgs) => {
    return Reflect.apply(originalFunction, context, [
      ...presetArgs,
      ...laterArgs,
    ]);
  };
}
