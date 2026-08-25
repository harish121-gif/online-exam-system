from models.db import get_connection

questions = [
    # SET A
    ("A", "What is 25% of 200?", "25", "50", "75", "100", "B", "Quantitative Aptitude", "Easy"),
    ("A", "If 5x = 45, what is x?", "5", "7", "9", "11", "C", "Quantitative Aptitude", "Easy"),
    ("A", "A train travels 120 km in 2 hours. What is its speed?", "40 km/h", "50 km/h", "60 km/h", "80 km/h", "C", "Quantitative Aptitude", "Easy"),
    ("A", "What is the average of 10, 20 and 30?", "15", "20", "25", "30", "B", "Quantitative Aptitude", "Easy"),
    ("A", "If a shirt costs ?800 and is discounted by 10%, what is the selling price?", "?700", "?720", "?740", "?760", "B", "Quantitative Aptitude", "Easy"),
    ("A", "Find the next number: 2, 4, 8, 16, ?", "24", "28", "32", "36", "C", "Logical Reasoning", "Easy"),
    ("A", "If CAT is coded as DBU, how is DOG coded?", "EPH", "EOG", "FPH", "DPG", "A", "Logical Reasoning", "Easy"),
    ("A", "Choose the word closest in meaning to 'Rapid'.", "Slow", "Fast", "Weak", "Late", "B", "Verbal Ability", "Easy"),
    ("A", "Choose the opposite of 'Ancient'.", "Old", "Modern", "Historic", "Past", "B", "Verbal Ability", "Easy"),
    ("A", "A man buys an item for ?500 and sells it for ?600. What is his profit percentage?", "10%", "15%", "20%", "25%", "C", "Quantitative Aptitude", "Medium"),

    # SET B
    ("B", "What is 15% of 300?", "30", "45", "60", "75", "B", "Quantitative Aptitude", "Easy"),
    ("B", "If 7x = 56, what is x?", "6", "7", "8", "9", "C", "Quantitative Aptitude", "Easy"),
    ("B", "A car covers 180 km in 3 hours. What is its speed?", "50 km/h", "60 km/h", "70 km/h", "80 km/h", "B", "Quantitative Aptitude", "Easy"),
    ("B", "What is the average of 12, 18 and 24?", "16", "18", "20", "22", "B", "Quantitative Aptitude", "Easy"),
    ("B", "A product costing ?1000 is sold at a 20% discount. What is the selling price?", "?700", "?750", "?800", "?850", "C", "Quantitative Aptitude", "Easy"),
    ("B", "Find the next number: 3, 6, 12, 24, ?", "36", "42", "48", "54", "C", "Logical Reasoning", "Easy"),
    ("B", "If PEN is coded as QFO, how is BOX coded?", "CPY", "CQY", "BPY", "COX", "A", "Logical Reasoning", "Easy"),
    ("B", "Choose the synonym of 'Happy'.", "Sad", "Angry", "Joyful", "Weak", "C", "Verbal Ability", "Easy"),
    ("B", "Choose the opposite of 'Expand'.", "Increase", "Extend", "Contract", "Grow", "C", "Verbal Ability", "Easy"),
    ("B", "An item bought for ?400 is sold for ?500. Find the profit percentage.", "15%", "20%", "25%", "30%", "C", "Quantitative Aptitude", "Medium"),

    # SET C
    ("C", "What is 40% of 250?", "50", "75", "100", "125", "C", "Quantitative Aptitude", "Easy"),
    ("C", "If 9x = 81, what is x?", "7", "8", "9", "10", "C", "Quantitative Aptitude", "Easy"),
    ("C", "A bike travels 150 km in 3 hours. What is its speed?", "40 km/h", "50 km/h", "60 km/h", "70 km/h", "B", "Quantitative Aptitude", "Easy"),
    ("C", "What is the average of 15, 25 and 35?", "20", "25", "30", "35", "B", "Quantitative Aptitude", "Easy"),
    ("C", "An ?1200 item has a 25% discount. What is the selling price?", "?800", "?850", "?900", "?950", "C", "Quantitative Aptitude", "Easy"),
    ("C", "Find the next number: 5, 10, 20, 40, ?", "60", "70", "80", "90", "C", "Logical Reasoning", "Easy"),
    ("C", "If SUN is coded as TVO, how is MAP coded?", "NBQ", "MBQ", "NAP", "OBQ", "A", "Logical Reasoning", "Easy"),
    ("C", "Choose the synonym of 'Begin'.", "Start", "End", "Stop", "Finish", "A", "Verbal Ability", "Easy"),
    ("C", "Choose the opposite of 'Accept'.", "Receive", "Reject", "Allow", "Approve", "B", "Verbal Ability", "Easy"),
    ("C", "An item costs ?800 and is sold for ?960. Find the profit percentage.", "15%", "20%", "25%", "30%", "B", "Quantitative Aptitude", "Medium"),

    # SET D
    ("D", "What is 30% of 500?", "100", "125", "150", "175", "C", "Quantitative Aptitude", "Easy"),
    ("D", "If 6x = 72, what is x?", "10", "12", "14", "16", "B", "Quantitative Aptitude", "Easy"),
    ("D", "A bus travels 240 km in 4 hours. What is its speed?", "40 km/h", "50 km/h", "60 km/h", "80 km/h", "C", "Quantitative Aptitude", "Easy"),
    ("D", "What is the average of 20, 30 and 40?", "25", "30", "35", "40", "B", "Quantitative Aptitude", "Easy"),
    ("D", "An item costing ?1500 is discounted by 20%. What is the selling price?", "?1100", "?1200", "?1250", "?1300", "B", "Quantitative Aptitude", "Easy"),
    ("D", "Find the next number: 4, 8, 16, 32, ?", "48", "56", "64", "72", "C", "Logical Reasoning", "Easy"),
    ("D", "If BAD is coded as CBE, how is CAT coded?", "DBU", "CBU", "DCT", "EBU", "A", "Logical Reasoning", "Easy"),
    ("D", "Choose the synonym of 'Brave'.", "Cowardly", "Courageous", "Weak", "Foolish", "B", "Verbal Ability", "Easy"),
    ("D", "Choose the opposite of 'Victory'.", "Success", "Win", "Defeat", "Achievement", "C", "Verbal Ability", "Easy"),
    ("D", "An item bought for ?1000 is sold for ?1200. Find the profit percentage.", "10%", "15%", "20%", "25%", "C", "Quantitative Aptitude", "Medium"),
]

connection = get_connection()

try:
    with connection.cursor() as cursor:
        sql = """
            INSERT INTO question
            (
                exam_id,
                question_set,
                question_text,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_option,
                category,
                difficulty
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """

        for q in questions:
            cursor.execute(sql, (2, *q))

    connection.commit()
    print("40 new questions inserted successfully.")

finally:
    connection.close()
