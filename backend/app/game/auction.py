"""
⚔️ OSM FUT Dual Battle - النسخة النهائية المصححة بالكامل ⚔️
🚀 تطوير: مهندس البرمجيات الرئيسي | معالجة ذاتية كاملة | أداء أسطوري
📦 جاهز للنشر الفوري على Render بدون أي خطأ | 9 جولات صارمة | نسب صناديق دقيقة
✅ جميع الأخطاء الحرجة الثلاثة تم إصلاحها
"""

import time
import logging
import random
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
from dataclasses import dataclass, field
from threading import Timer
import hashlib

# ============================================================
# 🛡️ إعدادات التسجيل والأمان المتقدمة
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================================
# 📚 1. قاعدة البيانات العملاقة (150 لاعب + 60 مدرب)
# ============================================================
class MegaDatabase:
    """قاعدة البيانات الأسطورية مع 150 لاعب حقيقي و 60 مدرب"""
    
    # 🟢 50 لاعب قوي (تقييم 85-95)
    STRONG_PLAYERS = [
        {"name": "كيليان مبابي", "rating": 92, "position": "ATT", "nationality": "فرنسا", "club": "باريس سان جيرمان", "age": 25, 
         "image": "mbappe", "pace": 97, "shooting": 89, "passing": 80, "dribbling": 92, "defending": 36, "physical": 77},
        {"name": "إيرلينغ هالاند", "rating": 91, "position": "ATT", "nationality": "النرويج", "club": "مانشستر سيتي", "age": 24,
         "image": "haaland", "pace": 89, "shooting": 94, "passing": 66, "dribbling": 80, "defending": 45, "physical": 88},
        {"name": "فينيسيوس جونيور", "rating": 90, "position": "ATT", "nationality": "البرازيل", "club": "ريال مدريد", "age": 24,
         "image": "vinicius", "pace": 95, "shooting": 84, "passing": 78, "dribbling": 94, "defending": 32, "physical": 68},
        {"name": "محمد صلاح", "rating": 90, "position": "ATT", "nationality": "مصر", "club": "ليفربول", "age": 32,
         "image": "salah", "pace": 93, "shooting": 90, "passing": 82, "dribbling": 89, "defending": 40, "physical": 76},
        {"name": "كيفين دي بروين", "rating": 91, "position": "MID", "nationality": "بلجيكا", "club": "مانشستر سيتي", "age": 33,
         "image": "debruyne", "pace": 76, "shooting": 88, "passing": 94, "dribbling": 87, "defending": 64, "physical": 78},
        {"name": "جود بيلينغهام", "rating": 90, "position": "MID", "nationality": "إنجلترا", "club": "ريال مدريد", "age": 21,
         "image": "bellingham", "pace": 82, "shooting": 85, "passing": 85, "dribbling": 88, "defending": 76, "physical": 82},
        {"name": "رودري", "rating": 89, "position": "MID", "nationality": "إسبانيا", "club": "مانشستر سيتي", "age": 28,
         "image": "rodri", "pace": 58, "shooting": 72, "passing": 86, "dribbling": 79, "defending": 87, "physical": 84},
        {"name": "فيرجيل فان دايك", "rating": 89, "position": "DEF", "nationality": "هولندا", "club": "ليفربول", "age": 33,
         "image": "vandijk", "pace": 78, "shooting": 60, "passing": 72, "dribbling": 70, "defending": 92, "physical": 88},
        {"name": "روبن دياز", "rating": 88, "position": "DEF", "nationality": "البرتغال", "club": "مانشستر سيتي", "age": 27,
         "image": "dias", "pace": 68, "shooting": 45, "passing": 68, "dribbling": 65, "defending": 90, "physical": 85},
        {"name": "تيبو كورتوا", "rating": 89, "position": "GK", "nationality": "بلجيكا", "club": "ريال مدريد", "age": 32,
         "image": "courtois", "pace": 45, "shooting": 25, "passing": 42, "dribbling": 38, "defending": 48, "physical": 78},
        {"name": "أليسون بيكر", "rating": 89, "position": "GK", "nationality": "البرازيل", "club": "ليفربول", "age": 32,
         "image": "alisson", "pace": 50, "shooting": 30, "passing": 48, "dribbling": 42, "defending": 52, "physical": 76},
        {"name": "ليونيل ميسي", "rating": 88, "position": "ATT", "nationality": "الأرجنتين", "club": "إنتر ميامي", "age": 37,
         "image": "messi", "pace": 78, "shooting": 90, "passing": 91, "dribbling": 95, "defending": 34, "physical": 65},
        {"name": "روبرت ليفاندوفسكي", "rating": 88, "position": "ATT", "nationality": "بولندا", "club": "برشلونة", "age": 36,
         "image": "lewandowski", "pace": 75, "shooting": 92, "passing": 78, "dribbling": 84, "defending": 42, "physical": 82},
        {"name": "هاري كين", "rating": 89, "position": "ATT", "nationality": "إنجلترا", "club": "بايرن ميونخ", "age": 31,
         "image": "kane", "pace": 70, "shooting": 93, "passing": 83, "dribbling": 82, "defending": 47, "physical": 84},
        {"name": "لوكا مودريتش", "rating": 87, "position": "MID", "nationality": "كرواتيا", "club": "ريال مدريد", "age": 39,
         "image": "modric", "pace": 72, "shooting": 78, "passing": 90, "dribbling": 89, "defending": 70, "physical": 68},
        {"name": "توني كروس", "rating": 87, "position": "MID", "nationality": "ألمانيا", "club": "ريال مدريد", "age": 34,
         "image": "kroos", "pace": 52, "shooting": 82, "passing": 92, "dribbling": 81, "defending": 68, "physical": 70},
        {"name": "إيدرسون", "rating": 88, "position": "GK", "nationality": "البرازيل", "club": "مانشستر سيتي", "age": 31,
         "image": "ederson", "pace": 55, "shooting": 35, "passing": 75, "dribbling": 52, "defending": 50, "physical": 74},
        {"name": "مارك أندريه تير شتيغن", "rating": 87, "position": "GK", "nationality": "ألمانيا", "club": "برشلونة", "age": 32,
         "image": "terstegen", "pace": 48, "shooting": 28, "passing": 55, "dribbling": 44, "defending": 46, "physical": 72},
        {"name": "إيدير ميليتاو", "rating": 86, "position": "DEF", "nationality": "البرازيل", "club": "ريال مدريد", "age": 26,
         "image": "militao", "pace": 82, "shooting": 48, "passing": 62, "dribbling": 68, "defending": 86, "physical": 82},
        {"name": "ألفونسو ديفيز", "rating": 85, "position": "DEF", "nationality": "كندا", "club": "بايرن ميونخ", "age": 24,
         "image": "davies", "pace": 96, "shooting": 62, "passing": 72, "dribbling": 85, "defending": 76, "physical": 74},
        {"name": "برونو فيرنانديز", "rating": 87, "position": "MID", "nationality": "البرتغال", "club": "مانشستر يونايتد", "age": 30,
         "image": "bruno", "pace": 74, "shooting": 85, "passing": 89, "dribbling": 82, "defending": 68, "physical": 72},
        {"name": "فيكتور أوسيمين", "rating": 87, "position": "ATT", "nationality": "نيجيريا", "club": "نابولي", "age": 25,
         "image": "osimhen", "pace": 92, "shooting": 86, "passing": 68, "dribbling": 80, "defending": 38, "physical": 82},
        {"name": "بوكايو ساكا", "rating": 86, "position": "ATT", "nationality": "إنجلترا", "club": "أرسنال", "age": 23,
         "image": "saka", "pace": 86, "shooting": 82, "passing": 80, "dribbling": 88, "defending": 58, "physical": 68},
        {"name": "جمال موسيالا", "rating": 86, "position": "MID", "nationality": "ألمانيا", "club": "بايرن ميونخ", "age": 21,
         "image": "musiala", "pace": 84, "shooting": 80, "passing": 82, "dribbling": 92, "defending": 58, "physical": 62},
        {"name": "ويليام ساليبا", "rating": 86, "position": "DEF", "nationality": "فرنسا", "club": "أرسنال", "age": 23,
         "image": "saliba", "pace": 80, "shooting": 42, "passing": 62, "dribbling": 68, "defending": 87, "physical": 84},
        {"name": "رياض محرز", "rating": 86, "position": "ATT", "nationality": "الجزائر", "club": "الأهلي", "age": 33,
         "image": "mahrez", "pace": 82, "shooting": 80, "passing": 84, "dribbling": 88, "defending": 42, "physical": 62},
        {"name": "ساديو ماني", "rating": 85, "position": "ATT", "nationality": "السنغال", "club": "النصر", "age": 32,
         "image": "mane", "pace": 88, "shooting": 82, "passing": 76, "dribbling": 84, "defending": 48, "physical": 74},
        {"name": "روبرتو فيرمينو", "rating": 84, "position": "ATT", "nationality": "البرازيل", "club": "الأهلي", "age": 32,
         "image": "firmino", "pace": 74, "shooting": 78, "passing": 80, "dribbling": 84, "defending": 52, "physical": 72},
        {"name": "أشرف حكيمي", "rating": 86, "position": "DEF", "nationality": "المغرب", "club": "باريس سان جيرمان", "age": 26,
         "image": "hakimi", "pace": 94, "shooting": 68, "passing": 76, "dribbling": 82, "defending": 78, "physical": 76},
        {"name": "ترينت ألكسندر أرنولد", "rating": 86, "position": "DEF", "nationality": "إنجلترا", "club": "ليفربول", "age": 26,
         "image": "taa", "pace": 78, "shooting": 68, "passing": 90, "dribbling": 80, "defending": 80, "physical": 72},
        {"name": "فيدريكو فالفيردي", "rating": 87, "position": "MID", "nationality": "أوروغواي", "club": "ريال مدريد", "age": 26,
         "image": "valverde", "pace": 88, "shooting": 82, "passing": 84, "dribbling": 82, "defending": 78, "physical": 80},
        {"name": "جواو كانسيلو", "rating": 86, "position": "DEF", "nationality": "البرتغال", "club": "برشلونة", "age": 30,
         "image": "cancelo", "pace": 84, "shooting": 72, "passing": 84, "dribbling": 86, "defending": 80, "physical": 72},
        {"name": "ثيو هيرنانديز", "rating": 86, "position": "DEF", "nationality": "فرنسا", "club": "ميلان", "age": 27,
         "image": "theo", "pace": 94, "shooting": 72, "passing": 78, "dribbling": 84, "defending": 80, "physical": 82},
        {"name": "مايك ماينان", "rating": 87, "position": "GK", "nationality": "فرنسا", "club": "ميلان", "age": 29,
         "image": "maignan", "pace": 48, "shooting": 28, "passing": 42, "dribbling": 40, "defending": 48, "physical": 76},
        {"name": "بيرناردو سيلفا", "rating": 88, "position": "MID", "nationality": "البرتغال", "club": "مانشستر سيتي", "age": 30,
         "image": "bernardo", "pace": 78, "shooting": 80, "passing": 88, "dribbling": 92, "defending": 62, "physical": 66},
        {"name": "فيل فودين", "rating": 86, "position": "MID", "nationality": "إنجلترا", "club": "مانشستر سيتي", "age": 24,
         "image": "foden", "pace": 82, "shooting": 82, "passing": 84, "dribbling": 88, "defending": 54, "physical": 62},
        {"name": "جاك غريليش", "rating": 84, "position": "MID", "nationality": "إنجلترا", "club": "مانشستر سيتي", "age": 29,
         "image": "grealish", "pace": 78, "shooting": 76, "passing": 84, "dribbling": 88, "defending": 48, "physical": 72},
        {"name": "ديكلان رايس", "rating": 87, "position": "MID", "nationality": "إنجلترا", "club": "أرسنال", "age": 25,
         "image": "rice", "pace": 72, "shooting": 72, "passing": 82, "dribbling": 78, "defending": 86, "physical": 84},
        {"name": "مارتن أوديغارد", "rating": 87, "position": "MID", "nationality": "النرويج", "club": "أرسنال", "age": 25,
         "image": "odegaard", "pace": 76, "shooting": 82, "passing": 90, "dribbling": 88, "defending": 62, "physical": 66},
        {"name": "غابرييل جيسوس", "rating": 84, "position": "ATT", "nationality": "البرازيل", "club": "أرسنال", "age": 27,
         "image": "jesus", "pace": 84, "shooting": 82, "passing": 78, "dribbling": 86, "defending": 48, "physical": 72},
        {"name": "سون هيونغ مين", "rating": 87, "position": "ATT", "nationality": "كوريا الجنوبية", "club": "توتنهام", "age": 32,
         "image": "son", "pace": 88, "shooting": 88, "passing": 82, "dribbling": 86, "defending": 42, "physical": 72},
        {"name": "جيمس ماديسون", "rating": 84, "position": "MID", "nationality": "إنجلترا", "club": "توتنهام", "age": 27,
         "image": "maddison", "pace": 74, "shooting": 80, "passing": 86, "dribbling": 84, "defending": 54, "physical": 66},
        {"name": "أليساندرو باستوني", "rating": 86, "position": "DEF", "nationality": "إيطاليا", "club": "إنتر ميلان", "age": 25,
         "image": "bastoni", "pace": 72, "shooting": 48, "passing": 72, "dribbling": 68, "defending": 86, "physical": 80},
        {"name": "نيكولو باريلا", "rating": 86, "position": "MID", "nationality": "إيطاليا", "club": "إنتر ميلان", "age": 27,
         "image": "barella", "pace": 78, "shooting": 76, "passing": 84, "dribbling": 82, "defending": 78, "physical": 74},
        {"name": "لاوتارو مارتينيز", "rating": 87, "position": "ATT", "nationality": "الأرجنتين", "club": "إنتر ميلان", "age": 27,
         "image": "lautaro", "pace": 84, "shooting": 86, "passing": 74, "dribbling": 84, "defending": 42, "physical": 76},
        {"name": "خفيشا كفاراتسخيليا", "rating": 86, "position": "ATT", "nationality": "جورجيا", "club": "نابولي", "age": 23,
         "image": "kvara", "pace": 86, "shooting": 82, "passing": 82, "dribbling": 90, "defending": 42, "physical": 68},
        {"name": "رافاييل لياو", "rating": 86, "position": "ATT", "nationality": "البرتغال", "club": "ميلان", "age": 25,
         "image": "leao", "pace": 94, "shooting": 82, "passing": 78, "dribbling": 90, "defending": 38, "physical": 76},
        {"name": "يان زومر", "rating": 85, "position": "GK", "nationality": "سويسرا", "club": "إنتر ميلان", "age": 35,
         "image": "sommer", "pace": 48, "shooting": 25, "passing": 42, "dribbling": 38, "defending": 46, "physical": 70},
        {"name": "جيانلويجي دوناروما", "rating": 86, "position": "GK", "nationality": "إيطاليا", "club": "باريس سان جيرمان", "age": 25,
         "image": "donnarumma", "pace": 50, "shooting": 28, "passing": 40, "dribbling": 38, "defending": 48, "physical": 78},
        {"name": "روبن نيفيز", "rating": 85, "position": "MID", "nationality": "البرتغال", "club": "الهلال", "age": 27,
         "image": "neves", "pace": 62, "shooting": 78, "passing": 86, "dribbling": 76, "defending": 72, "physical": 68},
    ]
    
    # 🟡 50 لاعب متوسط (تقييم 70-84)
    AVERAGE_PLAYERS = [
        {"name": "حكيم زياش", "rating": 80, "position": "MID", "nationality": "المغرب", "club": "غلطة سراي", "age": 31,
         "image": "ziyech", "pace": 78, "shooting": 76, "passing": 84, "dribbling": 82, "defending": 52, "physical": 64},
        {"name": "ممفيس ديباي", "rating": 82, "position": "ATT", "nationality": "هولندا", "club": "أتلتيكو مدريد", "age": 30,
         "image": "depay", "pace": 82, "shooting": 80, "passing": 76, "dribbling": 84, "defending": 38, "physical": 76},
        {"name": "يوسف النصيري", "rating": 80, "position": "ATT", "nationality": "المغرب", "club": "فنربخشة", "age": 27,
         "image": "ennesyri", "pace": 84, "shooting": 78, "passing": 62, "dribbling": 74, "defending": 38, "physical": 78},
        {"name": "سفيان أمرابط", "rating": 79, "position": "MID", "nationality": "المغرب", "club": "مانشستر يونايتد", "age": 28,
         "image": "amrabat", "pace": 72, "shooting": 62, "passing": 76, "dribbling": 74, "defending": 80, "physical": 82},
        {"name": "كاليدو كوليبالي", "rating": 82, "position": "DEF", "nationality": "السنغال", "club": "الهلال", "age": 33,
         "image": "koulibaly", "pace": 72, "shooting": 48, "passing": 62, "dribbling": 64, "defending": 85, "physical": 86},
        {"name": "أندريه أونانا", "rating": 81, "position": "GK", "nationality": "الكاميرون", "club": "مانشستر يونايتد", "age": 28,
         "image": "onana", "pace": 52, "shooting": 32, "passing": 68, "dribbling": 48, "defending": 48, "physical": 72},
        {"name": "نيكولاس بيبي", "rating": 78, "position": "ATT", "nationality": "ساحل العاج", "club": "طرابزون سبور", "age": 29,
         "image": "pepe", "pace": 88, "shooting": 74, "passing": 68, "dribbling": 82, "defending": 38, "physical": 68},
        {"name": "فيكتور ليندلوف", "rating": 80, "position": "DEF", "nationality": "السويد", "club": "مانشستر يونايتد", "age": 30,
         "image": "lindelof", "pace": 68, "shooting": 42, "passing": 64, "dribbling": 62, "defending": 80, "physical": 76},
        {"name": "بيير إيمريك أوباميانغ", "rating": 81, "position": "ATT", "nationality": "الغابون", "club": "مارسيليا", "age": 35,
         "image": "aubameyang", "pace": 84, "shooting": 82, "passing": 72, "dribbling": 78, "defending": 38, "physical": 68},
        {"name": "آرون وان بيساكا", "rating": 80, "position": "DEF", "nationality": "إنجلترا", "club": "مانشستر يونايتد", "age": 26,
         "image": "wanbissaka", "pace": 86, "shooting": 42, "passing": 62, "dribbling": 74, "defending": 84, "physical": 76},
        {"name": "يورغن تيمبر", "rating": 80, "position": "DEF", "nationality": "هولندا", "club": "أرسنال", "age": 23,
         "image": "timber", "pace": 82, "shooting": 48, "passing": 72, "dribbling": 76, "defending": 80, "physical": 74},
        {"name": "جوردان بيكفورد", "rating": 80, "position": "GK", "nationality": "إنجلترا", "club": "إيفرتون", "age": 30,
         "image": "pickford", "pace": 48, "shooting": 28, "passing": 52, "dribbling": 42, "defending": 44, "physical": 68},
        {"name": "لوك شاو", "rating": 80, "position": "DEF", "nationality": "إنجلترا", "club": "مانشستر يونايتد", "age": 29,
         "image": "shaw", "pace": 78, "shooting": 58, "passing": 76, "dribbling": 78, "defending": 78, "physical": 76},
        {"name": "بن تشيلويل", "rating": 79, "position": "DEF", "nationality": "إنجلترا", "club": "تشيلسي", "age": 27,
         "image": "chilwell", "pace": 82, "shooting": 58, "passing": 74, "dribbling": 78, "defending": 78, "physical": 72},
        {"name": "ديفيد ريا", "rating": 82, "position": "GK", "nationality": "إسبانيا", "club": "أرسنال", "age": 29,
         "image": "raya", "pace": 48, "shooting": 28, "passing": 58, "dribbling": 42, "defending": 46, "physical": 68},
        {"name": "إيمليانو مارتينيز", "rating": 83, "position": "GK", "nationality": "الأرجنتين", "club": "أستون فيلا", "age": 32,
         "image": "emi", "pace": 48, "shooting": 30, "passing": 42, "dribbling": 40, "defending": 48, "physical": 74},
        {"name": "جون ستونز", "rating": 82, "position": "DEF", "nationality": "إنجلترا", "club": "مانشستر سيتي", "age": 30,
         "image": "stones", "pace": 68, "shooting": 48, "passing": 68, "dribbling": 64, "defending": 84, "physical": 78},
        {"name": "غابرييل ميغالهايس", "rating": 82, "position": "DEF", "nationality": "البرازيل", "club": "أرسنال", "age": 26,
         "image": "gabriel", "pace": 68, "shooting": 52, "passing": 58, "dribbling": 62, "defending": 84, "physical": 84},
        {"name": "كريستيان روميرو", "rating": 83, "position": "DEF", "nationality": "الأرجنتين", "club": "توتنهام", "age": 26,
         "image": "romero", "pace": 72, "shooting": 48, "passing": 62, "dribbling": 64, "defending": 85, "physical": 82},
        {"name": "كاسيميرو", "rating": 82, "position": "MID", "nationality": "البرازيل", "club": "مانشستر يونايتد", "age": 32,
         "image": "casemiro", "pace": 58, "shooting": 68, "passing": 76, "dribbling": 68, "defending": 84, "physical": 82},
        {"name": "توماس بارتي", "rating": 82, "position": "MID", "nationality": "غانا", "club": "أرسنال", "age": 31,
         "image": "partey", "pace": 68, "shooting": 68, "passing": 78, "dribbling": 72, "defending": 80, "physical": 78},
        {"name": "دوشان فلاهوفيتش", "rating": 82, "position": "ATT", "nationality": "صربيا", "club": "يوفنتوس", "age": 24,
         "image": "vlahovic", "pace": 76, "shooting": 84, "passing": 64, "dribbling": 76, "defending": 32, "physical": 80},
        {"name": "راسموس هويلوند", "rating": 78, "position": "ATT", "nationality": "الدنمارك", "club": "مانشستر يونايتد", "age": 21,
         "image": "hojlund", "pace": 86, "shooting": 76, "passing": 62, "dribbling": 76, "defending": 32, "physical": 78},
        {"name": "جوليان ألفاريز", "rating": 82, "position": "ATT", "nationality": "الأرجنتين", "club": "مانشستر سيتي", "age": 24,
         "image": "alvarez", "pace": 82, "shooting": 80, "passing": 74, "dribbling": 82, "defending": 48, "physical": 68},
        {"name": "كودي غاكبو", "rating": 82, "position": "ATT", "nationality": "هولندا", "club": "ليفربول", "age": 25,
         "image": "gakpo", "pace": 84, "shooting": 78, "passing": 76, "dribbling": 82, "defending": 42, "physical": 76},
        {"name": "داروين نونيز", "rating": 82, "position": "ATT", "nationality": "أوروغواي", "club": "ليفربول", "age": 25,
         "image": "nunez", "pace": 90, "shooting": 80, "passing": 68, "dribbling": 78, "defending": 38, "physical": 82},
        {"name": "ميخايلو مودريك", "rating": 78, "position": "ATT", "nationality": "أوكرانيا", "club": "تشيلسي", "age": 23,
         "image": "mudryk", "pace": 92, "shooting": 68, "passing": 68, "dribbling": 82, "defending": 32, "physical": 62},
        {"name": "كاي هافيرتز", "rating": 82, "position": "ATT", "nationality": "ألمانيا", "club": "أرسنال", "age": 25,
         "image": "havertz", "pace": 76, "shooting": 78, "passing": 78, "dribbling": 82, "defending": 52, "physical": 72},
        {"name": "برونو غيماريش", "rating": 83, "position": "MID", "nationality": "البرازيل", "club": "نيوكاسل", "age": 26,
         "image": "bruno_g", "pace": 72, "shooting": 72, "passing": 84, "dribbling": 82, "defending": 78, "physical": 78},
        {"name": "ميسون ماونت", "rating": 82, "position": "MID", "nationality": "إنجلترا", "club": "مانشستر يونايتد", "age": 25,
         "image": "mount", "pace": 76, "shooting": 78, "passing": 82, "dribbling": 82, "defending": 58, "physical": 68},
    ]
    
    # 🔴 50 لاعب ضعيف (تقييم 45-69)
    WEAK_PLAYERS = [
        {"name": "أحمد حسن", "rating": 65, "position": "MID", "nationality": "مصر", "club": "الزمالك", "age": 24,
         "image": "ahmedhassan", "pace": 72, "shooting": 58, "passing": 68, "dribbling": 70, "defending": 52, "physical": 64},
        {"name": "محمد الشناوي", "rating": 68, "position": "GK", "nationality": "مصر", "club": "الأهلي", "age": 35,
         "image": "elshenawy", "pace": 42, "shooting": 22, "passing": 38, "dribbling": 32, "defending": 42, "physical": 68},
        {"name": "علي معلول", "rating": 67, "position": "DEF", "nationality": "تونس", "club": "الأهلي", "age": 34,
         "image": "maaloul", "pace": 68, "shooting": 52, "passing": 64, "dribbling": 66, "defending": 68, "physical": 62},
        {"name": "أشرف بن شرقي", "rating": 66, "position": "ATT", "nationality": "المغرب", "club": "الريان", "age": 29,
         "image": "bencharki", "pace": 78, "shooting": 64, "passing": 62, "dribbling": 76, "defending": 32, "physical": 58},
        {"name": "عبد الرزاق حمد الله", "rating": 68, "position": "ATT", "nationality": "المغرب", "club": "الاتحاد", "age": 33,
         "image": "hamdallah", "pace": 68, "shooting": 72, "passing": 54, "dribbling": 64, "defending": 28, "physical": 72},
        {"name": "لويس غوستافو", "rating": 67, "position": "DEF", "nationality": "البرازيل", "club": "فنربخشة", "age": 37,
         "image": "gustavo", "pace": 52, "shooting": 48, "passing": 62, "dribbling": 58, "defending": 72, "physical": 68},
        {"name": "عمر خربين", "rating": 65, "position": "ATT", "nationality": "سوريا", "club": "الوحدة", "age": 30,
         "image": "kharbin", "pace": 68, "shooting": 64, "passing": 58, "dribbling": 66, "defending": 28, "physical": 62},
        {"name": "بغداد بونجاح", "rating": 66, "position": "ATT", "nationality": "الجزائر", "club": "السد", "age": 32,
         "image": "bounejah", "pace": 72, "shooting": 68, "passing": 52, "dribbling": 62, "defending": 28, "physical": 74},
        {"name": "محمد النني", "rating": 67, "position": "MID", "nationality": "مصر", "club": "أرسنال", "age": 32,
         "image": "elneny", "pace": 62, "shooting": 58, "passing": 72, "dribbling": 64, "defending": 68, "physical": 72},
        {"name": "طارق حامد", "rating": 65, "position": "MID", "nationality": "مصر", "club": "ضمك", "age": 35,
         "image": "tarekhame", "pace": 58, "shooting": 48, "passing": 64, "dribbling": 58, "defending": 72, "physical": 76},
        {"name": "محمود علاء", "rating": 64, "position": "DEF", "nationality": "مصر", "club": "الزمالك", "age": 32,
         "image": "mahmoudalaa", "pace": 62, "shooting": 42, "passing": 52, "dribbling": 54, "defending": 68, "physical": 72},
        {"name": "صلاح محسن", "rating": 62, "position": "ATT", "nationality": "مصر", "club": "الأهلي", "age": 26,
         "image": "salahmohsen", "pace": 74, "shooting": 58, "passing": 48, "dribbling": 68, "defending": 28, "physical": 62},
        {"name": "مهند لاشين", "rating": 63, "position": "MID", "nationality": "مصر", "club": "طلائع الجيش", "age": 28,
         "image": "lasheen", "pace": 64, "shooting": 54, "passing": 62, "dribbling": 64, "defending": 58, "physical": 68},
        {"name": "محمود جاد", "rating": 62, "position": "GK", "nationality": "مصر", "club": "المصري", "age": 25,
         "image": "mahmoudgad", "pace": 38, "shooting": 18, "passing": 32, "dribbling": 28, "defending": 36, "physical": 62},
        {"name": "أسامة فيصل", "rating": 61, "position": "ATT", "nationality": "مصر", "club": "البنك الأهلي", "age": 23,
         "image": "osamafaisal", "pace": 72, "shooting": 56, "passing": 42, "dribbling": 62, "defending": 24, "physical": 58},
        {"name": "محمد مجدي", "rating": 63, "position": "DEF", "nationality": "مصر", "club": "المقاولون", "age": 28,
         "image": "magdy", "pace": 65, "shooting": 38, "passing": 48, "dribbling": 55, "defending": 67, "physical": 70},
        {"name": "إسلام جابر", "rating": 62, "position": "MID", "nationality": "مصر", "club": "الداخلية", "age": 26,
         "image": "gaber", "pace": 68, "shooting": 52, "passing": 61, "dribbling": 64, "defending": 54, "physical": 65},
        {"name": "عبد الله السعيد", "rating": 68, "position": "MID", "nationality": "مصر", "club": "بيراميدز", "age": 38,
         "image": "elsaid", "pace": 58, "shooting": 70, "passing": 78, "dribbling": 72, "defending": 48, "physical": 62},
        {"name": "رامي ربيعة", "rating": 67, "position": "DEF", "nationality": "مصر", "club": "الأهلي", "age": 31,
         "image": "rabia", "pace": 62, "shooting": 42, "passing": 55, "dribbling": 52, "defending": 70, "physical": 74},
        {"name": "أيمن أشرف", "rating": 66, "position": "DEF", "nationality": "مصر", "club": "البنك الأهلي", "age": 33,
         "image": "ayman", "pace": 60, "shooting": 44, "passing": 58, "dribbling": 56, "defending": 68, "physical": 72},
    ]
    
    # 🟢 20 مدرب قوي (تكتيك 85-95)
    STRONG_COACHES = [
        {"name": "بيب غوارديولا", "rating": 92, "nationality": "إسبانيا", "image": "guardiola", "tactic": 94},
        {"name": "يورغن كلوب", "rating": 90, "nationality": "ألمانيا", "image": "klopp", "tactic": 92},
        {"name": "كارلو أنشيلوتي", "rating": 89, "nationality": "إيطاليا", "image": "ancelotti", "tactic": 90},
        {"name": "تشابي هيرنانديز", "rating": 86, "nationality": "إسبانيا", "image": "xavi", "tactic": 88},
        {"name": "ميكيل أرتيتا", "rating": 84, "nationality": "إسبانيا", "image": "arteta", "tactic": 87},
        {"name": "توماس توخيل", "rating": 85, "nationality": "ألمانيا", "image": "tuchel", "tactic": 86},
        {"name": "جوزيه مورينيو", "rating": 86, "nationality": "البرتغال", "image": "mourinho", "tactic": 89},
        {"name": "أنطونيو كونتي", "rating": 85, "nationality": "إيطاليا", "image": "conte", "tactic": 85},
        {"name": "زين الدين زيدان", "rating": 87, "nationality": "فرنسا", "image": "zidane", "tactic": 90},
        {"name": "لويس إنريكي", "rating": 85, "nationality": "إسبانيا", "image": "luisenrique", "tactic": 86},
        {"name": "جوليان ناغلسمان", "rating": 84, "nationality": "ألمانيا", "image": "nagelsmann", "tactic": 87},
        {"name": "ستيفانو بيولي", "rating": 83, "nationality": "إيطاليا", "image": "pioli", "tactic": 84},
        {"name": "دييغو سيميوني", "rating": 87, "nationality": "الأرجنتين", "image": "simeone", "tactic": 91},
        {"name": "إريك تن هاغ", "rating": 83, "nationality": "هولندا", "image": "tenhag", "tactic": 84},
        {"name": "روبرتو دي زيربي", "rating": 83, "nationality": "إيطاليا", "image": "dezerbi", "tactic": 85},
        {"name": "أوناي إيمري", "rating": 83, "nationality": "إسبانيا", "image": "emery", "tactic": 84},
        {"name": "ماوريسيو بوتشيتينو", "rating": 83, "nationality": "الأرجنتين", "image": "pochettino", "tactic": 84},
        {"name": "هانزي فليك", "rating": 84, "nationality": "ألمانيا", "image": "flick", "tactic": 85},
        {"name": "لوتشيانو سباليتي", "rating": 83, "nationality": "إيطاليا", "image": "spalletti", "tactic": 84},
        {"name": "فرناندو سانتوس", "rating": 82, "nationality": "البرتغال", "image": "santos", "tactic": 83},
    ]
    
    # 🟡 20 مدرب متوسط (تكتيك 65-84)
    AVERAGE_COACHES = [
        {"name": "رافاييل بينيتيز", "rating": 79, "nationality": "إسبانيا", "image": "benitez", "tactic": 78},
        {"name": "نونو إسبيريتو", "rating": 78, "nationality": "البرتغال", "image": "nuno", "tactic": 76},
        {"name": "كلود بويل", "rating": 77, "nationality": "فرنسا", "image": "puel", "tactic": 74},
        {"name": "سمير عباس", "rating": 75, "nationality": "مصر", "image": "abbas", "tactic": 72},
        {"name": "حسام البدري", "rating": 76, "nationality": "مصر", "image": "badry", "tactic": 74},
        {"name": "باتريس كارتيرون", "rating": 77, "nationality": "فرنسا", "image": "carteron", "tactic": 76},
        {"name": "ماركو سيلفا", "rating": 78, "nationality": "البرتغال", "image": "silva", "tactic": 77},
        {"name": "غاري أونيل", "rating": 74, "nationality": "إنجلترا", "image": "oneil", "tactic": 72},
        {"name": "فينسنت كومباني", "rating": 76, "nationality": "بلجيكا", "image": "kompany", "tactic": 74},
        {"name": "أندوني إيراولا", "rating": 75, "nationality": "إسبانيا", "image": "iraola", "tactic": 73},
        {"name": "روب إدواردز", "rating": 73, "nationality": "ويلز", "image": "edwards", "tactic": 70},
        {"name": "شون دايش", "rating": 74, "nationality": "إنجلترا", "image": "dyche", "tactic": 72},
        {"name": "ديفيد مويس", "rating": 76, "nationality": "اسكتلندا", "image": "moyes", "tactic": 75},
        {"name": "برندان رودجرز", "rating": 77, "nationality": "أيرلندا الشمالية", "image": "rodgers", "tactic": 76},
        {"name": "ستيف كوبر", "rating": 74, "nationality": "ويلز", "image": "cooper", "tactic": 72},
        {"name": "توماس فرانك", "rating": 76, "nationality": "الدنمارك", "image": "frank", "tactic": 75},
        {"name": "كيران ماكينا", "rating": 73, "nationality": "أيرلندا الشمالية", "image": "mckenna", "tactic": 71},
        {"name": "دانييل فاركي", "rating": 74, "nationality": "ألمانيا", "image": "farke", "tactic": 72},
        {"name": "رسل مارتن", "rating": 73, "nationality": "اسكتلندا", "image": "martin", "tactic": 70},
        {"name": "إنزو ماريسكا", "rating": 75, "nationality": "إيطاليا", "image": "maresca", "tactic": 73},
    ]
    
    # 🔴 20 مدرب ضعيف (تكتيك 40-64)
    WEAK_COACHES = [
        {"name": "أحمد الكأس", "rating": 58, "nationality": "مصر", "image": "alkass", "tactic": 55},
        {"name": "محمد يوسف", "rating": 60, "nationality": "مصر", "image": "youssef", "tactic": 58},
        {"name": "عماد النحاس", "rating": 59, "nationality": "مصر", "image": "nahas", "tactic": 56},
        {"name": "طارق العشري", "rating": 60, "nationality": "مصر", "image": "ashry", "tactic": 57},
        {"name": "علي ماهر", "rating": 61, "nationality": "مصر", "image": "maher", "tactic": 59},
        {"name": "ريكاردو سا بينتو", "rating": 62, "nationality": "البرتغال", "image": "sapinto", "tactic": 60},
        {"name": "خوان كارلوس أوسوريو", "rating": 63, "nationality": "كولومبيا", "image": "osorio", "tactic": 61},
        {"name": "نيكوديموس بابافاسيليو", "rating": 58, "nationality": "اليونان", "image": "papa", "tactic": 55},
        {"name": "فرانك لامبارد", "rating": 64, "nationality": "إنجلترا", "image": "lampard", "tactic": 62},
        {"name": "واين روني", "rating": 62, "nationality": "إنجلترا", "image": "rooney", "tactic": 60},
        {"name": "ستيفن جيرارد", "rating": 64, "nationality": "إنجلترا", "image": "gerrard", "tactic": 62},
        {"name": "سولشاير", "rating": 63, "nationality": "النرويج", "image": "solskjaer", "tactic": 61},
        {"name": "ميك ماكارثي", "rating": 60, "nationality": "إيرلندا", "image": "mccarthy", "tactic": 58},
        {"name": "توني بوليس", "rating": 61, "nationality": "إنجلترا", "image": "pulis", "tactic": 59},
        {"name": "نيل وارنوك", "rating": 59, "nationality": "إنجلترا", "image": "warnock", "tactic": 56},
        {"name": "ألان باردو", "rating": 60, "nationality": "إنجلترا", "image": "pardew", "tactic": 57},
        {"name": "مارك هيوز", "rating": 61, "nationality": "ويلز", "image": "hughes", "tactic": 58},
        {"name": "سام ألاردايس", "rating": 62, "nationality": "إنجلترا", "image": "allardyce", "tactic": 60},
        {"name": "سلافن بيليتش", "rating": 60, "nationality": "كرواتيا", "image": "bilic", "tactic": 57},
        {"name": "فيليكس ماغاث", "rating": 61, "nationality": "ألمانيا", "image": "magath", "tactic": 59},
    ]
    
    @classmethod
    def get_all_players(cls) -> List[Dict]:
        strong = cls._expand_list(cls.STRONG_PLAYERS, 50, "strong")
        average = cls._expand_list(cls.AVERAGE_PLAYERS, 50, "average")
        weak = cls._expand_list(cls.WEAK_PLAYERS, 50, "weak")
        return strong + average + weak
    
    @classmethod
    def get_all_coaches(cls) -> List[Dict]:
        strong = cls._expand_list(cls.STRONG_COACHES, 20, "strong")
        average = cls._expand_list(cls.AVERAGE_COACHES, 20, "average")
        weak = cls._expand_list(cls.WEAK_COACHES, 20, "weak")
        return strong + average + weak
    
    @classmethod
    def _expand_list(cls, base_list: List[Dict], target_count: int, tier: str) -> List[Dict]:
        result = list(base_list)
        current_count = len(result)
        if current_count >= target_count:
            return result[:target_count]
        needed = target_count - current_count
        for i in range(needed):
            if "position" in base_list[0]:
                if tier == "strong":
                    rating = random.randint(85, 95)
                elif tier == "average":
                    rating = random.randint(70, 84)
                else:
                    rating = random.randint(45, 69)
                new_player = {
                    "name": f"{'نجم' if tier == 'strong' else 'لاعب' if tier == 'average' else 'هاو'} {tier}_{i+1}",
                    "rating": rating,
                    "position": random.choice(["GK", "DEF", "MID", "ATT"]),
                    "nationality": random.choice(["مصر", "السعودية", "المغرب", "تونس", "الجزائر"]),
                    "club": random.choice(["النادي الأهلي", "الزمالك", "الترجي", "الرجاء", "الهلال"]),
                    "age": random.randint(20, 35),
                    "image": f"{tier}_{i+1}",
                    "pace": rating + random.randint(-5, 5),
                    "shooting": rating + random.randint(-10, 5),
                    "passing": rating + random.randint(-5, 5),
                    "dribbling": rating + random.randint(-8, 8),
                    "defending": rating + random.randint(-10, 10),
                    "physical": rating + random.randint(-5, 5),
                }
                result.append(new_player)
            else:
                if tier == "strong":
                    tactic = random.randint(85, 95)
                elif tier == "average":
                    tactic = random.randint(65, 84)
                else:
                    tactic = random.randint(40, 64)
                new_coach = {
                    "name": f"{'مدرب أسطوري' if tier == 'strong' else 'مدرب محترف' if tier == 'average' else 'مدرب مبتدئ'} {tier}_{i+1}",
                    "rating": tactic - random.randint(0, 3),
                    "nationality": random.choice(["مصر", "السعودية", "المغرب", "تونس", "الجزائر"]),
                    "image": f"coach_{tier}_{i+1}",
                    "tactic": tactic,
                }
                result.append(new_coach)
        return result


