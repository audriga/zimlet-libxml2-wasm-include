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

## New Findings

I was able to reproduce the issue with `pdfjs-dist` as well:

Apply the following patch:

```patch
diff --git a/package.json b/package.json
index 6b803cf..1b07989 100644
--- a/package.json
+++ b/package.json
@@ -38,6 +38,7 @@
     "prettier-eslint": "^9.0.1"
   },
   "dependencies": {
-    "libxml2-wasm": "^0.4.1"
+    "libxml2-wasm": "^0.4.1",
+    "pdfjs-dist": "^4.9.124"
   }
 }
diff --git a/src/components/app/index.js b/src/components/app/index.js
index 134b10e..b7ee3be 100644
--- a/src/components/app/index.js
+++ b/src/components/app/index.js
@@ -1,7 +1,8 @@
 import { createElement, Component } from 'preact';
 import { withIntl } from '../../enhancers';
 import style from './style';
-import { XmlDocument } from 'libxml2-wasm';
+//import { XmlDocument } from 'libxml2-wasm';
+await import('pdfjs-dist/build/pdf.worker.min.mjs');
 
 // Can also use shimmed decorators like graphql or withText.
 // Or, utils, like callWtih. Refer to zm-x-web, zimbraManager/shims.js
@@ -13,8 +14,8 @@ export default class App extends Component {
                const testLibxml2 = async () => {
                        try {
                                // Example: Parse a simple XML string
-                               const xmlDoc = XmlDocument.fromString(`<root><child>Test</child></root>`);
-                               const rootNode = xmlDoc.root;
+                               //const xmlDoc = XmlDocument.fromString(`<root><child>Test</child></root>`);
+                               //const rootNode = xmlDoc.root;
                                setResult(rootNode ? rootNode.name : "No root node found");
                        } catch (e) {
                                console.error("Error using libxml2-wasm:", e);
```

1. Run `npm run watch`.
2. See it throw the same error message in Zimbra: `Error: TypeError: f()(...)[t] is not a function`.

Side-note: I verified that the error message is no longer being thrown when commenting out `await import('pdfjs-dist/build/pdf.worker.min.mjs');`.

So in the end, as the two following lines are causing an issue:

```javascript
await import('pdfjs-dist/build/pdf.worker.min.mjs'); // when using pdfjs-dist in index.js
const libxml2 = await moduleLoader(); // inside libxml2-wasm
```

I am quite certain that the issue is that top-level await is not properly supported by Zimlet.

(In addition to that, we had a similar issue in another project that is based on Vite.)