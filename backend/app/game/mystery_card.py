"""
محرك توليد البطاقات الغامضة - النسخة الاحترافية
Mystery Card Generation Engine - Professional Edition

عندما يخسر لاعب المزاد، يقوم الخادم بتوليد بطاقة غامضة
بتوزيع احتمالي صارم:
- 30% أسطوري (Legendary) - لاعبين 5 نجوم
- 30% متوسط (Medium) - لاعبين 3-4 نجوم
- 40% ضعيف (Weak) - لاعبين 1-2 نجوم

يمنع منعاً باتاً تعديل هذه النسب الاحتمالية.
"""

import random
import logging
import hashlib
import time
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from app.utils.constants import (
    MYSTERY_CARD_PROBABILITIES,
    PLAYER_RATING_RANGES,
    MANAGER_RATING_RANGES
)

logger = logging.getLogger(__name__)

# ==================== قواعد البيانات المعززة ====================

# أسماء لاعبين واقعية ومتنوعة حسب المراكز
REALISTIC_PLAYER_NAMES = {
    "GK": [
        "مانويل نوير", "تير شتيغن", "أليسون بيكر", "إيدرسون مورايش",
        "يان أوبلاك", "دافيد دي خيا", "جانلويجي دوناروما", "تيبو كورتوا",
        "كيلور نافاس", "هوجو لوريس", "إيميليانو مارتينيز", "مايك ماينان",
        "أندريه أونانا", "جيانلويجي بوفون", "إيكر كاسياس", "بيتر شمايكل",
        "أوليفر كان", "دينو زوف", "ليف ياشين", "إدوين فان دير سار"
    ],
    "DEF": [
        "فيرجيل فان ديك", "روبن دياز", "أنطونيو روديجر", "أشرف حكيمي",
        "ترينت ألكسندر أرنولد", "أندرو روبرتسون", "جواو كانسيلو", "كايل ووكر",
        "دافيد ألابا", "ماركينيوس", "إيدير ميليتاو", "جورجيو كيليني",
        "سيرجيو راموس", "جيرارد بيكيه", "باولو مالديني", "فرانكو باريزي",
        "فابيو كانافارو", "أليساندرو نيستا", "كافو", "روبيرتو كارلوس"
    ],
    "MID": [
        "كيفين دي بروين", "جود بيلينجهام", "رودري", "لوكا مودريتش",
        "فيدريكو فالفيردي", "توني كروس", "كاسيميرو", "برونو فيرنانديز",
        "إلكاي جوندوجان", "برناردو سيلفا", "بيدري", "جافي",
        "زين الدين زيدان", "أندريس إنييستا", "تشافي هيرنانديز", "أندريا بيرلو",
        "ستيفن جيرارد", "فرانك لامبارد", "بول سكولز", "خوان رومان ريكيلمي"
    ],
    "ATT": [
        "كيليان مبابي", "إيرلينج هالاند", "فينيسيوس جونيور", "محمد صلاح",
        "ليونيل ميسي", "كريستيانو رونالدو", "كريم بنزيما", "روبرت ليفاندوفسكي",
        "نيمار جونيور", "هاري كين", "لوتارو مارتينيز", "فيكتور أوسيمين",
        "رونالدو نازاريو", "تيري هنري", "ماركو فان باستن", "جورج بست",
        "دييجو مارادونا", "بيليه", "يوهان كرويف", "ألفريدو دي ستيفانو"
    ]
}

