////////////////////////////////////////
// smart infinite scroll
(function($, docElm){
    "use strict";


    var defaults = {
        startIndex : 0,    // the first index to render
        pageSize   : 10,   // # of items in a single batch
        offset     : 200,   // the area from top and bottom of afterwhich to trigger new page render
        content    : null,  // where the items should be appended to
        newPage    : function(){}  // function which generates a whole page and returns it (as a jQuery object)
    }

    // jQuery plugin instantiation
    jQuery.fn.infinite = function(settings, cb){
        return this.each(function(){

            var $el = $(this), // convert window to the HTML element
                infinite;

            if( $el.data('_infinite') )
                return;

            infinite = new Infinite($el, settings, cb);

            $el.data('_infinite', infinite);
        });
    }

    // main constructor function
    function Infinite($el, settings, cb){
        var that = this;

        this.el = $el;
        this.endlessElm = ($el[0] == window) ? $(docElm) : $el;
        this.endlessContainer = settings.content || this.endlessElm;

        this.index             = settings.startIndex || 0;
        this.pages             = []; // could only be 2 places in this array
        this.lastContentHeight = 0;
        this.firstRenderedPage = null;
        this.lastScrollTop     = null;
        this.scrollY           = null;
        this.firstLastIndexes  = [0,0];

        this.settings = $.extend({}, defaults, settings);

        // I use underscore's/lodash "throttle" method because it is commonly used.
        this.el
            .on('scroll.infinite', _.throttle(this.scrolling.bind(that), 150))
            .on('resize.infinite', _.throttle(this.scrolling.bind(that), 150));

        this.addPage();
    }

    Infinite.prototype = {
        destroy : function(){
            this.el.removeData('_infinite').off('scroll.infinite resize.infinite');
        },

        // Addes a new page to the DOM
        // Gets a page element from the "newPage" function and use the result.
        addPage : function( method ){
            var index = this.index,
                page, elmToRemove, height, tempItem,

            method = method || 'append';

            if( method == 'append' ){
                // it must be written like so, because the very FIRST time, the "pages" array length is "1". else I could have written "this.pages[0]"...duh
                elmToRemove = $(this.pages[this.pages.length - 2]);

                page = this.settings.newPage.call(this);

                if( !page ) return;

                if( this.pages.length == 2)
                    this.pages.shift();
                this.pages.push(page);

                if( elmToRemove.length ){
                    /* adjust scroll */
                    tempItem = elmToRemove.last();
                    height = tempItem.position().top + tempItem.outerHeight(true);


                    if( this.el[0] === window ){
                        docElm.scrollTop -= height;
                        document.body.scrollTop -= height;
                    }
                    else
                        this.endlessElm[0].scrollTop -= height;

                    elmToRemove.remove();
                }

                this.endlessContainer[method]( page );

                // update indexes
                this.firstLastIndexes = [this.endlessContainer[0].firstChild.tabIndex, this.index];
            }
            // prepending page
            else{
                if( index < 0 ) return;

                page = this.settings.newPage.call(this);

                if( !page ) return;

                elmToRemove = $(this.pages[1]);

                this.pages.unshift(page);
                this.pages.length = 2;

                this.endlessContainer[method]( page );

                /* adjust scroll */
                tempItem = $( page[page.length - 1] );
                height = tempItem.position().top + tempItem.outerHeight(true);

                if( this.el[0] === window ){
                    docElm.scrollTop += height;
                    document.body.scrollTop += height;
                }
                else
                    this.endlessElm[0].scrollTop += height;

                elmToRemove.remove();

                 // update indexes
                this.firstLastIndexes = [index, this.endlessContainer[0].lastChild.tabIndex + 1];
            }
        },

        // onScroll/resize events callback
        // calls "addPage". Knows wether to Append or Prepend content
        scrolling : function(){
            var st = this.el.scrollTop(),
                isScrollingDown = st > this.lastScrollTop,
                pageToRestore,
                viewHeight,
                totalHeight,
                index;

            this.lastScrollTop = st;

            // Get things right for later usage
            if( this.el[0] === window ){
                this.scrollY = window.pageYOffset || docElm.scrollTop;
                viewHeight   = docElm.clientHeight;
                totalHeight  = docElm.scrollHeight;
            }
            else{
                this.scrollY = this.endlessElm[0].scrollTop;
                viewHeight   = this.endlessElm[0].clientHeight;
                totalHeight  = this.endlessElm[0].scrollHeight;
            }



            // scrolling down
            if( isScrollingDown ){
                // if reached the point it should load the next page
                if( this.scrollY + viewHeight + this.settings.offset >= totalHeight ){
                    this.index = this.firstLastIndexes[1];

                    this.addPage();
                }
            }
            // scrolling up
            else if( this.scrollY <= this.settings.offset && this.index > this.settings.pageSize ){
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