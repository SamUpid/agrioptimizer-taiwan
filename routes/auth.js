const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET /login - renders login.ejs
router.get("/login", (req, res) => {
  res.render("login", {
    title: "Sign In 登入",
    page: "auth",
  });
});

// GET /signup - renders signup.ejs
router.get("/signup", (req, res) => {
  res.render("signup", {
    title: "Create Account 建立帳號",
    page: "auth",
  });
});

// POST /signup
router.post("/signup", async (req, res) => {
  try {
    const { name, nameZh, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "Email already registered");
      return res.redirect("/auth/signup");
    }

    const user = await User.create({
      name,
      nameZh,
      email,
      password,
    });

    req.session.user = {
      _id: user._id,
      name: user.name,
      nameZh: user.nameZh,
      email: user.email,
    };
    req.flash("success", "Account created! Please set your farm location.");
    res.redirect("/location");
  } catch (error) {
    console.error("Signup error:", error);
    req.flash("error", `Signup failed: ${error.message}`);
    res.redirect("/auth/signup");
  }
});

// POST /login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      req.flash("error", "Invalid email or password 電子郵件或密碼錯誤");
      return res.redirect("/auth/login");
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      nameZh: user.nameZh,
      email: user.email,
    };
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    req.flash("error", `Login failed: ${error.message}`);
    res.redirect("/auth/login");
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

module.exports = router;