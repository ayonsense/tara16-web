const MEM_SIZE = 2048;
const DISPLAY_BASE = 0x0600;
const DISPLAY_WIDTH = 64;
const DISPLAY_HEIGHT = 64;
const DISPLAY_SIZE = DISPLAY_WIDTH * DISPLAY_HEIGHT;
const DISPLAY_BYTES = DISPLAY_SIZE / 8;
const KEY_REGISTER = 0x05FF;
const EXAMPLE_CATEGORIES = ["Basic", "Intermediate", "Advanced", "Display", "Games"];
const SAVED_PROGRAMS_KEY = "tara-web-saved-programs-v1";
const TARA_COMPILER_URL = "https://cse.iitm.ac.in/~ayon/courses/CS2300/taracpu/compiler/web";
const PHONE_GAME_INPUT_QUERY = "(hover: none) and (pointer: coarse) and (max-width: 540px), (hover: none) and (pointer: coarse) and (max-height: 480px)";

const REG_NAMES = ["R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7"];
// As in TARA Studio (src/ui/panels/common.py): every register name in maroon.
const REG_ACCENTS = Array(8).fill("#7A1E2B");

const OP = {
  NOP: 0, HLT: 1, MOV: 2, LIL: 3, LIH: 4,
  LDW: 5, STW: 6, LDB: 7, STB: 8,
  ADD: 9, SUB: 10, ADDI: 11, MUL: 12,
  AND: 13, OR: 14, XOR: 15, NOT: 16,
  SHL: 17, SHR: 18, SLT: 19,
  BZ: 20, BN: 21, JMP: 22, CALL: 23, RET: 24,
  PUSH: 25, POP: 26,
};

const OP_NAME = Object.keys(OP).reduce((out, name) => {
  out[OP[name]] = name;
  return out;
}, {});

const FMT = {
  NOP: "F0", HLT: "F0", RET: "F0",
  ADD: "F1", SUB: "F1", MUL: "F1", AND: "F1", OR: "F1", XOR: "F1", SLT: "F1",
  MOV: "F2", NOT: "F2",
  LIL: "F3", LIH: "F3", ADDI: "F3", SHL: "F3", SHR: "F3",
  LDW: "F4", STW: "F4", LDB: "F4", STB: "F4",
  BZ: "F5", BN: "F5",
  JMP: "F6", CALL: "F6",
  PUSH: "F7", POP: "F7",
};

const ISA_ROWS = [
  ["System", "#FFF0F0", "NOP", "NOP", "No operation"],
  ["System", "#FFF0F0", "HLT", "HLT", "Halt execution"],
  ["Move / Immediate", "#FFF7E6", "MOV", "MOV Rd, Rs", "Rd = Rs"],
  ["Move / Immediate", "#FFF7E6", "LIL", "LIL Rd, imm8", "Rd[7:0] = imm8, high byte cleared"],
  ["Move / Immediate", "#FFF7E6", "LIH", "LIH Rd, imm8", "Rd[15:8] = imm8, low byte preserved"],
  ["Memory", "#EEF8FF", "LDW", "LDW Rd, off5(Rb)", "Load 16-bit word from memory"],
  ["Memory", "#EEF8FF", "STW", "STW Rs, off5(Rb)", "Store 16-bit word to memory"],
  ["Memory", "#EEF8FF", "LDB", "LDB Rd, off5(Rb)", "Load byte from memory"],
  ["Memory", "#EEF8FF", "STB", "STB Rs, off5(Rb)", "Store low byte to memory"],
  ["Arithmetic", "#F1FFF4", "ADD", "ADD Rd, Ra, Rb", "Rd = Ra + Rb"],
  ["Arithmetic", "#F1FFF4", "SUB", "SUB Rd, Ra, Rb", "Rd = Ra - Rb"],
  ["Arithmetic", "#F1FFF4", "ADDI", "ADDI Rd, imm8", "Rd = Rd + sign-extended imm8"],
  ["Arithmetic", "#F1FFF4", "MUL", "MUL Rd, Ra, Rb", "Rd = Ra * Rb"],
  ["Logic", "#F4F0FF", "AND", "AND Rd, Ra, Rb", "Rd = Ra & Rb"],
  ["Logic", "#F4F0FF", "OR", "OR Rd, Ra, Rb", "Rd = Ra | Rb"],
  ["Logic", "#F4F0FF", "XOR", "XOR Rd, Ra, Rb", "Rd = Ra ^ Rb"],
  ["Logic", "#F4F0FF", "NOT", "NOT Rd, Rs", "Rd = bitwise not Rs"],
  ["Shift / Compare", "#EEFDFB", "SHL", "SHL Rd, shamt", "Rd = Rd << shamt"],
  ["Shift / Compare", "#EEFDFB", "SHR", "SHR Rd, shamt", "Rd = Rd >> shamt"],
  ["Shift / Compare", "#EEFDFB", "SLT", "SLT Rd, Ra, Rb", "Rd = 1 if signed Ra < signed Rb else 0"],
  ["Control Flow", "#FFF2E8", "BZ", "BZ Rt, label", "Branch if Rt == 0"],
  ["Control Flow", "#FFF2E8", "BN", "BN Rt, label", "Branch if Rt < 0"],
  ["Control Flow", "#FFF2E8", "JMP", "JMP label", "PC-relative jump"],
  ["Control Flow", "#FFF2E8", "CALL", "CALL label", "R6 = return PC, then jump"],
  ["Control Flow", "#FFF2E8", "RET", "RET", "PC = R6"],
  ["Stack", "#F6F7F9", "PUSH", "PUSH Rs", "R7 -= 2; store Rs at stack top"],
  ["Stack", "#F6F7F9", "POP", "POP Rd", "Load stack top into Rd; R7 += 2"],
];

const ICONS = {
  open: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v1H3v-3Z"/><path d="M4 10h18l-2.1 8.4A2 2 0 0 1 18 20H5.9a2 2 0 0 1-1.94-1.52L2 10h2Z"/></svg>',
  save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h13l3 3v16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M7 3v7h11"/><path d="M8 22v-7h8v7"/></svg>',
  delete: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M7 7l1 15h8l1-15"/><path d="M10 11v6M14 11v6"/></svg>',
  rename: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17.5V21h3.5L19 9.5 15.5 6 4 17.5Z"/><path d="M14.5 7 16 5.5a2.1 2.1 0 0 1 3 3L17.5 10"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h6a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3H5V4Z"/><path d="M19 4h-6a3 3 0 0 0-3 3v15a3 3 0 0 1 3-3h6V4Z"/></svg>',
  compiler: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 4C5 4 4 5.5 4 8v1c0 2-1 3-3 3 2 0 3 1 3 3v1c0 2 1 4 3.5 4"/><path d="M16.5 4C19 4 20 5.5 20 8v1c0 2 1 3 3 3-2 0-3 1-3 3v1c0 2-1 4-3.5 4"/><path d="M9 8h6M9 12h4M9 16h6"/></svg>',
  power: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v10"/><path d="M7.2 5.8a8 8 0 1 0 9.6 0"/></svg>',
  load: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"/><path d="m7 9 5 5 5-5"/><path d="M5 19h14"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 7 6 12l5 5"/><path d="M6 12h12a4 4 0 0 1 0 8h-1"/></svg>',
  step: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 5 8 7-8 7V5Z"/><path d="M18 5v14"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8L7 4Z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z"/></svg>',
  reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2-4.9"/><path d="M5 4v7h7"/></svg>',
  boot: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V10"/><path d="m7 15 5-5 5 5"/><path d="M5 5h14"/></svg>',
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>',
  image: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z"/><path d="m4 18 5-5 4 4 2-2 5 5"/><path d="M15 9h.01"/></svg>',
  memory: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z"/><path d="M3 9h4M3 15h4M17 9h4M17 15h4M9 3v4M15 3v4M9 17v4M15 17v4"/></svg>',
  clear: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="m8 7 1 13h6l1-13"/><path d="M10 11l4 4M14 11l-4 4"/></svg>',
  expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2H2v5M19 2h3v5M19 22h3v-5M5 22H2v-5"/></svg>',
  collapse: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 7h5V2M17 2v5h5M22 17h-5v5M7 22v-5H2"/></svg>',
};

let examples = window.TARA_BUILTIN_EXAMPLES || { Basic: [], Intermediate: [], Advanced: [], Display: [], Games: [] };
let savedPrograms = loadSavedPrograms();
let appState = null;
let memBytes = new Uint8Array(MEM_SIZE);
let previousRegs = null;
let breakpoints = new Set();
let selectedSourceLine = null;
let memStart = 0;
let memoryRadix = "hex";
let activeTab = "listing";
let running = false;
let runTimer = null;
let clockHz = 10;
let displayGrid = false;
let displayColors = ["#1c1c1c", "#9bc3f8"];
let displayHFill = false;
let keyBits = 0;
let keyboardInputBits = 0;
let gameInputBits = 0;
const activeGameInputPointers = new Map();
let phoneGameInputMedia = null;
let displayResizeObserver = null;
let memoryHeatmap = true;
let listingSignature = "";
let listingSelectedAddr = null; // the highlighted listing row: the PC, or the row last chosen
let listingFollowedPc = null;   // the PC the highlight last moved to
let lastLogSig = "";
let editorFontSize = 15;
let listingFontSize = 15;
let memoryFontSize = 15;
let logFontSize = 14;
let isaFontSize = 16;
let activeEditorLine = 1;

const els = {};
const $ = (id) => document.getElementById(id);

class AsmError extends Error {
  constructor(msg, line) {
    super(msg);
    this.msg = msg;
    this.line = line || null;
  }

  toString() {
    return this.line ? `Line ${this.line}: ${this.msg}` : this.msg;
  }
}