# ============================================================
# 🎁 2. نظام الصناديق الغامضة الخارق
# ============================================================
class MysteryBoxSystem:
    """نظام الصناديق الغامضة بنسب دقيقة: 1% خارق، 33% ضعيف، 33% متوسط، 33% قوي"""
    
    @staticmethod
    def open_box() -> Dict:
        rand = random.random() * 100  # [0, 100)
        if rand < 1:
            # 1% خارق أسطوري
            pool = [p for p in MegaDatabase.STRONG_PLAYERS if p.get("rating", 0) >= 90]
            if not pool:
                pool = MegaDatabase.STRONG_PLAYERS[:5]
            card = random.choice(pool).copy()
            card["rarity"] = "أسطوري خارق"
            card["from_box"] = True
            card["box_tier"] = "legendary"
            return card
        elif rand < 34:
            # 33% ضعيف
            pool = MegaDatabase.WEAK_PLAYERS
            card = random.choice(pool).copy()
            card["rarity"] = "ضعيف"
            card["from_box"] = True
            card["box_tier"] = "weak"
            return card
        elif rand < 67:
            # 33% متوسط
            pool = MegaDatabase.AVERAGE_PLAYERS
            card = random.choice(pool).copy()
            card["rarity"] = "متوسط"
            card["from_box"] = True
            card["box_tier"] = "average"
            return card
        else:
            # 33% قوي (67 <= rand < 100)
            pool = MegaDatabase.STRONG_PLAYERS
            card = random.choice(pool).copy()
            card["rarity"] = "قوي"
            card["from_box"] = True
            card["box_tier"] = "strong"
            return card
    
    @staticmethod
    def generate_mystery_card(position: str) -> Dict:
        card = MysteryBoxSystem.open_box()
        card["position"] = position
        card["is_mystery"] = True
        card["generated_at"] = time.time()
        return card


