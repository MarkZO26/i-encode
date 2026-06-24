const DIRECTUS_API = `${process.env.DIRECTUS_URL}/items/sections`;
const STUDENTS_API = `${process.env.DIRECTUS_URL}/items/students`;

const getSections = async (req, res) => {
  try {
    const teacher_id = req.query.teacher_id;

    if (!teacher_id) {
      return res.status(400).json({ error: "teacher_id is required" });
    }

    const response = await fetch(
      `${DIRECTUS_API}?filter[teacher_id][_eq]=${teacher_id}`
    );
    const json = await response.json();
    res.json({ data: json.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sections" });
  }
};

const createSection = async (req, res) => {
  try {
    const { section_name, grade_level, teacher_id } = req.body;

    if (!section_name || !grade_level) {
      return res.status(400).json({ error: "section_name and grade_level are required" });
    }

    const response = await fetch(DIRECTUS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_name, grade_level, teacher_id }),
    });
    const json = await response.json();
    res.status(201).json({ data: json.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create section" });
  }
};

const updateSection = async (req, res) => {
  try {
    const { section_name, grade_level } = req.body;

    const response = await fetch(`${DIRECTUS_API}/${req.params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_name, grade_level }),
    });
    const json = await response.json();
    res.json({ data: json.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update section" });
  }
};

const deleteSection = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Hanapin lahat ng students ng section na ito
    const studentsRes = await fetch(
      `${STUDENTS_API}?filter[section_id][_eq]=${id}&fields=id`
    );
    const studentsJson = await studentsRes.json();
    const students = studentsJson.data || [];

    // 2. Kung may students — batch delete
    if (students.length > 0) {
      const studentIds = students.map((s) => s.id);
      await fetch(STUDENTS_API, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentIds),
      });
    }

    // 3. I-delete na ang section
    await fetch(`${DIRECTUS_API}/${id}`, { method: "DELETE" });

    res.json({ message: "Section at lahat ng students ay na-delete." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete section" });
  }
};

module.exports = { getSections, createSection, updateSection, deleteSection };