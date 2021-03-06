/**
 * A star rating JQuery plugin with support for a "not interested" rating, displaying
 * the user's rating or the average rating for many users, and displaying custom per-star
 * text above the stars while hovering and when a grade is selected.
 *
 * @name rating
 * @function
 * @namespace rating
 * @property {Object} props Key-Value pairs of properties.
 * @property {double} props.averageGrade The average grade the general user population 
 *     has assigned to the item. Must be between 0 and the maximum grade. The 
 *     default is 0.  The widget provides no support for maintaining the average.
 *     Rather it is the client's responsibility to maintain all necessary data
 *     required to compute the average and update the widget accordingly.
 * @property {String} props.clearAcknowledgedText The acknowledged text for the clear 
 *     control. There is no default.
 * @property {String} props.clearHoverText The hover text for the clear control. There 
 *     is no default.
 * @property {int} props.grade The grade (number of "stars") the user has assigned the 
 *     item. Use the keyword "notInterested" for a not interested grade and the 
 *     keyword "clear" to clear the grade (effective, set it to 0). The default is 
 *     "clear".
 * @property {String} props.gradeAcknowledgedText The text that is displayed after 
 *     clicking on a grade component. There is no default.
 * @property {Array} props.gradeHoverTexts The hover texts that will be used for the 
 *     grade controls, ordered from lowest to highest rating.  That is, hoverTexts[0]
 *     will be the hover text associated with the lowest rating; 
 *     hoverTexts[hoverTexts.length-1] with the highest rating. Null can be 
 *     specified as a member of the array. There are no defaults.
 * @property {boolean} props.gradeReadOnly Indicates whether the grade of this rating 
 *     component can be changed by the user. The default is false - it is NOT 
 *     read-only, and therefore can be changed by the user.
 * @property {boolean} props.inAverageMode Indicates whether the component will be 
 *     rendered displaying the average grade. The default is false, the component 
 *     will be rendered showing the user's rating (normal mode).
 * @property {boolean} props.includeClear Indicates whether a control to clear the 
 *     user's rating should be displayed. The default is true.
 * @property {boolean} props.includeModeToggle Indicates whether a control to toggle the
 *     mode (to show the average rating or the user's rating) should be rendered. 
 *     The default is false.
 * @property {boolean} props.includeNotInterested Indicates whether a control to allow
 *     the user to assign a "not interested" rating should be rendered. The default
 *     is true.
 * @property {boolean} props.includeText Indicates whether an area for hover or 
 *     post-click acknowledeged text should be rendered. The default is true.
 * @property {int} props.maxGrade The maximum grade (number of "stars") this rating 
 *     instance allows. There is no default, and so must be set.
 * @property {boolean} props.modeReadOnly Indicates whether the mode of this rating 
 *     component can be changed by the user. The default is false - it is NOT 
 *     read-only, and therefore can be changed by the user.
 * @property {Array} props.modeToggleAcknowledgedTexts The acknowledged texts to be used
 *     for the mode toggle control. The first element of the array is the 
 *     acknowledged text displayed after clicking on the mode toggle control to 
 *     preview the user's rating (normal mode).  The second element is the text 
 *     displayed after clicking to preview the average rating (average mode). Null 
 *     can be specified as a member of the array.
 * @property {Array} props.modeToggleHoverTexts The hover texts to be used for the mode
 *     toggle control. The first element of the array is the hover text displayed 
 *     when hovering over the mode toggle control to preview the user's rating 
 *     (normal mode). The second element is the text displayed when hovering to 
 *     preview the average rating (normal mode). Null can be specified as a member 
 *     of the array.
 * @property {String} props.notInterestedAcknowledgedText The acknowledged text for the
 *     "not interested" control. There is no default.
 * @property {String} props.notInterestedHoverText The hover text for the "not 
 *     interested" control. There is no default.
 * @property {Object} props.payload  Client-specific object associated with the widget,
 *     performs the same function as the "data" attribute does for JQuery objects.
 *     The widget will not modify the object, but will return it as an argument to
 *     event handlers for published events.
 */
