const introScreen = document.getElementById("intro-screen");
const introEnterButton = document.getElementById("intro-enter");

function hideIntroScreen() {
  introScreen.classList.add("intro-hide");

  setTimeout(() => {
    introScreen.style.display = "none";
  }, 1100);
}

introEnterButton.addEventListener("click", hideIntroScreen);