function sext(val, bits) {
  const sign = 1 << (bits - 1);
  const mod = 1 << bits;
  return (val & sign) ? val - mod : val;
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function parseReg(tok) {
  const raw = String(tok).trim().toUpperCase();
  if (/^R[0-7]$/.test(raw)) return Number(raw.slice(1));
  throw new AsmError(`Invalid register '${raw}'`);
}

function parseIntToken(tok, labelMap) {
  const raw = String(tok).trim();
  if (/^0x[0-9a-f]+$/i.test(raw)) return parseInt(raw, 16);
  if (/^0b[01]+$/i.test(raw)) return parseInt(raw.slice(2), 2);
  if (/^-?\d+$/.test(raw)) return parseInt(raw, 10);
  if (labelMap && hasOwn(labelMap, raw)) return labelMap[raw];
  throw new AsmError(`Cannot parse value '${raw}'`);
}

function parseMem(tok) {
  const m = /^(-?\d+|0x[0-9a-fA-F]+)\(([Rr]\d)\)$/.exec(String(tok).trim());
  if (!m) throw new AsmError(`Invalid memory operand '${String(tok).trim()}'`);
  return [m[1], m[2]];
}

const OPERAND_COUNTS = {
  NOP: 0, HLT: 0, RET: 0,
  ADD: 3, SUB: 3, MUL: 3, AND: 3, OR: 3, XOR: 3, SLT: 3,
  MOV: 2, NOT: 2,
  LIL: 2, LIH: 2, ADDI: 2, SHL: 2, SHR: 2,
  LDW: 2, LDB: 2, STW: 2, STB: 2,
  BZ: 2, BN: 2,
  JMP: 1, CALL: 1,
  PUSH: 1, POP: 1,
};

function parseOperands(opsStr, mnem) {
  const operands = String(opsStr).split(",").map((v) => v.trim()).filter(Boolean);
  const expected = OPERAND_COUNTS[mnem];
  if (operands.length !== expected) {
    const suffix = expected === 1 ? "" : "s";
    throw new AsmError(`${mnem} expects ${expected} operand${suffix}, got ${operands.length}`);
  }
  return operands;
}

function validateRange(value, minimum, maximum, operandName) {
  if (!(minimum <= value && value <= maximum)) {
    throw new AsmError(`${operandName} must be between ${minimum} and ${maximum}, got ${value}`);
  }
  return value;
}

function labelRel(target, iaddr, labelMap) {
  if (hasOwn(labelMap, target)) return Math.floor((labelMap[target] - (iaddr + 2)) / 2);
  return parseIntToken(target, labelMap);
}

function encodeF0(op) { return (op << 11) & 0xffff; }
function encodeF1(op, rd, rA, rB) { return ((op << 11) | (rd << 8) | (rA << 5) | (rB << 2)) & 0xffff; }
function encodeF2(op, rd, rs) { return ((op << 11) | (rd << 8) | (rs << 5)) & 0xffff; }
function encodeF3(op, rd, imm8) { return ((op << 11) | (rd << 8) | (imm8 & 0xff)) & 0xffff; }
function encodeF4(op, rdata, rbase, off5) { return ((op << 11) | (rdata << 8) | (rbase << 5) | (off5 & 0x1f)) & 0xffff; }
function encodeF5(op, rtest, rel8) { return ((op << 11) | (rtest << 8) | (rel8 & 0xff)) & 0xffff; }
function encodeF6(op, rel11) { return ((op << 11) | (rel11 & 0x7ff)) & 0xffff; }
function encodeF7(op, rstk) { return ((op << 11) | (rstk << 8)) & 0xffff; }

function assemble(source) {
  const lines = String(source || "").split(/\r?\n/);
  const errors = [];
  const labelMap = {};
  const parsed = [];
  let addr = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const lineno = i + 1;
    const raw = lines[i];
    let line = raw.split(";")[0].trim();
    if (!line) continue;

    while (line.indexOf(":") >= 0) {
      const colon = line.indexOf(":");
      const label = line.slice(0, colon).trim();
      if (label) labelMap[label] = addr;
      line = line.slice(colon + 1).trim();
    }
    if (!line) continue;

    const parts = line.split(/\s+/, 2);
    const mnem = parts[0].toUpperCase();
    const ops = line.slice(parts[0].length).trim();
    if (!hasOwn(OP, mnem)) {
      errors.push(new AsmError(`Unknown mnemonic '${mnem}'`, lineno));
      continue;
    }
    parsed.push([lineno, addr, mnem, ops, raw.replace(/\s+$/, "")]);
    addr += 2;
  }

  const words = [];
  const listing = [];

  for (const item of parsed) {
    const lineno = item[0];
    const iaddr = item[1];
    const mnem = item[2];
    const opsStr = item[3];
    const original = item[4];
    const opcode = OP[mnem];
    let word = 0;
    let err = null;

    try {
      const operands = parseOperands(opsStr, mnem);
      if (["NOP", "HLT", "RET"].indexOf(mnem) >= 0) {
        word = encodeF0(opcode);
      } else if (["ADD", "SUB", "MUL", "AND", "OR", "XOR", "SLT"].indexOf(mnem) >= 0) {
        word = encodeF1(opcode, parseReg(operands[0]), parseReg(operands[1]), parseReg(operands[2]));
      } else if (["MOV", "NOT"].indexOf(mnem) >= 0) {
        word = encodeF2(opcode, parseReg(operands[0]), parseReg(operands[1]));
      } else if (["LIL", "LIH", "ADDI"].indexOf(mnem) >= 0) {
        const rd = parseReg(operands[0]);
        let imm = parseIntToken(operands[1], labelMap);
        if (mnem === "ADDI") imm = validateRange(imm, -128, 127, "ADDI immediate");
        else imm = validateRange(imm, -128, 255, `${mnem} immediate`);
        word = encodeF3(opcode, rd, imm);
      } else if (["SHL", "SHR"].indexOf(mnem) >= 0) {
        const rd = parseReg(operands[0]);
        const shamt = validateRange(parseIntToken(operands[1], labelMap), 0, 31, "shift amount");
        word = encodeF3(opcode, rd, shamt);
      } else if (["LDW", "LDB", "STW", "STB"].indexOf(mnem) >= 0) {
        // LDW/LDB Rd, off(Rb) and STW/STB Rs, off(Rb)
        const rdata = parseReg(operands[0]);
        const mem = parseMem(operands[1]);
        const off = validateRange(parseIntToken(mem[0], labelMap), -16, 15, "memory offset");
        const rbase = parseReg(mem[1]);
        word = encodeF4(opcode, rdata, rbase, off);
      } else if (["BZ", "BN"].indexOf(mnem) >= 0) {
        const rtest = parseReg(operands[0]);
        const rel = validateRange(labelRel(operands[1], iaddr, labelMap), -128, 127, "branch offset");
        word = encodeF5(opcode, rtest, rel);
      } else if (["JMP", "CALL"].indexOf(mnem) >= 0) {
        const rel = validateRange(labelRel(operands[0], iaddr, labelMap), -1024, 1023, "jump offset");
        word = encodeF6(opcode, rel);
      } else if (["PUSH", "POP"].indexOf(mnem) >= 0) {
        word = encodeF7(opcode, parseReg(operands[0]));
      } else {
        throw new AsmError(`Unhandled mnemonic '${mnem}'`);
      }
    } catch (e) {
      err = e instanceof AsmError ? e : new AsmError(String(e && e.message ? e.message : e));
      err.line = lineno;
      errors.push(err);
      word = 0xDEAD;
    }

    words.push([iaddr, word & 0xffff]);
    listing.push({ lineno, addr: iaddr, word: word & 0xffff, mnem, ops: opsStr, original, error: Boolean(err) });
  }

  return { words, listing, errors, labels: labelMap };
}

class TaraCPU {
  constructor() {
    this.reset();
  }

  reset() {
    this.reg = [0, 0, 0, 0, 0, 0, 0, 0];
    this.pc = 0;
    this.mem = new Uint8Array(MEM_SIZE);
    this.halted = false;
    this.error = null;
    this.history = [];
    this.cycle_count = 0;
    this.instr_count = 0;
    this.last_instr = null;
  }

  loadProgram(words, start) {
    const base = start || 0;
    for (let i = 0; i < words.length; i += 1) {
      const addr = base + i * 2;
      const word = words[i] & 0xffff;
      if (addr + 1 < MEM_SIZE) {
        this.mem[addr] = (word >> 8) & 0xff;
        this.mem[addr + 1] = word & 0xff;
      }
    }
  }

  readWord(addr) {
    const a = addr & 0x7ff;
    if (a + 1 >= MEM_SIZE) throw new Error("bytearray index out of range");
    return ((this.mem[a] << 8) | this.mem[a + 1]) & 0xffff;
  }

  writeWord(addr, val) {
    const a = addr & 0x7ff;
    if (a + 1 >= MEM_SIZE) throw new Error("bytearray index out of range");
    const v = val & 0xffff;
    this.mem[a] = (v >> 8) & 0xff;
    this.mem[a + 1] = v & 0xff;
  }

  readByte(addr) {
    return this.mem[addr & 0x7ff] & 0xff;
  }

  writeByte(addr, val) {
    this.mem[addr & 0x7ff] = val & 0xff;
  }

  r(i) {
    return this.reg[i] & 0xffff;
  }

  wr(i, val) {
    this.reg[i] = val & 0xffff;
  }

  decode(word) {
    const op = (word >> 11) & 0x1f;
    const name = OP_NAME[op] || `???(${op})`;
    const fmt = FMT[name] || "??";
    return {
      word: word & 0xffff,
      op,
      name,
      fmt,
      rd: (word >> 8) & 0x7,
      rsA: (word >> 5) & 0x7,
      rsB: (word >> 2) & 0x7,
      imm8: word & 0xff,
      off5: word & 0x1f,
      rel8: word & 0xff,
      rel11: word & 0x7ff,
    };
  }

  step(recordHistory) {
    if (this.halted) return false;
    let snap = null;
    if (recordHistory) {
      snap = { pc: this.pc, reg: this.reg.slice(), cycle: this.cycle_count };
    }

    if (this.pc + 1 >= MEM_SIZE) {
      this.error = `PC out of bounds: 0x${wordHex(this.pc)}`;
      this.halted = true;
      return false;
    }

    const word = this.readWord(this.pc);
    const d = this.decode(word);
    this.last_instr = Object.assign({}, d);
    let nextPc = (this.pc + 2) & 0xffff;
    this.cycle_count += 1;
    this.instr_count += 1;

    try {
      const name = d.name;
      if (name === "NOP") {
        // no-op
      } else if (name === "HLT") {
        this.halted = true;
      } else if (name === "MOV") {
        this.wr(d.rd, this.r(d.rsA));
      } else if (name === "LIL") {
        this.wr(d.rd, d.imm8);
      } else if (name === "LIH") {
        this.wr(d.rd, (this.r(d.rd) & 0x00ff) | (d.imm8 << 8));
      } else if (name === "LDW") {
        const ea = (this.r(d.rsA) + sext(d.off5, 5)) & 0x7ff;
        this.wr(d.rd, this.readWord(ea));
      } else if (name === "STW") {
        const ea = (this.r(d.rsA) + sext(d.off5, 5)) & 0x7ff;
        this.writeWord(ea, this.r(d.rd));
      } else if (name === "LDB") {
        const ea = (this.r(d.rsA) + sext(d.off5, 5)) & 0x7ff;
        this.wr(d.rd, this.readByte(ea));
      } else if (name === "STB") {
        const ea = (this.r(d.rsA) + sext(d.off5, 5)) & 0x7ff;
        this.writeByte(ea, this.r(d.rd) & 0xff);
      } else if (name === "ADD") {
        this.wr(d.rd, this.r(d.rsA) + this.r(d.rsB));
      } else if (name === "SUB") {
        this.wr(d.rd, this.r(d.rsA) - this.r(d.rsB));
      } else if (name === "ADDI") {
        this.wr(d.rd, this.r(d.rd) + sext(d.imm8, 8));
      } else if (name === "MUL") {
        this.wr(d.rd, Math.imul(this.r(d.rsA), this.r(d.rsB)));
      } else if (name === "AND") {
        this.wr(d.rd, this.r(d.rsA) & this.r(d.rsB));
      } else if (name === "OR") {
        this.wr(d.rd, this.r(d.rsA) | this.r(d.rsB));
      } else if (name === "XOR") {
        this.wr(d.rd, this.r(d.rsA) ^ this.r(d.rsB));
      } else if (name === "NOT") {
        this.wr(d.rd, (~this.r(d.rsA)) & 0xffff);
      } else if (name === "SHL") {
        this.wr(d.rd, this.r(d.rd) << (d.imm8 & 0x1f));
      } else if (name === "SHR") {
        this.wr(d.rd, this.r(d.rd) >>> (d.imm8 & 0x1f));
      } else if (name === "SLT") {
        this.wr(d.rd, sext(this.r(d.rsA), 16) < sext(this.r(d.rsB), 16) ? 1 : 0);
      } else if (name === "BZ") {
        if (sext(this.r(d.rd), 16) === 0) nextPc = (nextPc + sext(d.rel8, 8) * 2) & 0xffff;
      } else if (name === "BN") {
        if (sext(this.r(d.rd), 16) < 0) nextPc = (nextPc + sext(d.rel8, 8) * 2) & 0xffff;
      } else if (name === "JMP") {
        nextPc = (nextPc + sext(d.rel11, 11) * 2) & 0xffff;
      } else if (name === "CALL") {
        this.wr(6, nextPc);
        nextPc = (nextPc + sext(d.rel11, 11) * 2) & 0xffff;
      } else if (name === "RET") {
        nextPc = this.r(6);
      } else if (name === "PUSH") {
        this.wr(7, this.r(7) - 2);
        this.writeWord(this.r(7), this.r(d.rd));
      } else if (name === "POP") {
        this.wr(d.rd, this.readWord(this.r(7)));
        this.wr(7, this.r(7) + 2);
      } else {
        this.error = `Unknown opcode ${d.op} at PC=0x${wordHex(this.pc)}`;
        this.halted = true;
        return false;
      }
    } catch (e) {
      this.error = String(e && e.message ? e.message : e);
      this.halted = true;
      return false;
    }

    this.pc = nextPc & 0x7ff;
    if (recordHistory) {
      snap.instr = Object.assign({}, d);
      this.history.push(snap);
    }
    return !this.halted;
  }
}

