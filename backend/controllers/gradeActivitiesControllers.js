const DIRECTUS_API = `${process.env.DIRECTUS_URL}/items/grade_activities`;

const getGradeActivities = async (req, res) => {
  try {
    const { section_id, quarter } = req.query;
    if (!section_id || !quarter) {
      return res.status(400).json({ error: "section_id and quarter are required" });
    }

    const response = await fetch(
      `${DIRECTUS_API}?filter[section_id][_eq]=${section_id}&filter[quarter][_eq]=${encodeURIComponent(quarter)}&sort=activity_index`
    );
    const json = await response.json();
    res.json({ data: json.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch grade activities" });
  }
};

const createGradeActivity = async (req, res) => {
  try {
    const { section_id, teacher_id, quarter, type, activity_index, hps } = req.body;

    if (!section_id || !quarter || !type || activity_index === undefined || !hps) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const response = await fetch(DIRECTUS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_id, teacher_id, quarter, type, activity_index, hps }),
    });
    const json = await response.json();
    res.status(201).json({ data: json.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create grade activity" });
  }
};

module.exports = { getGradeActivities, createGradeActivity };