import React, { useState, useEffect } from 'react';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=JetBrains+Mono:wght@300;400;500&display=swap');

.calc-root, .calc-root *, .calc-root *::before, .calc-root *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.calc-root {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background: #0a0a0f;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  padding: 24px;
  isolation: isolate;
}

.calc-root .grain {
  position: absolute;
  inset: -25%;
  pointer-events: none;
  opacity: 0.085;
  z-index: 2;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  mix-blend-mode: overlay;
}

.calc-root .ambient-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(110px);
  pointer-events: none;
  z-index: 1;
  will-change: transform;
}

.calc-root .blob-1 {
  width: 620px; height: 620px;
  background: radial-gradient(circle, rgba(212, 165, 116, 0.34), transparent 70%);
  top: -180px; left: -220px;
  animation: drift1 24s ease-in-out infinite;
}

.calc-root .blob-2 {
  width: 520px; height: 520px;
  background: radial-gradient(circle, rgba(52, 102, 205, 0.22), transparent 70%);
  bottom: -140px; right: -160px;
  animation: drift2 30s ease-in-out infinite;
}

.calc-root .blob-3 {
  width: 440px; height: 440px;
  background: radial-gradient(circle, rgba(180, 90, 70, 0.18), transparent 70%);
  top: 45%; left: 50%;
  animation: drift3 26s ease-in-out infinite;
}

@keyframes drift1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(140px, 90px) scale(1.05); }
  66%      { transform: translate(70px, 210px) scale(0.95); }
}
@keyframes drift2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(-120px, -140px) scale(1.08); }
}
@keyframes drift3 {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50%      { transform: translate(-30%, -72%) scale(1.1); }
}

.calc-root .calc-card {
  position: relative;
  z-index: 10;
  width: 380px;
  padding: 26px;
  border-radius: 32px;
  background:
    linear-gradient(155deg, rgba(34, 34, 44, 0.62), rgba(14, 14, 22, 0.86));
  backdrop-filter: blur(26px) saturate(180%);
  -webkit-backdrop-filter: blur(26px) saturate(180%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0 60px rgba(255, 220, 180, 0.03),
    0 0 0 1px rgba(255, 255, 255, 0.04),
    0 50px 100px -20px rgba(0, 0, 0, 0.95),
    0 30px 60px -15px rgba(0, 0, 0, 0.75),
    0 0 90px rgba(212, 165, 116, 0.06);
  opacity: 0;
  transform: translateY(48px) scale(0.96);
  transition:
    opacity 0.95s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.95s cubic-bezier(0.16, 1, 0.3, 1);
}

.calc-root .calc-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 14%;
  right: 14%;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 220, 180, 0.55),
    rgba(255, 230, 200, 0.7),
    rgba(255, 220, 180, 0.55),
    transparent);
  box-shadow: 0 0 12px rgba(255, 200, 150, 0.4);
}

.calc-root .calc-card.mounted {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.calc-root .calc-card.shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

@keyframes shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-10px); }
  40%, 60% { transform: translateX(10px); }
}

.calc-root .display {
  position: relative;
  padding: 18px 22px 20px;
  margin-bottom: 22px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(0,0,0,0.58), rgba(0,0,0,0.3));
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.72),
    inset 0 0 42px rgba(0, 0, 0, 0.5),
    0 1px 0 rgba(255, 255, 255, 0.04);
  overflow: hidden;
  min-height: 132px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.calc-root .display-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.45em;
  color: rgba(255, 220, 180, 0.34);
  text-transform: uppercase;
  margin-bottom: 6px;
  position: relative;
  z-index: 3;
}

.calc-root .led {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 180, 100, 0.95);
  box-shadow: 0 0 8px rgba(255, 180, 100, 0.8);
  animation: ledPulse 2.4s ease-in-out infinite;
  margin-left: 6px;
  vertical-align: middle;
}

.calc-root .led.error {
  background: rgba(255, 90, 70, 0.95);
  box-shadow: 0 0 10px rgba(255, 80, 60, 0.9);
  animation: ledPulse 0.6s ease-in-out infinite;
}

