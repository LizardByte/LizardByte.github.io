// this script requires jquery to be loaded on the source page, like so...
// <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomQuote(quote, crate) {
    let the_quote = null
    if (quote['quote_safe']) {
        the_quote = quote['quote_safe'];
    } else {
        the_quote = quote['quote'];
    }

    crate.notify(the_quote)
}

let quote = null

// get random video game quotes
$.ajax({
    url: `https://app.lizardbyte.dev/uno/random-quotes/games.json`,
    type: "GET",
    dataType: "json",
    success: function (result) {
        let quote_index = getRandomIntInclusive(0, result.length - 1);
        quote = result[quote_index]
    }
});

// use Jquery to load other javascript
$.getScript('https://cdn.jsdelivr.net/npm/@widgetbot/crate@3', function()
{
    const crate = new Crate({
        server: '804382334370578482',
        channel: '804383092822900797',
        defer: false,
    })

    $.getScript('https://app.lizardbyte.dev/js/sleep.js')
        // This won't work when running locally, so we will have a fallback sleep function for development testing
        // https://stackoverflow.com/a/26851894/11214013
        .done(function() {
            // sleep for 7 minutes -> 420000
            sleep(420000).then(() => {randomQuote(quote, crate)})
        })
        .fail(function() {
            let sleep = ms => {
                return new Promise(resolve => setTimeout(resolve, ms));
            };
            // sleep for 1 second
            sleep(1000).then(() => {randomQuote(quote, crate)})
        })
});
