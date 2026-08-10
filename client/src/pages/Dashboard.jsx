import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import AddCourseModal from '../components/AddCourseModal';
import AddTaskModal from '../components/AddTaskModal';

const Dashboard = () => {
  const { user, logoutUser } = useContext(AuthContext);
  
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Reusable config for Axios headers
  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });

  useEffect(() => {
    const fetchPlannerData = async () => {
      try {
        const [courseResponse, taskResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/courses', getAuthHeaders()),
          axios.get('http://localhost:8000/api/tasks', getAuthHeaders())
        ]);
        setCourses(courseResponse.data);
        setTasks(taskResponse.data);
      } catch (err) {
        setError('Failed to fetch data. Please try again.');
        console.error(err);
      }
    };
    fetchPlannerData();
  }, [user.token]);

  const handleCourseAdded = (newCourse) => setCourses((prev) => [...prev, newCourse]);
  const handleTaskAdded = (newTask) => setTasks((prev) => [...prev, newTask]);

  // --- NEW: Delete Course Handler ---
  const deleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/courses/${id}`, getAuthHeaders());
      // Remove it from the UI
      setCourses(courses.filter((course) => course._id !== id));
    } catch (err) {
      console.error('Failed to delete course', err);
    }
  };

  // --- NEW: Delete Task Handler ---
  const deleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/tasks/${id}`, getAuthHeaders());
      // Remove it from the UI
      setTasks(tasks.filter((task) => task._id !== id));
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  // --- NEW: Toggle Task Completion (Update) ---
  const toggleTaskComplete = async (task) => {
    try {
      const updatedData = { completed: !task.completed };
      const response = await axios.put(`http://localhost:8000/api/tasks/${task._id}`, updatedData, getAuthHeaders());
      
      // Update the specific task in the UI
      setTasks(tasks.map((t) => (t._id === task._id ? response.data : t)));
    } catch (err) {
      console.error('Failed to update task', err);
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
        <button
          onClick={logoutUser}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Courses Column */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">My Courses</h2>
            <button 
              onClick={() => setIsCourseModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-bold bg-blue-50 px-3 py-1 rounded"
            >
              + Add Course
            </button>
          </div>
          
          {courses.length === 0 ? (
            <p className="text-gray-500 italic">No courses added yet.</p>
          ) : (
            <ul className="space-y-3">
              {courses.map((course) => (
                <li 
                  key={course._id} 
                  className="p-4 border rounded-md bg-gray-50 flex justify-between items-center" 
                  style={{ borderLeft: `5px solid ${course.color}` }}
                >
                  <div>
                    <h3 className="font-bold text-gray-800">{course.title}</h3>
                    <p className="text-sm text-gray-600">{course.code}</p>
                  </div>
                  <button 
                    onClick={() => deleteCourse(course._id)}
                    className="text-red-400 hover:text-red-600 transition"
                    title="Delete Course"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tasks Column */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">My Tasks</h2>
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-bold bg-blue-50 px-3 py-1 rounded"
            >
              + Add Task
            </button>
          </div>

          {tasks.length === 0 ? (
            <p className="text-gray-500 italic">No tasks added yet.</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li 
                  key={task._id} 
                  className={`p-4 border rounded-md flex justify-between items-center transition ${
                    task.completed ? 'bg-gray-100 opacity-60' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={task.completed || false}
                      onChange={() => toggleTaskComplete(task)}
                      className="w-5 h-5 cursor-pointer accent-blue-600"
                    />
                    <div>
                      <h3 className={`font-bold text-gray-800 ${task.completed ? 'line-through' : ''}`}>
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(task.deadline).toLocaleDateString()} • {task.estimatedHours}h
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {task.priority}
                    </span>
                    <button 
                      onClick={() => deleteTask(task._id)}
                      className="text-red-400 hover:text-red-600 transition"
                      title="Delete Task"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      <AddCourseModal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} onCourseAdded={handleCourseAdded} />
      <AddTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onTaskAdded={handleTaskAdded} courses={courses} />
    </div>
  );
};

export default Dashboard;