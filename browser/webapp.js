'use strict';
const express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    config = require('./../bin/configuration');


app.set('PORT', config.defaultPort);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(cookieParser())

app.use('/v1', express.static('www'));

app.get('/v1/:clientId', (req, res) => {

    console.log(req.params.clientId);
    res.cookie('clientId', req.params.clientId);
    res.redirect('/v1/index.html');
})

app.listen(app.get('PORT'), (req, res) => {
    console.log(`UI server is up and running on http://localhost:${app.get('PORT')}`);
})