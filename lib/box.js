var Fs = require('fs');
var Joi = require('joi');
var Url = require('url');
var Md5 = require('MD5');
var Mime = require('mime');
var Path = require('path');
var Send = require('send');
var Wrench = require('wrench');


var internals = {};


// Constructor - returns the express middleware function

module.exports = internals.Box = function (options) {

    var self = this;

    var schema = {
        url: Joi.string().regex(/^\//).required(),
        path: Joi.string().required(),
        regex: Joi.object().type(RegExp).required().default(/.*/),
        sendOptions: Joi.object()
    };

    Joi.validate(options, schema, function (err, value) {

        // This is called on same tick so we can sure
        // we're set up before middleware handler returns

        if (err) {
            throw err;
        }

        self.options = value;

        self.files = Wrench.readdirSyncRecursive(self.options.path).filter(function (element) {

            if (Fs.lstatSync(Path.join(Path.resolve(self.options.path), element)).isDirectory()) {
                return false;
            }

            return self.options.regex.test(element);
        });

        self.urlsMap = {};
        self.readFiles();
    });

    var _handle = function (req, res, next) {

        var url = Url.parse(req.url).pathname;

        if (self.urlsMap.hasOwnProperty(url)) {
            return Send(req, self.urlsMap[url].path, self.options.sendOptions).pipe(res);
        } 

        return next();
    };

    _handle.getHashedUrl = self.getHashedUrl.bind(self);
    _handle.getNaturalUrl = self.getNaturalUrl.bind(self);

    return _handle;

};


// Reads all the files associates the indices to original paths

internals.Box.prototype.readFiles = function () {

    for (var i = 0; i < this.files.length; i++) {

        var path = Path.join(Path.resolve(this.options.path), this.files[i]);
        var file = this.files[i];
        var hash = Md5(Fs.readFileSync(path));

        var naturalUrl = Path.join(this.options.url, this.files[i]);
        var hashedUrl = Path.join(
            this.options.url, 
            Path.dirname(file), 
            Path.basename(file, Path.extname(file)) + '-' + hash + Path.extname(file));

        this.urlsMap[naturalUrl] = {path: path, hashed: hashedUrl};
        this.urlsMap[hashedUrl]  = {path: path, natural: naturalUrl};
    }
};


// Take a natural URL and returns the hashed version

internals.Box.prototype.getHashedUrl = function (url) {

    if (this.urlsMap.hasOwnProperty(url) && typeof this.urlsMap[url].hashed === 'string') {
        return this.urlsMap[url].hashed;
    }
    return null;
};


// Take a hashes URL and returns the natural version

internals.Box.prototype.getNaturalUrl = function (url) {

    if (this.urlsMap.hasOwnProperty(url) && typeof this.urlsMap[url].natural === 'string') {
        return this.urlsMap[url].natural;
    }
    return null;
};
