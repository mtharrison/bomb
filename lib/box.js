var Fs = require('fs');
var Joi = require('joi');
var Md5 = require('MD5');
var Mime = require('mime');
var Path = require('path');
var Wrench = require('wrench');


var internals = {};


// Constructor - returns the express middleware function

module.exports = internals.Box = function (options) {

    var self = this;

    var schema = {
        url: Joi.string().regex(/^\//).required(),
        path: Joi.string().required(),
        regex: Joi.object().type(RegExp).required().default(/.*/),
    };

    Joi.validate(options, schema, function (err, value) {

        // This is called on same tick so we can sure
        // we're set up before middleware handler returns

        if (err) {
            throw err;
        }

        self.options = value;

        self.files = Wrench.readdirSyncRecursive(self.options.path).filter(function (element) {
            return self.options.regex.test(element);
        });

        self.naturalMap = {};
        self.hashedsMap = {};
        self.contentMap = [];

        self.readFiles();
        self.calcHases();
    });

    return this.handle.bind(this);
};


// Reads all the files into buffers in memory and associates the indices to original paths

internals.Box.prototype.readFiles = function () {

    for (var i = 0; i < this.files.length; i++) {
        this.naturalMap[Path.join(this.options.url, this.files[i])] = i;
        this.contentMap[i] = {
            contents: Fs.readFileSync(Path.join(this.options.path, this.files[i])),
            contentType: Mime.lookup(Path.extname(this.files[i]))
        };
    }
};


// Calculates the hashes for each file

internals.Box.prototype.calcHases = function () {

    for (var i = 0; i < this.files.length; i++) {
        var hash = Md5(this.contentMap[i].contents);
        var file = this.files[i];

        var hashedPath = Path.join(
            this.options.url, 
            Path.dirname(file), 
            Path.basename(file, Path.extname(file)) + '-' + hash + Path.extname(file));

        this.hashedsMap[hashedPath] = i;
    }
};


// Take a natural URL and returns the hashed version

internals.Box.prototype.url = function (url) {

    if (this.naturalMap.hasOwnProperty(url)) {
        return this.hashedsMap[this.naturalMap[url]];
    }
    return false;
};


// The middleware function used by express - serves the files

internals.Box.prototype.handle = function (req, res, next) {

    var url = req.url;

    if (this.naturalMap.hasOwnProperty(url)) {
        res.header('content-type', this.contentMap[this.naturalMap[url]].contentType);
        return res.end(this.contentMap[this.naturalMap[url]].contents);
    } 

    if (this.hashedsMap.hasOwnProperty(url)) {
        res.header('content-type', this.contentMap[this.hashedsMap[url]].contentType);
        return res.end(this.contentMap[this.hashedsMap[url]].contents);
    } 

    return next();
};
