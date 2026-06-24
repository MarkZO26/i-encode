const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // 1. I-require ang JWT

const login = async (req, res) => {
  const { email, password } = req.body;
  const DIRECTUS_API = `${process.env.DIRECTUS_URL}/items/teachers_account`;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email at password ay required." });
  }

  try {
    const response = await fetch(
      `${DIRECTUS_API}?filter[teacher_email][_eq]=${encodeURIComponent(email)}`,
      { headers: { "Authorization": `Bearer ${process.env.DIRECTUS_TOKEN}` } }
    );
    const result = await response.json();

    if (!result.data || result.data.length === 0) {
      return res.status(401).json({ success: false, message: "Mali ang email o password." });
    }

    const teacher = result.data[0];
    const isMatch = await bcrypt.compare(password, teacher.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Mali ang email o password." });
    }

    // 2. GUMAWA NG TOKEN
    // Ang 'JWT_SECRET' ay dapat nasa .env file mo (kahit anong mahabang random string)
    const token = jwt.sign(
      { id: teacher.id, email: teacher.teacher_email }, 
      process.env.JWT_SECRET || "fallback_secret_key", 
      { expiresIn: "1d" } // Mag-eexpire ang login after 1 day
    );

    // 3. I-RETURN ANG TOKEN SA DATA
    res.status(200).json({
      success: true,
      message: "Login Successful",
      token: token
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server error sa login." });
  }
};

module.exports = { login };