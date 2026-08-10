import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:5000";
const EXAM_ID = 1;
const QUESTION_SET = "A";

import { useEffect, useState } from "react";
import "./App.css";
const EXAM_ID = 1;
const QUESTION_SET = "A";

function App() {
  const [user, setUser] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [loading, setLoading] = useState(true);
  const [examLoading, setExamLoading] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  // =====================================================
  // CHECK SESSION
  // =====================================================

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        await loadExam();
      }
    } catch (error) {
      console.error("Session error:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD EXAM
  // =====================================================

  const loadExam = async () => {
    setExamLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setExam(data.exam);
      } else {
        setMessage(
          data.message || "Unable to load examination."
        );
      }
    } catch (error) {
      console.error("Exam error:", error);
      setMessage("Unable to connect to examination server.");
    } finally {
      setExamLoading(false);
    }
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async (event) => {
    event.preventDefault();

    setMessage("");

    try {
      const email = event.target.email.value;
      const password = event.target.password.value;

      const response = await fetch(
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        await loadExam();
      } else {
        setMessage(
          data.message || "Invalid email or password."
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Backend connection failed.");
    }
  };

  // =====================================================
  // START EXAM
  // =====================================================

  const startExam = async () => {
    setMessage("");
    setExamLoading(true);

    try {
      const response = await fetch(
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setQuestions(data.questions);
        setCurrentQuestion(0);
        setAnswers({});
        setResult(null);

        setTimeLeft(
          Number(data.exam.duration_minutes) * 60
        );

        setExamStarted(true);
      } else {
        setMessage(
          data.message || "Unable to load questions."
        );
      }
    } catch (error) {
      console.error("Question loading error:", error);
      setMessage("Unable to load examination questions.");
    } finally {
      setExamLoading(false);
    }
  };

  // =====================================================
  // TIMER
  // =====================================================

  useEffect(() => {
    if (!examStarted || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeLeft]);

  // Auto submit when timer reaches zero
  useEffect(() => {
    if (examStarted && timeLeft === 0) {
      submitExam();
    }
  }, [timeLeft, examStarted]);

  // =====================================================
  // FORMAT TIMER
  // =====================================================

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  // =====================================================
  // SELECT ANSWER
  // =====================================================

  const selectAnswer = (questionId, option) => {
    setAnswers((previous) => ({
      ...previous,
      [String(questionId)]: option,
    }));
  };

  // =====================================================
  // SUBMIT EXAM
  // =====================================================

  const submitExam = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            question_set: QUESTION_SET,
            answers,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.result);
        setExamStarted(false);
      } else {
        setMessage(
          data.message || "Unable to submit examination."
        );
      }
    } catch (error) {
      console.error("Submit error:", error);
      setMessage("Unable to submit examination.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = async () => {
    try {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    setUser(null);
    setExam(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setExamStarted(false);
    setCurrentQuestion(0);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="center-screen">
        <h1>🎓 ExamSecure</h1>
        <p>Checking your session...</p>
      </div>
    );
  }

  // =====================================================
  // LOGIN PAGE
  // =====================================================

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="logo-circle">🎓</div>

          <div className="secure-label">
            SECURE EXAMINATION PORTAL
          </div>

          <h1>Online Examination System</h1>

          <p className="login-subtitle">
            Sign in to access your examination dashboard
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">
                Student Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="student@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              className="primary-button"
              type="submit"
            >
              Sign In →
            </button>
          </form>

          {message && (
            <div className="message error">
              {message}
            </div>
          )}

          <div className="security">
            🔒 Protected Examination Environment
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RESULT PAGE
  // =====================================================

  if (result) {
    return (
      <div className="result-page-wrapper">
        <header className="navbar">
          <div>
            <h2>🎓 ExamSecure</h2>
            <span>Online Examination System</span>
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </header>

        <main className="result-page">
          <div className="result-card">
            <div className="result-icon">🎉</div>

            <h1>Examination Completed</h1>

            <p>
              Your examination has been submitted
              successfully.
            </p>

            <div className="score-circle">
              <strong>{result.percentage}%</strong>
              <span>Score</span>
            </div>

            <div className="result-grid">
              <div>
                <span>Total Questions</span>
                <strong>
                  {result.total_questions}
                </strong>
              </div>

              <div>
                <span>Answered</span>
                <strong>{result.answered}</strong>
              </div>

              <div>
                <span>Correct</span>
                <strong>{result.correct}</strong>
              </div>

              <div>
                <span>Wrong</span>
                <strong>{result.wrong}</strong>
              </div>

              <div>
                <span>Unanswered</span>
                <strong>{result.unanswered}</strong>
              </div>

              <div>
                <span>Score</span>
                <strong>{result.score}</strong>
              </div>
            </div>

            <button
              className="primary-button"
              onClick={logout}
            >
              Exit Examination
            </button>
          </div>
        </main>
      </div>
    );
  }

  // =====================================================
  // EXAM PAGE
  // =====================================================

  if (examStarted) {
    const question = questions[currentQuestion];

    if (!question) {
      return (
        <div className="center-screen">
          <h2>Loading questions...</h2>
        </div>
      );
    }

    const selectedAnswer =
      answers[String(question.id)];

    const answeredCount =
      Object.keys(answers).length;

    const progress =
      ((currentQuestion + 1) / questions.length) * 100;

    return (
      <div className="exam-page">
        <header className="exam-navbar">
          <div>
            <h2>🎓 ExamSecure</h2>
            <span>{exam?.title}</span>
          </div>

          <div className="timer">
            ⏱️ {formatTime()}
          </div>
        </header>

        <main className="exam-main">
          <div className="exam-top">
            <div>
              Question{" "}
              <strong>{currentQuestion + 1}</strong>{" "}
              of <strong>{questions.length}</strong>
            </div>

            <div>
              Answered:{" "}
              <strong>{answeredCount}</strong>/
              {questions.length}
            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="question-card">
            <div className="question-category">
              {question.category}
            </div>

            <h1>{question.question_text}</h1>

            <div className="options">
              {[
                ["A", question.option_a],
                ["B", question.option_b],
                ["C", question.option_c],
                ["D", question.option_d],
              ].map(([option, text]) => (
                <button
                  key={option}
                  type="button"
                  className={`option ${
                    selectedAnswer === option
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    selectAnswer(
                      question.id,
                      option
                    )
                  }
                >
                  <span className="option-letter">
                    {option}
                  </span>

                  <span>{text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="question-palette">
            <h3>Questions</h3>

            <div className="palette-grid">
              {questions.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`palette-button ${
                    index === currentQuestion
                      ? "current"
                      : ""
                  } ${
                    answers[String(item.id)]
                      ? "answered"
                      : ""
                  }`}
                  onClick={() =>
                    setCurrentQuestion(index)
                  }
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="exam-navigation">
            <button
              type="button"
              className="secondary-button"
              disabled={currentQuestion === 0}
              onClick={() =>
                setCurrentQuestion(
                  currentQuestion - 1
                )
              }
            >
              ← Previous
            </button>

            {currentQuestion <
            questions.length - 1 ? (
              <button
                type="button"
                className="primary-button next-button"
                onClick={() =>
                  setCurrentQuestion(
                    currentQuestion + 1
                  )
                }
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                className="submit-button"
                onClick={submitExam}
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Examination"}
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // =====================================================
  // STUDENT DASHBOARD
  // =====================================================

  return (
    <div className="dashboard-page">
      <header className="navbar">
        <div>
          <h2>🎓 ExamSecure</h2>
          <span>Online Examination System</span>
        </div>

        <div className="user-area">
          <div>
            <strong>{user.name}</strong>
            <small>Student</small>
          </div>

          <div className="avatar">
            {user.name?.charAt(0).toUpperCase()}
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard">
        <div className="welcome">
          <div>
            <span>STUDENT DASHBOARD</span>

            <h1>
              Welcome back, {user.name} 👋
            </h1>

            <p>
              Your examination is ready. Review the
              details before starting your test.
            </p>
          </div>

          <div className="ready">
            ● System Ready
          </div>
        </div>

        {examLoading ? (
          <div className="loading-card">
            Loading examination...
          </div>
        ) : exam ? (
          <section className="exam-card">
            <div className="exam-header">
              <div className="exam-icon">📝</div>

              <div>
                <span>AVAILABLE EXAM</span>

                <h2>{exam.title}</h2>

                <p>Exam ID: #{exam.id}</p>
              </div>

              <div className="active">
                ● Active
              </div>
            </div>

            <div className="details">
              <div>
                <span>📋</span>
                <small>Questions</small>
                <strong>
                  {exam.total_questions}
                </strong>
              </div>

              <div>
                <span>⏱️</span>
                <small>Duration</small>
                <strong>
                  {exam.duration_minutes} Minutes
                </strong>
              </div>

              <div>
                <span>🎯</span>
                <small>Exam Type</small>
                <strong>Aptitude Test</strong>
              </div>
            </div>

            <div className="instructions">
              <h3>Before you begin</h3>

              <ul>
                <li>
                  Make sure you have a stable internet
                  connection.
                </li>

                <li>
                  The examination duration is{" "}
                  <strong>
                    {exam.duration_minutes} minutes
                  </strong>.
                </li>

                <li>
                  There are{" "}
                  <strong>
                    {exam.total_questions} questions
                  </strong>.
                </li>

                <li>
                  Once you start, the examination timer
                  will begin.
                </li>

                <li>
                  Make sure you answer all questions
                  before submitting.
                </li>
              </ul>
            </div>

            <button
              className="start-button"
              onClick={startExam}
            >
              Start Examination →
            </button>
          </section>
        ) : (
          <div className="no-exam">
            <div>📭</div>

            <h2>No Examination Available</h2>

            <p>
              There is currently no active examination
              available.
            </p>

            <button
              className="secondary-button"
              onClick={loadExam}
            >
              Refresh
            </button>
          </div>
        )}

        {message && (
          <div className="message error">
            {message}
          </div>
        )}
      </main>

      <footer>
        © 2026 ExamSecure · Secure Examination
        Environment
      </footer>
    </div>
  );
}

export default App;
