const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const port = 3000;

const userModel = require("./models/user");
const postModel = require("./models/post");
const { default: mongoose } = require("mongoose");

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
      res.redirect("/login");
    });
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  let user = await userModel.findOne({ email });
  if (!user) return res.status(401).send("Something went wrong!");

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email, userid: user._id }, "secret");
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    } else res.redirect("/");
  });
});

app.get("/profile", isLoggedIn, async (req, res) => {
  let user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");
  res.render("profile", { user });
});

app.get("/like/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  post.likes.push(req.user.userid);
  await post.save();
  res.redirect("/profile");
});

app.post("/post", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let { content } = req.body;
  let post = await postModel.create({
    user: user._id,
    content,
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    res.redirect("/login");
  }
  try {
    let data = jwt.verify(req.cookies.token, "secret");
    req.user = data;
    next();
  } catch (err) {
    return res.status(403).send("Invalid Token!");
  }
}

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});
