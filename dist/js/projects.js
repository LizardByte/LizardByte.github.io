// projects section script
function rankingSorter(firstKey, secondKey) {
    return function(a, b) {
        if (a[firstKey] > b[firstKey]) {
            return -1;
        } else if (a[firstKey] < b[firstKey]) {
            return 1;
        }
        else {
            if (a[secondKey] > b[secondKey]) {
                return 1;
            } else if (a[secondKey] < b[secondKey]) {
                return -1;
            } else {
                return 0;
            }
        }
    }
}

container = document.getElementById("project-container")
let org_name = "LizardByte"
let base_url = `https://app.${org_name.toLowerCase()}.dev`
let cache_repo = "uno"

// create project cards
$(document).ready(function(){
    // Set cache = false for all jquery ajax requests.
    $.ajaxSetup({
        cache: false,
    });
});

$(document).ready(function(){
    $.ajax({
        url: `${base_url}/${cache_repo}/github/repos.json`,
        type: "GET",
        dataType:"json",
        success: function (result) {
            let sorted = result.sort(rankingSorter("stargazers_count", "name"));

            for(let repo in sorted) {
                if (sorted[repo]['archived'] === false && sorted[repo]['description'] !== null && sorted[repo]['fork'] === false) {
                    let column = document.createElement("div")
                    column.className = "col-lg-4 mb-5"
                    container.appendChild(column)

                    let card = document.createElement("div")
                    card.className = "card h-100 shadow border-0"
                    column.appendChild(card)

                    let banner_div = document.createElement("div")
                    banner_div.className = "hover-zoom"
                    card.append(banner_div)

                    let banner_link = document.createElement("a")
                    banner_link.href = sorted[repo]['html_url']
                    banner_link.target = "_blank"
                    banner_div.append(banner_link)

                    let banner = document.createElement("img")
                    banner.className = "card-img-top"
                    banner.src = `${base_url}/${cache_repo}/github/openGraphImages/${sorted[repo]['name']}.png`
                    banner.alt = ""
                    banner_link.append(banner)

                    let card_body = document.createElement("div")
                    card_body.className = "bg-dark text-white card-body p-4"
                    card.appendChild(card_body)

                    let card_title_link = document.createElement("a")
                    card_title_link.className = "text-decoration-none link-light"
                    card_title_link.href = sorted[repo]['html_url']
                    card_title_link.target = "_blank"
                    card_body.appendChild(card_title_link)

                    let card_title_text = document.createElement("h5")
                    card_title_text.className = "card-title mb-3 fw-bolder"
                    card_title_text.textContent = result[repo]['name']
                    card_title_link.appendChild(card_title_text)

                    let card_paragraph = document.createElement("p")
                    card_paragraph.className = "card-text mb-0"
                    card_paragraph.textContent = sorted[repo]['description']
                    card_body.appendChild(card_paragraph)

                    let card_footer = document.createElement("div")
                    card_footer.className = "card-footer p-2 pt-0 bg-dark text-white border-top-0"
                    card.appendChild(card_footer)

                    let repo_data_row = document.createElement("div")
                    repo_data_row.className = "d-flex align-items-center"
                    card_footer.appendChild(repo_data_row)

                    let star_link = document.createElement("a")
                    star_link.className = "nav-link nav-link-sm text-white"
                    star_link.href = `https://star-history.com/#${sorted[repo]['full_name']}`
                    star_link.target = "_blank"
                    star_link.textContent = sorted[repo]['stargazers_count']
                    repo_data_row.appendChild(star_link)

                    let star_link_image = document.createElement("i")
                    star_link_image.className = "fa-fw fa-solid fa-star"
                    star_link.prepend(star_link_image)

                    let fork_link = document.createElement("a")
                    fork_link.className = "nav-link nav-link-sm text-white"
                    fork_link.href = `https://github.com/${sorted[repo]['full_name']}/network/members`
                    fork_link.target = "_blank"
                    fork_link.textContent = sorted[repo]['forks']
                    repo_data_row.appendChild(fork_link)

                    let fork_link_image = document.createElement("i")
                    fork_link_image.className = "fa-fw fa-solid fa-code-fork"
                    fork_link.prepend(fork_link_image)

                    $.ajax({
                        url: `${base_url}/${cache_repo}/github/languages/${sorted[repo]['name']}.json`,
                        type: "GET",
                        dataType: "json",
                        success: function (languages) {
                            let language_data_row = document.createElement("div")
                            language_data_row.className = "card-group p-3 align-items-center"
                            card_footer.appendChild(language_data_row)

                            for (let language in languages) {
                                let language_file = encodeURIComponent(`${language}.svg`)

                                let language_icon = document.createElement("img")
                                language_icon.className = "language-logo"
                                language_icon.src = `${base_url}/${cache_repo}/language-icons/${language_file}`
                                language_icon.alt = language
                                language_icon.title = language
                                language_data_row.append(language_icon)
                            }
                        }
                    })
                }
            }
        }
    });
});
