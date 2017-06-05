const token = require('./../token');
const punctuator = require('./../punctuator');
const constant = require('./../constant');
const binary = require('./../binary');
const unary = require('./../unary');
const Syntax = require('./../Syntax');

const parse = char => {
  if (!punctuator(char) &&
      !constant(char) &&
      !binary(char) &&
      !unary(char)
  )
    return parse;
  return null;
}

module.exports = token(parse, Syntax.Identifier);
