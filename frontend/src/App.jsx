import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck, Mail, LockKeyhole, UserRound, Phone,
  Info, CheckCircle2, ClipboardCheck, Clock3, Shuffle,
  BarChart3, LogOut, ArrowLeft, ArrowRight, Play,
  Timer, AlertTriangle, MonitorCheck,
  FileCheck2, GraduationCap, Wifi, EyeOff, Eye,
  Sun, Moon, Search, Plus, Trash2, Edit3, Flag,
  Download, X, Check
} from "lucide-react";
import "./App.css";

// API Base URL Resolution
const getApiUrl = () => {
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "/api";
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== "" && envUrl.trim() !== "/api") {
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

function App() {
  // Theme State (Light / Dark)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("examsecure_theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("examsecure_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Toast System
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // User & Page State
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");

  // Login Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Admin Login Form
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Student Registration Form
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotMessageType, setForgotMessageType] = useState("info");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Admin Stats & Management State
  const [adminStats, setAdminStats] = useState({
    total_students: 0,
    total_exams: 0,
    active_exams: 0,
    total_attempts: 0,
    total_violations: 0,
  });

  const [adminStudents, setAdminStudents] = useState([]);
  const [adminExams, setAdminExams] = useState([]);
  const [adminAttempts, setAdminAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [adminFormLoading, setAdminFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Student & Exam Management Forms
  const [studentForm, setStudentForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [examForm, setExamForm] = useState({ title: "", total_questions: 30, duration_minutes: 30, is_active: 1 });
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingExamId, setEditingExamId] = useState(null);

  // Student Exam Engine State
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionSet, setQuestionSet] = useState("");
  const [attemptId, setAttemptId] = useState(null);
  const [result, setResult] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [pasteAttempts, setPasteAttempts] = useState(0);
  const [submitting, setSubmitting] = useState(false);


  // =========================================================
  // INITIAL SESSION & STORAGE LOAD
  // =========================================================

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        method: "GET",
        headers: { ...getAuthHeaders(user) },
        credentials: "include",
      });

      const data = await response.json();

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
  }, [user]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("examsecure_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const loadAdminDashboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/admin/dashboard`, {
        headers: { ...getAuthHeaders(user) },
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAdminStats(data.statistics);
      }
    } catch (error) {
      console.error("ADMIN DASHBOARD ERROR:", error);
    }
  }, [user]);

  const loadStudentExamDetails = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/exam/`, {
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
      console.error("LOAD STUDENT EXAM ERROR:", error);
    }
  }, [user]);

  useEffect(() => {
    if (page === "admin-dashboard") loadAdminDashboard();
    if (page === "dashboard") loadStudentExamDetails();
  }, [page, loadAdminDashboard, loadStudentExamDetails]);

  // =========================================================
  // SUBMIT EXAM FUNCTION
  // =========================================================

  const handleSubmitExam = useCallback(async (autoSubmit = false) => {
    if (submitting) return;

    setSubmitting(true);
    setExamMessage("");

    const payload = {
      attempt_id: attemptId,
      student_id: user?.id,
      answers: answers,
      tab_switches: tabSwitches,
      copy_attempts: copyAttempts,
      paste_attempts: pasteAttempts,
      time_remaining: timeLeft,
    };

    try {
      const response = await fetch(`${API_URL}/exam/${exam?.id || EXAM_ID}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(user),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

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
        addToast("Examination disqualified due to malpractice activity", "error");
        setSubmitting(false);
        return;
      }

      if (response.ok && data.success) {
        addToast(autoSubmit ? "Time expired. Examination auto-submitted." : "Examination submitted successfully!", "success");

        const total = data.total_questions || Object.keys(answers).length || 30;
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
        setExamMessage(data.message || "Unable to submit examination.");
        addToast(data.message || "Submission failed", "error");
        setSubmitting(false);
      }
    } catch (error) {
      console.error("SUBMIT EXAM ERROR:", error);
      setExamMessage("Network error while submitting examination.");
      addToast("Network connection failed during submission", "error");
    }
  }, [submitting, attemptId, user, answers, tabSwitches, copyAttempts, pasteAttempts, timeLeft, exam, questions, questionSet]);

  // =========================================================
  // EXAM TIMER EFFECT
  // =========================================================

  useEffect(() => {
    if (page !== "exam") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [page, handleSubmitExam]);

  // =========================================================
  // SILENT MALPRACTICE MONITORING & ANTI-CHEAT LISTENERS
  // =========================================================

  const handleMalpracticeViolation = useCallback((type, detail) => {
    if (page !== "exam") return;

    if (type === "tab_switch") setTabSwitches((prev) => prev + 1);
    else if (type === "copy" || type === "shortcut") setCopyAttempts((prev) => prev + 1);
    else if (type === "paste" || type === "cut") setPasteAttempts((prev) => prev + 1);

    addToast(`Security Warning: ${detail}`, "warning");

    if (attemptId) {
      const endpoint = type === "tab_switch" ? "tab-switch" : "copy-paste";
      fetch(`${API_URL}/attempt/${attemptId}/${endpoint}`, {
        method: "POST",
        headers: { ...getAuthHeaders(user) },
        credentials: "include"
      }).catch(err => console.error("Log violation error:", err));
    }
  }, [page, attemptId, user]);

  useEffect(() => {
    if (page !== "exam") return;

    const handleVisibility = () => {
      if (document.hidden) {
        handleMalpracticeViolation("tab_switch", "Tab switch / Window minimization detected");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [page, handleMalpracticeViolation]);

  useEffect(() => {
    if (page !== "exam") return;

    const handleCopy = (e) => { e.preventDefault(); handleMalpracticeViolation("copy", "Copy action blocked"); };
    const handlePaste = (e) => { e.preventDefault(); handleMalpracticeViolation("paste", "Paste action blocked"); };
    const handleCut = (e) => { e.preventDefault(); handleMalpracticeViolation("cut", "Cut action blocked"); };
    const handleContextMenu = (e) => { e.preventDefault(); handleMalpracticeViolation("shortcut", "Right click menu blocked"); };

    const handleKeyboard = (e) => {
      const key = e.key.toLowerCase();
      if (
        (e.ctrlKey && (key === "c" || key === "v" || key === "x" || key === "u")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (key === "i" || key === "j" || key === "c"))
      ) {
        e.preventDefault();
        handleMalpracticeViolation("shortcut", `Prohibited shortcut (${e.key}) blocked`);
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
  }, [page, handleMalpracticeViolation]);

  // =========================================================
  // HANDLERS (Auth & Management)
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/student/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        localStorage.setItem("examsecure_user", JSON.stringify(data.user));
        setPage("dashboard");
        setPassword("");
        addToast("Logged in successfully!", "success");

        if (rememberMe) localStorage.setItem("examsecure_remember_email", data.user.email);
        else localStorage.removeItem("examsecure_remember_email");
      } else {
        setMessage(data.message || "Invalid email or password.");
        addToast(data.message || "Login failed", "error");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setMessage("Cannot connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: adminUsername.trim(), password: adminPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        setPage("admin-dashboard");
        setAdminPassword("");
        addToast("Welcome Administrator!", "success");
      } else {
        setMessage(data.message || "Invalid admin credentials.");
        addToast(data.message || "Admin authentication failed", "error");
      }
    } catch (err) {
      console.error("ADMIN LOGIN ERROR:", err);
      setMessage("Cannot connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (registerPassword !== registerConfirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (registerPhone.length !== 10) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/student/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: registerName.trim(),
          email: registerEmail.trim(),
          phone: registerPhone,
          password: registerPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addToast("Registration successful! You can now log in.", "success");
        setRegisterName("");
        setRegisterEmail("");
        setRegisterPhone("");
        setRegisterPassword("");
        setRegisterConfirmPassword("");
        setTimeout(() => setPage("login"), 1200);
      } else {
        setMessage(data.message || "Registration failed.");
      }
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotCode = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotMessage("Please enter your registered email address.");
      setForgotMessageType("error");
      return;
    }
    setForgotLoading(true);
    setForgotMessage("");

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setForgotStep(2);
        setForgotMessageType("success");
        setForgotMessage(data.message || "Verification code sent!");
        if (data.verification_code) setForgotCode(data.verification_code);
      } else {
        setForgotMessageType("error");
        setForgotMessage(data.message || "No registered account found with this email.");
      }
    } catch (err) {
      console.error("FORGOT PWD ERROR:", err);
      setForgotMessageType("error");
      setForgotMessage("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!forgotCode || !forgotNewPassword) {
      setForgotMessage("Please enter the verification code and new password.");
      setForgotMessageType("error");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotMessage("Password must contain at least 6 characters.");
      setForgotMessageType("error");
      return;
    }
    setForgotLoading(true);

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          code: forgotCode.trim(),
          new_password: forgotNewPassword
        })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setForgotMessageType("success");
        setForgotMessage(data.message || "Password reset successfully!");
        setEmail(forgotEmail.trim());
        setPassword(forgotNewPassword);

        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStep(1);
          setForgotEmail("");
          setForgotCode("");
          setForgotNewPassword("");
          setForgotMessage("");
          addToast("Password reset successfully! Click Sign In to continue.", "success");
        }, 1500);
      } else {
        setForgotMessageType("error");
        setForgotMessage(data.message || "Invalid or expired verification code.");
      }
    } catch (err) {
      console.error("RESET PWD ERROR:", err);
      setForgotMessageType("error");
      setForgotMessage("Unable to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: { ...getAuthHeaders(user) },
        credentials: "include",
      });
    } catch (err) {
      console.error("LOGOUT ERROR:", err);
    }

    localStorage.removeItem("examsecure_user");
    setUser(null);
    setPage("login");
    setExam(null);
    setQuestions([]);
    setQuestionSet("");
    setAttemptId(null);
    setMessage("");
    addToast("Logged out successfully", "info");
  };

  const startExam = async () => {
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

      if (response.ok && data.success) {
        setExam(data.exam);
        setQuestions(Array.isArray(data.questions) ? data.questions : []);
        setQuestionSet(data.question_set || "A");
        setAttemptId(data.attempt_id || null);
        setTimeLeft((data.exam?.duration_minutes || 30) * 60);
        setTabSwitches(0);
        setCopyAttempts(0);
        setPasteAttempts(0);
        setAnswers({});
        setFlaggedQuestions({});
        setCurrentQuestion(0);
        setPage("exam");
        addToast("Examination started. Security monitoring active.", "info");
      } else {
        if (data.is_locked) {
          setMessage(`🛑 ACCESS DENIED: Account locked from attempting exam for 1 hour due to malpractice disqualification. (Remaining: ~${data.minutes_remaining || 60} mins)`);
        } else {
          setMessage(data.message || "Unable to start examination.");
        }
      }
    } catch (err) {
      console.error("START EXAM ERROR:", err);
      setMessage("Cannot connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  // Admin Management APIs
  const loadAdminStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/students`, {
        headers: { ...getAuthHeaders(user) },
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data.success) setAdminStudents(data.students || []);
    } catch (err) { console.error("LOAD STUDENTS ERROR:", err); }
  };

  const saveStudent = async (e) => {
    e.preventDefault();
    setAdminFormLoading(true);
    try {
      const isEditing = Boolean(editingStudentId);
      const url = isEditing ? `${API_URL}/admin/students/${editingStudentId}` : `${API_URL}/admin/students`;
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders(user) },
        credentials: "include",
        body: JSON.stringify(studentForm),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setStudentForm({ name: "", email: "", phone: "", password: "" });
        setEditingStudentId(null);
        await loadAdminStudents();
        await loadAdminDashboard();
        addToast(isEditing ? "Student updated!" : "Student created!", "success");
      } else {
        addToast(data.message || "Failed to save student", "error");
      }
    } catch (err) { console.error("SAVE STUDENT ERROR:", err); }
    finally { setAdminFormLoading(false); }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student account?")) return;
    try {
      const response = await fetch(`${API_URL}/admin/students/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders(user) },
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await loadAdminStudents();
        await loadAdminDashboard();
        addToast("Student deleted", "success");
      }
    } catch (err) { console.error("DELETE STUDENT ERROR:", err); }
  };

  const loadAdminExams = async () => {
    try {
      const response = await fetch(`${API_URL}/exam/`, {
        headers: { ...getAuthHeaders(user) },
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data.success) setAdminExams(data.exams || []);
    } catch (err) { console.error("LOAD EXAMS ERROR:", err); }
  };

  const saveExam = async (e) => {
    e.preventDefault();
    setAdminFormLoading(true);
    try {
      const isEditing = Boolean(editingExamId);
      const url = isEditing ? `${API_URL}/exam/${editingExamId}` : `${API_URL}/exam/`;
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders(user) },
        credentials: "include",
        body: JSON.stringify(examForm),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setExamForm({ title: "", total_questions: 30, duration_minutes: 30, is_active: 1 });
        setEditingExamId(null);
        await loadAdminExams();
        await loadAdminDashboard();
        addToast(isEditing ? "Exam updated!" : "Exam created!", "success");
      } else {
        addToast(data.message || "Failed to save exam", "error");
      }
    } catch (err) { console.error("SAVE EXAM ERROR:", err); }
    finally { setAdminFormLoading(false); }
  };

  const loadAdminAttempts = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/attempts`, {
        headers: { ...getAuthHeaders(user) },
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data.success) setAdminAttempts(data.attempts || []);
    } catch (err) { console.error("LOAD ATTEMPTS ERROR:", err); }
  };

  const cancelAttemptAdmin = async (id) => {
    if (!window.confirm("Are you sure you want to disqualify this attempt and set score to 0?")) return;
    try {
      const response = await fetch(`${API_URL}/admin/attempts/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders(user) },
        credentials: "include",
        body: JSON.stringify({ reason: "Disqualified by Administrator due to Malpractice Activity" })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        addToast("Attempt disqualified!", "success");
        setSelectedAttempt(null);
        await loadAdminAttempts();
        await loadAdminDashboard();
      }
    } catch (err) { console.error("CANCEL ATTEMPT ERROR:", err); }
  };

  const clearAttemptFlagAdmin = async (id) => {
    try {
      const response = await fetch(`${API_URL}/admin/attempts/${id}/clear-flag`, {
        method: "POST",
        headers: { ...getAuthHeaders(user) },
        credentials: "include"
      });
      const data = await response.json();
      if (response.ok && data.success) {
        addToast("Malpractice flag cleared", "success");
        if (selectedAttempt) setSelectedAttempt({ ...selectedAttempt, malpractice_reason: null });
        await loadAdminAttempts();
      }
    } catch (err) { console.error("CLEAR FLAG ERROR:", err); }
  };

  const exportAttemptsCSV = () => {
    if (!adminAttempts || adminAttempts.length === 0) return;
    const headers = ["Attempt ID,Student Name,Email,Exam Title,Question Set,Score,Total Questions,Percentage,Tab Switches,Copy Paste,Status,Start Time"];
    const rows = adminAttempts.map(a => [
      a.attempt_id,
      `"${a.student_name || ""}"`,
      `"${a.student_email || ""}"`,
      `"${a.exam_title || ""}"`,
      a.question_set || "",
      a.score || 0,
      a.total_questions || 0,
      `${a.percentage || 0}%`,
      a.tab_switch_count || 0,
      a.copy_paste_count || 0,
      a.status || "",
      `"${a.start_time || ""}"`
    ].join(","));

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ExamSecure_Attempt_Reports_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("CSV Report downloaded successfully!", "success");
  };

  // Helper Option Selector in Exam
  const selectOption = (opt) => {
    if (!questions[currentQuestion]) return;
    const qId = questions[currentQuestion].id;
    setAnswers((prev) => ({ ...prev, [qId]: opt }));
  };

  const toggleBookmark = () => {
    if (!questions[currentQuestion]) return;
    const qId = questions[currentQuestion].id;
    setFlaggedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const formatTimeStr = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // =========================================================
  // NAVBAR COMPONENT
  // =========================================================

  const renderNavbar = () => (
    <header className="top-navbar">
      <div className="brand-container">
        <div className="brand-icon-box">
          <ShieldCheck size={22} strokeWidth={2.5} />
        </div>
        <div className="brand-name">
          Exam<span>Secure</span>
        </div>
      </div>

      <div className="navbar-right">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
        </button>

        {user && (
          <div className="user-badge">
            <div className="user-avatar">
              <UserRound size={15} />
            </div>
            <span>{user.name}</span>
          </div>
        )}

        {user && (
          <button type="button" className="nav-btn nav-btn-danger" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        )}
      </div>
    </header>
  );

  // =========================================================
  // TOAST RENDERER
  // =========================================================

  const renderToasts = () => (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-pill ${t.type}`}>
          {t.type === "success" && <CheckCircle2 size={18} color="#10b981" />}
          {t.type === "error" && <AlertTriangle size={18} color="#f43f5e" />}
          {t.type === "warning" && <AlertTriangle size={18} color="#f59e0b" />}
          {t.type === "info" && <Info size={18} color="#6366f1" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );

  // =========================================================
  // PAGE RENDERERS
  // =========================================================

  // 1. LOGIN PAGE
  if (page === "login") {
    return (
      <div className="app-container">
        {renderNavbar()}
        {renderToasts()}

        <div className="auth-page">
          <section className="auth-hero-section">
            <div className="auth-hero-glow"></div>
            <div className="auth-hero-content">
              <div className="hero-eyebrow">
                <ShieldCheck size={14} /> Next-Gen Exam Integrity Engine
              </div>
              <h1 className="auth-hero-title">
                Smart Exams.
                <br />
                <span>Trusted Security.</span>
                <br />
                Instant Evaluation.
              </h1>
              <p className="auth-hero-desc">
                ExamSecure delivers automated proctoring, real-time malpractice detection, multi-set question randomization, and instant score analytics for universities and enterprise certifications.
              </p>

              <div className="hero-features-list">
                <div className="hero-feature-card">
                  <div className="hero-feature-icon"><MonitorCheck size={20} /></div>
                  <div className="hero-feature-text">
                    <strong>AI Proctoring</strong>
                    <small>Tab switch & copy detection</small>
                  </div>
                </div>

                <div className="hero-feature-card">
                  <div className="hero-feature-icon"><Shuffle size={20} /></div>
                  <div className="hero-feature-text">
                    <strong>Randomized Sets</strong>
                    <small>Set A, B, C, D distribution</small>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="auth-panel-section">
            <div className="auth-card">
              <div className="auth-header">
                <h2>Student Login</h2>
                <p>Sign in with your credentials to access your examination portal</p>
              </div>

              {message && <div className="msg-banner error"><AlertTriangle size={16} /> {message}</div>}

              <form onSubmit={handleLogin} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-container">
                    <span className="input-icon-prefix"><Mail size={18} /></span>
                    <input
                      id="email"
                      type="email"
                      className="input-field"
                      placeholder="student@exam.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-container">
                    <span className="input-icon-prefix"><LockKeyhole size={18} /></span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="input-field"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-pwd-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-actions-row">
                  <label className="remember-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember my email
                  </label>

                  <button
                    type="button"
                    className="forgot-link-btn"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotStep(1);
                      setForgotMessage("");
                      setShowForgotModal(true);
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Authenticating..." : "Sign In to Exam"} <ArrowRight size={18} />
                </button>
              </form>

              <div className="divider-line"><span>OR</span></div>

              <button
                type="button"
                className="btn-outline"
                onClick={() => { setMessage(""); setPage("register"); }}
              >
                Create Student Account
              </button>

              <div className="divider-line"><span>ADMIN ACCESS</span></div>

              <button
                type="button"
                className="btn-outline"
                onClick={() => { setMessage(""); setPage("admin-login"); }}
              >
                Admin Portal Login
              </button>
            </div>
          </section>
        </div>

        {/* FORGOT PASSWORD MODAL */}
        {showForgotModal && (
          <div className="modal-backdrop" onClick={() => setShowForgotModal(false)}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-box">
                <h3>Reset Account Password</h3>
                <button type="button" onClick={() => setShowForgotModal(false)}><X size={20} /></button>
              </div>

              <div className="modal-body-box">
                {forgotMessage && (
                  <div className={`msg-banner ${forgotMessageType === "error" ? "error" : "success"}`}>
                    {forgotMessage}
                  </div>
                )}

                {forgotStep === 1 ? (
                  <form onSubmit={handleSendForgotCode} className="auth-form">
                    <div className="form-group">
                      <label htmlFor="forgot-email-input">Registered Email Address</label>
                      <div className="input-container">
                        <span className="input-icon-prefix"><Mail size={18} /></span>
                        <input
                          id="forgot-email-input"
                          type="email"
                          className="input-field"
                          placeholder="Enter your registered email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary" disabled={forgotLoading}>
                      {forgotLoading ? "Generating Code..." : "Send Verification Code"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPasswordSubmit} className="auth-form">
                    <div className="form-group">
                      <label htmlFor="forgot-code-input">6-Digit Verification Code</label>
                      <input
                        id="forgot-code-input"
                        type="text"
                        className="input-field"
                        style={{ paddingLeft: "1rem", letterSpacing: "0.2em", fontWeight: "700" }}
                        placeholder="123456"
                        maxLength={6}
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="forgot-new-pwd-input">New Password</label>
                      <div className="input-container">
                        <span className="input-icon-prefix"><LockKeyhole size={18} /></span>
                        <input
                          id="forgot-new-pwd-input"
                          type={showForgotNewPassword ? "text" : "password"}
                          className="input-field"
                          placeholder="Min 6 characters"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          className="toggle-pwd-btn"
                          onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        >
                          {showForgotNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={forgotLoading}>
                      {forgotLoading ? "Resetting..." : "Reset Password & Log In"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. ADMIN LOGIN PAGE
  if (page === "admin-login") {
    return (
      <div className="app-container">
        {renderNavbar()}
        {renderToasts()}

        <div className="auth-page">
          <section className="auth-hero-section">
            <div className="auth-hero-glow"></div>
            <div className="auth-hero-content">
              <div className="hero-eyebrow">
                <ShieldCheck size={14} /> Administration & Operations
              </div>
              <h1 className="auth-hero-title">
                Full Control Over
                <br />
                <span>Exams & Audit Logs.</span>
              </h1>
              <p className="auth-hero-desc">
                Manage student records, customize question pools, set exam durations, clear malpractice flags, and generate detailed CSV attempt performance reports.
              </p>
            </div>
          </section>

          <section className="auth-panel-section">
            <div className="auth-card">
              <div className="auth-header">
                <h2>Admin Login</h2>
                <p>Enter administrative credentials to access the command center</p>
              </div>

              {message && <div className="msg-banner error"><AlertTriangle size={16} /> {message}</div>}

              <form onSubmit={handleAdminLogin} className="auth-form">
                <div className="form-group">
                  <label htmlFor="admin-user-input">Admin Username</label>
                  <div className="input-container">
                    <span className="input-icon-prefix"><UserRound size={18} /></span>
                    <input
                      id="admin-user-input"
                      type="text"
                      className="input-field"
                      placeholder="admin"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="admin-pwd-input">Admin Password</label>
                  <div className="input-container">
                    <span className="input-icon-prefix"><LockKeyhole size={18} /></span>
                    <input
                      id="admin-pwd-input"
                      type={showAdminPassword ? "text" : "password"}
                      className="input-field"
                      placeholder="Enter admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-pwd-btn"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                    >
                      {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Authenticating..." : "Sign In to Admin Portal"} <ArrowRight size={18} />
                </button>
              </form>

              <div className="divider-line"><span>OR</span></div>

              <button
                type="button"
                className="btn-outline"
                onClick={() => { setMessage(""); setPage("login"); }}
              >
                Back to Student Login
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // 3. STUDENT REGISTER PAGE
  if (page === "register") {
    return (
      <div className="app-container">
        {renderNavbar()}
        {renderToasts()}

        <div className="auth-page">
          <section className="auth-hero-section">
            <div className="auth-hero-glow"></div>
            <div className="auth-hero-content">
              <div className="hero-eyebrow">
                <GraduationCap size={14} /> Student Onboarding
              </div>
              <h1 className="auth-hero-title">
                Create Your
                <br />
                <span>Student Portal.</span>
              </h1>
              <p className="auth-hero-desc">
                Register with your institutional details to participate in online aptitude tests and access secure examination certificates.
              </p>
            </div>
          </section>

          <section className="auth-panel-section">
            <div className="auth-card">
              <div className="auth-header">
                <h2>Create Account</h2>
                <p>Fill in your candidate details to get started</p>
              </div>

              {message && <div className="msg-banner error"><AlertTriangle size={16} /> {message}</div>}

              <form onSubmit={handleRegister} className="auth-form">
                <div className="form-group">
                  <label htmlFor="reg-name">Full Name</label>
                  <div className="input-container">
                    <span className="input-icon-prefix"><UserRound size={18} /></span>
                    <input
                      id="reg-name"
                      type="text"
                      className="input-field"
                      placeholder="Harish Kumar"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-email">Email Address</label>
                  <div className="input-container">
                    <span className="input-icon-prefix"><Mail size={18} /></span>
                    <input
                      id="reg-email"
                      type="email"
                      className="input-field"
                      placeholder="harish@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-phone">10-Digit Mobile Phone</label>
                  <div className="input-container">
                    <span className="input-icon-prefix"><Phone size={18} /></span>
                    <input
                      id="reg-phone"
                      type="tel"
                      className="input-field"
                      placeholder="9876543210"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      required
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-password">Create Password</label>
                  <div className="input-container">
                    <span className="input-icon-prefix"><LockKeyhole size={18} /></span>
                    <input
                      id="reg-password"
                      type={showRegisterPassword ? "text" : "password"}
                      className="input-field"
                      placeholder="Min 6 characters"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="toggle-pwd-btn"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    >
                      {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-confirm-pwd">Confirm Password</label>
                  <div className="input-container">
                    <span className="input-icon-prefix"><LockKeyhole size={18} /></span>
                    <input
                      id="reg-confirm-pwd"
                      type={showRegisterConfirmPassword ? "text" : "password"}
                      className="input-field"
                      placeholder="Re-enter password"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="toggle-pwd-btn"
                      onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                    >
                      {showRegisterConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Registering..." : "Create Account"} <ArrowRight size={18} />
                </button>
              </form>

              <div className="divider-line"><span>OR</span></div>

              <button
                type="button"
                className="btn-outline"
                onClick={() => { setMessage(""); setPage("login"); }}
              >
                Back to Student Login
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // 4. STUDENT DASHBOARD
  if (page === "dashboard") {
    return (
      <div className="app-container">
        {renderNavbar()}
        {renderToasts()}

        <main className="dashboard-layout">
          <div className="welcome-hero-card">
            <div className="welcome-badge">
              <Wifi size={14} /> ACTIVE EXAMINATION PERIOD
            </div>
            <h1 className="welcome-title">Welcome back, {user?.name || "Student"}! 👋</h1>
            <p className="welcome-sub">
              Your examination portal is active. Review test parameters and rules below before starting.
            </p>
          </div>

          <div className="dashboard-grid">
            <div className="exam-card-main">
              <div className="exam-card-header">
                <div className="exam-card-title">
                  <h3>{exam?.title || "Aptitude Test 2026"}</h3>
                  <p>AI-Based Online Examination Monitoring & Integrity Assessment</p>
                </div>
                <div className="badge badge-success"><CheckCircle2 size={14} /> Ready</div>
              </div>

              <div className="stat-pills-grid">
                <div className="stat-pill-card">
                  <div className="stat-pill-icon"><ClipboardCheck size={20} /></div>
                  <div className="stat-pill-data">
                    <strong>{exam?.total_questions || 30}</strong>
                    <span>Questions</span>
                  </div>
                </div>

                <div className="stat-pill-card">
                  <div className="stat-pill-icon"><Clock3 size={20} /></div>
                  <div className="stat-pill-data">
                    <strong>{exam?.duration_minutes || 30}m</strong>
                    <span>Duration</span>
                  </div>
                </div>

                <div className="stat-pill-card">
                  <div className="stat-pill-icon"><Shuffle size={20} /></div>
                  <div className="stat-pill-data">
                    <strong>Auto</strong>
                    <span>Question Set</span>
                  </div>
                </div>

                <div className="stat-pill-card">
                  <div className="stat-pill-icon"><BarChart3 size={20} /></div>
                  <div className="stat-pill-data">
                    <strong>Mixed</strong>
                    <span>Difficulty</span>
                  </div>
                </div>
              </div>

              <div className="exam-guidelines-box">
                <div className="guidelines-title"><ShieldCheck size={18} color="#6366f1" /> Proctoring & Integrity Guidelines</div>
                <div className="guidelines-grid">
                  <div className="guideline-item"><CheckCircle2 size={16} /> Continuous tab switch & window focus monitoring</div>
                  <div className="guideline-item"><CheckCircle2 size={16} /> Copy-paste and right-click context menu prevention</div>
                  <div className="guideline-item"><CheckCircle2 size={16} /> Random set assignment (Set A, B, C, D) per student</div>
                  <div className="guideline-item"><CheckCircle2 size={16} /> Malpractice disqualification triggers 1-hour exam lockdown</div>
                </div>
              </div>

              {message && <div className="msg-banner error" style={{ marginBottom: "1.5rem" }}><AlertTriangle size={16} /> {message}</div>}

              <button className="btn-primary" onClick={startExam} disabled={loading} style={{ width: "100%", padding: "1rem" }}>
                {loading ? "Launching Exam Environment..." : <>Start Examination Now <Play size={18} fill="currentColor" /></>}
              </button>
            </div>

            <div className="palette-sidebar">
              <div className="palette-title">
                <span>Candidate Information</span>
                <UserRound size={18} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Student Name</span>
                  <strong style={{ fontSize: "0.95rem" }}>{user?.name}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Email</span>
                  <strong style={{ fontSize: "0.95rem" }}>{user?.email}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Phone</span>
                  <strong style={{ fontSize: "0.95rem" }}>{user?.phone || "N/A"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Account Status</span>
                  <span className="badge badge-success"><ShieldCheck size={12} /> Verified Candidate</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 5. EXAMINATION ENGINE PAGE
  if (page === "exam") {
    const q = questions[currentQuestion] || {};
    const answeredCount = Object.keys(answers).length;
    const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    return (
      <div className="exam-interface-layout">
        <header className="exam-sticky-bar">
          <div className="brand-container">
            <div className="brand-icon-box" style={{ width: "32px", height: "32px" }}>
              <ShieldCheck size={18} />
            </div>
            <div className="brand-name" style={{ fontSize: "1.1rem" }}>
              Exam<span>Secure</span>
            </div>
          </div>

          <div className={`proctoring-indicator ${(tabSwitches + copyAttempts + pasteAttempts) > 0 ? "warning" : ""}`}>
            <MonitorCheck size={16} /> Security Engine Active | Violations: {tabSwitches + copyAttempts + pasteAttempts}
          </div>

          <div className={`timer-badge ${timeLeft < 300 ? "warning" : ""}`}>
            <Timer size={18} /> {formatTimeStr(timeLeft)}
          </div>
        </header>

        <div style={{ height: "4px", background: "var(--border-light)", width: "100%" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, var(--primary-500), var(--accent-emerald))", transition: "width 0.3s ease" }}></div>
        </div>


        <main className="exam-content-grid">
          <div className="question-workspace">
            <div>
              <div className="question-header-row">
                <span className="question-number-pill">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span className="category-pill">
                  {q.category || "General Aptitude"} • Set {questionSet || "A"}
                </span>
              </div>

              <div className="question-body-text">
                {q.question_text || "Loading question statement..."}
              </div>

              <div className="options-stack">
                {[
                  ["A", q.option_a],
                  ["B", q.option_b],
                  ["C", q.option_c],
                  ["D", q.option_d]
                ].map(([letter, text]) => (
                  <button
                    key={letter}
                    type="button"
                    className={`option-card-btn ${answers[q.id] === letter ? "selected" : ""}`}
                    onClick={() => selectOption(letter)}
                    disabled={submitting}
                  >
                    <div className="option-left-wrap">
                      <span className="option-key">{letter}</span>
                      <span className="option-text-label">{text}</span>
                    </div>
                    {answers[q.id] === letter && <CheckCircle2 size={20} color="var(--primary-600)" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="question-footer-nav">
              <button
                type="button"
                className="btn-secondary"
                disabled={currentQuestion === 0 || submitting}
                onClick={() => setCurrentQuestion((prev) => prev - 1)}
              >
                <ArrowLeft size={16} /> Previous
              </button>

              <button
                type="button"
                className={`btn-bookmark ${flaggedQuestions[q.id] ? "bookmarked" : ""}`}
                onClick={toggleBookmark}
              >
                <Flag size={16} /> {flaggedQuestions[q.id] ? "Bookmarked" : "Mark for Review"}
              </button>

              {currentQuestion < questions.length - 1 ? (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: "auto", padding: "0.65rem 1.25rem" }}
                  disabled={submitting}
                  onClick={() => setCurrentQuestion((prev) => prev + 1)}
                >
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: "auto", padding: "0.65rem 1.25rem", background: "var(--accent-emerald)" }}
                  disabled={submitting}
                  onClick={() => {
                    if (window.confirm(`You answered ${answeredCount} of ${questions.length} questions. Confirm submit?`)) {
                      handleSubmitExam(false);
                    }
                  }}
                >
                  {submitting ? "Submitting..." : <>Submit Exam <FileCheck2 size={16} /></>}
                </button>
              )}
            </div>
          </div>

          <aside className="palette-sidebar">
            <div className="palette-title">
              <span>Question Palette</span>
              <span className="badge badge-neutral">{answeredCount}/{questions.length} Answered</span>
            </div>

            <div className="palette-legend">
              <div className="legend-item"><span className="legend-dot answered"></span> Answered</div>
              <div className="legend-item"><span className="legend-dot unanswered"></span> Unanswered</div>
              <div className="legend-item"><span className="legend-dot current"></span> Current</div>
              <div className="legend-item"><span className="legend-dot flagged"></span> Bookmarked</div>
            </div>

            <div className="question-grid-numbers">
              {questions.map((item, idx) => {
                const isCurr = idx === currentQuestion;
                const isAns = Boolean(answers[item.id]);
                const isFlag = Boolean(flaggedQuestions[item.id]);

                let cls = "num-btn";
                if (isCurr) cls += " active";
                else if (isFlag) cls += " flagged";
                else if (isAns) cls += " answered";

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cls}
                    onClick={() => setCurrentQuestion(idx)}
                    disabled={submitting}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: "auto", background: "var(--accent-rose)" }}
              onClick={() => {
                if (window.confirm("Submit examination now?")) handleSubmitExam(false);
              }}
            >
              Finish & Submit
            </button>
          </aside>
        </main>
      </div>
    );
  }

  // 6. RESULT PAGE
  if (page === "result" && result) {
    const isDisqualified = result.status === "disqualified" || result.status === "terminated" || result.is_malpractice;
    const score = Number(result.score || 0);
    const total = Number(result.total_questions || 30);
    const percentage = Number(result.percentage || (total > 0 ? (score / total) * 100 : 0)).toFixed(1);

    return (
      <div className="app-container">
        {renderNavbar()}
        {renderToasts()}

        <main className="result-page-layout">
          <div className="result-hero-box">
            {isDisqualified ? (
              <>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--danger-bg)", color: "var(--danger-text)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                  <AlertTriangle size={36} />
                </div>
                <div className="badge badge-danger" style={{ marginBottom: "1rem" }}>DISQUALIFIED DUE TO MALPRACTICE</div>
                <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Result Withheld</h1>
                <p style={{ color: "var(--text-secondary)", maxWidth: "540px", margin: "0 auto 1.5rem" }}>
                  Your exam session recorded security policy violations ({result.malpractice_reason || "Tab switching / copy-paste"}). No score was calculated.
                </p>

                <div className="audit-metrics-row">
                  <div className="audit-card">
                    <span>Tab Switches</span>
                    <strong>{result.tab_switch_count ?? tabSwitches}</strong>
                  </div>
                  <div className="audit-card">
                    <span>Copy-Paste Logs</span>
                    <strong>{result.copy_paste_count ?? (copyAttempts + pasteAttempts)}</strong>
                  </div>
                  <div className="audit-card">
                    <span>Account Status</span>
                    <strong style={{ color: "var(--danger-text)", fontSize: "1rem" }}>1-Hour Lockdown Active</strong>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="score-radial-gauge">
                  <svg className="score-ring-circle" viewBox="0 0 120 120">
                    <circle className="score-ring-bg" cx="60" cy="60" r="50" />
                    <circle
                      className="score-ring-val"
                      cx="60"
                      cy="60"
                      r="50"
                      style={{
                        strokeDasharray: 314,
                        strokeDashoffset: 314 - (314 * percentage) / 100
                      }}
                    />
                  </svg>
                  <div className="score-radial-text">
                    <strong>{percentage}%</strong>
                    <span>Score</span>
                  </div>
                </div>

                <div className="badge badge-success" style={{ marginBottom: "1rem" }}><CheckCircle2 size={14} /> EXAM SUBMITTED</div>
                <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{result.exam_title || "Aptitude Test"}</h1>
                <p style={{ color: "var(--text-secondary)" }}>Great job, {result.student_name || user?.name}! Your performance audit is ready.</p>

                <div className="audit-metrics-row">
                  <div className="audit-card">
                    <span>Marks Obtained</span>
                    <strong>{score} / {total}</strong>
                  </div>
                  <div className="audit-card">
                    <span>Percentage</span>
                    <strong>{percentage}%</strong>
                  </div>
                  <div className="audit-card">
                    <span>Question Set</span>
                    <strong>Set {result.question_set || "A"}</strong>
                  </div>
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem" }}>
              <button type="button" className="btn-outline" onClick={() => window.print()}>
                Print Report
              </button>
              <button type="button" className="btn-primary" style={{ width: "auto" }} onClick={() => setPage("dashboard")}>
                Return to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 7. ADMIN DASHBOARD & MANAGEMENT
  if (page.startsWith("admin")) {
    const filteredStudents = adminStudents.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredExams = adminExams.filter(e =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAttempts = adminAttempts.filter(a =>
      (a.student_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.student_email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.exam_title || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="app-container">
        {renderNavbar()}
        {renderToasts()}

        <main className="admin-layout">
          <div className="admin-header-row">
            <div>
              <div className="badge badge-neutral" style={{ marginBottom: "0.5rem" }}>ADMINISTRATOR PANEL</div>
              <h1 style={{ fontSize: "1.875rem" }}>Control Center</h1>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="button" className={`btn-outline ${page === "admin-dashboard" ? "active" : ""}`} onClick={() => setPage("admin-dashboard")}>
                Dashboard
              </button>
              <button type="button" className={`btn-outline ${page === "admin-students" ? "active" : ""}`} onClick={() => { setPage("admin-students"); loadAdminStudents(); }}>
                Students
              </button>
              <button type="button" className={`btn-outline ${page === "admin-exams" ? "active" : ""}`} onClick={() => { setPage("admin-exams"); loadAdminExams(); }}>
                Exams
              </button>
              <button type="button" className={`btn-outline ${page === "admin-reports" ? "active" : ""}`} onClick={() => { setPage("admin-reports"); loadAdminAttempts(); }}>
                Attempt Reports
              </button>
            </div>
          </div>

          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrap"><GraduationCap size={22} /></div>
              <div><span>Total Students</span><strong>{adminStats.total_students}</strong></div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrap"><ClipboardCheck size={22} /></div>
              <div><span>Total Exams</span><strong>{adminStats.total_exams}</strong></div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrap"><MonitorCheck size={22} /></div>
              <div><span>Active Exams</span><strong>{adminStats.active_exams}</strong></div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrap"><BarChart3 size={22} /></div>
              <div><span>Total Attempts</span><strong>{adminStats.total_attempts}</strong></div>
            </div>

            <div className="admin-stat-card">
              <div className={`admin-stat-icon-wrap ${adminStats.total_violations > 0 ? "danger" : ""}`}><AlertTriangle size={22} /></div>
              <div><span>Violations Flagged</span><strong style={{ color: adminStats.total_violations > 0 ? "var(--danger-text)" : "inherit" }}>{adminStats.total_violations}</strong></div>
            </div>
          </div>

          {/* ADMIN SUB-PAGE: STUDENTS */}
          {page === "admin-students" && (
            <div className="admin-table-container">
              <div className="table-toolbar">
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button type="button" className="btn-primary" style={{ width: "auto" }} onClick={() => { setEditingStudentId(null); setStudentForm({ name: "", email: "", phone: "", password: "" }); }}>
                  <Plus size={16} /> Add Student
                </button>
              </div>

              <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-light)", background: "var(--bg-card-secondary)" }}>
                <form onSubmit={saveStudent} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr) auto", gap: "0.75rem", alignItems: "center" }}>
                  <input type="text" className="input-field" placeholder="Student Name" value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} required />
                  <input type="email" className="input-field" placeholder="Email" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} required />
                  <input type="tel" className="input-field" placeholder="Phone" value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} />
                  {!editingStudentId && <input type="password" className="input-field" placeholder="Password" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} required />}
                  <button type="submit" className="btn-primary" style={{ width: "auto" }} disabled={adminFormLoading}>
                    {editingStudentId ? "Update" : "Save"}
                  </button>
                </form>
              </div>

              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No students registered.</td></tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id}>
                        <td>#{s.id}</td>
                        <td><strong>{s.name}</strong></td>
                        <td>{s.email}</td>
                        <td>{s.phone || "N/A"}</td>
                        <td>{s.created_at ? new Date(s.created_at).toLocaleDateString() : "N/A"}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button type="button" className="btn-outline" style={{ padding: "0.3rem 0.6rem" }} onClick={() => { setEditingStudentId(s.id); setStudentForm({ name: s.name, email: s.email, phone: s.phone || "", password: "" }); }}>
                              <Edit3 size={14} />
                            </button>
                            <button type="button" className="nav-btn nav-btn-danger" style={{ padding: "0.3rem 0.6rem" }} onClick={() => deleteStudent(s.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ADMIN SUB-PAGE: EXAMS */}
          {page === "admin-exams" && (
            <div className="admin-table-container">
              <div className="table-toolbar">
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search exams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-light)", background: "var(--bg-card-secondary)" }}>
                <form onSubmit={saveExam} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "0.75rem", alignItems: "center" }}>
                  <input type="text" className="input-field" placeholder="Exam Title" value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} required />
                  <input type="number" className="input-field" placeholder="Questions" value={examForm.total_questions} onChange={(e) => setExamForm({ ...examForm, total_questions: e.target.value })} required />
                  <input type="number" className="input-field" placeholder="Duration (mins)" value={examForm.duration_minutes} onChange={(e) => setExamForm({ ...examForm, duration_minutes: e.target.value })} required />
                  <select className="input-field" value={examForm.is_active} onChange={(e) => setExamForm({ ...examForm, is_active: Number(e.target.value) })}>
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                  <button type="submit" className="btn-primary" style={{ width: "auto" }} disabled={adminFormLoading}>
                    {editingExamId ? "Update Exam" : "Create Exam"}
                  </button>
                </form>
              </div>

              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Questions</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.map((e) => (
                    <tr key={e.id}>
                      <td>#{e.id}</td>
                      <td><strong>{e.title}</strong></td>
                      <td>{e.total_questions}</td>
                      <td>{e.duration_minutes} mins</td>
                      <td>
                        <span className={`badge ${Number(e.is_active) ? "badge-success" : "badge-neutral"}`}>
                          {Number(e.is_active) ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{e.created_at ? new Date(e.created_at).toLocaleDateString() : "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ADMIN SUB-PAGE: ATTEMPT REPORTS */}
          {page === "admin-reports" && (
            <div className="admin-table-container">
              <div className="table-toolbar">
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search candidate name or exam..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <button type="button" className="btn-primary" style={{ width: "auto" }} onClick={exportAttemptsCSV}>
                  <Download size={16} /> Export Reports CSV
                </button>
              </div>

              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Attempt ID</th>
                    <th>Student Name</th>
                    <th>Exam Title</th>
                    <th>Set</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Tab Switches</th>
                    <th>Copy/Paste</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttempts.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No attempt records found.</td></tr>
                  ) : (
                    filteredAttempts.map((a) => (
                      <tr key={a.attempt_id}>
                        <td>#{a.attempt_id}</td>
                        <td>
                          <strong>{a.student_name}</strong>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>{a.student_email}</span>
                        </td>
                        <td>{a.exam_title}</td>
                        <td><span className="badge badge-neutral">Set {a.question_set}</span></td>
                        <td>{a.score}/{a.total_questions}</td>
                        <td><strong>{Number(a.percentage || 0).toFixed(1)}%</strong></td>
                        <td>
                          {(a.tab_switch_count || 0) > 0 ? (
                            <span className="badge badge-danger"><AlertTriangle size={12} /> {a.tab_switch_count} Switches</span>
                          ) : (
                            <span className="badge badge-success"><Check size={12} /> 0</span>
                          )}
                        </td>
                        <td>
                          {(a.copy_paste_count || 0) > 0 ? (
                            <span className="badge badge-danger"><AlertTriangle size={12} /> {a.copy_paste_count} Copy/Paste</span>
                          ) : (
                            <span className="badge badge-success"><Check size={12} /> 0</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${a.status === "disqualified" ? "badge-danger" : "badge-success"}`}>
                            {a.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            {a.status !== "disqualified" && (
                              <button type="button" className="nav-btn nav-btn-danger" style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem" }} onClick={() => cancelAttemptAdmin(a.attempt_id)}>
                                Disqualify
                              </button>
                            )}
                            {a.malpractice_reason && (
                              <button type="button" className="btn-outline" style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem" }} onClick={() => clearAttemptFlagAdmin(a.attempt_id)}>
                                Clear Flag
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    );
  }

  return null;
}

export default App;
