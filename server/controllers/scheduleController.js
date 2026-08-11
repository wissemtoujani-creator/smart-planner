import OpenAI from 'openai';
import Task from '../models/Task.js';
import ScheduleEntry from '../models/scheduleModel.js';

// @desc    Generate AI Schedule for logged-in user
// @route   POST /api/schedule/generate
// @access  Private
export const generateSchedule = async (req, res) => {
  try {
    // Initialize OpenAI SDK but point it at Groq's Llama endpoint!
    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const userId = req.user._id;

    // 1. Fetch incomplete tasks for this user
    const tasks = await Task.find({ user: userId, completed: false });

    if (tasks.length === 0) {
      return res.status(400).json({ message: 'No incomplete tasks found to schedule.' });
    }

    const formattedTasks = tasks.map((task) => ({
      taskId: task._id.toString(),
      title: task.title,
      deadline: task.deadline.toISOString().split('T')[0],
      estimatedHours: task.estimatedHours,
      priority: task.priority,
    }));

    const todayStr = new Date().toISOString().split('T')[0];

    const prompt = `
You are an intelligent study planner AI.
Today's date is ${todayStr}.

Given the following list of tasks with deadlines, estimated hours, and priorities, construct an optimized day-by-day study schedule starting from today (${todayStr}).

Rules:
1. Spread out work reasonably across days so the student doesn't burn out (max ~4-6 hours total per day across all tasks).
2. Respect hard deadlines—prioritize tasks due sooner or marked high priority.
3. Every task must have its required total estimated hours fully allocated across one or more dates before its deadline.
4. Return ONLY valid JSON adhering strictly to this schema:

{
  "schedule": [
    {
      "taskId": "string",
      "date": "YYYY-MM-DD",
      "allocatedHours": number
    }
  ]
}

Tasks to schedule:
${JSON.stringify(formattedTasks, null, 2)}
`;

    // 3. Request structured completion from Groq using Llama 3
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

    // 4. Delete old AI schedule entries for this user before saving the new plan
    await ScheduleEntry.deleteMany({ user: userId, aiGenerated: true });

    // 5. Map entries to database documents and insert them
    const entriesToSave = proposedEntries.map((entry) => ({
      user: userId,
      task: entry.taskId,
      date: new Date(entry.date),
      allocatedHours: entry.allocatedHours,
      aiGenerated: true,
    }));

    const savedEntries = await ScheduleEntry.insertMany(entriesToSave);

    const populatedEntries = await ScheduleEntry.find({ user: userId })
      .populate('task', 'title priority color deadline')
      .sort({ date: 1 });

    res.status(200).json(populatedEntries);
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