const session = {
  cpu: new TaraCPU(),
  source: "",
  listing: [],
  loaded: false,
  status: "Ready. Write or load assembly, then click Assemble & Load.",
  errors: [],
  logs: [],
  lineForAddr: new Map(),
  breakpointAddrs: new Set(),
  breakpointLineForAddr: new Map(),
  undoStack: [],
  maxUndoStates: 30,
  resumeBreakpointPc: null,
  skipBreakpointPc: null,
  currentProgramName: "",
  currentProgramKind: "",
  currentFilePath: null,
};

function errorToDict(error) {
  return {
    line: error && error.line ? error.line : null,
    message: error && error.msg ? error.msg : String(error),
    text: error && error.toString ? error.toString() : String(error),
  };
}

function memToHex(mem) {
  let out = "";
  for (let i = 0; i < mem.length; i += 1) out += byteHex(mem[i]);
  return out.toLowerCase();
}

function bytesFromHex(hexText) {
  const len = Math.floor(String(hexText || "").length / 2);
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) out[i] = parseInt(hexText.slice(i * 2, i * 2 + 2), 16) || 0;
  return out;
}

function statePayload() {
  return {
    source: session.source,
    loaded: session.loaded,
    listing: session.listing,
    errors: session.errors.map(errorToDict),
    status: session.status,
    breakpoints: Array.from(breakpoints).sort((a, b) => a - b),
    line_for_pc: session.lineForAddr.get(session.cpu.pc) || null,
    can_step_back: Boolean(session.undoStack.length && session.loaded),
    current_program_name: session.currentProgramName,
    current_file_path: session.currentFilePath,
    current_program_kind: session.currentProgramKind,
    cpu: {
      reg: session.cpu.reg.map((v) => v & 0xffff),
      pc: session.cpu.pc & 0xffff,
      halted: Boolean(session.cpu.halted),
      error: session.cpu.error,
      cycle_count: session.cpu.cycle_count,
      instr_count: session.cpu.instr_count,
      last_instr: session.cpu.last_instr ? Object.assign({}, session.cpu.last_instr) : null,
    },
    logs: session.logs.slice(-500),
  };
}

function syncState(options) {
  const opts = options || {};
  appState = statePayload();
  memBytes = new Uint8Array(session.cpu.mem);
  if (opts.syncSource) els.sourceEditor.value = appState.source || "";
  renderAll();
}

function setCurrentProgram(kind, name, path) {
  session.currentProgramKind = kind || "";
  session.currentProgramName = name || "";
  session.currentFilePath = path || null;
}

