import { u8, f32, f64 } from 'wasm-types';
import { I32, F64, F32, getTypeString } from '../value_type';
import { varuint32 } from '../numbers';
import { emitString } from '../string';
import opcode from '../opcode';
import OutputStream from '../../utils/output-stream';

const encode = (payload, { type, init, mutable }) => {
  payload.push(u8, type, getTypeString(type));
  payload.push(u8, mutable, 'mutable');
  if (!Array.isArray(init)) {
    // Encode the constant
    switch(type) {
      case I32:
        payload.push(u8, opcode.i32Const.code, opcode.i32Const.text);
        payload.push(varuint32, init, `value (${init})`);
        break;
      case F32:
        payload.push(u8, opcode.f32Const.code, opcode.f32Const.text);
        payload.push(f32, init, `value (${init})`);
        break;
      case F64:
        payload.push(u8, opcode.f64Const.code, opcode.f64Const.text);
        payload.push(f64, init, `value (${init})`);
        break;
    }
  } else {
    // Encode a list of opcodes
    init.forEach(({ kind, params }) => {
      payload.push(u8, kind.code, kind.text);
      params.forEach(p => payload.push(varuint32, p, `value (${p})`));
    });
  }
  payload.push(u8, opcode.End.code, 'end');
};

const emit = (globals) => {
  const payload = new OutputStream();
  payload.push(varuint32, globals.length, 'count');

  globals.forEach(g => encode(payload, g));

  return payload;
};

export default emit;


