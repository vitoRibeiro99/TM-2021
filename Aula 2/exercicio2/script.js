// Your JS Script here

let numbersArray = []

function addNumber() {
    const number = document.getElementById("numberInput").value
    if (number)
        numbersArray.push(number)
        document.getElementById("numbersAdded").innerHTML = numbersArray.join(', ')
}

function calculate() {
    if (numbersArray.length >= 5) {

        const maxNumber = numbersArray.reduce(function (a, b) {
            return Math.max(a, b)
        });

        /* arrow function*/
        const maxNumberv2 = numbersArray.reduce((a, b) => Math.max(a, b));

        document.getElementById("maxNumberView").innerText =
            maxNumber + "é igual" + maxNumberv2
    }
}