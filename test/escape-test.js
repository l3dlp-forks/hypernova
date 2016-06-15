import cheerio from 'cheerio';
import wrap from 'mocha-wrap';
import { assert } from 'chai';
import { serialize, toScript, fromScript } from '..';

describe('escaping', () => {
  it('escapes', () => {
    const html = serialize('foo', '', { foo: '</script>', bar: '&gt;' });

    assert.include(html, '</script&gt;');
    assert.include(html, '&amp;gt;');
  });

  wrap().withGlobal('document', () => ({})).it('loads the escaped content correctly', () => {
    const html = toScript({ a: 'b' }, { foo: '</script>', bar: '&gt;', baz: '&amp;' });
    const $ = cheerio.load(html);

    global.document.querySelector = () => ({ innerHTML: $($('script')[0]).html() });

    const res = fromScript({
      a: 'b',
    });

    assert.isObject(res);

    assert.equal(res.foo, '</script>');
    assert.equal(res.bar, '&gt;');
    assert.equal(res.baz, '&amp;');
  });

  it('escapes quotes and fixes data attributes', () => {
    const markup = toScript({
      'ZOMG-ok': 'yes',
      'data-x': 'y',
      '1337!!!': 'w00t',
      '---valid': '',
      'Is this ok?': '',
      'weird-values': '"]<script>alert(1);</script>',
      'weird-values2': '"&quot;"',
    }, {});

    const $ = cheerio.load(markup);
    const $node = $('script');

    assert.isString($node.data('zomg-ok'));
    assert.isString($node.data('data-x'));
    assert.isString($node.data('1337'));
    assert.isString($node.data('---valid'));
    assert.isString($node.data('isthisok'));

    assert.equal($node.data('weird-values'), '"]<script>alert(1);</script>');
    assert.equal($node.data('weird-values2'), '"&quot;"');

    assert.isUndefined($node.data('ZOMG-ok'));
    assert.isUndefined($node.data('x'));
    assert.isUndefined($node.data('Is this ok?'));
  });
});