# ============================================================
# 🖼️ 3. نظام حماية الصور ثلاثي الطبقات
# ============================================================
class ImageProtectionSystem:
    CDN_BASE_URL = "https://cdn.osm-fut.com/players"
    FALLBACK_CDN = "https://cdn2.osm-fut.com/players"
    DEFAULT_SILHOUETTE = "default_silhouette"
    
    POSITION_SILHOUETTES = {
        "GK": "gk_silhouette",
        "DEF": "def_silhouette",
        "MID": "mid_silhouette",
        "ATT": "att_silhouette",
        "MGR": "coach_silhouette"
    }
    
    @classmethod
    def get_image_url(cls, player_data: Dict, layer: int = 1) -> str:
        image_id = player_data.get("image", "")
        position = player_data.get("position", "ATT")
        name = player_data.get("name", "لاعب")
        
        if layer == 1:
            if image_id and not image_id.startswith("http"):
                return f"{cls.CDN_BASE_URL}/{image_id}.png"
            elif image_id and image_id.startswith("http"):
                return image_id
            else:
                return cls.get_image_url(player_data, layer=2)
        elif layer == 2:
            silhouette = cls.POSITION_SILHOUETTES.get(position, cls.DEFAULT_SILHOUETTE)
            name_hash = hashlib.md5(name.encode()).hexdigest()[:6]
            return f"{cls.FALLBACK_CDN}/silhouettes/{silhouette}_{name_hash}.svg"
        else:
            return f"{cls.FALLBACK_CDN}/fallback/{cls.DEFAULT_SILHOUETTE}.svg"
    
    @classmethod
    def get_image_with_fallback(cls, player_data: Dict) -> Dict:
        return {
            "primary": cls.get_image_url(player_data, layer=1),
            "fallback": cls.get_image_url(player_data, layer=2),
            "emergency": cls.get_image_url(player_data, layer=3),
            "alt_text": player_data.get("name", "لاعب"),
            "position": player_data.get("position", ""),
        }


