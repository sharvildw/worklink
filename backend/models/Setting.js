const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      default: "WorkLink"
    },
    adminEmail: {
      type: String,
      default: ""
    },
    contactPhone: {
      type: String,
      default: ""
    },
    commission: {
      type: Number,
      default: 10
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

module.exports = mongoose.model("Setting", settingSchema);
