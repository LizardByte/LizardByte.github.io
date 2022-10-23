// this script requires jquery to be loaded on the source page, like so...
// <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>

// use Jquery to load other javascript
$.getScript('https://proxy-translator.app.crowdin.net/assets/proxy-translator.js', function()
{
    window.proxyTranslator.init({
        baseUrl: "https://app.lizardbyte.dev",
        distributionBaseUrl: "https://distributions.crowdin.net",
        filePath: "/app.lizardbyte.dev.json",
        distribution: "a4655f152d6ea4b5113a0991bw4",
        languages: {
            "es-ES":"Spanish",
            "en":"English"},
        languagesData: {
            "es-ES":{"code":"es-ES","name":"Spanish","twoLettersCode":"es"},
            "en":{"code":"en","name":"English","twoLettersCode":"en"}
        },
        defaultLanguage: "en",
        defaultLanguageTitle: "English",
        languageDetectType: "default",
        poweredBy: true,
    });

    let button = document.getElementById('crowdin-language-picker');
    button.className = 'cr-position-bottom-left cr-submenu-top-left'
});
