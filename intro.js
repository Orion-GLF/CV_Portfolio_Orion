const introScreen = document.getElementById("intro-screen");
const introEnterButton = document.getElementById("intro-enter");

let introClosed = false;

function hideIntroScreen() {
  if (introClosed) return;
  introClosed = true;

  introScreen.classList.add("intro-hide");

  setTimeout(() => {
    introScreen.style.display = "none";
  }, 1100);
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    hideIntroScreen();
  }
});

introEnterButton.addEventListener("click", hideIntroScreen);