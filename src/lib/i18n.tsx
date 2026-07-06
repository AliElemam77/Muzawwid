import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'ar' | 'en'

const STORAGE_KEY = 'muzawwid:lang'

type Dict = Record<string, string>

/** All UI strings. Keys are shared; values differ per language. */
const MESSAGES: Record<Lang, Dict> = {
  ar: {
    'lang.other': 'English',

    'platform.choose': 'اختر منصة التصدير',
    'platform.ready': 'متاح',
    'platform.soonBadge': 'قريبًا',
    'platform.salla': 'سلة',
    'platform.zid': 'زد',
    'platform.woo': 'ووكومرس',
    'platform.shopify': 'شوبيفاي',
    'platform.soonTitle': 'دعم {name} قريبًا',
    'platform.soonBody': 'يدعم التطبيق حاليًا التصدير إلى سلة. جارٍ العمل على دعم {name} — تقدر تكمل بسلة الآن.',
    'platform.switchToSalla': 'التبديل إلى سلة',
    'app.subtitle':
      'حوّل أي ملف منتجات إلى ملف استيراد جاهز للرفع على سلة — كل المعالجة داخل متصفحك، بدون رفع لأي خادم.',
    'app.footer':
      'يُنشئ ورقة واحدة فقط باسم «Salla Products Template Sheet» — جاهزة للرفع على',

    'step1.uploadTitle': '١) رفع الملف',
    'step1.uploadSubtitle': 'ابدأ برفع ملف المنتجات بصيغة xlsx أو xls أو csv.',
    'step1.sourceTitle': '١) الملف المصدر',
    'btn.uploadAnother': 'رفع ملف آخر',

    'presets.title': 'القوالب المحفوظة',
    'presets.subtitle': 'احفظ إعدادات المطابقة لإعادة استخدامها مع الملفات القادمة.',
    'presets.saveAs': 'حفظ الإعدادات باسم',
    'presets.namePlaceholder': 'اسم القالب',
    'presets.saveBtn': 'حفظ القالب',
    'presets.loadLabel': 'تحميل قالب محفوظ',
    'presets.choose': '— اختر —',

    'categories.title': 'تصنيفات متجرك',
    'categories.subtitle':
      'عرّف تصنيفات متجرك مرة واحدة لتختار منها لكل منتج في المعاينة — بدل كتابتها يدويًا.',
    'categories.note':
      'أضف تصنيفات متجرك مرة واحدة لتختار منها لكل منتج في خطوة المعاينة. يمكنك لصق عدة تصنيفات مفصولة بفاصلة أو سطر جديد.',
    'categories.placeholder': 'مثال: قمصان، بناطيل، أحذية',
    'categories.removeTitle': 'حذف التصنيف',
    'categories.empty': 'لا توجد تصنيفات بعد — أضف تصنيفات متجرك للبدء.',

    'step2.title': '٢) مطابقة الأعمدة',
    'step3.title': '٣) المعاينة والتصدير',

    'preview.title': 'معاينة المخرجات',
    'preview.subtitle': 'صفوف «منتج» بيضاء وصفوف «خيار» مظلّلة.',
    'validate.title': 'التحقق قبل التصدير',
    'btn.download': '⬇ تحميل ملف الاستيراد (.xlsx)',
    'validate.fixErrors': 'صحّح الأخطاء أعلاه لتفعيل التحميل.',

    'step.upload': 'رفع الملف',
    'step.map': 'مطابقة الأعمدة',
    'step.export': 'تصدير',

    'uploader.busy': 'جارٍ القراءة…',
    'uploader.cta': 'اسحب ملف الشيت هنا أو اضغط للاختيار',
    'uploader.formats': 'يدعم صيغ .xlsx و .xls و .csv — تتم المعالجة داخل متصفحك فقط',
    'uploader.errNoData': 'لم يتم العثور على أي بيانات في الملف.',
    'uploader.errRead': 'تعذّر قراءة الملف. تأكد أنه بصيغة xlsx أو xls أو csv.',

    'source.pick': 'اختر الورقة:',
    'source.stats': '{cols} عمود · {rows} صف — يظهر أول {shown} صف',

    'field.none': 'بدون',
    'field.column': 'عمود مصدر',
    'field.constant': 'قيمة ثابتة',
    'field.constantPlaceholder': 'القيمة الثابتة لكل الصفوف',

    'map.fields.title': 'الحقول الأساسية',
    'map.fields.subtitle': 'اربط كل حقل في سلة بعمود من ملفك، أو اضبط قيمة ثابتة، أو اتركه فارغًا.',
    'map.images.title': 'دمج الصور',
    'map.images.subtitle': 'اختر عمودًا واحدًا أو أكثر لدمجها في «صورة المنتج».',
    'map.sku.title': 'توليد رمز المنتج (SKU)',
    'map.options.title': 'الخيارات (المتغيرات)',
    'map.options.subtitle': 'حتى ٣ خيارات — كل خيار يتوسّع إلى صفوف «خيار» أسفل المنتج.',
    'map.defaults.title': 'القيم الافتراضية',

    'images.note': 'اختر أعمدة الصور — تُدمج الروابط غير الفارغة (بدون تكرار) في عمود «صورة المنتج».',

    'sku.none': 'بدون',
    'sku.column': 'من عمود',
    'sku.regex': 'استخراج من رابط /p(\\d+)',
    'sku.auto': 'ترقيم تلقائي',
    'sku.colLabel': 'عمود الرمز',
    'sku.urlColLabel': 'عمود الرابط',
    'sku.prefix': 'البادئة (Prefix)',
    'sku.prefixExampleSelia': 'مثال: SELIA-',
    'sku.prefixExampleSku': 'مثال: SKU-',
    'sku.regexHint': 'يُستخرج الرقم من الرابط عبر النمط /p(\\d+) ويُدمج مع البادئة، مثال: SELIA-12345',
    'sku.autoHint': 'يُضاف رقم تسلسلي تلقائي لكل منتج: SKU-1, SKU-2…',

    'opt.type.text': 'نص',
    'opt.type.color': 'لون',
    'opt.type.image': 'صورة',
    'opt.note':
      'كل عمود خيار يتوسّع إلى صفوف «خيار» أسفل المنتج الأب. القيم المتعددة داخل الخلية تُفصل بفاصلة أو «|» أو سطر جديد.',
    'opt.group': 'خيار [{n}]',
    'opt.sourceCol': 'العمود المصدر',
    'opt.name': 'اسم الخيار',
    'opt.namePlaceholder': 'مثال: المقاس / اللون',
    'opt.typeLabel': 'النوع',
    'opt.swatchLabel': 'عمود اللون (Hex) — اختياري',
    'opt.swatchInfer': '— (استنتاج من القيمة) —',
    'btn.addOption': '+ إضافة عمود خيار',

    'defaults.note':
      'قيم ثابتة تُملأ في كل صف (منتج وخيار) عندما تكون الخلية فارغة. الوزن مطلوب دائمًا من سلة.',
    'defaults.weightHint': 'مطلوب من سلة — يُطبّق على كل صف فارغ',
    'defaults.maxQtyHint': 'سلة ترفض الفارغ/الصفر — لازم ≥ 1. القيمة العالية = بلا حد عملي',

    'btn.add': 'إضافة',
    'btn.delete': 'حذف',

    // Salla field labels
    'f.name': 'أسم المنتج',
    'f.price': 'سعر المنتج',
    'f.category': 'تصنيف المنتج',
    'f.brand': 'الماركة',
    'f.description': 'الوصف',
    'f.imageAlt': 'وصف صورة المنتج',
    'f.cost': 'سعر التكلفة',
    'f.discountPrice': 'السعر المخفض',
    'f.discountStart': 'تاريخ بداية التخفيض',
    'f.discountEnd': 'تاريخ نهاية التخفيض',
    'f.maxQty': 'اقصي كمية لكل عميل',
    'f.barcode': 'الباركود',
    'f.promoTitle': 'العنوان الترويجي',
    'f.calories': 'السعرات الحرارية',
    'f.mpn': 'MPN',
    'f.gtin': 'GTIN',
    'f.taxExemptReason': 'سبب عدم الخضوع للضريبة',
    'f.productType': 'نوع المنتج',
    'f.requiresShipping': 'هل يتطلب شحن؟',
    'f.taxable': 'خاضع للضريبة ؟',
    'f.weight': 'الوزن',
    'f.weightUnit': 'وحدة الوزن',

    // Output preview columns
    'col.type': 'النوع',
    'col.name': 'أسم المنتج',
    'col.price': 'السعر',
    'col.sku': 'SKU',
    'col.category': 'التصنيف',
    'col.brand': 'الماركة',
    'col.weight': 'الوزن',
    'col.opt1': '[1] القيمة',
    'col.opt2': '[2] القيمة',
    'col.opt3': '[3] القيمة',
    'col.images': 'الصور',
    'preview.action': 'إجراء',
    'preview.stats': '{products} منتج · {options} خيار · {total} صف إجمالًا — يظهر {shown}.',
    'preview.editNote':
      'أعمدة «الاسم» و«السعر» و«التصنيف» قابلة للتعديل على المنتجات، وزر «حذف» يزيل البند بكل خياراته.',
    'preview.applyAllLabel': 'تطبيق تصنيف على كل المنتجات',
    'preview.applyAllBtn': 'تطبيق على الكل',
    'preview.catNone': '— بدون —',
    'preview.catNotListed': '{name} (غير مُدرج)',
    'preview.deletedInfo': 'تم حذف {n} بند من التصدير.',
    'preview.restoreAll': 'استرجاع الكل',
    'preview.deleteTitle': 'حذف هذا البند بكل خياراته',
    'preview.showAll': 'عرض كل الصفوف ({n}) لتعديل كل التصنيفات',
    'preview.showLess': 'عرض أقل',

    'validate.ready': '✓ الملف جاهز للتصدير — لا توجد مشاكل.',
    'validate.errorsTitle': 'أخطاء تمنع التصدير ({n})',
    'validate.warningsTitle': 'تنبيهات (لا تمنع التصدير) ({n})',

    'val.missingName': 'صفوف بدون اسم منتج (أسم المنتج مطلوب)',
    'val.missingPrice': 'منتجات بدون سعر (سعر المنتج مطلوب)',
    'val.missingWeight': 'صفوف بدون وزن (حقل الوزن مطلوب)',
    'val.dupSku': 'أرقام SKU مكررة',
    'val.orphan': 'صفوف خيار بدون منتج أب',
    'val.missingImage': 'منتجات بدون صورة',
    'val.missingCategory': 'منتجات بدون تصنيف',
    'val.missingBrand': 'منتجات بدون ماركة',
  },

  en: {
    'lang.other': 'العربية',

    'platform.choose': 'Choose export platform',
    'platform.ready': 'Available',
    'platform.soonBadge': 'Soon',
    'platform.salla': 'Salla',
    'platform.zid': 'Zid',
    'platform.woo': 'WooCommerce',
    'platform.shopify': 'Shopify',
    'platform.soonTitle': '{name} support is coming soon',
    'platform.soonBody': 'The app currently exports to Salla. {name} support is on the way — you can continue with Salla for now.',
    'platform.switchToSalla': 'Switch to Salla',
    'app.subtitle':
      'Turn any product file into a Salla-ready import file — everything runs in your browser, nothing is uploaded to a server.',
    'app.footer':
      'Produces a single sheet named “Salla Products Template Sheet” — ready to upload at',

    'step1.uploadTitle': '1) Upload file',
    'step1.uploadSubtitle': 'Start by uploading a product file in xlsx, xls, or csv format.',
    'step1.sourceTitle': '1) Source file',
    'btn.uploadAnother': 'Upload another file',

    'presets.title': 'Saved templates',
    'presets.subtitle': 'Save your mapping so you can reuse it with future files.',
    'presets.saveAs': 'Save settings as',
    'presets.namePlaceholder': 'Template name',
    'presets.saveBtn': 'Save template',
    'presets.loadLabel': 'Load a saved template',
    'presets.choose': '— choose —',

    'categories.title': 'Your store categories',
    'categories.subtitle':
      'Define your store categories once, then pick from them per product in the preview — instead of typing each.',
    'categories.note':
      'Add your store categories once, then pick from them per product in the preview step. You can paste several categories separated by comma or newline.',
    'categories.placeholder': 'e.g. Shirts, Pants, Shoes',
    'categories.removeTitle': 'Remove category',
    'categories.empty': 'No categories yet — add your store categories to start.',

    'step2.title': '2) Map columns',
    'step3.title': '3) Preview & export',

    'preview.title': 'Output preview',
    'preview.subtitle': 'Product rows are white; option (variant) rows are shaded.',
    'validate.title': 'Validation before export',
    'btn.download': '⬇ Download import file (.xlsx)',
    'validate.fixErrors': 'Fix the errors above to enable the download.',

    'step.upload': 'Upload',
    'step.map': 'Map columns',
    'step.export': 'Export',

    'uploader.busy': 'Reading…',
    'uploader.cta': 'Drag your sheet here, or click to choose',
    'uploader.formats': 'Supports .xlsx, .xls, .csv — processed only inside your browser',
    'uploader.errNoData': 'No data was found in the file.',
    'uploader.errRead': 'Could not read the file. Make sure it is xlsx, xls, or csv.',

    'source.pick': 'Choose sheet:',
    'source.stats': '{cols} columns · {rows} rows — showing first {shown}',

    'field.none': 'None',
    'field.column': 'Source column',
    'field.constant': 'Constant value',
    'field.constantPlaceholder': 'Constant value for all rows',

    'map.fields.title': 'Core fields',
    'map.fields.subtitle': 'Map each Salla field to a column from your file, set a constant, or leave it blank.',
    'map.images.title': 'Merge images',
    'map.images.subtitle': 'Pick one or more columns to merge into the product image field.',
    'map.sku.title': 'SKU generation',
    'map.options.title': 'Options (variants)',
    'map.options.subtitle': 'Up to 3 options — each expands into option rows under the product.',
    'map.defaults.title': 'Default values',

    'images.note': 'Pick image columns — non-empty URLs are merged (de-duplicated) into the product image field.',

    'sku.none': 'None',
    'sku.column': 'From a column',
    'sku.regex': 'Extract from URL /p(\\d+)',
    'sku.auto': 'Auto-increment',
    'sku.colLabel': 'SKU column',
    'sku.urlColLabel': 'URL column',
    'sku.prefix': 'Prefix',
    'sku.prefixExampleSelia': 'e.g. SELIA-',
    'sku.prefixExampleSku': 'e.g. SKU-',
    'sku.regexHint': 'The number is extracted from the URL via /p(\\d+) and joined to the prefix, e.g. SELIA-12345',
    'sku.autoHint': 'A sequential number is appended per product: SKU-1, SKU-2…',

    'opt.type.text': 'Text',
    'opt.type.color': 'Color',
    'opt.type.image': 'Image',
    'opt.note':
      'Each option column expands into option rows under the parent product. Multiple values in a cell are split by comma, “|”, or newline.',
    'opt.group': 'Option [{n}]',
    'opt.sourceCol': 'Source column',
    'opt.name': 'Option name',
    'opt.namePlaceholder': 'e.g. Size / Color',
    'opt.typeLabel': 'Type',
    'opt.swatchLabel': 'Color column (Hex) — optional',
    'opt.swatchInfer': '— (infer from value) —',
    'btn.addOption': '+ Add option column',

    'defaults.note':
      'Constant values filled into every row (product & option) when the cell is empty. Weight is always required by Salla.',
    'defaults.weightHint': 'Required by Salla — applied to every empty row',
    'defaults.maxQtyHint': 'Salla rejects empty/0 — must be ≥ 1. A high value means no practical limit',

    'btn.add': 'Add',
    'btn.delete': 'Delete',

    'f.name': 'Product name',
    'f.price': 'Price',
    'f.category': 'Category',
    'f.brand': 'Brand',
    'f.description': 'Description',
    'f.imageAlt': 'Image alt text',
    'f.cost': 'Cost price',
    'f.discountPrice': 'Discounted price',
    'f.discountStart': 'Discount start date',
    'f.discountEnd': 'Discount end date',
    'f.maxQty': 'Max quantity per customer',
    'f.barcode': 'Barcode',
    'f.promoTitle': 'Promo title',
    'f.calories': 'Calories',
    'f.mpn': 'MPN',
    'f.gtin': 'GTIN',
    'f.taxExemptReason': 'Tax-exemption reason',
    'f.productType': 'Product type',
    'f.requiresShipping': 'Requires shipping?',
    'f.taxable': 'Taxable?',
    'f.weight': 'Weight',
    'f.weightUnit': 'Weight unit',

    'col.type': 'Type',
    'col.name': 'Name',
    'col.price': 'Price',
    'col.sku': 'SKU',
    'col.category': 'Category',
    'col.brand': 'Brand',
    'col.weight': 'Weight',
    'col.opt1': '[1] Value',
    'col.opt2': '[2] Value',
    'col.opt3': '[3] Value',
    'col.images': 'Images',
    'preview.action': 'Action',
    'preview.stats': '{products} products · {options} options · {total} rows total — showing {shown}.',
    'preview.editNote':
      'Name, Price and Category are editable on product rows; Delete removes the item with all its options.',
    'preview.applyAllLabel': 'Apply a category to all products',
    'preview.applyAllBtn': 'Apply to all',
    'preview.catNone': '— None —',
    'preview.catNotListed': '{name} (not listed)',
    'preview.deletedInfo': '{n} item(s) removed from the export.',
    'preview.restoreAll': 'Restore all',
    'preview.deleteTitle': 'Delete this item and all its options',
    'preview.showAll': 'Show all rows ({n}) to edit every category',
    'preview.showLess': 'Show less',

    'validate.ready': '✓ The file is ready to export — no issues.',
    'validate.errorsTitle': 'Errors blocking export ({n})',
    'validate.warningsTitle': 'Warnings (do not block export) ({n})',

    'val.missingName': 'Rows without a product name (name required)',
    'val.missingPrice': 'Products without a price (price required)',
    'val.missingWeight': 'Rows without a weight (weight required)',
    'val.dupSku': 'Duplicate SKUs',
    'val.orphan': 'Option rows without a parent product',
    'val.missingImage': 'Products without an image',
    'val.missingCategory': 'Products without a category',
    'val.missingBrand': 'Products without a brand',
  },
}

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string

interface I18nValue {
  lang: Lang
  dir: 'rtl' | 'ltr'
  setLang: (lang: Lang) => void
  t: TranslateFn
}

const I18nContext = createContext<I18nValue | null>(null)

function loadLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ar'
  } catch {
    return 'ar'
  }
}

function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''))
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang)
  const dir: 'rtl' | 'ltr' = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang, dir])

  const value = useMemo<I18nValue>(() => {
    const t: TranslateFn = (key, params) =>
      interpolate(MESSAGES[lang][key] ?? MESSAGES.ar[key] ?? key, params)
    return { lang, dir, setLang: setLangState, t }
  }, [lang, dir])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
