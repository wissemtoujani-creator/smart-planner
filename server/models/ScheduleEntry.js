import mongoose from 'mongoose';

const scheduleEntrySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    allocatedHours: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'missed'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

export default mongoose.model('ScheduleEntry', scheduleEntrySchema);