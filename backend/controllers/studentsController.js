const DIRECTUS_API = `${process.env.DIRECTUS_URL}/items/students`;

const getStudentsBySection = async (req, res) => {
  try {
    const { section_id } = req.params;
    const response = await fetch(
      `${DIRECTUS_API}?filter[section_id][_eq]=${section_id}`
    );
    const json = await response.json();
    res.json({ data: json.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

const createStudent = async (req, res) => {
  try {
    const { name, gender, section_id, teacher_id } = req.body;

    if (!name || !gender || !section_id) {
      return res.status(400).json({ error: "name, gender, at section_id ay required" });
    }

    const response = await fetch(DIRECTUS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, gender, section_id, teacher_id }),
    });
    const json = await response.json();
    res.status(201).json({ data: json.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create student" });
  }
};

module.exports = { getStudentsBySection, createStudent };