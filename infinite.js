/*
* Infinite scrolling
* Version: 1.0.0
*
* Copyright 2014, Yair Even-Or, http://dropthebit.com
*
* Homepage: http://yaireo.github.io/infinite/
* Repository: git://github.com/yairEO/infinite.git
* Licensed under GNU GPL v3, see LICENSE
*/

(function($, docElm){
    "use strict";

    var defaults = {
        startIndex : 0,    // the first index to render
        pageSize   : 10,   // # of items in a single batch
        offset     : 10,   // the area from top and bottom (in %) of after which to trigger new page render
        content    : null, // where the items should be appended to
        newPage    : null,  // function which generates a whole page and returns it (as a jQuery object)
        fakeHeight : false
    }

    // jQuery plugin instantiation
    jQuery.fn.infinite = function(settings, cb){
        return this.each(function(){
            var $el = $(this); // convert window to the HTML element

            if( $el.data('_infinite') )
                return;

            $el.data('_infinite', new Infinite($el, settings, cb));
        });
    }

    // main constructor function
    function Infinite($el, settings, cb){
        var that = this;

        this.el               = $el;
        this.endlessElm       = ($el[0] == window) ? $(docElm) : $el;
        this.endlessContainer = settings.content || this.endlessElm;

        this.index             = settings.fakeHeight ? 0 : settings.startIndex || 0;
        this.firstRenderedPage = null;
        this.lastScrollTop     = null;
        this.scrollY           = null;
        this.firstLastIndexes  = [0,0];
        this.firstLastElements = [null,null];
        this.fakeScrolls       = [0,0];
        this.locked            = false;

        this.settings = $.extend({}, defaults, settings);

        // I use underscore's/lodash "throttle" method because it is commonly used.
        this.el.on('scroll.infinite resize.infinite', _.throttle(this.scrolling.bind(that), 150));

        this.addPage();
    }

    Infinite.prototype = {
        destroy : function(){
            this.el.removeData('_infinite').off('scroll.infinite resize.infinite');
        },

        // Addes a new page to the DOM
        // Gets new elements Array from the "newPage" function and use the result.
        addPage : function( method ){
            if( this.locked ) return;
            this.locked = true;

            var index = this.index,
                newItems, elmToRemove, height = 0, temp, parsedPadding,
                N = this.settings.pageSize; // number of items to generate

            method = method || 'append';
            console.log(method);

            //////////////////////////////
            // appending elements
            if( method == 'append' ){
                temp = this.endlessContainer.children();

                newItems = this.settings.newPage.call(this);

                if( !newItems ){
                    this.locked = false;
                    return;
                }

                if( temp.length >= this.settings.pageSize * 2 )
                    elmToRemove = temp.slice(0, newItems.length); // remove the same amount of items that were added

                if( elmToRemove && elmToRemove.length ){
                    /* adjust scroll */
                    if( this.settings.fakeHeight ){
                        temp = elmToRemove.last();
                        height = temp.position().top - this.fakeScrolls[0] + temp.outerHeight(true);
                        parsedPadding = parseInt(this.endlessContainer.css('paddingBottom'));

                        this.endlessContainer.css({'paddingTop': '+='+ height, 'paddingBottom': '-='+ (parsedPadding < height ? parsedPadding : height)});
                        this.fakeScrolls[0] += height;
                        this.fakeScrolls[1] = this.fakeScrolls[1] > height ? this.fakeScrolls[1] - height : 0;
                    }
                    else{
                        // add new items
                        this.endlessContainer[method]( newItems );
                        // save the scrollHeight
                        height = this.endlessContainer[0].scrollHeight;
                        // remove un-needed items
                        elmToRemove.remove();
                        // re-calculate the height and get the delta from before
                        height = height - this.endlessContainer[0].scrollHeight;
                        // scroll back up by the delta previously calculated

                        if( this.el[0] === window ){
                            docElm.scrollTop -= height;
                            document.body.scrollTop -= height;
                        }
                        else{
                            console.log(height);
                            this.endlessElm[0].scrollTop -= height;
                        }

                    }
                }
                else
                    this.endlessContainer[method]( newItems );
            }

            //////////////////////////////
            // prepending elements
            else{
                if( index < 0 ){
                    this.locked = false;
                    return;
                };

                N = this.firstLastIndexes[0] < this.settings.pageSize ? this.firstLastIndexes[0] : this.settings.pageSize;

                newItems = this.settings.newPage.call(this, N);

                if( !newItems ){
                    this.locked = false;
                    return;
                };

                height = this.endlessContainer[0].scrollHeight;

                this.endlessContainer[method]( newItems );

                /* adjust scroll */
                if( this.settings.fakeHeight ){
                    temp = $(newItems[newItems.length - 1]);
                    height = temp.position().top - this.fakeScrolls[0] + temp.outerHeight(true);
                    parsedPadding = parseInt(this.endlessContainer.css('paddingTop'));

                    this.endlessContainer.css({'paddingBottom': '+='+ height, 'paddingTop': '-='+ (parsedPadding < height ? parsedPadding : height) });
                    this.fakeScrolls[0] = this.fakeScrolls[0] > height ? this.fakeScrolls[0] - height : 0;
                    this.fakeScrolls[1] += height;
                }
                else{
                    //temp = $( newItems[newItems.length - 1] );
                    //height = temp.position().top + temp.outerHeight(true);
                    height = this.endlessContainer[0].scrollHeight - height;

                    if( this.el[0] === window ){
                        docElm.scrollTop += height;
                        document.body.scrollTop += height;
                    }
                    else
                        this.endlessElm[0].scrollTop += height;
                }

                temp = this.endlessContainer.children();

                if( temp.length > this.settings.pageSize * 2 ){
                    temp = this.endlessContainer.children().slice(-N);
                    temp.remove();
                }
            }

            // update indexes
            temp = this.endlessContainer.children();
            this.firstLastIndexes = [temp[0].tabIndex, temp.last()[0].tabIndex];
            this.firstLastElements = [temp[0], temp.slice(-1)[0]];

            this.locked = false;

            if( this.settings.afterCB )
                this.settings.afterCB(newItems);
        },

        goTo : function(index){
            var toRemove = this.endlessContainer.children().remove();
            this.locked = false;
            this.index = index;
            this.addPage();
        },

        // onScroll/resize events callback
        // calls "addPage". Knows wether to Append or Prepend content
        scrolling : (function(){
            var timer;

            return function(){
                clearTimeout(timer);
                this.checkEdges();
                var that = this;
                // if scrolled down too fast, do a delayed check of position
                timer = setTimeout(function(){
                    that.lastScrollTop = 0;
                    that.checkEdges();
                },200);
            }
        })(),

        checkEdges : function(){
            var st = this.el.scrollTop(),
                isScrollingDown = st > this.lastScrollTop,
                temp, pageToRestore, viewHeight, totalHeight, bottomDistancePercent, topDistancePercent;

            this.lastScrollTop = st;
            viewHeight = this.endlessElm[0].clientHeight;

            bottomDistancePercent = 100 - (st + viewHeight) / this.endlessElm[0].scrollHeight * 100;

            // if reached NEXT page loading point
            //if( this.scrollY + viewHeight + this.settings.offset >= (totalHeight - this.fakeScrolls[1]) ){
            if( isScrollingDown && bottomDistancePercent < this.settings.offset ){
                this.index = this.firstLastIndexes[1] + 1;
                this.addPage();
            }
            // scrolling up
            //else if( (this.scrollY - this.fakeScrolls[0]) <= this.settings.offset && this.index ){
            else if( !isScrollingDown && this.firstLastElements[0].getBoundingClientRect().bottom / -viewHeight < (this.settings.offset / 100) && this.index ){
                if( this.firstLastIndexes[0] == 0 )
                    return;

                this.index = this.firstLastIndexes[0] - this.settings.pageSize;

                if( this.index < 0 )
                    this.index = 0;

                this.addPage('prepend');
            }
        }
    }
})(jQuery, document.documentElement);