function loadSavedPrograms() {
  try {
    const raw = localStorage.getItem(SAVED_PROGRAMS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function persistSavedPrograms() {
  localStorage.setItem(SAVED_PROGRAMS_KEY, JSON.stringify(savedPrograms));
}

function upsertSavedProgram(name, source) {
  const clean = String(name || "New Program").trim() || "New Program";
  const idx = savedPrograms.findIndex((item) => item.name === clean);
  const record = { name: clean, source: String(source || ""), updatedAt: new Date().toISOString() };
  if (idx >= 0) savedPrograms[idx] = record;
  else savedPrograms.push(record);
  savedPrograms.sort((a, b) => a.name.localeCompare(b.name));
  persistSavedPrograms();
  return record;
}

function deleteSavedProgram(name) {
  const before = savedPrograms.length;
  savedPrograms = savedPrograms.filter((item) => item.name !== name);
  persistSavedPrograms();
  return savedPrograms.length !== before;
}

function optionValue(kind, category, name) {
  return [kind, encodeURIComponent(category || ""), encodeURIComponent(name || "")].join("|");
}

function parseOptionValue(value) {
  const parts = String(value || "").split("|");
  return { kind: parts[0], category: decodeURIComponent(parts[1] || ""), name: decodeURIComponent(parts[2] || "") };
}

function setBreakpoints(lines) {
  breakpoints = new Set((lines || []).map(Number).filter((v) => v > 0));
  session.resumeBreakpointPc = null;
  session.skipBreakpointPc = null;
  rebuildBreakpointAddrs();
}

function rebuildLineForAddr() {
  session.lineForAddr = new Map();
  for (const entry of session.listing) {
    if (entry.lineno != null) session.lineForAddr.set(entry.addr, entry.lineno);
  }
}

function rebuildBreakpointAddrs() {
  session.breakpointAddrs = new Set();
  session.breakpointLineForAddr = new Map();
  for (const entry of session.listing) {
    if (breakpoints.has(entry.lineno)) {
      session.breakpointAddrs.add(entry.addr);
      session.breakpointLineForAddr.set(entry.addr, entry.lineno);
    }
  }
}

function atBreakpoint() {
  return session.loaded && session.breakpointAddrs.has(session.cpu.pc);
}

function clearUndoStack() {
  session.undoStack = [];
}

function snapshotCpu() {
  return {
    reg: session.cpu.reg.slice(),
    pc: session.cpu.pc,
    mem: new Uint8Array(session.cpu.mem),
    halted: session.cpu.halted,
    error: session.cpu.error,
    cycle_count: session.cpu.cycle_count,
    instr_count: session.cpu.instr_count,
    last_instr: session.cpu.last_instr ? Object.assign({}, session.cpu.last_instr) : null,
    history: session.cpu.history.slice(),
    logs_len: session.logs.length,
  };
}

function pushUndoState() {
  session.undoStack.push(snapshotCpu());
  if (session.undoStack.length > session.maxUndoStates) session.undoStack.shift();
}

function restoreCpuSnapshot(snap) {
  session.cpu.reg = snap.reg.slice();
  session.cpu.pc = snap.pc & 0x7ff;
  session.cpu.mem.set(snap.mem);
  session.cpu.halted = Boolean(snap.halted);
  session.cpu.error = snap.error;
  session.cpu.cycle_count = snap.cycle_count;
  session.cpu.instr_count = snap.instr_count;
  session.cpu.last_instr = snap.last_instr ? Object.assign({}, snap.last_instr) : null;
  session.cpu.history = snap.history.slice();
  session.logs = session.logs.slice(0, snap.logs_len);
}

function formatOps(d) {
  const n = d.name;
  if (["NOP", "HLT", "RET"].indexOf(n) >= 0) return "";
  if (["MOV", "NOT"].indexOf(n) >= 0) return `R${d.rd}, R${d.rsA}`;
  if (["LIL", "LIH", "ADDI", "SHL", "SHR"].indexOf(n) >= 0) return `R${d.rd}, ${d.imm8}`;
  if (["ADD", "SUB", "MUL", "AND", "OR", "XOR", "SLT"].indexOf(n) >= 0) return `R${d.rd}, R${d.rsA}, R${d.rsB}`;
  if (["LDW", "LDB"].indexOf(n) >= 0) return `R${d.rd}, ${sext(d.off5, 5)}(R${d.rsA})`;
  if (["STW", "STB"].indexOf(n) >= 0) return `R${d.rd}, ${sext(d.off5, 5)}(R${d.rsA})`;
  if (["BZ", "BN"].indexOf(n) >= 0) return `R${d.rd}, ${sext(d.rel8, 8)}`;
  if (["JMP", "CALL"].indexOf(n) >= 0) return `${sext(d.rel11, 11)}`;
  if (["PUSH", "POP"].indexOf(n) >= 0) return `R${d.rd}`;
  return "";
}

function makeLogLine(snap) {
  if (!snap || !snap.instr) return null;
  const d = snap.instr;
  const changed = [];
  for (let i = 0; i < 8; i += 1) {
    if ((session.cpu.reg[i] & 0xffff) !== (snap.reg[i] & 0xffff)) changed.push(`R${i}=0x${wordHex(session.cpu.reg[i])}`);
  }
  let line = `[${String(snap.cycle).padStart(5, " ")}] PC=0x${wordHex(snap.pc)}  ${d.name.padEnd(5, " ")} ${formatOps(d).padEnd(18, " ")}`;
  if (changed.length) line += "  -> " + changed.join(", ");
  return line;
}

function appendLatestLog(previousHistoryCount) {
  if (session.cpu.history.length <= previousHistoryCount) return;
  const line = makeLogLine(session.cpu.history[session.cpu.history.length - 1]);
  if (line) session.logs.push(line);
  if (session.logs.length > 500) session.logs = session.logs.slice(-500);
}

function assembleEditorSource() {
  const source = els.sourceEditor.value;
  session.source = source;
  if (!source.trim()) {
    clearUndoStack();
    session.errors = [];
    session.status = "No source code to assemble.";
    syncState();
    return false;
  }

  const result = assemble(source);
  session.errors = result.errors;
  if (result.errors.length) {
    clearUndoStack();
    session.lineForAddr = new Map();
    session.status = `Assembly failed: ${result.errors.length} error(s)`;
    syncState();
    return false;
  }

  session.listing = result.listing;
  rebuildLineForAddr();
  rebuildBreakpointAddrs();
  session.resumeBreakpointPc = null;
  session.skipBreakpointPc = null;
  clearUndoStack();

  const preserved = new Uint8Array(session.cpu.mem);
  session.cpu.reset();
  session.cpu.mem.set(preserved);
  session.cpu.loadProgram(result.words.map((pair) => pair[1]), 0);
  session.loaded = true;
  session.status = `Assembled ${result.listing.length} instructions, ${Object.keys(result.labels).length} labels. PC=0x0000. Ready to run.`;
  syncState();
  return true;
}

function stepCpu() {
  if (!session.loaded || session.cpu.halted) return;
  session.resumeBreakpointPc = null;
  session.skipBreakpointPc = null;
  pushUndoState();
  const prevCount = session.cpu.history.length;
  session.cpu.step(true);
  appendLatestLog(prevCount);
  if (session.cpu.halted) {
    let msg = `Halted at PC=0x${wordHex(session.cpu.pc)}`;
    if (session.cpu.error) msg += ` - ${session.cpu.error}`;
    session.status = msg;
  } else {
    session.status = `Stepped to PC=0x${wordHex(session.cpu.pc)}.`;
  }
  syncState();
}

function stepBackCpu() {
  if (!session.loaded || !session.undoStack.length) return;
  session.resumeBreakpointPc = null;
  session.skipBreakpointPc = null;
  const snap = session.undoStack.pop();
  restoreCpuSnapshot(snap);
  session.status = `Stepped back to PC=0x${wordHex(session.cpu.pc)}.`;
  syncState();
}

function resetCpu() {
  stopRun(false);
  releaseAllDisplayInputs();
  session.resumeBreakpointPc = null;
  session.skipBreakpointPc = null;
  clearUndoStack();
  if (session.loaded) assembleEditorSource();
  else session.cpu.reset();
  session.logs = [];
  session.status = "Reset. CPU state cleared.";
  syncState();
}

function runStart() {
  if (!session.loaded || session.cpu.halted) return false;
  if (clockHz > 25) clearUndoStack();
  if (atBreakpoint()) {
    if (session.resumeBreakpointPc === session.cpu.pc) {
      session.skipBreakpointPc = session.cpu.pc;
      session.resumeBreakpointPc = null;
    } else {
      session.resumeBreakpointPc = session.cpu.pc;
      session.skipBreakpointPc = null;
      const line = session.breakpointLineForAddr.get(session.cpu.pc);
      const where = line ? `line ${line}, ` : "";
      session.status = `Breakpoint hit at ${where}PC=0x${wordHex(session.cpu.pc)}. Step or Run to continue.`;
      syncState();
      return false;
    }
  }
  session.status = `Running at ${clockHz.toFixed(1)} Hz.`;
  syncState();
  return true;
}

function clockTick(batch, recordHistory) {
  if (!recordHistory) clearUndoStack();
  let stopped = false;
  // Cap wall time per tick so click/keyboard events can fire between batches.
  const tickDeadline = performance.now() + 5;
  for (let i = 0; i < batch; i += 1) {
    if (session.cpu.halted) {
      stopped = true;
      break;
    }
    if (atBreakpoint()) {
      if (session.skipBreakpointPc === session.cpu.pc) {
        session.skipBreakpointPc = null;
      } else {
        session.resumeBreakpointPc = session.cpu.pc;
        const line = session.breakpointLineForAddr.get(session.cpu.pc);
        const where = line ? `line ${line}, ` : "";
        session.status = `Breakpoint hit at ${where}PC=0x${wordHex(session.cpu.pc)}. Step or Run to continue.`;
        stopped = true;
        break;
      }
    }
    if (recordHistory) {
      pushUndoState();
      const prevCount = session.cpu.history.length;
      session.cpu.step(true);
      appendLatestLog(prevCount);
    } else {
      session.cpu.step(false);
    }
    if (session.cpu.halted) {
      stopped = true;
      break;
    }
    // Yield every 64 steps if the time budget is exhausted.
    if ((i & 63) === 63 && performance.now() > tickDeadline) break;
  }

  if (session.cpu.halted) {
    let msg = `Halted at PC=0x${wordHex(session.cpu.pc)}`;
    if (session.cpu.error) msg += ` - ${session.cpu.error}`;
    session.status = msg;
  } else if (!stopped) {
    session.status = `Running. PC=0x${wordHex(session.cpu.pc)}.`;
  }
  // stopRun before syncState so renderAll sees running=false and draws registers.
  if (stopped) stopRun(false);
  syncState();
}

function stopRun(updateStatus) {
  running = false;
  if (runTimer) {
    clearInterval(runTimer);
    runTimer = null;
  }
  if (updateStatus) {
    if (clockHz > 25) {
      clearUndoStack();
      session.status = "Stopped. Step-back history cleared after high-speed run.";
    } else {
      session.status = "Stopped.";
    }
    syncState();
  } else if (appState) {
    renderControls();
  }
}

function toggleRun() {
  if (running) {
    stopRun(true);
    return;
  }
  if (!runStart()) return;
  running = true;
  restartRunTimer();
  renderControls();
}

function restartRunTimer() {
  if (runTimer) clearInterval(runTimer);
  const highSpeed = clockHz > 25;
  const interval = clockHz >= 1000 ? 10 : Math.max(1, Math.round(1000 / clockHz));
  const batch = clockHz >= 1000 ? Math.max(1, Math.floor((clockHz * interval) / 1000)) : 1;
  runTimer = setInterval(() => {
    if (!running) return;
    clockTick(batch, !highSpeed);
  }, interval);
}

function machineStatePayload() {
  const currentSource = els.sourceEditor ? els.sourceEditor.value : session.source;
  session.source = currentSource;
  return {
    format: "tara-machine-state",
    version: 1,
    source: currentSource,
    loaded: session.loaded,
    listing: session.listing,
    cpu: {
      reg: session.cpu.reg.slice(),
      pc: session.cpu.pc,
      mem_hex: memToHex(session.cpu.mem),
      halted: session.cpu.halted,
      error: session.cpu.error,
      cycle_count: session.cpu.cycle_count,
      instr_count: session.cpu.instr_count,
      last_instr: session.cpu.last_instr,
    },
  };
}

function applyMachineState(payload) {
  if (!payload || payload.format !== "tara-machine-state") throw new Error("Not a TARA machine-state file.");
  const cpuState = payload.cpu || {};
  const mem = bytesFromHex(cpuState.mem_hex || "");
  if (mem.length !== MEM_SIZE) throw new Error(`Machine-state memory must be ${MEM_SIZE} bytes.`);

  stopRun(false);
  session.source = payload.source || "";
  session.errors = [];
  let listing = payload.listing || [];
  if (session.source.trim()) {
    const rebuilt = assemble(session.source);
    if (!rebuilt.errors.length) listing = rebuilt.listing;
    else session.errors = rebuilt.errors;
  }
  session.listing = listing;
  rebuildLineForAddr();
  rebuildBreakpointAddrs();
  clearUndoStack();
  session.logs = [];

  session.cpu.reset();
  session.cpu.reg = (cpuState.reg || []).slice(0, 8).map((v) => Number(v) & 0xffff);
  while (session.cpu.reg.length < 8) session.cpu.reg.push(0);
  session.cpu.pc = Number(cpuState.pc || 0) & 0x7ff;
  session.cpu.mem.set(mem);
  session.cpu.halted = Boolean(cpuState.halted);
  session.cpu.error = cpuState.error || null;
  session.cpu.cycle_count = Number(cpuState.cycle_count || 0);
  session.cpu.instr_count = Number(cpuState.instr_count || 0);
  session.cpu.last_instr = cpuState.last_instr || null;
  session.loaded = Boolean(payload.loaded);
  session.status = "Booted machine state.";
  syncState({ syncSource: true });
}

function writeRegister(index, value) {
  const i = Number(index);
  if (!Number.isInteger(i) || i < 0 || i >= REG_NAMES.length) throw new Error("Register index out of range.");
  clearUndoStack();
  session.cpu.wr(i, Number(value));
  session.status = `Register written: ${REG_NAMES[i]} <- 0x${wordHex(session.cpu.reg[i])}`;
  syncState();
}

function writeMemory(addr, value) {
  const a = Number(addr);
  if (a < 0 || a >= MEM_SIZE) throw new Error("Memory address out of range.");
  clearUndoStack();
  session.cpu.mem[a] = Number(value) & 0xff;
  session.status = `Memory written: 0x${wordHex(a)} <- 0x${byteHex(session.cpu.mem[a])}`;
  syncState();
}

function writeMemoryRegion(start, data) {
  const s = Number(start);
  if (s < 0 || s >= MEM_SIZE) throw new Error("Memory start address out of range.");
  const bytes = Array.from(data || []).map((v) => Number(v) & 0xff);
  if (!bytes.length) {
    session.status = "No memory bytes to write.";
    syncState();
    return;
  }
  const end = Math.min(MEM_SIZE, s + bytes.length);
  for (let i = s; i < end; i += 1) session.cpu.mem[i] = bytes[i - s];
  clearUndoStack();
  const label = s < DISPLAY_BASE + DISPLAY_BYTES && end > DISPLAY_BASE ? "Display buffer" : "Memory region";
  session.status = `${label} copied: 0x${wordHex(s)}-0x${wordHex(end - 1)} (${end - s} bytes)`;
  syncState();
}

function clearDisplay() {
  writeMemoryRegion(DISPLAY_BASE, new Array(DISPLAY_BYTES).fill(0));
}

function updateKeyRegister(bits) {
  keyBits = bits & 0xff;
  session.cpu.mem[KEY_REGISTER] = keyBits;
  memBytes[KEY_REGISTER] = keyBits;
  if (activeTab === "memory") renderMemory();
}

function commitKeyRegisterFromInputs() {
  const next = (keyboardInputBits | gameInputBits) & 0xff;
  if (next !== keyBits) updateKeyRegister(next);
}

function setKeyboardInputBit(bit, pressed) {
  if (pressed) keyboardInputBits |= bit;
  else keyboardInputBits &= ~bit;
  commitKeyRegisterFromInputs();
}

function setGameButtonPressed(button, pressed) {
  if (!button) return;
  button.classList.toggle("is-pressed", Boolean(pressed));
  button.setAttribute("aria-pressed", pressed ? "true" : "false");
}

function recomputeGameInputBits() {
  let bits = 0;
  for (const entry of activeGameInputPointers.values()) bits |= entry.bit;
  gameInputBits = bits & 0xff;
  commitKeyRegisterFromInputs();
}

function releaseGameInputPointer(pointerId) {
  const entry = activeGameInputPointers.get(pointerId);
  if (!entry) return;
  activeGameInputPointers.delete(pointerId);
  let stillPressed = false;
  for (const other of activeGameInputPointers.values()) {
    if (other.button === entry.button) {
      stillPressed = true;
      break;
    }
  }
  setGameButtonPressed(entry.button, stillPressed);
  recomputeGameInputBits();
}

function releaseAllDisplayInputs() {
  keyboardInputBits = 0;
  gameInputBits = 0;
  activeGameInputPointers.clear();
  document.querySelectorAll(".gamepad-button.is-pressed").forEach((button) => setGameButtonPressed(button, false));
  commitKeyRegisterFromInputs();
}

function cacheElements() {
  const ids = [
    "programSelect", "openProgramBtn", "deleteProgramBtn", "openCompilerBtn", "isaBtn", "powerBtn",
    "mainSplitter", "openFileInput", "sourceEditor", "lineGutter", "syntaxLayer", "editorFontDec", "editorFontInc", "errorBox", "controlPanel",
    "collapseControls", "pcValue", "instrValue", "statusBadge", "assembleBtn", "stepBackBtn", "stepBtn",
    "runBtn", "resetBtn", "saveStateBtn", "bootStateBtn", "bootStateInput", "freqText", "freqSlider", "registerPanel",
    "collapseRegisters", "registerGrid", "listingTable", "listingFontDec", "listingFontInc", "memJump", "memPrevBtn",
    "memNextBtn", "memRadixBtn", "memToolsBtn", "memoryFontDec", "memoryFontInc", "memoryTable", "displayGridBtn", "displayOffColor",
    "displayOnColor", "displayImportBtn", "displayImportInput", "displayClearBtn", "displayStage", "displayCanvas", "executionLog", "clearLogBtn",
    "logFontDec", "logFontInc", "statusText", "isaDialog", "isaCloseBtn", "isaFontDec", "isaFontInc", "isaTable",
    "powerDialog", "powerYesBtn", "powerNoBtn",
    "memoryToolsDialog", "memoryToolsCloseBtn", "randomStart", "randomCount", "randomMin", "randomMax", "randomFillBtn",
    "importStart", "memoryImportInput", "memoryImportBtn", "exportStart", "exportCount", "exportIncludeZeros", "memoryExportBtn",
    "heatmapToggle", "displayExpandBtn", "displayCoord",
  ];
  for (const id of ids) els[id] = $(id);
}

function hex(value, width) {
  return `0x${(Number(value) >>> 0).toString(16).toUpperCase().padStart(width, "0")}`;
}

function byteHex(value) {
  return (Number(value) & 0xff).toString(16).toUpperCase().padStart(2, "0");
}

function wordHex(value) {
  return (Number(value) & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

function formatByte(value) {
  const v = Number(value) & 0xff;
  return memoryRadix === "dec" ? String(v) : byteHex(v);
}

function setMemoryRadix(radix) {
  memoryRadix = radix === "dec" ? "dec" : "hex";
  els.memRadixBtn.textContent = memoryRadix === "dec" ? "Base: DEC" : "Base: HEX";
  els.memoryTable.classList.toggle("decimal-bytes", memoryRadix === "dec");
  if (activeTab === "memory") renderMemory();
}

function signed16(value) {
  const v = Number(value) & 0xffff;
  return (v & 0x8000) ? v - 0x10000 : v;
}

function parseNumber(value) {
  const raw = String(value == null ? "" : value).trim().toLowerCase();
  if (!raw) throw new Error("Expected a number.");
  if (/^0x[0-9a-f]+$/i.test(raw)) return parseInt(raw, 16);
  if (/^0b[01]+$/i.test(raw)) return parseInt(raw.slice(2), 2);
  if (/^-?\d+$/.test(raw)) return parseInt(raw, 10);
  throw new Error(`Invalid number '${value}'.`);
}

function setStatus(text) {
  if (text) els.statusText.textContent = text;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function lineAtCaret() {
  const pos = els.sourceEditor ? els.sourceEditor.selectionStart : 0;
  return els.sourceEditor.value.slice(0, pos).split("\n").length;
}

function updateActiveEditorLine() {
  activeEditorLine = lineAtCaret();
  renderGutter();
  selectListingForLine(activeEditorLine);
}

function highlightCodePart(text) {
  const tokenRe = /\b(?:NOP|HLT|RET|ADD|SUB|MUL|AND|OR|XOR|SLT|MOV|NOT|LIL|LIH|ADDI|SHL|SHR|LDW|STW|LDB|STB|BZ|BN|JMP|CALL|PUSH|POP)\b|\b[Rr][0-7]\b|\b0x[0-9a-fA-F]+\b|\b0b[01]+\b|\b\d+\b|[,():]/gi;
  let out = "";
  let last = 0;
  for (const match of text.matchAll(tokenRe)) {
    const token = match[0];
    out += escapeHtml(text.slice(last, match.index));
    if (hasOwn(OP, token.toUpperCase())) out += `<span class="tok-mnemonic">${escapeHtml(token)}</span>`;
    else if (/^[Rr][0-7]$/.test(token)) out += `<span class="tok-register">${escapeHtml(token)}</span>`;
    else if (/^(?:0x[0-9a-fA-F]+|0b[01]+|\d+)$/.test(token)) out += `<span class="tok-number">${escapeHtml(token)}</span>`;
    else out += `<span class="tok-punct">${escapeHtml(token)}</span>`;
    last = match.index + token.length;
  }
  out += escapeHtml(text.slice(last));
  return out;
}

function highlightLine(line) {
  const commentIndex = line.indexOf(";");
  const code = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
  const comment = commentIndex >= 0 ? line.slice(commentIndex) : "";
  const labelMatch = /^(\s*)([A-Za-z_]\w*\s*:)/.exec(code);
  let highlighted = "";
  let rest = code;
  if (labelMatch) {
    highlighted += escapeHtml(labelMatch[1]);
    highlighted += `<span class="tok-label">${escapeHtml(labelMatch[2])}</span>`;
    rest = code.slice(labelMatch[0].length);
  }
  highlighted += highlightCodePart(rest);
  if (comment) highlighted += `<span class="tok-comment">${escapeHtml(comment)}</span>`;
  return highlighted || "&nbsp;";
}

function syncSyntaxScroll() {
  if (!els.syntaxLayer || !els.sourceEditor) return;
  els.syntaxLayer.scrollTop = els.sourceEditor.scrollTop;
  els.syntaxLayer.scrollLeft = els.sourceEditor.scrollLeft;
  els.lineGutter.scrollTop = els.sourceEditor.scrollTop;
}

function renderSyntax() {
  if (!els.syntaxLayer || !els.sourceEditor) return;
  const lines = els.sourceEditor.value.split("\n");
  const html = lines.map((line, idx) => {
    const lineNo = idx + 1;
    const active = lineNo === activeEditorLine ? " active-line" : "";
    return `<div class="syntax-line${active}">${highlightLine(line)}</div>`;
  }).join("");
  els.syntaxLayer.innerHTML = html || '<div class="syntax-line active-line">&nbsp;</div>';
  syncSyntaxScroll();
}

function renderAll() {
  if (!appState) return;
  renderGutter();
  renderErrors();
  renderControls();
  if (!running || clockHz <= 25) renderRegisters();
  renderListing();
  if (activeTab === "memory") renderMemory();
  renderDisplay();
  renderLog();
  setStatus(appState.status || "Ready.");
}

function populateProgramSelect() {
  const select = els.programSelect;
  const prior = select.value;
  select.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select Program";
  select.appendChild(placeholder);
  const newOpt = document.createElement("option");
  newOpt.value = "__new__";
  newOpt.textContent = "New File...";
  select.appendChild(newOpt);

  for (const category of EXAMPLE_CATEGORIES) {
    const records = examples[category] || [];
    if (!records.length) continue;
    const group = document.createElement("optgroup");
    group.label = category;
    for (const record of records) {
      const option = document.createElement("option");
      option.value = optionValue("builtin", category, record.name);
      option.textContent = record.name;
      group.appendChild(option);
    }
    select.appendChild(group);
  }

  if (savedPrograms.length) {
    const group = document.createElement("optgroup");
    group.label = "Browser Saved";
    for (const record of savedPrograms) {
      const option = document.createElement("option");
      option.value = optionValue("local", "Browser Saved", record.name);
      option.textContent = record.name;
      group.appendChild(option);
    }
    select.appendChild(group);
  }

  select.value = prior || "";
}

function renderGutter() {
  const lines = Math.max(1, els.sourceEditor.value.split("\n").length);
  const errorLines = new Set(((appState && appState.errors) || []).map((err) => Number(err.line)).filter(Boolean));
  const execLine = Number((appState && appState.line_for_pc) || 0);
  const frag = document.createDocumentFragment();
  for (let line = 1; line <= lines; line += 1) {
    const div = document.createElement("div");
    div.className = "gutter-line";
    if (breakpoints.has(line)) div.classList.add("breakpoint");
    if (line === execLine) div.classList.add("exec");
    if (line === selectedSourceLine) div.classList.add("selected-source");
    if (errorLines.has(line)) div.classList.add("error");
    div.dataset.line = String(line);
    div.textContent = String(line);
    frag.appendChild(div);
  }
  els.lineGutter.replaceChildren(frag);
  renderSyntax();
}

function renderErrors() {
  const errors = appState.errors || [];
  els.errorBox.classList.remove("has-errors", "ok");
  if (errors.length) {
    els.errorBox.classList.add("has-errors");
    els.errorBox.textContent = errors.map((err) => err.text || err.message).join("\n");
  } else if (appState.loaded) {
    els.errorBox.classList.add("ok");
    els.errorBox.textContent = "Assembly successful";
  } else {
    els.errorBox.textContent = "Assembly errors will appear here";
  }
}

function renderControls() {
  const cpu = appState.cpu || {};
  els.pcValue.textContent = hex(cpu.pc || 0, 4);
  els.instrValue.textContent = `Instructions: ${cpu.instr_count || 0}`;
  els.statusBadge.className = "status-badge";
  if (running) {
    els.statusBadge.classList.add("running");
    els.statusBadge.textContent = "RUNNING";
  } else if (cpu.halted) {
    els.statusBadge.classList.add("halted");
    els.statusBadge.textContent = "HALTED";
  } else if (appState.loaded) {
    els.statusBadge.classList.add("ready");
    els.statusBadge.textContent = "READY";
  } else {
    els.statusBadge.classList.add("idle");
    els.statusBadge.textContent = "IDLE";
  }
  els.stepBtn.disabled = running || !appState.loaded || cpu.halted;
  els.stepBackBtn.disabled = running || !appState.can_step_back;
  els.runBtn.disabled = !appState.loaded || cpu.halted;
  els.runBtn.classList.toggle("running", running);
  setIconButton(els.runBtn, running ? "stop" : "play", running ? "Stop" : "Run");
}

function renderRegisters() {
  const regs = (appState.cpu && appState.cpu.reg) || new Array(8).fill(0);
  if (!els.registerGrid.childElementCount) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 8; i += 1) {
      const card = document.createElement("div");
      card.className = "reg-card";
      card.dataset.reg = String(i);
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.title = `Click to set ${REG_NAMES[i]}`;
      card.innerHTML = `<div class="reg-top"><span class="reg-name" style="background:${REG_ACCENTS[i]}">${REG_NAMES[i]}</span><span class="reg-hex">0x0000</span></div><div class="reg-dec">u=0&nbsp; s=0</div>`;
      frag.appendChild(card);
    }
    els.registerGrid.appendChild(frag);
  }
  Array.from(els.registerGrid.children).forEach((card, i) => {
    const value = regs[i] & 0xffff;
    const changed = previousRegs && value !== (previousRegs[i] & 0xffff);
    card.classList.toggle("changed", Boolean(changed));
    card.querySelector(".reg-hex").textContent = `0x${wordHex(value)}`;
    card.querySelector(".reg-dec").innerHTML = `u=${value}&nbsp; s=${signed16(value)}`;
  });
  previousRegs = regs.slice();
}

function listingSig(listing) {
  return (listing || []).map((entry) => `${entry.addr}:${entry.word}:${entry.lineno}:${entry.error ? 1 : 0}`).join("|");
}

function renderListing() {
  const listing = appState.listing || [];
  const sig = listingSig(listing);
  const tbody = els.listingTable.querySelector("tbody");
  if (sig !== listingSignature) {
    listingSignature = sig;
    const frag = document.createDocumentFragment();
    for (const entry of listing) {
      const tr = document.createElement("tr");
      tr.dataset.addr = String(entry.addr);
      tr.dataset.line = String(entry.lineno || "");
      const bits = (entry.word & 0xffff).toString(2).padStart(16, "0");
      const binary = `${bits.slice(0, 5)} ${bits.slice(5, 8)} ${bits.slice(8, 11)} ${bits.slice(11, 14)} ${bits.slice(14)}`;
      tr.innerHTML = `<td>${hex(entry.addr, 4)}</td><td>0x${wordHex(entry.word)}</td><td>${binary}</td>`;
      frag.appendChild(tr);
    }
    tbody.replaceChildren(frag);
    listingFollowedPc = null;
  }
  // Each time the PC moves, the highlight moves with it; in between, a click
  // on a row or on a source line can move it somewhere else.
  const pc = Number((appState.cpu && appState.cpu.pc) || 0);
  if (pc !== listingFollowedPc) {
    listingFollowedPc = pc;
    listingSelectedAddr = pc;
  }
  markListingRow(false);
}

function markListingRow(scroll) {
  const tbody = els.listingTable.querySelector("tbody");
  let target = null;
  for (const row of tbody.rows) {
    const on = Number(row.dataset.addr) === listingSelectedAddr;
    row.classList.toggle("selected", on);
    if (on) target = row;
  }
  if (scroll && target) target.scrollIntoView({ block: "nearest" });
}

function selectListingForLine(line) {
  const entry = (appState.listing || []).find((item) => item.lineno === line);
  if (!entry) return;
  listingSelectedAddr = entry.addr;
  markListingRow(true);
}

function renderMemory() {
  const table = els.memoryTable;
  const start = clamp(memStart, 0, MEM_SIZE - 1);
  const frag = document.createDocumentFragment();
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Address"].concat(Array.from({ length: 16 }, (_, i) => `+${i.toString(16).toUpperCase()}`)).forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  frag.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (let row = 0; row < 16; row += 1) {
    const tr = document.createElement("tr");
    const base = start + row * 16;
    const addrCell = document.createElement("td");
    addrCell.className = "addr-cell";
    addrCell.textContent = hex(base, 4);
    tr.appendChild(addrCell);
    for (let col = 0; col < 16; col += 1) {
      const addr = base + col;
      const td = document.createElement("td");
      td.className = "byte-cell";
      td.dataset.addr = String(addr);
      if (addr < MEM_SIZE) {
        const value = memBytes[addr] || 0;
        td.textContent = formatByte(value);
        td.classList.toggle("zero", value === 0);
        if (memoryHeatmap) applyHeatmap(td, value);
      } else {
        td.textContent = "--";
        td.classList.add("zero");
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  frag.appendChild(tbody);
  table.replaceChildren(frag);
}

// Studio's "TARA" colour map (src/ui/panels/common.py): creme for 0x00,
// through the border and coffee tones, to maroon for 0xFF.
const HEATMAP_STOPS = [
  [0.0, [0xf7, 0xf4, 0xef]],
  [0.35, [0xe4, 0xd7, 0xcb]],
  [0.65, [0xb2, 0x8a, 0x73]],
  [1.0, [0x7a, 0x1e, 0x2b]],
];

function applyHeatmap(cell, value) {
  const t = value / 255;
  let i = 1;
  while (i < HEATMAP_STOPS.length - 1 && t > HEATMAP_STOPS[i][0]) i += 1;
  const [t0, c0] = HEATMAP_STOPS[i - 1];
  const [t1, c1] = HEATMAP_STOPS[i];
  const f = (t - t0) / (t1 - t0);
  const [r, g, b] = c0.map((c, k) => Math.round(c + (c1[k] - c) * f));
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  cell.style.background = `rgb(${r}, ${g}, ${b})`;
  cell.style.color = luminance > 0.56 ? "#2b2320" : "#fbf8f4";
}

function updateDisplayCanvasCssSize() {
  const stage = els.displayStage;
  const canvas = els.displayCanvas;
  if (!stage || !canvas) return;
  if (displayHFill) {
    stage.classList.add("display-fill");
    return;
  }
  stage.classList.remove("display-fill");
  const rect = stage.getBoundingClientRect();
  let availableHeight = rect.height;
  const panel = stage.querySelector(".game-input-panel");
  if (panel && getComputedStyle(panel).display !== "none") {
    const gap = Number.parseFloat(getComputedStyle(stage).rowGap) || 0;
    availableHeight -= panel.getBoundingClientRect().height + gap;
  }
  const measured = Math.floor(Math.min(rect.width, availableHeight));
  const size = measured > 0 ? measured : 120;
  stage.style.setProperty("--display-canvas-size", `${size}px`);
}

function initDisplayCanvasResize() {
  if (!els.displayStage || !window.ResizeObserver) {
    updateDisplayCanvasCssSize();
    window.addEventListener("resize", updateDisplayCanvasCssSize);
    return;
  }
  displayResizeObserver = new ResizeObserver(updateDisplayCanvasCssSize);
  displayResizeObserver.observe(els.displayStage);
  const panel = els.displayStage.querySelector(".game-input-panel");
  if (panel) displayResizeObserver.observe(panel);
  window.addEventListener("resize", updateDisplayCanvasCssSize);
  updateDisplayCanvasCssSize();
}

function renderDisplay() {
  const canvas = els.displayCanvas;
  const ctx = canvas.getContext("2d");
  const scale = displayGrid ? 8 : 1;
  const canvasWidth = DISPLAY_WIDTH * scale;
  const canvasHeight = DISPLAY_HEIGHT * scale;
  if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
  if (canvas.height !== canvasHeight) canvas.height = canvasHeight;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < DISPLAY_HEIGHT; y += 1) {
    for (let x = 0; x < DISPLAY_WIDTH; x += 1) {
      const index = y * DISPLAY_WIDTH + x;
      const byte = memBytes[DISPLAY_BASE + Math.floor(index / 8)] || 0;
      const bit = (byte >> (7 - (index % 8))) & 1;
      ctx.fillStyle = displayColors[bit ? 1 : 0];
      ctx.fillRect(x * scale, (DISPLAY_HEIGHT - 1 - y) * scale, scale, scale);
    }
  }
  if (displayGrid) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= DISPLAY_WIDTH; i += 1) {
      const p = i * scale + 0.5;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, canvasHeight); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(canvasWidth, p); ctx.stroke();
    }
  }
}

function renderLog() {
  const logs = appState.logs || [];
  const sig = String(logs.length) + (logs.length ? logs[logs.length - 1] : "");
  if (sig === lastLogSig) return;
  lastLogSig = sig;
  els.executionLog.textContent = logs.join("\n");
  els.executionLog.scrollTop = els.executionLog.scrollHeight;
}

function isaRowsForJson() {
  const cpu = new TaraCPU();
  return ISA_ROWS.map((row) => {
    const opcode = OP[row[2]];
    return {
      group: row[0], bg: row[1], inst: row[2], opcode: opcode == null ? "" : String(opcode).padStart(2, "0"),
      format: opcode == null ? "" : cpu.decode(opcode << 11).fmt,
      syntax: row[3], effect: row[4],
    };
  });
}

function renderIsaTable() {
  const tbody = els.isaTable.querySelector("tbody");
  const frag = document.createDocumentFragment();
  for (const row of isaRowsForJson()) {
    const tr = document.createElement("tr");
    tr.style.background = row.bg;
    ["group", "inst", "opcode", "format", "syntax", "effect"].forEach((key) => {
      const td = document.createElement("td");
      td.textContent = row[key] || "";
      if (["inst", "opcode", "format"].indexOf(key) >= 0) td.style.textAlign = "center";
      if (key === "inst") td.style.color = "var(--accent2)";
      tr.appendChild(td);
    });
    frag.appendChild(tr);
  }
  tbody.replaceChildren(frag);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sliderValueForFreq(value) {
  return clamp(Math.round(Math.log10(Math.max(0.1, value)) * 10), -10, 50);
}

function freqForSliderValue(value) {
  return clamp(Math.pow(10, Number(value) / 10), 0.1, 100000);
}

function formatFreq(value) {
  if (value >= 1000) {
    const shown = value / 1000;
    return shown < 10 ? `${shown.toFixed(1)} kHz` : `${Math.round(shown)} kHz`;
  }
  if (value < 10) return `${value.toFixed(1)} Hz`;
  return `${Math.round(value)} Hz`;
}

function parseFreq(text) {
  const raw0 = String(text || "").trim().toLowerCase().replace(/\s+/g, "");
  if (raw0 === "max") return 100000;
  const mult = raw0.endsWith("khz") ? 1000 : 1;
  const raw = raw0.replace(/khz$/, "").replace(/hz$/, "");
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) throw new Error("Invalid clock frequency.");
  return clamp(value * mult, 0.1, 100000);
}

function setClockFrequency(value, updateSlider, updateText) {
  clockHz = clamp(value, 0.1, 100000);
  if (updateText !== false) els.freqText.value = formatFreq(clockHz);
  if (updateSlider !== false) els.freqSlider.value = String(sliderValueForFreq(clockHz));
  if (running) restartRunTimer();
}

function lineStartOffset(source, line) {
  const target = Math.max(1, Number(line) || 1);
  let offset = 0;
  for (let current = 1; current < target; current += 1) {
    const next = source.indexOf("\n", offset);
    if (next < 0) return source.length;
    offset = next + 1;
  }
  return offset;
}

function scrollEditorToLine(line) {
  const computed = getComputedStyle(els.sourceEditor);
  const fontSize = parseFloat(computed.fontSize) || editorFontSize;
  const lineHeight = fontSize * 1.45;
  els.sourceEditor.scrollTop = Math.max(0, (line - 3) * lineHeight);
  els.lineGutter.scrollTop = els.sourceEditor.scrollTop;
  const offset = lineStartOffset(els.sourceEditor.value, line);
  els.sourceEditor.selectionStart = offset;
  els.sourceEditor.selectionEnd = offset;
  selectedSourceLine = line;
  activeEditorLine = line;
  renderGutter();
  syncSyntaxScroll();
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type: type || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function saveMachineState() {
  downloadText("tara_machine_state.json", JSON.stringify(machineStatePayload(), null, 2), "application/json");
  setStatus("Machine state downloaded as tara_machine_state.json.");
}

function finishPowerOff(saved) {
  setStatus(saved ? "Machine state saved. You can close this browser tab." : "Power off requested. You can close this browser tab.");
}

async function bootMachineStateFromFile(file) {
  const payload = JSON.parse(await file.text());
  applyMachineState(payload);
}

function parseCsvOrBytes(text) {
  const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const addressed = [];
  const plain = [];
  let sawAddressRows = false;
  for (const line of rows) {
    if (/^address\s*,/i.test(line)) continue;
    const cells = line.split(/[ ,\t]+/).map((part) => part.trim()).filter(Boolean);
    if (!cells.length) continue;
    if (cells.length >= 2 && /^0x[0-9a-f]+$/i.test(cells[0])) {
      const addr = parseNumber(cells[0]);
      const val = cells.length >= 3 ? parseNumber(cells[2]) : parseNumber(cells[1]);
      addressed.push([addr, val & 0xff]);
      sawAddressRows = true;
    } else {
      for (const cell of cells) {
        if (/^[a-z_]+$/i.test(cell)) continue;
        plain.push(parseNumber(cell) & 0xff);
      }
    }
  }
  return sawAddressRows ? { addressed } : { plain };
}

function contiguousRuns(pairs) {
  const sorted = pairs.slice().sort((a, b) => a[0] - b[0]);
  const runs = [];
  let start = null;
  let prev = null;
  let data = [];
  for (const pair of sorted) {
    const addr = pair[0];
    const value = pair[1];
    if (start === null || addr !== prev + 1) {
      if (data.length) runs.push([start, data]);
      start = addr;
      data = [];
    }
    data.push(value & 0xff);
    prev = addr;
  }
  if (data.length) runs.push([start, data]);
  return runs;
}

async function importMemoryFile() {
  const file = els.memoryImportInput.files && els.memoryImportInput.files[0];
  if (!file) {
    setStatus("Choose a CSV or text file to import.");
    return;
  }
  const parsed = parseCsvOrBytes(await file.text());
  if (parsed.addressed) {
    for (const run of contiguousRuns(parsed.addressed)) writeMemoryRegion(run[0], run[1]);
    setStatus(`Imported ${parsed.addressed.length} addressed bytes into memory.`);
  } else {
    const start = parseNumber(els.importStart.value);
    writeMemoryRegion(start, parsed.plain || []);
    setStatus(`Imported ${(parsed.plain || []).length} bytes at ${hex(start, 4)}.`);
  }
  renderMemory();
}

function randomFillMemory() {
  const start = parseNumber(els.randomStart.value);
  const count = clamp(parseNumber(els.randomCount.value), 1, MEM_SIZE);
  let min = parseNumber(els.randomMin.value);
  let max = parseNumber(els.randomMax.value);
  if (min > max) [min, max] = [max, min];
  min = clamp(min, 0, 255);
  max = clamp(max, 0, 255);
  const data = Array.from({ length: count }, () => min + Math.floor(Math.random() * (max - min + 1)));
  writeMemoryRegion(start, data);
  memStart = start;
  els.memJump.value = hex(memStart, 3);
  renderMemory();
}

function exportMemoryCsv() {
  const start = clamp(parseNumber(els.exportStart.value), 0, MEM_SIZE - 1);
  const count = clamp(parseNumber(els.exportCount.value), 1, MEM_SIZE - start);
  const includeZeros = els.exportIncludeZeros.checked;
  const rows = ["address,hex,decimal"];
  for (let i = 0; i < count; i += 1) {
    const addr = start + i;
    const value = memBytes[addr] || 0;
    if (!includeZeros && value === 0) continue;
    rows.push(`${hex(addr, 4)},${byteHex(value)},${value}`);
  }
  downloadText("memory_dump.csv", `${rows.join("\n")}\n`, "text/csv");
  setStatus(`Exported ${rows.length - 1} memory rows to memory_dump.csv.`);
}

// The display pixel under the pointer, in TARA's coordinates (y = 0 is the
// bottom row), or null. The canvas has a thick border, so positions are
// measured from its content box, not from its outer edge.
function displayCellAt(event) {
  const canvas = els.displayCanvas;
  const rect = canvas.getBoundingClientRect();
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return null;
  const x = Math.floor(((event.clientX - rect.left - canvas.clientLeft) / width) * DISPLAY_WIDTH);
  const screenY = Math.floor(((event.clientY - rect.top - canvas.clientTop) / height) * DISPLAY_HEIGHT);
  const y = DISPLAY_HEIGHT - 1 - screenY;
  if (x < 0 || y < 0 || x >= DISPLAY_WIDTH || y >= DISPLAY_HEIGHT) return null;
  return { x, y };
}

function showDisplayCoord(event) {
  const tip = els.displayCoord;
  const cell = event.pointerType === "touch" ? null : displayCellAt(event);
  if (!cell) { tip.hidden = true; return; }
  tip.textContent = `x=${cell.x}, y=${cell.y}`;
  tip.hidden = false;
  const stage = els.displayStage.getBoundingClientRect();
  let left = event.clientX - stage.left + 14;
  let top = event.clientY - stage.top + 16;
  if (left + tip.offsetWidth > stage.width - 4) left = event.clientX - stage.left - tip.offsetWidth - 10;
  if (top + tip.offsetHeight > stage.height - 4) top = event.clientY - stage.top - tip.offsetHeight - 10;
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

async function toggleDisplayPixel(event) {
  const cell = displayCellAt(event);
  if (!cell) return;
  const { x, y } = cell;
  const index = y * DISPLAY_WIDTH + x;
  const byteIndex = Math.floor(index / 8);
  const shift = 7 - (index % 8);
  const addr = DISPLAY_BASE + byteIndex;
  const cur = session.cpu.mem[addr] || 0;
  session.cpu.mem[addr] = cur ^ (1 << shift);
  session.status = `Display I/O: 0x${wordHex(addr)} <- 0x${byteHex(session.cpu.mem[addr])}`;
  syncState();
  focusDisplayCanvas(false);
}

function keyBitForEvent(event) {
  const key = event.key.toLowerCase();
  if (key === "arrowup" || key === "w") return 0x01;
  if (key === "arrowdown" || key === "s") return 0x02;
  if (key === "arrowleft" || key === "a") return 0x04;
  if (key === "arrowright" || key === "d") return 0x08;
  if (key === "q") return 0x10;
  return 0;
}

function isPhoneGameInputEnabled() {
  if (!phoneGameInputMedia && window.matchMedia) {
    phoneGameInputMedia = window.matchMedia(PHONE_GAME_INPUT_QUERY);
  }
  return Boolean(phoneGameInputMedia && phoneGameInputMedia.matches);
}

function syncDisplayFocusMode() {
  document.body.classList.toggle("display-focus-mode", activeTab === "display");
  if (activeTab !== "display" && displayHFill) {
    displayHFill = false;
    if (els.displayExpandBtn) {
      els.displayExpandBtn.innerHTML = ICONS.expand;
      els.displayExpandBtn.title = "Fill panel horizontally";
      els.displayExpandBtn.setAttribute("aria-label", "Fill panel horizontally");
    }
  }
  if (activeTab !== "display" || !isPhoneGameInputEnabled()) releaseAllDisplayInputs();
  requestAnimationFrame(updateDisplayCanvasCssSize);
}

function bindGameInputPanel() {
  if (window.matchMedia) {
    phoneGameInputMedia = window.matchMedia(PHONE_GAME_INPUT_QUERY);
    const handleMediaChange = () => syncDisplayFocusMode();
    if (phoneGameInputMedia.addEventListener) phoneGameInputMedia.addEventListener("change", handleMediaChange);
    else if (phoneGameInputMedia.addListener) phoneGameInputMedia.addListener(handleMediaChange);
  }

  document.querySelectorAll(".gamepad-button[data-key-bit]").forEach((button) => {
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("pointerdown", (event) => {
      if (!isPhoneGameInputEnabled()) return;
      const bit = Number(button.dataset.keyBit || 0) & 0xff;
      if (!bit) return;
      event.preventDefault();
      try { button.setPointerCapture(event.pointerId); } catch (_err) { /* pointer capture is best effort */ }
      activeGameInputPointers.set(event.pointerId, { bit, button });
      setGameButtonPressed(button, true);
      recomputeGameInputBits();
      focusDisplayCanvas(true);
    });

    button.addEventListener("pointerup", (event) => {
      event.preventDefault();
      releaseGameInputPointer(event.pointerId);
    });
    button.addEventListener("pointercancel", (event) => releaseGameInputPointer(event.pointerId));
    button.addEventListener("lostpointercapture", (event) => releaseGameInputPointer(event.pointerId));
    button.addEventListener("click", (event) => event.preventDefault());
  });

  window.addEventListener("blur", releaseAllDisplayInputs);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseAllDisplayInputs();
  });
}

async function importDisplayImage(file) {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = DISPLAY_WIDTH;
  canvas.height = DISPLAY_HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const out = new Uint8Array(DISPLAY_BYTES);
  const off = hexColorToRgb(displayColors[0]);
  const on = hexColorToRgb(displayColors[1]);
  for (let srcY = 0; srcY < canvas.height; srcY += 1) {
    const displayY = canvas.height - 1 - srcY;
    for (let x = 0; x < canvas.width; x += 1) {
      const p = (srcY * canvas.width + x) * 4;
      const rgb = [pixels[p], pixels[p + 1], pixels[p + 2]];
      const bit = colorDistance(rgb, on) <= colorDistance(rgb, off) ? 1 : 0;
      const index = displayY * canvas.width + x;
      if (bit) out[Math.floor(index / 8)] |= 1 << (7 - (index % 8));
    }
  }
  writeMemoryRegion(DISPLAY_BASE, out);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not load image.")); };
    img.src = url;
  });
}

