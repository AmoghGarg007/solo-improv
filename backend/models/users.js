const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  srn: {
    type: String,
    required: true,
    unique: true
  },
  interests: [{
    type: String
  }],
  joinedGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group"
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);