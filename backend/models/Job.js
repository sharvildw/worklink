const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    budget: {
      type: Number,
      required: true,
      min: 0
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["open", "hired", "completed", "closed"],
      default: "open"
    },
    category: {
      type: String,
      trim: true,
      default: "General"
    },
    duration: {
      type: String,
      trim: true,
      default: ""
    },
    requirements: {
      type: String,
      trim: true,
      default: ""
    },
    contactPhone: {
      type: String,
      trim: true,
      default: ""
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      default: null
    },
    applicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    completedDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.hiredWorker = ret.assignedTo ? ret.assignedTo.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model("Job", jobSchema);
