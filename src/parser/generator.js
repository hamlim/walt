import {
  EXTERN_GLOBAL
} from '../emiter/external_kind';
import {
  I32
} from '../emiter/value_type';
import Syntax from './Syntax';

const getType = str => {
  switch(str) {
    case 'i32': return I32;
    default: return I32;
  }
};

export const generateExport = node => {
  const _export = {};
  if (node.declaration) {
    _export.index = node.declaration.globalIndex;
    _export.kind = EXTERN_GLOBAL;
    _export.field = node.declaration.id;
  }

  return _export;
};

export const generateGlobal = node => {
  const _global = {};
  _global.mutable = node.const ? 0 : 1;
  _global.type = getType(node.type);

  if (node.init.Type === Syntax.Constant)
    _global.init = parseInt(node.init.value);

  return _global;
};

