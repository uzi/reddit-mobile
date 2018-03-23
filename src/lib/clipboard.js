let _input = null;

function createInput() {
  _input = document.createElement('textArea');
  _input.style.opacity = 0;
  _input.style.position = 'fixed';
  _input.style.left = '-200px';
  _input.style.top = '-200px';
  _input.contentEditable = true;
  _input.readOnly = true;
  document.body.appendChild(_input);
}

function getInput() {
  if (!_input) { createInput(); }
  return _input;
}

export function copy(text) {
  const input = getInput();
  input.value = text;

  if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
    const range = document.createRange();
    range.selectNodeContents(input);
    const selection = window.getSelection();

    selection.removeAllRanges();
    selection.addRange(range);

    input.setSelectionRange(0, 999999);
  } else {
    input.select();
  }

  const result = document.execCommand('copy');
  input.blur();

  return result;
}
