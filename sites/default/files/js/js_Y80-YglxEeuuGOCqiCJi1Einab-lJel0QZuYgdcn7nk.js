/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
};
/*! @drupal/once - v1.0.1 - 2021-06-12 */
var once=function(){"use strict";var n=/[\11\12\14\15\40]+/,e="data-once",t=document;function r(n,t,r){return n[t+"Attribute"](e,r)}function o(e){if("string"!=typeof e)throw new TypeError("once ID must be a string");if(""===e||n.test(e))throw new RangeError("once ID must not be empty or contain spaces");return'[data-once~="'+e+'"]'}function u(n){if(!(n instanceof Element))throw new TypeError("The element must be an instance of Element");return!0}function i(n,e){void 0===e&&(e=t);var r=n;if(null===n)r=[];else{if(!n)throw new TypeError("Selector must not be empty");"string"!=typeof n||e!==t&&!u(e)?n instanceof Element&&(r=[n]):r=e.querySelectorAll(n)}return Array.prototype.slice.call(r)}function c(n,e,t){return e.filter((function(e){var r=u(e)&&e.matches(n);return r&&t&&t(e),r}))}function f(e,t){var o=t.add,u=t.remove,i=[];r(e,"has")&&r(e,"get").trim().split(n).forEach((function(n){i.indexOf(n)<0&&n!==u&&i.push(n)})),o&&i.push(o);var c=i.join(" ");r(e,""===c?"remove":"set",c)}function a(n,e,t){return c(":not("+o(n)+")",i(e,t),(function(e){return f(e,{add:n})}))}return a.remove=function(n,e,t){return c(o(n),i(e,t),(function(e){return f(e,{remove:n})}))},a.filter=function(n,e,t){return c(o(n),i(e,t))},a.find=function(n,e){return i(n?o(n):"[data-once]",e)},a}();

;
/**
 * @file
 * JavaScript behaviors for filter by text.
 */

(function ($, Drupal, debounce) {

  'use strict';

  /**
   * Filters the webform element list by a text input search string.
   *
   * The text input will have the selector `input.webform-form-filter-text`.
   *
   * The target element to do searching in will be in the selector
   * `input.webform-form-filter-text[data-element]`
   *
   * The text source where the text should be found will have the selector
   * `.webform-form-filter-text-source`
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for the webform element filtering.
   */
  Drupal.behaviors.webformFilterByText = {
    attach: function (context, settings) {
      $('input.webform-form-filter-text', context).once('webform-form-filter-text').each(function () {
        var $input = $(this);
        $input.wrap('<div class="webform-form-filter"></div>');
        var $reset = $('<input class="webform-form-filter-reset" type="reset" title="Clear the search query." value="???" style="display: none" />');
        $reset.insertAfter($input);
        var $table = $($input.data('element'));
        var $summary = $($input.data('summary'));
        var $noResults = $($input.data('no-results'));
        var $details = $table.closest('details');
        var $filterRows;

        var focusInput = $input.data('focus') || 'true';
        var sourceSelector = $input.data('source') || '.webform-form-filter-text-source';
        var parentSelector = $input.data('parent') || 'tr';
        var selectedSelector = $input.data('selected') || '';

        var hasDetails = $details.length;
        var totalItems;
        var args = {
          '@item': $input.data('item-singlular') || Drupal.t('item'),
          '@items': $input.data('item-plural') || Drupal.t('items'),
          '@total': null
        };

        if ($table.length) {
          $filterRows = $table.find(sourceSelector);
          $input
            .attr('autocomplete', 'off')
            .on('keyup', debounce(filterElementList, 200))
            .keyup();

          $reset.on('click', resetFilter);

          // Make sure the filter input is always focused.
          if (focusInput === 'true') {
            setTimeout(function () {$input.trigger('focus');});
          }
        }


        /**
         * Reset the filtering
         *
         * @param {jQuery.Event} e
         *   The jQuery event for the keyup event that triggered the filter.
         */
        function resetFilter(e) {
          $input.val('').keyup();
          $input.trigger('focus');
        }

        /**
         * Filters the webform element list.
         *
         * @param {jQuery.Event} e
         *   The jQuery event for the keyup event that triggered the filter.
         */
        function filterElementList(e) {
          var query = $(e.target).val().toLowerCase();

          // Filter if the length of the query is at least 2 characters.
          if (query.length >= 2) {
            // Reset count.
            totalItems = 0;
            if ($details.length) {
              $details.hide();
            }
            $filterRows.each(toggleEntry);

            // Announce filter changes.
            // @see Drupal.behaviors.blockFilterByText
            Drupal.announce(Drupal.formatPlural(
              totalItems,
              '1 @item is available in the modified list.',
              '@total @items are available in the modified list.',
              args
            ));
          }
          else {
            totalItems = $filterRows.length;
            $filterRows.each(function (index) {
              $(this).closest(parentSelector).show();
              if ($details.length) {
                $details.show();
              }
            });
          }

          // Set total.
          args['@total'] = totalItems;

          // Hide/show no results.
          $noResults[totalItems ? 'hide' : 'show']();

          // Hide/show reset.
          $reset[query.length ? 'show' : 'hide']();

          // Update summary.
          if ($summary.length) {
            $summary.html(Drupal.formatPlural(
              totalItems,
              '1 @item',
              '@total @items',
              args
            ));
            $summary[totalItems ? 'show' : 'hide']();
          }

          /**
           * Shows or hides the webform element entry based on the query.
           *
           * @param {number} index
           *   The index in the loop, as provided by `jQuery.each`
           * @param {HTMLElement} label
           *   The label of the webform.
           */
          function toggleEntry(index, label) {
            var $label = $(label);
            var $row = $label.closest(parentSelector);

            var textMatch = $label.text().toLowerCase().indexOf(query) !== -1;
            var isSelected = (selectedSelector && $row.find(selectedSelector).length) ? true : false;

            var isVisible = textMatch || isSelected;
            $row.toggle(isVisible);
            if (isVisible) {
              totalItems++;
              if (hasDetails) {
                $row.closest('details').show();
              }
            }
          }
        }
      });
    }
  };

})(jQuery, Drupal, Drupal.debounce);
;
/**
 * @file
 * JavaScript behaviors for admin pages.
 */

