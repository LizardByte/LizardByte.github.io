// this script requires jquery to be loaded on the source page, like so...
// <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>

// use Jquery to load other javascript
$.getScript('https://proxy-translator.app.crowdin.net/assets/proxy-translator.js', function() {
    window.proxyTranslator.init({
        baseUrl: "https://app.lizardbyte.dev",
        appUrl: "https://proxy-translator.app.crowdin.net",
        valuesParams: "U2FsdGVkX18oEIFwyzOmQTrYwQEazqRvzErV24EQn8dee5U583HvbKkVktb0G/DMLpc+vYefsXCu07kcR3Fxa1aoSsMTkEJmM8Htl2tcYv2DkTKzd+pVAP8MBhpfAnPD",
        distributionBaseUrl: "https://distributions.crowdin.net",
        filePath: "/app.lizardbyte.dev.json",
        distribution: "0913bb75b61f0b26247ffa91bw4",
        languagesData: {
            "fr": {"code":"fr","name":"French","twoLettersCode":"fr"},
            "es-ES": {"code":"es-ES","name":"Spanish","twoLettersCode":"es"},
            "de": {"code":"de","name":"German","twoLettersCode":"de"},
            "it": {"code":"it","name":"Italian","twoLettersCode":"it"},
            "ru": {"code":"ru","name":"Russian","twoLettersCode":"ru"},
            "en": {"code":"en","name":"English","twoLettersCode":"en"},
            "en-US": {"code":"en-US","name":"English, United States","twoLettersCode":"en"},
            "en-GB": {"code":"en-GB","name":"English, United Kingdom","twoLettersCode":"en"}
        },
        defaultLanguage: "en",
        defaultLanguageTitle: "English",
        languageDetectType: "default",
        poweredBy: false,
        position: "bottom-left",
        submenuPosition: "top-left",
    });

    // change styling of language selector button
    let button = document.getElementsByClassName('cr-picker-button')[0]
    button.classList.add('border-white')
    button.classList.add('btn')
    button.classList.add('btn-outline-light')
    button.classList.add('bg-dark')
    button.classList.add('text-white')
    button.classList.add('rounded-0')

    // change styling of language selector menu
    let menu = document.getElementsByClassName('cr-picker-submenu')[0]
    menu.classList.add('border-white')
    menu.classList.add('bg-dark')
    menu.classList.add('text-white')
    menu.classList.add('rounded-0')

    // change styling of selected language in menu
    let selected = document.getElementsByClassName('cr-selected')[0]
    selected.classList.add('text-white')
});
