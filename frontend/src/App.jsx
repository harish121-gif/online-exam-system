import { useEffect, useState } from "react";
import {
  ShieldCheck, Mail, LockKeyhole, UserRound, Phone,
  Info, CheckCircle2, ClipboardCheck, Clock3, Shuffle,
  BarChart3, LogOut, ArrowLeft, ArrowRight, Play,
  Timer, AlertTriangle, CircleCheck, MonitorCheck,
  FileCheck2, GraduationCap, Wifi, EyeOff
} from "lucide-react";
import "./App.css";
const getApiUrl = () => {
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "/api";
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (
    envUrl &&
    envUrl.trim() !== "" &&
    envUrl.trim() !== "/api"
  ) {
    return envUrl.trim();
  }
  return "https://online-exam-system-gzy3.onrender.com/api";
};

const API_URL = getApiUrl();
const EXAM_ID = import.meta.env.VITE_EXAM_ID || "2";

const getAuthHeaders = (currentUser) => {
  let stored = currentUser;
  if (!stored) {
    try {
      stored = JSON.parse(localStorage.getItem("examsecure_user") || "null");
    } catch {
      stored = null;
    }
  }
  if (stored && stored.id) {
    return {
      "X-User-Id": String(stored.id),
      "X-User-Role": String(stored.role || "student"),
      "X-User-Name": String(stored.name || ""),
      "X-User-Email": String(stored.email || "")
    };
  }
  return {};
};

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

  // Admin Login
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Registration
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] =
    useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Admin Dashboard
  const [adminStats, setAdminStats] = useState({
    total_students: 0,
    total_exams: 0,
    active_exams: 0,
    total_attempts: 0,
    total_violations: 0,
  });

  // Admin Management
  const [adminStudents, setAdminStudents] = useState([]);
  const [adminExams, setAdminExams] = useState([]);
  const [adminAttempts, setAdminAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [adminFormLoading, setAdminFormLoading] = useState(false);

  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [examForm, setExamForm] = useState({
    title: "",
    total_questions: 30,
    duration_minutes: 30,
    is_active: 1,
  });

  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingExamId, setEditingExamId] = useState(null);

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
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [pasteAttempts, setPasteAttempts] = useState(0);
  const [warningModal, setWarningModal] = useState(null);
  const [isTerminating, setIsTerminating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [examMessage, setExamMessage] = useState("");

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    checkSession();
  }, []);

  // Load admin dashboard statistics
  useEffect(() => {
    if (page !== "admin-dashboard") {
      return;
    }

    loadAdminDashboard();
  }, [page]);

  // Load student exam details
  useEffect(() => {
    if (page !== "dashboard") {
      return;
    }

    loadStudentExamDetails();
  }, [page]);

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
  // MALPRACTICE MONITORING & TERMINATION SYSTEM
  // =========================================================

  const triggerExamTermination = async (reasonText) => {
    if (isTerminating) return;
    setIsTerminating(true);
    setSubmitting(true);
    setWarningModal(null);

    console.warn("[PROCTORING TERMINATION] Terminating examination:", reasonText);

    try {
      if (attemptId) {
        await fetch(`${API_URL}/attempt/${attemptId}/terminate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(user)
          },
          credentials: "include",
          body: JSON.stringify({ reason: reasonText })
        });
      }
    } catch (err) {
      console.error("Terminate API call error:", err);
    }

    setResult({
      status: "terminated",
      is_malpractice: true,
      result_generated: false,
      malpractice_reason: reasonText,
      score: 0,
      percentage: 0,
      total_questions: questions.length || 30,
      tab_switch_count: tabSwitches + 1,
      copy_paste_count: copyAttempts + pasteAttempts,
      student_name: user?.name || "Student",
      student_email: user?.email || "",
      exam_title: exam?.title || "Aptitude Test",
      question_set: questionSet || "A"
    });

    setPage("result");
    setSubmitting(false);
    setIsTerminating(false);
  };

  const handleMalpracticeViolation = async (type, detail) => {
    if (page !== "exam" || submitting || isTerminating) return;

    let nextTab = tabSwitches;
    let nextCopy = copyAttempts;
    let nextPaste = pasteAttempts;

    if (type === "tab_switch") {
      nextTab = tabSwitches + 1;
      setTabSwitches(nextTab);
    } else if (type === "copy") {
      nextCopy = copyAttempts + 1;
      setCopyAttempts(nextCopy);
    } else if (type === "paste") {
      nextPaste = pasteAttempts + 1;
      setPasteAttempts(nextPaste);
    }

    const totalViolations = nextTab + nextCopy + nextPaste;

    console.warn(`[MALPRACTICE ALERT] Type: ${type} | Detail: ${detail} | Total: ${totalViolations}`);

    if (attemptId) {
      const endpoint = type === "tab_switch" ? "tab-switch" : "copy-paste";
      fetch(`${API_URL}/attempt/${attemptId}/${endpoint}`, {
        method: "POST",
        headers: { ...getAuthHeaders(user) },
        credentials: "include"
      }).catch(err => console.error("Violation log error:", err));
    }

    const isDirectViolation = type === "shortcut" || type === "cut" || type === "copy" || type === "paste";

    if (totalViolations >= 3 || isDirectViolation) {
      const finalReason = isDirectViolation
        ? `Malpractice Detected: Unauthorized ${detail}`
        : `Malpractice Limit Reached: Exceeded maximum allowed warnings (${totalViolations} violations logged - ${detail})`;

      await triggerExamTermination(finalReason);
    } else {
      setWarningModal({
        title: type === "tab_switch" ? "⚠️ Tab Switch Warning!" : "⚠️ Proctoring Security Alert!",
        detail: detail,
        count: totalViolations,
        max: 3
      });
    }
  };

  // Tab switch listener
  useEffect(() => {
    if (page !== "exam") return;

    const handleVisibility = () => {
      if (document.hidden) {
        handleMalpracticeViolation("tab_switch", "Navigated away from examination tab");
      }
    };

    const handleWindowBlur = () => {
      handleMalpracticeViolation("tab_switch", "Window lost focus / application switch");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [page, attemptId, tabSwitches, copyAttempts, pasteAttempts, user, submitting, isTerminating]);

  // Copy / Paste & Shortcut Prevention
  useEffect(() => {
    if (page !== "exam") return;

    const handleCopy = (event) => {
      event.preventDefault();
      handleMalpracticeViolation("copy", "Attempted to copy exam content");
    };

    const handlePaste = (event) => {
      event.preventDefault();
      handleMalpracticeViolation("paste", "Attempted to paste text into exam");
    };

    const handleCut = (event) => {
      event.preventDefault();
      handleMalpracticeViolation("cut", "Attempted to cut content");
    };

    const handleContextMenu = (event) => {
      event.preventDefault();
      handleMalpracticeViolation("shortcut", "Right-click context menu attempt");
    };

    const handleKeyboard = (event) => {
      const key = event.key.toLowerCase();

      if (
        (event.ctrlKey && (key === "c" || key === "v" || key === "x" || key === "u")) ||
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && (key === "i" || key === "j" || key === "c"))
      ) {
        event.preventDefault();
        handleMalpracticeViolation("shortcut", `Prohibited shortcut key pressed (${event.key})`);
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyboard);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyboard);
    };
  }, [page, attemptId, tabSwitches, copyAttempts, pasteAttempts, user, submitting, isTerminating]);

  // =========================================================
  // SESSION CHECK
  // =========================================================

async function checkSession() {
  try {
    const response = await fetch(`${API_URL}/me`, {
      method: "GET",
      headers: { ...getAuthHeaders(user) },
      credentials: "include",
    });

    const data = await response.json();

    console.log("SESSION RESPONSE:", data);

    if (response.ok && data.success) {
      setUser(data.user);
      localStorage.setItem("examsecure_user", JSON.stringify(data.user));

      if (data.user.role === "student") {
        setPage("dashboard");
      }
    } else {
      const stored = JSON.parse(localStorage.getItem("examsecure_user") || "null");
      if (stored && stored.role === "student") {
        setUser(stored);
        setPage("dashboard");
      }
    }
  } catch (error) {
    console.error("SESSION CHECK ERROR:", error);
    const stored = JSON.parse(localStorage.getItem("examsecure_user") || "null");
    if (stored && stored.role === "student") {
      setUser(stored);
      setPage("dashboard");
    }
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
        localStorage.setItem("examsecure_user", JSON.stringify(data.user));
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
  // ADMIN LOGIN
  // =========================================================

  async function handleAdminLogin(event) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword,
        }),
      });

      const data = await response.json();

      console.log("ADMIN LOGIN RESPONSE:", data);

      if (response.ok && data.success) {
        setUser(data.user);
        setPage("admin-dashboard");

        setAdminPassword("");
        setMessage("");
      } else {
        setMessage(
          data.message || "Invalid admin username or password."
        );
      }
    } catch (error) {
      console.error("ADMIN LOGIN ERROR:", error);

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
  // ADMIN DASHBOARD
  // =========================================================

  async function loadAdminDashboard() {
    try {
      const response = await fetch(`${API_URL}/admin/dashboard`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      console.log("ADMIN DASHBOARD RESPONSE:", data);

      if (response.ok && data.success) {
        setAdminStats(data.statistics);
      } else {
        console.error(
          "ADMIN DASHBOARD ERROR:",
          data.message || "Unable to load dashboard"
        );
      }
    } catch (error) {
      console.error("ADMIN DASHBOARD CONNECTION ERROR:", error);
    }
  }

  // =========================================================
  // ADMIN MANAGEMENT
  // =========================================================

  async function loadAdminStudents() {
    try {
      const response = await fetch(`${API_URL}/admin/students`, {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAdminStudents(Array.isArray(data.students) ? data.students : []);
      } else {
        setMessage(data.message || "Unable to load students.");
      }
    } catch (error) {
      console.error("STUDENT MANAGEMENT ERROR:", error);
      setMessage("Unable to connect to backend.");
    }
  }

  async function saveStudent(event) {
    event.preventDefault();
    setAdminFormLoading(true);
    setMessage("");

    try {
      const isEditing = Boolean(editingStudentId);

      const response = await fetch(
        isEditing
          ? `${API_URL}/admin/students/${editingStudentId}`
          : `${API_URL}/admin/students`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(studentForm),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setStudentForm({
          name: "",
          email: "",
          phone: "",
          password: "",
        });

        setEditingStudentId(null);
        await loadAdminStudents();
        await loadAdminDashboard();

        setMessage(
          isEditing
            ? "Student updated successfully."
            : "Student added successfully."
        );
      } else {
        setMessage(data.message || "Unable to save student.");
      }
    } catch (error) {
      console.error("SAVE STUDENT ERROR:", error);
      setMessage("Unable to connect to backend.");
    } finally {
      setAdminFormLoading(false);
    }
  }

  function editStudent(student) {
    setEditingStudentId(student.id);

    setStudentForm({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      password: "",
    });

    setMessage("");
  }

  async function deleteStudent(studentId) {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/students/${studentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        await loadAdminStudents();
        await loadAdminDashboard();
        setMessage("Student deleted successfully.");
      } else {
        setMessage(data.message || "Unable to delete student.");
      }
    } catch (error) {
      console.error("DELETE STUDENT ERROR:", error);
      setMessage("Unable to connect to backend.");
    }
  }

  async function loadAdminExams() {
    try {
      const response = await fetch(`${API_URL}/exam/`, {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAdminExams(Array.isArray(data.exams) ? data.exams : []);
      } else {
        setMessage(data.message || "Unable to load examinations.");
      }
    } catch (error) {
      console.error("EXAM MANAGEMENT ERROR:", error);
      setMessage("Unable to connect to backend.");
    }
  }

  async function saveExam(event) {
    event.preventDefault();
    setAdminFormLoading(true);
    setMessage("");

    try {
      const isEditing = Boolean(editingExamId);

      const response = await fetch(
        isEditing
          ? `${API_URL}/exam/${editingExamId}`
          : `${API_URL}/exam/`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(examForm),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setExamForm({
          title: "",
          total_questions: 30,
          duration_minutes: 30,
          is_active: 1,
        });

        setEditingExamId(null);
        await loadAdminExams();
        await loadAdminDashboard();

        setMessage(
          isEditing
            ? "Examination updated successfully."
            : "Examination created successfully."
        );
      } else {
        setMessage(data.message || "Unable to save examination.");
      }
    } catch (error) {
      console.error("SAVE EXAM ERROR:", error);
      setMessage("Unable to connect to backend.");
    } finally {
      setAdminFormLoading(false);
    }
  }

  function editExam(item) {
    setEditingExamId(item.id);

    setExamForm({
      title: item.title || "",
      total_questions: item.total_questions || 30,
      duration_minutes: item.duration_minutes || 30,
      is_active: Number(item.is_active) ? 1 : 0,
    });

    setMessage("");
  }

  async function deleteExam(examId) {
    if (!window.confirm("Are you sure you want to delete this examination?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/exam/${examId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        await loadAdminExams();
        await loadAdminDashboard();
        setMessage("Examination deleted successfully.");
      } else {
        setMessage(data.message || "Unable to delete examination.");
      }
    } catch (error) {
      console.error("DELETE EXAM ERROR:", error);
      setMessage("Unable to connect to backend.");
    }
  }

  async function loadAdminAttempts() {
    try {
      const response = await fetch(`${API_URL}/admin/attempts`, {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAdminAttempts(
          Array.isArray(data.attempts) ? data.attempts : []
        );
      } else {
        setMessage(data.message || "Unable to load reports.");
      }
    } catch (error) {
      console.error("REPORTS ERROR:", error);
      setMessage("Unable to connect to backend.");
    }
  }

  async function viewAttempt(attemptId) {
    try {
      const response = await fetch(
        `${API_URL}/admin/attempts/${attemptId}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSelectedAttempt(data.attempt);
      } else {
        setMessage(data.message || "Unable to load attempt.");
      }
    } catch (error) {
      console.error("ATTEMPT DETAILS ERROR:", error);
      setMessage("Unable to connect to backend.");
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================

async function logout() {
  try {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: { ...getAuthHeaders(user) },
      credentials: "include",
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
  }

  localStorage.removeItem("examsecure_user");
  setUser(null);
  setPage("login");

  setExam(null);
  setQuestions([]);
  setQuestionSet("");
  setAttemptId(null);
  setMessage("");
}
  async function loadStudentExamDetails() {
    try {
      const response = await fetch(`${API_URL}/exam/`, {
        method: "GET",
        headers: { ...getAuthHeaders(user) },
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success && Array.isArray(data.exams)) {
        const activeExam = data.exams.find(
          (e) => String(e.id) === String(EXAM_ID) || Boolean(e.is_active)
        );

        if (activeExam) {
          setExam(activeExam);
        }
      }
    } catch (error) {
      console.error("LOAD STUDENT EXAM DETAILS ERROR:", error);
    }
  }

  // =========================================================
  // START EXAM
  // =========================================================

  async function startExam() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/exam/${EXAM_ID}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(user),
        },
        credentials: "include",
      });

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

        setTabSwitches(0);
        setCopyAttempts(0);
        setPasteAttempts(0);

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
                setAdminUsername("");
                setAdminPassword("");
                setPage("admin-login");
              }}
            >
              Admin Login
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
  // ADMIN LOGIN PAGE
  // =========================================================

  if (page === "admin-login") {
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
                  Intelligent Examination Platform
                </small>
              </div>
            </div>

            <div className="showcase-copy">

              <div className="eyebrow">
                ADMINISTRATION PORTAL
              </div>

              <h1>
                Manage examinations
                <br />
                with confidence.
              </h1>

              <div className="showcase-line"></div>

              <p>
                Secure administration access for managing
                students, examinations, questions and
                examination attempts.
              </p>

            </div>

          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="login-panel">

          <div className="login-card">

            <div className="login-cap">
              <ShieldCheck size={26} strokeWidth={2.2} />
            </div>

            <h2>
              Admin Login
            </h2>

            <p className="login-subtitle">
              Sign in to access the administration portal
            </p>

            <form onSubmit={handleAdminLogin}>

              <label htmlFor="admin-username">
                Username
              </label>

              <div className="input-wrap">
                <span className="input-icon">
                  <UserRound size={17} />
                </span>

                <input
                  id="admin-username"
                  type="text"
                  placeholder="Enter admin username"
                  value={adminUsername}
                  onChange={(e) =>
                    setAdminUsername(e.target.value)
                  }
                  required
                  autoComplete="username"
                />
              </div>

              <label htmlFor="admin-password">
                Password
              </label>

              <div className="input-wrap">
                <span className="input-icon">
                  <LockKeyhole size={17} />
                </span>

                <input
                  id="admin-password"
                  type="password"
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) =>
                    setAdminPassword(e.target.value)
                  }
                  required
                  autoComplete="current-password"
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
                  ? "Signing in..."
                  : "Sign In as Admin"}
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

            <div className="credential-note">

              <div className="note-icon">
                <Info size={17} />
              </div>

              <p>
                Use your authorized administrator credentials
                to access the management portal.
              </p>

            </div>

            <div className="privacy-note">
              <ShieldCheck size={15} />
              Your privacy and security are our priority.
            </div>

          </div>

        </section>

      </div>
    );
  }

  // =========================================================
  // ADMIN STUDENT MANAGEMENT
  // =========================================================

  if (page === "admin-students") {
    return (
      <div className="dashboard-page admin-management-page">

        <div className="dashboard-header">
          <div>
            <div className="portal-label">ADMIN PORTAL</div>
            <h1>Student Management</h1>
            <p className="dashboard-intro">
              View, add, edit and manage registered students.
            </p>
          </div>

          <button
            className="logout-button"
            onClick={() => setPage("admin-dashboard")}
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>
        </div>

        <div className="admin-management-card">

          <div className="admin-management-title">
            <div>
              <h2>
                {editingStudentId
                  ? "Edit Student"
                  : "Add New Student"}
              </h2>
              <p>
                Manage student account information.
              </p>
            </div>
          </div>

          <form
            className="admin-management-form"
            onSubmit={saveStudent}
          >
            <input
              type="text"
              placeholder="Student name"
              value={studentForm.name}
              onChange={(e) =>
                setStudentForm({
                  ...studentForm,
                  name: e.target.value,
                })
              }
              required
            />

            <input
              type="email"
              placeholder="Student email"
              value={studentForm.email}
              onChange={(e) =>
                setStudentForm({
                  ...studentForm,
                  email: e.target.value,
                })
              }
              required
            />

            <input
              type="tel"
              placeholder="Phone number"
              value={studentForm.phone}
              onChange={(e) =>
                setStudentForm({
                  ...studentForm,
                  phone: e.target.value,
                })
              }
            />

            {!editingStudentId && (
              <input
                type="password"
                placeholder="Temporary password"
                value={studentForm.password}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    password: e.target.value,
                  })
                }
                required
              />
            )}

            <button
              className="admin-primary-button"
              type="submit"
              disabled={adminFormLoading}
            >
              {adminFormLoading
                ? "Saving..."
                : editingStudentId
                ? "Update Student"
                : "Add Student"}
            </button>

            {editingStudentId && (
              <button
                className="admin-secondary-button"
                type="button"
                onClick={() => {
                  setEditingStudentId(null);
                  setStudentForm({
                    name: "",
                    email: "",
                    phone: "",
                    password: "",
                  });
                }}
              >
                Cancel
              </button>
            )}
          </form>

        </div>

        <div className="admin-table-card">

          <div className="admin-table-heading">
            <h2>Registered Students</h2>
            <span>{adminStudents.length} students</span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {adminStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-empty">
                      No students registered yet.
                    </td>
                  </tr>
                ) : (
                  adminStudents.map((student) => (
                    <tr key={student.id}>
                      <td>#{student.id}</td>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.phone || "?"}</td>
                      <td>
                        {student.created_at
                          ? new Date(
                              student.created_at
                            ).toLocaleDateString()
                          : "?"}
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            onClick={() =>
                              editStudent(student)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              deleteStudent(student.id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}

      </div>
    );
  }

  // =========================================================
  // ADMIN EXAM MANAGEMENT
  // =========================================================

  if (page === "admin-exams") {
    return (
      <div className="dashboard-page admin-management-page">

        <div className="dashboard-header">
          <div>
            <div className="portal-label">ADMIN PORTAL</div>
            <h1>Exam Management</h1>
            <p className="dashboard-intro">
              Create, update and manage examinations.
            </p>
          </div>

          <button
            className="logout-button"
            onClick={() => setPage("admin-dashboard")}
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>
        </div>

        <div className="admin-management-card">

          <div className="admin-management-title">
            <div>
              <h2>
                {editingExamId
                  ? "Edit Examination"
                  : "Create Examination"}
              </h2>
              <p>
                Configure examination title, questions,
                duration and availability.
              </p>
            </div>
          </div>

          <form
            className="admin-management-form exam-form"
            onSubmit={saveExam}
          >
            <input
              type="text"
              placeholder="Examination title"
              value={examForm.title}
              onChange={(e) =>
                setExamForm({
                  ...examForm,
                  title: e.target.value,
                })
              }
              required
            />

            <input
              type="number"
              min="1"
              placeholder="Total questions"
              value={examForm.total_questions}
              onChange={(e) =>
                setExamForm({
                  ...examForm,
                  total_questions: e.target.value,
                })
              }
              required
            />

            <input
              type="number"
              min="1"
              placeholder="Duration in minutes"
              value={examForm.duration_minutes}
              onChange={(e) =>
                setExamForm({
                  ...examForm,
                  duration_minutes: e.target.value,
                })
              }
              required
            />

            <select
              value={examForm.is_active}
              onChange={(e) =>
                setExamForm({
                  ...examForm,
                  is_active: Number(e.target.value),
                })
              }
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>

            <button
              className="admin-primary-button"
              type="submit"
              disabled={adminFormLoading}
            >
              {adminFormLoading
                ? "Saving..."
                : editingExamId
                ? "Update Examination"
                : "Create Examination"}
            </button>

            {editingExamId && (
              <button
                className="admin-secondary-button"
                type="button"
                onClick={() => {
                  setEditingExamId(null);
                  setExamForm({
                    title: "",
                    total_questions: 30,
                    duration_minutes: 30,
                    is_active: 1,
                  });
                }}
              >
                Cancel
              </button>
            )}
          </form>

        </div>

        <div className="admin-table-card">

          <div className="admin-table-heading">
            <h2>Examinations</h2>
            <span>{adminExams.length} exams</span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Examination</th>
                  <th>Questions</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {adminExams.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-empty">
                      No examinations created yet.
                    </td>
                  </tr>
                ) : (
                  adminExams.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>
                        <strong>{item.title}</strong>
                      </td>
                      <td>{item.total_questions}</td>
                      <td>{item.duration_minutes} min</td>
                      <td>
                        <span
                          className={
                            Number(item.is_active)
                              ? "status-badge active"
                              : "status-badge inactive"
                          }
                        >
                          {Number(item.is_active)
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>
                      <td>
                        {item.created_at
                          ? new Date(
                              item.created_at
                            ).toLocaleDateString()
                          : "?"}
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            onClick={() =>
                              editExam(item)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              deleteExam(item.id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}

      </div>
    );
  }

  // =========================================================
  // ADMIN ATTEMPT REPORTS
  // =========================================================

  if (page === "admin-reports") {
    return (
      <div className="dashboard-page admin-management-page">

        <div className="dashboard-header">
          <div>
            <div className="portal-label">ADMIN PORTAL</div>
            <h1>Attempt Reports</h1>
            <p className="dashboard-intro">
              Review student attempts, scores and examination results.
            </p>
          </div>

          <button
            className="logout-button"
            onClick={() => setPage("admin-dashboard")}
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>
        </div>

        <div className="admin-table-card">

          <div className="admin-table-heading">
            <h2>Examination Attempts</h2>
            <span>{adminAttempts.length} attempts</span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Attempt</th>
                  <th>Student</th>
                  <th>Examination</th>
                  <th>Set</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Tab Switches</th>
                  <th>Copy / Paste</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {adminAttempts.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="admin-empty">
                      No examination attempts found.
                    </td>
                  </tr>
                ) : (
                  adminAttempts.map((attempt) => (
                    <tr key={attempt.attempt_id}>
                      <td>#{attempt.attempt_id}</td>
                      <td>
                        <strong>{attempt.student_name}</strong>
                        <small className="table-subtext">
                          {attempt.student_email}
                        </small>
                      </td>
                      <td>{attempt.exam_title}</td>
                      <td>
                        <span className="set-badge">
                          {attempt.question_set || "?"}
                        </span>
                      </td>
                      <td>
                        {attempt.score ?? 0}/
                        {attempt.total_questions ?? 0}
                      </td>
                      <td>
                        {Number(
                          attempt.percentage || 0
                        ).toFixed(2)}%
                      </td>
                      <td>
                        {(attempt.tab_switch_count || 0) > 0 ? (
                          <span className="status-badge inactive" style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}>
                            ⚠️ {attempt.tab_switch_count} switch{(attempt.tab_switch_count || 0) > 1 ? "es" : ""}
                          </span>
                        ) : (
                          <span className="status-badge active" style={{ background: "#dcfce7", color: "#166534" }}>
                            ✓ 0 Clean
                          </span>
                        )}
                      </td>
                      <td>
                        {(attempt.copy_paste_count || 0) > 0 ? (
                          <span className="status-badge inactive" style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}>
                            ⚠️ {attempt.copy_paste_count} copy/paste
                          </span>
                        ) : (
                          <span className="status-badge active" style={{ background: "#dcfce7", color: "#166534" }}>
                            ✓ 0 Clean
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={
                            attempt.status === "submitted" || attempt.status === "completed"
                              ? "status-badge active"
                              : "status-badge inactive"
                          }
                        >
                          {attempt.status || "Unknown"}
                        </span>
                      </td>
                      <td>
                        {attempt.start_time
                          ? new Date(
                              attempt.start_time
                            ).toLocaleString()
                          : "?"}
                      </td>
                      <td>
                        <button
                          className="report-view-button"
                          type="button"
                          onClick={() =>
                            viewAttempt(
                              attempt.attempt_id
                            )
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {selectedAttempt && (
          <div className="attempt-detail-card">

            <div className="admin-table-heading">
              <div>
                <h2>Attempt Details</h2>
                <p>
                  Attempt #{selectedAttempt.attempt_id}
                </p>
              </div>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() =>
                  setSelectedAttempt(null)
                }
              >
                Close
              </button>
            </div>

            <div className="attempt-detail-grid">

              <div>
                <span>Student</span>
                <strong>
                  {selectedAttempt.student_name}
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  {selectedAttempt.student_email}
                </strong>
              </div>

              <div>
                <span>Examination</span>
                <strong>
                  {selectedAttempt.exam_title}
                </strong>
              </div>

              <div>
                <span>Question Set</span>
                <strong>
                  {selectedAttempt.question_set}
                </strong>
              </div>

              <div>
                <span>Score</span>
                <strong>
                  {selectedAttempt.score ?? 0}/
                  {selectedAttempt.total_questions ?? 0}
                </strong>
              </div>

              <div>
                <span>Percentage</span>
                <strong>
                  {Number(
                    selectedAttempt.percentage || 0
                  ).toFixed(2)}%
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {selectedAttempt.status}
                </strong>
              </div>

              <div>
                <span>Duration</span>
                <strong>
                  {selectedAttempt.duration_minutes || 0} minutes
                </strong>
              </div>

            </div>

          </div>
        )}

        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}

      </div>
    );
  }

  // =========================================================
  // ADMIN DASHBOARD PAGE
  // =========================================================

  if (page === "admin-dashboard") {

    return (
      <div className="dashboard-page">

        <div className="dashboard-header">

          <div>
            <div className="portal-label">
              ADMIN PORTAL
            </div>

            <h1>
              Welcome, {user?.name || "Administrator"}!
            </h1>

            <p className="dashboard-intro">
              Manage students, examinations and examination attempts.
            </p>
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

        <div className="admin-stat-grid">

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <GraduationCap size={24} />
            </div>

            <div>
              <span>Total Students</span>
              <strong>{adminStats.total_students}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <ClipboardCheck size={24} />
            </div>

            <div>
              <span>Total Exams</span>
              <strong>{adminStats.total_exams}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <MonitorCheck size={24} />
            </div>

            <div>
              <span>Active Exams</span>
              <strong>{adminStats.active_exams}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <BarChart3 size={24} />
            </div>

            <div>
              <span>Total Attempts</span>
              <strong>{adminStats.total_attempts}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={24} />
            </div>

            <div>
              <span>Malpractice Alerts</span>
              <strong style={{ color: adminStats.total_violations > 0 ? '#dc2626' : 'inherit' }}>
                {adminStats.total_violations || 0}
              </strong>
            </div>
          </div>

        </div>

        <div className="admin-section">

          <h2>Administration</h2>

          <div className="admin-action-grid">

            <div className="admin-action-card">
              <GraduationCap size={28} />

              <h3>Student Management</h3>

              <p>
                View, add, edit and manage registered students.
              </p>

              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setPage("admin-students");
                  loadAdminStudents();
                }}
              >
                Manage Students
              </button>
            </div>

            <div className="admin-action-card">
              <ClipboardCheck size={28} />

              <h3>Exam Management</h3>

              <p>
                Create, update and manage examinations.
              </p>

              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setPage("admin-exams");
                  loadAdminExams();
                }}
              >
                Manage Exams
              </button>
            </div>

            <div className="admin-action-card">
              <BarChart3 size={28} />

              <h3>Attempt Reports</h3>

              <p>
                Review student attempts, scores and examination results.
              </p>

              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setSelectedAttempt(null);
                  setPage("admin-reports");
                  loadAdminAttempts();
                }}
              >
                View Reports
              </button>
            </div>

            <div className="admin-action-card" style={{ borderColor: '#fca5a5', background: 'linear-gradient(to bottom, #ffffff, #fff5f5)' }}>
              <div style={{ color: '#dc2626' }}>
                <AlertTriangle size={28} />
              </div>

              <h3>Malpractice Monitor</h3>

              <p>
                Track student tab switching, window blur events, copy-paste violations and malpractice alerts.
              </p>

              <button
                type="button"
                style={{ backgroundColor: '#dc2626' }}
                onClick={() => {
                  setMessage("");
                  setSelectedAttempt(null);
                  setPage("admin-reports");
                  loadAdminAttempts();
                }}
              >
                Monitor Malpractice
              </button>
            </div>

          </div>

        </div>

        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}

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
                  exam?.total_questions ||
                  (questions.length > 0 ? questions.length : 30)
                }
                label="Questions"
              />

              <Stat
                icon={<Clock3 size={18} strokeWidth={2.3} />}
                value={exam?.duration_minutes || "30"}
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
    if (result.status === "terminated" || result.is_malpractice) {
      return (
        <div className="dashboard-page result-page malpractice-terminated-page">
          <header className="top-header result-header" style={{ background: '#7f1d1d', borderColor: '#991b1b' }}>
            <div className="brand" style={{ color: '#ffffff' }}>
              <ShieldCheck size={22} color="#fca5a5" />
              <strong style={{ color: '#ffffff' }}>ExamSecure Proctoring Engine</strong>
            </div>
            <div className="header-user" style={{ color: '#fecaca' }}>
              {result.student_name || user?.name}
            </div>
            <button
              className="logout-button"
              style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}
              onClick={() => setPage("dashboard")}
            >
              Back to Portal
            </button>
          </header>

          <main className="result-main">
            <div className="result-container">
              <div className="malpractice-alert-hero">
                <div className="malpractice-alert-icon">
                  <AlertTriangle size={42} color="#dc2626" />
                </div>
                <div className="malpractice-alert-badge">
                  EXAM TERMINATED - MALPRACTICE DETECTED
                </div>
                <h1>Examination Disqualified</h1>
                <p className="malpractice-subtitle">
                  Your examination session was ended automatically due to security violations detected by the Proctoring System.
                </p>
              </div>

              <div className="malpractice-details-card">
                <div className="malpractice-reason-box">
                  <h3>
                    <ShieldCheck size={20} /> Detected Malpractice Activity
                  </h3>
                  <div className="reason-text">
                    <strong>Violation Reason: </strong> {result.malpractice_reason || "Malpractice activity detected during examination"}
                  </div>
                </div>

                <div className="malpractice-stats-grid">
                  <div className="mal-stat-card">
                    <span>Tab Switch Log</span>
                    <strong>{result.tab_switch_count ?? tabSwitches ?? 0} Switches</strong>
                  </div>
                  <div className="mal-stat-card">
                    <span>Copy/Paste Log</span>
                    <strong>{result.copy_paste_count ?? (copyAttempts + pasteAttempts) ?? 0} Attempts</strong>
                  </div>
                  <div className="mal-stat-card danger">
                    <span>Result Status</span>
                    <strong>NO RESULT GENERATED</strong>
                  </div>
                </div>

                <div className="candidate-info-block">
                  <h4>Candidate & Examination Information</h4>
                  <div className="candidate-row">
                    <span>Candidate Name</span>
                    <strong>{result.student_name || user?.name}</strong>
                  </div>
                  <div className="candidate-row">
                    <span>Email Address</span>
                    <strong>{result.student_email || user?.email}</strong>
                  </div>
                  <div className="candidate-row">
                    <span>Examination</span>
                    <strong>{result.exam_title || exam?.title || "Aptitude Test"}</strong>
                  </div>
                  <div className="candidate-row">
                    <span>Question Set</span>
                    <strong>{result.question_set || "A"}</strong>
                  </div>
                  <div className="candidate-row">
                    <span>Final Evaluation Status</span>
                    <strong className="status-disqualified">🛑 DISQUALIFIED (SCORE: 0 / RESULT WITHHELD)</strong>
                  </div>
                </div>

                <div className="malpractice-policy-notice">
                  <Info size={20} style={{ flexShrink: 0, color: '#0284c7' }} />
                  <p>
                    <strong>Institutional Policy Notice:</strong> As per examination integrity regulations, candidates disqualified for malpractice receive a score of zero (0) and no performance certificate or result sheet will be issued. This violation record has been saved and submitted to your institution's examination committee.
                  </p>
                </div>

                <button
                  className="result-back-button danger-button"
                  onClick={() => setPage("dashboard")}
                  style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: '800' }}
                >
                  Return to Student Portal
                </button>
              </div>
            </div>
          </main>
        </div>
      );
    }

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
      student_id: user?.id,
      answers: answerList,
      tab_switches: tabSwitches,
      copy_attempts: copyAttempts,
      paste_attempts: pasteAttempts,
      time_remaining: timeLeft,
    };

    console.log(
      "SUBMIT EXAM PAYLOAD:",
      payload
    );

    try {

      /*
       * Submit exam endpoint
       */

      const response = await fetch(`${API_URL}/exam/${exam?.id || EXAM_ID}/submit`, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(user),
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

      if (data.status === "terminated" || data.status === "malpractice" || data.is_malpractice || response.status === 403) {
        setResult({
          status: "terminated",
          is_malpractice: true,
          result_generated: false,
          malpractice_reason: data.malpractice_reason || data.message || "Malpractice activity detected during examination",
          score: 0,
          percentage: 0,
          total_questions: questions.length || 30,
          student_name: user?.name || "Student",
          student_email: user?.email || "",
          exam_title: exam?.title || "Aptitude Test",
          question_set: questionSet || "A"
        });
        setPage("result");
        setSubmitting(false);
        return;
      }

      if (response.ok && data.success) {

        alert(
          autoSubmit
            ? "Time is over. Your examination has been submitted."
            : "Examination submitted successfully."
        );

        const total = data.total_questions || Object.keys(answerList).length || 30;
        const score = data.score || 0;
        const percentage = data.percentage ?? (total > 0 ? Math.round((score / total) * 100) : 0);

        const resultData = {
          ...data,
          score,
          total_questions: total,
          percentage,
          student_name: data.student_name || user?.name || "Student",
          student_email: data.student_email || user?.email || "",
          exam_title: data.exam_title || exam?.title || "Aptitude Test",
          question_set: data.question_set || questionSet || "A",
          status: data.status || "submitted"
        };

        setResult(data.result || resultData);
        setPage("result");

      } else {

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

          <div className={`proctoring-status-pill ${(tabSwitches + copyAttempts + pasteAttempts) > 0 ? "warning-active" : ""}`}>
            <ShieldCheck size={14} /> Security Proctoring Active | Malpractice Activity: {tabSwitches + copyAttempts + pasteAttempts}
          </div>

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

      {warningModal && (
        <div className="malpractice-warning-overlay">
          <div className="malpractice-warning-modal">
            <div className="warning-modal-header">
              <AlertTriangle size={36} color="#dc2626" />
              <h2>{warningModal.title}</h2>
            </div>
            <div className="warning-modal-text">
              {warningModal.detail}
            </div>
            <div className="warning-counter-badge">
              Violation Warning {warningModal.count} of {warningModal.max}
            </div>
            <p className="warning-modal-danger-note">
              <strong>Attention:</strong> Further malpractice violations will result in <strong>IMMEDIATE EXAM TERMINATION</strong> and your result will NOT be generated!
            </p>
            <button
              type="button"
              className="warning-modal-ack-button"
              onClick={() => setWarningModal(null)}
            >
              I Understand & Resume Exam
            </button>
          </div>
        </div>
      )}

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









