const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const req = require("express/lib/request");
const { request } = require("express");
const bcrypt = require('bcryptjs');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['secret_key_1', 'secret_key_2']
}));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  }
};

const users = {
  userRandomID: {
    userID: 'userRandomID',
    email: 'user@example.com',
    password: '12345'
  }
};

const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};

const findUserByUserID = function(id) {
  for (let user in users) {
    if (users[user]['userID'] === id) {
      let email = users[user]['email'];
      return email;
    }
  }
};

const findUserIDByEmail = function(email) {
  for (let user in users) {
    if (users[user]['email'] === email) {
      let id = users[user]['userID'];
      return id;
    }
  }
};

const urlsForUser = function(id) {
  const userURLs = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url]['userID'] === id) {
      userURLs[url] = urlDatabase[url];
    }
  } return userURLs;
};

// Index Routes
app.get('/', (req, res) => {
  res.send("Hello!");
});

// Register Routes
app.get('/register', (req, res) => {
  const cookieID = req.session.userID;
  let email = findUserByUserID(cookieID);
  const templateVars = {
    users,
    email,
  };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  let userIDString = generateRandomString();
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(userPassword, 10);
  if (userEmail === '' || userPassword === '') {
    res.status(400).send('400 Error, Improper Email or Password');
  } else if (users[findUserIDByEmail(userEmail)] !== undefined) {
    res.status(400).send('400 Error, Email Already Exists In System');
    return;
  } else {
    users[userIDString] = {
      userID: userIDString,
      email: userEmail,
      password: hashedPassword
    };
    console.log(users);
    // res.cookie('userID', userIDString);
    req.session.userID = userIDString;
    res.redirect('/urls');
  }
});

// Login/Logout Routes
app.get('/login', (req, res) => {
  const cookieID = req.session.userID;
  
  let email = findUserByUserID(cookieID);
  const templateVars = {
    users,
    email,
  };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let id = findUserIDByEmail(email);
  if (id === undefined) {
    res.status(403).send('403 Error, User Not Found');
    return;
  }
  if (!bcrypt.compareSync(password, users[id]['password'])) {
    res.status(403).send('403 Error, Incorrect Password');
    return;
  }
  console.log(users);
  // res.cookie('userID', id);
  console.log('session.userID: ', req.session.userID);
  req.session.userID = id;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// URLs Routes
app.get('/urls', (req, res) => {
  const cookieID = req.session.userID;
  let email = findUserByUserID(cookieID);
  const urls = urlsForUser(cookieID);
  const templateVars = {
    urls,
    users,
    email,
    cookieID,
  };
  res.render('urls_index', templateVars);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const cookieID = req.session.userID;
  const urlToDelete = req.params.shortURL;
  const editableURLs = urlsForUser(cookieID);
  const has = Object.prototype.hasOwnProperty;
  if (!has.call(editableURLs, urlToDelete)) {
    res.status(403).send('403 Error');
    return;
  }
  delete urlDatabase[urlToDelete];
  res.redirect('/urls');
});

app.get('/urls/:shortURL/edit', (req, res) => {
  let short = req.params.shortURL;
  res.redirect(`/urls/${short}`);
});

app.post('/urls/:shortURL/edit', (req, res) => {
  const cookieID = req.session.userID;
  const urlToEdit = req.params.shortURL;
  const newURL = req.body.newURL;
  const editableURLs = urlsForUser(cookieID);
  const has = Object.prototype.hasOwnProperty;
  if (!has.call(editableURLs, urlToEdit)) {
    res.status(403).send('403 Error');
    return;
  }
  urlDatabase[urlToEdit]['longURL'] = newURL;
  res.redirect('/urls');
});

// New URL Routes
app.get('/urls/new', (req, res) => {
  const cookieID = req.session.userID;
  let email = findUserByUserID(cookieID);
  const templateVars = {
    urls: urlDatabase,
    users,
    email,
  };
  if (cookieID === undefined) {
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVars);
  }
});

app.post('/urls', (req, res) => {
  const cookieID = req.session.userID;
  let short = generateRandomString();
  urlDatabase[short] = {
    longURL: req.body.longURL,
    userID: cookieID
  };
  res.redirect(`/urls/${short}`);
});

// Detailed URL Route
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL] === undefined) {
    res.status(404).send('404 Error, Page Not Found');
    return;
  }
  const cookieID = req.session.userID;
  const email = findUserByUserID(cookieID);
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  const urls = urlsForUser(cookieID);
  const templateVars = {
    shortURL,
    longURL,
    email,
    cookieID,
    urls,
  };
  res.render('urls_show', templateVars);
});

// Redirect to the long URL Route
app.get('/u/:shortURL', (req, res) => {
  const request = urlDatabase[req.params.shortURL];
  if (request === undefined) {
    res.status(404).send('404, Page Not Found');
  }
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
});

// Error Route
app.get('*', (req, res) => {
  res.status(404).send('404 Error, Page Not Found');
});

// Test Routes
// app.get('/urls.json', (req, res) => {
//   res.json(urlDatabase);
// });

// app.get('/hello', (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});