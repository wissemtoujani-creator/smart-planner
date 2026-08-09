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
// @desc    Update a task (e.g., marking it as complete)
// @route   PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check for user ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check for user ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await task.deleteOne();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};