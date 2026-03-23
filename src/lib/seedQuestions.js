import { supabase } from "./supabase";

const PSYCHOLOGICAL_TEXTS = [
  "Men har doim bergan va'dalarimni bajaraman",
  "Mening boshqalar bilan bo'lishishni istamaydigan fikrlarim bor",
  "Jahlim chiqqanda tez-tez o'zimni boshqara olmay qolaman",
  "Ba'zida g'iybat qilishim mumkin",
  "Ba'zida o'zim tushunmaydigan narsalar haqida gapirishga to'g'ri keladi",
  "Men doim faqat rost gapiraman",
  "Maqtanishni yoqtiraman",
  "Men hech qachon kechikmayman",
  "Men barcha odatlarimni yaxshi deb bilaman",
  "Ba'zida ota-onam bilan gap talashib yoki janjallashib qolaman",
  "Ba'zan ko'chani kerakli joydan emas, o'zim uchun qulay bo'lgan joyda kesib o'taman",
  "Men doim transportda yo'l haqqini to'layman",
  "Ba'zida qo'pol behayo so'zlar bilan urishgim keladi",
  "Tanishlarim orasida menga yoqmaydigan odamlar ham bor",
  "Men hech qachon ijtimoiy xulq-atvor qoidalarini buzmayman",
  "Men o'qishni va ishlashni xohlamayman",
  "Men uydan ketib, boshqa joyda yashashim mumkin",
  "Meni yomon xulq-atvorim uchun militsiyaga olib ketishgan",
  "Agar menga kerak bo'lsa yoki chindan ham xohlasam, boshqa birovni narsasini olishim mumkin",
  "Men voyaga yetmaganlar ishlari bo'yicha bo'limda ro'yxatga olinganman",
  "Meni ko'pincha atrofdagilar xafa qilishadi (laqab qo'yishadi, kaltaklashadi, pul va narsalarni olib qo'yishadi)",
  "Meni sudlangan qarindoshlarim yoki tanishlarim bor",
  "Menda amalga oshishi kerak bo'lgan kuchli istaklarim bor",
  "Menda adolatni tiklash uchun qasos olish istagi bor",
  "Men atrofdagilarga ishonmayman",
  "Men buyuk va kuchli bo'lishni xohlayman",
  "Men umidsizlikni, xafagarchilikni, kuchsiz g'azabni his qilyapman",
  "Men sinfdoshlarimga, boshqa odamlarga, kattalarga hasad qilaman",
  "Agar mumkin bo'lmasa, ammo chindan xohlasangiz, unda mumkin",
  "Kuchli va boy odamlar barcha qoidalar va qonunlarga rioya qilishlari shart emas",
  "Men tamaki chekaman",
  "Men pivo yoki boshqa spirtli ichimliklar iste'mol qilaman",
  "Men bo'yoq, yelimni xidlab ko'rganman va psixotrop dori vositalarini iste'mol qilganman",
  "Ota-onam tez-tez spirtli ichimliklarni iste'mol qilib turishadi",
  "Do'stlarim chekadilar, spirtli ichimliklar ichishadi",
  "Insonlar mast qiluvchi ichimliklarni kayfiyatni ko'tarish uchun iste'mol qiladilar",
  "Spirtli ichimliklar iste'mol qilish va tamaki mahsulotlarini chekish - ulg'ayganlik belgisini bildiradi",
  "Oiladagi, maktabdagi muammolardan yoki yolg'izlikdan ichgim yoki chekim keladi",
  "Bolalar, kattalar urf bo'lganligi va topish osonligi sababli ichib va chekadilar",
  "Bolalar qiziquvchanlikdan, ahmoqlikdan ichishadi va chekishadi",
  "Biror narsadan lazzatlanish - hayotda intilish kerak bo'lgan eng muhim narsa",
  "Menga kuchli hissiyotlar va tajriba kerak",
  "Hech kimga bildirmay, spirtli ichimliklar, tamaki mahsulotlari va giyohvand moddalarni sinab ko'rgim keladi",
  "Spirtli ichimliklar va tamakining odamlarga zararli ta'sirini bo'rttirib yuborishgan",
  "Agar atrofimdagilar chekishsa, ichishsa men ham buni qilaman",
  "Men hayvonlarga, odamlarga kamdan-kam achinaman",
  "Men tez-tez o'qituvchilar, sinfdoshlar bilan bahslashaman yoki tortishaman",
  "Ota-onam bilan tez-tez urishib turaman",
  "Men haqoratlarni kechirmayman",
  "Kayfiyatim yomon bo'lsa, boshqa birovni ham xafa qilib qo'yishim mumkin",
  "Boshqalarni g'iybat qilishni yaxshi ko'raman",
  "Menga hamma bo'ysunishini xohlayman",
  "Men bahslarni so'z bilan emas, janjal bilan hal qilishni afzal ko'raman",
  "Do'stlarim bilan birga men biror narsani buzishim mumkin, begonalarni bezovta qilishim mumkin",
  "Ko'pincha men jirkanish, nafrat, g'azabni his qilaman",
  "Menda biror narsani sindirish, baland ovozda gapirish, eshikni taqillatib yopish, baqirish, janjal qilish istagi bor",
  "G'azablanganimda baqirishim yoki kimnidir urishim mumkin",
  "Men ba'zi jangovar harakatlarda mamnuniyat bilan qatnashgan bo'lardim",
  "Agar biror narsa menga yoqmasa, boshqa birovning narsasini ataylab buzishim mumkin",
  "Men katta va kuchli bo'lishni xohlayman",
  "Meni hech kim tushunmayotganini, hech kim menga qiziqmayotganini his qilyapman",
  "Menga hech narsa bog'liq emasligini his qilaman, umidsizlikka tushaman",
  "O'zimga ba'zida zarar yetkazishim mumkin",
  "Maoshi yaxshi bo'lsa, hayotim uchun xavfli bo'lgan ishga ham kirishardim",
  "O'zimga turli yo'llar bilan yetkazgan har qanday zarar kattalarning e'tiborini tortadi va ular menga boshqacha munosabatda bo'lishadi, deb o'ylayman",
  "Boshqalar, ota-onalar oldida o'zimni aybdor his qilaman",
  "Muammolarimni o'zim hal qila olmayman, boshqalarni yordamini kutaman",
  "Ro'yobga chiqmagan orzularim juda ko'p",
  "Men o'zimni yaxshi inson deb o'ylamayman",
  "Nima qilish mumkin va nima mumkin emasligini har doim ham tushunmayman",
  "Men ko'pincha biron bir narsa xususida qaror qabul qila olmayman",
  "Ko'prik ustida turganimda, ba'zan pastga sakragim keladi",
  "Men iliq, ishonchli munosabatlarga ehtiyoj sezaman",
  "Ataylab og'riqqa chidash ba'zan men uchun yoqimli",
  "Men his-hayajonga to'la hayotga ehtiyoj sezaman",
];