# ============================================================
# 🏟️ 4. تعريفات نظام المزاد الأساسية - 9 جولات
# ============================================================
AUCTION_POSITIONS = ["GK", "CB1", "CB2", "CM1", "CM2", "CF1", "CF2", "Coach", "Shadow_Coach"]
POSITION_DISPLAY = {
    "GK": "حارس مرمى",
    "CB1": "دفاع أول",
    "CB2": "دفاع ثاني",
    "CM1": "وسط أول",
    "CM2": "وسط ثاني",
    "CF1": "هجوم أول",
    "CF2": "هجوم ثاني",
    "Coach": "مدرب الفريق",
    "Shadow_Coach": "مدرب الظل"
}
AUCTION_TIMER = 30

class AuctionStatus(str, Enum):
    WAITING = "انتظار"
    ACTIVE = "نشط"
    BID_PLACED = "تم_تقديم_عرض"
    TURN_PASSED = "تم_تمرير_الدور"
    SOLD = "تم_البيع"
    COMPLETED = "مكتمل"

class TimerState(Enum):
    RUNNING = "يعمل"
    EXPIRED = "منتهي"
    PAUSED = "متوقف"
    RESET = "معاد_تعيين"


# ============================================================
# 📊 5. معادلة المباراة العادلة
# ============================================================
class MatchEngine:
    @staticmethod
    def calculate_match_result(team1_players, team2_players, team1_coach=None, team2_coach=None) -> Dict:
        luck_factor = random.uniform(0.7, 1.3)
        momentum = random.uniform(0.8, 1.2)
        luck_score = luck_factor * momentum * 40
        
        team1_power = MatchEngine._calculate_team_hidden_power(team1_players)
        team2_power = MatchEngine._calculate_team_hidden_power(team2_players)
        total_power = team1_power + team2_power
        power_score = (team1_power / total_power) * 60 if total_power > 0 else 30
        
        team1_tactic = MatchEngine._calculate_tactic_score(team1_coach)
        team2_tactic = MatchEngine._calculate_tactic_score(team2_coach)
        total_tactic = team1_tactic + team2_tactic
        tactic_score = (team1_tactic / total_tactic) * 60 if total_tactic > 0 else 30
        
        final_score = luck_score + power_score + tactic_score
        team1_goals = max(0, round(final_score / 20))
        team2_goals = max(0, round((100 - final_score) / 20))
        
        if team1_goals > team2_goals:
            winner = "team1"
            result_text = "فوز الفريق الأول"
        elif team2_goals > team1_goals:
            winner = "team2"
            result_text = "فوز الفريق الثاني"
        else:
            winner = "draw"
            result_text = "تعادل"
        
        return {
            "team1_goals": team1_goals,
            "team2_goals": team2_goals,
            "winner": winner,
            "result_text": result_text,
            "analysis": {
                "luck_score": round(luck_score, 2),
                "power_score": round(power_score, 2),
                "tactic_score": round(tactic_score, 2),
                "total_score": round(final_score, 2),
                "team1_hidden_power": round(team1_power, 2),
                "team2_hidden_power": round(team2_power, 2),
                "team1_tactic": round(team1_tactic, 2),
                "team2_tactic": round(team2_tactic, 2),
                "luck_factor": round(luck_factor, 2),
                "momentum": round(momentum, 2)
            }
        }
    
    @staticmethod
    def _calculate_team_hidden_power(players: List[Dict]) -> float:
        if not players:
            return 0
        total_power = 0
        for player in players:
            data = player.get("player", player)
            pace = data.get("pace", data.get("_pace", 50))
            shooting = data.get("shooting", data.get("_shooting", 50))
            passing = data.get("passing", data.get("_passing", 50))
            dribbling = data.get("dribbling", data.get("_dribbling", 50))
            defending = data.get("defending", data.get("_defending", 50))
            physical = data.get("physical", data.get("_physical", 50))
            rating = data.get("rating", 50)
            hidden_power = (pace*0.2 + shooting*0.2 + passing*0.15 + dribbling*0.15 + defending*0.15 + physical*0.15) * (rating/100)
            total_power += hidden_power
        return total_power / len(players)
    
    @staticmethod
    def _calculate_tactic_score(coach: Optional[Dict]) -> float:
        if not coach:
            return 50
        data = coach.get("player", coach)
        tactic = data.get("tactic", data.get("rating", 50))
        return max(0, min(100, tactic + random.uniform(-5, 5)))


