const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const req = require("express/lib/request");

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};
// Index Routes
app.get('/', (req, res) => {
  res.send("Hello!");
});

// Login/Logout Routes
app.post('/login', (req, res) => {
  let username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  let username = req.cookies;
  res.clearCookie('username');
  res.redirect('/urls');
})

// URLs Routes
app.get('/urls', (req, res) => {
  // console.log('req: ', req.headers.cookie);
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render('urls_index', templateVars);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  let urlToDelete = req.params.shortURL;
  delete urlDatabase[urlToDelete];
  res.redirect('/urls');
})

app.get('/urls/:shortURL/edit', (req, res) => {
  let short = req.params.shortURL;
  res.redirect(`/urls/${short}`);
});

app.post('/urls/:shortURL/edit', (req, res) => {
  let urlToEdit = req.params.shortURL;
  let newURL = req.body.newURL;
  urlDatabase[urlToEdit] = newURL;
  res.redirect('/urls');
})

// New URL Routes
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.post('/urls', (req, res) => {
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  res.redirect(`/urls/${short}`);
});

// Detailed URL Route
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"],
  };
  res.render('urls_show', templateVars);
});

// Redirect to the long URL Route
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});