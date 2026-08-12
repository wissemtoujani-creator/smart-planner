import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import AddCourseModal from '../components/AddCourseModal';
import AddTaskModal from '../components/AddTaskModal';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
const Dashboard = () => {
  const { user, logoutUser } = useContext(AuthContext);
  
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState([]); // <-- New state for AI schedule
  const [aiMessage, setAiMessage] = useState('');
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false); // <-- Loading state for AI

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });

  useEffect(() => {
    const fetchPlannerData = async () => {
      try {
        // Fetch all three datasets concurrently
        const [courseRes, taskRes, scheduleRes] = await Promise.all([
          axios.get('http://localhost:8000/api/courses', getAuthHeaders()),
          axios.get('http://localhost:8000/api/tasks', getAuthHeaders()),
          axios.get('http://localhost:8000/api/schedule', getAuthHeaders()) // <-- Fetch schedule
        ]);
        setCourses(courseRes.data);
        setTasks(taskRes.data);
        setSchedule(scheduleRes.data);
      } catch (err) {
        setError('Failed to fetch data. Please try again.');
        console.error(err);
      }
    };
    fetchPlannerData();
  }, [user.token]);

  const handleCourseAdded = (newCourse) => setCourses((prev) => [...prev, newCourse]);
  const handleTaskAdded = (newTask) => setTasks((prev) => [...prev, newTask]);
  const handleStatusUpdate = async (entryId, newStatus) => {
    try {
      // Use your existing getAuthHeaders() function!
      const response = await axios.put(
        `http://localhost:8000/api/schedule/${entryId}`,
        { status: newStatus },
        getAuthHeaders() 
      );

      const updatedEntry = response.data;

      // Update local state immediately so UI refreshes without reload
      setSchedule((prevSchedule) =>
        prevSchedule.map((item) =>
          item._id === updatedEntry._id ? updatedEntry : item
        )
      );
    } catch (error) {
      console.error('Failed to update entry status:', error);
      alert('Failed to update status. Check your browser console for details.'); // Added this so it doesn't fail silently!
    }
  };
  const deleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/courses/${id}`, getAuthHeaders());
      setCourses(courses.filter((course) => course._id !== id));
    } catch (err) {
      console.error('Failed to delete course', err);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/tasks/${id}`, getAuthHeaders());
      setTasks(tasks.filter((task) => task._id !== id));
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const toggleTaskComplete = async (task) => {
    try {
      const updatedData = { completed: !task.completed };
      const response = await axios.put(`http://localhost:8000/api/tasks/${task._id}`, updatedData, getAuthHeaders());
      setTasks(tasks.map((t) => (t._id === task._id ? response.data : t)));
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  // --- NEW: Ask AI to generate schedule ---
  const generateAISchedule = async () => {
    setIsGenerating(true);
    setError('');
    setAiMessage(''); // Clear old message
    try {
      const response = await axios.post('http://localhost:8000/api/schedule/generate', {}, getAuthHeaders());
      setSchedule(response.data.schedule);       // <-- Extract schedule array
      setAiMessage(response.data.explanation);   // <-- Extract AI message
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate schedule.');
    } finally {
      setIsGenerating(false);
    }
  };
  // --- NEW: Process data for the Recharts Bar Chart ---
  const getChartData = () => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dataMap = {};

    schedule.forEach(entry => {
      const date = new Date(entry.date);
      // Format the label to look like "Mon 12"
      const dayName = daysOfWeek[date.getDay()];
      const formattedDate = `${dayName} ${date.getDate()}`;

      // Initialize the day if it doesn't exist yet
      if (!dataMap[formattedDate]) {
        dataMap[formattedDate] = { name: formattedDate, Completed: 0, Pending: 0, Missed: 0 };
      }

      // Add the hours to the correct status category
      if (entry.status === 'completed') {
        dataMap[formattedDate].Completed += entry.allocatedHours;
      } else if (entry.status === 'missed') {
        dataMap[formattedDate].Missed += entry.allocatedHours;
      } else {
        dataMap[formattedDate].Pending += entry.allocatedHours;
      }
    });

    // Convert our grouped object back into an array for Recharts
    return Object.values(dataMap);
  };

  const chartData = getChartData();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Smart Planner</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={generateAISchedule}
            disabled={isGenerating}
            className={`${
              isGenerating ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
            } text-white font-bold px-4 py-2 rounded transition shadow-md flex items-center gap-2`}
          >
            {isGenerating ? '✨ AI is thinking...' : '✨ Generate Smart Schedule'}
          </button>
          <button
            onClick={logoutUser}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4 bg-red-50 p-3 rounded">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Courses Column (Unchanged) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">My Courses</h2>
            <button onClick={() => setIsCourseModalOpen(true)} className="text-blue-600 hover:text-blue-800 text-sm font-bold bg-blue-50 px-3 py-1 rounded">
              + Add Course
            </button>
          </div>
          {courses.length === 0 ? (
            <p className="text-gray-500 italic">No courses added yet.</p>
          ) : (
            <ul className="space-y-3">
              {courses.map((course) => (
                <li key={course._id} className="p-4 border rounded-md bg-gray-50 flex justify-between items-center" style={{ borderLeft: `5px solid ${course.color}` }}>
                  <div>
                    <h3 className="font-bold text-gray-800">{course.title}</h3>
                    <p className="text-sm text-gray-600">{course.code}</p>
                  </div>
                  <button onClick={() => deleteCourse(course._id)} className="text-red-400 hover:text-red-600 transition" title="Delete Course">🗑️</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tasks Column (Unchanged) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">My Tasks</h2>
            <button onClick={() => setIsTaskModalOpen(true)} className="text-blue-600 hover:text-blue-800 text-sm font-bold bg-blue-50 px-3 py-1 rounded">
              + Add Task
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-gray-500 italic">No tasks added yet.</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li key={task._id} className={`p-4 border rounded-md flex justify-between items-center transition ${task.completed ? 'bg-gray-100 opacity-60' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={task.completed || false} onChange={() => toggleTaskComplete(task)} className="w-5 h-5 cursor-pointer accent-blue-600" />
                    <div>
                      <h3 className={`font-bold text-gray-800 ${task.completed ? 'line-through' : ''}`}>{task.title}</h3>
                      <p className="text-sm text-gray-600">Due: {new Date(task.deadline).toLocaleDateString()} • {task.estimatedHours}h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{task.priority}</span>
                    <button onClick={() => deleteTask(task._id)} className="text-red-400 hover:text-red-600 transition" title="Delete Task">🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div> {/* <-- End of Courses & Tasks Grid */}

      {/* --- NEW: ANALYTICS BAR CHART --- */}
      {schedule.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">📊 Weekly Workload</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                
                <Bar dataKey="Completed" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Pending" stackId="a" fill="#F59E0B" />
                <Bar dataKey="Missed" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {/* --------------------------------- */}

      {/* AI Schedule Section */}
      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-500">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📅 Your AI Study Plan</h2>
        
        {/* AI EXPLANATION BOX */}
        {aiMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-indigo-50 border border-purple-200 rounded-lg flex items-start gap-4 shadow-sm">
            <div className="text-3xl">🤖</div>
            <div>
              <h4 className="font-bold text-purple-900 mb-1">AI Insight</h4>
              <p className="text-purple-800 text-sm font-medium leading-relaxed">{aiMessage}</p>
            </div>
          </div>
        )}

        {schedule.length === 0 ? (
          <p className="text-gray-500 italic text-center p-8 bg-gray-50 rounded">
            No schedule generated yet. Add some tasks and click the "✨ Generate Smart Schedule" button above!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule.map((entry) => (
              <div 
                key={entry._id} 
                className={`p-4 border rounded-xl flex flex-col justify-between shadow-sm transition-all ${
                  entry.status === 'completed' ? 'bg-gray-50 opacity-60' : 'bg-purple-50'
                }`}
              >
                {/* Top: Date & Status Badge */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-purple-800 bg-purple-200 px-2 py-1 rounded text-sm">
                      {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    
                    {/* Dynamic Status Badge */}
                    {entry.status === 'completed' && (
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md">✓ Completed</span>
                    )}
                    {entry.status === 'missed' && (
                      <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-md">✕ Missed</span>
                    )}
                    {(entry.status === 'pending' || !entry.status) && (
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md">Pending</span>
                    )}
                  </div>

                  <h3 className={`font-bold text-lg mb-1 ${entry.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {entry.task?.title || 'Deleted Task'}
                  </h3>
                  <p className="text-sm font-bold text-gray-600">{entry.allocatedHours} {entry.allocatedHours === 1 ? 'hour' : 'hours'}</p>
                </div>

                {/* Bottom: Priority & Action Buttons */}
                <div className="mt-4 pt-3 border-t border-purple-200 flex justify-between items-center">
                  <span className="text-xs text-purple-600 font-bold uppercase">{entry.task?.priority || 'N/A'} Priority</span>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {entry.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusUpdate(entry._id, 'completed')}
                        className="px-2 py-1 text-xs font-bold text-white bg-emerald-600 rounded hover:bg-emerald-700 transition shadow-sm"
                      >
                        ✓ Done
                      </button>
                    )}
                    {entry.status !== 'missed' && entry.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusUpdate(entry._id, 'missed')}
                        className="px-2 py-1 text-xs font-bold text-rose-600 border border-rose-200 bg-white rounded hover:bg-rose-50 transition shadow-sm"
                      >
                        ✕ Missed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddCourseModal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} onCourseAdded={handleCourseAdded} />
      <AddTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onTaskAdded={handleTaskAdded} courses={courses} />
    </div>
  );
};

export default Dashboard;