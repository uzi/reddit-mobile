const pythonStringRe = /%\((\w+)\)s/g;

export function formatPythonString(pyString, params) {
  return pyString.replace(pythonStringRe, function (match, fieldName) {
    if (!(fieldName in params)) {
      return match;
    }
    return params[fieldName];
  });
}
