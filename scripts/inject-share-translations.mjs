import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');

const translations = {
  ar: {
    "title": "🎉 اكتمل! الرابط الخاص بك يعمل",
    "published": "تم نشر الصفحة",
    "publishedDesc": "أضفه إلى بايو إنستغرام أو تيليجرام أو واتساب للحصول على نقرات.",
    "yourPageLink": "الرابط الخاص بك",
    "linkCopied": "تم نسخ الرابط!",
    "copyError": "خطأ في النسخ!",
    "shareNow": "مشاركة",
    "returnTomorrow": "عد غداً للتحقق من إحصائياتك!",
    "downloadQR": "تنزيل رمز QR"
  },
  be: {
    "title": "🎉 Гатова! Твая спасылка працуе",
    "published": "Старонка апублікаваная",
    "publishedDesc": "Дадай яе ў bio Instagram, Telegram або WhatsApp, каб атрымліваць клікі.",
    "yourPageLink": "Твая спасылка",
    "linkCopied": "Спасылка скапіяваная!",
    "copyError": "Памылка капіявання!",
    "shareNow": "Падзяліцца",
    "returnTomorrow": "Вярніся заўтра, каб паглядзець статыстыку!",
    "downloadQR": "Спампаваць QR-код"
  },
  de: {
    "title": "🎉 Fertig! Dein Link ist live",
    "published": "Seite veröffentlicht",
    "publishedDesc": "Füge ihn deiner Instagram-, Telegram- oder WhatsApp-Bio hinzu, um Klicks zu erhalten.",
    "yourPageLink": "Dein Link",
    "linkCopied": "Link kopiert!",
    "copyError": "Kopierfehler!",
    "shareNow": "Teilen",
    "returnTomorrow": "Komm morgen zurück, um deine Statistiken zu sehen!",
    "downloadQR": "QR-Code herunterladen"
  },
  es: {
    "title": "🎉 ¡Listo! Tu enlace está activo",
    "published": "Página publicada",
    "publishedDesc": "Agrégalo a tu biografía de Instagram, Telegram o WhatsApp para obtener clics.",
    "yourPageLink": "Tu enlace",
    "linkCopied": "¡Enlace copiado!",
    "copyError": "¡Error al copiar!",
    "shareNow": "Compartir",
    "returnTomorrow": "¡Vuelve mañana para ver tus estadísticas!",
    "downloadQR": "Descargar código QR"
  },
  fr: {
    "title": "🎉 Terminé ! Votre lien est actif",
    "published": "Page publiée",
    "publishedDesc": "Ajoutez-le à votre bio Instagram, Telegram ou WhatsApp pour obtenir des clics.",
    "yourPageLink": "Votre lien",
    "linkCopied": "Lien copié !",
    "copyError": "Erreur de copie !",
    "shareNow": "Partager",
    "returnTomorrow": "Revenez demain pour consulter vos statistiques !",
    "downloadQR": "Télécharger le code QR"
  },
  it: {
    "title": "🎉 Fatto! Il tuo link è attivo",
    "published": "Pagina pubblicata",
    "publishedDesc": "Aggiungilo alla tua bio di Instagram, Telegram o WhatsApp per ottenere clic.",
    "yourPageLink": "Il tuo link",
    "linkCopied": "Link copiato!",
    "copyError": "Errore di copia!",
    "shareNow": "Condividi",
    "returnTomorrow": "Torna domani per controllare le tue statistiche!",
    "downloadQR": "Scarica il codice QR"
  },
  ja: {
    "title": "🎉 完了！リンクが有効になりました",
    "published": "ページが公開されました",
    "publishedDesc": "Instagram、Telegram、またはWhatsAppのプロフィールに追加してクリックを獲得しましょう。",
    "yourPageLink": "あなたのリンク",
    "linkCopied": "リンクをコピーしました！",
    "copyError": "コピーエラー！",
    "shareNow": "シェア",
    "returnTomorrow": "明日戻って統計をチェックしてください！",
    "downloadQR": "QRコードをダウンロード"
  },
  ko: {
    "title": "🎉 완료! 링크가 활성화되었습니다",
    "published": "페이지 게시됨",
    "publishedDesc": "Instagram, Telegram 또는 WhatsApp 소개에 추가하여 클릭을 유도하세요.",
    "yourPageLink": "내 링크",
    "linkCopied": "링크가 복사되었습니다!",
    "copyError": "복사 오류!",
    "shareNow": "공유",
    "returnTomorrow": "내일 돌아와서 통계를 확인하세요!",
    "downloadQR": "QR 코드 다운로드"
  },
  pt: {
    "title": "🎉 Pronto! Seu link está ativo",
    "published": "Página publicada",
    "publishedDesc": "Adicione na sua bio do Instagram, Telegram ou WhatsApp para receber cliques.",
    "yourPageLink": "Seu link",
    "linkCopied": "Link copiado!",
    "copyError": "Erro ao copiar!",
    "shareNow": "Compartilhar",
    "returnTomorrow": "Volte amanhã para conferir suas estatísticas!",
    "downloadQR": "Baixar QR Code"
  },
  tr: {
    "title": "🎉 Hazır! Bağlantınız yayında",
    "published": "Sayfa yayınlandı",
    "publishedDesc": "Tıklama almak için Instagram, Telegram veya WhatsApp biyografinize ekleyin.",
    "yourPageLink": "Senin bağlantın",
    "linkCopied": "Bağlantı kopyalandı!",
    "copyError": "Kopyalama hatası!",
    "shareNow": "Paylaş",
    "returnTomorrow": "İstatistiklerinizi kontrol etmek için yarın geri dönün!",
    "downloadQR": "QR kodunu indir"
  },
  uk: {
    "title": "🎉 Готово! Твоє посилання працює",
    "published": "Сторінку опубліковано",
    "publishedDesc": "Додай його в bio Instagram, Telegram або WhatsApp, щоб отримувати кліки.",
    "yourPageLink": "Твоє посилання",
    "linkCopied": "Посилання скопійовано!",
    "copyError": "Помилка копіювання!",
    "shareNow": "Поділитися",
    "returnTomorrow": "Повернись завтра, щоб перевірити статистику!",
    "downloadQR": "Завантажити QR-код"
  },
  uz: {
    "title": "🎉 Tayyor! Havolangiz ishlayapti",
    "published": "Sahifa e'lon qilindi",
    "publishedDesc": "Kliklarni olish uchun uni Instagram, Telegram yoki WhatsApp bio ga qo'shing.",
    "yourPageLink": "Sizning havolangiz",
    "linkCopied": "Havola nusxalandi!",
    "copyError": "Nusxalash xatosi!",
    "shareNow": "Ulashish",
    "returnTomorrow": "Statistikani ko'rish uchun ertaga qaytib keling!",
    "downloadQR": "QR-kodni yuklab olish"
  },
  zh: {
    "title": "🎉 完成！您的链接已生效",
    "published": "页面已发布",
    "publishedDesc": "将其添加到您的 Instagram、Telegram 或 WhatsApp 简介中以获取点击。",
    "yourPageLink": "您的链接",
    "linkCopied": "链接已复制！",
    "copyError": "复制错误！",
    "shareNow": "分享",
    "returnTomorrow": "明天回来查看您的统计数据！",
    "downloadQR": "下载二维码"
  }
};

async function main() {
  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const lang = file.replace('.json', '');
    if (!translations[lang]) continue; // Skip en, ru, kk which are already done

    const filePath = path.join(localesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);

    json.share = translations[lang];

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Updated ${file}`);
  }
  console.log('All missing share translations injected.');
}

main().catch(console.error);