(function ($, Drupal, debounce) {

  'use strict';

  /**
   * Filter webform autocomplete handler.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformFilterAutocomplete = {
    attach: function (context) {
      $('.webform-filter-form input.form-autocomplete', context).once('webform-autocomplete')
        .each(function () {
          // If input value is an autocomplete match, reset the input to its
          // default value.
          if (/\(([^)]+)\)$/.test(this.value)) {
            this.value = this.defaultValue;
          }

          // From: http://stackoverflow.com/questions/5366068/jquery-ui-autocomplete-submit-onclick-result
          $(this).bind('autocompleteselect', function (event, ui) {
            if (ui.item) {
              $(this).val(ui.item.value);
              $(this.form).trigger('submit');
            }
          });
        });
    }
  };

  /**
   * Allow table rows to be hyperlinked.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformTableRowHref = {
    attach: function (context) {
      // Only attach the click event handler to the entire table and determine
      // which row triggers the event.
      $('.webform-results-table', context).once('webform-results-table').on('click', function (event) {
        if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON') {
          return true;
        }

        if ($(event.target).parents('a[href]').length || $(event.target).parents('.dropbutton-widget').length) {
          return true;
        }

        var $tr = $(event.target).parents('tr[data-webform-href]');
        if (!$tr.length) {
          return true;
        }

        window.location = $tr.attr('data-webform-href');
        return false;
      });
    }
  };

})(jQuery, Drupal, Drupal.debounce);
;
/**
 * @file
 * JavaScript behaviors for Tippy.js tooltip integration.
 */

(function ($, Drupal) {

  'use strict';

  var tooltipDefaultOptions = {
    delay: 100
  };

  // @see https://atomiks.github.io/tippyjs/v5/all-props/
  // @see https://atomiks.github.io/tippyjs/v6/all-props/
  Drupal.webform = Drupal.webform || {};

  Drupal.webform.tooltipElement = Drupal.webform.tooltipElement || {};
  Drupal.webform.tooltipElement.options = Drupal.webform.tooltipElement.options || tooltipDefaultOptions;

  Drupal.webform.tooltipLink = Drupal.webform.tooltipLink || {};
  Drupal.webform.tooltipLink.options = Drupal.webform.tooltipLink.options || tooltipDefaultOptions;

  /**
   * Initialize tooltip element support.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformTooltipElement = {
    attach: function (context) {
      if (!window.tippy) {
        return;
      }

      $(context).find('.js-webform-tooltip-element').once('webform-tooltip-element').each(function () {
        // Checkboxes, radios, buttons, toggles, etc??? use fieldsets.
        // @see \Drupal\webform\Plugin\WebformElement\OptionsBase::prepare
        var $element = $(this);
        var $description;
        if ($element.is('fieldset')) {
          $description = $element.find('> .fieldset-wrapper > .description > .webform-element-description.visually-hidden');
        }
        else {
          $description = $element.find('> .description > .webform-element-description.visually-hidden');
        }

        var options = $.extend({
          content: $description.html(),
          allowHTML: true
        }, Drupal.webform.tooltipElement.options);

        tippy(this, options);
      });
    }
  };

  /**
   * Initialize jQuery UI tooltip link support.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformTooltipLink = {
    attach: function (context) {
      if (!window.tippy) {
        return;
      }

      $(context).find('.js-webform-tooltip-link').once('webform-tooltip-link').each(function () {
        var title = $(this).attr('title');
        if (title) {
          var options = $.extend({
            content: title,
            allowHTML: true
          }, Drupal.webform.tooltipLink.options);

          tippy(this, options);
        }
      });
    }
  };

})(jQuery, Drupal);
;
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
 * JavaScript behaviors for checkboxes.
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Adds check all or none checkboxes support.
   *
   * @type {Drupal~behavior}
   *
   * @see https://www.drupal.org/project/webform/issues/3068998
   */
  Drupal.behaviors.webformCheckboxesAllorNone = {
    attach: function (context) {
      $('[data-options-all], [data-options-none]', context)
        .once('webform-checkboxes-all-or-none')
        .each(function () {
          var $element = $(this);

          var options_all_value = $element.data('options-all');
          var options_none_value = $element.data('options-none');

          // Get all checkboxes.
          var $checkboxes = $element.find('input[type="checkbox"]');

          // Get all options/checkboxes.
          var $options = $checkboxes
            .not('[value="' + options_all_value + '"]')
            .not('[value="' + options_none_value + '"]');

          // Get options all and none checkboxes.
          var $options_all = $element
            .find(':checkbox[value="' + options_all_value + '"]');
          var $options_none = $element
            .find(':checkbox[value="' + options_none_value + '"]');

          // All of the above.
          if ($options_all.length) {
            $options_all.on('click', toggleCheckAllEventHandler);
            if ($options_all.prop('checked')) {
              toggleCheckAllEventHandler();
            }
          }

          // None of the above.
          if ($options_none.length) {
            $options_none.on('click', toggleCheckNoneEventHandler);
            toggleCheckNoneEventHandler();
          }

          $options.on('click', toggleCheckboxesEventHandler);
          toggleCheckboxesEventHandler();

          /**
           * Toggle check all checkbox checked state.
           */
          function toggleCheckAllEventHandler() {
            if ($options_all.prop('checked')) {
              // Uncheck options none.
              if ($options_none.is(':checked')) {
                $options_none
                  .prop('checked', false)
                  .trigger('change', ['webform.states']);
              }
              // Check check all unchecked options.
              $options.not(':checked')
                .prop('checked', true)
                .trigger('change', ['webform.states']);
            }
            else {
              // Check uncheck all checked options.
              $options.filter(':checked')
                .prop('checked', false)
                .trigger('change', ['webform.states']);
            }
          }

          /**
           * Toggle check none checkbox checked state.
           */
          function toggleCheckNoneEventHandler() {
            if ($options_none.prop('checked')) {
              $checkboxes
                .not('[value="' + options_none_value + '"]')
                .filter(':checked')
                .prop('checked', false)
                .trigger('change', ['webform.states']);
            }
          }

          /**
           * Toggle check all checkbox checked state.
           */
          function toggleCheckboxesEventHandler() {
            var isAllChecked = ($options.filter(':checked').length === $options.length);
            if ($options_all.length
              && $options_all.prop('checked') !== isAllChecked) {
              $options_all
                .prop('checked', isAllChecked)
                .trigger('change', ['webform.states']);
            }
            var isOneChecked = $options.is(':checked');
            if ($options_none.length
              && isOneChecked) {
              $options_none
                .prop('checked', false)
                .trigger('change', ['webform.states']);
            }
          }
        });
    }
  };

})(jQuery, Drupal);
;
/**
 * @file
 * JavaScript behaviors for options elements.
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Attach handlers to options buttons element.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformOptionsButtons = {
    attach: function (context) {
      // Place <input> inside of <label> before the label.
      $(context).find('label.webform-options-display-buttons-label > input[type="checkbox"], label.webform-options-display-buttons-label > input[type="radio"]').each(function () {
        var $input = $(this);
        var $label = $input.parent();
        $input.detach().insertBefore($label);
      });
    }
  };


})(jQuery, Drupal);
;