# أسماء مدربين واقعية
REALISTIC_MANAGER_NAMES = [
    "بيب جوارديولا", "يورجن كلوب", "كارلو أنشيلوتي", "تشافي هيرنانديز",
    "ميكيل أرتيتا", "توماس توخيل", "لويس إنريكي", "جوزيه مورينيو",
    "زين الدين زيدان", "أنطونيو كونتي", "ماسيميليانو أليجري", "ستيفانو بيولي",
    "سيموني إنزاجي", "جوليان ناجلسمان", "إريك تن هاج", "روبرتو دي زيربي",
    "أوناي إيمري", "شون دايش", "إدي هاو", "جراهام بوتر",
    "أرسين فينجر", "سير أليكس فيرجسون", "فابيو كابيلو", "مارسيلو ليبي",
    "جوفاني تراباتوني", "هيلينيو هيريرا", "رينوس ميكيلز", "بيل شانكلي"
]

# أندية واقعية ومتنوعة
REALISTIC_CLUBS = [
    "ريال مدريد", "برشلونة", "مانشستر سيتي", "ليفربول", "بايرن ميونخ",
    "باريس سان جيرمان", "يوفنتوس", "إنتر ميلان", "آرسنال", "تشيلسي",
    "مانشستر يونايتد", "توتنهام", "بوروسيا دورتموند", "أتلتيكو مدريد",
    "ميلان", "نابولي", "روما", "بورتو", "بنفيكا", "أياكس أمستردام",
    "الهلال", "النصر", "الاتحاد", "الأهلي", "الشباب",
    "الزمالك", "الترجي", "الوداد", "الرجاء", "صن داونز"
]

# جنسيات متنوعة
REALISTIC_NATIONALITIES = [
    "السعودية", "مصر", "المغرب", "الجزائر", "تونس", "السنغال", "نيجيريا", "الكاميرون",
    "البرازيل", "الأرجنتين", "الأوروغواي", "كولومبيا", "تشيلي", "المكسيك",
    "إنجلترا", "فرنسا", "ألمانيا", "إسبانيا", "إيطاليا", "البرتغال",
    "هولندا", "بلجيكا", "كرواتيا", "صربيا", "بولندا", "النرويج", "السويد",
    "اليابان", "كوريا الجنوبية", "أستراليا", "الولايات المتحدة", "كندا"
]

# تشكيلات تكتيكية للمدربين
MANAGER_FORMATIONS = {
    "Legendary": [
        "4-3-3 هجومي", "4-2-3-1 ضاغط", "3-5-2 إيطالي", "4-4-2 ماسي",
        "3-4-3 شامل", "4-1-4-1 متوازن", "5-3-2 دفاعي-هجومي"
    ],
    "Medium": [
        "4-4-2 كلاسيكي", "4-3-3 متوازن", "3-5-2 عادي", "4-2-3-1 قياسي",
        "4-5-1 دفاعي", "4-4-1-1 تقليدي"
    ],
    "Weak": [
        "4-4-2 بسيط", "4-3-3 أساسي", "5-4-1 دفاعي", "4-5-1 تقليدي",
        "3-5-2 أساسي", "4-4-2 تقليدي"
    ]
}

# أساليب لعب المدربين
MANAGER_STYLES = {
    "Legendary": [
        "استحواذ شامل - تيكي تاكا", "ضغط عالي - جيجن بريسنج",
        "هجوم شامل - كرة شاملة", "دفاع منظم - كاتيناتشو",
        "تحولات سريعة - كرة عمودية", "سيطرة إيقاعية - بوسيشن بلاي"
    ],
    "Medium": [
        "لعب متوازن", "هجمات منظمة", "ضغط متوسط",
        "استحواذ متحفظ", "كرات طويلة منظمة", "دفاع متقدم"
    ],
    "Weak": [
        "دفاع وتأمين", "كرات طويلة مباشرة", "لعب بسيط",
        "اعتماد على الفرديات", "تكتيك دفاعي بحت", "لعب عشوائي"
    ]
}

