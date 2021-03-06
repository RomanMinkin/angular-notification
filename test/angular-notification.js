var expect = chai.expect;

describe('Notification provider', function () {
  var $window, Notification;

  beforeEach(module('notification'));

  beforeEach(module(function (NotificationProvider) {
    NotificationProvider.setOptions({ foo: 'bar' });
  }));

  beforeEach(inject(function ($injector) {
    $window = $injector.get('$window');
    Notification = $injector.get('Notification');

    $window.Notification = sinon.spy();
    $window.Notification.prototype.addEventListener = sinon.spy();
    $window.Notification.prototype.close = sinon.spy();
    $window.Notification.requestPermission = sinon.spy(requestPermission);
    $window.Notification.respondPermission = respondPermission;

    function requestPermission(callback) {
      $window.Notification._permissionCb = callback;
    }

    function respondPermission(permission) {
      $window.Notification._permissionCb(permission);
    }
  }));

  describe('#setOptions', function () {
    it('should define default options', function () {
      new Notification('title');
      $window.Notification.respondPermission('granted');

      expect($window.Notification).to.be.calledWith('title', {
        foo: 'bar'
      });
    });
  });

  it('should return an error if not supported', function () {
    $window.Notification = null;

    function createNotification() {
      new Notification();
    };

    expect(createNotification)
      .to.throw('This browser does not support desktop notification.');
  });

  describe('#requestPermission', function () {
    it('should request if permission is "default"', function () {
      $window.Notification.permission = 'default';
      new Notification();
      expect($window.Notification.requestPermission).to.be.called;
    });

    it('should request if permission is not defined', function () {
      $window.Notification.permission = undefined;
      new Notification();
      expect($window.Notification.requestPermission).to.be.called;
    });

    it('should set permission', function () {
      $window.Notification.permission = undefined;
      new Notification();
      $window.Notification.respondPermission('granted');
      expect($window.Notification.requestPermission).to.be.called;
      expect($window.Notification.permission).to.equal('granted');
    });
  });

  describe('#$on', function () {
    it('should register events when permission is "granted" at start', function () {
      $window.Notification.permission = 'granted';
      var notification = new Notification();
      notification.$on('close', function () {});

      expect(notification.baseNotification.addEventListener).to.be.calledWith('close');
    });

    it('should register events when permission is not "granted" at start', function () {
      var notification = new Notification();
      notification.$on('close', function () {});
      $window.Notification.respondPermission('granted');
      expect(notification.baseNotification.addEventListener).to.be.calledWith('close');
    });
  });

  describe('#close', function () {
    it('should do nothing if notification is not created', function () {
      var notification = new Notification();
      notification.close();
    });

    it('should close notification if created', function () {
      $window.Notification.permission = 'granted';
      var notification = new Notification();
      notification.close();
      expect(notification.baseNotification.close).to.be.called;
    });
  });

  describe('#delay', function () {
    var clock;

    beforeEach(function () {
      clock = sinon.useFakeTimers();
    });

    afterEach(function () {
      clock.restore();
    });

    it('should be possible to set a delay', function () {
      $window.Notification.permission = 'granted';
      var notification = new Notification('title', { delay: 1000 });
      expect(notification.baseNotification.close).to.not.be.called;

      clock.tick(1001);

      expect(notification.baseNotification.close).to.be.called;
    });
  });
});