/* ── i18n MULTILINGUAL SUPPORT (English / हिंदी / বাংলা) ── */

const i18n = {
  en: {
    nav_home: "Home",
    nav_about: "About",
    nav_contact: "Contact",
    nav_devs: "Developers",
    hero_eyebrow: "— RESEARCH-BACKED FORENSIC LEARNING",
    hero_title: 'Two students scored 100%. <em class="text-accent">Only one truly knew.</em>',
    hero_sub: "Traditional grading can't tell the difference between knowledge and a lucky guess. knowGap can — and builds a personalized plan to close the hidden gap.",
    btn_start: "🚀 Start Your Assessment",
    btn_how: "See How It Works",
    stat_questions: "Questions",
    stat_analysis: "AI Analysis",
    stat_results: "Real-time Results",
    stat_free: "Free Forever",
    card_forensic_report: "Forensic Gap Report",
    card_hidden_gap_tag: "Hidden Gap",
    card_cog_profile: "Cognitive Profile",
    card_hidden_gap_detected: "Hidden Gap Detected",
    card_mismatch: "Confidence–Correctness Mismatch",
    card_resp_time: "Response Time",
    card_above_median: "above median",
    card_recommended_focus: "Recommended Focus",
    card_study_plan_title: "Personalised Study Plan",
    card_study_plan_sub: "Generated from your gap score",
    card_daily_commitment: "Daily commitment",
    card_duration: "Duration",
    card_retest_score: "Expected retest score",
    badge_priority: "Priority #1",
    badge_plan_ready: "Plan Ready",
    proof_eyebrow: "THE HIDDEN GAP",
    proof_heading: 'Same score. <span class="gradient-text">Very different knowledge.</span>',
    proof_body: 'Two students both get 100% on a test. Student A was confident. Student B guessed. When retested weeks later, their true understanding reveals a <strong>32.8% gap</strong> — invisible to every traditional grading system.',
    proof_cite: "Based on Fig. 4 — KnowGap Research Paper, IEM Kolkata",
    proof_chart_title: "Retest Score After Same Initial Mark",
    proof_student_a: "Student A",
    proof_tag_sure: "Sure",
    proof_student_b: "Student B",
    proof_tag_guessed: "Guessed",
    proof_gap_annotation: "32.8% knowledge gap hidden by identical scores",
    proof_chart_footer: 'knowGap detects this gap <em>before</em> it costs you in the real exam.',
    profiles_eyebrow: "TABLE 1 — RESEARCH PAPER",
    profiles_title: 'The 4 Cognitive Profiles <span class="gradient-text">knowGap Detects</span>',
    profiles_sub: "Every answer you give is tagged with two signals — correctness & confidence — yielding one of four diagnostic profiles. Traditional grading sees none of this.",
    rule_label: "Classification rule",
    p1_title: "Truly Knows",
    p1_desc: "Student answered correctly and was confident. Genuine mastery — no intervention needed.",
    p1_action: "Maintain",
    p2_title: "Hidden Gap",
    p2_desc: 'Scored correctly <em>but admitted guessing</em>. Traditional grading gives full marks. KnowGap flags this as <strong>high-risk</strong> — a 32.8% retest drop awaits.',
    p2_action: "URGENT — Intervene Now",
    p3_title: "Misconception",
    p3_desc: "Wrong but confident. The student has a false belief hardwired in — most dangerous if uncorrected.",
    p3_action: "Remediate",
    p4_title: "Normal Gap",
    p4_desc: "Wrong and knew it. Standard knowledge gap — addressable with focused review and practice.",
    p4_action: "Review",
    tbl_th_answer: "Answer",
    tbl_th_confidence: "Confidence",
    tbl_th_profile: "Profile",
    tbl_th_risk: "Risk",
    tbl_th_action: "Action",
    tag_correct: "Correct",
    tag_wrong: "Wrong",
    risk_low: "Low",
    risk_critical: "Critical",
    risk_high: "High",
    risk_medium: "Medium",
    how_title: 'How <span class="gradient-text">knowGap</span> Works',
    how_sub: "Three steps to understand your learning gaps completely",
    step1_title: "Take the Test",
    step1_desc: "Choose your subject and answer AI-curated questions with confidence tags.",
    step2_title: "AI Forensic Analysis",
    step2_desc: "Our engine maps every answer to a cognitive profile (Truly Knows, Hidden Gap, Misconception, Normal Gap).",
    step3_title: "Get Your Study Plan",
    step3_desc: "Receive a forensic report and a week-by-week study plan to close critical gaps.",
    footer_copy: "IEM Kolkata knowGap Forensic System"
  },
  hi: {
    nav_home: "मुख्य पृष्ठ",
    nav_about: "हमारे बारे में",
    nav_contact: "संपर्क करें",
    nav_devs: "डेवलपर्स",
    hero_eyebrow: "— अनुसंधान-आधारित फोरेंसिक शिक्षा",
    hero_title: 'दो छात्रों ने 100% अंक प्राप्त किए। <em class="text-accent">केवल एक वास्तव में जानता था।</em>',
    hero_sub: "पारंपरिक मूल्यांकन वास्तविक ज्ञान और तुक्के के बीच अंतर नहीं बता सकता। knowGap यह कर सकता है — और छिपे हुए अंतर को दूर करने के लिए एक व्यक्तिगत अध्ययन योजना बनाता है।",
    btn_start: "🚀 अपना मूल्यांकन शुरू करें",
    btn_how: "देखें यह कैसे काम करता है",
    stat_questions: "प्रश्न",
    stat_analysis: "एआई विश्लेषण",
    stat_results: "तुरंत परिणाम",
    stat_free: "हमेशा के लिए मुफ़्त",
    card_forensic_report: "फोरेंसिक गैप रिपोर्ट",
    card_hidden_gap_tag: "छिपा हुआ अंतर",
    card_cog_profile: "संज्ञानात्मक प्रोफ़ाइल",
    card_hidden_gap_detected: "छिपा हुआ अंतर मिला",
    card_mismatch: "आत्मविश्वास-सटीकता बेमेल",
    card_resp_time: "प्रतिक्रिया समय",
    card_above_median: "औसत से अधिक",
    card_recommended_focus: "अनुशंसित ध्यान",
    card_study_plan_title: "व्यक्तिगत अध्ययन योजना",
    card_study_plan_sub: "आपके गैप स्कोर से तैयार",
    card_daily_commitment: "दैनिक समय",
    card_duration: "अवधि",
    card_retest_score: "अपेक्षित पुन: परीक्षण स्कोर",
    badge_priority: "प्राथमिकता #1",
    badge_plan_ready: "योजना तैयार है",
    proof_eyebrow: "छिपा हुआ अंतर (HIDDEN GAP)",
    proof_heading: 'समान अंक। <span class="gradient-text">बहुत अलग ज्ञान।</span>',
    proof_body: 'दो छात्रों को परीक्षा में 100% अंक मिलते हैं। छात्र A आश्वस्त था। छात्र B ने अनुमान लगाया। हफ्तों बाद जब पुन: परीक्षण किया गया, तो उनकी वास्तविक समझ में <strong>32.8% का अंतर</strong> सामने आया — जो हर पारंपरिक ग्रेडिंग प्रणाली के लिए अदृश्य है।',
    proof_cite: "चित्र 4 पर आधारित — knowGap शोध पत्र, IEM कोलकाता",
    proof_chart_title: "समान शुरुआती अंकों के बाद पुन: परीक्षण स्कोर",
    proof_student_a: "छात्र A",
    proof_tag_sure: "आश्वस्त",
    proof_student_b: "छात्र B",
    proof_tag_guessed: "अनुमान लगाया",
    proof_gap_annotation: "32.8% ज्ञान का अंतर समान अंकों द्वारा छिपा हुआ",
    proof_chart_footer: 'knowGap इस अंतर को वास्तविक परीक्षा में नुकसान होने से <em>पहले</em> पहचान लेता है।',
    profiles_eyebrow: "तालिका 1 — शोध पत्र",
    profiles_title: '4 संज्ञानात्मक प्रोफ़ाइल <span class="gradient-text">knowGap पहचानता है</span>',
    profiles_sub: "आपके द्वारा दिए गए प्रत्येक उत्तर को दो संकेतों के साथ टैग किया जाता है — सटीकता और आत्मविश्वास — जिससे चार नैदानिक प्रोफ़ाइल प्राप्त होते हैं।",
    rule_label: "वर्गीकरण नियम",
    p1_title: "वास्तविक ज्ञान",
    p1_desc: "छात्र ने सही और आत्मविश्वास के साथ उत्तर दिया। वास्तविक दक्षता — किसी हस्तक्षेप की आवश्यकता नहीं।",
    p1_action: "बनाए रखें",
    p2_title: "छिपा हुआ अंतर",
    p2_desc: 'सही अंक प्राप्त किए <em>लेकिन अनुमान लगाने की बात स्वीकार की</em>। पारंपरिक मूल्यांकन पूरे अंक देता है। knowGap इसे <strong>उच्च-जोखिम</strong> के रूप में चिह्नित करता है।',
    p2_action: "तत्काल — अभी हस्तक्षेप करें",
    p3_title: "गलत धारणा",
    p3_desc: "गलत लेकिन आश्वस्त। छात्र के मन में एक गलत धारणा बैठी हुई है — यदि इसे सुधारा न जाए तो यह सबसे खतरनाक है।",
    p3_action: "सुधार करें",
    p4_title: "सामान्य अंतर",
    p4_desc: "गलत था और यह जानता था। मानक ज्ञान का अंतर — केंद्रित समीक्षा और अभ्यास के साथ हल करने योग्य।",
    p4_action: "समीक्षा करें",
    tbl_th_answer: "उत्तर",
    tbl_th_confidence: "आत्मविश्वास",
    tbl_th_profile: "प्रोफ़ाइल",
    tbl_th_risk: "जोखिम",
    tbl_th_action: "कार्रवाई",
    tag_correct: "सही",
    tag_wrong: "गलत",
    risk_low: "कम",
    risk_critical: "गंभीर",
    risk_high: "उच्च",
    risk_medium: "मध्यम",
    how_title: '<span class="gradient-text">knowGap</span> कैसे काम करता है',
    how_sub: "अपनी सीखने की कमियों को पूरी तरह समझने के लिए तीन चरण",
    step1_title: "परीक्षा दें",
    step1_desc: "अपना विषय चुनें और आत्मविश्वास टैग के साथ प्रश्नों के उत्तर दें।",
    step2_title: "एआई फोरेंसिक विश्लेषण",
    step2_desc: "हमारा इंजन हर उत्तर को एक संज्ञानात्मक प्रोफ़ाइल से जोड़ता है।",
    step3_title: "अध्ययन योजना प्राप्त करें",
    step3_desc: "महत्वपूर्ण कमियों को दूर करने के लिए एक सप्ताह-दर-सप्ताह अध्ययन योजना प्राप्त करें।",
    footer_copy: "IEM कोलकाता knowGap फोरेंसिक सिस्टम"
  },
  bn: {
    nav_home: "হোম",
    nav_about: "আমাদের সম্পর্কে",
    nav_contact: "যোগাযোগ",
    nav_devs: "ডেভেলপারস",
    hero_eyebrow: "— গবেষণা-ভিত্তিক ফরেনসিক শিক্ষা",
    hero_title: 'দুই ছাত্র ১০০% নম্বর পেয়েছে। <em class="text-accent">শুধুমাত্র একজন সত্যিই জানত।</em>',
    hero_sub: "ঐতিহ্যবাহী মূল্যায়ন আসল জ্ঞান এবং অনুমানের পার্থক্য বলতে পারে না। knowGap পারে — এবং লুকানো ঘাটতি দূর করতে একটি ব্যক্তিগতকৃত স্টাডি প্ল্যান তৈরি করে।",
    btn_start: "🚀 মূল্যায়ন শুরু করুন",
    btn_how: "কীভাবে কাজ করে দেখুন",
    stat_questions: "প্রশ্নাবলী",
    stat_analysis: "এআই বিশ্লেষণ",
    stat_results: "তাতক্ষণিক ফলাফল",
    stat_free: "আজীবন বিনামূল্যে",
    card_forensic_report: "ফরেনসিক গ্যাপ রিপোর্ট",
    card_hidden_gap_tag: "লুকানো ঘাটতি",
    card_cog_profile: "কগনিটিভ প্রোফাইল",
    card_hidden_gap_detected: "লুকানো ঘাটতি ধরা পড়েছে",
    card_mismatch: "আত্মবিশ্বাস ও সঠিকতার অমিল",
    card_resp_time: "প্রতিক্রিয়ার সময়",
    card_above_median: "গড়ের উপরে",
    card_recommended_focus: "সুপারিশকৃত বিষয়বস্তু",
    card_study_plan_title: "ব্যক্তিগতকৃত স্টাডি প্ল্যান",
    card_study_plan_sub: "আপনার গ্যাপ স্কোর থেকে তৈরি",
    card_daily_commitment: "দৈনিক সময়",
    card_duration: "সময়কাল",
    card_retest_score: "প্রত্যাশার পুনঃপরীক্ষা স্কোর",
    badge_priority: "অগ্রাধিকার #১",
    badge_plan_ready: "প্ল্যান প্রস্তুত",
    proof_eyebrow: "লুকানো ঘাটতি (HIDDEN GAP)",
    proof_heading: 'একই নম্বর। <span class="gradient-text">খুব আলাদা জ্ঞান।</span>',
    proof_body: 'দুই ছাত্রই পরীক্ষায় ১০০% পায়। ছাত্র A আত্মবিশ্বাসী ছিল। ছাত্র B অনুমান করেছিল। কয়েক সপ্তাহ পরে পুনরায় পরীক্ষা করা হলে, তাদের আসল বোঝার মধ্যে <strong>৩২.৮% ঘাটতি</strong> ধরা পড়ে — যা ঐতিহ্যবাহী গ্রেডিং সিস্টেমে অদৃশ্য।',
    proof_cite: "চিত্র ৪ এর উপর ভিত্তি করে — knowGap গবেষণা পত্র, IEM কলকাতা",
    proof_chart_title: "একই শুরুর নম্বরের পর পুনরায় পরীক্ষার স্কোর",
    proof_student_a: "ছাত্র A",
    proof_tag_sure: "নিশ্চিত",
    proof_student_b: "ছাত্র B",
    proof_tag_guessed: "অনুমান করেছিল",
    proof_gap_annotation: "৩২.৮% জ্ঞানের ঘাটতি একই নম্বরের পেছনে লুকানো",
    proof_chart_footer: 'knowGap আসল পরীক্ষায় ক্ষতি হওয়ার <em>আগেই</em> এই ঘাটতি সনাক্ত করে।',
    profiles_eyebrow: "সারণী ১ — গবেষণা পত্র",
    profiles_title: '৪টি কগনিটিভ প্রোফাইল <span class="gradient-text">knowGap সনাক্ত করে</span>',
    profiles_sub: "আপনার প্রতিটি উত্তর দুটি সংকেত দিয়ে চিহ্নিত করা হয় — সঠিকতা এবং আত্মবিশ্বাস — যার ফলে চারটি ডায়াগনস্টিক প্রোফাইল পাওয়া যায়।",
    rule_label: "শ্রেণীকরণ নিয়ম",
    p1_title: "প্রকৃত জ্ঞান",
    p1_desc: "ছাত্র সঠিকভাবে এবং আত্মবিশ্বাসের সাথে উত্তর দিয়েছে। আসল দক্ষতা — কোনো হস্তক্ষেপের প্রয়োজন নেই।",
    p1_action: "বজায় রাখুন",
    p2_title: "লুকানো ঘাটতি",
    p2_desc: 'সঠিকভাবে উত্তর দিয়েছে <em>কিন্তু অনুমান করার কথা স্বীকার করেছে</em>। সাধারণ গ্রেডিং পুরো নম্বর দেয়। knowGap এটিকে <strong>উচ্চ-ঝুঁকিপূর্ণ</strong> হিসাবে চিহ্নিত করে।',
    p2_action: "অত্যন্ত জরুরি — এখনই পদক্ষেপ নিন",
    p3_title: "ভুল ধারণা",
    p3_desc: "ভুল কিন্তু আত্মবিশ্বাসী। ছাত্রের মনে ভুল ধারণা বদ্ধমূল হয়ে আছে — যা সংশোধন না করা হলে সবচেয়ে বিপজ্জনক।",
    p3_action: "সংশোধন করুন",
    p4_title: "সাধারণ ঘাটতি",
    p4_desc: "ভুল হয়েছে এবং তা জানত। সাধারণ জ্ঞানের ঘাটতি — পর্যালোচনা এবং অনুশীলনের মাধ্যমে সমাধানযোগ্য।",
    p4_action: "পর্যালোচনা করুন",
    tbl_th_answer: "উত্তর",
    tbl_th_confidence: "আত্মবিশ্বাস",
    tbl_th_profile: "প্রোফাইল",
    tbl_th_risk: "ঝুঁকি",
    tbl_th_action: "পদক্ষেপ",
    tag_correct: "সঠিক",
    tag_wrong: "ভুল",
    risk_low: "কম",
    risk_critical: "আশঙ্কাজনক",
    risk_high: "উচ্চ",
    risk_medium: "মাঝারি",
    how_title: '<span class="gradient-text">knowGap</span> কীভাবে কাজ করে',
    how_sub: "আপনার শিক্ষার ঘাটতিগুলি সম্পূর্ণরূপে বোঝার জন্য তিনটি পদক্ষেপ",
    step1_title: "পরীক্ষা দিন",
    step1_desc: "বিষয় নির্বাচন করুন এবং আত্মবিশ্বাস ট্যাগ সহ উত্তর দিন।",
    step2_title: "এআই ফরেনসিক বিশ্লেষণ",
    step2_desc: "আমাদের ইঞ্জিন প্রতিটি উত্তরকে একটি ডায়াগনস্টিক প্রোফাইলে ম্যাপ করে।",
    step3_title: "স্টাডি প্ল্যান পান",
    step3_desc: "গুরুত্বপূর্ণ ঘাটতি দূর করতে সাপ্তাহিক স্টাডি প্ল্যান পান।",
    footer_copy: "IEM কলকাতা knowGap ফরেনসিক সিস্টেম"
  }
};

