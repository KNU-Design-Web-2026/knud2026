import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const routePath = fileURLToPath(new URL("./page.tsx", import.meta.url));
const componentPath = fileURLToPath(new URL("../../components/message/message-page.tsx", import.meta.url));
const dataPath = fileURLToPath(new URL("../../data/messages.ts", import.meta.url));
const stylesPath = fileURLToPath(new URL("../../styles/globals.css", import.meta.url));

assert.equal(existsSync(routePath), true, "message route should exist");
assert.equal(existsSync(componentPath), true, "message page component should exist");
assert.equal(existsSync(dataPath), true, "message data should exist");
assert.equal(existsSync(stylesPath), true, "global styles should exist");

const route = readFileSync(routePath, "utf8");
const component = readFileSync(componentPath, "utf8");
const data = readFileSync(dataPath, "utf8");
const styles = readFileSync(stylesPath, "utf8");

assert.match(route, /MessagePage/);
assert.match(component, /message-page/);
assert.match(component, /messageList\.map/);
assert.match(component, /To\./);
assert.match(component, /From\./);
assert.match(component, /message-frame-tab-mobile/);
assert.match(component, /message-frame-mobile/);
assert.doesNotMatch(component, /message-page__frame-backdrop/);
assert.match(data, /철수야 졸업 축하해/);
assert.match(styles, /\.message-page/);
assert.match(styles, /\.message-card/);
assert.match(styles, /\.message-card:nth-child\(3n \+ 2\)/);
assert.match(styles, /\.message-page__intro\s*\{[\s\S]*overflow:\s*visible/);
assert.match(styles, /--message-form-width/);
assert.match(styles, /clamp\(2rem, 3\.4375vw, 4\.125rem\)/);
assert.match(styles, /\.message-form__field\s*\{[\s\S]*inset:\s*0/);
assert.match(styles, /\.message-card__body\s*\{[\s\S]*white-space:\s*normal/);
assert.match(styles, /max-width: 1350px/);
assert.match(styles, /max-width: 1020px/);
assert.match(styles, /max-width: 600px/);
assert.match(styles, /max-width: 400px/);

console.log("message page structure checks passed");
