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
// @desc    Update a course
// @route   PUT /api/courses/:id
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Security check: Make sure the logged-in user owns this course
    if (course.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to update this course' });
    }

    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Returns the newly updated document instead of the old one
    });

    res.status(200).json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Security check: Make sure the logged-in user owns this course
    if (course.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to delete this course' });
    }

    await course.deleteOne();

    // Return the ID of the deleted course so the frontend can remove it from the UI
    res.status(200).json({ id: req.params.id }); 
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};