function getSavedLanguage() {
  return localStorage.getItem('knowgap_lang') || 'en';
}

function setLanguage(lang) {
  if (!i18n[lang]) return;
  localStorage.setItem('knowgap_lang', lang);
  document.documentElement.lang = lang;
  applyTranslations(lang);

  // Sync all language dropdown selectors
  document.querySelectorAll('.lang-select').forEach(sel => {
    sel.value = lang;
  });
}

function applyTranslations(lang) {
  const dict = i18n[lang] || i18n.en;

  // Apply to elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });
}

function renderLangSelectorHTML(currentLang) {
  const lang = currentLang || getSavedLanguage();
  return `
    <div class="lang-selector-wrap">
      <span style="font-size:0.9rem">🌐</span>
      <select class="lang-select" aria-label="Select Language" onchange="setLanguage(this.value)">
        <option value="en" ${lang === 'en' ? 'selected' : ''}>English</option>
        <option value="hi" ${lang === 'hi' ? 'selected' : ''}>हिंदी (Hindi)</option>
        <option value="bn" ${lang === 'bn' ? 'selected' : ''}>বাংলা (Bengali)</option>
      </select>
    </div>
  `;
}

function injectLangSelectors() {
  const currentLang = getSavedLanguage();
  
  // Inject into desktop nav container if available
  const navAuth = document.querySelector('.navbar-auth');
  const navLinks = document.getElementById('home-nav-links') || document.querySelector('.navbar-links');
  const topBar = document.querySelector('.app-top-bar');
  
  if (navAuth && !navAuth.querySelector('.lang-selector-wrap')) {
    const wrap = document.createElement('div');
    wrap.innerHTML = renderLangSelectorHTML(currentLang);
    navAuth.prepend(wrap.firstElementChild);
  } else if (navLinks && !navLinks.querySelector('.lang-selector-wrap')) {
    const wrap = document.createElement('div');
    wrap.innerHTML = renderLangSelectorHTML(currentLang);
    navLinks.prepend(wrap.firstElementChild);
  } else if (topBar && !topBar.querySelector('.lang-selector-wrap')) {
    const wrap = document.createElement('div');
    wrap.innerHTML = renderLangSelectorHTML(currentLang);
    topBar.insertBefore(wrap.firstElementChild, topBar.lastElementChild);
  } else {
    // Fallback: append inside navbar container if not present
    const container = document.querySelector('.navbar .container');
    if (container && !container.querySelector('.lang-selector-wrap')) {
      const wrap = document.createElement('div');
      wrap.innerHTML = renderLangSelectorHTML(currentLang);
      container.appendChild(wrap.firstElementChild);
    }
  }

  // Inject into mobile actions if available
  const mobileActions = document.getElementById('mobile-nav-actions');
  if (mobileActions && !mobileActions.querySelector('.lang-selector-wrap')) {
    const mWrap = document.createElement('div');
    mWrap.innerHTML = renderLangSelectorHTML(currentLang);
    mobileActions.prepend(mWrap.firstElementChild);
  }
}

// Auto-run when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  const currentLang = getSavedLanguage();
  document.documentElement.lang = currentLang;
  applyTranslations(currentLang);
  
  // Try immediately and after nav initialization
  setTimeout(injectLangSelectors, 50);
  setTimeout(injectLangSelectors, 300);
});