@keyframes ledPulse {
  0%, 100% { opacity: 0.45; }
  50%      { opacity: 1; }
}

.calc-root .prev-expression {
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 300;
  color: rgba(255, 220, 180, 0.44);
  letter-spacing: 0.08em;
  min-height: 17px;
  text-shadow: 0 0 8px rgba(255, 200, 150, 0.18);
  position: relative;
  z-index: 3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calc-root .current-value-wrapper {
  text-align: right;
  margin-top: 4px;
  height: 62px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  overflow: hidden;
  position: relative;
  z-index: 3;
}

.calc-root .current-value {
  font-family: 'DM Serif Display', 'Cormorant Garamond', serif;
  font-size: 54px;
  font-weight: 400;
  color: rgba(255, 245, 230, 0.97);
  text-shadow:
    0 0 22px rgba(255, 220, 180, 0.22),
    0 0 44px rgba(255, 200, 150, 0.08);
  line-height: 1;
  letter-spacing: -0.012em;
  animation: digitIn 0.36s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}

.calc-root .current-value.long      { font-size: 40px; }
.calc-root .current-value.very-long { font-size: 30px; }

.calc-root .current-value.error {
  color: rgba(255, 130, 110, 0.96);
  text-shadow:
    0 0 22px rgba(255, 100, 80, 0.45),
    0 0 40px rgba(255, 80, 60, 0.2);
  font-style: italic;
}

@keyframes digitIn {
  from { opacity: 0; transform: translateY(14px); filter: blur(2px); }
  to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
}

.calc-root .scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.14) 2px,
    rgba(0, 0, 0, 0.14) 3px
  );
  opacity: 0.6;
  border-radius: inherit;
  z-index: 2;
}

.calc-root .display::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(255, 220, 180, 0.05),
    transparent 30%,
    transparent 70%,
    rgba(0, 0, 0, 0.38)
  );
  pointer-events: none;
  border-radius: inherit;
  z-index: 1;
}

.calc-root .buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.calc-root .btn {
  position: relative;
  height: 66px;
  border: none;
  border-radius: 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 22px;
  font-weight: 400;
  cursor: pointer;
  overflow: hidden;
  user-select: none;
  outline: none;
  letter-spacing: 0.02em;
  opacity: 0;
  transform: translateY(18px) scale(0.94);
  transition:
    transform 0.14s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.22s ease,
    filter 0.2s ease,
    background 0.25s ease;
  color: inherit;
}

