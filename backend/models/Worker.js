const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    skills: {
      type: [String],
      default: []
    },
    experience: {
      type: Number,
      default: 0
    },
    location: {
      type: String,
      trim: true,
      default: ""
    },
    pricePerHour: {
      type: Number,
      default: 0
    },
    bio: {
      type: String,
      trim: true,
      default: ""
    },
    availability: {
      type: String,
      enum: ["available", "busy"],
      default: "available"
    },
    rating: {
      type: Number,
      default: 0
    },
    reviews: {
      type: Number,
      default: 0
    },
    completedJobs: {
      type: Number,
      default: 0
    },
    earnings: {
      type: Number,
      default: 0
    },
    languages: {
      type: [String],
      default: []
    },
    portfolio: {
      type: [
        {
          title: String,
          image: String
        }
      ],
      default: []
    },
    profileImage: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model("Worker", workerSchema);