function hexColorToRgb(color) {
  const raw = color.replace("#", "");
  return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
}

function colorDistance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function setCssSize(name, value) {
  document.documentElement.style.setProperty(name, `${value}px`);
}

function focusDisplayCanvas(preventScroll) {
  try {
    els.displayCanvas.focus({ preventScroll: Boolean(preventScroll) });
  } catch (_err) {
    els.displayCanvas.focus();
  }
}

function setIconButton(button, iconName, label) {
  if (!button || !ICONS[iconName]) return;
  button.classList.add("button-with-icon");
  button.innerHTML = `${ICONS[iconName]}<span>${escapeHtml(label)}</span>`;
}

function setIconOnlyButton(button, iconName, ariaLabel) {
  if (!button || !ICONS[iconName]) return;
  button.classList.add("button-with-icon", "icon-only");
  button.setAttribute("aria-label", ariaLabel);
  button.title = button.title || ariaLabel;
  button.innerHTML = `${ICONS[iconName]}<span>${escapeHtml(ariaLabel)}</span>`;
}

function clampSplitterWidth(px) {
  const shell = document.querySelector(".app-shell");
  if (!shell) return px;
  const rect = shell.getBoundingClientRect();
  const minLeft = 360;
  const minRight = 420;
  const splitterAndGaps = 26;
  const maxLeft = Math.max(minLeft, rect.width - minRight - splitterAndGaps);
  return clamp(px, minLeft, maxLeft);
}

