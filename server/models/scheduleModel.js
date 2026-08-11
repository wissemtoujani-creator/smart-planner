import mongoose from 'mongoose';

const scheduleSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Task',
    },
    date: {
      type: Date,
      required: [true, 'Please provide a date for this schedule entry'],
    },
    allocatedHours: {
      type: Number,
      required: [true, 'Please provide how many hours to work on this day'],
    },
    aiGenerated: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

const ScheduleEntry = mongoose.model('ScheduleEntry', scheduleSchema);

export default ScheduleEntry;