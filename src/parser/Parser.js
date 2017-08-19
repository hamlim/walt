import TokenStream from './TokenStream';
import { I32 } from '../emiter/value_type';
import {
  generateExport,
  generateGlobal
} from './generator';
import Syntax from './Syntax';
import Context from './Context'

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

  syntaxError(msg, error) {
    const { line, col } = this.token.start;
    return new SyntaxError(
      `${error || 'Syntax error'} at ${line}:${col}
      ${msg}`
    );
  }

  unexpectedValue(value) {
    return this.syntaxError(
      'Unexpected value',
      `Value   : ${this.token.value}
       Expected: ${Array.isArray(value) ? value.join('|') : value}`
    );
  }

  unexpected(token) {
    return this.syntaxError(
      'Unexpected token',
       `Token   : ${this.token.type}
       Expected: ${token}`
    );
  }

  unknown({ value }) {
    return this.syntaxError('Unknown token', value);
  }

  unsupported() {
    return this.syntaxError('Language feature not supported', this.token.value);
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

  endNode(node, Type) {
    return {
      ...node,
      Type,
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
        return this.endNode(node);
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

    node.declaration = this.declaration(this.startNode());
    if (!node.declaration.init)
      throw this.syntaxError('Exports must have a value');

    this.endNode(node, Syntax.Export);
    this.Program.Exports.push(generateExport(node));

    return node;
  }

  binary(node) {
    return node;
  }

  declaration(node, inFunction) {
    node.const = this.token.value === 'const';
    if (!this.eat(['const', 'let']))
      throw this.unexpectedValue(['const', 'let']);

    node.id = this.token.value
    if (!this.eat(null, Syntax.Identifier))
      throw this.unexpected(Syntax.Identifier);

    if (!this.eat([':']))
      throw this.unexpectedValue(':');

    node.type = this.token.value;
    if (!this.eat(null, Syntax.Type))
      throw this.unexpected(Syntax.Type);

    if (this.eat(['=']))
      node.init = this.expression();

    if (node.const && !node.init)
      throw this.syntaxError('Constant value must be initialized');

    if (!inFunction) {
      node.globalIndex = this.Program.Globals.length;
      this.Program.Globals.push(generateGlobal(node));
    }

    return this.endNode(node, Syntax.Declaration);
  }

  identifier(node) {
  }

  constant(node) {
    node.value = this.token.value;
    this.eat(null, Syntax.Constant);
    return this.endNode(node, Syntax.Constant);
  }

  // Get the ast
  program() {
    // No code, no problem, empty ast equals
    // (module) ; the most basic wasm module
    if (!this.stream || !this.stream.length) {
      return {};
    }

    const node = this.Program = this.startNode();
    this.Program.Exports = [];
    this.Program.Imports = [];
    this.Program.Globals = [];

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

