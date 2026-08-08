import Task from '../models/Task.js';

// @desc    Get all tasks for the logged-in user
// @route   GET /api/tasks
export const getTasks = async (req, res) => {
  try {
    // Fetch tasks and include the associated course data
    const tasks = await Task.find({ user: req.user.id }).populate('course', 'title color');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { title, description, deadline, estimatedHours, priority, course } = req.body;

    // Validate required fields
    if (!title || !deadline || !estimatedHours) {
      return res.status(400).json({ message: 'Title, deadline, and estimated hours are required' });
    }

    const task = await Task.create({
      title,
      description,
      deadline,
      estimatedHours,
      priority,
      course, // Optional: links to a Course ID
      user: req.user.id, // From the protect middleware
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};