function psychCategoryForOrder(orderNum) {
  if (orderNum <= 15) return "lie_scale";
  if (orderNum <= 30) return "delinquency";
  if (orderNum <= 45) return "addiction";
  if (orderNum <= 60) return "aggression";
  return "self_harm";
}

/** 25 ta portret savoli: matn + variantlar */
const PORTRAIT_QUESTIONS = [
  {
    text: "Ko'z oldingizga dengizni keltiring. Qaysi hayvon birinchi yodingizga tushadi?",
    options: [
      { option_text: "Akula", personality_type: "leadership", points: 2 },
      { option_text: "Kit", personality_type: "intellectual", points: 2 },
      { option_text: "Delfin", personality_type: "social", points: 2 },
      { option_text: "Oddiy baliq", personality_type: "emotional", points: 1 },
    ],
  },
  {
    text: "Tasavvur qiling, siz o'rmon ichida yurasiz. Qanday yo'lni tanlaysiz?",
    options: [
      { option_text: "To'g'ri keng yo'l", personality_type: "leadership", points: 2 },
      { option_text: "Tor va sirli yo'l", personality_type: "intellectual", points: 2 },
      { option_text: "Daraxtlar orasidagi notekis yo'l", personality_type: "leadership", points: 1 },
      { option_text: "Daryo bo'yidagi yo'l", personality_type: "emotional", points: 2 },
    ],
  },
  {
    text: "Agar siz qush bo'lsangiz, qaysi biri bo'lardingiz?",
    options: [
      { option_text: "Burgut", personality_type: "leadership", points: 2 },
      { option_text: "Qaldirg'och", personality_type: "social", points: 2 },
      { option_text: "Boyqush", personality_type: "intellectual", points: 2 },
      { option_text: "Kabutar", personality_type: "emotional", points: 2 },
    ],
  },
  {
    text: "Sizga dam olish uchun qaysi joy yoqadi?",
    options: [
      { option_text: "Tog'lar", personality_type: "leadership", points: 2 },
      { option_text: "Dengiz", personality_type: "emotional", points: 2 },
      { option_text: "O'rmon", personality_type: "intellectual", points: 2 },
      { option_text: "Shahar", personality_type: "social", points: 2 },
    ],
  },
  {
    text: "Tasavvur qiling sizga sehrli kalit berildi. U nimani ochadi?",
    options: [
      { option_text: "Xazina sandig'ini", personality_type: "leadership", points: 2 },
      { option_text: "Sirli eshikni", personality_type: "intellectual", points: 2 },
      { option_text: "Yangi dunyoni", personality_type: "emotional", points: 2 },
      { option_text: "Oddiy uy eshigini", personality_type: "social", points: 1 },
    ],
  },
  {
    text: "Tasavvur qiling siz yolg'iz bog'da yurasiz. Qanday daraxtni ko'rasiz?",
    options: [
      { option_text: "Katta eman daraxti", personality_type: "leadership", points: 2 },
      { option_text: "Mevali daraxt", personality_type: "social", points: 2 },
      { option_text: "Qurib qolgan daraxt", personality_type: "emotional", points: 1 },
      { option_text: "Yangi nihol", personality_type: "intellectual", points: 2 },
    ],
  },
  {
    text: "Tasavvur qiling sizga bir hayvon do'st bo'ldi. Qaysi biri?",
    options: [
      { option_text: "It", personality_type: "social", points: 2 },
      { option_text: "Mushuk", personality_type: "intellectual", points: 2 },
      { option_text: "Ot", personality_type: "leadership", points: 2 },
      { option_text: "Sher", personality_type: "leadership", points: 2 },
    ],
  },
  {
    text: "Agar siz bir rangni tanlashingiz kerak bo'lsa, qaysi rangni tanlaysiz?",
    options: [
      { option_text: "Qizil", personality_type: "leadership", points: 2 },
      { option_text: "Ko'k", personality_type: "intellectual", points: 2 },
      { option_text: "Yashil", personality_type: "social", points: 2 },
      { option_text: "Sariq", personality_type: "emotional", points: 2 },
    ],
  },
  {
    text: "Tasavvur qiling siz sirli eshikni ochdingiz. Ichida nima bor?",
    options: [
      { option_text: "Xazina", personality_type: "leadership", points: 2 },
      { option_text: "Kutubxona", personality_type: "intellectual", points: 2 },
      { option_text: "Bog'", personality_type: "social", points: 2 },
      { option_text: "Yorug' xona", personality_type: "emotional", points: 2 },
    ],
  },
  {
    text: "Agar siz super qobiliyatga ega bo'lsangiz qaysi birini tanlaysiz?",
    options: [
      { option_text: "Uchish", personality_type: "emotional", points: 2 },
      { option_text: "Ko'rinmas bo'lish", personality_type: "intellectual", points: 2 },
      { option_text: "Vaqtni to'xtatish", personality_type: "leadership", points: 2 },
      { option_text: "Boshqalarga yordam berish", personality_type: "social", points: 2 },
    ],
  },
  {
    text: "Tasavvur qiling siz tog'ga chiqyapsiz. Qanday his qilasiz?",
    options: [
      { option_text: "Hayajon", personality_type: "emotional", points: 2 },
      { option_text: "Qiziqish", personality_type: "intellectual", points: 2 },
      { option_text: "Qo'rquv", personality_type: "social", points: 1 },
      { option_text: "Tinchlik", personality_type: "emotional", points: 1 },
    ],
  },
  {
    text: "Agar siz bir fasl bo'lsangiz qaysi biri bo'lardingiz?",
    options: [
      { option_text: "Bahor", personality_type: "emotional", points: 2 },
      { option_text: "Yoz", personality_type: "leadership", points: 2 },
      { option_text: "Kuz", personality_type: "intellectual", points: 2 },
      { option_text: "Qish", personality_type: "intellectual", points: 1 },
    ],
  },
  {
    text: "Tasavvur qiling sizga sehrli sovg'a berildi. U nima?",
    options: [
      { option_text: "Kitob", personality_type: "intellectual", points: 2 },
      { option_text: "Kalit", personality_type: "leadership", points: 2 },
      { option_text: "Soat", personality_type: "leadership", points: 1 },
      { option_text: "Qalam", personality_type: "emotional", points: 2 },
    ],
  },
  {
    text: "Agar siz musiqa asbobi bo'lsangiz qaysi biri bo'lardingiz?",
    options: [
      { option_text: "Pianino", personality_type: "intellectual", points: 2 },
      { option_text: "Gitara", personality_type: "social", points: 2 },
      { option_text: "Baraban", personality_type: "leadership", points: 2 },
      { option_text: "Nay", personality_type: "emotional", points: 2 },
    ],
  },
  {
    text: "Tasavvur qiling siz yangi joyga keldingiz. Avval nimaga qaraysiz?",
    options: [
      { option_text: "Odamlarga", personality_type: "social", points: 2 },
      { option_text: "Tabiatga", personality_type: "emotional", points: 2 },
      { option_text: "Binolarga", personality_type: "intellectual", points: 2 },
      { option_text: "Yo'llarga", personality_type: "leadership", points: 2 },
    ],
  },
  {
    text: "Tasavvur qiling siz osmonni kuzatyapsiz. Qaysi narsani ko'rasiz?",
    options: [
      { option_text: "Quyosh", personality_type: "leadership", points: 2 },
      { option_text: "Oy", personality_type: "emotional", points: 2 },
      { option_text: "Yulduzlar", personality_type: "intellectual", points: 2 },
      { option_text: "Bulutlar", personality_type: "intellectual", points: 1 },
    ],
  },
  {
    text: "Agar siz suv shakli bo'lsangiz qaysi biri bo'lardingiz?",
    options: [
      { option_text: "Sharshara", personality_type: "leadership", points: 2 },
      { option_text: "Daryo", personality_type: "leadership", points: 1 },
      { option_text: "Ko'l", personality_type: "social", points: 2 },
      { option_text: "Yomg'ir", personality_type: "emotional", points: 2 },
    ],
  },
  {
    text: "Tasavvur qiling siz bir uy qurmoqchisiz. Qanday uy bo'ladi?",
    options: [
      { option_text: "Katta zamonaviy uy", personality_type: "leadership", points: 2 },
      { option_text: "Yog'ochdan qurilgan uy", personality_type: "social", points: 2 },
      { option_text: "Tog'dagi kichik uy", personality_type: "intellectual", points: 2 },
      { option_text: "Bog' ichidagi uy", personality_type: "emotional", points: 2 },
    ],
  },
  {
    text: "Agar siz bir transport bo'lsangiz qaysi biri bo'lardingiz?",
    options: [
      { option_text: "Samolyot", personality_type: "leadership", points: 2 },
      { option_text: "Mashina", personality_type: "intellectual", points: 2 },
      { option_text: "Velosiped", personality_type: "social", points: 2 },
      { option_text: "Kema", personality_type: "emotional", points: 2 },
    ],
  },
  {
    text: "Tasavvur qiling siz sahroga tushib qoldingiz. Birinchi nimani qidirasiz?",
    options: [
      { option_text: "Suv", personality_type: "intellectual", points: 2 },
      { option_text: "Yo'l", personality_type: "leadership", points: 2 },
      { option_text: "Odamlar", personality_type: "social", points: 2 },
      { option_text: "Soyani", personality_type: "emotional", points: 1 },
    ],
  },
  {
    text: "Agar siz bir sport turi bo'lsangiz qaysi biri bo'lardingiz?",
    options: [
      { option_text: "Futbol", personality_type: "social", points: 2 },
      { option_text: "Shaxmat", personality_type: "intellectual", points: 2 },
      { option_text: "Yugurish", personality_type: "leadership", points: 2 },
      { option_text: "Suzish", personality_type: "emotional", points: 2 },
    ],
  },
  {
    text: "Tasavvur qiling siz vaqt mashinasiga tushdingiz. Qaysi davrga borasiz?",
    options: [
      { option_text: "O'tmishga", personality_type: "intellectual", points: 1 },
      { option_text: "Kelajakka", personality_type: "leadership", points: 2 },
      { option_text: "Hozirgi davrga qaytaman", personality_type: "social", points: 2 },
      { option_text: "Boshqa sayyoraga", personality_type: "emotional", points: 2 },
    ],
  },
  {
    text: "Agar siz bir gul bo'lsangiz qaysi biri bo'lardingiz?",
    options: [
      { option_text: "Atirgul", personality_type: "emotional", points: 2 },
      { option_text: "Lola", personality_type: "intellectual", points: 2 },
      { option_text: "Moychechak", personality_type: "social", points: 2 },
      { option_text: "Nilufar", personality_type: "intellectual", points: 2 },
    ],
  },
  {
    text: "Tasavvur qiling sizga bir kitob berildi. Qanday kitob bo'ladi?",
    options: [
      { option_text: "Sarguzasht", personality_type: "leadership", points: 2 },
      { option_text: "Ilmiy", personality_type: "intellectual", points: 2 },
      { option_text: "Fantastika", personality_type: "emotional", points: 2 },
      { option_text: "Hayotiy hikoya", personality_type: "social", points: 2 },
    ],
  },
  {
    text: "Agar siz bir element bo'lsangiz qaysi biri bo'lardingiz?",
    options: [
      { option_text: "Olov", personality_type: "leadership", points: 2 },
      { option_text: "Suv", personality_type: "emotional", points: 2 },
      { option_text: "Havo", personality_type: "intellectual", points: 2 },
      { option_text: "Yer", personality_type: "social", points: 2 },
    ],
  },
];

