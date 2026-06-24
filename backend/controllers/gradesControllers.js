const DIRECTUS_API = `${process.env.DIRECTUS_URL}/items/grades`;

const getGrades = async (req, res) => {
  try {
    const { section_id, quarter } = req.query;
    if (!section_id || !quarter) {
      return res.status(400).json({ error: "section_id and quarter are required" });
    }

    // Ginamit natin ang URLSearchParams para sa malinis at ligtas na query parameters.
    // Binago ang 'filter[activity_id.quarter]' at ginawang 'filter[activity_id][quarter]' 
    // dahil hindi tinatanggap ng Directus ang dot notation sa pag-filter ng relations.
    const queryParams = new URLSearchParams({
      'fields': '*,activity_id.*',
      'filter[section_id][_eq]': section_id,
      'filter[activity_id][quarter][_eq]': quarter
    });

    const response = await fetch(`${DIRECTUS_API}?${queryParams.toString()}`);
    
    if (!response.ok) {
      const errText = await response.text();
      console.error("Directus Fetch Error:", errText);
      return res.status(response.status).json({ error: "Failed to fetch from Directus" });
    }

    const json = await response.json();
    res.json({ data: json.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
};

const upsertGrade = async (req, res) => {
  try {
    const { student_id, section_id, activity_id, score } = req.body;

    if (!student_id || !section_id || !activity_id || score === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Pwede kasing ibalik ng Directus ang activity_id bilang Object (may .id) 
    // o bilang plain String/ID depende sa fetch state ng frontend. 
    // Sinasiguro natin dito na primitive ID lang ang gagamitin sa pag-filter at pag-save.
    const cleanActivityId = typeof activity_id === 'object' ? activity_id.id : activity_id;

    // Check kung may existing grade na gamit ang malinis na params
    const checkParams = new URLSearchParams({
      'filter[student_id][_eq]': student_id,
      'filter[activity_id][_eq]': cleanActivityId
    });

    const checkRes = await fetch(`${DIRECTUS_API}?${checkParams.toString()}`);
    const checkJson = await checkRes.json();
    const existing = checkJson.data?.[0];

    let response;
    if (existing) {
      // UPDATE (PATCH)
      // Bukod sa score, isinasama natin ang structural fields para masiguradong
      // hindi mawawala ang relational integrity ng data row sa Directus tracking.
      response = await fetch(`${DIRECTUS_API}/${existing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          score: Number(score),
          student_id,
          section_id,
          activity_id: cleanActivityId
        }),
      });
    } else {
      // CREATE (POST)
      response = await fetch(DIRECTUS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          student_id, 
          section_id, 
          activity_id: cleanActivityId, 
          score: Number(score) 
        }),
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Directus Save Error Details:", errText);
      return res.status(response.status).json({ error: "Directus rejected the database write operation" });
    }

    const json = await response.json();
    res.status(200).json({ data: json.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upsert grade" });
  }
};

module.exports = { getGrades, upsertGrade };