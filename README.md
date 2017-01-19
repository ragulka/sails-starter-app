# Sails starter app
### A Sails starter app with sensible defaults

Get your Sails project started quicker. This starter app provides you with essential user authentication and session setup.

Out of the box:

* User model with attributes that make sense
* User authentication using Passport
* "Remember Me" functionality
* Password reset
* CRSF protection
* Use Kue for running background jobs (such as sending password reset instructions)
* Separate API from "regular" routes - API routes are namespaced under /api/v1
* All of the above are covered with tests (and you can add your own)!

### Get started:

    git clone git@github.com:ragulka/sails-starter-app.git
    cd sails-starter-app
    npm install
    sails lift

#### Where is the login/new account etc page???

Oops, there aren't any. My idea was to provide a "view-less" starter app that only has JSON-based API. You can use POSTman - or your browser's console to issue AJAX requests.

Please note: you need to first create a user account before you can try logging in. To do that simply send a POST request to `/api/v1/users` with email, password, passwordConfirmation and the _csrf token. To get the csrf token, do `GET /csrfToken`.

After you've done this, you can try logging in with your credentials by doing

    POST /session //... add your POST data (email and password)

### Tests

The User model and session controller are covered by tests. You can run them with:

    npm test


This starter app uses [Mocha](http://mochajs.org/) test framework (BDD style) and the wonderful [Must](https://github.com/moll/js-must) assertion library.

If you want to add your own tests (for other models, etc), just add them to the `test` folder. Also note that the test databse is flushed of all data before and after running the test suite (using `test/bootstrap.js`).

### A littlebit about the stack (components and modules used)

The starter app uses MongoDB as the database both for storing collections and sessions. Simply because I like to have full-stack Javascript/JSON... and Mongo is easy to set up.

For user authentication, it uses the wonderful [Passport](http://passportjs.org/) module by Jared Hanson. Along with it - Local and Remember Me strategy.

For password encryption, we use [bcrypt](http://codahale.com/how-to-safely-store-a-password/).

### API-key based authentication

Eventually this app will help you to authenticate requests with a user's API key, too. I plan to add HTTP Basic Authentication for this later.

### A word about security

This app in no way should be considered totally secure. While it does provide you with sensible defaults by using CSRF protection and making it harder to hijack [persistent session cookies](http://fishbowl.pastiche.org/2004/01/19/persistent_login_cookie_best_practice/), it doesn't cover other possible attack methods. Use with care. And if you find a hole, submit a PR to fix it. 
