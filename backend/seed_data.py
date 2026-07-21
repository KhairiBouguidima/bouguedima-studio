from datetime import datetime, timedelta

from db import db_cursor

LEADS = [
    dict(name='ياسمين حداد', initials='يح', project='جدار مميّز في الصالة', area='24 م²',
         style='فينيسي · ماربورينو', status='Lead', hours_ago=2, photos=3, location='وسط سطيف',
         budget='—', msg='مرحبًا! جدّدنا الصالة للتوّ ونريد جصًّا مصقولًا دافئًا على الجدار الرئيسي خلف الأريكة. الجدار مُحضَّر حديثًا. نأمل بدرجةٍ رمليةٍ ناعمة.'),
    dict(name='كريم بلقاسم', initials='كب', project='مقهى — تجهيز كامل', area='120 م²',
         style='ميكروسمنت', status='Quoted', hours_ago=24, photos=6, location='العلمة',
         budget='320,000 دج', msg='بصدد افتتاح مقهى مختصّ. أحتاج ميكروسمنت بلا فواصل على الجدران وواجهة الكاونتر، بطابعٍ صناعيٍّ دافئ.'),
    dict(name='شركة نور', initials='شن', project='واجهة فيلا خارجية', area='210 م²',
         style='تلبيس بملمس', status='In Progress', hours_ago=72, photos=8, location='عين أرنات',
         budget='540,000 دج', msg='فيلا من طابقين، أحتاج واجهة خارجية متينة بملمس مع كرانيش حول النوافذ.'),
    dict(name='لينا منصوري', initials='لم', project='وردة سقف وكرنيش لغرفة النوم', area='18 م²',
         style='جبس زخرفي', status='Lead', hours_ago=5, photos=2, location='وسط سطيف',
         budget='—', msg='أبحث عن وردة سقف كلاسيكية وكرنيش لغرفة النوم الرئيسية. أرفقت صورتين مرجعيتين.'),
    dict(name='فندق سيرتا', initials='فس', project='بهو — جدران تادلاكت', area='85 م²',
         style='تادلاكت', status='Completed', hours_ago=336, photos=5, location='قسنطينة',
         budget='410,000 دج', msg='تحديث بهو فندق بوتيك، تشطيب تادلاكت مقاوم للماء بدرجةٍ طينيةٍ غامقة.'),
]

PROJECTS = [
    dict(id='p1', title='سقف قاعة اجتماعات', cat='داخلي', sub='عصري', loc='سطيف', img='assets/gallery-1.jpg'),
    dict(id='p2', title='رواق بإضاءة مخفية', cat='داخلي', sub='كلاسيكي', loc='العلمة', img='assets/gallery-2.jpg'),
    dict(id='p3', title='غرفة نوم — سقف هندسي', cat='داخلي', sub='عصري', loc='عين أرنات', img='assets/gallery-3.jpg'),
    dict(id='p4', title='صالون بإضاءة مربّعة', cat='داخلي', sub='كلاسيكي', loc='سطيف', img='assets/gallery-4.jpg'),
    dict(id='p5', title='سقف خطي بعارضة خشب', cat='داخلي', sub='عصري', loc='قسنطينة', img='assets/gallery-5.jpg'),
    dict(id='p6', title='إطار مضيء — قيد الإنجاز', cat='داخلي', sub='عصري', loc='سطيف', img='assets/gallery-6.jpg'),
    dict(id='p7', title='غرفة بإضاءة خطية', cat='داخلي', sub='عصري', loc='باتنة', img='assets/gallery-7.jpg'),
    dict(id='p8', title='سقف بنجفة معلّقة', cat='داخلي', sub='كلاسيكي', loc='سطيف', img='assets/gallery-8.jpg'),
    dict(id='p9', title='صالة — سقف متدرّج', cat='داخلي', sub='عصري', loc='العلمة', img='assets/gallery-9.jpg'),
    dict(id='p10', title='مدخل واسع بنجفة', cat='داخلي', sub='كلاسيكي', loc='سطيف', img='assets/gallery-10.jpg'),
]


