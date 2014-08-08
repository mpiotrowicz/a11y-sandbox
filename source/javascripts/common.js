
$modalTrigger.on("click", function(e){
  var $modal,
    modalTrigger = e.currentTarget;

  // modal logic here

  // save trigger elem so on modalClose it gets focus
  $modal.data("trigger", modalTrigger);
});

handleModalClose = function() {
  var newFocusElem = $modal.data("trigger");

  // focus returns to the element that triggered the modal
  $(newFocusElem).focus();

  // remove the trigger, might be different next time
  $modal.removeData("trigger");
};

$modalTrigger.on({
  'click': handleTrigger,
  'keydown': function (evt) {
    var keyPressed = evt.keyCode;
    if (keyPressed === app.keyCodes.ENTER || keyPressed === app.keyCodes.SPACE) {
      handleTrigger();
    }
  }
});

onModalOpen = function($modalDom) {
  $modalDom.attr('tabindex', '-1').focus();
};

A11yHelpers.prototype.pageLinkFocus = function ($element) {
  if ($element.length) {
    $element.get(0).tabIndex = -1;
    $element.focus().addClass('js-focus-hidden');
    $element.one('blur', function () {
      $element
        .removeClass('js-focus-hidden')
        .removeAttr('tabindex');

    });
  }
};