import { useApp } from './contexts/AppContext'

const translations = {
  en: {
    newChat: 'New chat',
    active: 'Active',
    archived: 'Archived',
    conversations: 'Conversations',
    searchChats: 'Search chats',
    noChats: 'Your chats will appear here.',
    noMatches: 'No matching conversations.',
    noModel: 'No model selected',
    promptLibrary: 'Prompt library',
    insights: 'Insights',
    settings: 'Settings',
    selectModel: 'Select model',
    loadingModels: 'Loading models...',
    welcomeEyebrow: 'WELCOME TO OMNICHAT',
    welcomeTitle: 'One app. Every medium.',
    welcomeText: 'Chat, illustrate, narrate, and create video through any OpenAI-compatible provider.',
    chooseModel: 'Choose your model',
    sendHint: 'Enter to send · Shift + Enter for a new line',
    offline: 'You’re offline. Saved chats are still available.',
    text: 'Text',
    image: 'Image',
    audio: 'Audio',
    video: 'Video',
  },
  fa: {
    newChat: 'گفت‌وگوی جدید',
    active: 'فعال',
    archived: 'بایگانی',
    conversations: 'گفت‌وگوها',
    searchChats: 'جست‌وجوی گفت‌وگوها',
    noChats: 'گفت‌وگوهای شما اینجا نمایش داده می‌شوند.',
    noMatches: 'گفت‌وگویی پیدا نشد.',
    noModel: 'مدلی انتخاب نشده',
    promptLibrary: 'کتابخانه پرامپت',
    insights: 'آمار و تحلیل',
    settings: 'تنظیمات',
    selectModel: 'انتخاب مدل',
    loadingModels: 'در حال دریافت مدل‌ها...',
    welcomeEyebrow: 'به OMNICHAT خوش آمدید',
    welcomeTitle: 'یک برنامه برای همه‌چیز.',
    welcomeText: 'با هر سرویس سازگار با OpenAI گفتگو کنید و تصویر، صدا و ویدئو بسازید.',
    chooseModel: 'مدل را انتخاب کنید',
    sendHint: 'Enter برای ارسال · Shift + Enter برای خط جدید',
    offline: 'اتصال اینترنت قطع است؛ گفت‌وگوهای ذخیره‌شده در دسترس هستند.',
    text: 'متن',
    image: 'تصویر',
    audio: 'صدا',
    video: 'ویدئو',
  },
}

export function useI18n() {
  const { settings } = useApp()
  const language = settings.language === 'fa' ? 'fa' : 'en'
  const t = (key) => translations[language][key] || translations.en[key] || key
  return { language, direction: language === 'fa' ? 'rtl' : 'ltr', t }
}