# مهارات خاصة للاعبين حسب الندرة
PLAYER_SPECIAL_TRAITS = {
    "Legendary": [
        "قائد بالفطرة", "صانع ألعاب استثنائي", "هداف من الطراز الأول",
        "مدافع صلب", "مراوغ ماهر", "رأسية خطيرة", "ركلات حرة متخصص",
        "سرعة فائقة", "تحمل خرافي", "رؤية ميدانية شاملة",
        "تسديدات صاروخية", "تمريرات حاسمة", "ذكاء تكتيكي عالي"
    ],
    "Medium": [
        "تمرير جيد", "سرعة متوسطة", "تسديد مقبول",
        "دفاع منظم", "رأسية جيدة", "لياقة بدنية عالية",
        "تمركز جيد", "انضباط تكتيكي"
    ],
    "Weak": [
        "لياقة أساسية", "مهارات محدودة", "خبرة متواضعة",
        "سرعة عادية", "تسديد ضعيف", "تمرير متوسط"
    ]
}

# ==================== كلاس توليد البطاقات الغامضة ====================

class MysteryCardGenerator:
    """
    مولد البطاقات الغامضة باستخدام توزيع احتمالي صارم
    
    يقوم بتوليد بطاقات غامضة للخاسرين في المزاد مع:
    - أسماء واقعية ومتنوعة
    - خصائص تفصيلية للاعبين والمدربين
    - مهارات وقدرات خاصة
    - بيانات تكتيكية متقدمة
    - نظام تحقق وتسجيل متكامل
    """
    
    # عداد البطاقات المولدة للتتبع
    _cards_generated = 0
    _generation_history: List[Dict[str, Any]] = []
    
    @staticmethod
    def generate_mystery_card(
        position: str,
        player_database: list = None
    ) -> Dict[str, Any]:
        """
        توليد بطاقة غامضة للمركز المحدد
        
        المعاملات:
            position: مركز البطاقة (GK, DEF, MID, ATT, MGR)
            player_database: قائمة اللاعبين المتاحين للاختيار منهم (اختياري)
            
        المخرجات:
            قاموس يحتوي على بيانات البطاقة مع معلومات اللاعب الفعلية
        """
        start_time = time.time()
        
        # التحقق من صحة المركز
        valid_positions = ["GK", "DEF", "MID", "ATT", "MGR"]
        if position not in valid_positions:
            logger.error(f"مركز غير صالح: {position}، تم استخدام المركز الافتراضي ATT")
            position = "ATT"
        
        # تطبيق نظام الاحتمالات الصارم
        rarity = MysteryCardGenerator._determine_rarity()
        
        # توليد معرف فريد للبطاقة
        card_id = MysteryCardGenerator._generate_unique_card_id(position, rarity)
        
        logger.info(
            f"🎴 بدء توليد بطاقة غامضة | "
            f"المركز: {position} | "
            f"الندرة: {rarity} | "
            f"المعرف: {card_id}"
        )
        
        # توليد البطاقة حسب النوع
        if position == "MGR":
            card = MysteryCardGenerator._generate_manager_card(rarity, card_id)
            logger.info(
                f"👔 تم توليد بطاقة مدرب غامضة: {card['name']} | "
                f"التقييم التكتيكي: {card['tactic_rating']} | "
                f"الأسلوب: {card['style']}"
            )
        else:
            card = MysteryCardGenerator._generate_player_card(position, rarity, card_id)
            logger.info(
                f"⚽ تم توليد بطاقة لاعب غامضة: {card['name']} | "
                f"المركز: {card['position']} | "
                f"التقييم: {card['rating']} | "
                f"المهارة: {card['special_trait']}"
            )
        
        # إضافة بيانات الوقت والتتبع
        card["generation_timestamp"] = datetime.utcnow().isoformat()
        card["generation_duration_ms"] = round((time.time() - start_time) * 1000, 2)
        
        # تحديث العدادات
        MysteryCardGenerator._cards_generated += 1
        MysteryCardGenerator._generation_history.append({
            "card_id": card_id,
            "position": position,
            "rarity": rarity,
            "timestamp": card["generation_timestamp"]
        })
        
        # الاحتفاظ بآخر 1000 بطاقة فقط في السجل
        if len(MysteryCardGenerator._generation_history) > 1000:
            MysteryCardGenerator._generation_history = MysteryCardGenerator._generation_history[-1000:]
        
        logger.info(
            f"✅ اكتمل توليد البطاقة الغامضة #{MysteryCardGenerator._cards_generated} | "
            f"الوقت المستغرق: {card['generation_duration_ms']}ms"
        )
        
        return card
    
    @staticmethod
    def _determine_rarity() -> str:
        """
        تحديد الندرة باستخدام الاحتمالات الصارمة
        
        يجب اتباع هذه النسب بدقة:
        - 30% أسطوري (Legendary)
        - 30% متوسط (Medium)
        - 40% ضعيف (Weak)
        
        المخرجات:
            مستوى الندرة: "Legendary", "Medium", أو "Weak"
        """
        # توليد رقم عشوائي بين 0 و 1 باستخدام نظام عشوائي آمن
        rand_val = random.random()
        
        # حدود احتمالية صارمة - لا يمكن تعديلها
        legendary_threshold = MYSTERY_CARD_PROBABILITIES["Legendary"]  # 0.30
        medium_threshold = legendary_threshold + MYSTERY_CARD_PROBABILITIES["Medium"]  # 0.60
        
        logger.debug(
            f"قرعة الندرة: القيمة العشوائية={rand_val:.4f} | "
            f"حد الأسطوري={legendary_threshold:.4f} | "
            f"حد المتوسط={medium_threshold:.4f}"
        )
        
        if rand_val < legendary_threshold:  # 0.00 - 0.30 (30%)
            logger.debug("🎯 نتيجة القرعة: أسطوري (Legendary)")
            return "Legendary"
        elif rand_val < medium_threshold:  # 0.30 - 0.60 (30%)
            logger.debug("🎯 نتيجة القرعة: متوسط (Medium)")
            return "Medium"
        else:  # 0.60 - 1.00 (40%)
            logger.debug("🎯 نتيجة القرعة: ضعيف (Weak)")
            return "Weak"
    
    @staticmethod
    def _generate_player_card(position: str, rarity: str, card_id: str) -> Dict[str, Any]:
        """
        توليد بطاقة لاعب غامضة محسنة
        
        المعاملات:
            position: مركز اللاعب (GK, DEF, MID, ATT)
            rarity: مستوى الندرة
            card_id: معرف البطاقة الفريد
            
        المخرجات:
            قاموس بيانات بطاقة اللاعب
        """
        # الحصول على نطاق التقييم للندرة المحددة
        rating_range = PLAYER_RATING_RANGES[rarity]
        rating = round(random.uniform(rating_range[0], rating_range[1]), 1)
        
        # اختيار اسم واقعي من قاعدة البيانات
        name_pool = REALISTIC_PLAYER_NAMES.get(position, REALISTIC_PLAYER_NAMES["ATT"])
        player_name = random.choice(name_pool)
        
        # إضافة تنوع للأسماء (نسبة 20% أسماء جديدة)
        if random.random() < 0.2:
            player_name = f"{player_name} {random.choice(['الأول', 'الثاني', 'جونيور', 'الصغير'])}"
        
        # اختيار النادي والجنسية
        club = random.choice(REALISTIC_CLUBS)
        nationality = random.choice(REALISTIC_NATIONALITIES)
        
        # تحديد العمر بناءً على الندرة
        age_ranges = {
            "Legendary": (26, 32),
            "Medium": (23, 30),
            "Weak": (19, 35)
        }
        age_range = age_ranges[rarity]
        age = random.randint(age_range[0], age_range[1])
        
        # اختيار مهارة خاصة
        special_trait = random.choice(PLAYER_SPECIAL_TRAITS[rarity])
        
        # توليد الإحصائيات التفصيلية
        stats = MysteryCardGenerator._generate_player_stats(position, rating, rarity)
        
        # تحديد مستوى الخبرة
        experience_levels = {
            "Legendary": random.choice(["مخضرم", "قائد فريق", "أسطورة حية"]),
            "Medium": random.choice(["محترف", "لاعب أساسي", "واعد"]),
            "Weak": random.choice(["مبتدئ", "احتياطي", "متطور"])
        }
        
        # بناء رابط الصورة
        image_url = MysteryCardGenerator._generate_player_image_url(
            player_name, position, rarity
        )
        
        # تحديد قيمة سوقية تقديرية
        market_value = MysteryCardGenerator._calculate_market_value(rating, rarity, age)
        
        # بناء قاموس البطاقة الكامل
        card = {
            "id": card_id,
            "name": player_name,
            "position": position,
            "rating": rating,
            "rarity": rarity,
            "type": "player",
            "is_mystery": True,
            "acquired_from": "mystery_card",
            
            # معلومات أساسية
            "team": club,
            "nationality": nationality,
            "age": age,
            "image_url": image_url,
            "market_value": market_value,
            
            # مهارات وخصائص
            "special_trait": special_trait,
            "experience_level": experience_levels[rarity],
            "potential": MysteryCardGenerator._calculate_potential(rating, rarity),
            
            # إحصائيات تفصيلية
            "stats": stats,
            
            # بيانات إضافية لمحرك المباراة
            "chemistry": MysteryCardGenerator._calculate_chemistry(rarity),
            "form": random.uniform(0.5, 1.0),
            "fitness": random.uniform(70, 100),
            "morale": random.uniform(0.6, 1.0),
            
            # وضعيات اللعب
            "preferred_foot": random.choice(["يمين", "يسار", "كلتا القدمين"]),
            "height_cm": MysteryCardGenerator._generate_height(position),
            "weight_kg": MysteryCardGenerator._generate_weight(position),
        }
        
        logger.debug(
            f"تفاصيل بطاقة اللاعب: {player_name} | "
            f"التقييم: {rating} | "
            f"النادي: {club} | "
            f"العمر: {age} | "
            f"القيمة: {market_value}M"
        )
        
        return card
    
    @staticmethod
    def _generate_manager_card(rarity: str, card_id: str) -> Dict[str, Any]:
        """
        توليد بطاقة مدرب غامضة محسنة
        
        المعاملات:
            rarity: مستوى الندرة
            card_id: معرف البطاقة الفريد
            
        المخرجات:
            قاموس بيانات بطاقة المدرب
        """
        # الحصول على نطاق التقييم التكتيكي
        tactic_range = MANAGER_RATING_RANGES[rarity]
        tactic_rating = round(random.uniform(tactic_range[0], tactic_range[1]), 1)
        
        # اختيار اسم واقعي
        manager_name = random.choice(REALISTIC_MANAGER_NAMES)
        
        # اختيار تشكيلات وأساليب
        formation = random.choice(MANAGER_FORMATIONS[rarity])
        style = random.choice(MANAGER_STYLES[rarity])
        
        # اختيار النادي والجنسية
        club = random.choice(REALISTIC_CLUBS)
        nationality = random.choice(REALISTIC_NATIONALITIES)
        
        # سنوات الخبرة
        experience_ranges = {
            "Legendary": (15, 35),
            "Medium": (8, 20),
            "Weak": (2, 12)
        }
        experience = random.randint(*experience_ranges[rarity])
        
        # بناء رابط الصورة
        image_url = MysteryCardGenerator._generate_manager_image_url(
            manager_name, rarity
        )
        
        # الإنجازات حسب الندرة
        achievements = {
            "Legendary": random.choice([
                "دوري أبطال أوروبا", "كأس العالم للأندية", "دوريات متعددة",
                "ثلاثية تاريخية", "ذهبية الأولمبياد"
            ]),
            "Medium": random.choice([
                "كأس محلي", "دوري محلي", "الوصول لنهائي قاري",
                "تأهل لدوري الأبطال", "كأس السوبر"
            ]),
            "Weak": random.choice([
                "صعود للدرجة الأولى", "تجنب الهبوط",
                "تطوير أكاديمية", "كأس محلي صغير"
            ])
        }
        
        # بناء قاموس البطاقة الكامل
        card = {
            "id": card_id,
            "name": manager_name,
            "position": "MGR",
            "tactic_rating": tactic_rating,
            "rarity": rarity,
            "type": "manager",
            "is_mystery": True,
            "acquired_from": "mystery_card",
            
            # معلومات المدرب
            "team": club,
            "nationality": nationality,
            "experience": experience,
            "image_url": image_url,
            
            # تكتيك وإدارة
            "style": style,
            "formation": formation,
            "achievements": achievements[rarity],
            
            # تقييمات فرعية للمدرب
            "attack_coaching": MysteryCardGenerator._generate_coaching_stat(tactic_rating, "attack"),
            "defense_coaching": MysteryCardGenerator._generate_coaching_stat(tactic_rating, "defense"),
            "midfield_coaching": MysteryCardGenerator._generate_coaching_stat(tactic_rating, "midfield"),
            "youth_development": MysteryCardGenerator._generate_coaching_stat(tactic_rating, "youth"),
            "motivation": MysteryCardGenerator._generate_coaching_stat(tactic_rating, "motivation"),
            "discipline": random.uniform(5.0, 10.0),
            
            # خصائص إضافية لمحرك المباراة
            "preferred_style": style,
            "secondary_formation": random.choice(MANAGER_FORMATIONS[rarity]),
            "adaptability": random.uniform(0.5, 1.0),
            "pressure_handling": random.uniform(0.6, 1.0),
            
            # سمات خاصة
            "leadership_style": random.choice([
                "ديمقراطي", "استبدادي", "تحويلي", "خدمي"
            ]),
            "philosophy": random.choice([
                "كرة هجومية", "صلابة دفاعية", "استحواذ", "كرة شاملة"
            ]),
        }
        
        logger.debug(
            f"تفاصيل بطاقة المدرب: {manager_name} | "
            f"التكتيك: {tactic_rating} | "
            f"التشكيل: {formation} | "
            f"الخبرة: {experience} سنة"
        )
        
        return card
    
    @staticmethod
    def _generate_player_stats(
        position: str, rating: float, rarity: str
    ) -> Dict[str, float]:
        """
        توليد إحصائيات تفصيلية للاعب حسب مركزه
        
        المعاملات:
            position: مركز اللاعب
            rating: التقييم العام
            rarity: مستوى الندرة
            
        المخرجات:
            قاموس الإحصائيات التفصيلية
        """
        base = rating
        
        # معاملات التخصص حسب المركز
        position_modifiers = {
            "GK": {
                "pace": 0.6, "shooting": 0.3, "passing": 0.7,
                "dribbling": 0.4, "defending": 1.3, "physical": 1.1,
                "reflexes": 1.4, "handling": 1.3, "positioning": 1.3
            },
            "DEF": {
                "pace": 0.9, "shooting": 0.5, "passing": 0.8,
                "dribbling": 0.6, "defending": 1.4, "physical": 1.2,
                "tackling": 1.3, "marking": 1.3, "aerial": 1.1
            },
            "MID": {
                "pace": 0.9, "shooting": 0.9, "passing": 1.3,
                "dribbling": 1.1, "defending": 0.7, "physical": 0.8,
                "vision": 1.3, "long_shots": 1.0, "stamina": 1.1
            },
            "ATT": {
                "pace": 1.2, "shooting": 1.3, "passing": 0.8,
                "dribbling": 1.2, "defending": 0.3, "physical": 0.9,
                "finishing": 1.4, "heading": 1.0, "composure": 1.2
            }
        }
        
        modifiers = position_modifiers.get(position, position_modifiers["MID"])
        
        # توليد الإحصائيات مع بعض العشوائية
        stats = {}
        for stat, modifier in modifiers.items():
            # القيمة الأساسية مع التعديل
            stat_value = base * modifier
            # إضافة عشوائية بنسبة ±15%
            variance = random.uniform(0.85, 1.15)
            # ضمان القيمة بين 1 و 99
            stats[stat] = round(max(1.0, min(99.0, stat_value * variance)), 1)
        
        # إضافة إحصائيات عامة
        stats["overall"] = rating
        
        return stats
    
    @staticmethod
    def _calculate_market_value(rating: float, rarity: str, age: int) -> str:
        """
        حساب القيمة السوقية التقديرية للاعب
        
        المعاملات:
            rating: تقييم اللاعب
            rarity: الندرة
            age: العمر
            
        المخرجات:
            سلسلة نصية للقيمة السوقية
        """
        # القيمة الأساسية
        base_value = rating * 1.5
        
        # تعديل حسب الندرة
        rarity_multipliers = {
            "Legendary": 2.5,
            "Medium": 1.2,
            "Weak": 0.5
        }
        multiplier = rarity_multipliers[rarity]
        
        # تعديل حسب العمر
        if 24 <= age <= 28:
            age_factor = 1.3  # ذروة العطاء
        elif 20 <= age <= 32:
            age_factor = 1.0  # عمر جيد
        else:
            age_factor = 0.7  # صغير جداً أو كبير
        
        # القيمة النهائية
        value = base_value * multiplier * age_factor
        
        # تنسيق القيمة
        if value >= 100:
            return f"{value:.0f}M €"
        elif value >= 10:
            return f"{value:.1f}M €"
        else:
            return f"{value:.2f}M €"
    
    @staticmethod
    def _calculate_potential(rating: float, rarity: str) -> float:
        """
        حساب الإمكانيات المستقبلية للاعب
        
        المعاملات:
            rating: التقييم الحالي
            rarity: الندرة
            
        المخرجات:
            التقييم المحتمل
        """
        potential_ranges = {
            "Legendary": (rating, min(99, rating + 5)),
            "Medium": (rating, min(99, rating + 8)),
            "Weak": (rating, min(99, rating + 15))
        }
        pot_range = potential_ranges[rarity]
        return round(random.uniform(pot_range[0], pot_range[1]), 1)
    
    @staticmethod
    def _calculate_chemistry(rarity: str) -> float:
        """حساب معامل الانسجام للاعب"""
        chemistry_ranges = {
            "Legendary": (80, 100),
            "Medium": (60, 85),
            "Weak": (30, 65)
        }
        chem_range = chemistry_ranges[rarity]
        return round(random.uniform(chem_range[0], chem_range[1]), 1)
    
    @staticmethod
    def _generate_coaching_stat(base_tactic: float, aspect: str) -> float:
        """توليد تقييم تدريبي فرعي"""
        aspect_modifiers = {
            "attack": 1.0,
            "defense": 1.0,
            "midfield": 1.0,
            "youth": 0.8,
            "motivation": 0.9
        }
        modifier = aspect_modifiers.get(aspect, 1.0)
        value = base_tactic * modifier * random.uniform(0.85, 1.15)
        return round(max(1.0, min(99.0, value)), 1)
    
    @staticmethod
    def _generate_height(position: str) -> int:
        """توليد طول اللاعب حسب المركز"""
        height_ranges = {
            "GK": (185, 205),
            "DEF": (178, 198),
            "MID": (168, 190),
            "ATT": (165, 195)
        }
        h_range = height_ranges.get(position, (170, 190))
        return random.randint(h_range[0], h_range[1])
    
    @staticmethod
    def _generate_weight(position: str) -> int:
        """توليد وزن اللاعب حسب المركز"""
        weight_ranges = {
            "GK": (78, 98),
            "DEF": (72, 92),
            "MID": (62, 82),
            "ATT": (58, 85)
        }
        w_range = weight_ranges.get(position, (65, 85))
        return random.randint(w_range[0], w_range[1])
    
    @staticmethod
    def _generate_unique_card_id(position: str, rarity: str) -> str:
        """توليد معرف فريد للبطاقة"""
        timestamp = str(int(time.time() * 1000))
        random_part = str(random.randint(1000, 9999))
        position_code = position[:3].upper()
        rarity_code = rarity[:3].upper()
        
        raw_id = f"MC-{position_code}-{rarity_code}-{timestamp}-{random_part}"
        hash_object = hashlib.md5(raw_id.encode())
        short_hash = hash_object.hexdigest()[:8].upper()
        
        return f"MC-{short_hash}-{MysteryCardGenerator._cards_generated + 1:04d}"
    
    @staticmethod
    def _generate_player_image_url(
        player_name: str, position: str, rarity: str
    ) -> str:
        """توليد رابط صورة اللاعب"""
        # في الإنتاج، استخدم API حقيقي مثل SoFIFA أو API-Football
        name_hash = hashlib.md5(player_name.encode()).hexdigest()[:8]
        
        # محاكاة روابط SoFIFA
        base_url = "https://cdn.sofifa.net/players"
        player_id = str(random.randint(100000, 260000))
        
        return f"{base_url}/{player_id[:3]}/{player_id[3:6]}/25_120.png"
    
    @staticmethod
    def _generate_manager_image_url(manager_name: str, rarity: str) -> str:
        """توليد رابط صورة المدرب"""
        name_hash = hashlib.md5(manager_name.encode()).hexdigest()[:8]
        return f"https://cdn.sofifa.net/players/managers/{name_hash}_120.png"
    
    @staticmethod
    def get_generation_statistics() -> Dict[str, Any]:
        """
        الحصول على إحصائيات توليد البطاقات
        
        المخرجات:
            قاموس بإحصائيات التوليد
        """
        total = MysteryCardGenerator._cards_generated
        
        if total == 0:
            return {
                "total_cards": 0,
                "distribution": {"Legendary": 0, "Medium": 0, "Weak": 0},
                "message": "لم يتم توليد أي بطاقات بعد"
            }
        
        # حساب التوزيع الفعلي
        rarity_count = {"Legendary": 0, "Medium": 0, "Weak": 0}
        for entry in MysteryCardGenerator._generation_history:
            rarity_count[entry["rarity"]] += 1
        
        return {
            "total_cards": total,
            "distribution": {
                rarity: {
                    "count": count,
                    "percentage": round((count / total) * 100, 2)
                }
                for rarity, count in rarity_count.items()
            },
            "last_generated": MysteryCardGenerator._generation_history[-1] if MysteryCardGenerator._generation_history else None
        }
    
    @staticmethod
    def validate_probability_distribution(samples: int = 100000) -> Dict[str, Any]:
        """
        التحقق من صحة توزيع الاحتمالات
        
        تحذير: للاختبار فقط. لا تستخدم في الإنتاج.
        
        المعاملات:
            samples: عدد العينات للتوليد
            
        المخرجات:
            قاموس بالاحتمالات الفعلية والمقارنة مع المتوقعة
        """
        logger.warning(f"بدء اختبار توزيع الاحتمالات بـ {samples:,} عينة...")
        
        start_time = time.time()
        legendary_count = 0
        medium_count = 0
        weak_count = 0
        
        for i in range(samples):
            rarity = MysteryCardGenerator._determine_rarity()
            if rarity == "Legendary":
                legendary_count += 1
            elif rarity == "Medium":
                medium_count += 1
            else:
                weak_count += 1
            
            # تسجيل التقدم كل 10000 ع
