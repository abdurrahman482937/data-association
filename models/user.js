const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/data-association");

const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  age: Number,
  email: String,
  password: String,
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
