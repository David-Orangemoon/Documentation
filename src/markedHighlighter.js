marked.use({
    name: "heading",
    renderer: {
        code: ({ lang, text }) => {
            const codeElement = document.createElement("code");
            
            codeElement.innerHTML = text;
            CodeMirror.colorize([codeElement], lang);
            codeElement.innerHTML = codeElement.innerHTML.replace("\n", "<br>");

            return codeElement.outerHTML;
        },
    },
});