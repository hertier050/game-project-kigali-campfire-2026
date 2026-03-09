const Input = (() => {
  const keys = {};

  const onKeyDown = (e) => {
    keys[e.code] = true;
  };

  const onKeyUp = (e) => {
    keys[e.code] = false;
  };

  const isDown = (code) => !!keys[code];

  const init = () => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  };

  const destroy = () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    for (const k in keys) delete keys[k];
  };

  return { init, destroy, isDown };
})();
