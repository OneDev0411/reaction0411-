Tinytest.add('bunyan', function(test) {
  test.isNotNull(logger, 'logger should be available');
  test.isNotNull(bunyan, 'bunyan should be available');
});
