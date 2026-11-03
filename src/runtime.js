import { h, shallowReactive, nextTick, defineComponent, useAttrs, onMounted, onUpdated, onBeforeUnmount } from 'vue';

export const createElement = (tag, props, ...children) => h(tag, props, children.flat(Infinity));
export class DCLogic {
  constructor(props) { this.props = props; this._state = shallowReactive({}); }
  get state() { return this._state; }
  set state(value) { this._state = shallowReactive(value); }
  setState(update, callback) {
    Object.assign(this._state, typeof update === 'function' ? update(this._state) : update);
    if (callback) nextTick(callback);
  }
}

const lookup = (scope, expression) => expression.trim().split('.').reduce((value,key) => value?.[key], scope);
function interpolate(text, scope) {
  const exact = text.match(/^\{\{\s*([\w.]+)\s*\}\}$/);
  if (exact) return lookup(scope, exact[1]);
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_,key) => lookup(scope,key) ?? '');
}
const camel = key => key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
const eventNames = {onclick:'onClick',onchange:'onChange',oninput:'onInput',onkeydown:'onKeydown',onkeyup:'onKeyup',onmousedown:'onMousedown',onmouseup:'onMouseup',onmousemove:'onMousemove',onmouseleave:'onMouseleave',onmouseenter:'onMouseenter',onmouseover:'onMouseover',onmouseout:'onMouseout',onpointerdown:'onPointerdown',onpointermove:'onPointermove',onpointerup:'onPointerup',onpointercancel:'onPointercancel',onscroll:'onScroll',onblur:'onBlur',onfocus:'onFocus',onsubmit:'onSubmit',onwheel:'onWheel'};

export function referenceComponent(name, template, Logic, registry) {
  // Native template elements retain loop/condition markup inside table sections.
  const normalized = template.replace(/<sc-if\b/g,'<template data-sc-if').replace(/<\/sc-if>/g,'</template>').replace(/<sc-for\b/g,'<template data-sc-for').replace(/<\/sc-for>/g,'</template>');
  const parsed = new DOMParser().parseFromString(normalized,'text/html');
  for (const style of parsed.querySelectorAll('style')) {
    const node = document.createElement('style'); node.dataset.component = name;
    node.textContent = style.textContent; document.head.append(node); style.remove();
  }
  const nodes = [...parsed.body.childNodes];
  function renderNode(node, scope) {
    if (node.nodeType === 3) return interpolate(node.textContent,scope) ?? '';
    if (node.nodeType !== 1) return null;
    const tag = node.hasAttribute('data-sc-if') ? 'sc-if' : node.hasAttribute('data-sc-for') ? 'sc-for' : node.tagName.toLowerCase();
    const children = childScope => [...(node.content || node).childNodes].map(child => renderNode(child,childScope));
    if (tag === 'helmet') return null;
    if (tag === 'sc-if') return interpolate(node.getAttribute('value'),scope) ? children(scope) : null;
    if (tag === 'sc-for') {
      const list = interpolate(node.getAttribute('list'),scope) || [];
      return list.map((value,index) => children(Object.assign(Object.create(scope),{[node.getAttribute('as') || 'item']:value, $index:index})));
    }
    const props = {};
    for (const attr of node.attributes) {
      if (attr.name.startsWith('hint-')) continue;
      let key = eventNames[attr.name] || attr.name;
      if (attr.name === 'ondoubleclick') key = 'onDblclick';
      if (tag === 'dc-import') key = camel(key);
      props[key] = interpolate(attr.value,scope);
    }
    if (tag === 'dc-import') {
      const component = registry[props.name]; delete props.name;
      return component ? h(component,props) : null;
    }
    return h(tag,props,children(scope));
  }
  return defineComponent({name,inheritAttrs:false,setup() {
    const attrs = useAttrs(); const model = new Logic(attrs);
    onMounted(()=>model.componentDidMount?.());
    onUpdated(()=>model.componentDidUpdate?.());
    onBeforeUnmount(()=>model.componentWillUnmount?.());
    return () => { const view = model.renderVals(); return nodes.map(node=>renderNode(node,view)); };
  }});
}