.calc-root .calc-card.mounted .btn {
  animation: btnReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes btnReveal {
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.calc-root .btn-number {
  background: linear-gradient(160deg, rgba(46, 46, 58, 0.88), rgba(22, 22, 30, 0.96));
  color: rgba(245, 240, 230, 0.96);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.022),
    0 1px 2px rgba(0, 0, 0, 0.5),
    0 6px 16px -3px rgba(0, 0, 0, 0.55);
}

.calc-root .btn-function {
  background: linear-gradient(160deg, rgba(64, 64, 78, 0.88), rgba(34, 34, 46, 0.96));
  color: rgba(220, 220, 230, 0.92);
  font-size: 17px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 1px 2px rgba(0, 0, 0, 0.5),
    0 6px 16px -3px rgba(0, 0, 0, 0.55);
}

.calc-root .btn-operator {
  background: linear-gradient(160deg, rgba(198, 148, 76, 0.94), rgba(132, 86, 36, 0.99));
  color: rgba(255, 245, 220, 0.99);
  font-size: 25px;
  box-shadow:
    inset 0 1px 0 rgba(255, 225, 185, 0.4),
    inset 0 0 0 1px rgba(255, 200, 140, 0.09),
    0 1px 2px rgba(0, 0, 0, 0.4),
    0 6px 18px -3px rgba(192, 142, 72, 0.34),
    0 0 26px rgba(212, 165, 116, 0.14);
}

.calc-root .btn-operator.active {
  background: linear-gradient(160deg, rgba(232, 178, 96, 1), rgba(172, 122, 58, 1));
  color: rgba(40, 22, 8, 0.98);
  box-shadow:
    inset 0 1px 0 rgba(255, 240, 210, 0.6),
    inset 0 0 20px rgba(255, 200, 140, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.4),
    0 6px 24px -2px rgba(232, 178, 96, 0.52),
    0 0 44px rgba(212, 165, 116, 0.32);
}

.calc-root .btn-equals {
  background: linear-gradient(160deg, rgba(62, 118, 224, 0.98), rgba(34, 72, 184, 1));
  color: rgba(245, 248, 255, 1);
  font-size: 26px;
  font-weight: 500;
  box-shadow:
    inset 0 1px 0 rgba(180, 205, 255, 0.5),
    inset 0 0 0 1px rgba(120, 160, 240, 0.14),
    0 1px 2px rgba(0, 0, 0, 0.4),
    0 6px 24px -3px rgba(62, 118, 224, 0.55),
    0 0 46px rgba(72, 132, 232, 0.3);
}

.calc-root .btn:hover {
  filter: brightness(1.13);
}

.calc-root .btn:active,
.calc-root .btn.flash {
  transform: scale(0.93);
  box-shadow:
    inset 0 3px 10px rgba(0, 0, 0, 0.7),
    inset 0 0 22px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(0, 0, 0, 0.32);
  filter: brightness(0.85);
}

.calc-root .btn-zero {
  grid-column: span 2;
  text-align: left;
  padding-left: 30px;
}

.calc-root .btn-label {
  position: relative;
  z-index: 2;
  display: inline-block;
}

.calc-root .ripple {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255, 255, 255, 0.5),
    rgba(255, 255, 255, 0) 60%);
  transform: translate(-50%, -50%) scale(0);
  animation: ripple 0.7s ease-out forwards;
  pointer-events: none;
  z-index: 1;
}

@keyframes ripple {
  to {
    transform: translate(-50%, -50%) scale(2.6);
    opacity: 0;
  }
}

.calc-root .brand-mark {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.4em;
  color: rgba(255, 220, 180, 0.3);
  margin-top: 20px;
  text-transform: uppercase;
}

