const { identity: I } = require('ramda');
const TokenStream = require('./../TokenStream');
const Syntax = require('./../Syntax');
const Node = require('./../Node');
const Context = require('./../Context');
const { last } = require('ramda');

class Parser {
  constructor(tokenStream) {
    if (!(tokenStream instanceof TokenStream))
      throw `Parser expects a TokenStream instead received ${tokenStream}`;

    this.stream = tokenStream;
    this.scope = null;
    this.lookahead = this.stream.next();
  }

  unexpectedValue(value, line, col) {
    return new Error(`Unexpected value at ${line}:${col}.
                      Expected ${value}`);
  }

  unexpectedToken(token, type, { line, col }) {
    return new Error(`Unexpected token at ${line}:${col} ${token}.
                      Expected ${type}`);
  }

  unknownToken({ value, start: { line, col } }) {
    return new Error(`Unexpected token at ${line}:${col} ${value}`);
  }

  unsupported({ value, start: { line, col } }) {
    return new Error(`Language feature not supported ${line}:${col} ${value}`);
  }

  pushScope(scope) {
    if (this.scope)
      scope.previous = this.scope;
    this.scope = scope;
  }

  popScope() {
    if (this.scope && this.scope.previous)
      this.scope = this.scope.previous;
  }

  mark() {
    const { start, end } = this.lookahead;
    return {
      start,
      end
    };
  }

  /**
   * TODO: combine this and assignment
   * @throws
   */
  parseBinary() {
    const operator = Object.assign({}, this.lookahead);
    this.match();

    const left = this.scope.body.pop();
    const right = this.expr();

    return {
      id: Syntax.BinaryExpression,
      operator,
      left,
      right
    };
  }

  parseDecl() {
    const scope = { body: [] };
    this.pushScope(scope);

    const id = Object.assign({}, this.lookahead);
    this.match(Syntax.Identifier);

    this.match(Syntax.BinaryOperator);

    const typeOf = Object.assign({}, this.lookahead);
    this.match(Syntax.Type);

    this.popScope();

    return {
      id,
      type: Syntax.Declaration,
      typeOf
    };
  }

  parseProgram() {
    const body = [];
    const node = { body, context: new Context() };

    this.pushScope(node);

    while (this.stream.peek()) {
      const child = this.expr();
      if (child)
        body.push(child);
    }

    return {
      type: Syntax.Program,
      body
    };
  }

  expr() {
    const { type, value } = this.lookahead;

    switch(type) {
      case Syntax.BinaryOperator:
        return this.parseBinary();
      case Syntax.Keyword:
        switch (value) {
          case 'let':
          case 'const':
            this.match();
            return this.parseDecl();
        }
      case Syntax.Identifier:
      case Syntax.Constant:
        this.match();
        return { type, value };
      default:
        throw new Error(`Unsupported syntax ${value}`);
    }
  }

  term() {
    const { type, value } = this.lookahead;
    switch(type) {
      case Syntax.Constant:
      case Syntax.Identifier:
        this.match();
        return { type, value };
    }
  }

  match(type) {
    if (!type)
      this.lookahead = this.stream.next();
    else if (type === this.lookahead.type)
      this.lookahead = this.stream.next();
    else
      throw this.unexpectedToken(this.lookahead.value, type, this.mark());
  }

  parse() {
    return this.parseProgram();
  }
}

module.exports = Parser;

