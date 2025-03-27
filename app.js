const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const port = 3000;

const userModel = require("./models/user");
const postModel = require("./models/post");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/register", async (req, res) => {
  let { name, username, age, email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.status(400).send("User already exists");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        name,
        username,
        age,
        email,
        password: hash,
      });
      let token = jwt.sign({ email, userid: user._id }, "secret");
      res.cookie("token", token);
      res.send("registered!");
    });
  });
});

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});
