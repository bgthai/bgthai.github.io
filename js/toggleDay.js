function toggleDay() {
    var element = document.body;
    element.classList.toggle("dark-mode");
    var icon = document.getElementById("day");
    icon.classList.toggle("fa-sun-o");
    icon.classList.toggle("fa-moon-o");
    var left= document.getElementById("left");
    var right= document.getElementById("right");
    left.classList.toggle("dark-btn");
    right.classList.toggle("dark-btn");
}
