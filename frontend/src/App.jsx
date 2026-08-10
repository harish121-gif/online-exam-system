import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "/api";

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Registration
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] =
    useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Exam
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionSet, setQuestionSet] = useState("");
  const [attemptId, setAttemptId] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    const savedEmail = localStorage.getItem(
      "examsecure_remember_email"
    );

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // =========================================================
  // SESSION CHECK
  // =========================================================

  async function checkSession() {
    try {
      const response = await fetch(`${API_URL}/me`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);

        if (data.user.role === "student") {
          setPage("dashboard");
        }
      }
    } catch (error) {
      console.log("Session check:", error);
    }
  }

  // =========================================================
  // LOGIN
  // =========================================================

  async function handleLogin(event) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/student/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      console.log("LOGIN RESPONSE:", data);

      if (response.ok && data.success) {
        setUser(data.user);
        setPage("dashboard");

        setPassword("");
        setMessage("");

        if (rememberMe) {
          localStorage.setItem(
            "examsecure_remember_email",
            data.user.email
          );
        } else {
          localStorage.removeItem(
            "examsecure_remember_email"
          );
        }
      } else {
        setMessage(data.message || "Login failed.");
      }
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      setMessage("Cannot connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // REGISTRATION
  // =========================================================

  async function handleRegister(event) {
    event.preventDefault();

    setMessage("");

    if (registerPassword !== registerConfirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (registerPhone.length !== 10) {
      setMessage("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/student/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            name: registerName,
            email: registerEmail,
            phone: registerPhone,
            password: registerPassword,
          }),
        }
      );

      const data = await response.json();

      console.log("REGISTER RESPONSE:", data);

      if (response.ok && data.success) {
        setMessage(
          "Registration successful! You can now login."
        );

        setRegisterName("");
        setRegisterEmail("");
        setRegisterPhone("");
        setRegisterPassword("");
        setRegisterConfirmPassword("");

        setTimeout(() => {
          setMessage("");
          setPage("login");
        }, 1500);
      } else {
        setMessage(
          data.message || "Registration failed."
        );
      }
    } catch (error) {
      console.error("REGISTER ERROR:", error);
      setMessage("Cannot connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  async function logout() {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
    }

    setUser(null);
    setPage("login");
    setExam(null);
    setQuestions([]);
    setQuestionSet("");
    setAttemptId(null);
    setMessage("");
  }

  // =========================================================
  // START EXAM
  // =========================================================

  async function startExam() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/exam/1/start`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      console.log("START EXAM RESPONSE:", data);

      if (response.ok && data.success) {
        setExam(data.exam);
        setQuestions(data.questions);
        setQuestionSet(data.question_set);
        setAttemptId(data.attempt_id);

        setPage("exam");
      } else {
        setMessage(
          data.message ||
            "Unable to start examination."
        );
      }
    } catch (error) {
      console.error("START EXAM ERROR:", error);
      setMessage("Cannot connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOGIN PAGE
  // =========================================================

  if (page === "login") {
    return (
      <div className="login-shell">

        {/* LEFT SIDE */}

        <section className="login-showcase">

          <div className="showcase-overlay"></div>

          <div className="showcase-content">

            {/* BRAND */}

            <div className="brand">

              <div className="brand-mark">
                <span>🎓</span>
              </div>

              <div>
                <strong>
                  Exam<span>Secure</span>
                </strong>

                <small>
                  AI-Based Online Examination Monitoring
                </small>
              </div>

            </div>

            {/* HERO */}

            <div className="showcase-main">

              <div className="eyebrow">
                SMART EXAMINATION PLATFORM
              </div>

              <h1>
                Secure Exams.
                <br />
                Trusted <span>Integrity.</span>
                <br />
                Better Learning.
              </h1>

              <div className="showcase-line"></div>

              <p>
                Advanced AI monitoring helps create a fair,
                transparent and secure examination experience
                for every student.
              </p>

              {/* EXAM ILLUSTRATION */}

              <div className="exam-scene">

                <div className="scene-glow"></div>

                <div className="laptop">

                  <div className="laptop-screen">

                    <div className="screen-top">
                      ONLINE EXAM
                    </div>

                    <div className="screen-row wide"></div>

                    <div className="screen-row"></div>

                    <div className="screen-row"></div>

                    <div className="screen-button">
                      START
                    </div>

                  </div>

                  <div className="laptop-base"></div>

                </div>

                <div className="scene-book book-one"></div>

                <div className="scene-book book-two"></div>

                <div className="scene-plant">

                  <span></span>
                  <span></span>
                  <span></span>

                  <div></div>

                </div>

              </div>

            </div>

            {/* FEATURES */}

            <div className="feature-strip">

              <Feature
                icon="🛡️"
                title="Secure"
                text="Environment"
              />

              <Feature
                icon="🧠"
                title="AI-Powered"
                text="Monitoring"
              />

              <Feature
                icon="📊"
                title="Real-time"
                text="Analytics"
              />

              <Feature
                icon="🔒"
                title="Data"
                text="Privacy"
              />

            </div>

          </div>

        </section>

        {/* RIGHT SIDE */}

        <section className="login-panel">

          <div className="login-card">

            <div className="login-cap">
              <span>🎓</span>
            </div>

            <h2>
              Welcome Back!
            </h2>

            <p className="login-subtitle">
              Sign in to continue to your student portal
            </p>

            <form onSubmit={handleLogin}>

              {/* EMAIL */}

              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrap">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  id="email"
                  type="email"
                  placeholder="student1@exam.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
                />

              </div>

              {/* PASSWORD */}

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrap">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  autoComplete="current-password"
                />

              </div>

              {/* OPTIONS */}

              <div className="login-options">

                <label className="remember">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    Remember me
                  </span>

                </label>

                <button
                  type="button"
                  className="forgot-button"
                  onClick={() =>
                    setMessage(
                      "Please contact your institution to reset your password."
                    )
                  }
                >
                  Forgot password?
                </button>

              </div>

              {/* ERROR / SUCCESS */}

              {message && (
                <div className="error-message">
                  {message}
                </div>
              )}

              {/* LOGIN BUTTON */}

              <button
                className="login-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : "Student Login →"}
              </button>

            </form>

            {/* DIVIDER */}

            <div className="or-divider">

              <span></span>

              <b>OR</b>

              <span></span>

            </div>

            {/* REGISTER */}

            <button
              type="button"
              className="register-button"
              onClick={() => {
                setMessage("");
                setPage("register");
              }}
            >
              Create an Account
            </button>

            {/* NOTE */}

            <div className="credential-note">

              <div className="note-icon">
                ⓘ
              </div>

              <p>
                Use your registered student credentials
                provided by your institution.
              </p>

            </div>

            {/* PRIVACY */}

            <div className="privacy-note">

              <span>🛡️</span>

              Your privacy and security are our priority.

            </div>

          </div>

          <div className="copyright">
            © 2026 ExamSecure. All rights reserved.
          </div>

        </section>

      </div>
    );
  }

  // =========================================================
  // REGISTRATION PAGE
  // =========================================================

  if (page === "register") {
    return (
      <div className="login-shell">

        {/* LEFT SIDE */}

        <section className="login-showcase">

          <div className="showcase-overlay"></div>

          <div className="showcase-content">

            {/* BRAND */}

            <div className="brand">

              <div className="brand-mark">
                <span>🎓</span>
              </div>

              <div>
                <strong>
                  Exam<span>Secure</span>
                </strong>

                <small>
                  AI-Based Online Examination Monitoring
                </small>
              </div>

            </div>

            {/* HERO */}

            <div className="showcase-main">

              <div className="eyebrow">
                JOIN EXAMSECURE
              </div>

              <h1>
                Create Your
                <br />
                Student <span>Account.</span>
              </h1>

              <div className="showcase-line"></div>

              <p>
                Register securely and access your online
                examinations through our intelligent
                examination platform.
              </p>

              {/* EXAM ILLUSTRATION */}

              <div className="exam-scene">

                <div className="scene-glow"></div>

                <div className="laptop">

                  <div className="laptop-screen">

                    <div className="screen-top">
                      STUDENT PORTAL
                    </div>

                    <div className="screen-row wide"></div>

                    <div className="screen-row"></div>

                    <div className="screen-row"></div>

                    <div className="screen-button">
                      REGISTER
                    </div>

                  </div>

                  <div className="laptop-base"></div>

                </div>

                <div className="scene-book book-one"></div>

                <div className="scene-book book-two"></div>

                <div className="scene-plant">

                  <span></span>
                  <span></span>
                  <span></span>

                  <div></div>

                </div>

              </div>

            </div>

            {/* FEATURES */}

            <div className="feature-strip">

              <Feature
                icon="🛡️"
                title="Secure"
                text="Registration"
              />

              <Feature
                icon="🎓"
                title="Student"
                text="Portal"
              />

              <Feature
                icon="🧠"
                title="AI-Powered"
                text="Monitoring"
              />

              <Feature
                icon="🔒"
                title="Data"
                text="Privacy"
              />

            </div>

          </div>

        </section>

        {/* RIGHT SIDE */}

        <section className="login-panel">

          <div className="login-card register-card">

            <div className="login-cap">
              <span>🎓</span>
            </div>

            <h2>
              Create an Account
            </h2>

            <p className="login-subtitle">
              Register to access your student examination portal
            </p>

            <form onSubmit={handleRegister}>

              {/* NAME */}

              <label htmlFor="register-name">
                Full Name
              </label>

              <div className="input-wrap">

                <span className="input-icon">
                  👤
                </span>

                <input
                  id="register-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={registerName}
                  onChange={(e) =>
                    setRegisterName(e.target.value)
                  }
                  required
                  autoComplete="name"
                />

              </div>

              {/* EMAIL */}

              <label htmlFor="register-email">
                Email Address
              </label>

              <div className="input-wrap">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  id="register-email"
                  type="email"
                  placeholder="student@example.com"
                  value={registerEmail}
                  onChange={(e) =>
                    setRegisterEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
                />

              </div>

              {/* PHONE */}

              <label htmlFor="register-phone">
                Phone Number
              </label>

              <div className="input-wrap">

                <span className="input-icon">
                  📱
                </span>

                <input
                  id="register-phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={registerPhone}
                  onChange={(e) =>
                    setRegisterPhone(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  required
                  maxLength="10"
                  autoComplete="tel"
                />

              </div>

              {/* PASSWORD */}

              <label htmlFor="register-password">
                Password
              </label>

              <div className="input-wrap">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  id="register-password"
                  type="password"
                  placeholder="Create a password"
                  value={registerPassword}
                  onChange={(e) =>
                    setRegisterPassword(e.target.value)
                  }
                  required
                  minLength="6"
                  autoComplete="new-password"
                />

              </div>

              {/* CONFIRM PASSWORD */}

              <label htmlFor="register-confirm-password">
                Confirm Password
              </label>

              <div className="input-wrap">

                <span className="input-icon">
                  🔐
                </span>

                <input
                  id="register-confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={registerConfirmPassword}
                  onChange={(e) =>
                    setRegisterConfirmPassword(
                      e.target.value
                    )
                  }
                  required
                  minLength="6"
                  autoComplete="new-password"
                />

              </div>

              {/* MESSAGE */}

              {message && (
                <div className="error-message">
                  {message}
                </div>
              )}

              {/* REGISTER BUTTON */}

              <button
                className="login-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account →"}
              </button>

            </form>

            {/* DIVIDER */}

            <div className="or-divider">

              <span></span>

              <b>OR</b>

              <span></span>

            </div>

            {/* BACK TO LOGIN */}

            <button
              type="button"
              className="register-button"
              onClick={() => {
                setMessage("");
                setPage("login");
              }}
            >
              ← Back to Student Login
            </button>

            {/* PRIVACY */}

            <div className="privacy-note">

              <span>🛡️</span>

              Your privacy and security are our priority.

            </div>

          </div>

          <div className="copyright">
            © 2026 ExamSecure. All rights reserved.
          </div>

        </section>

      </div>
    );
  }

  // =========================================================
  // STUDENT DASHBOARD
  // =========================================================

  if (page === "dashboard") {
    return (
      <div className="portal-shell">

        <header className="portal-navbar">

          <div className="portal-brand">

            <div className="mini-brand-mark">
              🎓
            </div>

            <strong>
              Exam<span>Secure</span>
            </strong>

          </div>

          <div className="portal-user">

            <div className="user-avatar">
              👤
            </div>

            <span>
              {user?.name}
            </span>

            <button onClick={logout}>
              Logout
            </button>

          </div>

        </header>

        <main className="dashboard-main">

          <div className="portal-label">
            STUDENT PORTAL
          </div>

          <h1>
            Welcome back, {user?.name}! 👋
          </h1>

          <p className="dashboard-intro">
            Your examination is ready.
            Review the details before starting.
          </p>

          <div className="available-badge">

            <span></span>

            AVAILABLE

          </div>

          <section className="dashboard-card">

            <div className="exam-card-heading">

              <div>

                <h2>
                  Aptitude Test
                </h2>

                <p>
                  AI-Based Online Examination Monitoring
                  and Integrity System
                </p>

              </div>

              <div className="card-cap">
                🎓
              </div>

            </div>

            <div className="dashboard-stats">

              <Stat
                icon="📝"
                value="30"
                label="Questions"
              />

              <Stat
                icon="⏱️"
                value="30"
                label="Minutes"
              />

              <Stat
                icon="🎯"
                value="Auto"
                label="Question Set"
              />

              <Stat
                icon="📊"
                value="Mixed"
                label="Difficulty"
              />

            </div>

            <div className="before-start">

              <h3>
                Before you begin
              </h3>

              <div className="rules-grid">

                <p>
                  ✓ Stable internet connection
                </p>

                <p>
                  ✓ Do not switch browser tabs
                </p>

                <p>
                  ✓ Answer all questions
                </p>

                <p>
                  ✓ Timer starts immediately
                </p>

              </div>

            </div>

            {message && (
              <div className="error-message">
                {message}
              </div>
            )}

            <button
              className="start-button"
              onClick={startExam}
              disabled={loading}
            >
              {loading
                ? "Starting Examination..."
                : "Start Examination →"}
            </button>

          </section>

        </main>

      </div>
    );
  }

  // =========================================================
  // EXAM
  // =========================================================

  if (page === "exam") {
    return (
      <ExamPage
        user={user}
        exam={exam}
        questions={questions}
        questionSet={questionSet}
        attemptId={attemptId}
        logout={logout}
      />
    );
  }

  return null;
}

// =========================================================
// FEATURE COMPONENT
// =========================================================

function Feature({
  icon,
  title,
  text,
}) {
  return (
    <div className="feature-item">

      <div className="feature-icon">
        {icon}
      </div>

      <div>

        <strong>
          {title}
        </strong>

        <small>
          {text}
        </small>

      </div>

    </div>
  );
}

// =========================================================
// STAT COMPONENT
// =========================================================

function Stat({
  icon,
  value,
  label,
}) {
  return (
    <div className="stat-item">

      <span>
        {icon}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {label}
      </small>

    </div>
  );
}

// =========================================================
// EXAM PAGE
// =========================================================

function ExamPage({
  user,
  exam,
  questions,
  questionSet,
  attemptId,
  logout,
}) {
  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] =
    useState({});

  const [timeLeft, setTimeLeft] =
    useState(
      (exam?.duration_minutes || 30) * 60
    );

  // TIMER

  useEffect(() => {
    const timer = setInterval(() => {

      setTimeLeft((previous) => {

        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });

    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // TAB SWITCH DETECTION

  useEffect(() => {

    const handleVisibility = () => {

      if (document.hidden) {

        console.log(
          "Tab switch detected"
        );

      }

    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

    };

  }, []);

  // SELECT ANSWER

  function selectAnswer(option) {

    const question =
      questions[currentQuestion];

    setAnswers((previous) => ({

      ...previous,

      [question.id]: option,

    }));
  }

  // FORMAT TIMER

  function formatTime(seconds) {

    const minutes =
      Math.floor(seconds / 60);

    const secs =
      seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }

  const question =
    questions[currentQuestion];

  if (!question) {

    return (
      <div className="loading-screen">

        <div className="spinner"></div>

        <p>
          Loading questions...
        </p>

      </div>
    );
  }

  return (
    <div className="exam-shell">

      <header className="exam-navbar">

        <div className="portal-brand">

          <div className="mini-brand-mark">
            🎓
          </div>

          <strong>
            Exam<span>Secure</span>
          </strong>

        </div>

        <div className="exam-title-mini">

          <span>
            ONLINE EXAMINATION
          </span>

          <strong>
            {exam?.title}
          </strong>

        </div>

        <div className="exam-actions">

          <div className="exam-user">
            👤 {user?.name}
          </div>

          <div
            className={
              `exam-timer ${
                timeLeft < 300
                  ? "warning"
                  : ""
              }`
            }
          >
            ⏱ {formatTime(timeLeft)}
          </div>

          <button onClick={logout}>
            Logout
          </button>

        </div>

      </header>

      <main className="exam-main">

        <div className="exam-topline">

          <div>

            <span className="set-badge">
              Question Set {questionSet}
            </span>

            <h1>
              {exam?.title ||
                "Aptitude Test"}
            </h1>

          </div>

          <div className="answered-summary">

            <strong>
              {
                Object.keys(
                  answers
                ).length
              }
              /
              {
                questions.length
              }
            </strong>

            <span>
              Answered
            </span>

          </div>

        </div>

        <div className="progress-track">

          <div
            style={{
              width: `${
                (
                  Object.keys(
                    answers
                  ).length /
                  questions.length
                ) * 100
              }%`,
            }}
          />

        </div>

        <section className="question-card">

          <div className="question-number">

            Question{" "}
            {currentQuestion + 1}
            {" "}of{" "}
            {questions.length}

          </div>

          <h2>
            {question.question_text}
          </h2>

          <div className="options">

            {[
              ["A", question.option_a],
              ["B", question.option_b],
              ["C", question.option_c],
              ["D", question.option_d],
            ].map(
              ([letter, text]) => (

                <button
                  key={letter}
                  className={
                    answers[
                      question.id
                    ] === letter
                      ? "option selected"
                      : "option"
                  }
                  onClick={() =>
                    selectAnswer(
                      letter
                    )
                  }
                >

                  <span className="option-letter">
                    {letter}
                  </span>

                  <span>
                    {text}
                  </span>

                  {
                    answers[
                      question.id
                    ] === letter && (
                      <span className="selected-check">
                        ✓
                      </span>
                    )
                  }

                </button>

              )
            )}

          </div>

        </section>

        <div className="question-navigation">

          <button
            className="nav-button"
            disabled={
              currentQuestion === 0
            }
            onClick={() =>
              setCurrentQuestion(
                (q) => q - 1
              )
            }
          >
            ← Previous
          </button>

          <div className="question-dots">

            {questions.map(
              (item, index) => (

                <button
                  key={item.id}
                  className={
                    index ===
                    currentQuestion
                      ? "dot active"
                      : answers[
                          item.id
                        ]
                      ? "dot answered"
                      : "dot"
                  }
                  onClick={() =>
                    setCurrentQuestion(
                      index
                    )
                  }
                >
                  {index + 1}
                </button>

              )
            )}

          </div>

          <button
            className="nav-button"
            disabled={
              currentQuestion ===
              questions.length - 1
            }
            onClick={() =>
              setCurrentQuestion(
                (q) => q + 1
              )
            }
          >
            Next →
          </button>

        </div>

      </main>

    </div>
  );
}

export default App;