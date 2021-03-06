# bomb
A frontend cache-busting static middleware for express.

- Acts as a static middleware
- Serves on a hashed filename route too

###Install 

`npm install --save bomb`

###Example

Let's say we want to serve all the css, js and HTML files in our public directory:

    ├── index.js
        └── public
            ├── example.css
            ├── example.js
            ├── other.txt
            ├── example.png
            └── other
                └── index.html
                
We can create a new bomb box and use it as a middleware:

    var Express = require('express');
    var Bomb = require('bomb');
    var Path = require('path');
    
    var app = Express();
    
    var box = new Bomb.Box({
        url: '/public',                           // use this as the URL root
        path: Path.join(__dirname, 'public'),     // look in this directory for files
        regex: /\.(css|js|html)/                  // only serve files that match regex
        sendOptions: {}                           // options for the `send` module
    });
    
    app.use(box);
    
    app.listen(4000);
  
We can now request the files on the natural or hashed URLS:

- `/public/example.css`
- `/public/example-4591dd5c9fd5aab8f5d7df6ac939441c.css`
- `/public/example.js`
- `/public/example-00e062122c3306198fdbe5d3ddd01fe0.js`
- `/public/other/index.html`
- `/public/other/index-33c805c6162941684b6fc618d0e42ab8.html`

To get the hashed URL from a natural one, just call `box.getHashedUrl(url)`:

`box.getHashedUrl('/public/example.css') === '/public/example-4591dd5c9fd5aab8f5d7df6ac939441c.css'`

To get the natural URL from a hashed one, just call `box.getNaturalUrl(url)`:

`box.getNaturalUrl('/public/example-4591dd5c9fd5aab8f5d7df6ac939441c.css') === '/public/example.css'`
