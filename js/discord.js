function randomQuote(quote, crate) {
    let the_quote = quote['quote_safe'] || quote['quote']
    crate.notify(the_quote)
}

//Widgetbot initialization
let widgetbot = document.createElement('script')
widgetbot.setAttribute('src', 'https://cdn.jsdelivr.net/npm/@widgetbot/crate@3')
widgetbot.async = true;
widgetbot.onload = () => {
    new Crate({
        server: '804382334370578482',
        channel: '804383092822900797',
        defer: false,
    })
}
document.head.appendChild(widgetbot)

// get random video game quotes and notify the user on Widgetbot after 7 minutes
fetch('https://app.lizardbyte.dev/uno/random-quotes/games.json').then(r => r.json()).then(result => {
    let quote = result[Math.floor(Math.random() * result.length)]
    setTimeout(() => {
        if (crate) {
            randomQuote(quote, crate)
        }
    }, 7 * 60 * 1000)
})
