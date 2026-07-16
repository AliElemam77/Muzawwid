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

    'hint.scraper.title': '💡 نصيحة: استخدم Easy Scraper',
    'hint.scraper.body':
      'لسحب المنتجات من المتاجر يُفضَّل استخدام إضافة «Easy Scraper» — تصدّر ملفًا نظيفًا بالأعمدة الجاهزة للمطابقة هنا.',

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

    // --- Landing (shown only before a file is loaded) ---------------------
    'lp.eyebrow': 'جديد — تصدير «زد» صار متاح',
    // Headline is split so the marker-highlight words can be wrapped.
    'lp.h1.a': 'حوّل أي شيت منتجات لملف',
    'lp.h1.mark1': 'سلة جاهز',
    'lp.h1.b': 'في',
    'lp.h1.mark2': 'دقيقة.',
    'lp.lead':
      'ارفع ملفك، طابِق الأعمدة، نزّل ملف الاستيراد. المطابقة تلقائية، والخيارات تتوسّع لصفوف «خيار» لوحدها، والتحقق يمسك الأخطاء قبل ما سلة ترفض الملف.',
    'lp.cta.primary': 'ابدأ الآن — ارفع ملفك',
    'lp.cta.secondary': 'شوف الخطوات',
    'lp.proof':
      'كل المعالجة تتم داخل متصفحك — ملفك ما يُرفع لأي خادم، ولا يحتاج حساب ولا اشتراك.',

    'lp.mock.sheet': 'ورقة استيراد سلة',
    'lp.mock.headers': '٤٠ عمود ✓',
    'lp.mock.p1': 'عباية سوداء كلوش',
    // The «منتج» / «خيار» row markers stay Arabic in BOTH languages — they are
    // literal Salla cell values, not UI copy. The option NAME is user data.
    'lp.mock.optName': 'المقاس',
    'lp.mock.check1': 'ورقة واحدة بالاسم اللي سلة تطلبه',
    'lp.mock.check2': 'الوزن والكمية مملوءة في كل صف',
    'lp.mock.check3': 'صف «منتج» + صف لكل تركيبة خيار',

    'lp.strip.label': 'يصدّر إلى',
    'madeby.label': 'مشروع من',
    'author.by': 'by',
    'footer.betaBadge': '🚧 التطبيق تحت التطوير',
    'footer.betaBody':
      'بنطوّر «مزوّد» أول بأول ونضيف مزايا جديدة باستمرار. لو واجهتك أي مشكلة أو عندك اقتراح يحسّنه،',
    'footer.betaCta': 'راسلني على لينكدإن',

    'lp.feat.eyebrow': 'ليه تستخدمه',
    'lp.feat.h2': 'الشيت الفوضوي مش مشكلتك. خلّي المطابقة علينا.',
    'lp.feat.automap.title': 'مطابقة تلقائية',
    'lp.feat.automap.body':
      'يقرأ عناوين أعمدتك — عربي أو إنجليزي — ويربطها بحقول سلة من أول رفعة. وكل تخمين تقدر تعدّله بإيدك.',
    'lp.feat.variants.title': 'خيارات ومتغيّرات',
    'lp.feat.variants.body':
      'المقاسات والألوان تتوسّع تلقائيًا لصف «خيار» لكل تركيبة، مع الرمز SKU والسعر والوزن جاهزين.',
    'lp.feat.validate.title': 'تحقق قبل التصدير',
    'lp.feat.validate.body':
      'اسم ناقص، سعر فاضي، رابط صورة غلط — يطلعوا لك هنا بأرقام صفوفهم، قبل ما سلة ترفض الملف.',

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
    'source.hiddenLink': '🔗 رابط',

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
    'map.options.subtitle':
      'أضِف أي عدد من أعمدة الخيارات — الأعمدة بنفس الاسم تُدمَج في خيار واحد. يُصدَّر حتى ٣ خيارات مختلفة (حد منصّتَي سلة وزد).',
    'map.defaults.title': 'القيم الافتراضية',

    // Map sub-stepper (short chip labels + navigation)
    'map.sec.fields': 'الحقول',
    'map.sec.images': 'الصور',
    'map.sec.sku': 'الرمز SKU',
    'map.sec.options': 'الخيارات',
    'map.sec.defaults': 'الافتراضيات',
    'map.sec.export': 'التصدير',
    'map.sec.prices': 'الأسعار',
    'map.nav.prev': 'السابق',
    'map.nav.next': 'التالي',
    'map.nav.progress': 'القسم {n} من {total}',
    // Quick-view panel
    'qv.file': 'الملف',
    'qv.snippet': 'المعاينة الحية',
    'qv.firstRow': 'أول صف من ملفك',
    'qv.rowsMore': '+{n} صف آخر',
    'qv.none': 'غير محدّد',
    'qv.empty': 'لا توجد بيانات لعرضها',
    'qv.mappedCount': '{n} حقل مرتبط',
    'qv.imagesCount': '{n} صورة',
    'qv.optionsNote': '{combos} متغيّر من {axes} خيار',
    'qv.skuSample': 'مثال الرمز',

    'images.note': 'اختر أعمدة الصور — تُدمج الروابط غير الفارغة (بدون تكرار) في عمود «صورة المنتج».',

    'img.title': 'صور المنتج ({n})',
    'img.uploadCta': '⬆ ارفع صورك واحصل على روابط',
    'img.uploadHint':
      'التطبيق لا يرفع أي ملف — سلة تحتاج رابطًا مباشرًا للصورة. ارفع صورك على الأداة الخارجية، انسخ الروابط، والصقها هنا.',
    'img.addPlaceholder': 'الصق روابط الصور — واحد في كل سطر أو مفصولة بفاصلة',
    'img.addBtn': 'إضافة الروابط',
    'img.clear': 'مسح الكل',
    'img.removeTitle': 'حذف هذا الرابط',
    'img.done': 'تم',
    'img.badge.notImage': 'ليس صورة؟',
    'img.badge.notUrl': 'ليس رابطًا',

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
      'كل عمود خيار يتوسّع إلى صفوف «خيار» أسفل المنتج الأب. الأعمدة التي تحمل نفس الاسم (مثل عدة أعمدة «اللون») تُدمَج تلقائيًا في خيار واحد. القيم المتعددة داخل الخلية تُفصل بفاصلة أو «|» أو سطر جديد.',
    'opt.tooMany': 'لديك {count} خيارات مختلفة — المنصّة تدعم {max} فقط، وسيُصدَّر أول {max}.',
    'opt.group': 'عمود خيار [{n}]',
    'opt.sourceCol': 'العمود المصدر',
    'opt.name': 'اسم الخيار',
    'opt.namePlaceholder': 'مثال: المقاس / اللون',
    'opt.typeLabel': 'النوع',
    'opt.swatchLabel': 'عمود اللون (Hex) — اختياري',
    'opt.swatchInfer': '— (استنتاج من القيمة) —',
    'opt.nameSource': 'مصدر اسم الخيار',
    'opt.nameSource.fixed': 'اسم ثابت',
    'opt.nameSource.column': 'من عمود في الشيت',
    'opt.nameCol': 'عمود الاسم',
    'opt.nameFallback': 'الاسم الاحتياطي',
    'opt.nameColHint':
      'اسم الخيار يُقرأ من هذا العمود لكل منتج على حدة. لو الخلية فاضية في صف ما، يُستخدم «الاسم الاحتياطي».',
    'btn.addOption': '+ إضافة عمود خيار',

    'promo.title': 'العنوان الترويجي',
    'promo.note':
      'سلة ترفض أي عنوان ترويجي أطول من ٢٥ حرفًا. نقصّه تلقائيًا عند حدّ الكلمة، ولو كان فاضيًا نولّده من الاسم أو الوصف.',
    'promo.fallbackLabel': 'لو العنوان الترويجي فاضي، خُذه من',
    'promo.fallback.name': 'اسم المنتج',
    'promo.fallback.description': 'وصف المنتج',
    'promo.fallback.none': 'لا شيء (اتركه فاضيًا)',
    'promo.truncateLabel': 'الحد الأقصى',
    'promo.truncateHint': 'قصّ العنوان تلقائيًا عند ٢٥ حرفًا',

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
    'col.promoTitle': 'العنوان الترويجي',
    'col.weight': 'الوزن',
    'col.opt1': '[1] الخيار',
    'col.opt2': '[2] الخيار',
    'col.opt3': '[3] الخيار',
    'col.images': 'الصور',
    'preview.action': 'إجراء',
    'preview.stats': '{products} منتج · {options} خيار · {total} صف إجمالًا — يظهر {shown}.',
    'preview.editNote':
      'أعمدة «الاسم» و«السعر» و«التصنيف» و«العنوان الترويجي» قابلة للتعديل على المنتجات. في أعمدة الخيارات: صف المنتج يعرض اسم الخيار وصفوف «خيار» تعرض القيمة — والاثنان قابلان للتعديل. زر «حذف» يزيل البند بكل خياراته.',
    'preview.optNameTitle': 'اسم الخيار — يظهر في «[n] الاسم» لهذا المنتج',
    'preview.optRemoveTitle': 'حذف هذه القيمة من الخيار (تُحذف كل التركيبات التي تحتويها)',
    'preview.optRemovedInfo': 'تم حذف {n} قيمة خيار.',
    'preview.imagesBtn': '🖼 {n} — تعديل',
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
    'val.emptyOptionValue': 'صفوف خيار بدون قيمة',
    'val.missingOptionName': 'منتجات لها خيار بدون اسم — اكتب اسم الخيار في المعاينة',
    'val.selectorName': 'أسماء خيارات تبدو كمُحدِّد برمجي',
    'val.promoTitleTooLong': 'العنوان الترويجي يتجاوز 25 حرفًا',
    'val.missingImage': 'منتجات بدون صورة',
    'val.imageNotUrl': 'خانة الصور تحتوي نصًا ليس رابطًا — راجعها من زر «تعديل» في عمود الصور',
    'val.imageNotImage':
      'روابط في خانة الصور لا تبدو صورة (غالبًا رابط صفحة المنتج) — راجعها من زر «تعديل» في عمود الصور',
    'val.missingCategory': 'منتجات بدون تصنيف',
    'val.missingBrand': 'منتجات بدون ماركة',

    'val.zidSku': 'منتجات بدون SKU',
    'val.zidName': 'منتجات بدون اسم عربي (name_ar مطلوب)',
    'val.zidPrice': 'منتجات بدون سعر (price مطلوب)',
    'val.zidWeight': 'منتجات بدون وزن (weight مطلوب)',
    'val.zidUnnamedOption': 'منتجات لها خيارات بدون اسم (تم تجاهلها)',
    'val.zidMissingEn': 'حقول عربية بدون مقابل إنجليزي',

    'zid.subtitle': 'المنتجات ذات الخيارات تُصدَّر كصف أب + صف لكل تركيبة (مثل سلة).',
    'zid.stats': '{count} منتج.',
    'col.variants': 'خيارات؟',
    'col.options': 'الخيارات',

    'export.title': 'خيارات التصدير',
    'export.subtitle': 'إعدادات تُطبَّق على كل المنتجات عند التصدير (الكمية والأسعار).',
    'qty.label': 'الكمية',
    'qty.mode.source': 'كما في الملف المصدر',
    'qty.mode.infinite': 'غير محدود (infinite)',
    'qty.mode.fixed': 'رقم ثابت',
    'qty.fixedValue': 'مثال: 100',
    'qty.hint': 'تُطبَّق على كل المنتجات والمتغيّرات. «غير محدود» يكتب النص infinite.',
    'price.label': 'معادلات الأسعار',
    'price.hint':
      'اشتقّ حقل سعر من حقل آخر. القواعد تُطبَّق بالترتيب، فيمكن لقاعدة أن تبني على نتيجة قاعدة قبلها.',
    'price.empty': 'لا توجد معادلات — الأسعار تُصدَّر كما هي.',
    'price.add': '+ إضافة معادلة',
    'price.remove': 'حذف',
    'price.f.price': 'سعر المنتج',
    'price.f.salePrice': 'السعر المخفض',
    'price.f.cost': 'سعر التكلفة',

    'prices.title': 'معادلات الأسعار',
    'prices.subtitle':
      'اشتقّ «سعر التكلفة» أو «السعر المخفض» من «سعر المنتج» — تُطبَّق على كل منتج، والسعر المخفض ينزل للخيارات كمان.',
  },

  en: {
    'lang.other': 'العربية',

    'hint.scraper.title': '💡 Tip: use Easy Scraper',
    'hint.scraper.body':
      'To pull products from stores, we recommend the “Easy Scraper” extension — it exports a clean file with columns ready to map here.',


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

    // --- Landing (shown only before a file is loaded) ---------------------
    'lp.eyebrow': 'NEW — Zid export just landed',
    'lp.h1.a': 'Turn any product sheet into a',
    'lp.h1.mark1': 'ready Salla file',
    'lp.h1.b': 'in a',
    'lp.h1.mark2': 'minute.',
    'lp.lead':
      'Upload, map your columns, download the import file. Mapping is automatic, options expand into their own variant rows, and validation catches the errors before Salla rejects the file.',
    'lp.cta.primary': 'Start now — upload your file',
    'lp.cta.secondary': 'See the steps',
    'lp.proof':
      'Everything runs inside your browser — your file is never uploaded to any server, and there is no account or subscription.',

    'lp.mock.sheet': 'Salla import sheet',
    'lp.mock.headers': '40 headers ✓',
    'lp.mock.p1': 'Black flared abaya',
    'lp.mock.optName': 'Size',
    'lp.mock.check1': 'One sheet, named exactly as Salla wants',
    'lp.mock.check2': 'Weight and quantity filled on every row',
    'lp.mock.check3': 'A product row + one row per option combo',

    'lp.strip.label': 'EXPORTS TO',
    'madeby.label': 'A project by',
    'author.by': 'by',
    'footer.betaBadge': '🚧 Under active development',
    'footer.betaBody':
      'We keep improving Muzawwid and adding new features. If you hit any issue or have a suggestion to make it better,',
    'footer.betaCta': 'message me on LinkedIn',

    'lp.feat.eyebrow': 'WHY USE IT',
    'lp.feat.h2': 'A messy sheet is not your problem. Leave the mapping to us.',
    'lp.feat.automap.title': 'Automatic mapping',
    'lp.feat.automap.body':
      'It reads your column headers — Arabic or English — and wires them to Salla fields on the first upload. Every guess stays editable.',
    'lp.feat.variants.title': 'Options & variants',
    'lp.feat.variants.body':
      'Sizes and colors expand into an option row per combination, with SKU, price and weight already filled in.',
    'lp.feat.validate.title': 'Validation before export',
    'lp.feat.validate.body':
      'A missing name, an empty price, a bad image link — all listed here with their row numbers, before Salla rejects the file.',

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
    'source.hiddenLink': '🔗 link',

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
    'map.options.subtitle':
      'Add as many option columns as you need — columns with the same name merge into one option. Up to 3 distinct options export (the Salla/Zid ceiling).',
    'map.defaults.title': 'Default values',

    // Map sub-stepper (short chip labels + navigation)
    'map.sec.fields': 'Fields',
    'map.sec.images': 'Images',
    'map.sec.sku': 'SKU',
    'map.sec.options': 'Options',
    'map.sec.defaults': 'Defaults',
    'map.sec.export': 'Export',
    'map.sec.prices': 'Prices',
    'map.nav.prev': 'Back',
    'map.nav.next': 'Next',
    'map.nav.progress': 'Section {n} of {total}',
    // Quick-view panel
    'qv.file': 'File',
    'qv.snippet': 'Live preview',
    'qv.firstRow': 'First row of your file',
    'qv.rowsMore': '+{n} more rows',
    'qv.none': 'Not set',
    'qv.empty': 'Nothing to preview yet',
    'qv.mappedCount': '{n} fields mapped',
    'qv.imagesCount': '{n} images',
    'qv.optionsNote': '{combos} variants from {axes} options',
    'qv.skuSample': 'SKU sample',

    'images.note': 'Pick image columns — non-empty URLs are merged (de-duplicated) into the product image field.',

    'img.title': 'Product images ({n})',
    'img.uploadCta': '⬆ Upload your images & get links',
    'img.uploadHint':
      'This app never uploads a file — Salla needs a direct image link. Upload your images on the external tool, copy the links, and paste them here.',
    'img.addPlaceholder': 'Paste image links — one per line, or comma-separated',
    'img.addBtn': 'Add links',
    'img.clear': 'Clear all',
    'img.removeTitle': 'Remove this link',
    'img.done': 'Done',
    'img.badge.notImage': 'not an image?',
    'img.badge.notUrl': 'not a link',

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
      'Each option column expands into option rows under the parent product. Columns with the same name (e.g. several “Color” columns) merge automatically into one option. Multiple values in a cell are split by comma, “|”, or newline.',
    'opt.tooMany': 'You have {count} distinct options — the platform supports only {max}; the first {max} will be exported.',
    'opt.group': 'Option column [{n}]',
    'opt.sourceCol': 'Source column',
    'opt.name': 'Option name',
    'opt.namePlaceholder': 'e.g. Size / Color',
    'opt.typeLabel': 'Type',
    'opt.swatchLabel': 'Color column (Hex) — optional',
    'opt.swatchInfer': '— (infer from value) —',
    'opt.nameSource': 'Option name from',
    'opt.nameSource.fixed': 'A fixed name',
    'opt.nameSource.column': 'A column in the sheet',
    'opt.nameCol': 'Name column',
    'opt.nameFallback': 'Fallback name',
    'opt.nameColHint':
      'The option name is read from this column per product. When the cell is empty on a row, the fallback name is used.',
    'btn.addOption': '+ Add option column',

    'promo.title': 'Promo title',
    'promo.note':
      'Salla rejects a promo title longer than 25 characters. We clamp it at a word boundary and, when it is empty, derive one from the name or description.',
    'promo.fallbackLabel': 'When the promo title is empty, take it from',
    'promo.fallback.name': 'Product name',
    'promo.fallback.description': 'Product description',
    'promo.fallback.none': 'Nothing (leave it empty)',
    'promo.truncateLabel': 'Length limit',
    'promo.truncateHint': 'Clamp the title to 25 characters automatically',

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
    'col.promoTitle': 'Promo title',
    'col.weight': 'Weight',
    'col.opt1': '[1] Option',
    'col.opt2': '[2] Option',
    'col.opt3': '[3] Option',
    'col.images': 'Images',
    'preview.action': 'Action',
    'preview.stats': '{products} products · {options} options · {total} rows total — showing {shown}.',
    'preview.editNote':
      'Name, Price, Category and Promo title are editable on product rows. In the option columns, a product row shows the option name and each option row shows its value — both editable. Delete removes the item with all its options.',
    'preview.optNameTitle': 'Option name — written to “[n] Name” for this product',
    'preview.optRemoveTitle': 'Remove this value from the option (drops every combination using it)',
    'preview.optRemovedInfo': '{n} option value(s) removed.',
    'preview.imagesBtn': '🖼 {n} — edit',
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
    'val.promoTitleTooLong': 'Promo title exceeds 25 characters',
    'val.orphan': 'Option rows without a parent product',
    'val.emptyOptionValue': 'Option rows carrying no value',
    'val.missingOptionName': 'Products with an unnamed option — type the option name in the preview',
    'val.selectorName': 'Option names that look like a code selector',
    'val.missingImage': 'Products without an image',
    'val.imageNotUrl': 'The images cell holds text that is not a link — fix it via “edit” in the Images column',
    'val.imageNotImage':
      'Links in the images cell that do not look like an image (often the product page) — fix them via “edit” in the Images column',
    'val.missingCategory': 'Products without a category',
    'val.missingBrand': 'Products without a brand',

    'val.zidSku': 'Products without an SKU',
    'val.zidName': 'Products without an Arabic name (name_ar required)',
    'val.zidPrice': 'Products without a price (price required)',
    'val.zidWeight': 'Products without a weight (weight required)',
    'val.zidUnnamedOption': 'Products with unnamed options (skipped)',
    'val.zidMissingEn': 'Arabic fields lacking an English counterpart',

    'zid.subtitle': 'Products with options export as a parent row + one row per combination (like Salla).',
    'zid.stats': '{count} products.',
    'col.variants': 'Variants?',
    'col.options': 'Options',

    'export.title': 'Export options',
    'export.subtitle': 'Settings applied to every product on export (quantity & prices).',
    'qty.label': 'Quantity',
    'qty.mode.source': 'As in the source file',
    'qty.mode.infinite': 'Unlimited (infinite)',
    'qty.mode.fixed': 'Fixed number',
    'qty.fixedValue': 'e.g. 100',
    'qty.hint': 'Applied to every product and variant. “Unlimited” writes the literal infinite.',
    'price.label': 'Price formulas',
    'price.hint':
      'Derive one price field from another. Rules run in order, so a rule can build on a previous result.',
    'price.empty': 'No formulas — prices export as-is.',
    'price.add': '+ Add formula',
    'price.remove': 'Remove',
    'price.f.price': 'Price',
    'price.f.salePrice': 'Discounted price',
    'price.f.cost': 'Cost price',

    'prices.title': 'Price formulas',
    'prices.subtitle':
      'Derive the cost price or the discounted price from the product price — applied to every product, and the discounted price flows down to the options too.',
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
