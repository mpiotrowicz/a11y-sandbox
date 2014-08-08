var a11yModal = {
  init: function (options) {
    var defaults = {
      $body           : $('body'),
      $modalContainer : $('.modal-container'),
      classOpen       : 'modal--open',
      classTrigger    : 'modal-trigger',
      modalNamespace  : 'a11y_modal'
    };

    this.options = $.extend({}, defaults, options);
    this.bindEvents();
    this.options.$modalContainer.attr('tabindex', '-1');
    this.modalIsOpen = false;
  },

  bindEvents : function () {
    $('.' + this.options.classTrigger).on('click', $.proxy(this.handleClick, this));
    this.options.$modalContainer.on('keydown', $.proxy(this.handleKeyDown, this));
  },

  handleClick: function (evt) {
    evt.preventDefault();

    if (this.modalIsOpen) {
      this.modalClose();
    }
    else {
      this.$modalTrigger = $(evt.currentTarget);
      this.modalOpen();
    }
  },

  handleKeyDown : function (evt) {
    if (this.modalIsOpen) {
      switch (evt.keyCode) {
        // escape
        case 27:
          this.modalClose();
          break;
      }
    }
  },

  modalOpen: function() {
    this.options.$body.addClass(this.options.classOpen);
    this.trapFocus();
    this.options.$modalContainer.focus();
    this.modalIsOpen = true;
  },

  modalClose : function () {
    this.options.$body.removeClass(this.options.classOpen);

    // turn of the focus listener
    this.removeTrapFocus();

    this.$modalTrigger.focus();
    this.modalIsOpen = false;
  },

  trapFocus : function () {
    var $container = this.options.$modalContainer;
    $(document).on('focusin.' + this.options.modalNamespace, function (evt) {
      if ($container[0] !== evt.target && !$container.has(evt.target).length) {
        $container.focus();
      }
    });
  },

  removeTrapFocus : function () {
    $(document).off('focusin.' + this.options.modalNamespace);
  }
};

$(function() {
  a11yModal.init();
});
