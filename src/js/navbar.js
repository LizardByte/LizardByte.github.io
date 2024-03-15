// setup Scrollspy https://getbootstrap.com/docs/5.0/components/scrollspy/
let base_element = document.getElementsByTagName("body")[0];
base_element.setAttribute("data-bs-spy", "scroll");
base_element.setAttribute("data-bs-target", "#nav-container");
base_element.setAttribute("data-bs-offset", "80");

let navbar_element = document.getElementById("nav-container");
navbar_element.className = "navbar navbar-expand-lg navbar-dark bg-black fixed-top"
navbar_element.innerHTML = `
        <div class="container-fluid">
            <div class="navbar-header">
                <a class="navbar-brand fw-bold crowdin-ignore" href="/">
                    <img src="https://app.lizardbyte.dev/assets/images/logo-56x56.png" alt=""
                         class="crowdin-ignore"> LizardByte
                </a>
            </div>
            <div class="navbar-header">
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarToggle"
                        aria-controls="navbarToggle" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
            </div>
            <!-- Navbar Right Side -->
            <div id="navbarToggle"></div>
        </div>
`;

// create the navbar dynamically
let sections = document.getElementsByTagName('section');
let navbar = document.getElementById("navbarToggle")
navbar.className = "collapse navbar-collapse"

let navbar_list = document.createElement("ul")
navbar_list.className = "navbar-nav nav ms-auto"
navbar.appendChild(navbar_list)

let nav_list_item_class = "nav-item"
let nav_link_class = "nav-link fw-bold menu-list"

// Add HOME link
// let home_item = document.createElement("li")
// home_item.className = nav_list_item_class
// let home_link = document.createElement("a")
//
// home_link.className = nav_link_class
// home_link.href = "index.html"
// home_link.textContent = "Home"
// home_item.appendChild(home_link)
// navbar_list.appendChild(home_item)

for(let i = 0; i < sections.length; ++i) {
    if (sections[i].id) {
        let navbar_item = document.createElement("li")
        navbar_item.className = nav_list_item_class
        let navbar_link = document.createElement("a")

        navbar_link.className = nav_link_class
        navbar_link.href = `#${sections[i].id}`
        navbar_link.textContent = sections[i].id

        // check if crowdin-ignore is in the section classes and add it to the link
        if (sections[i].classList.contains("crowdin-ignore")) {
            navbar_link.classList.add("crowdin-ignore")
        }

        navbar_item.appendChild(navbar_link)
        navbar_list.appendChild(navbar_item)
    }
}

// // highlight the active link ... not necessary with Bootstrap/Scrollspy
// $(function() {
//     $('ul.navbar-nav a').bind('click',function(){
//         $('ul.navbar-nav a').removeClass('active');
//         $(this).addClass('active');
//     });
// });
