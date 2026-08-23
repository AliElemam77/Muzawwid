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

    'hint.dismiss': 'إخفاء',
    'history.rows': '{n} صف',
    'saved.count': '{n} منتج',
    'saved.title': '📄 أو ابدأ من شيت محفوظ',
    'saved.subtitle': 'الشيتات اللي خلّصتها وحفظتها — اضغط على واحد يفتح بنفس المطابقة والإعدادات.',
    'tips.toggle': 'نصائح',
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

    'lp.tools.eyebrow': 'أدواتنا',
    'lp.tools.h2': 'مش بس «مزوّد» — دي أدوات تانية من صناعتنا',
    'lp.tools.lead': 'أدوات صغيرة بنبنيها لأصحاب المتاجر والمطوّرين — تختصر عليك وقت وشغل.',
    'lp.tools.try': 'جرّبها الآن ←',
    'lp.tools.soon': '🚧 قريبًا',
    'lp.tools.wepix.body':
      'ارفع صورك مباشرة واحصل على روابط جاهزة تحطها في منتجاتك — نفس الأداة اللي «مزوّد» بيوصّلك لها عند تعديل صور المنتج.',
    'lp.tools.sallaVite.body':
      'إضافة VS Code تبني قوالب سلة أسرع بأكثر من ١٠ أضعاف. قريبًا لكل مطوّري قوالب سلة.',

    'step1.uploadTitle': '١) رفع الملف',
    'step1.uploadSubtitle': 'ابدأ برفع ملف المنتجات بصيغة xlsx أو xls أو csv.',
    'step1.sourceTitle': '١) الملف المصدر',
    'btn.uploadAnother': 'رفع ملف آخر',

    'sidebar.open': 'فتح الملفات المحفوظة',
    'sidebar.close': 'إغلاق',

    'history.title': 'ملفاتك المحفوظة',
    'history.subtitle': 'محفوظة على جهازك فقط.',
    'history.count': '{n} ملف محفوظ',
    'history.empty': 'لا توجد ملفات محفوظة بعد',
    'history.load': 'فتحه للتعديل',
    'history.download': '⬇ تنزيل الملف',
    'history.clear': 'مسح الكل',
    'history.confirmClear': 'تأكيد المسح',
    'history.confirmDelete': 'تأكيد الحذف',
    'history.import': 'أضف شيت من جهازك',
    'history.importHint': 'اسحب الملف هنا أو اضغط للاختيار — xlsx أو xls أو csv',
    'history.importBusy': 'جارٍ قراءة الملف…',
    'history.importDone': 'تم حفظ الشيت ✓',

    'wepix.title': 'رفع الصور — wepix',
    'wepix.note': 'أداة wepix شغّالة هنا جوه «مزوّد» بالتعاون بينا — ارفع صورك، انسخ الروابط، والصقها في الخانة تحت.',
    'wepix.openTab': 'فتح في تبويب جديد ↗',
    'wepix.blocked': 'لو الأداة مش ظاهرة، افتحها في تبويب جديد وارجع الصق الروابط هنا.',
    'history.sheet': 'الورقة: {name}',
    'history.noSnapshot': 'بدون نسخة من الملف — التنزيل غير متاح',

    'download.title': 'تنزيل ملف الاستيراد',
    'download.body': 'هننزّل لك الملف حالًا. تحب كمان نحتفظ بنسخة منه عندك عشان ترجعله أو تنزّله تاني بعدين؟',
    'download.nameLabel': 'اسم الملف المحفوظ',
    'download.saveAndDownload': 'احفظه ونزّله',
    'download.downloadOnly': 'نزّله بس',
    'download.localNote': 'النسخة بتتحفظ في متصفحك على جهازك فقط — مفيش أي رفع لأي خادم.',

    'categories.title': 'تصنيفات متجرك',
    'categories.subtitle':
      'عرّف تصنيفات متجرك مرة واحدة لتختار منها لكل منتج في المعاينة — بدل كتابتها يدويًا.',
    'categories.note':
      'أضف تصنيفات متجرك مرة واحدة لتختار منها لكل منتج في خطوة المعاينة. يمكنك إضافة عدة تصنيفات دفعة واحدة بفصلها بفاصلة، وإضافة تصنيف فرعي داخل أي تصنيف بزر «+ تصنيف فرعي».',
    'categories.placeholder': 'مثال: قمصان، بناطيل، أحذية',
    'categories.storeWarnTitle': 'مهم: التصنيف لازم يكون موجود في متجرك قبل الاستيراد.',
    'categories.storeWarnBody':
      'المنصّة بتربط المنتج بتصنيف موجود عندها فعلاً — مش بتنشئ تصنيفات جديدة من الملف. أي تصنيف تكتبه هنا ومش متضاف في لوحة تحكم متجرك، الاستيراد هيرفضه أو المنتج هيتساب بدون تصنيف. أضِف التصنيفات والتصنيفات الفرعية في متجرك الأول بنفس الأسماء بالظبط.',
    'categories.addMain': 'إضافة تصنيف رئيسي',
    'categories.addSub': '+ تصنيف فرعي',
    'categories.addSubTitle': 'إضافة تصنيف فرعي داخل «{name}»',
    'categories.subPlaceholder': 'تصنيف فرعي داخل «{parent}»',
    'categories.removeTitle': 'حذف التصنيف',
    'categories.removeWithSubs': 'حذف التصنيف ومعه {n} تصنيف فرعي',
    'categories.empty': 'لا توجد تصنيفات بعد — أضف تصنيفات متجرك للبدء.',

    'step2.title': '٢) مطابقة الأعمدة',
    'step3.title': '٣) المعاينة والتصدير',

    'preview.title': 'معاينة المخرجات',
    'preview.quickView': 'معاينة سريعة',
    'preview.subtitle': 'صفوف «منتج» بيضاء وصفوف «خيار» مظلّلة.',
    'validate.title': 'التحقق قبل التصدير',
    'btn.download': '⬇ تحميل ملف الاستيراد (.xlsx)',
    'validate.fixErrors': 'صحّح الأخطاء أعلاه لتفعيل التحميل.',

    'step.upload': 'رفع الملف',
    'step.map': 'مطابقة الأعمدة',
    'step.export': 'تصدير',
    'step.nextToMapping': 'متابعة إلى مطابقة الأعمدة ←',
    'step.backToMapping': '← عودة لتعديل المطابقة',
    'step.backToSource': '← مراجعة الملف الأصلي',
    'step.activeFile': 'الملف الحالي:',
    'categories.collapsibleTitle': 'تصنيفات متجرك',
    'categories.collapsibleSubtitle': 'اختياري — عرّف التصنيفات لتوزيعها بسرعة في المعاينة',


    'uploader.busy': 'جارٍ القراءة…',
    'uploader.cta': 'اسحب ملف الشيت هنا أو اضغط للاختيار',
    'uploader.formats': 'يدعم صيغ .xlsx و .xls و .csv — تتم المعالجة داخل متصفحك فقط',
    'uploader.errNoData': 'لم يتم العثور على أي بيانات في الملف.',
    'uploader.errRead': 'تعذّر قراءة الملف. تأكد أنه بصيغة xlsx أو xls أو csv.',
    'uploader.demo': 'أو جرّب بملف تجريبي جاهز للمعاينة',
    'uploader.demoBtn': '⚡ تجربة بمتجر تجريبي',
    'field.requiredBadge': 'مطلوب',
    'field.sample': 'مثال: {v}',
    'field.searchPlaceholder': 'ابحث في الحقول…',
    'field.filterAll': 'كل الحقول',
    'field.filterRequired': 'الإلزامية',
    'field.filterMapped': 'تم الربط',
    'field.filterUnmapped': 'غير مربوطة',
    'toast.demoLoaded': 'تم تحميل الملف التجريبي بنجاح!',
    'toast.categoryApplied': 'تم تطبيق التصنيف على جميع المنتجات ({n} منتج)',
    'toast.itemDeleted': 'تم استبعاد المنتج من التصدير',
    'toast.allRestored': 'تمت استعادة كافة العناصر المحذوفة',


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
    'map.sec.description': 'قالب الوصف',

    'tpl.title': 'قالب الوصف',
    'tpl.subtitle':
      'اكتب الوصف مرة واحدة بمتغيّرات، وكل منتج ياخد نسخته الخاصة مملوءة من الشيت.',
    'tpl.switchLabel': 'تفعيل قالب الوصف',
    'tpl.switchNote':
      'لما يكون مفعّلًا، الوصف بيتبني من القالب ويستبدل العمود المربوط — عدا المنتجات اللي عدّلت وصفها بإيدك في المعاينة.',
    'tpl.offHint': 'القالب مقفول. لما تفعّله هتقدر تكتب وصفًا واحدًا بمتغيّرات، وكل منتج ياخد نسخته مملوءة من ملفك.',
    'tpl.offCta': 'تفعيل والبدء من قالب جاهز',
    'tpl.startersLabel': 'ابدأ من قالب جاهز',
    'tpl.starter.simple': 'بسيط',
    'tpl.starter.specs': 'مواصفات',
    'tpl.starter.marketing': 'تسويقي',
    'tpl.varsLabel': 'أضف متغيّر (اضغط ليتحط مكان المؤشر)',
    'tpl.varField': 'حقل سلة مربوط — القيمة بعد المعالجة',
    'tpl.varColumn': 'عمود من ملفك',
    'tpl.editorLabel': 'محرر قالب الوصف',
    'tpl.editorPlaceholder': 'اكتب الوصف هنا، وأدرج المتغيّرات من فوق…',
    'tpl.previewLabel': 'معاينة على أول منتج في ملفك',
    'tpl.previewEmpty': 'القالب فاضي، أو كل متغيّراته فاضية في هذا الصف.',
    'tpl.savePlaceholder': 'اسم القالب لحفظه',
    'tpl.saveBtn': 'حفظ القالب',
    'tpl.applyTitle': 'تطبيق هذا القالب',
    'tpl.deleteTitle': 'حذف القالب',

    'rte.bold': 'عريض',
    'rte.italic': 'مائل',
    'rte.ul': 'قائمة نقطية',
    'rte.ol': 'قائمة مرقّمة',
    'rte.heading': 'عنوان فرعي',
    'rte.paragraph': 'فقرة',
    'rte.clear': 'إزالة التنسيق',

    'map.sec.export': 'التصدير',
    'map.sec.prices': 'الأسعار',
    'map.nav.prev': 'السابق',
    'map.nav.next': 'التالي',
    'map.nav.progress': 'القسم {n} من {total}',
    'map.finish': 'إنهاء التخصيص وعرض المخرجات',

    'tips.upload.1': 'ابدأ برفع ملف المنتجات كما هو — لا تحتاج لترتيبه قبل الرفع.',
    'tips.upload.2': 'يدعم ملفات Excel وCSV، وكل المعالجة تتم على جهازك.',
    'tips.upload.3': 'لو الملف فيه أكثر من ورقة، ستختار الورقة الصحيحة في الخطوة التالية.',
    'tips.source.1': 'راجع أول الصفوف للتأكد أن هذه هي ورقة المنتجات الصحيحة.',
    'tips.source.2': 'العناوين في أول صف هي التي سيستخدمها التطبيق لاقتراح المطابقة.',
    'tips.source.3': 'لا تقلق من الروابط الطويلة؛ ستظهر مختصرة هنا ولن تتغير بيانات الملف.',
    'tips.fields.1': 'ابدأ بالاسم والسعر: هما الحقلان الوحيدان اللذان يمنع غيابهما التصدير.',
    'tips.fields.2': 'الاقتراحات التلقائية مجرد بداية — راجعها وعدّلها عند الحاجة.',
    'tips.fields.3': 'استخدم قيمة ثابتة عندما تريد نفس القيمة لكل المنتجات، مثل الماركة.',
    'tips.description.1': 'القالب اختياري؛ فعّله فقط لو تريد إنشاء وصف موحّد تلقائيًا.',
    'tips.description.2': 'استخدم المتغيرات لإدخال بيانات كل منتج داخل نفس الوصف.',
    'tips.description.3': 'المعاينة هنا تستخدم أول منتج من ملفك لتعرف النتيجة قبل التصدير.',
    'tips.images.1': 'اختر فقط الأعمدة التي تحتوي روابط صور مباشرة للمنتجات.',
    'tips.images.2': 'يمكنك اختيار أكثر من عمود؛ الروابط ستُدمج ويُزال التكرار تلقائيًا.',
    'tips.images.3': 'رابط صفحة المنتج ليس صورة — عدّله لاحقًا من معاينة المخرجات إذا لزم.',
    'tips.sku.1': 'إن كان لديك SKU جاهز، اختر من عمود لتحتفظ به كما هو.',
    'tips.sku.2': 'استخدم الترقيم التلقائي فقط عندما لا يوجد رمز منتج في الملف.',
    'tips.sku.3': 'الخيارات ترث رمز المنتج مع إضافة قيمة الخيار تلقائيًا في سلة.',
    'tips.options.1': 'أضف خيارًا عندما يكون المنتج نفسه له نسخ متعددة، مثل تيشيرت واحد له مقاسات وألوان.',
    'tips.options.2': 'لو المقاس واللون في عمودين منفصلين، أضفهما كخيارين. ولو القيم موزعة على أعمدة متعددة لنفس النوع، أضفها كلها واكتب لها نفس الاسم مثل «المقاس» ليتم دمجها.',
    'tips.options.3': 'القيم داخل خلية واحدة والمفصولة بفاصلة أو سطر جديد تتحول إلى تركيبات تلقائيًا. أما إن كان كل variant موجودًا أصلًا في صف مستقل، فهو يحتاج تجميعًا قبل التصدير.',
    'tips.defaults.1': 'هذه القيم تُستخدم فقط عندما تكون خانة المنتج فارغة.',
    'tips.defaults.2': 'الوزن مطلوب؛ اترك القيمة الافتراضية 1 kg إذا لم يكن لديك وزن دقيق.',
    'tips.defaults.3': 'لا تحتاج لإعادة كتابة القيم المشتركة داخل ملفك الأصلي.',
    'tips.export.1': 'استخدم معادلات السعر فقط إن كنت تريد حساب خصم أو تكلفة تلقائيًا.',
    'tips.export.2': 'المعادلات تعمل بالترتيب؛ المعادلة التالية تستطيع استخدام نتيجة السابقة.',
    'tips.export.3': 'عندما تنتهي، اضغط إنهاء التخصيص لمراجعة الملف النهائي.',
    'tips.done.1': 'هذه هي البيانات التي ستُنقل إلى ملف الاستيراد النهائي.',
    'tips.done.2': 'الأخطاء تمنع التصدير؛ التحذيرات تساعدك على تحسين الملف لكنها لا تمنعه.',
    'tips.done.3': 'يمكنك تعديل المنتج من الجدول ثم تنزيل الملف فورًا عندما تصبح جاهزًا.',
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

    // --- اختيار نوع الشيت --------------------------------------------------
    'mode.title': 'إيه اللي محتاج تعمله؟',
    'mode.subtitle': 'سلة بتفصل بيانات المنتجات عن الكميات في ملفين مختلفين.',
    'mode.products.title': 'شيت منتجات',
    'mode.products.body': 'حوّل شيت منتجاتك لقالب الاستيراد الرسمي بتاع سلة أو زد.',
    'mode.quantities.title': 'شيت كميات',
    'mode.quantities.body': 'عدّل كميات المخزون في شيت الكميات المصدّر من سلة.',
    'mode.back': '← رجوع',

    // --- شيت الكميات -------------------------------------------------------
    'qty.download': '⬇ تحميل الملف',

    'qty.uploadTitle': 'ارفع شيت الكميات المصدّر من سلة',
    'qty.uploadSubtitle': 'الملف ده هو الوحيد اللي فيه أرقام المنتجات (IDs) الصح.',
    'qty.pickFile': 'اختر الملف',
    'qty.editTitle': 'تعديل الكميات',
    'qty.wrongFile': 'الملف ده مش شيت كميات بتاع سلة. صدّر الشيت من لوحة تحكم سلة وجرّب تاني.',
    'qty.readFailed': 'تعذّرت قراءة الملف.',
    'qty.emptyFile': 'الملف مفيهوش صفوف.',
    'qty.anotherFile': 'ملف تاني',
    'qty.noNewOptions':
      'هنا تقدر تعدّل كميات الصفوف الموجودة بس. إضافة خيارات جديدة محتاجة IDs من سلة — اعملها على المتجر الأول، وبعدين صدّر الشيت تاني.',
    'qty.fillFromSheet': 'املأ الكميات من شيت منتجات',
    'qty.fillFromSheetHint': 'اختياري — بنطابق بالاسم ونملأ عمود الكمية بس.',
    'qty.merge.matched': '✅ اتملّت كميات {n} صف.',
    'qty.merge.unmatched': '{n} صف في شيت سلة مالقيناش ليه مقابل — سايبينه زي ما هو.',
    'qty.merge.missing': '{n} منتج في شيتك مش موجود في المتجر — اضغط للتفاصيل',

    'qty.search': 'بحث بالاسم…',
    'qty.filter.all': 'كل الصفوف',
    'qty.filter.products': 'المنتجات فقط',
    'qty.filter.options': 'الخيارات فقط',
    'qty.bulkValue': 'الكمية',
    'qty.setAll': 'تعيين للكل',
    'qty.setSelected': 'تعيين للمحدد ({n})',
    'qty.showing': 'معروض {shown} من {total} صف',
    'qty.unlimitedNoNumber': 'الكمية بتتقفل لما «غير محدود الكمية» = نعم.',
    'qty.deleteRow': 'حذف الصف',
    'qty.deleteProduct': 'حذف المنتج وخياراته ({n} صف)',
    'qty.deleteSelected': '🗑 حذف المحدد ({n} صف)',
    'qty.undoDelete': '↩ تراجع عن الحذف',
    'qty.allUnlimited': 'الكل نعم',
    'qty.allLimited': 'الكل لا',
    'qty.selectedUnlimited': 'المحدد نعم ({n})',
    'qty.selectedLimited': 'المحدد لا ({n})',

    'images.note': 'اختر أعمدة الصور — تُدمج الروابط غير الفارغة (بدون تكرار) في عمود «صورة المنتج».',

    // --- جلب الصور من صفحات المنتجات --------------------------------------
    'scrape.title': '🖼️ جلب باقي الصور من صفحات المنتجات',
    'scrape.subtitle':
      'أدوات السحب تلتقط الصورة الظاهرة فقط وتفوّت باقي صور المعرض. لو عندك عمود فيه رابط صفحة المنتج، نفتح كل صفحة ونجيب كل صور المنتج ونضيفها للملف.',
    'scrape.timeWarning': '⏳ تنبيه: عملية جلب الصور تفحص صفحات المنتجات وتستخرج المعرض بالكامل، لذا قد تستغرق بعض الوقت بحسب عدد الروابط. يمكنك إيقاف العملية في أي وقت والاحتفاظ بالصور التي تم جلبها بالفعل.',
    'scrape.fetchingSubtitle': 'جارٍ فحص الروابط واستخراج الصور في الخلفية، يرجى عدم إغلاق الصفحة…',
    'scrape.urlColumn': 'عمود رابط صفحة المنتج',
    'scrape.pickColumn': '— اختر العمود —',
    'scrape.detected': 'مُكتشَف تلقائيًا',
    'scrape.pickHint': 'اخترنا لك عمودًا مقترحًا — بدّله لو كان غير صحيح.',
    'scrape.noColumn': 'ما لقينا عمودًا فيه روابط صفحات منتجات. اختر العمود يدويًا.',
    'scrape.onlyMissing': 'المنتجات التي بلا صور فقط ({n})',
    'scrape.run': 'جلب الصور ({n} منتج)',
    'scrape.cancel': 'إيقاف',
    'scrape.cancelled': 'تم الإيقاف — الصور التي وصلت قبل الإيقاف محفوظة.',
    'scrape.progress': 'جارٍ الجلب… {done} من {total}',
    'scrape.nothingToDo': 'لا توجد منتجات تحتاج جلبًا بهذا الاختيار.',
    'scrape.result': '✅ تمت إضافة {images} صورة إلى {products} منتج.',
    'scrape.empty': '{n} منتج لم نجد له صورًا في صفحته.',
    'scrape.failed': 'تعذّر فتح {n} صفحة — اضغط للتفاصيل',
    'scrape.retryHint':
      'غالبًا ضغط مؤقّت على وسيط التمرير. أعد المحاولة على المنتجات الناقصة فقط.',

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
    'opt.visual.title': 'يعني إيه «خيارات»؟ مثال بالكامل',
    'opt.visual.subtitle': 'شوف بالظبط إيه اللي بيحصل لصف واحد في ملفك لما تحدّد أعمدة الخيارات.',
    'opt.visual.step1': 'ده صف واحد عندك في الملف',
    'opt.visual.step2': 'وده اللي بيطلع في ملف سلة — ٥ صفوف',
    'opt.visual.math': 'كل قيمة في «{size}» بتتضرب في كل قيمة في «{color}» ← ٢ × ٢ = ٤ تركيبات',
    'opt.visual.colName': 'اسم المنتج',
    'opt.visual.colPrice': 'السعر',
    'opt.visual.colType': 'النوع',
    'opt.visual.typeProduct': 'منتج',
    'opt.visual.typeOption': 'خيار',
    'opt.visual.product': 'تيشيرت قطن',
    'opt.visual.legendProduct': 'صف «منتج» واحد — فيه الاسم والسعر والصور',
    'opt.visual.legendOption': 'صف «خيار» لكل تركيبة — تحت المنتج على طول',
    'opt.visual.mergeTitle': 'حالة تانية: نفس الخيار متفرّق على عمودين',
    'opt.visual.size': 'المقاس',
    'opt.visual.sizeOne': 'المقاس (عمود ١)',
    'opt.visual.sizeTwo': 'المقاس (عمود ٢)',
    'opt.visual.color': 'اللون',
    'opt.visual.red': 'أحمر',
    'opt.visual.blue': 'أزرق',
    'opt.visual.mergeResult': 'خيار واحد اسمه «{size}» بـ ٣ قيم: S / M / L',
    'opt.visual.mergeBody': 'لو قيم نفس الخيار متوزّعة على أكتر من عمود، اديهم نفس الاسم — هيتدمجوا في خيار واحد بدل ما يتحسبوا اتنين.',
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
    'btn.cancel': 'إلغاء',
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
    'preview.catPick': 'اختر تصنيفًا أو أكثر',
    'preview.catCount': '{n} تصنيفات',
    'preview.catClear': 'إلغاء تحديد الكل',
    'preview.catEmptyList': 'لا توجد تصنيفات — أضفها من «تصنيفات متجرك».',
    'preview.catCoveredBySub': 'مُغطّى بتصنيف فرعي مختار — ألغِ تحديد الفرعي أولًا.',
    'preview.deletedInfo': 'تم حذف {n} بند من التصدير.',
    'preview.restoreAll': 'استرجاع الكل',
    'preview.deleteTitle': 'حذف هذا البند بكل خياراته',
    'preview.showAll': 'عرض كل الصفوف ({n}) لتعديل كل التصنيفات',
    'preview.showLess': 'عرض أقل',
    'preview.filterAll': 'الكل',
    'preview.filterProducts': 'المنتجات فقط',
    'preview.filterOptions': 'الخيارات فقط',
    'preview.filterNoImages': 'بدون صور',
    'preview.filterNoCategory': 'بدون تصنيف',
    'preview.searchPlaceholder': 'ابحث بالاسم أو الـ SKU…',
    'preview.pageSize': 'عرض {n} صف',
    'preview.statProducts': 'منتجات رئيسية',
    'preview.statOptions': 'خيارات ومتغيرات',
    'preview.statNoImages': 'بدون صور',
    'preview.statNoCategory': 'بدون تصنيف',


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

    'hint.dismiss': 'Dismiss',
    'history.rows': '{n} rows',
    'saved.count': '{n} products',
    'saved.title': '📄 Or start from a saved sheet',
    'saved.subtitle': 'Sheets you finished and saved — one click reopens it with the same mapping and settings.',
    'tips.toggle': 'Tips',
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

    'lp.tools.eyebrow': 'OUR TOOLS',
    'lp.tools.h2': 'Not just Muzawwid — more tools we build',
    'lp.tools.lead': 'Small tools we build for store owners and developers — each one saves you time and effort.',
    'lp.tools.try': 'Try it now →',
    'lp.tools.soon': '🚧 Coming soon',
    'lp.tools.wepix.body':
      'Upload your images and get ready-to-use links for your products — the same tool Muzawwid hands you off to when editing product images.',
    'lp.tools.sallaVite.body':
      'A VS Code extension that builds Salla themes over 10× faster. Coming soon for every Salla theme developer.',

    'step1.uploadTitle': '1) Upload file',
    'step1.uploadSubtitle': 'Start by uploading a product file in xlsx, xls, or csv format.',
    'step1.sourceTitle': '1) Source file',
    'btn.uploadAnother': 'Upload another file',

    'sidebar.open': 'Open saved sheets',
    'sidebar.close': 'Close',

    'history.title': 'Your saved sheets',
    'history.subtitle': 'Stored on this device only.',
    'history.count': '{n} saved sheet(s)',
    'history.empty': 'No saved sheets yet',
    'history.load': 'Open for editing',
    'history.download': '⬇ Download file',
    'history.clear': 'Clear all',
    'history.confirmClear': 'Confirm clear',
    'history.confirmDelete': 'Confirm delete',
    'history.import': 'Add a sheet from your device',
    'history.importHint': 'Drop a file here or click to pick one — xlsx, xls, or csv',
    'history.importBusy': 'Reading the file…',
    'history.importDone': 'Sheet saved ✓',

    'wepix.title': 'Image upload — wepix',
    'wepix.note':
      'wepix runs right here inside Muzawwid through our partnership — upload your images, copy the links, and paste them in the box below.',
    'wepix.openTab': 'Open in a new tab ↗',
    'wepix.blocked': 'If the tool does not appear, open it in a new tab and come back to paste the links.',
    'history.sheet': 'Sheet: {name}',
    'history.noSnapshot': 'No file snapshot — download unavailable',

    'download.title': 'Download import file',
    'download.body':
      'Your file is about to download. Do you also want to keep a copy on this device, so you can reopen or re-download it later?',
    'download.nameLabel': 'Saved file name',
    'download.saveAndDownload': 'Save & download',
    'download.downloadOnly': 'Just download',
    'download.localNote': 'The copy is stored in your browser on this device only — nothing is uploaded.',

    'categories.title': 'Your store categories',
    'categories.subtitle':
      'Define your store categories once, then pick from them per product in the preview — instead of typing each.',
    'categories.note':
      'Add your store categories once, then pick from them per product in the preview step. Separate several with a comma to add them at once, and use “+ Sub-category” to nest one inside another.',
    'categories.placeholder': 'e.g. Shirts, Pants, Shoes',
    'categories.storeWarnTitle':
      'Important: the category must already exist in your store before importing.',
    'categories.storeWarnBody':
      'The platform links each product to a category that already exists in your store — it does not create categories from the file. Any category you type here but have not added in your store dashboard will be rejected on import, or the product will land with no category. Create the categories and sub-categories in your store first, with exactly the same names.',
    'categories.addMain': 'Add main category',
    'categories.addSub': '+ Sub-category',
    'categories.addSubTitle': 'Add a sub-category inside “{name}”',
    'categories.subPlaceholder': 'Sub-category inside “{parent}”',
    'categories.removeTitle': 'Remove category',
    'categories.removeWithSubs': 'Remove this category and its {n} sub-categories',
    'categories.empty': 'No categories yet — add your store categories to start.',

    'step2.title': '2) Map columns',
    'step3.title': '3) Preview & export',

    'preview.title': 'Output preview',
    'preview.quickView': 'Quick view',
    'preview.subtitle': 'Product rows are white; option (variant) rows are shaded.',
    'validate.title': 'Validation before export',
    'btn.download': '⬇ Download import file (.xlsx)',
    'validate.fixErrors': 'Fix the errors above to enable the download.',

    'step.upload': 'Upload',
    'step.map': 'Map columns',
    'step.export': 'Export',
    'step.nextToMapping': 'Continue to Column Mapping →',
    'step.backToMapping': '← Back to Mapping',
    'step.backToSource': '← Review Source File',
    'step.activeFile': 'Active file:',
    'categories.collapsibleTitle': 'Store Categories',
    'categories.collapsibleSubtitle': 'Optional — define categories to easily assign them in preview',


    'uploader.busy': 'Reading…',
    'uploader.cta': 'Drag your sheet here, or click to choose',
    'uploader.formats': 'Supports .xlsx, .xls, .csv — processed only inside your browser',
    'uploader.errNoData': 'No data was found in the file.',
    'uploader.errRead': 'Could not read the file. Make sure it is xlsx, xls, or csv.',
    'uploader.demo': 'Or try with a pre-made sample store',
    'uploader.demoBtn': '⚡ Load Demo Store Sheet',
    'field.requiredBadge': 'Required',
    'field.sample': 'e.g. {v}',
    'field.searchPlaceholder': 'Search fields…',
    'field.filterAll': 'All Fields',
    'field.filterRequired': 'Required',
    'field.filterMapped': 'Mapped',
    'field.filterUnmapped': 'Unmapped',
    'toast.demoLoaded': 'Demo sheet loaded successfully!',
    'toast.categoryApplied': 'Category applied to all products ({n} products)',
    'toast.itemDeleted': 'Product excluded from export',
    'toast.allRestored': 'All excluded items restored',


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
    'map.sec.description': 'Description template',

    'tpl.title': 'Description template',
    'tpl.subtitle':
      'Write the description once with variables — every product gets its own copy, filled from your sheet.',
    'tpl.switchLabel': 'Enable description template',
    'tpl.switchNote':
      'While on, the description is built from the template and replaces the mapped column — except on products whose description you edited by hand in the preview.',
    'tpl.offHint': 'The template is off. Turn it on to write one description with variables — every product gets its own copy, filled from your file.',
    'tpl.offCta': 'Turn on and start from a template',
    'tpl.startersLabel': 'Start from a ready-made template',
    'tpl.starter.simple': 'Simple',
    'tpl.starter.specs': 'Specs',
    'tpl.starter.marketing': 'Marketing',
    'tpl.varsLabel': 'Insert a variable (drops in at the cursor)',
    'tpl.varField': 'Mapped Salla field — the processed value',
    'tpl.varColumn': 'A column from your file',
    'tpl.editorLabel': 'Description template editor',
    'tpl.editorPlaceholder': 'Write the description here, and insert variables from above…',
    'tpl.previewLabel': 'Preview on the first product in your file',
    'tpl.previewEmpty': 'The template is empty, or all of its variables are empty on this row.',
    'tpl.savePlaceholder': 'Name to save this template as',
    'tpl.saveBtn': 'Save template',
    'tpl.applyTitle': 'Apply this template',
    'tpl.deleteTitle': 'Delete template',

    'rte.bold': 'Bold',
    'rte.italic': 'Italic',
    'rte.ul': 'Bulleted list',
    'rte.ol': 'Numbered list',
    'rte.heading': 'Subheading',
    'rte.paragraph': 'Paragraph',
    'rte.clear': 'Clear formatting',

    'map.sec.export': 'Export',
    'map.sec.prices': 'Prices',
    'map.nav.prev': 'Back',
    'map.nav.next': 'Next',
    'map.nav.progress': 'Section {n} of {total}',
    'map.finish': 'Finish customization & view output',

    'tips.upload.1': 'Upload your product sheet as-is — no cleanup is needed first.',
    'tips.upload.2': 'Excel and CSV files are supported, and processing stays on your device.',
    'tips.upload.3': 'If the file has multiple sheets, you will pick the correct one next.',
    'tips.source.1': 'Check the first rows to make sure this is the right product sheet.',
    'tips.source.2': 'The first row contains the column names used for automatic matching.',
    'tips.source.3': 'Long links are shortened only in this preview; your source data is unchanged.',
    'tips.fields.1': 'Start with name and price: they are the only fields that block export when missing.',
    'tips.fields.2': 'Automatic matches are a starting point — review and change them when needed.',
    'tips.fields.3': 'Use a constant when every product should share a value, such as a brand.',
    'tips.description.1': 'The template is optional; enable it only to generate a consistent description automatically.',
    'tips.description.2': 'Insert variables to place each product’s data inside the same description.',
    'tips.description.3': 'The preview uses your first product so you can inspect the result before export.',
    'tips.images.1': 'Select only columns that contain direct product-image links.',
    'tips.images.2': 'You can choose several columns; links are merged and deduplicated automatically.',
    'tips.images.3': 'A product-page link is not an image — correct it later from the output preview if needed.',
    'tips.sku.1': 'If you already have SKUs, choose the source column to preserve them.',
    'tips.sku.2': 'Use automatic numbering only when the source file has no product code.',
    'tips.sku.3': 'For Salla, variants inherit the product SKU plus their option value.',
    'tips.options.1': 'Add an option when one product has several versions, such as one T-shirt in several sizes and colors.',
    'tips.options.2': 'If size and color are separate columns, add them as two options. If one option is spread across several columns, add them all with the same name, such as “Size”, and they will merge.',
    'tips.options.3': 'Values inside one cell separated by commas or new lines become combinations automatically. Variants already supplied as separate rows need grouping before export.',
    'tips.defaults.1': 'These values apply only when a product cell is empty.',
    'tips.defaults.2': 'Weight is required; keep the default 1 kg when the exact weight is unknown.',
    'tips.defaults.3': 'You do not need to repeat shared values in your original sheet.',
    'tips.export.1': 'Use price formulas only when you want discounts or cost calculated automatically.',
    'tips.export.2': 'Formulas run in order, so a later formula can use an earlier result.',
    'tips.export.3': 'When you are done, choose finish customization to review the final file.',
    'tips.done.1': 'These are the exact rows that will be placed in the import file.',
    'tips.done.2': 'Errors block export; warnings improve the file but do not stop it.',
    'tips.done.3': 'Edit a product in the table, then download as soon as you are ready.',
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

    // --- Which sheet? ------------------------------------------------------
    'mode.title': 'What do you need to do?',
    'mode.subtitle': 'Salla keeps product data and stock in two separate files.',
    'mode.products.title': 'Products sheet',
    'mode.products.body': 'Turn your product sheet into Salla’s or Zid’s official import template.',
    'mode.quantities.title': 'Quantities sheet',
    'mode.quantities.body': 'Edit stock levels in the quantities sheet you exported from Salla.',
    'mode.back': '← Back',

    // --- Quantities sheet --------------------------------------------------
    'qty.download': '⬇ Download file',

    'qty.uploadTitle': 'Upload the quantities sheet exported from Salla',
    'qty.uploadSubtitle': 'That file is the only place the real product IDs exist.',
    'qty.pickFile': 'Choose file',
    'qty.editTitle': 'Edit quantities',
    'qty.wrongFile': 'That is not a Salla quantities sheet. Export it from your Salla dashboard and try again.',
    'qty.readFailed': 'Could not read the file.',
    'qty.emptyFile': 'The file has no rows.',
    'qty.anotherFile': 'Another file',
    'qty.noNewOptions':
      'Here you can only change quantities on existing rows. New options need IDs from Salla — create them in the store first, then export the sheet again.',
    'qty.fillFromSheet': 'Fill quantities from a products sheet',
    'qty.fillFromSheetHint': 'Optional — matched by name, only the quantity column is written.',
    'qty.merge.matched': '✅ Filled {n} rows.',
    'qty.merge.unmatched': '{n} rows in Salla’s sheet had no match — left untouched.',
    'qty.merge.missing': '{n} products in your sheet are not in the store — click for details',

    'qty.search': 'Search by name…',
    'qty.filter.all': 'All rows',
    'qty.filter.products': 'Products only',
    'qty.filter.options': 'Options only',
    'qty.bulkValue': 'Quantity',
    'qty.setAll': 'Set for all',
    'qty.setSelected': 'Set for selected ({n})',
    'qty.showing': 'Showing {shown} of {total} rows',
    'qty.unlimitedNoNumber': 'The quantity is locked while “unlimited” is نعم.',
    'qty.deleteRow': 'Delete row',
    'qty.deleteProduct': 'Delete product and its options ({n} rows)',
    'qty.deleteSelected': '🗑 Delete selected ({n} rows)',
    'qty.undoDelete': '↩ Undo delete',
    'qty.allUnlimited': 'All نعم',
    'qty.allLimited': 'All لا',
    'qty.selectedUnlimited': 'Selected نعم ({n})',
    'qty.selectedLimited': 'Selected لا ({n})',

    'images.note': 'Pick image columns — non-empty URLs are merged (de-duplicated) into the product image field.',

    // --- Fetch the rest of the gallery from the product pages -------------
    'scrape.title': '🖼️ Fetch the missing images from the product pages',
    'scrape.subtitle':
      'Scrapers capture only the visible photo and miss the rest of the gallery. If a column holds each product’s page link, we open those pages and add every product image to your file.',
    'scrape.timeWarning': '⏳ Note: Fetching images opens product pages to extract full galleries and may take some time depending on link count. You can stop it at any time and keep fetched images.',
    'scrape.fetchingSubtitle': 'Checking links and extracting image galleries in the background, please keep this tab open…',
    'scrape.urlColumn': 'Product page URL column',
    'scrape.pickColumn': '— pick a column —',
    'scrape.detected': 'auto-detected',
    'scrape.pickHint': 'We suggested a column — change it if it is wrong.',
    'scrape.noColumn': 'No column of product-page links found. Pick one manually.',
    'scrape.onlyMissing': 'Only products with no images ({n})',
    'scrape.run': 'Fetch images ({n} products)',
    'scrape.cancel': 'Stop',
    'scrape.cancelled': 'Stopped — whatever arrived before you stopped is kept.',
    'scrape.progress': 'Fetching… {done} of {total}',
    'scrape.nothingToDo': 'Nothing to fetch with this selection.',
    'scrape.result': '✅ Added {images} images to {products} products.',
    'scrape.empty': '{n} products had no images on their page.',
    'scrape.failed': '{n} pages could not be opened — click for details',
    'scrape.retryHint': 'Usually a temporary limit on the relay. Re-run for the missing products only.',

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
    'opt.visual.title': 'What are options? A full example',
    'opt.visual.subtitle': 'See exactly what happens to one row of your file once you pick option columns.',
    'opt.visual.step1': 'This is one row in your file',
    'opt.visual.step2': 'And this is what lands in the Salla file — 5 rows',
    'opt.visual.math': 'Every value in “{size}” pairs with every value in “{color}” → 2 × 2 = 4 combinations',
    'opt.visual.colName': 'Product name',
    'opt.visual.colPrice': 'Price',
    'opt.visual.colType': 'Type',
    'opt.visual.typeProduct': 'Product',
    'opt.visual.typeOption': 'Option',
    'opt.visual.product': 'Cotton T-shirt',
    'opt.visual.legendProduct': 'One “product” row — name, price and images',
    'opt.visual.legendOption': 'One “option” row per combination, right below it',
    'opt.visual.mergeTitle': 'The other case: one option split across two columns',
    'opt.visual.size': 'Size',
    'opt.visual.sizeOne': 'Size (col 1)',
    'opt.visual.sizeTwo': 'Size (col 2)',
    'opt.visual.color': 'Color',
    'opt.visual.red': 'Red',
    'opt.visual.blue': 'Blue',
    'opt.visual.mergeResult': 'One option named “{size}” with 3 values: S / M / L',
    'opt.visual.mergeBody': 'When the same option is spread over several columns, give them the same name — they merge into one option instead of counting as two.',
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
    'btn.cancel': 'Cancel',
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
    'preview.catPick': 'Pick one or more categories',
    'preview.catCount': '{n} categories',
    'preview.catClear': 'Clear all',
    'preview.catEmptyList': 'No categories yet — add them under “Your store categories”.',
    'preview.catCoveredBySub': 'Covered by a selected sub-category — clear that first.',
    'preview.deletedInfo': '{n} item(s) removed from the export.',
    'preview.restoreAll': 'Restore all',
    'preview.deleteTitle': 'Delete this item and all its options',
    'preview.showAll': 'Show all rows ({n}) to edit every category',
    'preview.showLess': 'Show less',
    'preview.filterAll': 'All',
    'preview.filterProducts': 'Products only',
    'preview.filterOptions': 'Options only',
    'preview.filterNoImages': 'No images',
    'preview.filterNoCategory': 'No category',
    'preview.searchPlaceholder': 'Search by name or SKU…',
    'preview.pageSize': 'Show {n} rows',
    'preview.statProducts': 'Parent Products',
    'preview.statOptions': 'Variants',
    'preview.statNoImages': 'Missing Images',
    'preview.statNoCategory': 'Missing Category',


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