/**
 * Savollar jadvalida yozuv bo'lsa, hech narsa qilmaydi (takroriy seed oldini olish).
 * @returns {Promise<{ skipped: boolean, reason?: string }>}
 */
export async function seedQuestions() {
  if (!supabase) {
    throw new Error("Supabase sozlanmagan. .env faylni tekshiring.");
  }

  const { count, error: countError } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw countError;
  }

  if (count && count > 0) {
    return { skipped: true, reason: "questions jadvalida allaqachon yozuvlar bor" };
  }

  const psychRows = PSYCHOLOGICAL_TEXTS.map((question_text, index) => {
    const order_num = index + 1;
    return {
      test_type: "psychological",
      question_text,
      category: psychCategoryForOrder(order_num),
      order_num,
      is_active: true,
    };
  });

  const { error: psychError } = await supabase.from("questions").insert(psychRows);

  if (psychError) {
    throw psychError;
  }

  const portraitRows = PORTRAIT_QUESTIONS.map((q, index) => ({
    test_type: "portrait",
    question_text: q.text,
    category: "portrait",
    order_num: index + 1,
    is_active: true,
  }));

  const { data: insertedPortrait, error: portraitQError } = await supabase
    .from("questions")
    .insert(portraitRows)
    .select("id, order_num");

  if (portraitQError) {
    throw portraitQError;
  }

  const byOrder = new Map(insertedPortrait.map((row) => [row.order_num, row.id]));

  const allOptions = [];
  for (let i = 0; i < PORTRAIT_QUESTIONS.length; i += 1) {
    const orderNum = i + 1;
    const questionId = byOrder.get(orderNum);
    if (!questionId) {
      throw new Error(`Portret savoli order_num=${orderNum} uchun id topilmadi`);
    }
    for (const opt of PORTRAIT_QUESTIONS[i].options) {
      allOptions.push({
        question_id: questionId,
        option_text: opt.option_text,
        personality_type: opt.personality_type,
        points: opt.points,
      });
    }
  }

  const { error: optError } = await supabase.from("answer_options").insert(allOptions);

  if (optError) {
    throw optError;
  }

  return { skipped: false, psychological: 75, portrait: 25 };
}
