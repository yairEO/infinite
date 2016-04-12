Infinite - smart endless scrolling
========

### [DEMO PAGE](http://yaireo.github.io/infinite/)


Normal infinite scrolling solutions out there aren't good enough, because they don't handle performance issues.
Elements are being added to the DOM constantly and, as a result, memory usage increases, and things start to slow down.
This problem gets even worse in mobile phones, because these machines are weaker than a "real" computer, so the more
the user scrolls and more elements are added, the slower the app/page gets.

Another problem is data invalidation; Where elements are added to the DOM and it's very hard to update them,
especially when the order of items keeps changing (high-scores table for example).

## Benefits:

Only a handful of items are being rendered to the screen at any given time.
The ones that were previously rendered (if any), whom aren't in the viewport any more, are deleted and the detached nodes will eventually go to the GC.
Another benefit of this method is that the data can be be regularly kept up-to-date (depending on your setup's interval) and will be rendered "fresh" all the time.


## How to use:

I would suggest that a batch of data would be fetched from the server and be saved in a queue. <br>
The "pageSize" option will determine how many items will be rendered from the queue. <br>
When the the amount of items in the queue starts to dwindle, fetch a new batch and fill the queue.

    var queue = []; // fill the queue with a batch of data from the server
    
    // the ONLY option you must pass is the "newPage" function which generates items and returns them.
    var options = {
        startIndex : 0,    // the first index to render (from your data set)
        pageSize   : 10,   // # of items in a single batch
        offset     : 200,  // the area from top and bottom of after which to trigger new page render
        content    : null, // where the items should be placed in
        newPage    : generateItems  // function which generates a whole page and returns it (as a jQuery object)
    }

    endlessElm.infinite(options);  // initialize the plugin

    // Generate an array of DOM items.
    // The "this" refers to the "infinite" instance
    function generateItems(N){
        if( this.index >= queue.length )
            return false;
            
        var htmlString = '',
            index = this.index;
            
        N = N || this.settings.pageSize;
        while( N-- ){
            if( index == queue.length )
                break;
            htmlString += '<div class="item" tabindex="' + index + '">' + index + '</div>';
            index++;
        }
        return $.parseHTML(htmlString);
    }