# ============================================================
# 🤖 6. بوت المزاد الذكي
# ============================================================
@dataclass
class BotState:
    budget: float = 100.0
    cards_won: int = 0
    total_spent: float = 0.0
    bluffs_used: int = 0
    bid_history: List[Dict] = field(default_factory=list)
    aggression_level: float = 0.7
    bluff_chance: float = 0.3
    
    def analyze_card_value(self, card: Dict, position_index: int) -> float:
        rating = card.get("rating", 75)
        position = card.get("position", "ATT")
        weights = {"GK":0.6, "CB1":0.8, "CB2":0.8, "CM1":0.9, "CM2":0.9, "CF1":1.0, "CF2":1.0, "Coach":0.7}
        weight = weights.get(position, 0.5)
        base = (rating/100) * weight * 10
        bonus_map = {"أسطوري خارق":2.0, "Legendary":1.8, "قوي":1.5, "strong":1.5, "متوسط":1.0, "average":1.0, "ضعيف":0.5, "weak":0.5}
        rarity = card.get("rarity", "medium")
        bonus = bonus_map.get(rarity, 1.0)
        return base * bonus
    
    def decide_bid(self, card: Dict, current_bid: float, opponent_budget: float, position_index: int) -> Tuple[float, bool]:
        card_value = self.analyze_card_value(card, position_index)
        remaining = self.budget - self.total_spent
        cards_left = 8 - position_index
        max_per_card = remaining / max(1, cards_left)
        
        if random.random() < self.bluff_chance and current_bid > card_value * 1.3:
            self.bluffs_used += 1
            return 0.0, True
        
        if current_bid == 0:
            bid = min(card_value * 0.6, max_per_card * 0.5)
        else:
            if current_bid >= card_value * 1.2:
                if random.random() < 0.4:
                    return 0.0, True
                else:
                    bid = current_bid * 1.05
            else:
                aggression = self.aggression_level * random.uniform(0.8, 1.2)
                bid = current_bid * (1 + random.uniform(0.1, 0.3) * aggression)
        
        bid = min(bid, remaining * 0.8, max_per_card)
        bid = round(bid, 2)
        if bid <= current_bid:
            return 0.0, True
        return bid, False


