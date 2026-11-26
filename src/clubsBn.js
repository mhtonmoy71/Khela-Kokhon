// ═══════════════════════════════════════════════════════════════
//  বড় লিগের বাইরের ক্লাবের বাংলা নাম (প্রথম আলোর বানানরীতি মেনে)
//  কাপের ম্যাচে (এফএ কাপ, কারাবাও কাপ, কোপা দেল রে...) ছোট ক্লাবগুলো আসে; তালিকায় না থাকলে
//  সাইট নিজে উচ্চারণ আন্দাজ করত ("ফ্লীটওয়ুড", "পেটের্বোরুগ")। এখানে ইংরেজি নাম → বাংলা।
//  App.jsx (দেখানো) আর api/live.js (ডাটাবেসে নতুন দল রাখার সময়) দুই জায়গাতেই ব্যবহার হয়।
// ═══════════════════════════════════════════════════════════════
import { CLUBS_BN2 } from "./clubsBn2.js";

export const CLUBS_BN = {
  // ── ইংল্যান্ড: চ্যাম্পিয়নশিপ, লিগ ওয়ান, লিগ টু, ন্যাশনাল লিগ ──
  "Norwich": "নরউইচ সিটি", "Norwich City": "নরউইচ সিটি", "Watford": "ওয়াটফোর্ড", "Middlesbrough": "মিডলসবরো", "Sheffield Utd": "শেফিল্ড ইউনাইটেড", "Sheffield United": "শেফিল্ড ইউনাইটেড",
  "Sheffield Wednesday": "শেফিল্ড ওয়েনসডে", "Sheffield Wed": "শেফিল্ড ওয়েনসডে", "West Brom": "ওয়েস্ট ব্রমউইচ", "West Bromwich Albion": "ওয়েস্ট ব্রমউইচ",
  "Leicester": "লেস্টার সিটি", "Leicester City": "লেস্টার সিটি", "Southampton": "সাউদাম্পটন", "Burnley": "বার্নলি", "Luton": "লুটন টাউন", "Luton Town": "লুটন টাউন",
  "Stoke City": "স্টোক সিটি", "Stoke": "স্টোক সিটি", "Swansea": "সোয়ানসি সিটি", "Swansea City": "সোয়ানসি সিটি", "Cardiff": "কার্ডিফ সিটি", "Cardiff City": "কার্ডিফ সিটি",
  "Bristol City": "ব্রিস্টল সিটি", "Bristol Rovers": "ব্রিস্টল রোভার্স", "Blackburn": "ব্ল্যাকবার্ন রোভার্স", "Blackburn Rovers": "ব্ল্যাকবার্ন রোভার্স",
  "Preston": "প্রেস্টন নর্থ এন্ড", "Preston North End": "প্রেস্টন নর্থ এন্ড", "Millwall": "মিলওয়াল", "QPR": "কিউপিআর", "Queens Park Rangers": "কিউপিআর",
  "Derby": "ডার্বি কাউন্টি", "Derby County": "ডার্বি কাউন্টি", "Portsmouth": "পোর্টসমাউথ", "Oxford United": "অক্সফোর্ড ইউনাইটেড", "Plymouth": "প্লাইমাউথ আর্গাইল", "Plymouth Argyle": "প্লাইমাউথ আর্গাইল",
  "Charlton": "চার্লটন অ্যাথলেটিক", "Charlton Athletic": "চার্লটন অ্যাথলেটিক", "Wrexham": "রেক্সহ্যাম", "Birmingham": "বার্মিংহাম সিটি", "Birmingham City": "বার্মিংহাম সিটি",
  "Hull City": "হাল সিটি", "Coventry": "কভেন্ট্রি সিটি", "Coventry City": "কভেন্ট্রি সিটি",
  "Peterborough": "পিটারবরো ইউনাইটেড", "Peterborough United": "পিটারবরো ইউনাইটেড", "Bradford": "ব্র্যাডফোর্ড সিটি", "Bradford City": "ব্র্যাডফোর্ড সিটি",
  "Fleetwood Town": "ফ্লিটউড টাউন", "Fleetwood": "ফ্লিটউড টাউন", "Bolton": "বোল্টন ওয়ান্ডারার্স", "Bolton Wanderers": "বোল্টন ওয়ান্ডারার্স",
  "Huddersfield": "হাডার্সফিল্ড টাউন", "Huddersfield Town": "হাডার্সফিল্ড টাউন", "Barnsley": "বার্নসলি", "Rotherham": "রদারহ্যাম ইউনাইটেড", "Rotherham United": "রদারহ্যাম ইউনাইটেড",
  "Wigan": "উইগান অ্যাথলেটিক", "Wigan Athletic": "উইগান অ্যাথলেটিক", "Reading": "রিডিং", "Blackpool": "ব্ল্যাকপুল", "Stockport County": "স্টকপোর্ট কাউন্টি", "Stockport": "স্টকপোর্ট কাউন্টি",
  "Lincoln": "লিংকন সিটি", "Lincoln City": "লিংকন সিটি", "Wycombe": "উইকম ওয়ান্ডারার্স", "Wycombe Wanderers": "উইকম ওয়ান্ডারার্স", "Mansfield Town": "ম্যানসফিল্ড টাউন", "Mansfield": "ম্যানসফিল্ড টাউন",
  "Stevenage": "স্টিভেনেজ", "Exeter": "এক্সিটার সিটি", "Exeter City": "এক্সিটার সিটি", "Burton Albion": "বার্টন অ্যালবিয়ন", "Leyton Orient": "লেটন ওরিয়েন্ট",
  "Northampton": "নর্দাম্পটন টাউন", "Northampton Town": "নর্দাম্পটন টাউন", "Cambridge United": "কেমব্রিজ ইউনাইটেড", "Shrewsbury": "শ্রুসবেরি টাউন", "Shrewsbury Town": "শ্রুসবেরি টাউন",
  "Crawley Town": "ক্রলি টাউন", "Port Vale": "পোর্ট ভেল", "Doncaster": "ডনকাস্টার রোভার্স", "Doncaster Rovers": "ডনকাস্টার রোভার্স", "Luton Town FC": "লুটন টাউন",
  "AFC Wimbledon": "এএফসি উইম্বলডন", "MK Dons": "এমকে ডন্স", "Milton Keynes Dons": "এমকে ডন্স", "Gillingham": "জিলিংহাম", "Walsall": "ওয়ালসল",
  "Notts County": "নটস কাউন্টি", "Grimsby": "গ্রিমসবি টাউন", "Grimsby Town": "গ্রিমসবি টাউন", "Chesterfield": "চেস্টারফিল্ড", "Salford City": "স্যালফোর্ড সিটি", "Salford": "স্যালফোর্ড সিটি",
  "Crewe": "ক্রু আলেকজান্দ্রা", "Crewe Alexandra": "ক্রু আলেকজান্দ্রা", "Colchester": "কোলচেস্টার ইউনাইটেড", "Colchester United": "কোলচেস্টার ইউনাইটেড", "Tranmere": "ট্রানমিয়ার রোভার্স", "Tranmere Rovers": "ট্রানমিয়ার রোভার্স",
  "Accrington ST": "অ্যাক্রিংটন স্ট্যানলি", "Accrington Stanley": "অ্যাক্রিংটন স্ট্যানলি", "Harrogate Town": "হ্যারোগেট টাউন", "Morecambe": "মোরকাম", "Carlisle": "কার্লাইল ইউনাইটেড", "Carlisle United": "কার্লাইল ইউনাইটেড",
  "Swindon": "সুইনডন টাউন", "Swindon Town": "সুইনডন টাউন", "Newport County": "নিউপোর্ট কাউন্টি", "Barrow": "ব্যারো", "Bromley": "ব্রমলি", "Cheltenham": "চেলটেনহ্যাম টাউন", "Cheltenham Town": "চেলটেনহ্যাম টাউন",
  "Oldham": "ওল্ডহ্যাম অ্যাথলেটিক", "Oldham Athletic": "ওল্ডহ্যাম অ্যাথলেটিক", "Bournemouth": "বোর্নমাউথ", "Brighton": "ব্রাইটন", "Brentford": "ব্রেন্টফোর্ড",
  "Barnet": "বার্নেট", "York": "ইয়র্ক সিটি", "York City": "ইয়র্ক সিটি", "Southend": "সাউথএন্ড ইউনাইটেড", "Southend United": "সাউথএন্ড ইউনাইটেড", "Hartlepool": "হার্টলপুল ইউনাইটেড",
  // ── বাংলাদেশ ──
  "Fakirerpool": "ফকিরেরপুল ইয়াংমেন্স", "Fakirerpool YMC": "ফকিরেরপুল ইয়াংমেন্স", "Fakirerpool Young Men": "ফকিরেরপুল ইয়াংমেন্স",
  // ── স্কটল্যান্ড ──
  "Celtic": "সেলটিক", "Rangers": "রেঞ্জার্স", "Aberdeen": "অ্যাবারডিন", "Hearts": "হার্টস", "Hibernian": "হিবারনিয়ান",
  // ── স্পেন: সেগুন্দা আর কোপা দেল রের ছোট দল ──
  "Real Valladolid": "ভায়াদোলিদ", "Valladolid": "ভায়াদোলিদ", "Las Palmas": "লাস পালমাস", "Leganes": "লেগানেস", "Leganés": "লেগানেস", "Mallorca": "মায়োর্কা", "Girona": "জিরোনা",
  "Oviedo": "রিয়াল ওভিয়েদো", "Real Oviedo": "রিয়াল ওভিয়েদো", "Zaragoza": "রিয়াল জারাগোসা", "Real Zaragoza": "রিয়াল জারাগোসা", "Sporting Gijon": "স্পোর্তিং খিখন", "Sporting Gijón": "স্পোর্তিং খিখন",
  "Granada CF": "গ্রানাদা", "Granada": "গ্রানাদা", "Cadiz": "কাদিস", "Cádiz": "কাদিস", "Almeria": "আলমেরিয়া", "Almería": "আলমেরিয়া", "Eibar": "এইবার", "Tenerife": "তেনেরিফে",
  "Huesca": "উয়েস্কা", "Albacete": "আলবাসেতে", "Burgos": "বুরগোস", "Cordoba": "কর্দোবা", "Córdoba": "কর্দোবা", "Castellon": "কাস্তেয়োন", "Castellón": "কাস্তেয়োন", "Mirandes": "মিরান্দেস", "Mirandés": "মিরান্দেস",
  // ── ইতালি, জার্মানি, ফ্রান্স: নিচের বিভাগ আর প্রথম আলোর বানান ──
  "Pisa": "পিসা", "Cremonese": "ক্রেমোনেসে", "Verona": "ভেরোনা", "Hellas Verona": "ভেরোনা", "Empoli": "এম্পোলি", "Sampdoria": "সাম্পদোরিয়া", "Palermo": "পালেরমো", "Bari": "বারি",
  "Heidenheim": "হাইডেনহাইম", "1. FC Heidenheim": "হাইডেনহাইম", "St. Pauli": "সেন্ট পাউলি", "FC St. Pauli": "সেন্ট পাউলি", "Wolfsburg": "ভলফসবুর্গ", "VfL Wolfsburg": "ভলফসবুর্গ",
  "Hertha Berlin": "হার্থা বার্লিন", "Hertha BSC": "হার্থা বার্লিন", "Bochum": "বোখুম", "VfL Bochum": "বোখুম", "Holstein Kiel": "হলস্টেইন কিল", "Darmstadt": "ডার্মস্টাড",
  "Marseille": "মার্শেই", "Olympique Marseille": "মার্শেই", "Lens": "লাঁস", "Rennes": "রেনে", "Stade Rennais": "রেনে", "Nantes": "নঁত", "Montpellier": "মঁপেলিয়ে", "Reims": "রেঁস", "Saint-Etienne": "সেন্ত এতিয়েন",
  // ── পর্তুগাল, নেদারল্যান্ডস, তুরস্ক আর অন্যান্য (ইউরোপিয়ান প্রতিযোগিতা) ──
  "Sporting CP": "স্পোর্তিং লিসবন", "Braga": "ব্রাগা", "SC Braga": "ব্রাগা", "Vitoria Guimaraes": "ভিতোরিয়া গিমারেস", "AZ Alkmaar": "এজেড আলকমার", "Twente": "টোয়েন্টে", "FC Twente": "টোয়েন্টে",
  "Besiktas": "বেশিকতাস", "Beşiktaş": "বেশিকতাস", "Trabzonspor": "ত্রাবজোনস্পোর", "Olympiakos Piraeus": "অলিম্পিয়াকোস", "Olympiacos": "অলিম্পিয়াকোস", "PAOK": "পাওক", "Panathinaikos": "পানাথিনাইকোস",
  "Red Bull Salzburg": "রেড বুল জালৎসবুর্গ", "Salzburg": "রেড বুল জালৎসবুর্গ", "Sturm Graz": "স্টুর্ম গ্রাৎস", "Young Boys": "ইয়াং বয়েজ", "BSC Young Boys": "ইয়াং বয়েজ", "Basel": "বাসেল",
  "Dinamo Zagreb": "দিনামো জাগরেব", "Crvena Zvezda": "রেড স্টার বেলগ্রেড", "Red Star Belgrade": "রেড স্টার বেলগ্রেড", "Copenhagen": "কোপেনহেগেন", "FC Copenhagen": "কোপেনহেগেন", "Midtjylland": "মিডটিল্যান্ড",
  "Anderlecht": "আন্ডারলেখট", "Union St. Gilloise": "ইউনিয়ন সেন্ট-জিলোয়াজ", "Union Saint-Gilloise": "ইউনিয়ন সেন্ট-জিলোয়াজ", "Genk": "গেংক", "Celtic FC": "সেলটিক", "Qarabag": "কারাবাগ", "Ferencvaros": "ফেরেঙ্কভারোস",
};

// ইংরেজি নাম থেকে বাংলা (হুবহু, না মিললে FC/AFC ইত্যাদি বাদ দিয়ে)
const strip = (s) => (s || "").replace(/\b(FC|AFC|CF|SC|CD|SD|UD|AC|SAD|SFC|FK|SK|BK)\b\.?/g, "").replace(/\s+/g, " ").trim();
export function clubBn(name) {
  if (!name) return null;
  return CLUBS_BN[name] || CLUBS_BN2[name] || CLUBS_BN[strip(name)] || CLUBS_BN2[strip(name)] || null;
}
