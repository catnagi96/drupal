/**
 * @file
 * JavaScript behaviors for signature pad integration.
 */

(function ($, Drupal, debounce) {

  'use strict';

  // @see https://github.com/szimek/signature_pad#options
  Drupal.webform = Drupal.webform || {};
  Drupal.webform.signaturePad = Drupal.webform.signaturePad || {};
  Drupal.webform.signaturePad.options = Drupal.webform.signaturePad.options || {};

  /**
   * Initialize signature element.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformSignature = {
    attach: function (context) {
      if (!window.SignaturePad) {
        return;
      }

      $(context).find('input.js-webform-signature').once('webform-signature').each(function () {
        var $input = $(this);
        var value = $input.val();
        var $wrapper = $input.parent();
        var $canvas = $wrapper.find('canvas');
        var $button = $wrapper.find(':button, :submit');
        var canvas = $canvas[0];

        var refresh = function () {
          // Set dimensions.
          $canvas.attr('width', $wrapper.width());
          $canvas.attr('height', $wrapper.width() / 3);
          // Set signature.
          signaturePad.clear();
          var value = $input.val();
          if (value) {
            signaturePad.fromDataURL(value);
          }
        };

        // Initialize signature canvas.
        var options = $.extend({
          onEnd: function () {
            $input.val(signaturePad.toDataURL());
          }
        }, Drupal.webform.signaturePad.options);
        var signaturePad = new SignaturePad(canvas, options);

        // Disable the signature pad when input is disabled or readonly.
        if ($input.is(':disabled') || $input.is('[readonly]')) {
          signaturePad.off();
          $button.hide();
        }

        // Set resize handler.
        $(window).on('resize', debounce(refresh, 10));

        // Set reset handler.
        $button.on('click', function () {
          signaturePad.clear();
          $input.val('');
          $(this).trigger('blur');
          return false;
        });

        // Input onchange clears signature pad if value is empty.
        // Onchange events handlers are triggered when a webform is
        // hidden or shown.
        // @see webform.states.js
        // @see triggerEventHandlers()
        $input.on('change', function () {
          setTimeout(refresh, 1);
        });

        // Turn signature pad off/on when the input
        // is disabled/readonly/enabled.
        // @see webform.states.js
        $input.on('webform:disabled webform:readonly', function () {
          if ($input.is(':disabled') || $input.is('[readonly]')) {
            signaturePad.off();
            $button.hide();
          }
          else {
            signaturePad.on();
            $button.show();
          }
        });

        // Make sure that the signature pad is initialized.
        setTimeout(refresh, 1);
      });
    }
  };

})(jQuery, Drupal, Drupal.debounce);
;
/**
 * @file
 * JavaScript behaviors for Text format integration.
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Enhance text format element.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformTextFormat = {
    attach: function (context) {
      $(context).find('.js-text-format-wrapper textarea').once('webform-text-format').each(function () {
        if (!window.CKEDITOR) {
          return;
        }

        var $textarea = $(this);
        // Update the CKEDITOR when the textarea's value has changed.
        // @see webform.states.js
        $textarea.on('change', function () {
          if (CKEDITOR.instances[$textarea.attr('id')]) {
            var editor = CKEDITOR.instances[$textarea.attr('id')];
            editor.setData($textarea.val());
          }
        });

        // Set CKEDITOR to be readonly when the textarea is disabled.
        // @see webform.states.js
        $textarea.on('webform:disabled', function () {
          if (CKEDITOR.instances[$textarea.attr('id')]) {
            var editor = CKEDITOR.instances[$textarea.attr('id')];
            editor.setReadOnly($textarea.is(':disabled'));
          }
        });

      });
    }
  };

})(jQuery, Drupal);
;
/**
 * @file
 * JavaScript behaviors for terms of service.
 */

(function ($, Drupal) {

  'use strict';

  // @see http://api.jqueryui.com/dialog/
  Drupal.webform = Drupal.webform || {};
  Drupal.webform.termsOfServiceModal = Drupal.webform.termsOfServiceModal || {};
  Drupal.webform.termsOfServiceModal.options = Drupal.webform.termsOfServiceModal.options || {};

  /**
   * Initialize terms of service element.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformTermsOfService = {
    attach: function (context) {
      $(context).find('.js-form-type-webform-terms-of-service').once('webform-terms-of-service').each(function () {
        var $element = $(this);
        var $a = $element.find('label a');
        var $details = $element.find('.webform-terms-of-service-details');

        var type = $element.attr('data-webform-terms-of-service-type');

        // Initialize the modal.
        if (type === 'modal') {
          // Move details title to attribute.
          var $title = $element.find('.webform-terms-of-service-details--title');
          if ($title.length) {
            $details.attr('title', $title.text());
            $title.remove();
          }

          var options = $.extend({
            modal: true,
            autoOpen: false,
            minWidth: 600,
            maxWidth: 800
          }, Drupal.webform.termsOfServiceModal.options);
          $details.dialog(options);
        }

        // Add aria-* attributes.
        if (type !== 'modal') {
          $a.attr({
            'aria-expanded': false,
            'aria-controls': $details.attr('id')
          });
        }

        // Set event handlers.
        $a.on('click', openDetails)
          .on('keydown', function (event) {
            // Space or Return.
            if (event.which === 32 || event.which === 13) {
              openDetails(event);
            }
          });

        function openDetails(event) {
          if (type === 'modal') {
            $details.dialog('open');
          }
          else {
            var expanded = ($a.attr('aria-expanded') === 'true');

            // Toggle `aria-expanded` attributes on link.
            $a.attr('aria-expanded', !expanded);

            // Toggle details.
            $details[expanded ? 'slideUp' : 'slideDown']();
          }
          event.preventDefault();
        }
      });
    }
  };

})(jQuery, Drupal);
;