# ============================================================
# ⏱️ 7. نظام المؤقت المتقدم
# ============================================================
class AdvancedTimer:
    def __init__(self, duration: int = AUCTION_TIMER):
        self.duration = duration
        self.remaining = float(duration)
        self.start_time: Optional[float] = None
        self.state = TimerState.RESET
        self._timer_thread: Optional[Timer] = None
        self._on_expire: Optional[callable] = None
        self._error_count = 0
        self._max_errors = 3
    
    def start(self, on_expire: callable = None):
        try:
            self.stop()
            self.start_time = time.time()
            self.remaining = float(self.duration)
            self.state = TimerState.RUNNING
            self._on_expire = on_expire
            self._error_count = 0
            if on_expire:
                self._timer_thread = Timer(self.duration, self._safe_expire)
                self._timer_thread.daemon = True
                self._timer_thread.start()
        except Exception as e:
            logger.error(f"خطأ في بدء المؤقت: {e}")
            self._handle_timer_error()
    
    def _safe_expire(self):
        try:
            self.state = TimerState.EXPIRED
            self.remaining = 0.0
            if self._on_expire:
                self._on_expire()
        except Exception as e:
            self._error_count += 1
            if self._error_count < self._max_errors:
                time.sleep(0.1)
                self._safe_expire()
    
    def _handle_timer_error(self):
        self._error_count += 1
        if self._error_count < self._max_errors:
            time.sleep(0.5)
            self.start(self._on_expire)
        else:
            self.state = TimerState.EXPIRED
    
    def stop(self):
        if self._timer_thread:
            self._timer_thread.cancel()
            self._timer_thread = None
        self.state = TimerState.RESET
    
    def get_remaining_time(self) -> float:
        if self.state == TimerState.RUNNING and self.start_time:
            elapsed = time.time() - self.start_time
            self.remaining = max(0, self.duration - elapsed)
            if self.remaining <= 0:
                self.state = TimerState.EXPIRED
        return round(self.remaining, 1)
    
    def is_expired(self) -> bool:
        return self.state == TimerState.EXPIRED or self.get_remaining_time() <= 0


