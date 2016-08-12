(function(window, document, $, firebase, undefined) {

  var FIREBASE_API_KEY = 'AIzaSyBT4HNoA7bbg6C4QHL4b-tfrkD7mqOlutU';
  var FIREBASE_AUTH_DOMAIN = 'blatt-3000-mission-control.firebaseapp.com';
  var FIREBASE_DATABASE_URL = 'https://blatt-3000-mission-control.firebaseio.com';
  var FIREBASE_STORAGE_BUCKET = 'blatt-3000-mission-control.appspot.com'

  var QUESTIONS_REF = 'questions';
  var STATUS_REF = 'status';
  var SESSIONS_REF = 'sessions';

  var WORDS_PATH = '/words.json';
  var WORD_SELECTORS = ['#word-1', '#word-2', '#word-3'];

  var SLIDER_SPEED = 300;
  var SEND_DELAY_MIN = 3000;

  var _words;

  var _sendDelay;

  function _kill() {
    $('body').removeClass('loading');
    $('body').addClass('kill');
  }

  function _revive() {
    $('body').removeClass('kill');
  }

  function _loadWords() {
    return $.ajax({
      url: WORDS_PATH,
      dataType: 'json',
    }).done(function(eResult) {
      _words = eResult;
    });
  }

  function _initalizeDatabase() {
    firebase.initializeApp({
      apiKey: FIREBASE_API_KEY,
      authDomain: FIREBASE_AUTH_DOMAIN,
      databaseURL: FIREBASE_DATABASE_URL,
      storageBucket: FIREBASE_STORAGE_BUCKET,
    });
  }

  function _signInAnonymously() {
    var deferred;

    deferred = $.Deferred();
    firebase.auth().signInAnonymously().then(function() {
      deferred.resolve();
    }, function() {
      deferred.reject();
    });

    return deferred.promise();
  }

  function _send(msg) {
    firebase.database().ref(QUESTIONS_REF).push({
      timestamp: new Date().toISOString(),
      message: msg,
    });
  }

  function _currentSlideWord(eSliderElem) {
    return eSliderElem.find('.slick-current label').html();
  }

  function _randomizeWords() {
    _words.forEach(function(eCollection, eIndex) {
      $(WORD_SELECTORS[eIndex]).slick('slickGoTo', Math.floor(Math.random() * eCollection.length));
    });
  }

  function _initalizeListeners() {
    firebase.database().ref(STATUS_REF).on('value', function(eSnapshot) {
      var status;
      status = eSnapshot.val();
      if (status.killed) {
        _kill();
      } else {
        _revive();
      }
    });
  }

  function _checkInitialStatus() {
    var deferred;

    deferred = $.Deferred();
    firebase.database().ref(STATUS_REF).once('value', function(eSnapshot) {
      var status;
      status = eSnapshot.val();
      if (status.killed) {
        _kill();
      }
      deferred.resolve();
    }, function() {
      deferred.reject();
    });

    return deferred.promise();
  }

  function _initalizeInterface() {
    var $button;

    $button = $('#say-button');

    $('body').removeClass('loading');

    _words.forEach(function(eCollection, eIndex) {
      eCollection.forEach(function(eWord) {
        $(WORD_SELECTORS[eIndex]).append('<div><div class="word-inner"><label>' + eWord + '</label></div></div>');
      });

      $(WORD_SELECTORS[eIndex]).slick({
        arrows: true,
        prevArrow: '<span class="slick-prev">&lt;</span>',
        nextArrow: '<span class="slick-next">&gt;</span>',
        dots: false,
        infinite: true,
        speed: SLIDER_SPEED,
        initialSlide: Math.floor(Math.random() * eCollection.length)
      });
    });

    $button.on('click', function() {
      var msg;

      $button.attr('disabled', true);
      $button.addClass('loading');

      window.setTimeout(function() {
        $button.removeAttr('disabled');
        $button.removeClass('loading');

        _randomizeWords();
      }, _sendDelay);

      msg = [];

      WORD_SELECTORS.forEach(function(eItem) {
        msg.push(_currentSlideWord($(eItem)));
      });

      _send(msg.join(' '));
    });
  }

  $(document).ready(function() {
    _sendDelay = SEND_DELAY_MIN;

    _initalizeDatabase();

    $.when(
      _loadWords(),
      _signInAnonymously(),
      _checkInitialStatus()
    ).then(function() {
      _initalizeInterface();
      _initalizeListeners();
    }).fail(_kill);
  });

})(window, document, window.jQuery, window.firebase);
