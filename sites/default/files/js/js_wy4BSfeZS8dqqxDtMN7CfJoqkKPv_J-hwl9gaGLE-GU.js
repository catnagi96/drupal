/**
 * @file
 * JavaScript behaviors for webform_image_select and jQuery Image Picker integration.
 */

(function ($, Drupal) {

  'use strict';

  // @see https://rvera.github.io/image-picker/
  Drupal.webform = Drupal.webform || {};
  Drupal.webform.imageSelect = Drupal.webform.imageSelect || {};
  Drupal.webform.imageSelect.options = Drupal.webform.imageSelect.options || {};

  /**
   * Initialize image select.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformImageSelect = {
    attach: function (context) {
      if (!$.fn.imagepicker) {
        return;
      }

      $('.js-webform-image-select', context).once('webform-image-select').each(function () {
        var $select = $(this);
        var isMultiple = $select.attr('multiple');

        // Apply image data to options.
        var images = JSON.parse($select.attr('data-images'));
        for (var value in images) {
          if (images.hasOwnProperty(value)) {
            var image = images[value];
            // Escape double quotes in value
            value = value.toString().replace(/"/g, '\\"');
            $select.find('option[value="' + value + '"]').attr({
              'data-img-src': image.src,
              'data-img-label': image.text,
              'data-img-alt': image.text
            });
          }
        }

        var options = $.extend({
          hide_select: false
        }, Drupal.webform.imageSelect.options);

        if ($select.attr('data-show-label')) {
          options.show_label = true;
        }

        $select.imagepicker(options);

        // Add very basic accessibility to the image picker by
        // enabling tabbing and toggling via the spacebar.
        // @see https://github.com/rvera/image-picker/issues/108

        // Block select menu from being tabbed.
        $select.attr('tabindex', '-1');

        if (isMultiple) {
          $select.next('.image_picker_selector').attr('role', 'radiogroup');
        }

        var $thumbnail = $select.next('.image_picker_selector').find('.thumbnail');
        $thumbnail
          // Allow thumbnail to be tabbed.
          .prop('tabindex', '0')
          .attr('role', isMultiple ? 'checkbox' : 'radio')
          .each(function () {
            var alt = $(this).find('img').attr('alt');
            // Cleanup alt, set title, and fix aria.
            if (alt) {
              alt = alt.replace(/<\/?[^>]+(>|$)/g, '');
              $(this).find('img').attr('alt', alt);
              $(this).attr('title', alt);
            }

            // Aria hide caption since the 'title' attribute will be read aloud.
            $(this).find('p').attr('aria-hidden', true);
          })
          .on('focus', function (event) {
            $(this).addClass('focused');
          })
          .on('blur', function (event) {
            $(this).removeClass('focused');
          })
          .on('keydown', function (event) {
            if (event.which === 32) {
              // Space.
              $(this).trigger('click');
              event.preventDefault();
            }
            else if (event.which === 37 || event.which === 38) {
              // Left or Up.
              var $prev = $(this).parent();
              do {
                $prev = $prev.prev();
              }
              while ($prev.length && $prev.is(':hidden'));
              $prev.find('.thumbnail').trigger('focus');
              event.preventDefault();
            }
            else if (event.which === 39 || event.which === 40) {
              // Right or Down.
              var $next = $(this).parent();
              do {
                $next = $next.next();
              }
              while ($next.length && $next.is(':hidden'));
              $next.find('.thumbnail').trigger('focus');
              event.preventDefault();
            }
          })
          .on('click', function (event) {
            var selected = $(this).hasClass('selected');
            $(this).attr('aria-checked', selected);
          });
      });
    }
  };

})(jQuery, Drupal);
;
/**
 * @file
 * JavaScript behaviors for webform custom options.
 */

(function ($, Drupal) {

  'use strict';

  Drupal.webformOptionsCustom = Drupal.webformOptionsCustom || {};

  // @see http://api.jqueryui.com/tooltip/
  Drupal.webformOptionsCustom.tippy = Drupal.webformOptionsCustom.tippy || {};
  Drupal.webformOptionsCustom.tippy.options = Drupal.webformOptionsCustom.tippy.options || {
    delay: 300,
    allowHTML: true,
    followCursor: true
  };

  // @see https://github.com/ariutta/svg-pan-zoom
  Drupal.webformOptionsCustom.panAndZoom = Drupal.webformOptionsCustom.panAndZoom || {};
  Drupal.webformOptionsCustom.panAndZoom.options = Drupal.webformOptionsCustom.panAndZoom.options || {
    controlIconsEnabled: true,
    // Mouse event must be enable to allow keyboard accessibility to
    // continue to work.
    preventMouseEventsDefault: false,
    // Prevent scroll wheel zoom to allow users to scroll past the SVG graphic.
    mouseWheelZoomEnabled: false
  };

  /**
   * Custom options.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for the block settings summaries.
   */
  Drupal.behaviors.webformOptionsCustom = {
    attach: function (context) {
      $('.js-webform-options-custom', context).once('webform-options-custom').each(function () {
        var $element = $(this);
        var $select = $element.find('select');
        var $template = $element.find('.webform-options-custom-template');
        var $svg = $template.children('svg');

        // Get select menu options.
        var descriptions = $element.attr('data-descriptions') ? JSON.parse($element.attr('data-descriptions')) : {};
        var selectOptions = {};
        $select.find('option').each(function () {
          selectOptions[this.value] = this;
          selectOptions[this.value].description = descriptions[this.value];
        });

        var hasMultiple = $select.is('[multiple]');
        var hasFill = $element.is('[data-fill]');
        var hasZoom = $element.is('[data-zoom]');
        var hasTooltip = $element.is('[data-tooltip]');
        var hasSelectHidden = $element.is('[data-select-hidden]');

        var $templateOptions = $template.find('[data-option-value]');
        var $focusableTemplateOptions = $templateOptions.not('text');

        // If select is hidden set its tabindex to -1 to prevent focus.
        if (hasSelectHidden) {
          $select.attr('tabindex', '-1');
        }

        // Initialize template options.
        $templateOptions.each(function () {
          var $templateOption = $(this);
          var value = $templateOption.attr('data-option-value');
          var option = selectOptions[value];

          // If select menu option is missing remove the
          // 'data-option-value' attribute.
          if (!option) {
            $templateOption.removeAttr('data-option-value');
            return;
          }

          initializeSelectOption(option);
          initializeTemplateOption($templateOption, option);
          initializeTemplateTooltip($templateOption, option);
        });

        // Pan and zoom.
        initializeZoom();

        // Select event handling.
        $select.on('change', setSelectValue);

        // Template event handling.
        $template
          .on('click', setTemplateValue)
          .on('click', setTemplateValue)
          .on('keydown', function (event) {
            var $templateOption = $(event.target);
            if (!$templateOption.is('[data-option-value]')) {
              return;
            }

            // Space or return.
            if (event.which === 32 || event.which === 13) {
              setTemplateValue(event);
              event.preventDefault();
              return;
            }

            if (event.which >= 37 && event.which <= 40) {
              var $prev;
              var $next;
              $focusableTemplateOptions.each(function (index) {
                if (this === event.target) {
                  $prev = $focusableTemplateOptions[index - 1] ? $($focusableTemplateOptions[index - 1]) : null;
                  $next = $focusableTemplateOptions [index + 1] ? $($focusableTemplateOptions[index + 1]) : null;
                }
              });
              if (event.which === 37 || event.which === 38) {
                if ($prev) {
                  $prev.trigger('focus');
                }
              }
              else if (event.which === 39 || event.which === 40) {
                if ($next) {
                  $next.trigger('focus');
                }
              }
              event.preventDefault();
              return;
            }
          });

        setSelectValue();

        /* ****************************************************************** */
        /*  See select and template value callbacks. */
        /* ****************************************************************** */

        /**
         * Set select menu options value
         */
        function setSelectValue() {
          var values = (hasMultiple) ? $select.val() : [$select.val()];
          clearTemplateOptions();
          $(values).each(function (index, value) {
            $template.find('[data-option-value="' + value + '"]')
              .attr('aria-checked', 'true');
          });
          setTemplateTabIndex();
        }

        /**
         * Set template options value.
         *
         * @param {jQuery.Event} event
         *   The event triggered.
         */
        function setTemplateValue(event) {
          var $templateOption = $(event.target);
          if (!$templateOption.is('[data-option-value]')) {
            $templateOption = $templateOption.parents('[data-option-value]');
          }
          if ($templateOption.is('[data-option-value]')) {
            setValue($templateOption.attr('data-option-value'));
            if ($templateOption.is('[href]')) {
              event.preventDefault();
            }
          }
          setTemplateTabIndex();
        }

        /**
         * Set template tab index.
         *
         * @see https://www.w3.org/TR/wai-aria-practices/#kbd_roving_tabindex
         */
        function setTemplateTabIndex() {
          if (hasMultiple) {
            return;
          }

          // Remove existing tabindex.
          $template
            .find('[data-option-value][tabindex="0"]')
            .attr('tabindex', '-1');

          // Find checked.
          var $checked = $template
            .find('[data-option-value][aria-checked="true"]');
          if ($checked.length) {
            // Add tabindex to checked options.
            $checked.not('text').first().attr('tabindex', '0');
          }
          else {
            // Add tabindex to the first not disabled  and <text>
            // template option.
            $template
              .find('[data-option-value]')
              .not('[aria-disabled="true"], text')
              .first()
              .attr('tabindex', '0');
          }
        }

        /**
         * Set the custom options value.
         *
         * @param {string} value
         *  Custom option value.
         */
        function setValue(value) {
          if (selectOptions[value].disabled) {
            return;
          }

          var $templateOption = $template.find('[data-option-value="' + value + '"]');
          if ($templateOption.attr('aria-checked') === 'true') {
            selectOptions[value].selected = false;
            $template.find('[data-option-value="' + value + '"]')
              .attr('aria-checked', 'false');
          }
          else {
            if (!hasMultiple) {
              clearTemplateOptions();
            }
            selectOptions[value].selected = true;
            $template.find('[data-option-value="' + value + '"]')
              .attr('aria-checked', 'true');
          }

          // Never alter SVG <text> elements.
          if ($templateOption[0].tagName === 'text') {
            $template
              .find('[data-option-value="' + value + '"]')
              .not('text')
              .first()
              .trigger('focus');
          }

          $select.trigger('change');
        }

        /* ****************************************************************** */
        /*  Initialize methods. */
        /* ****************************************************************** */

        /**
         * Initialize a select option.
         *
         * @param {object} option
         *   The select option.
         */
        function initializeSelectOption(option) {
          // Get description and set text.
          var text = option.text;
          var description = '';
          if (text.indexOf(' -- ') !== -1) {
            var parts = text.split(' -- ');
            text = parts[0];
            description = parts[1];
            // Reset option text.
            option.text = text;
            option.description = description;
          }
        }

        /**
         * Initialize a template option.
         *
         * @param {object} $templateOption
         *   The template option.
         * @param {object} option
         *   The select option.
         */
        function initializeTemplateOption($templateOption, option) {
          // Never alter SVG <text> elements.
          if ($templateOption[0].tagName === 'text') {
            return;
          }

          // Set ARIA attributes.
          $templateOption
            .attr('role', (hasMultiple) ? 'radio' : 'checkbox')
            .attr('aria-checked', 'false');

          // Remove SVG fill style property so that we can change an option's
          // fill property via CSS.
          // @see webform_options_custom.element.css
          if (hasFill) {
            $templateOption.css('fill', '');
          }

          // Set tabindex or disabled.
          if (option.disabled) {
            $templateOption.attr('aria-disabled', 'true');
          }
          else {
            $templateOption.attr('tabindex', (hasMultiple) ? '0' : '-1');
          }
        }

        /**
         * Initialize a template tooltip.
         *
         * @param {object} $templateOption
         *   The template option.
         * @param {object} option
         *   The select option.
         */
        function initializeTemplateTooltip($templateOption, option) {
          if (!hasTooltip || !window.tippy) {
            return;
          }

          var content = '<div class="webform-options-custom-tooltip--text" data-tooltip-value="' + Drupal.checkPlain(option.value) + '">' + Drupal.checkPlain(option.text) + '</div>';
          if (option.description) {
            content += '<div class="webform-options-custom-tooltip--description">' + option.description + '</div>';
          }

          var tooltipOptions = $.extend({
            content: content,
          }, Drupal.webformOptionsCustom.tippy.options);
          tippy($templateOption[0], tooltipOptions);
        }

        /**
         * Initialize SVG pan and zoom.
         */
        function initializeZoom() {
          if (!hasZoom || !window.svgPanZoom || !$svg.length) {
            return;
          }
          var options = $.extend({
          }, Drupal.webformOptionsCustom.panAndZoom.options);
          var panZoom = window.svgPanZoom($svg[0], options);
          $(window).on('resize', function () {
            panZoom.trigger('resize');
            panZoom.fit();
            panZoom.center();
          });
        }

        /* ****************************************************************** */
        /*  Clear methods. */
        /* ****************************************************************** */

        /**
         * Clear all template options.
         */
        function clearTemplateOptions() {
          $templateOptions.attr('aria-checked', 'false');
        }

      });
    }
  };

})(jQuery, Drupal);
;
