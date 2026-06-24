const bcrypt = require("bcryptjs");

const signup = async (req, res) => {
  // 1. Kunin ang mga fields mula sa request body
  // Pinalitan ang advisory ng gender
  const { email, password, fullName, gender } = req.body;
  
  const ACCOUNT_API = `${process.env.DIRECTUS_URL}/items/teachers_account`;
  const INFO_API = `${process.env.DIRECTUS_URL}/items/teachers_info`;

  try {
    // 2. Validation for Gmail
    if (!email || !email.toLowerCase().endsWith("@gmail.com")) {
      return res.status(400).json({
        success: false,
        message: "Gmail accounts lamang (@gmail.com) ang pinapayagan."
      });
    }

    // Basic validation para sa mga bagong fields
    if (!fullName || !gender) {
      return res.status(400).json({
        success: false,
        message: "Mangyaring punan ang Full Name at Gender."
      });
    }

    // 3. Check if email already exists sa teachers_account
    const checkResponse = await fetch(
      `${ACCOUNT_API}?filter[teacher_email][_eq]=${email.toLowerCase()}`,
      { headers: { "Authorization": `Bearer ${process.env.DIRECTUS_TOKEN}` } }
    );
    const checkResult = await checkResponse.json();

    if (checkResult.data && checkResult.data.length > 0) {
      return res.status(409).json({ success: false, message: "Ang email na ito ay registered na." });
    }

    // 4. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create the Account (teachers_account)
    const accountResponse = await fetch(ACCOUNT_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DIRECTUS_TOKEN}`
      },
      body: JSON.stringify({
        teacher_email: email.toLowerCase(),
        password: hashedPassword,
        status: "verified"
      }),
    });

    const accountData = await accountResponse.json();

    if (!accountResponse.ok) {
      return res.status(accountResponse.status).json({ 
        success: false, 
        message: "Failed to create teacher account." 
      });
    }

    // 6. Create the Info (teachers_info)
    // Dito natin gagamitin ang ID mula sa accountData.data.id para sa One-to-One relation
    const teacherAccountId = accountData.data.id;

    const infoResponse = await fetch(INFO_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DIRECTUS_TOKEN}`
      },
      body: JSON.stringify({
        teacher_account: teacherAccountId, // Relation field sa Directus
        fullname: fullName,                // Siguraduhing 'fullname' ang Field ID sa Directus
        gender: gender                     // Siguraduhing 'gender' ang Field ID sa Directus
      }),
    });

    if (infoResponse.ok) {
      res.status(201).json({ 
        success: true, 
        message: "Teacher registration and info saved successfully!" 
      });
    } else {
      // Logic para hindi maiwan ang "floating" account kung sakaling mag-fail ang info creation
      // (Optional: Pwedeng mag-add ng DELETE request dito para sa accountData.data.id)
      res.status(500).json({ 
        success: false, 
        message: "Account created but failed to save profile details." 
      });
    }

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ success: false, message: "Error sa signup logic." });
  }
};

module.exports = { signup };