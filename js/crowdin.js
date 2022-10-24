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
            "en":"English",
            "es-ES":"Spanish",
        },
        languagesData: {
            "en":{"code":"en","name":"English","twoLettersCode":"en"},
            "es-ES":{"code":"es-ES","name":"Spanish","twoLettersCode":"es"},
        },
        defaultLanguage: "en",
        defaultLanguageTitle: "English",
        languageDetectType: "subdirectory",
        poweredBy: false,
        position: "bottom-left",
        submenuPosition: "top-left",
    });

    // change styling of language selector button
    let button = document.getElementsByClassName('cr-picker-button')[0];
    button.classList.add('border-white');
    button.classList.add('btn');
    button.classList.add('btn-outline-light');
    button.classList.add('bg-dark');
    button.classList.add('text-white');
    button.classList.add('rounded-0');

    // change styling of language selector menu
    let menu = document.getElementsByClassName('cr-picker-submenu')[0];
    menu.classList.add('border-white');
    menu.classList.add('bg-dark');
    menu.classList.add('text-white');
    menu.classList.add('rounded-0');

    // change styling of selected language in menu
    let selected = document.getElementsByClassName('cr-selected')[0];
    selected.classList.add('text-white');
});
