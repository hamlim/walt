import TokenStream from './TokenStream';
import { I32 } from '../emiter/value_type';
const { identity: I } = require('ramda');
const Syntax = require('./Syntax');
const Context = require('./Context');
const { last } = require('ramda');

const precedence = {
  '=': 99,
  '+': 0,
  '-': 0,
  '*': 1,
  '/': 1
};

class Parser {
  constructor(tokenStream) {
    if (!(tokenStream instanceof TokenStream))
      throw `Parser expects a TokenStream instead received ${tokenStream}`;

    this.stream = tokenStream;
    this.token = this.stream.next();
    this.globalSymbols = {};
    this.localSymbols = {};
  }

  unexpectedValue(value) {
    const { line, col } = this.token.start;
    return new Error(
      `Unexpected value at ${line}:${col}.
         Value   : ${this.token.value}
         Expected: ${value}`
    );
  }

  unexpected(token) {
    const { line, col } = this.token.start;
    return new Error(
      `Unexpected token at ${line}:${col}, ${this.token.value}
         Token   : ${this.token.type}
         Expected: ${token}`
    );
  }

  unknown({ value }) {
    const { line, col } = this.token.start;
    return new Error(`Unexpected token at ${line}:${col} ${value}`);
  }

  unsupported() {
    const { value, line, col } = this.token.start;
    return new Error(`Language feature not supported ${line}:${col} ${value}`);
  }

  expect(type, values) {
    const { type: nextType, value: nextValue, start } = this.stream.peek();
    if (type !== nextType)
      throw this.unexpected(type, start.line, start.col);
    if (values && !values.find(v => v === nextValue))
      throw this.unexpectedValue(nextValue, start.line, start.col);
  }

  next() {
    this.token = this.stream.next();
  }

  eat(value, type) {
    if (value) {
      if (value.includes(this.token.value)) {
        this.next();
        return true;
      }
      return false;
    }

    if (this.token.type === type) {
      this.next();
      return true;
    }

    return false;
  }

  startNode() {
    return { start: this.token.start, range: [this.token.start] };
  }

  endNode(node, type) {
    return {
      ...node,
      type,
      end: this.token.end,
      range: node.range.concat(this.token.end)
    };
  }

  expression(node = this.startNode()) {

    switch(this.token.type) {
      case Syntax.Keyword:
        return this.keyword(node);
      case Syntax.Punctuator:
        return this.punctuator(node);
      case Syntax.Constant:
        return this.constant(node);
      case Syntax.Identifier:
        return this.identifier(node);
      default:
        throw this.unknown(this.current);
    }
  }

  punctuator(node) {
    switch(this.token.value) {
      case ';':
        return null;
      case '=':
      case '+':
      case '*':
      case '-':
      case '/':
      case '%':
        return this.binary(node);
      default:
        throw this.unsupported(this.current);
    }
  }

  keyword(node) {
    switch(this.token.value) {
      case 'let':
      case 'const':
      case 'function':
        return this.declaration(node);
      case 'export':
        return this.export(node);
      default:
        throw this.unsupported(this.current);
    }
  }

  export(node) {
    this.eat(['export']);

    if (this.eat(['const', 'let'])) {
      node.declaration = this.declaration(this.startNode());
      return this.endNode(node, Syntax.Export);
    }

    throw this.unexpected(Syntax.Keyword);
  }

  binary(node) {
    return node;
  }

  declaration(node) {
    node.id = this.token.value
    if (!this.eat(null, Syntax.Identifier))
      throw this.unexpected(Syntax.Identifier);

    if (!this.eat([':']))
      throw this.unexpectedValue(':');

    if (!this.eat(null, Syntax.Type))
      throw this.unexpected(Syntax.Type);

    if (this.eat(['='])) {
      this.expression(node);
      return this.endNode(node, Syntax.Declaration);
    }

    this.unexpectedValue('=');
  }

  identifier(parent, { start, end }) {
    const { value: id } = this.current;
    return { type: Syntax.Identifier, loc: { start, end }, id };
  }

  constant(parent, { start, end }) {
    const { value } = this.current;
    return { type: Syntax.Constant, loc: { start, end }, value };
  }

  // Get the ast
  program() {
    // No code, no problem, empty ast equals
    // (module) ; the most basic wasm module
    if (!this.stream || !this.stream.length) {
      return {};
    }

    const node = this.startNode();
    node.body = [];
    while (this.stream.peek()) {
      const child = this.expression();
      if (child)
        node.body.push(child);
    }

    return node;
  }

  parse() {
    return this.program();
  }
}

module.exports = Parser;

