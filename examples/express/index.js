var Express = require('express');
var Bomb = require('../../index');
var Path = require('path');

var app = Express();

var box = new Bomb.Box({
    url: '/serve',
    path: Path.join(__dirname, 'public'),
    regex: /\.(css|js|html)/
    sendOptions: {}
});

app.use(box);

app.listen(4000);