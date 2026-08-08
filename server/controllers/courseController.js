import Course from '../models/Course.js';

// @desc    Get all courses for the logged-in user
// @route   GET /api/courses
export const getCourses = async (req, res) => {
  try {
    // Find all courses where the 'user' field matches the logged-in user's ID
    const courses = await Course.find({ user: req.user.id });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new course
// @route   POST /api/courses
export const createCourse = async (req, res) => {
  try {
    const { title, code, color } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Course title is required' });
    }

    const course = await Course.create({
      title,
      code,
      color,
      user: req.user.id, // Attached by the 'protect' middleware
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};