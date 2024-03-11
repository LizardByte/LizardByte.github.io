// projects section script

// load external scripts
$.getScript('https://app.lizardbyte.dev/js/ranking_sorter.js')


// get project container
container = document.getElementById("dashboard-container")
let org_name = "LizardByte"
let base_url = `https://app.${org_name.toLowerCase()}.dev`
let cache_repo = "uno"


$(document).ready(function(){
    // Set cache = false for all jquery ajax requests.
    $.ajaxSetup({
        cache: false,
    });
});


// create project cards
$(document).ready(function(){
    // get readthedocs projects
    let readthedocs = []
    $.ajax({
        url: `${base_url}/${cache_repo}/readthedocs/projects.json`,
        type: "GET",
        dataType: "json",
        success: function (data) {
            for (let item in data) {
                readthedocs.push(data[item])
            }
        }
    });

    $.ajax({
        url: `${base_url}/${cache_repo}/github/repos.json`,
        type: "GET",
        dataType:"json",
        success: function (result) {
            let sorted = result

            // create a table of all repos
            let table = document.createElement("table")
            table.className = "table table-dark table-sm table-striped table-hover table-bordered table-responsive"
            table.id = "repo-table"
            container.appendChild(table)

            // create table head
            let table_head = document.createElement("thead")
            table.appendChild(table_head)

            let table_head_row = document.createElement("tr")
            table_head.appendChild(table_head_row)

            // table body
            let table_body = document.createElement("tbody")
            table_body.className = "table-group-divider"
            table.appendChild(table_body)

            let table_columns = [
                "Banner",
                "Name",
                "Description",
                "Stars",
                "Forks",
                "Open Issues & Pulls",
                "Master Default",
                "Languages",
                "License",
                "Docs",
                "Code Coverage",
                "Archived",
                "Created",
                "Last Updated",
            ]

            for (let column in table_columns) {
                let table_head_name = document.createElement("th")
                table_head_name.scope = "col"
                table_head_name.textContent = table_columns[column]
                table_head_row.appendChild(table_head_name)
            }

            for(let repo in sorted) {
                // get language data
                let language_data = document.createElement("div")
                language_data.className = "align-items-center"
                $.ajax({
                    url: `${base_url}/${cache_repo}/github/languages/${sorted[repo]['name']}.json`,
                    async: false,
                    type: "GET",
                    dataType: "json",
                    success: function (languages) {
                        for (let language in languages) {
                            let language_file = encodeURIComponent(`${language}.svg`)

                            let language_icon = document.createElement("img")
                            language_icon.className = "language-logo crowdin-ignore"
                            language_icon.src = `${base_url}/${cache_repo}/language-icons/${language_file}`
                            language_icon.alt = language
                            language_icon.title = language
                            language_data.append(language_icon)
                        }
                    }
                })

                // code coverage data
                let code_coverage = document.createElement("i")
                code_coverage.className = "fa-fw fa-solid fa-times-circle text-danger"
                let column_code_coverage_class = "table-danger"
                $.ajax({
                    url: `${base_url}/${cache_repo}/codecov/${sorted[repo]['name']}.json`,
                    async: false,
                    type: "GET",
                    dataType: "json",
                    success: function (coverage) {
                        // if defined and not null... prevent errors
                        if (coverage['totals'] !== undefined && coverage['totals'] !== null) {
                            if (coverage['totals']['coverage'] !== null) {
                                code_coverage = coverage['totals']['coverage']
                                if (code_coverage >= 80) {
                                    column_code_coverage_class = "table-success"
                                } else if (code_coverage >= 40) {
                                    column_code_coverage_class = "table-warning"
                                }
                            }
                        }
                    }
                })

                let docs_link = document.createElement("i")
                docs_link.className = "fa-fw fa-solid fa-times-circle text-danger"
                for (let docs in readthedocs) {
                    let docs_repo = readthedocs[docs]['repository']['url'];
                    docs_repo = docs_repo.toLowerCase();

                    let project_repo = sorted[repo]['clone_url'];
                    project_repo = project_repo.toLowerCase();

                    if (docs_repo === project_repo) {
                        docs_link = document.createElement("a")
                        docs_link.href = readthedocs[docs]['urls']['documentation']
                        docs_link.target = "_blank"

                        let docs_link_image = document.createElement("i")
                        docs_link_image.className = "fa-fw fa-solid fa-check-circle text-success"
                        docs_link.prepend(docs_link_image)
                    }
                }

                // add each repo to the table
                let table_row = document.createElement("tr")
                table_row.className = "table-dark"
                table_body.appendChild(table_row)

                // add the banner image to the table
                let table_data_image = document.createElement("td")
                table_row.appendChild(table_data_image)
                let table_data_image_src = document.createElement("img")
                table_data_image_src.className = "card-img-top rounded-0"
                table_data_image_src.src = `${base_url}/${cache_repo}/github/openGraphImages/${sorted[repo]['name']}_624x312.png`
                table_data_image_src.alt = ""
                table_data_image.append(table_data_image_src)

                // default branch is master
                let default_branch_data = document.createElement("i")
                if (sorted[repo]['default_branch'] === "master") {
                    default_branch_data.className = "fa-fw fa-solid fa-check-circle text-success"
                } else {
                    default_branch_data.className = "fa-fw fa-solid fa-times-circle text-danger"
                }

                // get license data
                // if blank use font awesome red X circle icon
                let license_data = document.createElement("i")
                license_data.className = "fa-fw fa-solid fa-times-circle text-danger"
                if (sorted[repo]['license'] != null) {
                    license_data = document.createElement("a")
                    license_data.className = "text-white"
                    license_data.href = sorted[repo]['license']['url']
                    license_data.target = "_blank"
                    license_data.textContent = sorted[repo]['license']['spdx_id']
                }

                // archived data
                let archived_data = ""
                if (sorted[repo]['archived'] === true) {
                    archived_data = document.createElement("i")
                    archived_data.className = "fa-fw fa-solid fa-warning text-warning"
                }

                // convert dates
                let created_at = sorted[repo]['created_at']
                let updated_at = sorted[repo]['updated_at']
                let created_at_date = new Date(created_at)
                let updated_at_date = new Date(updated_at)

                let table_data = {
                    "image": table_data_image,
                    "name": sorted[repo]['name'],
                    "description": sorted[repo]['description'],
                    "stargazers_count": sorted[repo]['stargazers_count'],
                    "forks": sorted[repo]['forks'],
                    "open_issues": sorted[repo]['open_issues'],
                    "default_branch": default_branch_data,
                    "language": language_data,
                    "license": license_data,
                    "readthedocs": docs_link,
                    "code_coverage": code_coverage,
                    "archived": archived_data,
                    "created_at": created_at_date.toLocaleDateString(),
                    "updated_at": updated_at_date.toLocaleDateString(),
                }

                for (let data in table_data) {
                    let table_data_name = document.createElement("td")
                    if (data === "code_coverage") {
                        table_data_name.className = column_code_coverage_class
                    } else {
                        table_data_name.className = "table-dark"
                    }
                    table_data_name.append(table_data[data])
                    table_row.appendChild(table_data_name)
                }
            }
        }
    });
});
