const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { generateUserHelper } = require('./helpers');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['secret_key_1', 'secret_key_2']  // Configurable keys for creating secure session cookies
}));

const urlDatabase = {};

const users = {};

const { authenticateUser, addUser, findUserIDByEmail, urlsForUser, generateRandomString } = generateUserHelper(users, urlDatabase, bcrypt);

// Index Route
app.get('/', (req, res) => {
  const email = req.session.userID;
  if (!email) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// Register Routes
app.get('/register', (req, res) => {
  const email = req.session.userID;
  const templateVars = {
    users,
    email,
  };
  if (email) {  // If user is already logged in (as evidenced by session cookie), redirect them back to /urls. Otherwise, render registration page 
    return res.redirect('/urls');
  }
  res.render('register', templateVars);
});

app.post('/register', (req, res) => { 
  const { email, password } = req.body;
  if (addUser(email, password) !== 'Error') {  // If there is no error in registration request, create a session cookie and redirect to /urls. Otherwise, return error
    req.session.userID = email;
    res.redirect('/urls');
  } else {
    res.status(400).send('400 Error');
  }
});

// Login/Logout Routes
app.get('/login', (req, res) => {
  const email = req.session.userID;
  const templateVars = {
    users,
    email,
  };
  if (email) {  // If user is already logged in (as evidenced by session cookie), redirect them back to /urls. Otherwise, render login page 
    return res.redirect('/urls');
  }
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  let id = findUserIDByEmail(email);
  const data = authenticateUser(password, id);  // Confirm user exists in database
  if (data.error === null) {  // If user authentication succeeds, create a session cookie and redirect to /urls. Otherwise, return error
    req.session.userID = email;
    res.redirect('/urls');
  } else {
    console.log(data.error);
    res.status(400).send('400 Error');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;  // Clear session cookies on logout
  res.redirect('/urls');
});

// URLs Routes
app.get('/urls', (req, res) => {
  const email = req.session.userID;
  const user = findUserIDByEmail(email);
  const urls = urlsForUser(user);  // Filter URLs specific to user before sending data to ejs via templateVars
  const templateVars = {
    urls,
    users,
    email,
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/:shortURL/edit', (req, res) => {
  let short = req.params.shortURL;
  res.redirect(`/urls/${short}`);
});

app.post('/urls/:shortURL/edit', (req, res) => {
  const email = req.session.userID;
  if (!email) {  // If user is not logged in and tries to edit a url, return an error
    return res.status(400).send('400 Error');
  }
  const id = findUserIDByEmail(email);
  const urlToEdit = req.params.shortURL;
  const newURL = req.body.newURL;
  const editableURLs = urlsForUser(id);  // Filter which URLs are editable to the users by searching URL database with the user id 
  const has = Object.prototype.hasOwnProperty;
  if (!has.call(editableURLs, urlToEdit)) {  // Search URL database if requested URL exists. If non-existent, return error. Otherwise, update URL and redirect to /urls
    return res.status(403).send('403 Error');
  }
  urlDatabase[urlToEdit]['longURL'] = newURL;
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const email = req.session.userID;
  if (!email) {  // If user is not logged in and tries to edit a url, return an error
    return res.status(400).send('400 Error');
  }
  const id = findUserIDByEmail(email);
  const urlToDelete = req.params.shortURL;
  const editableURLs = urlsForUser(id);  // Filter which URLs are deleteable to the users by searching URL database with the user id 
  const has = Object.prototype.hasOwnProperty;
  if (!has.call(editableURLs, urlToDelete)) {  // Search URL database if requested URL exists. If non-existent, return error. Otherwise, delete URL and redirect to /urls
    res.status(403).send('403 Error');
    return;
  }
  delete urlDatabase[urlToDelete];
  res.redirect('/urls');
});

// New URL Routes
app.get('/urls/new', (req, res) => {
  const email = req.session.userID;
  const templateVars = {
    urls: urlDatabase,
    users,
    email,
  };
  if (email === undefined) {  // If user is not logged in, redirect to login page. Otherwise, render Create New URL page
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVars);
  }
});

app.post('/urls', (req, res) => {
  const email = req.session.userID;
  if (!email) {  // If user is not logged in and tries to create a url, return an error
    return res.status(400).send('400 Error');
  }
  const id = findUserIDByEmail(email);
  const short = generateRandomString();
  urlDatabase[short] = {  // Create a new Tiny URL with the generateRandomString function, add it to the URL database, and redirect to the detailed URL page
    longURL: req.body.longURL,
    userID: id
  };
  res.redirect(`/urls/${short}`);
});

// URL Details Route
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL] === undefined) {  // If URL does not exist in database, return an error
    return res.status(404).send('404 Error, Page Not Found');
  }
  // Create variables to send data to ejs page via templateVars 
  const email = req.session.userID;
  const id = findUserIDByEmail(email);
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  const urls = urlsForUser(id);
  const templateVars = {
    shortURL,
    longURL,
    email,
    urls,
  };
  res.render('urls_show', templateVars);
});

// Redirect to the long URL Route
app.get('/u/:shortURL', (req, res) => {
  const request = urlDatabase[req.params.shortURL];
  if (request === undefined) {  // If URL does not exist in URL database, return an error. Otherwise, redirect to the requested webpage
    res.status(404).send('404, Page Not Found');
  }
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
});

// Error Route
app.get('*', (req, res) => {
  res.status(404).send('404 Error, Page Not Found');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});