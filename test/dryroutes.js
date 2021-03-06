var should = require('chai').should();
var url = require('url');
var dryroutes = require('../');

var express = require('express');
var app = express();
var http = require('http');
var request = require('request');
var PORT = 8080;

dryroutes.configure({
  host: 'localhost:' + PORT
});


function getUrl(path, https) {
  return url.format({
    protocol: https ? 'https' : 'http',
    hostname: 'localhost',
    port: PORT,
    pathname: path
  });
}

dryroutes(app, {
  'home': {
    path: '/',
    handlers: {
      get: function (req, res, next) {
        res.end('home');
      }
    }
  },

  'user details': {
    path: '/users/:id',
    regexp: /^\/users\/([a-z0-9]+)/,
    handlers: {
      get: [
        function (req, res, next) {
          next();
        },
        function (req, res, next) {
          var id = req.params[0];
          res.end('user ' + id + ' details');
        }
      ]
    }
  },

  'login': {
    path: '/login',
    handlers: {
      get: function (req, res, next) {
        return res.end('login');
      }
    },
    enforceHttps: true
  },

  'register': {
    path: '/account#/register'
  }

});


describe('urlFor()', function () {
  describe('when getting a plain http url', function () {
    it('should return the relative url', function () {
      var url = dryroutes.urlFor('home');
      url.should.equal('/');
    });
  });

  describe('when absolute: true', function () {
    it('should return the absolute url', function () {
      var url = dryroutes.urlFor('home', {
        absolute: true
      });
      url.should.equal(getUrl('/'));
    });
  });

  describe('when passing in key:values in params', function () {
    it('should return the url with the values', function () {
      var url = dryroutes.urlFor('user details', {
        params: {
          id: 42
        }
      });
      url.should.equal('/users/42');
    });
  });

  describe('when getting a https-enforced route', function () {
    it('should return the https url', function () {
      var url = dryroutes.urlFor('login');
      url.should.equal(getUrl('/login', true));
    });
  });

  describe('when passing in extra params', function () {
    it('should append them as query params', function () {
      var url = dryroutes.urlFor('user details', {
        params: {
          id: 42,
          foo: 'bar'
        }
      });
      url.should.equal('/users/42?foo=bar');
    });
  });

  describe('when the path has a hash', function () {
    it('should construct the query and hash params correctly', function () {
      var url = dryroutes.urlFor('register', {
        params: { foo: 'bar' }
      });
      url.should.equal('/account?foo=bar#/register');
    });
  });
});


describe('express routes', function () {
  before(function (done) {
    http.createServer(app).listen(PORT, function () {
      done();
    });
  });

  describe('using a single handler', function (argument) {
    it('should respond with HTTP 200', function (done) {
      var url = dryroutes.urlFor('home');
      request.get(getUrl(url), function (err, res, body) {
        res.statusCode.should.equal(200);
        body.should.equal('home');
        done();
      });
    });
  });

  describe('using an array of handlers', function (argument) {
    it('should respond with HTTP 200', function (done) {
      var url = dryroutes.urlFor('user details', {
        params: {
          id: 42
        }
      });
      request.get(getUrl(url), function (err, res, body) {
        res.statusCode.should.equal(200);
        body.should.equal('user 42 details');
        done();
      });
    });
  });

  describe('enforcing https', function (argument) {
    it('should 301 redirect to the HTTPS page', function (done) {
      request({
        uri: getUrl('/login'),
        followRedirect: false
      }, function (err, res, body) {
        res.statusCode.should.equal(301);
        res.headers.location.should.equal(getUrl('/login', true));
        done();
      });
    });
  });

});