function setSplitterWidth(px, persist) {
  const shell = document.querySelector(".app-shell");
  if (!shell) return;
  const width = clampSplitterWidth(px);
  shell.style.setProperty("--left-pane-width", `${width}px`);
  if (persist) localStorage.setItem("tara-main-splitter-left-width", String(Math.round(width)));
}

function restoreSplitterWidth() {
  const saved = Number(localStorage.getItem("tara-main-splitter-left-width"));
  if (Number.isFinite(saved) && saved > 0) setSplitterWidth(saved, false);
}

function bindMainSplitter() {
  const splitter = els.mainSplitter;
  const shell = document.querySelector(".app-shell");
  if (!splitter || !shell) return;

  splitter.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    splitter.setPointerCapture(event.pointerId);
    document.body.classList.add("dragging-main-splitter");
  });

  splitter.addEventListener("pointermove", (event) => {
    if (!document.body.classList.contains("dragging-main-splitter")) return;
    const rect = shell.getBoundingClientRect();
    setSplitterWidth(event.clientX - rect.left - 8, true);
  });

  const endDrag = (event) => {
    if (event && splitter.hasPointerCapture && splitter.hasPointerCapture(event.pointerId)) {
      splitter.releasePointerCapture(event.pointerId);
    }
    document.body.classList.remove("dragging-main-splitter");
  };
  splitter.addEventListener("pointerup", endDrag);
  splitter.addEventListener("pointercancel", endDrag);

  splitter.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const current = Number.parseFloat(getComputedStyle(shell).getPropertyValue("--left-pane-width")) || shell.getBoundingClientRect().width / 2;
    const delta = event.key === "ArrowLeft" ? -24 : 24;
    setSplitterWidth(current + delta, true);
  });

  window.addEventListener("resize", () => {
    const current = Number.parseFloat(getComputedStyle(shell).getPropertyValue("--left-pane-width"));
    if (Number.isFinite(current)) setSplitterWidth(current, false);
  });
}

