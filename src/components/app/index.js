import { createElement, Component } from 'preact';
import { withIntl } from '../../enhancers';
import style from './style';
import { XmlDocument } from 'libxml2-wasm';

// Can also use shimmed decorators like graphql or withText.
// Or, utils, like callWtih. Refer to zm-x-web, zimbraManager/shims.js
// More shims can be added here if necessary; also requires an update to zimlet-cli

console.log("test"); // This is being logged
const doc1 = XmlDocument.fromString('<note><to>Tove</to></note>');
doc1.dispose();
console.log(doc1); // This is also being logged

@withIntl()
export default class App extends Component {
	render() {
		return (
			<div class={style.wrapper}>
				<div class={style.main}>Hello World</div>
			</div>
		);
	}
}
