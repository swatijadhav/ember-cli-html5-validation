import Ember from 'ember';

/**
 * Simple mixin that wrap the logic of getting and rendering an input error message
 */
export default Ember.Mixin.create({
  /**
   * Title attribute is needed for providing a custom message
   *
   * @type {Array}
   */
  attributeBindings: ['title'],

  /**
   * Decide if we show the native browser error messages
   *
   * @type {boolean}
   */
  useBrowserMessages: false,

  /**
   * Current error message for the field
   *
   * @type {string}
   */
  errorMessage: null,

  /**
   * Allow to override error messages
   *
   * @type {Object}
   */
  errorTemplates: {
    // Errors when an input with "required" attribute has no value
    valueMissing: {
      defaultMessage: 'Value is required',
      checkbox: 'You must check this box',
      select: 'You must select at least an option',
      radio: 'You must select an option'
    },

    // Errors when a value does not match a given type like "url" or "email"
    typeMismatch: {
      defaultMessage: 'Value is invalid',
      email: 'Email address is invalid',
      url: 'URL is invalid'
    },

    // Errors when a value does not follow the "pattern" regex
    patternMismatch: {
      defaultMessage: 'Value does not follow expected pattern'
    },

    // Errors when an input is too long
    tooLong: {
      defaultMessage: 'Enter at most %@ characters'
    },

    // Errors when an input is less than "min" value
    rangeUnderflow: {
      defaultMessage: 'Number must be more than %@'
    },

    // Errors when an input is more than "max" value
    rangeOverflow: {
      defaultMessage: 'Number must be less than %@'
    },

    // Errors when a value does not follow step (for instance for "range" type)
    stepMismatch: {
      defaultMessage: 'Value is invalid'
    },

    // Default message that is used when none is matched
    defaultMessage: 'Value is invalid'
  },

  /**
   * @returns {void}
   */
  attachValidationListener: function() {
    Ember.$(this.get('element')).on('invalid', Ember.run.bind(this, this.validate));
  }.on('didInsertElement'),

  /**
   * @returns {void}
   */
  detachValidationListener: function() {
    Ember.$(this.get('element')).off('invalid');
  }.on('willDestroyElement'),

  /**
   * Validate the input whenever it looses focus
   *
   * @returns {void}
   */
  validate: function() {
    var input = this.get('element');

    // According to spec, inputs that have "formnovalidate" should bypass any validation
    if (input.hasAttribute('formnovalidate')) {
      return;
    }

    if (!input.validity.valid && !input.validity.customError) {
      this.set('errorMessage', this.getErrorMessage());
    } else {
      this.set('errorMessage', null);
      input.setCustomValidity('');
    }
  }.on('focusOut'),

  /**
   * Set a custom error message for the input. Note that we set the error message directly, as well as we
   * set the error using setCustomValidity, so that a call to checkValidate evaluate to false
   *
   * @type {string} error
   * @returns {void}
   */
  setCustomErrorMessage: function(error) {
    this.set('errorMessage', error);
    this.get('element').setCustomValidity(error);
  },

  /**
   * Render the error message bound to the field (or remove if it is null)
   *
   * @TODO: this should be done in a more flexible way to allow custom template
   */
  renderErrorMessage: function() {
    var element = this.$(),
        errorMessage = this.get('errorMessage');

    if (null === errorMessage) {
      element.removeClass('invalid');
      element.siblings('.input-error').remove();
    } else {
      element.siblings('.input-error').remove();
      element.addClass('invalid');
      element.after('<p class="input-error">' + errorMessage + '</p>');
    }
  }.observes('errorMessage'),

  /**
   * Get the message error
   *
   * @returns {String}
   */
  getErrorMessage: function() {
    var target = this.get('element');

    // If user want to use native browser error messages, we directly return
    if (this.get('useBrowserMessages')) {
      return target.validationMessage;
    }

    var errorTemplates = this.get('errorTemplates'),
        type = target.getAttribute('type');

    // We first check for the "required" case
    if (target.validity.valueMissing) {
      // For checkbox, we allow to have a title attribute that is shown instead of the
      // required message. Very useful for things like "You must accept our terms"
      if (type === 'checkbox' && target.hasAttribute('title')) {
        return target.getAttribute('title');
      }

      return errorTemplates.valueMissing[type] || errorTemplates.valueMissing['defaultMessage'];
    }

    // If a "title" attribute has been set, according to the spec, we can use it as the message
    if (target.hasAttribute('title')) {
      return target.getAttribute('title');
    }

    var errorKeys = ['stepMismatch', 'rangeOverflow', 'rangeUnderflow', 'tooLong', 'patternMismatch', 'typeMismatch'];

    for (var i = 0 ; i !== errorKeys.length ; ++i) {
      var errorKey = errorKeys[i];

      if (!target.validity[errorKey]) {
        continue;
      }

      var message = errorTemplates[errorKey][type] || errorTemplates[errorKey]['defaultMessage'];

      switch (errorKey) {
        case 'tooLong':
          return message.fmt(target.getAttribute('maxlength'));
        case 'rangeUnderflow':
          return message.fmt(target.getAttribute('min'));
        case 'rangeOverflow':
          return message.fmt(target.getAttribute('max'));
        default:
          return message;
      }
    }

    return errorTemplates.defaultMessage;
  }
});