(function ($) {

    // Grade value constants must have different values and must be <= 0.
    /**
     * The grade value assigned to the "notInterested" control.
     * @constant {number}
     * @default -1
     * @memberof rating
     * @public
     */
    var CODE_NOTINTERESTED = -1;

    /**
     * The grade value assigned to the "modeToggle" control.
     * @constant {number}
     * @default -2
     * @memberof rating
     * @public
     */
    var CODE_MODETOGGLE = -2;

    /**
     * The grade value assigned to the "clear" control.
     * @constant {number}
     * @default 0
     * @memberof rating
     * @public
     */
    var CODE_CLEAR = 0;

    /**
     * The custom event triggered when the grade is changed.
     * @constant {string}
     * @event gradechanged
     * @memberof rating
     * @property {string} id The id of the rating widget
     * @property {number} grade The grade of the rating widget
     * @property {object} payload The client-provided payload object
     * @public
     */
    var EVENT_GRADE_CHANGE = "gradechanged";

    /**
     * The minimum margin in pixels between grade controls.
     * @constant {number}
     * @default 1
     * @memberof rating
     * @private
     */
    var GRADE_RIGHT_MARGIN = 1;

    /**
     * The gap in pixels between the last grade control and the clear/modeToggle control.
     * @constant {number}
     * @default 10
     * @memberof rating
     * @private
     */
    var SPACER_WIDTH = 10;

    /**
     * The html template for the rating width.
     * @constant {string}
     * @memberof rating
     * @private
     * @default
     */
    var TEMPLATE = '\
<div class="Rating" style="display:block">\n\
  <div class="RatingTextContainer">&nbsp;</div>\n\
  <div class="RatingControlContainer">\n\
    <div><div class="RatingNotInterestedNode"></div></div>\n\
    <div class="RatingGradeContainer">\n\
      <div class="RatingGradeNode"></div>\n\
    </div>\n\
    <div class="RatingSpacerNode"></div>\n\
    <div><div class="RatingClearNode"></div></div>\n\
    <div><div class="RatingModeToggleNode"></div></div>\n\
  </div>\n\
  <input class="RatinghiddenFieldNode" type="hidden"></input>\n\
</div>\n\
';


    // Plugin
    $.fn.rating = function(opts) {
    
        return this.each(function() {
            if ($(this).hasClass("Rating")) {
                var rating = $(this).data("payload");
                rating.setProps(opts);

                // Publish notification of current grade.
                rating.fireGradeChanged(100);
            } else {
                var template = $(TEMPLATE).appendTo($(this));
                var id = opts.id;
                if (id == null) {
                    id = $(template).uniqueId().attr("id");
                } else {
                    $(template).attr("id", id);
                }
                var rating = new Rating(id);
                rating.setProps(opts);
                $("#" + id).data("payload", rating);

                // Get selectors for the notInterested, clear, and modeToggle controls.
                var notInterestedSelector = '#' + id + ' .RatingNotInterestedNode';
                var clearSelector = '#' + id + ' .RatingClearNode';
                var modeToggleSelector = '#' + id + ' .RatingModeToggleNode';

                // Attach payload to of these controls consisting of their unique code values.
                $(notInterestedSelector).data("payload", CODE_NOTINTERESTED);
                $(clearSelector).data("payload", CODE_CLEAR);
                $(modeToggleSelector).data("payload", CODE_MODETOGGLE);

                // Configure event handlers for these controls.
                // We use closure magic to define the scope for the handler with
                // widget object in order to properly process the event.
                var _this = rating;
                $(notInterestedSelector + "," + clearSelector + "," + modeToggleSelector)
                    .mouseenter(function(event) {
                        _this.onMouseCallback($(this).data('payload'), true);
                    })
                    .mouseout(function(event) {
                        _this.onMouseCallback($(this).data('payload'), false);
                    })
                    .click(function(event) {
                        _this.onClickCallback($(this).data('payload'));
                    });

                // Publish notification of initial grade.
                rating.fireGradeChanged(100);
            }
            return $(this);
        });
    };

    /**
     * Backing class for the Rating plugin.
     *
     * @namespace Rating
     * @function Rating
     * @class
     * @param {Object} props Key-Value pairs of properties.
     * @see {@link rating} for list of supported properties
     * @constructor
     * @private
     */
    function Rating(id) {
        this.id = id;

        this.options = {
            includeText: true,
            includeNotInterested: true,
            includeClear: true,
            includeModeToggle: false,
            inAverageMode: false,
            grade: this.CODE_CLEAR,
            averageGrade: 0.0,
            maxGrade: 0,
            gradeReadOnly: false,
            modeReadOnly: false,
            payload: null
        };


        // Set defaults for private data used internally by the widget.
        this.currentText = null;
        this.clicked = false;
        this.mousedover = false;
        this.gradeNodes = null;

        // Set IDs for the controls
        this.notInterestedID = this.id + "_notInterested";
        this.clearID = this.id + "_clear";
        this.modeToggleID = this.id + "_modeToggle";
        this.gradeID = this.id + "_grade";  // actual ID will have ordinal value appended
        this.textID = this.id + "_text";

        this.notInterestedNode = $('#' + this.id + ' .RatingNotInterestedNode');
        this.clearNode = $('#' + this.id + ' .RatingClearNode');
        this.modeToggleNode = $('#' + this.id + ' .RatingModeToggleNode');

        // Initialize maintenance of width dimensions for controlContainer images.
        // Required because we will always need to maintain the width of the control
        // area, which depends on the number of images to be rendered.  The computed
        // width will be a "best fit" - just enough to encompass the required
        // image controls.
        this.imageWidths = new Object();
        this.imageWidths["notInterested"] = 0;
        this.imageWidths["grades"] = 0;
        this.imageWidths["spacer"] = 0;
        this.imageWidths["clear"] = 0;
        this.imageWidths["modeToggle"] = 0;
    };

    /**
     * This function is used to set widget properties using Object literals.
     * Note: This function extends the widget object for later updates. Further, the
     * widget shall be updated only for the given key-value pairs.
     *
     * If the notify param is true, the widget's state change event shall be
     * published. This is typically used to keep client-side state in sync with the
     * server.
     *
     * @function
     * @memberof Rating
     * @this Rating
     * @instance
     * @param {Object} props Key-Value pairs of properties.
     * @see {@link rating} for list of supported properties
     * @return {boolean} true if successful; otherwise, false.
     * @private
     */
    function setProps(props) {
        if (props == null) {
            return false;
        }

        var createGradeControls = false
    
        // We are trying to deal with a state change which requires
        // knowing what the current state of the widget is and the
        // state as defined in props. In order to compare the states
        // it must be done in setProps before the "props" are extended
        // onto the widget. At that point there is no difference between
        // "props" and "this".
        //
        if (props.gradeReadOnly != null 
                && props.gradeReadOnly != this.options.gradeReadOnly) {
            createGradeControls = true;
        }
        if (props.modeReadOnly != null 
                && props.modeReadOnly != this.options.modeReadOnly) {
            createGradeControls = true;
        }
        if (props.inAverageMode != null 
                && props.inAverageMode != this.options.inAverageMode) {
            createGradeControls = true;
        }
        if (props.maxGrade != null && props.maxGrade != this.options.maxGrade) {
            createGradeControls = true;
        }
        if (props.averageGrade != null) {
            var f = parseFloat(props.averageGrade);
            if (!isNaN(f) && (f != this.options.averageGrade)) {
                createGradeControls = true;
            }
        }
        if (props.grade != null) {
    	    if (props.grade == "notInterested") {
                props.grade = this.CODE_NOTINTERESTED;
            } else if (props.grade == "clear") {
                props.grade = this.CODE_CLEAR;
            } else {
                var n = parseInt(props.grade);
                if (!isNaN(n))
                    props.grade = n;
            }
            if (props.grade != this.options.grade) {
                createGradeControls = true;
            }
        }
        if (props.maxGrade != null && props.maxGrade != this.options.maxGrade) {
            createGradeControls = true;
        }

        // Extend specified properties onto the widget.
        this.options = $.extend(this.options, props);

        var hiddenClass = "hidden";
        var hoverClass = "RatingHover";

        // Assume width of control container does NOT need to be recalculated, prove otherwise based on 
        // properties that change.
        var changeControlWidth = false;

        // Text area
        if (this.options.includeText != null) {
            var textContainer = $('#' + this.id + ' .RatingTextContainer');
            if (this.options.includeText == true) {
                // Remove hidden class
                textContainer.removeClass(hiddenClass);
            } else {
                // Add hidden class
                textContainer.addClass(hiddenClass);
            }
        }

        // Not Interested control
        if (this.options.includeNotInterested != null) {
            this.notInterestedNode.attr('id', this.notInterestedID);
            var imageWidth = 0;
    
            if (this.options.includeNotInterested == true) {
                // Remove hidden class
                this.notInterestedNode.removeClass(hiddenClass);
    
                if (this.options.grade == CODE_NOTINTERESTED) {
                    this.notInterestedNode
                        .removeClass("RatingNotInterestedOffImage")
                        .addClass("RatingNotInterestedOnImage");
    
                } else {
                    this.notInterestedNode
                        .removeClass("RatingNotInterestedOnImage")
                        .addClass("RatingNotInterestedOffImage");
                }

                // Get image width
                imageWidth = this.notInterestedNode.width();
    
                // Add right margin
                imageWidth += GRADE_RIGHT_MARGIN;
    
            } else {
                // Add hidden class
                this.notInterestedNode.addClass(hiddenClass);
            }
    
            // Record image width if changing and flag that control container width must be recomputed.
            if (imageWidth != this.imageWidths["notInterested"]) {
                this.imageWidths["notInterested"] = imageWidth;
                changeControlWidth = true;
            }
        }
        if (this.options.includeNotInterested) {
            if (this.options.gradeReadOnly) {
                this.notInterestedNode.removeClass("RatingHover");
            } else {
                this.notInterestedNode.addClass("RatingHover");
            }
        }

        // If creating grade controls, delete existing ones if they exist
        if (createGradeControls == true) {
            $('#' + this.id + ' .RatingGradeNode').remove();
            this.gradeNodes = null;
            this.imageWidths["grades"] = 0;
        }

        // Grade controls
        if ((createGradeControls == true) && (this.options.maxGrade > 0)) {
            var imageWidths = 0;
            this.gradeNodes = new Array(this.options.maxGrade);
    
            for (var i = 1; i <= this.options.maxGrade; i++) {
                // Get image class for this grade control for the display mode
                var className = null;
                if (this.options.inAverageMode) {
                    className = this.getGradeImageClass(true, this.options.averageGrade, i);
                } else {
                    className = this.getGradeImageClass(false, this.options.grade, i);
                }
    
                // Add grade control to grade container.
                var gradeNode = $("<div></div>")
                    .attr("id",  this.gradeID + i)
                    .addClass("RatingGradeNode")
                    .addClass(className)
                    .data('payload', i)
                    .appendTo($('#' + this.id + ' .RatingGradeContainer'));
                if (!this.options.gradeReadOnly) {
                    gradeNode.addClass(hoverClass);
                }
    
                // Maintain running image width for grades
                imageWidths += (gradeNode.width() + GRADE_RIGHT_MARGIN);
    
                // Save handle to cloned node for quick access later on.
                this.gradeNodes[i-1] = gradeNode;
            }

            // Configure event handlers for grade controls.
            // We use closure magic to define the scope for the handler with
            // widget object in order to properly process the event.
            var _this = this;
            $('#' + this.id + ' .RatingGradeNode')
                .mouseenter(function(event) {
                    _this.onMouseCallback($(this).data('payload'), true);
                })
                .mouseout(function(event) {
                    _this.onMouseCallback($(this).data('payload'), false);
                })
                .click(function(event) {
                    _this.onClickCallback($(this).data('payload'));
                });

            // Record image widths if changing and flag that control container width must be recomputed.
            if (imageWidths != this.imageWidths["grades"]) {
                this.imageWidths["grades"] = imageWidths;
                changeControlWidth = true;
            }
        }

        // Clear grade control
        if (this.options.includeClear != null) {
            this.clearNode.attr('id', this.clearID);
            var imageWidth = 0;
    
            if (this.options.includeClear == true) {
                var clearOff = "RatingClearOffImage";
                var clearOn = "RatingClearOnImage";
    
                // Remove hidden class
                this.clearNode.removeClass(hiddenClass);
    
                if (this.options.grade == CODE_CLEAR) {
                    this.clearNode.removeClass(clearOff).addClass(clearOn);
                } else {
                    this.clearNode.removeClass(clearOn).addClass(clearOff);
                }

                // Get image width
                imageWidth = this.clearNode.width();

                // Add right margin
                imageWidth += GRADE_RIGHT_MARGIN;
            } else {
                // Add hidden class
                this.clearNode.addClass(hiddenClass);
            }

            // Record image width if changing and flag that control container width must be recomputed.
            if (imageWidth != this.imageWidths["clear"]) {
                this.imageWidths["clear"] = imageWidth;
                changeControlWidth = true;
            }
        }
        if (this.options.includeClear) {
            if (this.options.gradeReadOnly) {
                this.clearNode.removeClass(hoverClass);
            } else {
                this.clearNode.addClass(hoverClass);
            }
        }

        // Mode toggle control
        if (this.options.includeModeToggle != null) {
            this.modeToggleNode.attr('id', this.modeToggleID);
            var imageWidth = 0;
    
            if (this.options.includeModeToggle == true) {
                var normalMode = "RatingModeNormalImage";
                var averageMode = "RatingModeAverageImage";
    
                // Remove hidden class
                this.modeToggleNode.removeClass(hiddenClass);

                if (this.options.inAverageMode == true) {
                    this.modeToggleNode.removeClass(normalMode).addClass(averageMode);
                }
                else {
                    this.modeToggleNode.removeClass(averageMode).addClass(normalMode);
                }
                imageWidth = this.modeToggleNode.width();
            } else {
                // Add hidden class
                this.modeToggleNode.addClass(hiddenClass);
            }

            // Record image width if changing and flag that control container width
            //  must be recomputed.
            if (imageWidth != this.imageWidths["modeToggle"]) {
                this.imageWidths["modeToggle"] = imageWidth;
                changeControlWidth = true;
            }
        }
        if (this.options.includeModeToggle) {
            if (this.options.modeReadOnly) {
                this.modeToggleNode.removeClass(hoverClass);
            } else {
                this.modeToggleNode.addClass(hoverClass);
            }
        }

        // Spacer between grade controls and clear/modeToggle controls
        if ((this.imageWidths["clear"] > 0) || (this.imageWidths["modeToggle"] > 0)) {
            // Remove hidden class
            $('#' + this.id + ' .RatingSpacerNode').removeClass(hiddenClass);

            // Record spacer width if changing and flag that control container width must be recomputed.
            if (this.imageWidths["spacer"] == 0) {
                this.imageWidths["spacer"] = SPACER_WIDTH;
                changeControlWidth = true;
            }
        } else {
            // Add hidden class
            $('#' + this.id + ' .RatingSpacerNode').addClass(hiddenClass);

            // Record spacer width if changing and flag that control container width must be recomputed.
            if (this.imageWidths["spacer"] != 0) {
                this.imageWidths["spacer"] = 0;
                changeControlWidth = true;
            }
        }

        // Set width on control container, but only if it's changing.
        if (changeControlWidth == true) {
            var controlContainerWidth = 0;
            for (var key in this.imageWidths) {
                controlContainerWidth += this.imageWidths[key];
            }
            $('#' + this.id + ' .RatingGradeContainer').width(controlContainerWidth);
        }
    
        // Always contrain the width of the text container to be the same as
        // the control container.
        if (this.options.includeText == true) {
            $('#' + this.id + ' .RatingTextContainer').width($('#' + this.id + ' .RatingGradeContainer').width());
        }

    }

    /**
     * Fires the indicated custom event and properties when the widget grade is changed.
     *
     * @function
     * @memberof Rating
     * @this Rating
     * @instance
     * @param {number} delay The number of milliseconds to wait before firing the event.
     *    This should be a non-zero value when called as a result of a property change on the
     *    the widget.  Can be 0 when called as a result of user click on the widget.
     * @fires gradechanged
     * @property {string} id The id of the rating widget
     * @property {number} grade The grade of the rating widget
     * @property {object} payload The client-provided payload object
     * @private
     */
    function fireGradeChanged(delay) {
        var _this = this;
        setTimeout(function() {
            $('#' + _this.id).trigger(EVENT_GRADE_CHANGE, [_this.id, _this.options.grade, _this.options.payload]);
        }, delay);
    };

    /**
     * Return the CSS image class name associated with a given grade control for a given grade.
     *
     * @function
     * @memberof Rating
     * @static
     * @param {boolean} averageMode true if the image info to be returned is within
     *           the context of the widget displaying average mode;  false if within
     *           the context of displaying in normal mode.
     * @param {int} grade the grade of the widget.  This should be the average grade (if
     *           averageMode is true), otherwise the user's grade.
     * @param {int} rank the grade rank assigned to the control whose CSS class name is
     *           being returned.
     * @return {String} the CSS class name: one of RatingGradeEmptyImage, RatingGradeAvgHalfImage,
     *           RatingGradeAvgFullImage, RatingGradeFullImage, RatingGradeEmptyImage
     * @private
     */
    function getGradeImageClass(averageMode, grade, rank) {
        var className = null;
        var width = null;
    
        if (grade == this.CODE_CLEAR) {
            grade = 0;
        }
    
        if (averageMode == true) {
            // Compute the difference between the grade being displayed and the grade rank
            // associated with this image.
            var diff = grade - rank;
    
            // Show correct image based on diff
            if (diff < (0 -.5)) {
                // Difference is more than half-grade below zero.  Show empty grade.
                className = "RatingGradeEmptyImage";
            } else if (diff < 0) {
                // Difference is less than a half-grade below 0.  Show average half-full grade
                className = "RatingGradeAvgHalfImage";
            } else {
                // Difference is 0 or higher.  Show average full grade
                className = "RatingGradeAvgFullImage";
            }
        } else {
            if (rank <= grade) {
                // Show full user's grade
                className = "RatingGradeFullImage";
            } else {
                // Show empty grade
                className = "RatingGradeEmptyImage";
            }
        }
        return className;
    }

    /**
     * Handler for mouseout and mouseover events.
     *
     * @function
     * @memberof Rating
     * @this Rating
     * @instance
     * @param {int} code indicates on which image the event occurs.
     *              Can be one of the object constants:
     *                  _CODE_NOTINTERESTED, _CODE_MODETOGGLE, or _CODE_CLEAR
     *              or 1->maxGrade
     * @param {boolean} isMouseOver  true if mouseover event, otherwise false
     * @return {boolean} true if successful; otherwise, false.
     * @private
     */
    function onMouseCallback(code, isMouseOver) {
        // Return if either:
        //   1. this is a mouse over, or
        //   2. this is a mouse out, and the component is not considered in a "mousedover" state.
        //      (this occurs if we moused in to a grade control, but gradeReadOnly was true,
        //       or if we moused into the modeToggle control, but modeReadOnly was true)
        if ( (this.options.gradeReadOnly && (code != CODE_MODETOGGLE))
                || (this.options.modeReadOnly && (code == CODE_MODETOGGLE)) ) {
            if (isMouseOver || !this.mousedover) {
                return true;
            }
        }
    
        // Show a preview of the component state if the mouse would be clicked.
        this.previewState(code, isMouseOver);
        
        // Remember we just processed a mouseover/mouseout (ie., non-click) event
        this.mousedover = isMouseOver; 
        this.clicked = false; 
        return true;
    }

    /**
     * Handler for click events.
     *
     * @function
     * @memberof Rating
     * @this Rating
     * @instance
     * @param {int} code indicates on which image the event occurs:
     *              Can be one of the object constants:
     *                  _CODE_NOTINTERESTED, _CODE_MODETOGGLE, or _CODE_CLEAR
     *              or 1->maxGrade
     * @return {boolean} true if successful; otherwise, false.
     * @private
     */
    function onClickCallback(code) {
        // Return if either:
        //   1. clicked on a grade control when gradeReadOnly is true, or
        //   2. clicked on modeTogglecontrol, but modeReadOnly is true, or
        //   3. We just processed a click and there's been no new mouse event
        if ( (this.options.gradeReadOnly && (code != CODE_MODETOGGLE)) 
                || (this.options.modeReadOnly && (code == CODE_MODETOGGLE))
                || this.clicked) {
            return true;
        }
    
        // Modify the component state permanently
        this.modifyState(code);
        
        // Remember we just processed a click (ie, non-mouseover/mouseout) event
        this.clicked = true;
        this.mousedover = false; 
    
        return true;
    }

    /**
     * Preview component state based on mouse hover.
     *
     * @function
     * @memberof Rating
     * @this Rating
     * @instance
     * @param {int} code indicates on which image the event occurs.
     *              Can be one of the widget constants:
     *                  _CODE_NOTINTERESTED, _CODE_MODETOGGLE, or _CODE_CLEAR
     *              or 1->maxGrade
     * @param {boolean} isMouseOver  true if mouseover event, otherwise false.
     *                  false implies an "undo" of the preview state.
     * @return {boolean} true if successful; otherwise, false.
     * @private
     */
    function previewState(code, isMouseOver) {
        // Determine if we will be displaying average grade.
        //
        var displayingAvg = false;
        if ((code == CODE_MODETOGGLE) && isMouseOver) {
            // Moused over modeToggle control, so we will preview the inverse mode of
            // current display mode.
            displayingAvg = !this.options.inAverageMode;
        } else {
            // If mouseout from any control then we will preview what the
            // current display mode is.  This is akin to an "undo" of the preview state
            // from a previous mouseover of the modeToggle control.  Otherwise on a
            // mouseover of any control BUT modeToggle, we will not preview the
            // average grade.
            displayingAvg = (!isMouseOver ? this.options.inAverageMode : false);
        }
        
        // Determine which grade to display.
        //
        var displayingGrade;
        if (!isMouseOver) {
            // Mouseout from any control.  Then we will preview that the
            // current display grade is.  This is akin to an "undo" of the preview state
            // from a previous mouseover.  The grade is either the average grade (if
            // in average mode) or the user's grade (if in normal mode).
            displayingGrade = this.options.inAverageMode ? this.options.averageGrade : this.options.grade;
        } else if (code == CODE_MODETOGGLE) {
            // Mouseover modeToggle.  Display either the average grade or the user's grade.
            displayingGrade = displayingAvg ? this.options.averageGrade : this.options.grade;
        } else if (code == CODE_CLEAR) {
            // Mouseover clear, so no grade to display.
            displayingGrade = code;
        } else {
            // Display the grade associated with the control on which the event occurred.
            displayingGrade = code;
        }
    
        var hoverClass = "RatingHover";
        var hoverText = null;

        // ModeToggle image
        if ((this.options.includeModeToggle == true) && (this.modeToggleNode != null)) {
            // Set style class for this image
            if (displayingAvg) {
                this.modeToggleNode.addClass("RatingModeAverageImage").removeClass("RatingModeNormalImage");
            } else {
                this.modeToggleNode.addClass("RatingModeNormalImage").removeClass("RatingModeAverageImage");
            }
            // Since we reset the className above, we may need to add back the hover class.
            if (!this.options.modeReadOnly) {
                this.modeToggleNode.addClass(hoverClass);
            }
    
            // If mouseover on modeToggle, set the hover text to display
            if ((code == CODE_MODETOGGLE) && isMouseOver && (this.options.modeToggleHoverTexts != null)) {
                hoverText = (displayingAvg
                    ? (this.options.modeToggleHoverTexts.length == 2 ? this.options.modeToggleHoverTexts[1] : null)
                    : this.options.modeToggleHoverTexts[0]);
            }
        }

        // Not interested image
        if ((this.options.includeNotInterested == true) && (this.notInterestedNode != null)) {
            // Set style class for this image
            if (displayingGrade == CODE_NOTINTERESTED) {
                this.notInterestedNode.addClass("RatingNotInterestedOnImage").removeClass("RatingNotInterestedOffImage")
            } else {
                this.notInterestedNode.addClass("RatingNotInterestedOffImage").removeClass("RatingNotInterestedOnImage")
            }

            // Since we reset the className above, we may need to add back the hover class.
            if (!this.options.gradeReadOnly) {
                this.notInterestedNode.addClass(hoverClass);
            }

            // If mouseover on notInterested, set the hover text to display
            if (code == CODE_NOTINTERESTED && isMouseOver 
                    && this.options.notInterestedHoverText != null) {
                hoverText = this.options.notInterestedHoverText;
            }
        }

        // Clear image
        if ((this.options.includeClear == true) && (this.clearNode != null)) {
            if (displayingGrade == CODE_CLEAR) {
                this.clearNode.addClass("RatingClearOnImage").removeClass("RatingClearOffImage");
            } else {
                this.clearNode.addClass("RatingClearOffImage").removeClass("RatingClearOnImage");
            }
    
            // Since we reset the className above, we may need to add back the hover class.
            if (!this.options.gradeReadOnly) {
                this.clearNode.addClass(hoverClass);
            }
    
            // If mouseover on clear, set the hover text to display
            if (code == CODE_CLEAR && isMouseOver && this.options.clearHoverText != null) {
                hoverText = this.options.clearHoverText;
            }
        }

        // Grade images
        for (var i = 1; i <= this.options.maxGrade; i++) {
            if (i > this.gradeNodes.length) {
                break;
            }
    
            // If this grade image is the one moused over, then get it's hover text.
            if (isMouseOver && (code != CODE_MODETOGGLE) && 
                    (code != CODE_CLEAR) && (i == displayingGrade)) {
                if ((this.options.gradeHoverTexts != null) && (i <= this.options.gradeHoverTexts.length)) {
                    hoverText = this.options.gradeHoverTexts[i-1];
                }
            }
    
            // Set appropriate class for this grade image
            var className = this.getGradeImageClass(displayingAvg, displayingGrade, i);
            this.gradeNodes[i-1].attr("class", "RatingGradeNode");
            this.gradeNodes[i-1].addClass(className);
    
            // Since we reset the className above, we may need to add back the hover class.
            if (!this.options.gradeReadOnly) {
                this.gradeNodes[i-1].addClass(hoverClass);
            }
        }
    
        // Set hover text in _textContainer.
        this.setText(hoverText);
        return true;
    }

    /**
     * Modify component state based on mouse click, basically updating our
     * state based on the current preview.
     *
     * @function
     * @memberof Rating
     * @this Rating
     * @instance
     * @param {int} code indicates on which image the event occurs.
     *              Can be one of the object constants:
     *                  _CODE_NOTINTERESTED, _CODE_MODETOGGLE, or _CODE_CLEAR
     *              or 1->maxGrade
     * @return {boolean} true if successful; otherwise, false.
     * @private
     */
    function modifyState(code) {
        if (code == CODE_MODETOGGLE) {
            // Toggle mode
            this.options.inAverageMode = !this.options.inAverageMode;
    
            // If acknowledgement text configured for when toggling mode, then render it for the new mode.
            var acknowledgedText = null;
            if (this.options.modeToggleAcknowledgedTexts != null) {
                acknowledgedText = (this.options.inAverageMode
                    ? (this.options.modeToggleAcknowledgedTexts.length == 2 ? this.options.modeToggleAcknowledgedTexts[1] : null)
                    : this.options.modeToggleAcknowledgedTexts[0]);
            }
            this.setText(acknowledgedText);
    
        } else {
            // Normal (not average) mode
            this.options.inAverageMode = false;
    
            // Render acknowledged text for image clicked
            var acknowledgedText = null;
            if (code == CODE_CLEAR) {
                acknowledgedText = this.options.clearAcknowledgedText;
            } else if (code == CODE_NOTINTERESTED) {
                acknowledgedText = this.options.notInterestedAcknowledgedText;
            } else {
                acknowledgedText = this.options.gradeAcknowledgedText;
            }
            this.setText(acknowledgedText);
    
            // Do nothing unless the grade is changing.
            if (this.options.grade != code) {
                // Update the widget grade and publish notification.
                this.options.grade = code;
                this.fireGradeChanged(0);
            }
        }
        return true;
    }

    /**
     * Set the text to be displayed in the _textContainer.  If the specified text
     * is null or empty, then display a non-breaking space character.1G
     *
     * @function
     * @memberof Rating
     * @this Rating
     * @instance
     * @param {String} text  the text to be displayed
     * @return {boolean} true if successful; otherwise, false.
     * @private
     */
    function setText(text) {
        var textContainer = $('#' + this.id + ' .RatingTextContainer');
        if (textContainer != null) {
            if (text != null && (text.replace(/^\s+/g, '').replace(/\s+$/g, '') == "" )) {
                text = null;
            }
            textContainer.html(text == null ? "&nbsp;" : text);
            this.currentText = textContainer.html();
        }
        return true;
    }

    // Rating class methods
    Rating.prototype.setProps = setProps;
    Rating.prototype.onMouseCallback = onMouseCallback;
    Rating.prototype.onClickCallback = onClickCallback;
    Rating.prototype.previewState = previewState;
    Rating.prototype.modifyState = modifyState;
    Rating.prototype.setText = setText;
    Rating.prototype.getGradeImageClass = getGradeImageClass;
    Rating.prototype.fireGradeChanged = fireGradeChanged;

})(jQuery);