function applyButtonIcons() {
  setIconOnlyButton(els.openProgramBtn, "open", "Open assembly file");
  setIconOnlyButton(els.deleteProgramBtn, "delete", "Delete program");
  setIconButton(els.openCompilerBtn, "compiler", "C");
  els.isaBtn.classList.remove("button-with-icon", "icon-only");
  els.isaBtn.textContent = "ISA";
  setIconOnlyButton(els.powerBtn, "power", "Power off");
  setIconButton(els.assembleBtn, "load", "Load");
  setIconButton(els.stepBackBtn, "back", "Back");
  setIconButton(els.stepBtn, "step", "Step");
  setIconButton(els.runBtn, running ? "stop" : "play", running ? "Stop" : "Run");
  setIconButton(els.resetBtn, "reset", "RESET");
  setIconButton(els.saveStateBtn, "save", "SAVE");
  setIconButton(els.bootStateBtn, "boot", "BOOT");
  setIconButton(els.memToolsBtn, "memory", "Memory Tools");
  setIconButton(els.displayGridBtn, "grid", displayGrid ? "Grid ON" : "Grid OFF");
  setIconButton(els.displayImportBtn, "image", "Import Image");
  setIconButton(els.displayClearBtn, "clear", "Clear");
  setIconButton(els.clearLogBtn, "clear", "Clear");
  els.displayExpandBtn.innerHTML = ICONS.expand;
}

function adjustFont(kind, delta) {
  if (kind === "editor") {
    editorFontSize = clamp(editorFontSize + delta, 10, 28);
    setCssSize("--editor-font-size", editorFontSize);
    renderGutter();
    syncSyntaxScroll();
  } else if (kind === "listing") {
    listingFontSize = clamp(listingFontSize + delta, 9, 40);
    setCssSize("--listing-font-size", listingFontSize);
  } else if (kind === "memory") {
    memoryFontSize = clamp(memoryFontSize + delta, 9, 24);
    setCssSize("--memory-font-size", memoryFontSize);
    if (activeTab === "memory") renderMemory();
  } else if (kind === "log") {
    logFontSize = clamp(logFontSize + delta, 9, 30);
    setCssSize("--log-font-size", logFontSize);
  } else if (kind === "isa") {
    isaFontSize = clamp(isaFontSize + delta, 11, 30);
    setCssSize("--isa-font-size", isaFontSize);
  }
}

function loadBuiltinProgram(category, name) {
  const record = (examples[category] || []).find((item) => item.name === name);
  if (!record) return;
  stopRun(false);
  session.source = record.source;
  setBreakpoints([]);
  setCurrentProgram("builtin", name, record.path);
  session.status = `Loaded ${name}.`;
  syncState({ syncSource: true });
}

function loadLocalProgram(name) {
  const record = savedPrograms.find((item) => item.name === name);
  if (!record) return;
  stopRun(false);
  session.source = record.source;
  setBreakpoints([]);
  setCurrentProgram("local", name, null);
  session.status = `Loaded ${name}.`;
  syncState({ syncSource: true });
}

function newProgram() {
  const name = prompt("Program name:");
  if (!name) {
    els.programSelect.value = "";
    return;
  }
  stopRun(false);
  session.source = "";
  setBreakpoints([]);
  setCurrentProgram("local", name.trim(), null);
  session.status = `New program ${name.trim()} created.`;
  syncState({ syncSource: true });
}

function saveProgram() {
  const fallback = session.currentProgramName || "New Program";
  const name = prompt("Save program as:", fallback);
  if (!name) return;
  const record = upsertSavedProgram(name.trim(), els.sourceEditor.value);
  session.source = els.sourceEditor.value;
  setCurrentProgram("local", record.name, null);
  session.status = `Program saved in browser storage as ${record.name}.`;
  populateProgramSelect();
  els.programSelect.value = optionValue("local", "Browser Saved", record.name);
  syncState();
}

function deleteProgram() {
  if (session.currentProgramKind !== "local" || !session.currentProgramName) {
    alert("This static version can only delete programs saved in Browser Saved storage. Bundled examples are read-only.");
    return;
  }
  if (!confirm(`Delete ${session.currentProgramName} from browser storage?`)) return;
  deleteSavedProgram(session.currentProgramName);
  session.source = "";
  setBreakpoints([]);
  setCurrentProgram("", "", null);
  session.status = "Program deleted from browser storage.";
  populateProgramSelect();
  syncState({ syncSource: true });
}

function renameProgram() {
  const name = prompt("New program name:", session.currentProgramName || "");
  if (!name) return;
  if (session.currentProgramKind === "local" && session.currentProgramName) deleteSavedProgram(session.currentProgramName);
  const record = upsertSavedProgram(name.trim(), els.sourceEditor.value);
  session.source = els.sourceEditor.value;
  setCurrentProgram("local", record.name, null);
  session.status = `Renamed program to ${record.name} in browser storage.`;
  populateProgramSelect();
  els.programSelect.value = optionValue("local", "Browser Saved", record.name);
  syncState();
}

function promptRegisterValue(index) {
  const i = Number(index);
  if (!Number.isInteger(i) || i < 0 || i >= REG_NAMES.length) return;
  const current = session.cpu.reg[i] & 0xffff;
  const message = `${REG_NAMES[i]} = 0x${wordHex(current)}  (u=${current}, s=${signed16(current)})\n`
    + "New value (0x hex, 0b binary, or decimal):";
  const raw = prompt(message, `0x${wordHex(current)}`);
  if (raw === null) return;
  try { writeRegister(i, parseNumber(raw)); }
  catch (err) { setStatus(err.message); }
}