.calc-root .brand-mark .dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(255, 220, 180, 0.35);
  display: inline-block;
  margin: 0 6px;
  vertical-align: middle;
}
`;

const OP_SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' };

function formatNumber(n) {
  if (n === null || n === undefined) return '0';
  if (typeof n === 'string') return n;
  if (!isFinite(n)) return 'Error';
  if (Number.isInteger(n) && Math.abs(n) < 1e16) return String(n);
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) return n.toExponential(6);
  const rounded = Math.round(n * 1e10) / 1e10;
  return String(rounded);
}

function compute(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? NaN : a / b;
    default: return b;
  }
}

function displayClass(value) {
  const len = String(value).length;
  if (len >= 12) return 'very-long';
  if (len >= 9)  return 'long';
  return '';
}

function CalcButton({ label, kind, action, wide, isActive, delay, flash }) {
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    if (ripples.length === 0) return;
    const t = setTimeout(() => setRipples([]), 750);
    return () => clearTimeout(t);
  }, [ripples]);

  const onClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples(rs => [...rs, { id: Date.now() + Math.random(), x, y }]);
    action();
  };

  const cls = [
    'btn',
    `btn-${kind}`,
    wide ? 'btn-zero' : '',
    isActive ? 'active' : '',
    flash ? 'flash' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={cls}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
      aria-label={label}
    >
      <span className="btn-label">{label}</span>
      {ripples.map(r => (
        <span
          key={r.id}
          className="ripple"
          style={{ left: r.x, top: r.y }}
        />
      ))}
    </button>
  );
}

export default function Calculator() {
  const [display, setDisplay]                   = useState('0');
  const [previousExpression, setPrevExpression] = useState('');
  const [storedValue, setStoredValue]           = useState(null);
  const [pendingOp, setPendingOp]               = useState(null);
  const [waitingForOperand, setWaiting]         = useState(false);
  const [hasError, setHasError]                 = useState(false);
  const [mounted, setMounted]                   = useState(false);
  const [displayKey, setDisplayKey]             = useState(0);
  const [shake, setShake]                       = useState(false);
  const [flashKey, setFlashKey]                 = useState(null);

  useEffect(() => {
    const id = 'calc-luxe-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(false), 520);
    return () => clearTimeout(t);
  }, [shake]);

  useEffect(() => {
    if (flashKey === null) return;
    const t = setTimeout(() => setFlashKey(null), 120);
    return () => clearTimeout(t);
  }, [flashKey]);

  const bumpDisplay = () => setDisplayKey(k => k + 1);

  const raiseError = () => {
    setDisplay('Error');
    setHasError(true);
    setShake(true);
    setStoredValue(null);
    setPendingOp(null);
    setWaiting(true);
    setPrevExpression('');
    bumpDisplay();
  };

  const inputDigit = (d) => {
    if (hasError) {
      setHasError(false);
      setDisplay(d);
      setWaiting(false);
      bumpDisplay();
      return;
    }
    if (waitingForOperand) {
      setDisplay(d);
      setWaiting(false);
    } else {
      setDisplay(display === '0' ? d : display.length >= 14 ? display : display + d);
    }
    bumpDisplay();
  };

  const inputDecimal = () => {
    if (hasError) {
      setHasError(false);
      setDisplay('0.');
      setWaiting(false);
      bumpDisplay();
      return;
    }
    if (waitingForOperand) {
      setDisplay('0.');
      setWaiting(false);
      bumpDisplay();
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
      bumpDisplay();
    }
  };

  const handleOperator = (op) => {
    if (hasError) return;
    const current = parseFloat(display);
    let newStored;

    if (storedValue === null) {
      newStored = current;
    } else if (pendingOp && !waitingForOperand) {
      const result = compute(storedValue, pendingOp, current);
      if (!isFinite(result)) { raiseError(); return; }
      newStored = result;
      setDisplay(formatNumber(result));
      bumpDisplay();
    } else {
      newStored = storedValue;
    }

    setStoredValue(newStored);
    setPrevExpression(`${formatNumber(newStored)} ${OP_SYMBOLS[op]}`);
    setPendingOp(op);
    setWaiting(true);
  };

  const handleEquals = () => {
    if (hasError) return;
    if (pendingOp === null || storedValue === null) return;

    const current = parseFloat(display);
    const result = compute(storedValue, pendingOp, current);

    if (!isFinite(result)) { raiseError(); return; }

    setPrevExpression(
      `${formatNumber(storedValue)} ${OP_SYMBOLS[pendingOp]} ${formatNumber(current)} =`
    );
    setDisplay(formatNumber(result));
    setStoredValue(null);
    setPendingOp(null);
    setWaiting(true);
    bumpDisplay();
  };

  const clearAll = () => {
    setDisplay('0');
    setPrevExpression('');
    setStoredValue(null);
    setPendingOp(null);
    setWaiting(false);
    setHasError(false);
    bumpDisplay();
  };

  const toggleSign = () => {
    if (hasError || display === '0' || display === 'Error') return;
    setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
    bumpDisplay();
  };

  const percent = () => {
    if (hasError) return;
    const current = parseFloat(display);
    setDisplay(formatNumber(current / 100));
    bumpDisplay();
  };

  const backspace = () => {
    if (hasError) { clearAll(); return; }
    if (waitingForOperand) return;
    if (display.length <= 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
    bumpDisplay();
  };

  useEffect(() => {
    const handler = (e) => {
      const k = e.key;
      if (k >= '0' && k <= '9')               { inputDigit(k);       setFlashKey(k); }
      else if (k === '.')                     { inputDecimal();      setFlashKey('.'); }
      else if (k === '+')                     { handleOperator('+'); setFlashKey('+'); }
      else if (k === '-')                     { handleOperator('-'); setFlashKey('-'); }
      else if (k === '*' || k === 'x' || k === 'X') {
        e.preventDefault(); handleOperator('*'); setFlashKey('*');
      }
      else if (k === '/')                     { e.preventDefault(); handleOperator('/'); setFlashKey('/'); }
      else if (k === 'Enter' || k === '=')    { e.preventDefault(); handleEquals();      setFlashKey('='); }
      else if (k === 'Escape')                { clearAll();          setFlashKey('AC'); }
      else if (k === 'Backspace')             { backspace();         setFlashKey('AC'); }
      else if (k === '%')                     { percent();           setFlashKey('%'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [display, storedValue, pendingOp, waitingForOperand, hasError]);

  const buttons = [
    { key: 'AC', label: 'AC',  kind: 'function', action: clearAll },
    { key: '+/-', label: '+/−', kind: 'function', action: toggleSign },
    { key: '%',  label: '%',   kind: 'function', action: percent },
    { key: '/',  label: '÷',   kind: 'operator', action: () => handleOperator('/') },

    { key: '7',  label: '7',   kind: 'number',   action: () => inputDigit('7') },
    { key: '8',  label: '8',   kind: 'number',   action: () => inputDigit('8') },
    { key: '9',  label: '9',   kind: 'number',   action: () => inputDigit('9') },
    { key: '*',  label: '×',   kind: 'operator', action: () => handleOperator('*') },

    { key: '4',  label: '4',   kind: 'number',   action: () => inputDigit('4') },
    { key: '5',  label: '5',   kind: 'number',   action: () => inputDigit('5') },
    { key: '6',  label: '6',   kind: 'number',   action: () => inputDigit('6') },
    { key: '-',  label: '−',   kind: 'operator', action: () => handleOperator('-') },

    { key: '1',  label: '1',   kind: 'number',   action: () => inputDigit('1') },
    { key: '2',  label: '2',   kind: 'number',   action: () => inputDigit('2') },
    { key: '3',  label: '3',   kind: 'number',   action: () => inputDigit('3') },
    { key: '+',  label: '+',   kind: 'operator', action: () => handleOperator('+') },

    { key: '0',  label: '0',   kind: 'number',   action: () => inputDigit('0'), wide: true },
    { key: '.',  label: '.',   kind: 'number',   action: inputDecimal },
    { key: '=',  label: '=',   kind: 'equals',   action: handleEquals },
  ];

  return (
    <div className="calc-root">
      <div className="ambient-blob blob-1" />
      <div className="ambient-blob blob-2" />
      <div className="ambient-blob blob-3" />
      <div className="grain" />

      <div className={`calc-card ${mounted ? 'mounted' : ''} ${shake ? 'shake' : ''}`}>
        <div className="display">
          <div className="display-meta">
            <span>{hasError ? 'ERR · 01' : 'CALC · 001'}</span>
            <span>
              {pendingOp ? OP_SYMBOLS[pendingOp] : '·'}
              <span className={`led ${hasError ? 'error' : ''}`} />
            </span>
          </div>
          <div className="prev-expression">
            {previousExpression || ' '}
          </div>
          <div className="current-value-wrapper">
            <div
              key={displayKey}
              className={`current-value ${hasError ? 'error' : ''} ${displayClass(display)}`}
            >
              {display}
            </div>
          </div>
          <div className="scanlines" />
        </div>

        <div className="buttons">
          {buttons.map((btn, i) => (
            <CalcButton
              key={btn.key}
              label={btn.label}
              kind={btn.kind}
              action={btn.action}
              wide={btn.wide}
              isActive={btn.kind === 'operator' && pendingOp === btn.key && waitingForOperand}
              delay={320 + i * 30}
              flash={flashKey === btn.key}
            />
          ))}
        </div>

        <div className="brand-mark">
          <span>Precision</span>
          <span>
            Glass <span className="dot" /> Series
          </span>
          <span>· IX ·</span>
        </div>
      </div>
    </div>
  );
}
