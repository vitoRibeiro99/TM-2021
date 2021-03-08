// Your JS Script here
window.onload = function (){
    const tdElement = document.getElementsByTagName("td")
    for(let td of tdElement){
        td.onclick = function (element){
            const result = prompt("Novo Valor?")
            element.target.style.backgroundColor = "green"
            element.target.innerText = result
        }
    }
}

readAttributes=() => {
    const element = document.getElementsByTagName("a")[0]
    console.log(element.attributes);

    const list = document.getElementsByTagName("ul")[0]
    list.innerHTML = "";
    for (let att of element.attributes) {
        const liElement = document.createElement("li");
        liElement.innerText = `${att.name} : ${att.value}`;
        list.appendChild(liElement);
    }
}
changeColorToRed = () => {
    const titles = document.getElementsByClassName("titulo")
    for(let title of titles){
        title.style.color = "red";
    }
}






