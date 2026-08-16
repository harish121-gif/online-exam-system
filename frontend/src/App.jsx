import { useEffect, useState } from "react";
import {
  ShieldCheck, Mail, LockKeyhole, UserRound, Phone,
  Info, CheckCircle2, ClipboardCheck, Clock3, Shuffle,
  BarChart3, LogOut, ArrowLeft, ArrowRight, Play,
  Timer, AlertTriangle, CircleCheck, MonitorCheck,
  FileCheck2, GraduationCap, Wifi, EyeOff
} from "lucide-react";
import "./App.css";
const API_URL = "/api";
const EXAM_ID = import.meta.env.VITE_EXAM_ID || "2";

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
  const [result, setResult] = useState(null);

  // Examination state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [examMessage, setExamMessage] = useState("");

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
  // EXAM TIMER
  // =========================================================

  useEffect(() => {
    if (page !== "exam") {
      return;
    }

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
  }, [page]);

  // =========================================================
  // TAB SWITCH DETECTION
  // =========================================================

  useEffect(() => {
    if (page !== "exam") {
      return;
    }

    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitches((previous) => previous + 1);
        console.log("Tab switch detected");
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
  }, [page]);

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
      const response = await fetch(`${API_URL}/student/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
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
      const response = await fetch(`${API_URL}/student/register`, {
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
      const response = await fetch(`${API_URL}/exam/${EXAM_ID}/start`, { method: "POST", credentials: "include" });

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
                <span>ES</span>
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
                icon={<ShieldCheck size={17} strokeWidth={2.4} />}
                title="Secure"
                text="Environment"
              />

              <Feature
                icon={<MonitorCheck size={17} strokeWidth={2.4} />}
                title="AI-Powered"
                text="Monitoring"
              />

              <Feature
                icon={<BarChart3 size={17} strokeWidth={2.4} />}
                title="Real-time"
                text="Analytics"
              />

              <Feature
                icon={<ShieldCheck size={17} strokeWidth={2.4} />}
                title="Data"
                text="Privacy"
              />

            </div>

          </div>

        </section>

        {/* RIGHT SIDE */}

        <section className="login-panel">

          <div className="login-card">

            <div className="login-cap"><ShieldCheck size={26} strokeWidth={2.2} /></div>

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

                <span className="input-icon"><Mail size={17} /></span>

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

                <span className="input-icon"><LockKeyhole size={17} /></span>

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
                  : "Student Login"}
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

              <div className="note-icon"><Info size={17} /></div>

              <p>
                Use your registered student credentials
                provided by your institution.
              </p>

            </div>

            <div className="privacy-note">

              <ShieldCheck size={15} />

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
      <div className="login-page">

        {/* LEFT SIDE */}

        <section className="login-showcase">

          <div className="showcase-overlay"></div>

          <div className="showcase-content">

            <div className="brand">

              <div className="brand-mark">
                <span>ES</span>
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
                icon={<ShieldCheck size={17} strokeWidth={2.4} />}
                title="Secure"
                text="Registration"
              />

              <Feature
                icon={<GraduationCap size={17} strokeWidth={2.3} />}
                title="Student"
                text="Portal"
              />

              <Feature
                icon={<MonitorCheck size={17} strokeWidth={2.4} />}
                title="AI-Powered"
                text="Monitoring"
              />

              <Feature
                icon={<ShieldCheck size={17} strokeWidth={2.4} />}
                title="Data"
                text="Privacy"
              />

            </div>

          </div>

        </section>

        {/* RIGHT SIDE */}

        <section className="login-panel">

          <div className="login-card register-card">

            <div className="login-cap"><ShieldCheck size={26} strokeWidth={2.2} /></div>

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

                <span className="input-icon"><UserRound size={17} /></span>

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

                <span className="input-icon"><Mail size={17} /></span>

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

                <span className="input-icon"><Phone size={17} /></span>

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

                <span className="input-icon"><LockKeyhole size={17} /></span>

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

                <span className="input-icon"><LockKeyhole size={17} /></span>

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
                  : "Create Account"}
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
              Back to Student Login
            </button>

            <div className="privacy-note">

              <ShieldCheck size={15} />

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
      <div className="portal-page">

        <header className="portal-navbar">

          <div className="portal-brand">

            <div className="mini-brand-mark"><ShieldCheck size={20} strokeWidth={2.2} /></div>

            <strong>
              Exam<span>Secure</span>
            </strong>

          </div>

          <div className="portal-user">

            <div className="user-avatar"><UserRound size={18} /></div>

            <span>
              {user?.name}
            </span>

            <button className="portal-logout" onClick={logout}>
              <LogOut size={15} />
              Logout
            </button>

          </div>

        </header>

        <main className="dashboard-main">

          <div className="portal-label">
            STUDENT PORTAL
          </div>

          <h1>
            Welcome back, {user?.name}! 
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

              <div className="card-cap"><ClipboardCheck size={25} strokeWidth={2.1} /></div>

            </div>

            <div className="dashboard-stats">

              <Stat
                icon={<ClipboardCheck size={18} strokeWidth={2.3} />}
                value={
                  questions.length > 0
                    ? questions.length
                    : "20"
                }
                label="Questions"
              />

              <Stat
                icon={<Clock3 size={18} strokeWidth={2.3} />}
                value="30"
                label="Minutes"
              />

              <Stat
                icon={<Shuffle size={18} strokeWidth={2.3} />}
                value="Auto"
                label="Question Set"
              />

              <Stat
                icon={<BarChart3 size={17} strokeWidth={2.4} />}
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
                  <><Wifi size={15} /> Stable internet connection</>
                </p>

                <p>
                  <><EyeOff size={15} /> Do not switch browser tabs</>
                </p>

                <p>
                  <><CheckCircle2 size={15} /> Answer all questions</>
                </p>

                <p>
                  <><Timer size={15} /> Timer starts immediately</>
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
                : <>Start Examination <Play size={16} fill="currentColor" /></>}
            </button>

          </section>

        </main>

      </div>
    );
  }

  // =========================================================
  // EXAM PAGE
  // ===========================================================================================================

  // =========================================================

  // =========================================================
  // =========================================================
  // RESULT PAGE
  // =========================================================

  if (page === "result" && result) {
    const percentage = Number(result.percentage || 0);
    const score = Number(result.score || 0);
    const total = Number(result.total_questions || 0);

    let performance = "Needs Improvement";

    if (percentage >= 80) {
      performance = "Excellent Performance";
    } else if (percentage >= 60) {
      performance = "Good Performance";
    } else if (percentage >= 40) {
      performance = "Average Performance";
    }

    return (
      <div className="app result-page">

        {/* HEADER */}
        <header className="top-header result-header">

          <div className="brand">
            <span className="brand-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l8 4v5c0 4.5-3.4 7.9-8 9-4.6-1.1-8-4.5-8-9V7l8-4z"/><path d="M9 12l2 2 4-4"/></svg></span>
            <strong>ExamSecure</strong>
          </div>

          <div className="header-user">
            <span className="user-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3.5"/><path d="M5 21c.8-4 3.1-6 7-6s6.2 2 7 6"/></svg></span>
            {user?.name}
          </div>

          <button
            className="logout-button"
            onClick={() => setPage("dashboard")}
          >
            Logout
          </button>

        </header>

        {/* RESULT CONTENT */}
        <main className="result-main">

          <div className="result-container">

            {/* PAGE TITLE */}
            <div className="result-title-section">

              <div className="result-label">
                EXAMINATION RESULT
              </div>

              <h1>
                Your Examination is Complete
              </h1>

              <p>
                Here is a summary of your examination performance.
              </p>

            </div>

            {/* HERO RESULT CARD */}
            <section className="result-hero-card">

              <div className="result-hero-left">

                <div className="success-icon"><CircleCheck size={30} strokeWidth={2.2} /></div>

                <div>
                  <div className="completed-badge">
                    EXAM COMPLETED
                  </div>

                  <h2>
                    {result.exam_title}
                  </h2>

                  <p>
                    Well done, {result.student_name}!
                    Your examination has been successfully submitted.
                  </p>
                </div>

              </div>

              <div className="question-set-badge">
                <span>QUESTION SET</span>
                <strong>{result.question_set}</strong>
              </div>

            </section>

            {/* SCORE AREA */}
            <section className="score-dashboard">

              <div className="score-card main-score-card">

                <div className="score-circle">

                  <svg
                    className="score-ring"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      className="score-ring-bg"
                      cx="60"
                      cy="60"
                      r="50"
                    />

                    <circle
                      className="score-ring-progress"
                      cx="60"
                      cy="60"
                      r="50"
                      style={{
                        strokeDashoffset:
                          314 - (314 * percentage) / 100
                      }}
                    />
                  </svg>

                  <div className="score-circle-content">
                    <strong>{percentage}%</strong>
                    <span>Score</span>
                  </div>

                </div>

                <div className="score-main-text">

                  <span className="score-small-label">
                    YOUR SCORE
                  </span>

                  <h2>
                    {score}
                    <span> / {total}</span>
                  </h2>

                  <div className="performance-badge">
                    {performance}
                  </div>

                </div>

              </div>

              <div className="score-card">

                <div className="score-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg></div>

                <span className="score-card-label">
                  TOTAL QUESTIONS
                </span>

                <strong>
                  {total}
                </strong>

                <p>
                  Questions attempted
                </p>

              </div>

              <div className="score-card">

                <div className="score-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg></div>

                <span className="score-card-label">
                  PERCENTAGE
                </span>

                <strong>
                  {percentage}%
                </strong>

                <p>
                  Overall performance
                </p>

              </div>

            </section>

            {/* DETAILS */}
            <section className="result-details-grid">

              <div className="result-info-card">

                <div className="info-card-heading">
                  <span className="info-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3"/><path d="M5 21c.7-3.8 3-5.7 7-5.7s6.3 1.9 7 5.7"/></svg></span>

                  <div>
                    <h3>Student Details</h3>
                    <p>Candidate information</p>
                  </div>
                </div>

                <div className="info-row">
                  <span>Student Name</span>
                  <strong>{result.student_name}</strong>
                </div>

                <div className="info-row">
                  <span>Email</span>
                  <strong>{result.student_email}</strong>
                </div>

              </div>

              <div className="result-info-card">

                <div className="info-card-heading">
                  <span className="info-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3"/><path d="M5 21c.7-3.8 3-5.7 7-5.7s6.3 1.9 7 5.7"/></svg></span>

                  <div>
                    <h3>Examination Details</h3>
                    <p>Assessment information</p>
                  </div>
                </div>

                <div className="info-row">
                  <span>Exam</span>
                  <strong>{result.exam_title}</strong>
                </div>

                <div className="info-row">
                  <span>Question Set</span>
                  <strong>{result.question_set}</strong>
                </div>

                <div className="info-row">
                  <span>Status</span>
                  <strong className="status-success">
                    <CircleCheck size={15} /> {result.status}
                  </strong>
                </div>

              </div>

            </section>

            {/* BOTTOM ACTION */}
            <div className="result-action">

              <button
                className="result-back-button"
                onClick={() => setPage("dashboard")}
              >
                Back to Student Portal
              </button>

              <p>
                Your examination result has been recorded successfully.
              </p>

            </div>

          </div>

        </main>

      </div>
    );
  }
  
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

    const answerList = answers;

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

      const response = await fetch(`${API_URL}/exam/${exam.id}/submit`, {
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

        setResult(data.result || data);
        setPage("result");

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
            ES
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

          <div className="exam-user"><UserRound size={15} /> {user?.name}</div>

          <div
            className={
              `exam-timer ${
                timeLeft < 300
                  ? "warning"
                  : ""
              }`
            }
          >
            <Timer size={15} /> {formatTime(timeLeft)}
          </div>

          <button
            className="exam-logout"
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
            <LogOut size={15} />
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

            <AlertTriangle size={16} /> Tab switches detected:
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
                    <span className="selected-check" aria-label="Selected">
                      <CircleCheck size={18} />
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
            Previous
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
              Next
              <ArrowRight size={16} />
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
                : <>Submit Examination <FileCheck2 size={16} /></>}
            </button>

          )}

        </div>

      </main>

    </div>
  );
}

export default App;



























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
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-content">
        <div className="stat-value">
          {value}
        </div>

        <div className="stat-label">
          {label}
        </div>
      </div>
    </div>
  );
}









