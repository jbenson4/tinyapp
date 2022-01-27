const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const req = require("express/lib/request");
const { request } = require("express");

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

// Index Routes
app.get('/', (req, res) => {
  res.send("Hello!");
});

// Register Routes
app.get('/register', (req, res) => {
  const cookieID = req.cookies['userID'];
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
  if (userEmail === '' || userPassword === '') {
    res.send('400 Error, Improper Email or Password');
  } else if (users[findUserIDByEmail(userEmail)] !== undefined) {
    res.send('400 Error, Email Already Exists In System');
    return;
  } else {
    users[userIDString] = {
      userID: userIDString,
      email: userEmail,
      password: userPassword
    };
    res.cookie('userID', userIDString);
    res.redirect('/urls');
  }
});

// Login/Logout Routes
app.get('/login', (req, res) => {
  const cookieID = req.cookies['userID'];
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
    res.send('403 Error, User Not Found');
    return;
  }
  if (users[id]['password'] !== password) {
    res.send('403 Error, Incorrect Password');
    return;
  }
  res.cookie('userID', id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('userID');
  res.redirect('/urls');
});

// URLs Routes
app.get('/urls', (req, res) => {
  const cookieID = req.cookies['userID'];
  let email = findUserByUserID(cookieID);
  const templateVars = {
    urls: urlDatabase,
    users,
    email,
  };
  res.render('urls_index', templateVars);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  let urlToDelete = req.params.shortURL;
  delete urlDatabase[urlToDelete];
  res.redirect('/urls');
});

app.get('/urls/:shortURL/edit', (req, res) => {
  let short = req.params.shortURL;
  res.redirect(`/urls/${short}`);
});

app.post('/urls/:shortURL/edit', (req, res) => {
  let urlToEdit = req.params.shortURL;
  let newURL = req.body.newURL;
  urlDatabase[urlToEdit] = newURL;
  res.redirect('/urls');
});

// New URL Routes
app.get('/urls/new', (req, res) => {
  const cookieID = req.cookies['userID'];
  let email = findUserByUserID(cookieID);
  const templateVars = {
    urls: urlDatabase,
    users,
    email,
  };
  if (cookieID === undefined) {
    console.log('cookieID: ', cookieID);
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVars);
  }
});

app.post('/urls', (req, res) => {
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  res.redirect(`/urls/${short}`);
});

// Detailed URL Route
app.get('/urls/:shortURL', (req, res) => {
  const cookieID = req.cookies['userID'];
  let email = findUserByUserID(cookieID);
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[req.params.shortURL];
  const templateVars = {
    shortURL,
    longURL,
    email,
  };
  if (urlDatabase[shortURL]) {
    res.render('urls_show', templateVars);
  } else {
    res.write('404 Error, Page Not Found');
  }
});

// Redirect to the long URL Route
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Error Route
app.get('*', (req, res) => {
  res.send('404 Error, Page Not Found');
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