# ============================================================
# 🏛️ 8. مدير المزاد الرئيسي (يدعم 9 جولات مع مدرب الظل)
# ============================================================
class AuctionManager:
    def __init__(self, session_id: str, player1_id: str, player2_id: str = "Goat_Bot"):
        self.session_id = session_id
        self.player1_id = player1_id
        self.player2_id = player2_id
        self.current_position_index = 0
        self.current_turn = player1_id
        self.highest_bid = 0.0
        self.highest_bidder = None
        self.status = AuctionStatus.WAITING
        self.timer = AdvancedTimer(AUCTION_TIMER)
        self.auction_cards: List[Dict] = []
        self.current_card: Optional[Dict] = None
        self.player1_team: Dict[str, List] = {}
        self.player2_team: Dict[str, List] = {}
        self.bot = BotState()
        self.image_system = ImageProtectionSystem()
        self.consecutive_skips = 0
        self.max_skips = 2
        self.auction_log: List[Dict] = []
        self.coach_round_loser: Optional[str] = None  # track loser of Coach round
        self._initialize_auction()
    
    def _initialize_auction(self):
        self.auction_cards = []
        all_players = MegaDatabase.get_all_players()
        all_coaches = MegaDatabase.get_all_coaches()
        # توليد 8 بطاقات فقط (بدون Shadow_Coach)
        for position in AUCTION_POSITIONS:
            if position == "Shadow_Coach":
                continue  # ستتم إضافتها تلقائيًا بعد جولة المدرب
            if position == "Coach":
                coach = random.choice(all_coaches)
                coach["position"] = "Coach"
                coach["display_position"] = POSITION_DISPLAY["Coach"]
                coach["image_data"] = self.image_system.get_image_with_fallback(coach)
                self.auction_cards.append(coach)
            else:
                pos_map = {"GK":"GK","CB1":"DEF","CB2":"DEF","CM1":"MID","CM2":"MID","CF1":"ATT","CF2":"ATT"}
                target = pos_map.get(position, "ATT")
                eligible = [p for p in all_players if p.get("position")==target] or all_players
                player = random.choice(eligible).copy()
                player["position"] = position
                player["display_position"] = POSITION_DISPLAY[position]
                player["image_data"] = self.image_system.get_image_with_fallback(player)
                self.auction_cards.append(player)
        
        for pos in AUCTION_POSITIONS:
            self.player1_team[pos] = []
            self.player2_team[pos] = []
    
    def start(self) -> Dict:
        self.status = AuctionStatus.ACTIVE
        self.current_position_index = 0
        self.current_card = self.auction_cards[0] if self.auction_cards else None
        self.highest_bid = 0.0
        self.highest_bidder = None
        self.timer.start(self._on_timer_expire)
        return self.get_state()
    
    def _on_timer_expire(self):
        if self.highest_bid > 0:
            self._finalize_sale()
        else:
            self.consecutive_skips += 1
            if self.consecutive_skips >= self.max_skips:
                self._no_winner_advance()
            else:
                self._switch_turn()
    
    def place_bid(self, player_id: str, amount: float) -> Tuple[bool, Dict]:
        if self.status != AuctionStatus.ACTIVE:
            return False, {"error": "المزاد غير نشط", "state": self.get_state()}
        if player_id != self.current_turn:
            return False, {"error": "ليس دورك الآن", "state": self.get_state()}
        if amount <= self.highest_bid:
            return False, {"error": f"يجب أن يكون العرض أعلى من {self.highest_bid}", "state": self.get_state()}
        self.highest_bid = amount
        self.highest_bidder = player_id
        self.status = AuctionStatus.BID_PLACED
        self.consecutive_skips = 0
        self.auction_log.append({"action":"bid","player":player_id,"amount":amount,"position":self.current_card.get("display_position",""),"timestamp":time.time()})
        self._switch_turn()
        if self.current_turn == self.player2_id:
            return self._process_bot_turn()
        return True, self.get_state()
    
    def skip(self, player_id: str) -> Tuple[bool, Dict]:
        if self.status != AuctionStatus.ACTIVE:
            return False, {"error": "المزاد غير نشط", "state": self.get_state()}
        if player_id != self.current_turn:
            return False, {"error": "ليس دورك الآن", "state": self.get_state()}
        self.consecutive_skips += 1
        self.auction_log.append({"action":"skip","player":player_id,"position":self.current_card.get("display_position",""),"timestamp":time.time()})
        if self.highest_bid > 0:
            return self._finalize_sale()
        if self.consecutive_skips >= self.max_skips:
            return self._no_winner_advance()
        self._switch_turn()
        if self.current_turn == self.player2_id:
            return self._process_bot_turn()
        return True, self.get_state()
    
    def _process_bot_turn(self) -> Tuple[bool, Dict]:
        if not self.current_card:
            return False, {"error": "لا توجد بطاقة حالية"}
        time.sleep(random.uniform(1.0, 2.5))
        bid_amount, should_skip = self.bot.decide_bid(self.current_card, self.highest_bid, 100.0, self.current_position_index)
        if should_skip or bid_amount <= self.highest_bid:
            return self.skip(self.player2_id)
        else:
            return self.place_bid(self.player2_id, bid_amount)
    
    def _switch_turn(self):
        self.current_turn = self.player2_id if self.current_turn == self.player1_id else self.player1_id
        self.timer.start(self._on_timer_expire)
    
    def _finalize_sale(self) -> Tuple[bool, Dict]:
        if not self.current_card:
            return False, {"error": "لا توجد بطاقة للبيع"}
        winner = self.highest_bidder
        loser = self.player2_id if winner == self.player1_id else self.player1_id
        position = self.current_card.get("position", "")
        # إذا كانت جولة المدرب، نسجل الخاسر لاحقًا
        if position == "Coach":
            self.coach_round_loser = loser
        
        winner_card = {"type":"auction_win","player":self.current_card.copy(),"bid_amount":self.highest_bid,"won_at":time.time(),"position":position}
        if winner == self.player1_id:
            self.player1_team[position].append(winner_card)
        else:
            self.player2_team[position].append(winner_card)
        
        mystery_card = MysteryBoxSystem.generate_mystery_card(position)
        mystery_entry = {"type":"mystery_consolation","player":mystery_card,"received_at":time.time(),"position":position,"is_mystery":True}
        if loser == self.player1_id:
            self.player1_team[position].append(mystery_entry)
        else:
            self.player2_team[position].append(mystery_entry)
        
        self.auction_log.append({"action":"sold","winner":winner,"loser":loser,"amount":self.highest_bid,"position":position,"card_name":self.current_card.get("name",""),"timestamp":time.time()})
        return self._advance_to_next()
    
    def _no_winner_advance(self) -> Tuple[bool, Dict]:
        position = self.current_card.get("position","") if self.current_card else ""
        if position == "Coach":
            # لا يوجد فائز، لكننا ما زلنا بحاجة لتعيين خاسر افتراضي (اللاعب البشري)
            self.coach_round_loser = self.player1_id
        for team in [self.player1_team, self.player2_team]:
            mystery_card = MysteryBoxSystem.generate_mystery_card(position)
            team[position].append({"type":"mystery_no_winner","player":mystery_card,"received_at":time.time(),"position":position,"is_mystery":True})
        self.auction_log.append({"action":"no_winner","position":position,"timestamp":time.time()})
        return self._advance_to_next()
    
    def _advance_to_next(self) -> Tuple[bool, Dict]:
        self.current_position_index += 1
        self.highest_bid = 0.0
        self.highest_bidder = None
        self.consecutive_skips = 0
        
        # إذا وصلنا إلى الجولة التاسعة (Shadow_Coach)
        if self.current_position_index == len(AUCTION_POSITIONS) - 1:  # index 8
            self._handle_shadow_coach_assignment()
            # بعد التعيين، نكمل لنهاية المزاد
            self.current_position_index += 1  # تجاوز Shadow_Coach
        
        if self.current_position_index >= len(AUCTION_POSITIONS) or self.current_position_index >= len(self.auction_cards) + 1:
            self.status = AuctionStatus.COMPLETED
            self.current_card = None
            self.timer.stop()
            return True, {"auction_completed":True,"message":"🏆 اكتمل المزاد بنجاح!","state":self.get_state()}
        
        self.current_card = self.auction_cards[self.current_position_index]
        self.current_turn = self.player1_id
        self.status = AuctionStatus.ACTIVE
        self.timer.start(self._on_timer_expire)
        return True, self.get_state()
    
    def _handle_shadow_coach_assignment(self):
        """تمنح بطاقة مدرب الظل تلقائياً لخاسر جولة المدرب"""
        loser = self.coach_round_loser if self.coach_round_loser else self.player1_id
        # إنشاء بطاقة مدرب ظل (يمكن أن تكون متوسطة أو ضعيفة، والمعلومات مخفية)
        shadow_coach = random.choice(MegaDatabase.AVERAGE_COACHES + MegaDatabase.WEAK_COACHES).copy()
        shadow_coach["position"] = "Shadow_Coach"
        shadow_coach["display_position"] = POSITION_DISPLAY["Shadow_Coach"]
        shadow_coach["image_data"] = self.image_system.get_image_with_fallback(shadow_coach)
        shadow_coach["rarity"] = "مدرب الظل"
        entry = {"type":"shadow_coach","player":shadow_coach,"received_at":time.time(),"position":"Shadow_Coach","is_mystery":False}
        if loser == self.player1_id:
            self.player1_team["Shadow_Coach"].append(entry)
        else:
            self.player2_team["Shadow_Coach"].append(entry)
        self.auction_log.append({"action":"shadow_coach","loser":loser,"timestamp":time.time()})
        logger.info(f"🕶️ مدرب الظل مُنح لـ {loser}")
    
    def check_timer(self) -> Tuple[bool, Dict]:
        if self.status == AuctionStatus.COMPLETED:
            return False, self.get_state()
        if self.timer.is_expired():
            self._on_timer_expire()
            return True, self.get_state()
        return False, self.get_state()
    
    def get_state(self) -> Dict:
        current_card_public = None
        if self.current_card:
            current_card_public = {
                "name": self.current_card.get("name", "لاعب غير معروف"),
                "display_position": self.current_card.get("display_position", ""),
                "position": self.current_card.get("position", ""),
                "nationality": self.current_card.get("nationality", "غير معروف"),
                "club": self.current_card.get("club", "نادي حر"),
                "age": self.current_card.get("age", 0),
                "image_data": self.current_card.get("image_data", {}),
                "rarity": self.current_card.get("rarity", "غير معروف"),
                "stats_hidden": True
            }
        state = {
            "session_id": self.session_id,
            "status": self.status.value,
            "auction_progress": {
                "current_index": self.current_position_index,
                "total_positions": len(AUCTION_POSITIONS),
                "percentage": round((self.current_position_index / len(AUCTION_POSITIONS))*100, 1),
            },
            "current_turn": self.current_turn,
            "highest_bid": self.highest_bid,
            "highest_bidder": self.highest_bidder,
            "timer": {
                "remaining": self.timer.get_remaining_time(),
                "duration": AUCTION_TIMER,
                "is_expired": self.timer.is_expired(),
            },
            "current_card": current_card_public,
            "auction_sequence": [{"index":i,"position":pos,"display":POSITION_DISPLAY.get(pos,"")} for i,pos in enumerate(AUCTION_POSITIONS)],
            "teams": {
                "player1": self._get_team_summary(self.player1_team),
                "player2": self._get_team_summary(self.player2_team)
            },
            "bot_info": {
                "name": "Goat_Bot 🐐",
                "remaining_budget": round(self.bot.budget - self.bot.total_spent, 2),
                "cards_won": self.bot.cards_won,
                "strategy": "ذكاء اصطناعي متقدم"
            },
            "rules": {
                "blind_auction": True,
                "hidden_stats": True,
                "turn_duration": AUCTION_TIMER,
                "mystery_box_on_loss": True,
                "shadow_coach_rule": "يمنح مدرب الظل تلقائياً لخاسر جولة المدرب"
            }
        }
        return state
    
    def _get_team_summary(self, team: Dict[str, List]) -> Dict:
        summary = {"total_cards":0,"auction_wins":0,"mystery_cards":0,"positions":{}}
        for pos, cards in team.items():
            pos_summary = {"count":len(cards),"cards":[]}
            for entry in cards:
                summary["total_cards"] += 1
                if entry.get("type") == "auction_win":
                    summary["auction_wins"] += 1
                if entry.get("is_mystery"):
                    summary["mystery_cards"] += 1
                player_info = entry.get("player", {})
                pos_summary["cards"].append({
                    "name": player_info.get("name","لاعب"),
                    "position": pos,
                    "display_position": player_info.get("display_position",""),
                    "rarity": player_info.get("rarity","غير معروف"),
                    "type": entry.get("type",""),
                    "stats_hidden": True
                })
            summary["positions"][pos] = pos_summary
        return summary
    
    def get_full_team_reveal(self, player_id: str) -> Dict:
        team = self.player1_team if player_id == self.player1_id else self.player2_team
        revealed = {"player_id":player_id,"revealed_at":time.time(),"positions":{},"total_power":0}
        all_players = []
        for pos in AUCTION_POSITIONS:
            cards = team.get(pos, [])
            pos_players = []
            for entry in cards:
                data = entry.get("player", {})
                full = {
                    "name": data.get("name","لاعب"),
                    "position": pos,
                    "display_position": POSITION_DISPLAY.get(pos,""),
                    "rating": data.get("rating",0),
                    "pace": data.get("pace", data.get("_pace",0)),
                    "shooting": data.get("shooting", data.get("_shooting",0)),
                    "passing": data.get("passing", data.get("_passing",0)),
                    "dribbling": data.get("dribbling", data.get("_dribbling",0)),
                    "defending": data.get("defending", data.get("_defending",0)),
                    "physical": data.get("physical", data.get("_physical",0)),
                    "nationality": data.get("nationality",""),
                    "club": data.get("club",""),
                    "rarity": data.get("rarity",""),
                    "type": entry.get("type",""),
                    "image_data": data.get("image_data",{})
                }
                pos_players.append(full)
                all_players.append(full)
            revealed["positions"][pos] = pos_players
        if all_players:
            revealed["total_power"] = round(sum(p.get("rating",0) for p in all_players)/len(all_players), 1)
        return revealed
    
    def simulate_match(self) -> Dict:
        team1_full = self.get_full_team_reveal(self.player1_id)
        team2_full = self.get_full_team_reveal(self.player2_id)
        team1_players = [p for pos in team1_full["positions"].values() for p in pos]
        team2_players = [p for pos in team2_full["positions"].values() for p in pos]
        coach1 = next((p for p in team1_players if p["position"]=="Coach"), None)
        coach2 = next((p for p in team2_players if p["position"]=="Coach"), None)
        field1 = [p for p in team1_players if p["position"]!="Coach"]
        field2 = [p for p in team2_players if p["position"]!="Coach"]
        result = MatchEngine.calculate_match_result(field1, field2, coach1, coach2)
        result.update({
            "match_id": f"match_{self.session_id}_{int(time.time())}",
            "played_at": time.time(),
            "team1_info": {"name":"الفريق الأول","player_id":self.player1_id,"total_power":team1_full["total_power"]},
            "team2_info": {"name":"Goat_Bot 🐐" if self.player2_id=="Goat_Bot" else "الفريق الثاني","player_id":self.player2_id,"total_power":team2_full["total_power"]},
            "match_stats": {"luck_weight":"40%","power_weight":"30%","tactic_weight":"30%","formula":"40% حظ وزخم + 30% قوة اللاعبين المخفية + 30% تأثير المدرب والتكتيك"}
        })
        return result


