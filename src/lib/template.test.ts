import { describe, it, expect } from 'vitest'
import { renderTemplate, templateTokens, templateVars, tokenFor } from './template'

describe('templateTokens', () => {
  it('lists each placeholder once, in first-seen order, tolerating spaces', () => {
    expect(templateTokens('<p>{{ الاسم }} و {{السعر}} و {{الاسم}}</p>')).toEqual([
      'الاسم',
      'السعر',
    ])
    expect(templateTokens('<p>بدون متغيرات</p>')).toEqual([])
  })
})

describe('renderTemplate', () => {
  const ctx = { الاسم: 'عباية سوداء', السعر: '299', الخامة: 'كريب', الماركة: '' }

  it('substitutes placeholders and keeps the surrounding markup', () => {
    expect(renderTemplate('<p><strong>{{الاسم}}</strong></p>', ctx)).toBe(
      '<p><strong>عباية سوداء</strong></p>',
    )
    expect(renderTemplate('<p>السعر: {{السعر}} ر.س</p>', ctx)).toBe(
      '<p>السعر: 299 ر.س</p>',
    )
  })

  it('drops a block whose placeholders ALL resolve empty', () => {
    // «الماركة» is empty → the whole line goes, not just the value.
    expect(
      renderTemplate('<ul><li>الخامة: {{الخامة}}</li><li>الماركة: {{الماركة}}</li></ul>', ctx),
    ).toBe('<ul><li>الخامة: كريب</li></ul>')
  })

  it('keeps a block where only SOME placeholders resolve empty', () => {
    expect(renderTemplate('<p>{{الاسم}} — {{الماركة}}</p>', ctx)).toBe(
      '<p>عباية سوداء — </p>',
    )
  })

  it('keeps a block that carries no placeholder at all', () => {
    expect(renderTemplate('<p>شحن سريع لكل المناطق</p>', ctx)).toBe(
      '<p>شحن سريع لكل المناطق</p>',
    )
  })

  it('removes a list left with no items', () => {
    expect(renderTemplate('<ul><li>الماركة: {{الماركة}}</li></ul>', ctx)).toBe('')
  })

  it('returns empty when nothing survived — the caller keeps the mapped value', () => {
    expect(renderTemplate('<p>{{الماركة}}</p>', ctx)).toBe('')
    expect(renderTemplate('', ctx)).toBe('')
    expect(renderTemplate('   ', ctx)).toBe('')
  })

  it('resolves an unknown placeholder to empty, never to its own text', () => {
    expect(renderTemplate('<p>{{مش موجود}}</p>', ctx)).toBe('')
    // An unknown name behaves exactly like an empty one — the line is its only
    // placeholder, so it goes rather than leaving a dangling «ثابت».
    expect(renderTemplate('<p>ثابت {{مش موجود}}</p>', ctx)).toBe('')
    expect(renderTemplate('<p>ثابت {{مش موجود}} و {{الاسم}}</p>', ctx)).toBe(
      '<p>ثابت  و عباية سوداء</p>',
    )
  })

  it('escapes sheet values — a cell is untrusted text, never markup', () => {
    const out = renderTemplate('<p>{{الاسم}}</p>', { الاسم: '<img src=x onerror=alert(1)>' })
    expect(out).toBe('<p>&lt;img src=x onerror=alert(1)&gt;</p>')
    expect(out).not.toContain('<img')
    expect(renderTemplate('<p>{{الاسم}}</p>', { الاسم: 'قطن & حرير' })).toBe(
      '<p>قطن &amp; حرير</p>',
    )
  })

  it('handles headings and blocks carrying attributes', () => {
    expect(renderTemplate('<h3 dir="rtl">{{الاسم}}</h3>', ctx)).toBe(
      '<h3 dir="rtl">عباية سوداء</h3>',
    )
    expect(renderTemplate('<h3>{{الماركة}}</h3>', ctx)).toBe('')
  })

  it('fills a placeholder sitting outside any block', () => {
    expect(renderTemplate('{{الاسم}}', ctx)).toBe('عباية سوداء')
  })
})

describe('templateVars', () => {
  it('lists mapped Salla fields first, then the sheet columns', () => {
    expect(templateVars(['أسم المنتج', 'سعر المنتج'], ['title', 'الخامة'])).toEqual([
      { name: 'أسم المنتج', source: 'field' },
      { name: 'سعر المنتج', source: 'field' },
      { name: 'title', source: 'column' },
      { name: 'الخامة', source: 'column' },
    ])
  })

  it('drops a column a Salla field already claimed — it could never win', () => {
    expect(templateVars(['أسم المنتج'], ['أسم المنتج', 'الخامة'])).toEqual([
      { name: 'أسم المنتج', source: 'field' },
      { name: 'الخامة', source: 'column' },
    ])
  })

  it('ignores empty names and de-dupes', () => {
    expect(templateVars(['أ', 'أ', ''], ['ب', 'ب'])).toEqual([
      { name: 'أ', source: 'field' },
      { name: 'ب', source: 'column' },
    ])
  })
})

describe('tokenFor', () => {
  it('wraps a name in the form the editor inserts', () => {
    expect(tokenFor('أسم المنتج')).toBe('{{أسم المنتج}}')
  })
})
