import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import AddCourseModal from '../components/AddCourseModal';
import AddTaskModal from '../components/AddTaskModal';

const Dashboard = () => {
  const { user, logoutUser } = useContext(AuthContext);
  
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState([]); // <-- New state for AI schedule
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
    try {
      const response = await axios.post('http://localhost:8000/api/schedule/generate', {}, getAuthHeaders());
      setSchedule(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate schedule. Make sure you have uncompleted tasks!');
    } finally {
      setIsGenerating(false);
    }
  };

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
      </div>

      {/* NEW: AI Schedule Section */}
      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-500">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📅 Your AI Study Plan</h2>
        {schedule.length === 0 ? (
          <p className="text-gray-500 italic text-center p-8 bg-gray-50 rounded">
            No schedule generated yet. Add some tasks and click the "✨ Generate Smart Schedule" button above!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule.map((entry) => (
              <div key={entry._id} className="p-4 border rounded-lg bg-purple-50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-purple-800 bg-purple-200 px-2 py-1 rounded text-sm">
                      {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-sm font-bold text-gray-600">{entry.allocatedHours} hours</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">{entry.task?.title || 'Deleted Task'}</h3>
                </div>
                <div className="mt-4 pt-3 border-t border-purple-200 flex justify-between items-center">
                  <span className="text-xs text-purple-600 font-bold uppercase">{entry.task?.priority || 'N/A'} Priority</span>
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