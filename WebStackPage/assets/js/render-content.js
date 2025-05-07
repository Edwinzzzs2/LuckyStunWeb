// --- Generation Functions ---

function generateSidebarMenu(data) {
    const menuUl = $('#main-menu');
    if (!menuUl.length) return; // Exit if element not found
    let menuHtml = '';

    data.forEach(category => {
        if (category.children && category.children.length > 0) {
            // Category with sub-menu
            menuHtml += `<li class="has-sub">`;
            menuHtml += `<a><i class="${category.icon}"></i><span class="title">${category.name}</span></a>`;
            menuHtml += `<ul class="sub-menu">`; // Add sub-menu class
            category.children.forEach(child => {
                // Ensure child.name exists before creating the link
                 const targetId = child.name ? `#${child.name}` : '#'; // Default to '#' if name is missing
                menuHtml += `<li>`;
                menuHtml += `<a href="${targetId}" class="smooth"><span class="title">${child.name || 'Unnamed'}</span>`; // Default title
                if (child.is_hot) {
                    menuHtml += `<span class="label label-pink pull-right hidden-collapsed">Hot</span>`;
                }
                menuHtml += `</a></li>`;
            });
            menuHtml += `</ul></li>`;
        } else if (category.web && category.web.length > 0) {
            // Top-level category without sub-menu
             const targetId = category.name ? `#${category.name}` : '#';
            menuHtml += `<li>`;
            menuHtml += `<a href="${targetId}" class="smooth"><i class="${category.icon}"></i><span class="title">${category.name || 'Unnamed'}</span></a>`;
            menuHtml += `</li>`;
        }
    });
    // Manually add the "About" link if it's not in the JSON data
    menuHtml += `
       <li>
           <a href="about.html">
               <i class="linecons-heart"></i>
               <span class="tooltip-blue">关于本站</span>
               <span class="label label-Primary pull-right hidden-collapsed">♥︎</span>
           </a>
       </li>`;

    menuUl.html(menuHtml);
    // Important: Re-run Xenon's sidebar setup after adding items
    // Ensure setup_sidebar_menu is defined (likely in xenon-custom.js)
    if (typeof setup_sidebar_menu === 'function') {
        setup_sidebar_menu();
    } else {
        console.warn('setup_sidebar_menu function not found. Sidebar might not initialize correctly.');
    }
}

function generateMainContent(data) {
    const contentWrapper = $('#main-content-wrapper');
     if (!contentWrapper.length) return; // Exit if element not found
    let contentHtml = '';

    data.forEach(category => {
        // --- Generate Category/SubCategory Blocks ---
        if (category.children && category.children.length > 0) {
            // Category with children - Iterate through children
            category.children.forEach(child => {
                 // Ensure child has a name and web array before generating section
                 if (child.name && child.web) {
                    contentHtml += generateCategorySection(child.name, child.icon || category.icon, child.web); // Use child icon or parent icon
                } else {
                     console.warn("Skipping child category due to missing name or web array:", child);
                 }
            });
        } else if (category.web && category.web.length > 0) {
            // Top-level category with websites
             if (category.name) { // Ensure top-level category has a name
                contentHtml += generateCategorySection(category.name, category.icon, category.web);
             } else {
                 console.warn("Skipping top-level category due to missing name:", category);
             }
        }
    });

    contentWrapper.html(contentHtml);
}

function generateCategorySection(categoryName, categoryIcon, websites) {
    // Basic check for required data
     if (!categoryName || !categoryIcon || !websites || websites.length === 0) {
         console.warn(`Skipping section generation for "${categoryName}" due to missing data.`);
        return '';
    }

    let sectionHtml = `<h4 class="text-gray"><i class="${categoryIcon}" style="margin-right: 7px;" id="${categoryName}"></i>${categoryName}</h4>`;
    sectionHtml += '<div class="row">'; // Start the first row

    websites.forEach((site, index) => {
         // Ensure site has url and logo before adding
         if (!site.url || !site.logo) {
             console.warn(`Skipping site in "${categoryName}" due to missing URL or logo:`, site);
             return; // Skip this site
         }
        // Close and start a new row every 4 items (except the first)
        if (index > 0 && index % 4 === 0) {
            sectionHtml += '</div><div class="row">';
        }

        // Use default title/desc if missing
         const siteTitle = site.title || 'Untitled';
         const siteDesc = site.desc || 'No description available.';
         const siteLogo = `../${site.logo}`; // Assuming logo path is relative to root

        sectionHtml += `
            <div class="col-sm-3">
                <div class="xe-widget xe-conversations box2 label-info" onclick="window.open('${site.url}', '_blank')" data-toggle="tooltip" data-placement="bottom" title="${site.url}">
                    <div class="xe-comment-entry">
                        <a class="xe-user-img">
                            <!-- Use data-src for lozad -->
                            <img data-src="${siteLogo}" class="lozad img-circle" width="40" alt="${siteTitle}">
                        </a>
                        <div class="xe-comment">
                            <a href="#" class="xe-user-name overflowClip_1">
                                <strong>${siteTitle}</strong>
                            </a>
                            <p class="overflowClip_2">${siteDesc}</p>
                        </div>
                    </div>
                </div>
            </div>`;
    });

    sectionHtml += '</div><br />'; // Close the last row for this section and add break
    return sectionHtml;
}


// --- Main Function to Load and Render ---
function loadAndRenderContent() {
    // Ensure lozad is available
    if (typeof lozad !== 'function') {
        console.error('Lozad library is not loaded.');
        $('#main-content-wrapper').html('<p class="text-danger">核心库加载失败，页面无法渲染。</p>');
        return;
    }
    const observer = lozad(); // Initialize Lozad

    fetch('../data.json') // Adjust path if necessary
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
             // Check content type to ensure it's JSON before parsing
             const contentType = response.headers.get("content-type");
             if (!contentType || !contentType.includes("application/json")) {
                 throw new TypeError("Oops, we haven't got JSON! Content-Type: " + contentType);
             }
            return response.json();
        })
        .then(data => {
            // Validate data format (basic check)
            if (!Array.isArray(data)) {
                 throw new Error('Invalid data format: Expected an array.');
             }

            generateSidebarMenu(data);
            generateMainContent(data);

            // Observe images after content is generated
            observer.observe();

            // Reinitialize tooltips if using Bootstrap tooltips
            // Note: Make sure Bootstrap JS is loaded before this script
            if ($.fn.tooltip) {
                 $('[data-toggle="tooltip"]').tooltip();
             }

            // Trigger Xenon's custom JS refresh if available
            if (window.xenonCustom && typeof window.xenonCustom.refresh === 'function') {
                window.xenonCustom.refresh();
            }
        })
        .catch(error => {
            console.error('Error loading or processing data:', error);
            $('#main-menu').html('<li><a href="#"><i class="linecons-alert"></i><span class="title">加载菜单失败</span></a></li>');
            // Display more specific error if possible
            let errorMsg = '加载内容失败，请检查 data.json 文件是否存在或格式是否正确。';
             if (error instanceof SyntaxError) {
                 errorMsg += ' (JSON 格式错误)';
             } else if (error instanceof TypeError) {
                 errorMsg += ` (${error.message})`; // e.g., Not JSON
             } else if (error.message.includes('HTTP error')) {
                 errorMsg = `加载内容失败：无法获取 data.json (${error.message})。请检查文件路径和网络连接。`;
             }
            $('#main-content-wrapper').html(`<p class="text-danger">${errorMsg}</p>`);
            // Also log the detailed error to console for debugging
             console.error("Detailed loading error:", error);
        });
} 