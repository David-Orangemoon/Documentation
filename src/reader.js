if (window.marked) {
    const searchP = new URLSearchParams(document.location.search);
    const page = searchP.get("page") || "index";
    const readingArea = document.getElementById("main");

    docIdentifier += "-" + page;
    
    fetch(`pages/${page}.md`).then(result => result.text()).then(text => {
        readingArea.innerHTML = marked.parse(text);

        if (searchP.has("cite")) {
            const found = Array.from(readingArea.children)[searchP.get("cite")];
            window.scroll(0, found.getBoundingClientRect().top);
        }
    });

    document.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLHeadingElement || target instanceof HTMLParagraphElement) {
            const found = Array.from(readingArea.children).indexOf(target);
            searchP.set("cite", found);
            window.navigator.clipboard.writeText(`${document.location.origin}${document.location.pathname}?${searchP.toString()}`);
        }
    });
}

const download = (data, filename, type) => {
    var file = new Blob([data], { type: type });

    // Create link and add url aswell as filename to it.
    var link = document.createElement("a");
    var url = URL.createObjectURL(file);
    link.href = url;
    link.download = filename;

    //Click it and remove data.
    link.click();
    window.URL.revokeObjectURL(url);
};

const blobToDataURI = (inBlob) => {
    return new Promise((resolve) => {
        //Create filereader and then read as dataURL
        const fileReader = new FileReader();
        fileReader.onload = () => {
            resolve(fileReader.result);
        }
        
        fileReader.readAsDataURL(inBlob);
    })
}

document.getElementById("downloadPage").onclick = async () => {
    const domParser = new DOMParser();
    const parsed = domParser.parseFromString(document.documentElement.outerHTML, "text/html");

    const sanitize = async (parent) => {
        for (let childID=0; childID<parent.children.length; childID++) {
            const child = parent.children[childID];

            //Remove children without download
            if (child.getAttribute("excludeFromDownload")) {
                parent.removeChild(child);
                childID--;
                continue;
            }

            //Handle sources
            let potentialSrc = child.getAttribute("src");
            if (potentialSrc) {
                //Hacky yes. works. yes
                const outputURI = await blobToDataURI(await fetch(potentialSrc).then(result => result.blob()));
                child.setAttribute("src", outputURI);
            }

            //Handle hrefs
            potentialSrc = child.getAttribute("href");
            if (potentialSrc && !(child.getAttribute("excludeFetch") || child instanceof HTMLAnchorElement)) {
                //Hacky yes. works. yes
                const outputURI = await blobToDataURI(await fetch(potentialSrc).then(result => result.blob()));
                child.setAttribute("href", outputURI);
            }

            await sanitize(child);
        }
    }

    await sanitize(parsed.documentElement);

    console.log(parsed);
    download(parsed.documentElement.outerHTML, docIdentifier + ".html", "text/html");
}