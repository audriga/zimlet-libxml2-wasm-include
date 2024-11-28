# zimlet-libxml2-wasm-include

This repository exists to demonstrate an issue encountered when adding `libxml2-wasm` as a dependency in a Zimlet project. The main issue is a runtime error that occurs when importing `libxml2-wasm` in an index.js file.

## Main Issue Description

[libxml2-wasm](https://github.com/jameslan/libxml2-wasm) is a libxml2 wrapper based on WebAssembly. We are using it in several other projects without any issues. However, we are unable to make it work with Zimlet as we encounter the following error message at runtime:

```
TypeError: f()(...)[t] is not a function
```

This error is thrown as soon as a Preact component is initialized, despite the code logging "test" to the console as expected.

## Building libxml2-wasm with Webpack

- `libxml2-wasm` uses some CommonJS files with `.mjs` extension and may depend on some Node.js core modules.
- We are using it without any issues in several other plugins. Webpack builds without any issues when either providing the Node.js core module polyfills or disabling the modules (as shown in this repository).
- The error is also thrown when bundling `libxml2-wasm` with Rollup and using the bundle as a dependency.

## Where the Error is Thrown

The part of the application that is throwing this error is likely in the `cdubsodo/zm-x-web` repository at the following location: [cdubsodo/zm-x-web/src/lib/zimlet-manager/index.js#L257](https://github.com/cdubsodo/zm-x-web/blob/63874c0d011339e73d30395ef06a87fc074f7879/src/lib/zimlet-manager/index.js#L257).

The transpiled code snippet from the bundle appears to look exactly like this:

```javascript
if (!context.handler) throw Error(`No method ${method}()`);
let path = ['handler'].concat(method.split('.'));
method = path.pop();
let ctx = delve(context, path);
return ctx[method](...args);  // Fails because it's unable to find method in context.
```

Replacing "f" with the actual names used in the previous snippet, the error message is then:

```
TypeError: get(context, path)[method] is not a function
```

with `get()` coming from the lodash library and `method` likely being "init". The `cdubsodo/zm-x-web` repository is using [lodash/get](https://github.com/lodash/lodash/blob/4.17.21-es/get.js) for this. `libxml2-wasm` also shares lodash as a transitive dependency, but the versions do not appear to clash at first sight.

## Reproducing in React

I was able to reproduce a similar issue in a simple React application by adding libxml2-wasm as a dependency to a project created via [Create React App.](https://github.com/facebook/create-react-app) . The error is:

```
Uncaught (in promise) TypeError: _libxml2raw_cjs__WEBPACK_IMPORTED_MODULE_0__ is not a function
    mjs libxml2.mts:15
    ...
```

However, the error can be resolved by providing an appropriate configuration for webpack.

See [README of libxml2 React Test Repository](https://github.com/jaudriga/-libxml2-react-test).

## Steps to Reproduce

1. Clone this repository.
2. Install dependencies: `npm install`
3. Build the project: `npm run watch`
4. Observe the runtime error when sideloading the zimlet in zimbra

We are seeking feedback and assistance from the Zimlet maintainers to resolve this issue.