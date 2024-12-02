import { createElement, Component } from 'preact';
import { withIntl } from '../../enhancers';
import style from './style';
import { XmlDocument } from 'libxml2-wasm';

// Can also use shimmed decorators like graphql or withText.
// Or, utils, like callWtih. Refer to zm-x-web, zimbraManager/shims.js
// More shims can be added here if necessary; also requires an update to zimlet-cli

@withIntl()
export default class App extends Component {
	render() {
		const testLibxml2 = async () => {
			try {
				// Example: Parse a simple XML string
				const xmlDoc = XmlDocument.fromString(`<root><child>Test</child></root>`);
				const rootNode = xmlDoc.root;
				setResult(rootNode ? rootNode.name : "No root node found");
			} catch (e) {
				console.error("Error using libxml2-wasm:", e);
				setError(e.message || "Unknown error");
			}
		};

		testLibxml2();
		return (
			<div class={style.wrapper}>
				<div class={style.main}>Hello World</div>
			</div>
		);
	}
}
