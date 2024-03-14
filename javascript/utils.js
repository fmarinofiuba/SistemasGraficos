function scriptToText() {
    let txt = document.getElementById('code').textContent;

    let elem = document.createElement('pre');
    elem.textContent = txt;

    elem.classList.add('codeText');
    document.body.appendChild(elem);
}

scriptToText();
