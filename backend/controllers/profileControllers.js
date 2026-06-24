const getProfile = async (req, res) => {
  const { id } = req.params; 
  const DIRECTUS_URL = process.env.DIRECTUS_URL;

  try {
    // Kinukuha natin ang info base sa relation field na 'teacher_account'
    const response = await fetch(
      `${DIRECTUS_URL}/items/teachers_info?filter[teacher_account][_eq]=${id}`,
      {
        headers: { "Authorization": `Bearer ${process.env.DIRECTUS_TOKEN}` }
      }
    );

    const result = await response.json();

    if (result.data && result.data.length > 0) {
      // Ibinabalik ang record (fullname, gender, etc.)
      res.status(200).json({ 
        success: true, 
        data: result.data[0] 
      });
    } else {
      res.status(404).json({ success: false, message: "Profile details not found." });
    }
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching profile." });
  }
};

module.exports = { getProfile };