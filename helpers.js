const users = require('./user_database');
const urlDatabase = require('./url_database');

const generateUserHelper = (bcrypt) => {
  const generateRandomString = function(length = 6) {
    const lengthOfString = length + 2
    return Math.random().toString(36).slice(2, lengthOfString);
  };
  
  const authenticateUser = (password, id) => {
    const has = Object.prototype.hasOwnProperty;
    if (!has.call(users, id)) {
      return { error: "Email doesn't exist", data: null};
    }
    if (!bcrypt.compareSync(password, users[id]['password'])) {
      return { error: "Password is incorrect", data: null};
    }
    return { error: null, data: users[id]};
  };

  const addUser = (email, password) => {
    const userIDString = generateRandomString();
    const hashedPassword = bcrypt.hashSync(password, 10);
    let error = false;
    if (email === '' || password === '') {
      console.log('Error: Improper Email or Password');
      error = true;
    } else if (users[findUserIDByEmail(email)] !== undefined) {
      error = true;
      console.log('Error: Email Already Exists In System');
    }
    if (!error) {
      const newUser = {
        userID: userIDString,
        email,
        password: hashedPassword
      };
      return users[userIDString] = newUser;
    } else {
      return 'Error';
    }
  };
  
  const findUserIDByEmail = (email) => {
    for (const user in users) {
      if (users[user]['email'] === email) {
        let id = users[user]['userID'];
        return id;
      }
    }
  };
  
  const urlsForUser = (id) => {
    const userURLs = {};
    for (const url in urlDatabase) {
      if (urlDatabase[url]['userID'] === id) {
        userURLs[url] = urlDatabase[url];
      }
    } return userURLs;
  };
  return { authenticateUser, addUser, findUserIDByEmail, urlsForUser, generateRandomString};
};

const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user]['email'] === email) {
      let id = database[user]['id'];
      return id;
    }
  }
};

module.exports = { 
  generateUserHelper,
  getUserByEmail,
};