import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const AddCourseModal = ({ isOpen, onClose, onCourseAdded }) => {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#3B82F6'); // Default blue color
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const response = await axios.post(
        'http://localhost:8000/api/courses',
        { title, code, color },
        config
      );

      onCourseAdded(response.data); // Pass new course back to Dashboard
      setTitle('');
      setCode('');
      setColor('#3B82F6');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add New Course</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold text-lg">✕</button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Course Title *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Data Structures"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Course Code</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., CS201"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Tag Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-12 h-10 border rounded cursor-pointer p-1"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <span className="text-sm font-mono text-gray-600">{color}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700"
            >
              Save Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCourseModal;