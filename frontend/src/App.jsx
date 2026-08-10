import { useEffect, useState } from "react";
import "./App.css";
const API_URL = "https://examsecure-backend.onrender.com/api";

// =========================================================
// =========================================================


// =========================================================
// MAIN APP
// =========================================================

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

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    checkSession();
  }, []);

  // =========================================================
  // REMEMBER EMAIL
  // =========================================================

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

    console.log("SESSION RESPONSE:", data);

    if (response.ok && data.success) {
      setUser(data.user);

      if (data.user.role === "student") {
        setPage("dashboard");
      }
    }
  } catch (error) {
    console.error("SESSION CHECK ERROR:", error);
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
      const response = await fetch(
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

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
        setMessage(
          data.message || "Invalid email or password."
        );
      }
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setMessage(
        "Cannot connect to backend. Please check the server."
      );
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

    if (
      registerPassword !==
      registerConfirmPassword
    ) {
      setMessage("Passwords do not match.");
      return;
    }

    if (registerPhone.length !== 10) {
      setMessage(
        "Please enter a valid 10-digit phone number."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            name: registerName.trim(),
            email: registerEmail.trim(),
            phone: registerPhone,
            password: registerPassword,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "REGISTER RESPONSE:",
        data
      );

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
          data.message ||
            "Registration failed."
        );
      }
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error
      );

      setMessage(
        "Cannot connect to backend."
      );
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
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      console.log(
        "START EXAM RESPONSE:",
        data
      );

      if (response.ok && data.success) {
        setExam(data.exam);
        setQuestions(
          Array.isArray(data.questions)
            ? data.questions
            : []
        );

        setQuestionSet(
          data.question_set || ""
        );

        setAttemptId(
          data.attempt_id || null
        );

        setPage("exam");
      } else {
        setMessage(
          data.message ||
            "Unable to start examination."
        );
      }
    } catch (error) {
      console.error(
        "START EXAM ERROR:",
        error
      );

      setMessage(
        "Cannot connect to backend."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOGIN PAGE
  // =========================================================

  if (page === "login") {
    return (
      <div className="login-page">

        {/* LEFT SIDE */}

        <section className="login-showcase">

          <div className="showcase-overlay"></div>

          <div className="showcase-content">

            <div className="brand">

              <div className="brand-mark">
                <span>ðŸŽ“</span>
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
                Advanced AI monitoring helps create
                a fair, transparent and secure
                examination experience for every student.
              </p>

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

            <div className="feature-strip">

              <Feature
                icon="ðŸ›¡ï¸"
                title="Secure"
                text="Environment"
              />

              <Feature
                icon="ðŸ§ "
                title="AI-Powered"
                text="Monitoring"
              />

              <Feature
                icon="ðŸ“Š"
                title="Real-time"
                text="Analytics"
              />

              <Feature
                icon="ðŸ”’"
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
              <span>ðŸŽ“</span>
            </div>

            <h2>
              Welcome Back!
            </h2>

            <p className="login-subtitle">
              Sign in to continue to your student portal
            </p>

            <form onSubmit={handleLogin}>

              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrap">

                <span className="input-icon">
                  âœ‰
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

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrap">

                <span className="input-icon">
                  ðŸ”’
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

              {message && (
                <div className="error-message">
                  {message}
                </div>
              )}

              <button
                className="login-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : "Student Login â†’"}
              </button>

            </form>

            <div className="or-divider">

              <span></span>

              <b>OR</b>

              <span></span>

            </div>

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

            <div className="credential-note">

              <div className="note-icon">
                â“˜
              </div>

              <p>
                Use your registered student credentials
                provided by your institution.
              </p>

            </div>

            <div className="privacy-note">

              <span>ðŸ›¡ï¸</span>

              Your privacy and security are our priority.

            </div>

          </div>

          <div className="copyright">
            Â© 2026 ExamSecure. All rights reserved.
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
      <div className="login-page">

        {/* LEFT SIDE */}

        <section className="login-showcase">

          <div className="showcase-overlay"></div>

          <div className="showcase-content">

            <div className="brand">

              <div className="brand-mark">
                <span>ðŸŽ“</span>
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
                Register securely and access your
                online examinations through our
                intelligent examination platform.
              </p>

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

            <div className="feature-strip">

              <Feature
                icon="ðŸ›¡ï¸"
                title="Secure"
                text="Registration"
              />

              <Feature
                icon="ðŸŽ“"
                title="Student"
                text="Portal"
              />

              <Feature
                icon="ðŸ§ "
                title="AI-Powered"
                text="Monitoring"
              />

              <Feature
                icon="ðŸ”’"
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
              <span>ðŸŽ“</span>
            </div>

            <h2>
              Create an Account
            </h2>

            <p className="login-subtitle">
              Register to access your student examination portal
            </p>

            <form onSubmit={handleRegister}>

              <label htmlFor="register-name">
                Full Name
              </label>

              <div className="input-wrap">

                <span className="input-icon">
                  ðŸ‘¤
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

              <label htmlFor="register-email">
                Email Address
              </label>

              <div className="input-wrap">

                <span className="input-icon">
                  âœ‰
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

              <label htmlFor="register-phone">
                Phone Number
              </label>

              <div className="input-wrap">

                <span className="input-icon">
                  ðŸ“±
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
                  maxLength={10}
                  autoComplete="tel"
                />

              </div>

              <label htmlFor="register-password">
                Password
              </label>

              <div className="input-wrap">

                <span className="input-icon">
                  ðŸ”’
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
                  minLength={6}
                  autoComplete="new-password"
                />

              </div>

              <label htmlFor="register-confirm-password">
                Confirm Password
              </label>

              <div className="input-wrap">

                <span className="input-icon">
                  ðŸ”
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
                  minLength={6}
                  autoComplete="new-password"
                />

              </div>

              {message && (
                <div className="error-message">
                  {message}
                </div>
              )}

              <button
                className="login-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account â†’"}
              </button>

            </form>

            <div className="or-divider">

              <span></span>

              <b>OR</b>

              <span></span>

            </div>

            <button
              type="button"
              className="register-button"
              onClick={() => {
                setMessage("");
                setPage("login");
              }}
            >
              â† Back to Student Login
            </button>

            <div className="privacy-note">

              <span>ðŸ›¡ï¸</span>

              Your privacy and security are our priority.

            </div>

          </div>

          <div className="copyright">
            Â© 2026 ExamSecure. All rights reserved.
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
      <div className="portal-page">

        <header className="portal-navbar">

          <div className="portal-brand">

            <div className="mini-brand-mark">
              ðŸŽ“
            </div>

            <strong>
              Exam<span>Secure</span>
            </strong>

          </div>

          <div className="portal-user">

            <div className="user-avatar">
              ðŸ‘¤
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
            Welcome back, {user?.name}! ðŸ‘‹
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
                ðŸŽ“
              </div>

            </div>

            <div className="dashboard-stats">

              <Stat
                icon="ðŸ“"
                value={
                  questions.length > 0
                    ? questions.length
                    : "30"
                }
                label="Questions"
              />

              <Stat
                icon="â±ï¸"
                value="30"
                label="Minutes"
              />

              <Stat
                icon="ðŸŽ¯"
                value="Auto"
                label="Question Set"
              />

              <Stat
                icon="ðŸ“Š"
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
                  âœ“ Stable internet connection
                </p>

                <p>
                  âœ“ Do not switch browser tabs
                </p>

                <p>
                  âœ“ Answer all questions
                </p>

                <p>
                  âœ“ Timer starts immediately
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
                : "Start Examination â†’"}
            </button>

          </section>

        </main>

      </div>
    );
  }

  // =========================================================
  // EXAM PAGE
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
        onFinish={() => {
          setPage("dashboard");
          setExam(null);
          setQuestions([]);
          setQuestionSet("");
          setAttemptId(null);
        }}
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
// EXAM PAGE COMPONENT
// =========================================================

