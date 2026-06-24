const express = require("express");
const router = express.Router();

const { signup } = require("../controllers/signupControllers");
const { login } = require("../controllers/loginControllers");
const { getProfile } = require("../controllers/profileControllers");
const { getSections, createSection, updateSection, deleteSection } = require("../controllers/sectionsControllers");
const { getStudentsBySection, createStudent } = require("../controllers/studentsController"); 
const { getGradeActivities, createGradeActivity } = require("../controllers/gradeActivitiesControllers");
const { getGrades, upsertGrade } = require("../controllers/gradesControllers");


// Auth
router.post("/signup", signup);
router.post("/login", login);
router.get("/profile/:id", getProfile);

// Sections
router.get("/sections", getSections);
router.post("/sections", createSection);
router.patch("/sections/:id", updateSection);
router.delete("/sections/:id", deleteSection);

// Students 👇
router.get("/students/:section_id", getStudentsBySection);
router.post("/students", createStudent);

// Grade Activities
router.get("/grade-activities", getGradeActivities);
router.post("/grade-activities", createGradeActivity);

// Grades
router.get("/grades", getGrades);
router.post("/grades", upsertGrade);

module.exports = router;