SERVICES = [
    dict(n='01', t='الجصّ الفينيسي', d='ماربورينو و ستوكو فينيزيانو بالجير، مصقول حتى يولّي يلمع كيف الرخام.', tag='داخلي · مصقول'),
    dict(n='02', t='ميكروسمنت', d='أسطح عصرية بلا خطوط للحيطان و الأرضية و البلايص و الحمّامات.', tag='داخلي · بلا فواصل'),
    dict(n='03', t='كرانيش وزخارف', d='كرانيش و ورود سقف و زخارف مصبوبين باليد من الجبس الفاخر.', tag='كلاسيكي · زخرفة'),
    dict(n='04', t='ملامس الجدران', d='نقوش بارزة و ترافرتين و تشطيبات فيهم عمق تحسّ بيه بيدك.', tag='عصري · ملمس'),
    dict(n='05', t='الواجهات الخارجية', d='واجهات تقاوم الطقس، بطابع مميّز و متانة تدوم بالسنين.', tag='خارجي · تلبيس'),
    dict(n='06', t='تادلاكت', d='جبس الجير المغربي اللي ما يخافش من الماء، مصقول للحمّامات و البلايص الرطبة.', tag='داخلي · جير'),
]


CATEGORIES = [
    {'name': 'ماربورينو', 'desc': 'تشطيب رخامي فاخر باليد', 'price': 4500},
    {'name': 'ميكروسمنت', 'desc': 'سطح حديث و متواصل', 'price': 6500},
    {'name': 'تادلاكت', 'desc': 'جبس مغربي أصيل', 'price': 5000},
    {'name': 'كرانيش', 'desc': 'قوالب مصبوبة باليد', 'price': 2500},
    {'name': 'جبس فيني', 'desc': 'تشطيب ناعم و أنيق', 'price': 3000},
    {'name': 'واجهة', 'desc': 'تشطيب خارجي متين', 'price': 3500},
]


def seed_if_empty():
    with db_cursor() as cur:
        cur.execute("SELECT COUNT(*) AS c FROM leads")
        if cur.fetchone()["c"] == 0:
            now = datetime.utcnow()
            for lead in LEADS:
                created_at = (now - timedelta(hours=lead["hours_ago"])).isoformat(timespec="seconds")
                cur.execute(
                    """INSERT INTO leads
                       (name, initials, project, area, style, status, created_at, photos, location, budget, msg, email, phone)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, '', '')""",
                    (lead["name"], lead["initials"], lead["project"], lead["area"], lead["style"],
                     lead["status"], created_at, lead["photos"], lead["location"], lead["budget"], lead["msg"]),
                )

        cur.execute("SELECT COUNT(*) AS c FROM projects")
        if cur.fetchone()["c"] == 0:
            for p in PROJECTS:
                cur.execute(
                    "INSERT INTO projects (id, title, cat, sub, loc, img, live) VALUES (%s, %s, %s, %s, %s, %s, 1)",
                    (p["id"], p["title"], p["cat"], p["sub"], p["loc"], p["img"]),
                )

        cur.execute("SELECT COUNT(*) AS c FROM services")
        if cur.fetchone()["c"] == 0:
            for i, sv in enumerate(SERVICES):
                cur.execute(
                    "INSERT INTO services (n, t, d, tag, sort_order) VALUES (%s, %s, %s, %s, %s)",
                    (sv["n"], sv["t"], sv["d"], sv["tag"], i),
                )

        cur.execute("SELECT COUNT(*) AS c FROM categories")
        if cur.fetchone()["c"] == 0:
            for i, cat in enumerate(CATEGORIES):
                cur.execute(
                    "INSERT INTO categories (name, desc, price_per_meter, sort_order) VALUES (%s, %s, %s, %s)",
                    (cat['name'], cat['desc'], cat['price'], i),
                )
