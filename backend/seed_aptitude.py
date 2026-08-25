from models.db import get_connection


EXAM_ID = 2

questions = [

    # =========================================================
    # SET A - 30 QUESTIONS
    # =========================================================

    ("A", "If a number is increased by 20% and becomes 360, what was the original number?",
     "280", "300", "320", "340", "B", "Quantitative Aptitude", "Easy"),

    ("A", "A train travels 240 km in 4 hours. What is its average speed?",
     "50 km/h", "60 km/h", "70 km/h", "80 km/h", "B", "Quantitative Aptitude", "Easy"),

    ("A", "What is 25% of 640?",
     "120", "140", "160", "180", "C", "Quantitative Aptitude", "Easy"),

    ("A", "The ratio of boys to girls in a class is 3:2. If there are 30 boys, how many girls are there?",
     "15", "20", "25", "30", "B", "Quantitative Aptitude", "Easy"),

    ("A", "A product costs ₹800 and is sold for ₹920. What is the profit percentage?",
     "10%", "12%", "15%", "20%", "C", "Quantitative Aptitude", "Easy"),

    ("A", "Find the simple interest on ₹5000 at 8% per annum for 2 years.",
     "₹600", "₹700", "₹800", "₹900", "C", "Quantitative Aptitude", "Easy"),

    ("A", "What is the average of 12, 18, 20, 25 and 30?",
     "19", "20", "21", "22", "C", "Quantitative Aptitude", "Easy"),

    ("A", "If 5 workers complete a task in 12 days, how many days will 10 workers take?",
     "4", "5", "6", "8", "C", "Quantitative Aptitude", "Easy"),

    ("A", "A shop offers a 10% discount on an item priced at ₹1500. What is the selling price?",
     "₹1250", "₹1300", "₹1350", "₹1400", "C", "Quantitative Aptitude", "Easy"),

    ("A", "What is the next number in the series: 2, 6, 12, 20, 30, ?",
     "40", "42", "44", "46", "B", "Logical Reasoning", "Medium"),

    ("A", "Find the odd one out: Apple, Mango, Banana, Carrot",
     "Apple", "Mango", "Banana", "Carrot", "D", "Logical Reasoning", "Easy"),

    ("A", "If CAT is coded as DBU, how is DOG coded?",
     "EPH", "EOH", "FPH", "EPG", "A", "Logical Reasoning", "Easy"),

    ("A", "Complete the analogy: Book : Reading :: Fork : ?",
     "Writing", "Eating", "Cooking", "Drawing", "B", "Logical Reasoning", "Easy"),

    ("A", "If all roses are flowers and some flowers fade quickly, which statement is definitely true?",
     "All roses fade quickly", "Some roses fade quickly", "All roses are flowers", "No roses fade", "C", "Logical Reasoning", "Medium"),

    ("A", "Find the missing number: 3, 9, 27, 81, ?",
     "162", "189", "243", "324", "C", "Logical Reasoning", "Easy"),

    ("A", "Ravi walks 10 metres north, then 10 metres east. In which direction is he from the starting point?",
     "North-West", "North-East", "South-East", "South-West", "B", "Logical Reasoning", "Easy"),

    ("A", "Choose the word closest in meaning to 'Rapid'.",
     "Slow", "Quick", "Weak", "Late", "B", "Verbal Ability", "Easy"),

    ("A", "Choose the opposite of 'Expand'.",
     "Increase", "Extend", "Contract", "Grow", "C", "Verbal Ability", "Easy"),

    ("A", "Identify the correctly spelled word.",
     "Accomodation", "Accommodation", "Acommodation", "Accommadation", "B", "Verbal Ability", "Easy"),

    ("A", "Choose the correct sentence.",
     "He don't like coffee.", "He doesn't likes coffee.", "He doesn't like coffee.", "He not like coffee.", "C", "Verbal Ability", "Easy"),

    ("A", "Fill in the blank: She has been working here _____ 2022.",
     "for", "since", "from", "by", "B", "Verbal Ability", "Easy"),

    ("A", "Choose the synonym of 'Abundant'.",
     "Rare", "Limited", "Plentiful", "Empty", "C", "Verbal Ability", "Easy"),

    ("A", "Choose the antonym of 'Ancient'.",
     "Old", "Modern", "Historic", "Traditional", "B", "Verbal Ability", "Easy"),

    ("A", "A man buys an article for ₹1200 and sells it for ₹1440. Find the profit.",
     "₹200", "₹220", "₹240", "₹260", "C", "Quantitative Aptitude", "Easy"),

    ("A", "What is the LCM of 12 and 18?",
     "24", "30", "36", "42", "C", "Quantitative Aptitude", "Easy"),

    ("A", "What is the HCF of 36 and 48?",
     "6", "8", "12", "16", "C", "Quantitative Aptitude", "Easy"),

    ("A", "A car covers 150 km at 50 km/h. How much time does it take?",
     "2 hours", "3 hours", "4 hours", "5 hours", "B", "Quantitative Aptitude", "Easy"),

    ("A", "If x + 15 = 40, find x.",
     "15", "20", "25", "30", "C", "Quantitative Aptitude", "Easy"),

    ("A", "Find the next term: 5, 10, 20, 40, ?",
     "60", "70", "80", "90", "C", "Logical Reasoning", "Easy"),

    ("A", "Which number does not belong? 2, 4, 8, 16, 31",
     "2", "8", "16", "31", "D", "Logical Reasoning", "Easy"),


    # =========================================================
    # SET B - 30 QUESTIONS
    # =========================================================

    ("B", "A salary of ₹25,000 is increased by 12%. What is the new salary?",
     "₹27,000", "₹28,000", "₹28,500", "₹29,000", "B", "Quantitative Aptitude", "Medium"),

    ("B", "A number is decreased by 15% from 800. What is the result?",
     "660", "680", "700", "720", "B", "Quantitative Aptitude", "Easy"),

    ("B", "The average of 8 numbers is 25. What is their total?",
     "150", "175", "200", "225", "C", "Quantitative Aptitude", "Easy"),

    ("B", "A can complete a job in 10 days and B in 15 days. How long will they take together?",
     "5 days", "6 days", "7 days", "8 days", "B", "Quantitative Aptitude", "Medium"),

    ("B", "A product marked ₹2000 is sold at a 15% discount. What is its selling price?",
     "₹1600", "₹1650", "₹1700", "₹1750", "C", "Quantitative Aptitude", "Easy"),

    ("B", "Find the compound interest on ₹1000 at 10% per annum for 2 years.",
     "₹200", "₹210", "₹220", "₹240", "B", "Quantitative Aptitude", "Medium"),

    ("B", "A boat travels 30 km downstream in 2 hours. What is its downstream speed?",
     "10 km/h", "12 km/h", "15 km/h", "20 km/h", "C", "Quantitative Aptitude", "Easy"),

    ("B", "If 3 pens cost ₹45, what is the cost of 8 pens?",
     "₹100", "₹110", "₹120", "₹135", "C", "Quantitative Aptitude", "Easy"),

    ("B", "What is 3/5 of 250?",
     "100", "125", "150", "175", "C", "Quantitative Aptitude", "Easy"),

    ("B", "Find the next number: 4, 8, 16, 32, ?",
     "48", "56", "64", "72", "C", "Logical Reasoning", "Easy"),

    ("B", "If PEN is coded as QFO, how is BOOK coded?",
     "CPPL", "CQQM", "CPPM", "BPPL", "A", "Logical Reasoning", "Medium"),

    ("B", "Find the odd one out: Square, Triangle, Circle, Rectangle",
     "Square", "Triangle", "Circle", "Rectangle", "C", "Logical Reasoning", "Easy"),

    ("B", "A is taller than B. B is taller than C. Who is the shortest?",
     "A", "B", "C", "Cannot determine", "C", "Logical Reasoning", "Easy"),

    ("B", "Complete the series: 1, 4, 9, 16, 25, ?",
     "30", "36", "42", "49", "B", "Logical Reasoning", "Easy"),

    ("B", "If today is Monday, what day will it be after 45 days?",
     "Tuesday", "Wednesday", "Thursday", "Friday", "C", "Logical Reasoning", "Medium"),

    ("B", "Which word cannot be formed using the letters of 'COMPUTER'?",
     "MUTE", "CORE", "TEAM", "PURE", "C", "Logical Reasoning", "Medium"),

    ("B", "Choose the synonym of 'Brief'.",
     "Long", "Short", "Large", "Wide", "B", "Verbal Ability", "Easy"),

    ("B", "Choose the antonym of 'Optimistic'.",
     "Positive", "Hopeful", "Pessimistic", "Confident", "C", "Verbal Ability", "Easy"),

    ("B", "Fill in the blank: Neither Ravi nor his friends _____ present.",
     "was", "were", "is", "has", "B", "Verbal Ability", "Medium"),

    ("B", "Identify the correctly spelled word.",
     "Necessary", "Neccessary", "Necesary", "Necessery", "A", "Verbal Ability", "Easy"),

    ("B", "Choose the correct meaning of 'Hit the nail on the head'.",
     "Make a mistake", "Say exactly the right thing", "Work slowly", "Avoid a problem", "B", "Verbal Ability", "Medium"),

    ("B", "Choose the synonym of 'Reliable'.",
     "Trustworthy", "Weak", "Uncertain", "Careless", "A", "Verbal Ability", "Easy"),

    ("B", "A shopkeeper gains 20% by selling an article for ₹600. Find its cost price.",
     "₹450", "₹500", "₹520", "₹550", "B", "Quantitative Aptitude", "Medium"),

    ("B", "What is the square root of 144?",
     "10", "11", "12", "14", "C", "Quantitative Aptitude", "Easy"),

    ("B", "If 40% of a number is 120, what is the number?",
     "240", "280", "300", "320", "C", "Quantitative Aptitude", "Easy"),

    ("B", "A person travels 60 km at 30 km/h and another 60 km at 60 km/h. What is the total time?",
     "2 hours", "3 hours", "4 hours", "5 hours", "B", "Quantitative Aptitude", "Medium"),

    ("B", "Find the missing number: 7, 14, 28, 56, ?",
     "84", "98", "112", "120", "C", "Logical Reasoning", "Easy"),

    ("B", "If SOUTH is written as HTUOS, how is NORTH written?",
     "HTRON", "HTRON", "NORTH", "HRTON", "A", "Logical Reasoning", "Easy"),

    ("B", "A clock shows 3:00. What is the angle between the hands?",
     "60°", "90°", "120°", "180°", "B", "Logical Reasoning", "Easy"),

    ("B", "Find the odd number: 11, 13, 17, 21, 23",
     "11", "17", "21", "23", "C", "Logical Reasoning", "Easy"),


    # =========================================================
    # SET C - 30 QUESTIONS
    # =========================================================

    ("C", "If 30% of a number is 90, what is the number?",
     "200", "250", "300", "350", "C", "Quantitative Aptitude", "Easy"),

    ("C", "A man spends 75% of his income. If his income is ₹40,000, how much does he save?",
     "₹8,000", "₹10,000", "₹12,000", "₹15,000", "B", "Quantitative Aptitude", "Easy"),

    ("C", "The ratio 45:60 is equal to:",
     "2:3", "3:4", "4:5", "5:6", "B", "Quantitative Aptitude", "Easy"),

    ("C", "What is 15% of ₹2400?",
     "₹300", "₹320", "₹360", "₹400", "C", "Quantitative Aptitude", "Easy"),

    ("C", "A train 120 metres long crosses a pole in 6 seconds. What is its speed?",
     "15 m/s", "20 m/s", "25 m/s", "30 m/s", "B", "Quantitative Aptitude", "Medium"),

    ("C", "If 12 men complete a task in 8 days, how many men are required to complete it in 6 days?",
     "14", "16", "18", "20", "B", "Quantitative Aptitude", "Medium"),

    ("C", "What is the perimeter of a square with side 12 cm?",
     "36 cm", "48 cm", "54 cm", "60 cm", "B", "Quantitative Aptitude", "Easy"),

    ("C", "What is the area of a rectangle with length 15 cm and width 8 cm?",
     "100 cm²", "110 cm²", "120 cm²", "130 cm²", "C", "Quantitative Aptitude", "Easy"),

    ("C", "If 5x = 45, what is x?",
     "5", "7", "9", "11", "C", "Quantitative Aptitude", "Easy"),

    ("C", "Find the next number: 1, 3, 6, 10, 15, ?",
     "18", "20", "21", "24", "C", "Logical Reasoning", "Medium"),

    ("C", "If A=1, B=2, C=3, what is the value of CAT?",
     "22", "24", "26", "28", "B", "Logical Reasoning", "Medium"),

    ("C", "Find the odd one out: January, March, May, June",
     "January", "March", "May", "June", "D", "Logical Reasoning", "Easy"),

    ("C", "Complete the analogy: Doctor : Hospital :: Teacher : ?",
     "Office", "School", "Bank", "Court", "B", "Logical Reasoning", "Easy"),

    ("C", "If 2 + 3 = 10, 3 + 4 = 21, then 4 + 5 = ?",
     "32", "36", "40", "45", "B", "Logical Reasoning", "Hard"),

    ("C", "A person faces east and turns left. Which direction is he facing?",
     "North", "South", "East", "West", "A", "Logical Reasoning", "Easy"),

    ("C", "Find the missing term: AZ, BY, CX, DW, ?",
     "EV", "EU", "FV", "EW", "A", "Logical Reasoning", "Medium"),

    ("C", "Choose the synonym of 'Accurate'.",
     "Correct", "Wrong", "Approximate", "Doubtful", "A", "Verbal Ability", "Easy"),

    ("C", "Choose the antonym of 'Generous'.",
     "Kind", "Helpful", "Stingy", "Friendly", "C", "Verbal Ability", "Easy"),

    ("C", "Fill in the blank: He is good _____ mathematics.",
     "in", "at", "on", "for", "B", "Verbal Ability", "Easy"),

    ("C", "Choose the correct sentence.",
     "She have completed the work.", "She has completed the work.", "She completed has the work.", "She having completed the work.", "B", "Verbal Ability", "Easy"),

    ("C", "Choose the synonym of 'Essential'.",
     "Optional", "Necessary", "Unwanted", "Extra", "B", "Verbal Ability", "Easy"),

    ("C", "Choose the antonym of 'Transparent'.",
     "Clear", "Visible", "Opaque", "Bright", "C", "Verbal Ability", "Easy"),

    ("C", "A product bought for ₹500 is sold for ₹450. Find the loss percentage.",
     "5%", "10%", "15%", "20%", "B", "Quantitative Aptitude", "Easy"),

    ("C", "What is the average of 20, 30 and 40?",
     "25", "30", "35", "40", "B", "Quantitative Aptitude", "Easy"),

    ("C", "What is 2/3 of 90?",
     "30", "45", "60", "75", "C", "Quantitative Aptitude", "Easy"),

    ("C", "A sum becomes ₹660 after adding 10% interest. Find the principal.",
     "₹500", "₹550", "₹600", "₹620", "C", "Quantitative Aptitude", "Medium"),

    ("C", "Find the next term: 10, 20, 40, 80, ?",
     "120", "140", "160", "180", "C", "Logical Reasoning", "Easy"),

    ("C", "Which number is different? 4, 9, 16, 25, 36, 50",
     "16", "25", "36", "50", "D", "Logical Reasoning", "Easy"),

    ("C", "If MONDAY is coded as 123456, what is the code for DAY?",
     "456", "345", "234", "156", "A", "Logical Reasoning", "Medium"),

    ("C", "A family has 2 parents and 3 children. How many people are there?",
     "4", "5", "6", "7", "B", "Logical Reasoning", "Easy"),


    # =========================================================
    # SET D - 30 QUESTIONS
    # =========================================================

    ("D", "A number is increased from 500 to 600. What is the percentage increase?",
     "10%", "15%", "20%", "25%", "C", "Quantitative Aptitude", "Easy"),

    ("D", "If 8 books cost ₹960, what is the cost of 5 books?",
     "₹500", "₹550", "₹600", "₹650", "C", "Quantitative Aptitude", "Easy"),

    ("D", "A man earns ₹30,000 and spends ₹24,000. What percentage of his income does he save?",
     "15%", "20%", "25%", "30%", "B", "Quantitative Aptitude", "Easy"),

    ("D", "What is the value of 18²?",
     "324", "342", "364", "384", "A", "Quantitative Aptitude", "Easy"),

    ("D", "If a:b = 4:5 and b:c = 10:7, find a:c.",
     "4:7", "8:7", "5:7", "8:5", "B", "Quantitative Aptitude", "Medium"),

    ("D", "A car travels 180 km in 3 hours. What is its speed?",
     "50 km/h", "60 km/h", "70 km/h", "80 km/h", "B", "Quantitative Aptitude", "Easy"),

    ("D", "What is the simple interest on ₹4000 at 5% for 3 years?",
     "₹500", "₹600", "₹700", "₹800", "B", "Quantitative Aptitude", "Easy"),

    ("D", "If 20 workers complete a job in 15 days, how many days will 30 workers take?",
     "8", "10", "12", "15", "B", "Quantitative Aptitude", "Medium"),

    ("D", "A shirt priced at ₹1000 is sold with a 20% discount. What is the selling price?",
     "₹700", "₹750", "₹800", "₹850", "C", "Quantitative Aptitude", "Easy"),

    ("D", "Find the next number: 2, 5, 10, 17, 26, ?",
     "35", "37", "39", "41", "B", "Logical Reasoning", "Medium"),

    ("D", "If APPLE is coded as BQQMF, how is MANGO coded?",
     "NBOHP", "NBOGO", "NBMHP", "OBOHP", "A", "Logical Reasoning", "Medium"),

    ("D", "Find the odd one out: Mercury, Venus, Earth, Moon",
     "Mercury", "Venus", "Earth", "Moon", "D", "Logical Reasoning", "Easy"),

    ("D", "Complete the series: 100, 90, 81, 73, ?",
     "66", "65", "64", "63", "A", "Logical Reasoning", "Hard"),

    ("D", "If yesterday was Friday, what day is tomorrow?",
     "Saturday", "Sunday", "Monday", "Tuesday", "B", "Logical Reasoning", "Easy"),

    ("D", "A is the brother of B. B is the sister of C. What is A to C?",
     "Brother", "Sister", "Father", "Uncle", "A", "Logical Reasoning", "Easy"),

    ("D", "Find the missing number: 8, 16, 32, 64, ?",
     "96", "112", "128", "144", "C", "Logical Reasoning", "Easy"),

    ("D", "Choose the synonym of 'Difficult'.",
     "Easy", "Hard", "Simple", "Clear", "B", "Verbal Ability", "Easy"),

    ("D", "Choose the antonym of 'Victory'.",
     "Success", "Win", "Defeat", "Achievement", "C", "Verbal Ability", "Easy"),

    ("D", "Fill in the blank: They _____ playing football.",
     "is", "are", "was", "be", "B", "Verbal Ability", "Easy"),

    ("D", "Choose the correctly spelled word.",
     "Environment", "Enviroment", "Envirnoment", "Enviornment", "A", "Verbal Ability", "Easy"),

    ("D", "Choose the synonym of 'Innovative'.",
     "Traditional", "Creative", "Old", "Ordinary", "B", "Verbal Ability", "Medium"),

    ("D", "Choose the antonym of 'Flexible'.",
     "Adjustable", "Adaptable", "Rigid", "Soft", "C", "Verbal Ability", "Easy"),

    ("D", "A shopkeeper buys an item for ₹750 and sells it for ₹900. Find the profit percentage.",
     "15%", "20%", "25%", "30%", "B", "Quantitative Aptitude", "Easy"),

    ("D", "What is 35% of 400?",
     "120", "130", "140", "150", "C", "Quantitative Aptitude", "Easy"),

    ("D", "The HCF of 24 and 36 is:",
     "6", "8", "12", "18", "C", "Quantitative Aptitude", "Easy"),

    ("D", "The LCM of 8 and 12 is:",
     "16", "20", "24", "32", "C", "Quantitative Aptitude", "Easy"),

    ("D", "If x - 18 = 32, find x.",
     "40", "45", "50", "55", "C", "Quantitative Aptitude", "Easy"),

    ("D", "Find the next number: 3, 6, 12, 24, ?",
     "36", "42", "48", "54", "C", "Logical Reasoning", "Easy"),

    ("D", "Which number is not a perfect square?",
     "16", "25", "36", "45", "D", "Logical Reasoning", "Easy"),

    ("D", "A clock shows 6:00. What is the angle between the hands?",
     "90°", "120°", "180°", "360°", "C", "Logical Reasoning", "Easy"),
]


