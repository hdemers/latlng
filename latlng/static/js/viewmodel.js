/* Author: Hugues Demers
 * Copyrights 2013
 */
define(["knockout"],
function (ko) {
  var exports = {
    sender_email: ko.observable("hugues.demers@gmail.com"),
    recipient_email: ko.observable("hdemers@gmail.com")
  };
  return exports;
});
