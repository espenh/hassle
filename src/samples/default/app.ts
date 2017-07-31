const container = document.querySelector("div.container") as HTMLDivElement;

document.querySelector("button").addEventListener("click", () => {
    const newDiv = document.createElement("div");
    newDiv.classList.add("box");
    newDiv.style.backgroundColor = getRandomColor();

    container.appendChild(newDiv);
});

const getRandomColor = () => {
    const getRandomInteger = () => Math.round(Math.random() * 255);
    return `rgb(${getRandomInteger()},${getRandomInteger()},${getRandomInteger()})`;
};