def seed_questions():
    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            # -------------------------------------------------
            # Update exam details
            # -------------------------------------------------

            cursor.execute("""
                UPDATE exam
                SET
                    title = %s,
                    total_questions = %s,
                    duration_minutes = %s,
                    is_active = 1
                WHERE id = %s
            """, (
                "Aptitude Test",
                30,
                30,
                EXAM_ID
            ))

            # -------------------------------------------------
            # Delete old questions for this exam
            # -------------------------------------------------

            cursor.execute("""
                DELETE FROM question
                WHERE exam_id = %s
            """, (EXAM_ID,))

            # -------------------------------------------------
            # Insert new questions
            # -------------------------------------------------

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
                VALUES
                (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s
                )
            """

            for question in questions:

                (
                    question_set,
                    question_text,
                    option_a,
                    option_b,
                    option_c,
                    option_d,
                    correct_option,
                    category,
                    difficulty
                ) = question

                cursor.execute(
                    sql,
                    (
                        EXAM_ID,
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
                )

            connection.commit()

            print()
            print("=" * 60)
            print("APTITUDE QUESTION SEED COMPLETED")
            print("=" * 60)
            print(f"Total questions inserted : {len(questions)}")
            print("Exam ID                  : 2")
            print("Exam Title               : Aptitude Test")
            print("Questions per attempt   : 30")
            print("Duration                 : 30 minutes")
            print()

            for question_set in ["A", "B", "C", "D"]:
                cursor.execute("""
                    SELECT COUNT(*) AS count
                    FROM question
                    WHERE exam_id = %s
                      AND question_set = %s
                """, (
                    EXAM_ID,
                    question_set
                ))

                result = cursor.fetchone()

                print(
                    f"Set {question_set}: "
                    f"{result['count']} questions"
                )

            print("=" * 60)

    except Exception as error:

        connection.rollback()

        print()
        print("ERROR WHILE SEEDING QUESTIONS")
        print(error)

    finally:

        connection.close()


if __name__ == "__main__":
    seed_questions()