Infinite - smart endless scrolling
========

Normal infinite scrolling solutions out there aren't good enough, because they don't handle performance issues.
Elements are being added to the DOM constantly and, as a result, memory usage increases, and things start to slow down.
This problem gets even worse in mobile phones, becuase these machines are weaker than a "real" computer, so the more
the user scrolls and more elements are added, the slower the app/page gets.

Another problem is data invalidation; Where elements are added to the DOM and it's very hard to update them,
especially when the order of items keeps changing (high-scores table for example).

## Why this code is better:

Only a handful of items are being rendered to the screen at any given time,
and the ones that were previously rendered (if any), whom aren't in the viewport anymore, are deleted and the detached nodes will eventually go to the GC.
Another benefit of this method is that the data can be be regularly kept up-to-date (depending on your setup's interval) and will be rendered "fresh" all the time.


## How to use:
    // the ONLY option you must pass is the "newPage" function which generates items and returns them
    var OPTIONS = {
        startIndex : 0,    // the first index to render (from your data set)
        pageSize   : 10,   // # of items in a single batch
        offset     : 200,  // the area from top and bottom of afterwhich to trigger new page render
        content    : null, // where the items should be placed in
        newPage    : generateItems  // function which generates a whole page and returns it (as a jQuery object)
    }

    endlessElm.infinite(OPTIONS);  // initialize the plugin

    // must generates an array of DOM items.
    // the "this" referes to the "infinite" instance

    function generateItems(){

    }