function ExamPage({
  user,
  exam,
  questions,
  questionSet,
  attemptId,
  logout,
  onFinish,
}) {
  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] =
    useState({});

  const [timeLeft, setTimeLeft] =
    useState(
      (Number(exam?.duration_minutes) || 30) * 60
    );

  const [submitting, setSubmitting] =
    useState(false);

  const [examMessage, setExamMessage] =
    useState("");

  const [tabSwitches, setTabSwitches] =
    useState(0);

  // =========================================================
  // TIMER
  // =========================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((previous) => {

        if (previous <= 1) {
          clearInterval(timer);

          handleSubmitExam(true);

          return 0;
        }

        return previous - 1;
      });

    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // =========================================================
  // TAB SWITCH DETECTION
  // =========================================================

  useEffect(() => {
    const handleVisibility = () => {

      if (document.hidden) {

        setTabSwitches(
          (previous) => previous + 1
        );

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

  // =========================================================
  // SELECT ANSWER
  // =========================================================

  function selectAnswer(option) {

    const question =
      questions[currentQuestion];

    if (!question) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [question.id]: option,
    }));
  }

  // =========================================================
  // FORMAT TIMER
  // =========================================================

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

  // =========================================================
  // SUBMIT EXAM
  // =========================================================

  async function handleSubmitExam(autoSubmit = false) {

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setExamMessage("");

    const answerList = Object.entries(
      answers
    ).map(
      ([questionId, selectedOption]) => ({
        question_id: Number(questionId),
        selected_option: selectedOption,
      })
    );

    const payload = {
      attempt_id: attemptId,
      answers: answerList,
      tab_switches: tabSwitches,
      time_remaining: timeLeft,
    };

    console.log(
      "SUBMIT EXAM PAYLOAD:",
      payload
    );

    try {

      /*
       * Your backend may use a different submit endpoint.
       *
       * We try the common Phase-1 endpoint first.
       */

      const response = await fetch(
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      console.log(
        "SUBMIT EXAM RESPONSE:",
        data
      );

      if (response.ok && data.success) {

        alert(
          autoSubmit
            ? "Time is over. Your examination has been submitted."
            : "Examination submitted successfully."
        );

        onFinish();

      } else {

        /*
         * If your backend doesn't currently have
         * /attempt/submit, don't destroy the user's
         * current answers.
         */

        setExamMessage(
          data.message ||
            "Unable to submit examination."
        );

        setSubmitting(false);
      }

    } catch (error) {

      console.error(
        "SUBMIT EXAM ERROR:",
        error
      );

      setExamMessage(
        "Cannot connect to backend while submitting."
      );

      setSubmitting(false);
    }
  }

  // =========================================================
  // EMPTY QUESTIONS
  // =========================================================

  if (!questions || questions.length === 0) {

    return (
      <div className="loading-screen">

        <div className="spinner"></div>

        <p>
          Loading questions...
        </p>

      </div>
    );
  }

  const question =
    questions[currentQuestion];

  const answeredCount =
    Object.keys(answers).length;

  const progress =
    questions.length > 0
      ? (answeredCount / questions.length) * 100
      : 0;

  // =========================================================
  // EXAM UI
  // =========================================================

  return (
    <div className="exam-page">

      <header className="exam-navbar">

        <div className="portal-brand">

          <div className="mini-brand-mark">
            ðŸŽ“
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
            {exam?.title || "Aptitude Test"}
          </strong>

        </div>

        <div className="exam-actions">

          <div className="exam-user">
            ðŸ‘¤ {user?.name}
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
            â± {formatTime(timeLeft)}
          </div>

          <button
            onClick={() => {
              const confirmLogout =
                window.confirm(
                  "Are you sure you want to logout? Your current examination may be lost."
                );

              if (confirmLogout) {
                logout();
              }
            }}
          >
            Logout
          </button>

        </div>

      </header>

      <main className="exam-main">

        <div className="exam-topline">

          <div>

            <span className="set-badge">
              Question Set {questionSet || "A"}
            </span>

            <h1>
              {exam?.title ||
                "Aptitude Test"}
            </h1>

          </div>

          <div className="answered-summary">

            <strong>
              {answeredCount}/{questions.length}
            </strong>

            <span>
              Answered
            </span>

          </div>

        </div>

        <div className="progress-track">

          <div
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

        {tabSwitches > 0 && (
          <div className="monitoring-warning">

            âš ï¸ Tab switches detected:
            {" "}
            <strong>
              {tabSwitches}
            </strong>

          </div>
        )}

        {examMessage && (
          <div className="error-message">
            {examMessage}
          </div>
        )}

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
                  type="button"
                  className={
                    answers[question.id] ===
                    letter
                      ? "option selected"
                      : "option"
                  }
                  onClick={() =>
                    selectAnswer(letter)
                  }
                  disabled={submitting}
                >

                  <span className="option-letter">
                    {letter}
                  </span>

                  <span>
                    {text}
                  </span>

                  {answers[
                    question.id
                  ] === letter && (
                    <span className="selected-check">
                      âœ“
                    </span>
                  )}

                </button>

              )
            )}

          </div>

        </section>

        <div className="question-navigation">

          <button
            type="button"
            className="nav-button"
            disabled={
              currentQuestion === 0 ||
              submitting
            }
            onClick={() =>
              setCurrentQuestion(
                (q) => q - 1
              )
            }
          >
            â† Previous
          </button>

          <div className="question-dots">

            {questions.map(
              (item, index) => (

                <button
                  type="button"
                  key={item.id}
                  className={
                    index ===
                    currentQuestion
                      ? "dot active"
                      : answers[item.id]
                      ? "dot answered"
                      : "dot"
                  }
                  onClick={() =>
                    setCurrentQuestion(
                      index
                    )
                  }
                  disabled={submitting}
                >
                  {index + 1}
                </button>

              )
            )}

          </div>

          {currentQuestion <
          questions.length - 1 ? (

            <button
              type="button"
              className="nav-button"
              disabled={submitting}
              onClick={() =>
                setCurrentQuestion(
                  (q) => q + 1
                )
              }
            >
              Next â†’
            </button>

          ) : (

            <button
              type="button"
              className="submit-button"
              disabled={submitting}
              onClick={() => {

                const confirmSubmit =
                  window.confirm(
                    `You answered ${answeredCount} out of ${questions.length} questions. Submit examination?`
                  );

                if (confirmSubmit) {
                  handleSubmitExam(false);
                }

              }}
            >
              {submitting
                ? "Submitting..."
                : "Submit Examination âœ“"}
            </button>

          )}

        </div>

      </main>

    </div>
  );
}

export default App;



