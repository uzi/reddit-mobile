import chai from 'chai';
import sinonChai from 'sinon-chai';
import { formatPythonString } from '../../src/lib/formatPythonString';

chai.use(sinonChai);

const expect = chai.expect;

describe('lib: formatPythonString', () => {
  it('is a function', () => {
    expect(formatPythonString).to.be.a('function');
  });

  it('can parse formatted python string', () => {
    const pythonStringWithNoParams = 'http://foobar.com/bar/bar';
    const parsedStringWithNoParams = 'http://foobar.com/bar/bar';

    const pythonStringWithOneParam = 'http://foobar.com/bar/%(foo)s';
    const parsedStringWithOneParam = 'http://foobar.com/bar/replaced-foo';

    const pythonStringWithTwoParams = 'http://foobar.com/%(bar)s/%(foo)s';
    const parsedStringWithTwoParams = 'http://foobar.com/replaced-bar/replaced-foo';
    const partiallyParsedStringWithTwoParams = 'http://foobar.com/%(bar)s/replaced-foo';

    expect(formatPythonString(pythonStringWithNoParams, {})).to.equal(parsedStringWithNoParams);
    expect(formatPythonString(pythonStringWithOneParam, { foo: "replaced-foo" })).to.equal(parsedStringWithOneParam);
    expect(formatPythonString(pythonStringWithTwoParams, { foo: "replaced-foo", bar: "replaced-bar" })).to.equal(parsedStringWithTwoParams);
    expect(formatPythonString(pythonStringWithTwoParams, { foo: "replaced-foo" })).to.equal(partiallyParsedStringWithTwoParams);
  });
});
