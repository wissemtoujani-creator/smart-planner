import OpenAI from 'openai';
import Task from '../models/Task.js';
import ScheduleEntry from '../models/scheduleModel.js';
// @desc    Generate AI Schedule for logged-in user (Smart/Adaptive Version)
// @route   POST /api/schedule/generate
// @access  Private
export const generateSchedule = async (req, res) => {
  try {
    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const userId = req.user._id;

    // 1. Fetch incomplete tasks and existing schedule entries
    const tasks = await Task.find({ user: userId, completed: false });
    const existingEntries = await ScheduleEntry.find({ user: userId });

    if (tasks.length === 0) {
      return res.status(400).json({ message: 'No incomplete tasks found to schedule.' });
    }

    const formattedTasks = [];

    // 2. Calculate remaining hours for each task based on what's already Completed
    tasks.forEach(task => {
      const completedHours = existingEntries
        .filter(entry => entry.task.toString() === task._id.toString() && entry.status === 'completed')
        .reduce((sum, entry) => sum + entry.allocatedHours, 0);

      const remainingHours = task.estimatedHours - completedHours;

      // Only pass tasks to the AI that still need time scheduled
      if (remainingHours > 0) {
        formattedTasks.push({
          taskId: task._id.toString(),
          title: task.title,
          deadline: task.deadline.toISOString().split('T')[0],
          remainingHours: remainingHours, // Use remaining instead of estimated!
          priority: task.priority,
        });
      }
    });

    if (formattedTasks.length === 0) {
      return res.status(400).json({ message: 'All tasks have enough completed hours allocated! No new schedule needed.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // ... (Keep the top part of the function the same)

    const prompt = `
You are an intelligent study planner AI.
Today's date is ${todayStr}.

Given the following list of tasks, construct an optimized day-by-day study schedule starting from today (${todayStr}).

Rules:
1. Spread out work reasonably across days (max ~4-6 hours total per day).
2. Respect deadlines and prioritize tasks due sooner or marked high priority.
3. Every task must have its "remainingHours" fully allocated across one or more dates before its deadline.
4. Return ONLY valid JSON adhering strictly to this schema:

{
  "explanation": "A friendly 1-2 sentence explanation speaking directly to the user about why you ordered their schedule this way (e.g. mentioning priorities or deadlines).",
  "schedule": [
    {
      "taskId": "string",
      "date": "YYYY-MM-DD",
      "allocatedHours": number
    }
  ]
}

Tasks needing schedule allocation:
${JSON.stringify(formattedTasks, null, 2)}
`;

    // 3. Request structured completion from Groq using Llama 3.1
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a precise JSON-only study scheduling assistant. You only output raw, valid JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const aiContent = JSON.parse(response.choices[0].message.content);
    const proposedEntries = aiContent.schedule || [];
    const explanation = aiContent.explanation || "I have updated your schedule!"; // <-- Extract the explanation

    // 4. Delete old Pending/Missed entries, but KEEP Completed entries for history!
    await ScheduleEntry.deleteMany({ 
      user: userId, 
      aiGenerated: true,
      status: { $ne: 'completed' } 
    });

    // 5. Insert new entries
    const entriesToSave = proposedEntries.map((entry) => ({
      user: userId,
      task: entry.taskId,
      date: new Date(entry.date),
      allocatedHours: entry.allocatedHours,
      aiGenerated: true,
      status: 'pending'
    }));

    await ScheduleEntry.insertMany(entriesToSave);

    // 6. Return both the schedule AND the explanation as an object!
    const populatedEntries = await ScheduleEntry.find({ user: userId })
      .populate('task', 'title priority color deadline')
      .sort({ date: 1 });

    res.status(200).json({ schedule: populatedEntries, explanation }); // <-- Updated response!
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ message: 'Failed to generate AI schedule.', error: error.message });
  }
};

// @desc    Get current schedule for logged-in user
// @route   GET /api/schedule
// @access  Private
export const getSchedule = async (req, res) => {
  try {
    const schedule = await ScheduleEntry.find({ user: req.user._id })
      .populate('task', 'title priority color deadline completed')
      .sort({ date: 1 });

    res.status(200).json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch schedule.' });
  }
};
// @desc    Update schedule entry status
// @route   PUT /api/schedule/:id
// @access  Private
export const updateScheduleEntry = async (req, res) => {
  try {
    const { status } = req.body;
    const entry = await ScheduleEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Schedule entry not found' });
    }

    // Security check: Ensure the logged-in user actually owns this schedule entry
    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this entry' });
    }

    // Update the status and save
    entry.status = status || entry.status;
    const updatedEntry = await entry.save();
    
    // Return the updated entry with populated task data for the React frontend
    const populatedEntry = await ScheduleEntry.findById(updatedEntry._id)
      .populate('task', 'title priority color deadline');
    
    res.status(200).json(populatedEntry);
  } catch (error) {
    console.error('Update Entry Error:', error);
    res.status(500).json({ message: 'Failed to update schedule entry.' });
  }
};