function promptMemoryValue(addr) {
  const a = Number(addr);
  if (!Number.isInteger(a) || a < 0 || a >= MEM_SIZE) return;
  const current = session.cpu.mem[a] & 0xff;
  const message = `Memory ${hex(a, 4)} = 0x${byteHex(current)}  (${current})\n`
    + "New byte (0x hex, 0b binary, or decimal):";
  const raw = prompt(message, memoryRadix === "dec" ? String(current) : `0x${byteHex(current)}`);
  if (raw === null) return;
  try { writeMemory(a, parseNumber(raw) & 0xff); }
  catch (err) { setStatus(err.message); }
}

function bindEvents() {
  bindGameInputPanel();

  els.sourceEditor.addEventListener("input", () => {
    activeEditorLine = lineAtCaret();
    renderGutter();
  });
  els.sourceEditor.addEventListener("scroll", syncSyntaxScroll);
  els.sourceEditor.addEventListener("click", updateActiveEditorLine);
  els.sourceEditor.addEventListener("keyup", updateActiveEditorLine);
  els.sourceEditor.addEventListener("select", updateActiveEditorLine);
  els.sourceEditor.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const start = els.sourceEditor.selectionStart;
      const end = els.sourceEditor.selectionEnd;
      els.sourceEditor.value = `${els.sourceEditor.value.slice(0, start)}    ${els.sourceEditor.value.slice(end)}`;
      els.sourceEditor.selectionStart = els.sourceEditor.selectionEnd = start + 4;
      activeEditorLine = lineAtCaret();
      renderGutter();
    }
  });

  els.lineGutter.addEventListener("click", (event) => {
    const lineEl = event.target.closest(".gutter-line");
    if (!lineEl) return;
    const line = Number(lineEl.dataset.line);
    if (breakpoints.has(line)) breakpoints.delete(line);
    else breakpoints.add(line);
    rebuildBreakpointAddrs();
    renderGutter();
    if (session.loaded) {
      const count = session.breakpointAddrs.size;
      session.status = `${count} active breakpoint${count === 1 ? "" : "s"} mapped to instructions.`;
      syncState();
    }
  });

  els.programSelect.addEventListener("change", () => {
    const value = els.programSelect.value;
    if (value === "__new__") { newProgram(); return; }
    if (!value) return;
    const parsed = parseOptionValue(value);
    if (parsed.kind === "builtin") loadBuiltinProgram(parsed.category, parsed.name);
    else if (parsed.kind === "local") loadLocalProgram(parsed.name);
  });

  els.openProgramBtn.addEventListener("click", () => els.openFileInput.click());
  els.openCompilerBtn.addEventListener("click", () => {
    window.open(TARA_COMPILER_URL, "_blank", "noopener,noreferrer");
  });
  els.openFileInput.addEventListener("change", async () => {
    const file = els.openFileInput.files && els.openFileInput.files[0];
    if (!file) return;
    session.source = await file.text();
    setBreakpoints([]);
    setCurrentProgram("file", file.name.replace(/\.[^.]+$/, ""), file.name);
    session.status = `Opened ${file.name}.`;
    syncState({ syncSource: true });
    els.openFileInput.value = "";
  });

  els.deleteProgramBtn.addEventListener("click", deleteProgram);
  els.isaBtn.addEventListener("click", () => els.isaDialog.showModal());
  els.isaCloseBtn.addEventListener("click", () => els.isaDialog.close());
  els.powerBtn.addEventListener("click", () => {
    els.powerDialog.showModal();
  });
  els.powerYesBtn.addEventListener("click", () => {
    saveMachineState();
    els.powerDialog.close();
    finishPowerOff(true);
  });
  els.powerNoBtn.addEventListener("click", () => {
    els.powerDialog.close();
    finishPowerOff(false);
  });

  els.editorFontDec.addEventListener("click", () => adjustFont("editor", -1));
  els.editorFontInc.addEventListener("click", () => adjustFont("editor", 1));
  els.listingFontDec.addEventListener("click", () => adjustFont("listing", -1));
  els.listingFontInc.addEventListener("click", () => adjustFont("listing", 1));
  els.memoryFontDec.addEventListener("click", () => adjustFont("memory", -1));
  els.memoryFontInc.addEventListener("click", () => adjustFont("memory", 1));
  els.logFontDec.addEventListener("click", () => adjustFont("log", -1));
  els.logFontInc.addEventListener("click", () => adjustFont("log", 1));
  els.isaFontDec.addEventListener("click", () => adjustFont("isa", -1));
  els.isaFontInc.addEventListener("click", () => adjustFont("isa", 1));

  els.collapseControls.addEventListener("click", () => {
    els.controlPanel.classList.toggle("collapsed");
    els.collapseControls.textContent = els.controlPanel.classList.contains("collapsed") ? "+" : "-";
  });
  els.registerGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".reg-card");
    if (card) promptRegisterValue(Number(card.dataset.reg));
  });
  els.registerGrid.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest(".reg-card");
    if (!card) return;
    event.preventDefault();
    promptRegisterValue(Number(card.dataset.reg));
  });

  els.collapseRegisters.addEventListener("click", () => {
    els.registerPanel.classList.toggle("collapsed");
    els.collapseRegisters.textContent = els.registerPanel.classList.contains("collapsed") ? "+" : "-";
  });

  els.assembleBtn.addEventListener("click", assembleEditorSource);
  els.stepBtn.addEventListener("click", stepCpu);
  els.stepBackBtn.addEventListener("click", stepBackCpu);
  els.runBtn.addEventListener("click", toggleRun);
  els.resetBtn.addEventListener("click", resetCpu);
  els.saveStateBtn.addEventListener("click", saveMachineState);
  els.bootStateBtn.addEventListener("click", () => els.bootStateInput.click());
  els.bootStateInput.addEventListener("change", async () => {
    const file = els.bootStateInput.files && els.bootStateInput.files[0];
    if (!file) return;
    try { await bootMachineStateFromFile(file); } catch (err) { alert(err.message); }
    els.bootStateInput.value = "";
  });

  els.freqText.addEventListener("change", () => {
    try { setClockFrequency(parseFreq(els.freqText.value), true, true); }
    catch (_err) { els.freqText.value = formatFreq(clockHz); }
  });
  els.freqSlider.addEventListener("input", () => setClockFrequency(freqForSliderValue(els.freqSlider.value), false, true));

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.dataset.tab;
      syncDisplayFocusMode();
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab === button));
      document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));
      $(`tab-${activeTab}`).classList.add("active");
      if (activeTab === "memory") renderMemory();
      if (activeTab === "display") { $("tab-display").scrollTop = 0; updateDisplayCanvasCssSize(); focusDisplayCanvas(true); }
    });
  });

  els.listingTable.addEventListener("click", (event) => {
    const row = event.target.closest("tr[data-line]");
    if (!row) return;
    listingSelectedAddr = Number(row.dataset.addr);
    markListingRow(false);
    const line = Number(row.dataset.line);
    if (line > 0) scrollEditorToLine(line);
  });

  els.memJump.addEventListener("change", () => {
    try { memStart = clamp(parseNumber(els.memJump.value), 0, MEM_SIZE - 1); }
    catch (_err) { /* keep old address */ }
    els.memJump.value = hex(memStart, 3);
    renderMemory();
  });
  els.memPrevBtn.addEventListener("click", () => { memStart = Math.max(0, memStart - 256); els.memJump.value = hex(memStart, 3); renderMemory(); });
  els.memNextBtn.addEventListener("click", () => { memStart = Math.min(MEM_SIZE - 256, memStart + 256); els.memJump.value = hex(memStart, 3); renderMemory(); });
  els.memoryTable.addEventListener("click", (event) => {
    const cell = event.target.closest(".byte-cell");
    if (!cell) return;
    promptMemoryValue(Number(cell.dataset.addr));
  });
  els.memRadixBtn.addEventListener("click", () => {
    setMemoryRadix(memoryRadix === "hex" ? "dec" : "hex");
    setStatus(memoryRadix === "dec" ? "Memory bytes shown in decimal." : "Memory bytes shown in hexadecimal.");
  });

  els.memToolsBtn.addEventListener("click", () => els.memoryToolsDialog.showModal());
  els.memoryToolsCloseBtn.addEventListener("click", () => els.memoryToolsDialog.close());
  els.randomFillBtn.addEventListener("click", randomFillMemory);
  els.memoryImportBtn.addEventListener("click", importMemoryFile);
  els.memoryExportBtn.addEventListener("click", exportMemoryCsv);
  els.heatmapToggle.addEventListener("change", () => { memoryHeatmap = els.heatmapToggle.checked; if (activeTab === "memory") renderMemory(); });

  els.displayGridBtn.addEventListener("click", () => {
    displayGrid = !displayGrid;
    setIconButton(els.displayGridBtn, "grid", displayGrid ? "Grid ON" : "Grid OFF");
    renderDisplay();
  });
  els.displayOffColor.addEventListener("input", () => { displayColors[0] = els.displayOffColor.value; renderDisplay(); });
  els.displayOnColor.addEventListener("input", () => { displayColors[1] = els.displayOnColor.value; renderDisplay(); });
  els.displayCanvas.addEventListener("click", toggleDisplayPixel);
  els.displayCanvas.addEventListener("pointermove", showDisplayCoord);
  els.displayCanvas.addEventListener("pointerleave", () => { els.displayCoord.hidden = true; });
  els.displayCanvas.addEventListener("keydown", (event) => {
    const bit = keyBitForEvent(event);
    if (!bit) return;
    event.preventDefault();
    setKeyboardInputBit(bit, true);
  });
  els.displayCanvas.addEventListener("keyup", (event) => {
    if (event.repeat) return;
    const bit = keyBitForEvent(event);
    if (!bit) return;
    event.preventDefault();
    setKeyboardInputBit(bit, false);
  });
  els.displayImportBtn.addEventListener("click", () => els.displayImportInput.click());
  els.displayImportInput.addEventListener("change", async () => {
    const file = els.displayImportInput.files && els.displayImportInput.files[0];
    if (!file) return;
    await importDisplayImage(file);
    els.displayImportInput.value = "";
  });
  els.displayClearBtn.addEventListener("click", clearDisplay);
  els.displayExpandBtn.addEventListener("click", () => {
    displayHFill = !displayHFill;
    els.displayExpandBtn.innerHTML = displayHFill ? ICONS.collapse : ICONS.expand;
    els.displayExpandBtn.title = displayHFill ? "Collapse display" : "Fill panel horizontally";
    els.displayExpandBtn.setAttribute("aria-label", els.displayExpandBtn.title);
    updateDisplayCanvasCssSize();
  });
  els.clearLogBtn.addEventListener("click", () => { session.logs = []; session.status = "Execution log cleared."; syncState(); });
}

function initContentProtection() {
  // Disable right-click context menu everywhere except editor inputs (to preserve copy/paste).
  document.addEventListener("contextmenu", (e) => {
    const tag = e.target && e.target.tagName;
    if (tag === "TEXTAREA" || tag === "INPUT") return;
    e.preventDefault();
  });

  // Block browser "Save Page" (Ctrl+S) and "View Source" (Ctrl+U) globally.
  // Block common DevTools shortcuts when focus is outside an editor field.
  document.addEventListener("keydown", (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && (e.key === "s" || e.key === "S")) { e.preventDefault(); return; }
    if (ctrl && (e.key === "u" || e.key === "U")) { e.preventDefault(); return; }
    const tag = document.activeElement && document.activeElement.tagName;
    const inField = tag === "TEXTAREA" || tag === "INPUT";
    if (!inField) {
      if (e.key === "F12") { e.preventDefault(); return; }
      if (ctrl && e.shiftKey) {
        const k = e.key.toUpperCase();
        if (k === "I" || k === "J" || k === "C") { e.preventDefault(); return; }
      }
    }
  });

  // Prevent images from being dragged to desktop or another tab.
  document.querySelectorAll("img").forEach((img) => { img.draggable = false; });
}

function init() {
  cacheElements();
  restoreSplitterWidth();
  applyButtonIcons();
  bindEvents();
  initDisplayCanvasResize();
  syncDisplayFocusMode();
  bindMainSplitter();
  populateProgramSelect();
  setMemoryRadix(memoryRadix);
  renderIsaTable();
  setClockFrequency(10, true, true);
  syncState({ syncSource: true });
  initContentProtection();
}

window.addEventListener("DOMContentLoaded", () => {
  try { init(); } catch (err) { setStatus(err.message); }
});
