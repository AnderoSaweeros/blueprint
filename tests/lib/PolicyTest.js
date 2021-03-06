var expect = require ('chai').expect
  , async  = require ('async')
  , util   = require ('util')
  , http   = require ('http')
  ;

var appFixture = require ('../fixtures/app')
  ;

var Policy = require ('../../lib/Policy')
  ;

function passthrough (result, req, callback) {
  return callback (null, result);
}

describe ('Policy', function () {
  before (function (done) {
    appFixture (done);
  });

  describe ('#evaluate', function () {
    it ('should evaluate the policy function', function (done) {
      Policy.evaluate (passthrough, true, null, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.true;

        return done ();
      });
    });

    it ('should evaluate policy function by name', function (done) {
      Policy.evaluate ('alwaysTrue', null, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.true;

        return done ();
      });
    });
  });

  describe ('#assert', function () {
    it ('should create an assertion that evaluates to true', function (done) {
      var f = Policy.assert (passthrough, true);
      var req = new http.IncomingMessage ();

      Policy.initialize (req);

      f (req, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.true;

        return done ();
      });
    });

    describe ('#', function () {
      it ('should return a successful evaluation', function (done) {
        Policy.evaluate (passthrough, true, null, function (err, result) {
          expect (result).to.be.true;
          return done ();
        });
      });
    });

    it ('should create an assertion from existing application policy', function (done) {
      var f = Policy.assert ('alwaysTrue');
      var req = new http.IncomingMessage ();

      Policy.initialize (req);

      try {
        f (req, function (err, result) {
          expect (err).to.be.null;
          expect (result).to.be.true;

          return done ();
        });
      }
      catch (ex) {
        console.log (ex);
      }
    });

    it ('should return a details reason for policy failure', function (done) {
      var f = Policy.assert ('alwaysFalse');
      var req = new http.IncomingMessage ();

      Policy.initialize (req);

      try {
        f (req, function (err, result) {
          expect (err).to.be.null;
          expect (result).to.be.false;
          expect (req).to.have.property ('hasPolicyErrors', true);

          return done ();
        });
      }
      catch (ex) {
        console.log (ex);
      }
    });
  });

  describe ('#all', function () {
    it ('should evaluate to true since all asserts are true', function () {
      var req = new http.IncomingMessage ();
      Policy.initialize (req);

      var policy = Policy.all ([
        Policy.assert (passthrough, true),
        Policy.assert (passthrough, true)
      ]);

      policy (req, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.true;
      });
    });

    it ('should evaluate to false since 1 assertion is false', function () {
      var policy = Policy.all ([
        Policy.assert (passthrough, true),
        Policy.assert (passthrough, false)
      ]);

      // Let's ensure we can call this collection of functions more than once
      // and not get a callback already called error.
      for (var i = 0; i < 10; ++ i) {
        var req = {};
        Policy.initialize (req);

        policy (req, function (err, result) {
          expect (err).to.be.null;
          expect (result).to.be.false;
        });
      }
    });
  });

  describe ('#any', function () {
    it ('should evaluate true since 1 assertion is true', function () {
      var policy = Policy.any ([
        Policy.assert (passthrough, true),
        Policy.assert (passthrough, false)
      ]);

      // Let's ensure we can call this collection of functions more than once
      // and not get a callback already called error.
      for (var i = 0; i < 10; ++ i) {
        var req = new http.IncomingMessage ();
        Policy.initialize (req);

        policy (req, function (err, result) {
          expect (err).to.be.null;
          expect (result).to.be.true;
        });
      }
    });

    it ('should evaluate false since all assertions are false', function () {
      var policy = Policy.any ([
        Policy.assert (passthrough, false),
        Policy.assert (passthrough, false)
      ]);

      var req = new http.IncomingMessage ();
      Policy.initialize (req);

      policy (req, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.false;
      });
    });
  });

  describe ('#not', function () {
    it ('should evaluate the negation policy', function () {
      var policy = Policy.not (Policy.assert (passthrough, true));

      var req = new http.IncomingMessage ();
      Policy.initialize (req);

      policy (req, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.false;
      });
    });
  });
});