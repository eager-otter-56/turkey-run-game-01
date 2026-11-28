// Gobble Run! — keyboard and mouse input.
// Keys are latched into a small state object the game loop reads; edge
// presses (jump, start, restart) are queued so a tap between frames is
// never lost.

export function createInput(target) {
  const held = { jump: false, duck: false, sprint: false };
  const pressed = [];
  let clickPoint = null;

  const keyMap = {
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
    ArrowDown: 'duck', KeyS: 'duck',
    ArrowRight: 'laneRight', KeyD: 'laneRight',
    ArrowLeft: 'laneLeft', KeyA: 'laneLeft',
    ShiftLeft: 'sprint', ShiftRight: 'sprint',
  };

  function onKeyDown(event) {
    const action = keyMap[event.code];
    if (action) {
      if (!held[action]) pressed.push(action);
      held[action] = true;
      event.preventDefault();
    }
    if (event.code === 'Enter') pressed.push('confirm');
    if (event.code === 'KeyR') pressed.push('restart');
    if (event.code === 'KeyP') pressed.push('pause');
    if (event.code === 'KeyM') pressed.push('mute');
  }
  function onKeyUp(event) {
    const action = keyMap[event.code];
    if (action) {
      held[action] = false;
      event.preventDefault();
    }
  }
  function onPointerDown(event) {
    const rect = target.getBoundingClientRect();
    clickPoint = {
      x: ((event.clientX - rect.left) / rect.width) * target.width,
      y: ((event.clientY - rect.top) / rect.height) * target.height,
    };
    pressed.push('confirm');
    // tap the left or right third of the track to switch lanes
    const fx = (event.clientX - rect.left) / rect.width;
    if (fx < 0.36) pressed.push('laneLeft');
    else if (fx > 0.64) pressed.push('laneRight');
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  target.addEventListener('pointerdown', onPointerDown);

  return {
    held,
    // Drain the edge-press queue; each action appears at most once.
    takePressed() {
      const out = [...new Set(pressed)];
      pressed.length = 0;
      return out;
    },
    takeClick() {
      const point = clickPoint;
      clickPoint = null;
      return point;
    },
  };
}
