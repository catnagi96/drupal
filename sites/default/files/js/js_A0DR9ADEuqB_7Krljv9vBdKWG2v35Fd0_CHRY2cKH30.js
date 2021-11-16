/**
 * @file
 * JavaScript behaviors for details element.
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Attach handler to details with invalid inputs.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformDetailsInvalid = {
    attach: function (context) {
      $('details :input', context).on('invalid', function () {
        $(this).parents('details:not([open])').children('summary').trigger('click');

        // Synd details toggle label.
        if (Drupal.webform && Drupal.webform.detailsToggle) {
          Drupal.webform.detailsToggle.setDetailsToggleLabel($(this.form));
        }
      });
    }
  };

})(jQuery, Drupal);
;
/**
 * @file
 * JavaScript behaviors for select menu.
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Disable select menu options using JavaScript.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformSelectOptionsDisabled = {
    attach: function (context) {
      $('select[data-webform-select-options-disabled]', context).once('webform-select-options-disabled').each(function () {
        var $select = $(this);
        var disabled = $select.attr('data-webform-select-options-disabled').split(/\s*,\s*/);
        $select.find('option').filter(function isDisabled() {
          return ($.inArray(this.value, disabled) !== -1);
        }).attr('disabled', 'disabled');
      });
    }
  };


})(jQuery, Drupal);
;
/**
 * @file
 * JavaScript behaviors for Likert element.
 */

(function ($, Drupal) {

  'use strict';

  $(document).on('state:required', function (e) {
    if (e.trigger && e.target && e.target.id) {
      var $element = $('#' + e.target.id);
      // Add/remove required from the question labels.
      if ($element.hasClass('webform-likert-table')) {
        if (e.value) {
          $element.find('tr td:first-child label').addClass('js-form-required form-required');
        }
        else {
          $element.find('tr td:first-child label').removeClass('js-form-required form-required');
        }
      }
    }
  });

})(jQuery, Drupal);

;
