const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

let db = null;
let dbPath = path.join(__dirname, "userData.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUsersQuery = `SELECT * FROM user WHERE username='${username}'`;
  const dbUser = await db.get(getUsersQuery);
  if (dbUser === undefined) {
    let registerUserQuery = `INSERT INTO user(username,name,password,gender,location)
    VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}')`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let registerUser = await db.run(registerUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API2
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const getUser = await db.get(getUserQuery);
  if (getUser !== undefined) {
    const comparePassword = await bcrypt.compare(password, getUser.password);
    console.log(comparePassword);
    if (comparePassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

//API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserQuery = `SELECT * FROM user where username='${username}'`;
  const dbUser = await db.get(getUserQuery);
  const compareNewAndOldPasswords = await bcrypt.compare(
    oldPassword,
    dbUser.password
  );
  if (compareNewAndOldPasswords !== true) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    const updatePasswordQuery = `UPDATE user SET
       password='${newHashedPassword}' WHERE username='${username}'`;
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatedUser = await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  }
});

module.exports = app;
