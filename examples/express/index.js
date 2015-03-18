var Express = require('express');
var Busta = require('../../index');
var Path = require('path');

var app = Express();

var box = new Busta.Box({
    url: '/public',
    path: Path.join(__dirname, 'public'),
    regex: /\.(css|js|html)/
});

app.use(box);

app.listen(4000);