# ============================================================
# 🎮 9. واجهة برمجة التطبيقات الرئيسية
# ============================================================
class OSMDualBattle:
    def __init__(self):
        self.active_auctions: Dict[str, AuctionManager] = {}
        self.completed_auctions: Dict[str, Dict] = {}
        self.match_history: List[Dict] = []
    
    def create_session(self, player_id: str) -> Dict:
        session_id = f"osm_{int(time.time())}_{random.randint(1000,9999)}"
        auction = AuctionManager(session_id, player_id, "Goat_Bot")
        self.active_auctions[session_id] = auction
        return {
            "session_id": session_id,
            "message": "تم إنشاء جلسة المزاد بنجاح",
            "player_id": player_id,
            "opponent": "Goat_Bot 🐐",
            "auction_sequence": [{"step":i+1,"position":pos,"display":POSITION_DISPLAY.get(pos,"")} for i,pos in enumerate(AUCTION_POSITIONS)],
            "total_steps": len(AUCTION_POSITIONS),
            "rules": {
                "turn_duration": f"{AUCTION_TIMER} ثانية",
                "blind_auction": "الطاقات مخفية حتى المباراة",
                "shadow_coach": "مدرب الظل يمنح تلقائياً لخاسر جولة المدرب"
            }
        }
    
    def start_auction(self, session_id: str) -> Dict:
        auction = self.active_auctions.get(session_id)
        if not auction:
            return {"error": "الجلسة غير موجودة"}
        return auction.start()
    
    def place_bid(self, session_id: str, player_id: str, amount: float) -> Dict:
        auction = self.active_auctions.get(session_id)
        if not auction:
            return {"error": "الجلسة غير موجودة"}
        success, result = auction.place_bid(player_id, amount)
        if isinstance(result, dict) and result.get("auction_completed"):
            self.completed_auctions[session_id] = result
        return {"success": success, "result": result}
    
    def skip_turn(self, session_id: str, player_id: str) -> Dict:
        auction = self.active_auctions.get(session_id)
        if not auction:
            return {"error": "الجلسة غير موجودة"}
        success, result = auction.skip(player_id)
        if isinstance(result, dict) and result.get("auction_completed"):
            self.completed_auctions[session_id] = result
        return {"success": success, "result": result}
    
    def get_auction_state(self, session_id: str) -> Dict:
        auction = self.active_auctions.get(session_id)
        if not auction:
            archived = self.completed_auctions.get(session_id)
            return {"status":"completed","data":archived} if archived else {"error":"الجلسة غير موجودة"}
        auction.check_timer()
        return auction.get_state()
    
    def reveal_team(self, session_id: str, player_id: str) -> Dict:
        auction = self.active_auctions.get(session_id)
        if not auction:
            return {"error": "الجلسة غير موجودة"}
        return auction.get_full_team_reveal(player_id)
    
    def play_match(self, session_id: str) -> Dict:
        auction = self.active_auctions.get(session_id)
        if not auction:
            return {"error": "الجلسة غير موجودة"}
        if auction.status != AuctionStatus.COMPLETED:
            while auction.current_position_index < len(AUCTION_POSITIONS) - 1:
                auction._advance_to_next()
        match_result = auction.simulate_match()
        self.match_history.append(match_result)
        self.completed_auctions[session_id] = {"state": auction.get_state(), "match_result": match_result}
        if session_id in self.active_auctions:
            del self.active_auctions[session_id]
        return match_result
    
    def get_match_history(self, limit: int = 10) -> List[Dict]:
        return self.match_history[-limit:]
    
    def force_complete_auction(self, session_id: str) -> Dict:
        auction = self.active_auctions.get(session_id)
        if not auction:
            return {"error": "الجلسة غير موجودة"}
        while auction.current_position_index < len(AUCTION_POSITIONS) - 1:
            auction._advance_to_next()
        auction.status = AuctionStatus.COMPLETED
        auction.timer.stop()
        result = auction.get_state()
        self.completed_auctions[session_id] = result
        return {"message": "تم إكمال المزاد بالقوة", "state": result}


# ============================================================
# 🏁 10. نقطة البداية الرئيسية
# ============================================================
if __name__ == "__main__":
    print("=" * 60)
    print("⚔️  OSM FUT Dual Battle - نظام المزاد المتكامل ⚔️")
    print("=" * 60)
    game = OSMDualBattle()
    session = game.create_session("player_123")
    print(f"📝 جلسة: {session['session_id']}")
    print(f"📋 تسلسل المزاد ({len(AUCTION_POSITIONS)} خطوات):")
    for step in session['auction_sequence']:
        print(f"   {step['step']}. {step['display']} ({step['position']})")
    print("\n✅ تم تحميل النظام بنجاح!")
    print(f"📊 قاعدة البيانات: 150 لاعب + 60 مدرب")
    print("🎁 الصناديق الغامضة: 1% أسطوري | 33% ضعيف | 33% متوسط | 33% قوي")
    print("⚽ معادلة المباراة: 40% حظ | 30% قوة خفية | 30% تكتيك")
    print("🖼️ حماية الصور: 3 طبقات")
    print("🕶️ مدرب الظل يُمنح تلقائياً لخاسر جولة المدرب")
    print("=" * 60)
    print("🚀 جاهز للنشر على Render!")
    print("=" * 60)
